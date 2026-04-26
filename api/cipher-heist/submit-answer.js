// POST /api/cipher-heist/submit-answer
// Body: { code, playerId, choiceIdx }
// Server validates correctness + speed, awards bits for fast/medium answers,
// unlocks one heist action on a correct *regular* answer, opens the bonus gate
// on a correct *bonus* answer, and (if bonus) sets pending_action='crack-pending'.

import {
  sendJson, sendError, readJsonBody, methodGuard,
  getAdmin, loadSession, scoreSpeed, pickQuestion, logEvent, SERVER_CONFIG,
} from './_helpers.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  try {
    const body = await readJsonBody(req);
    const code = (body.code || '').toUpperCase().trim();
    const playerId = body.playerId;
    const choiceIdx = parseInt(body.choiceIdx, 10);
    if (!code || !playerId) return sendError(res, 400, 'code and playerId required');
    if (Number.isNaN(choiceIdx)) return sendError(res, 400, 'choiceIdx required');

    const admin = getAdmin();
    const session = await loadSession(admin, code);
    if (!session) return sendError(res, 404, 'Room not found');
    if (session.status !== 'playing') return sendError(res, 409, 'Round is not active');

    const { data: player, error: pErr } = await admin
      .from('cipher_heist_players')
      .select('*')
      .eq('session_id', session.id)
      .eq('profile_id', playerId)
      .single();
    if (pErr || !player) return sendError(res, 404, 'Player not in session');

    const aq = player.active_question;
    if (!aq) return sendError(res, 409, 'No active question for this player');
    const isBonus = aq.type === 'bonus';

    const startedAt = new Date(aq.startedAt).getTime();
    const elapsedMs = Date.now() - startedAt;
    const timeoutMs = isBonus ? SERVER_CONFIG.bits.bonusTimeoutMs : SERVER_CONFIG.bits.answerTimeoutMs;
    const correct = choiceIdx === aq.a;
    const onTime = elapsedMs < timeoutMs;
    const success = correct && onTime;

    // Update player atomically based on outcome
    const update = {
      active_question: null,
      stats: {
        ...(player.stats || {}),
        questions_seen: ((player.stats || {}).questions_seen || 0) + 1,
        questions_correct: ((player.stats || {}).questions_correct || 0) + (success ? 1 : 0),
      },
    };
    let bitsDelta = 0;
    let unlockedAction = false;
    let crackPending = false;

    if (success) {
      const speed = scoreSpeed(elapsedMs);
      bitsDelta = speed.bits;
      update.bits = (player.bits || 0) + bitsDelta;
      update.last_correct_at = new Date().toISOString();
      if (speed.tier === 'fast') {
        update.stats.fast_correct = (update.stats.fast_correct || 0) + 1;
      }

      if (isBonus) {
        // Bonus correct → open bonus gate, allow crack attempt
        update.bonus_gate_used = false;
        update.bonus_gate_at = new Date().toISOString();
        update.pending_action = 'crack-pending';
        crackPending = true;
      } else {
        // Regular correct → unlock action picker
        update.pending_action = 'unlocked';
        unlockedAction = true;
      }
    } else {
      // Incorrect or timed out — reissue another regular question (keep loop going)
      const next = pickQuestion(session.pack_id, session.grade_tier, 'regular');
      update.active_question = { ...next, type: 'regular', startedAt: new Date().toISOString() };
      update.pending_action = null;
    }

    const { error } = await admin
      .from('cipher_heist_players')
      .update(update)
      .eq('session_id', session.id)
      .eq('profile_id', playerId);
    if (error) return sendError(res, 500, 'Could not submit answer', { db: error.message });

    await logEvent(admin, session.id, success ? 'answer_correct' : 'answer_wrong', playerId, null, {
      bonus: isBonus, elapsedMs, bitsDelta,
    });

    sendJson(res, 200, {
      success,
      correctIdx: aq.a,
      bitsDelta,
      unlockedAction,
      crackPending,
      isBonus,
    });
  } catch (err) {
    sendError(res, 500, err.message || 'submit-answer failed');
  }
}
