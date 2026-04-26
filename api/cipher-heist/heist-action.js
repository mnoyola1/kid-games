// POST /api/cipher-heist/heist-action
// Body: { code, playerId, action: 'firewall'|'surge'|'scan'|'crack', targetId? }
// Consumes pending_action='unlocked' atomically. For 'crack' actions, deals a
// bonus question — the actual crack guess goes through /crack-attempt after
// the bonus is correct.

import {
  sendJson, sendError, readJsonBody, methodGuard,
  getAdmin, loadSession, loadPlayers, pickQuestion, logEvent, SERVER_CONFIG,
} from './_helpers.js';

const VALID_ACTIONS = new Set(['firewall', 'surge', 'scan', 'crack']);

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  try {
    const body = await readJsonBody(req);
    const code = (body.code || '').toUpperCase().trim();
    const playerId = body.playerId;
    const action = body.action;
    const targetId = body.targetId || null;
    if (!code || !playerId || !action) return sendError(res, 400, 'code, playerId, action required');
    if (!VALID_ACTIONS.has(action)) return sendError(res, 400, 'invalid action');

    const admin = getAdmin();
    const session = await loadSession(admin, code);
    if (!session) return sendError(res, 404, 'Room not found');
    if (session.status !== 'playing') return sendError(res, 409, 'Round not active');

    const { data: player, error: pErr } = await admin
      .from('cipher_heist_players')
      .select('*')
      .eq('session_id', session.id)
      .eq('profile_id', playerId)
      .single();
    if (pErr || !player) return sendError(res, 404, 'Player not in session');
    if (player.pending_action !== 'unlocked') {
      return sendError(res, 409, 'No unlocked action — answer a regular question correctly first');
    }

    const update = { pending_action: null };
    let detail = {};

    if (action === 'firewall') {
      update.firewalls = (player.firewalls || 0) + 1;
      update.stats = { ...(player.stats || {}), firewalls_set: ((player.stats || {}).firewalls_set || 0) + 1 };
      // Re-arm with a regular question
      const q = pickQuestion(session.pack_id, session.grade_tier, 'regular');
      update.active_question = { ...q, type: 'regular', startedAt: new Date().toISOString() };
    } else if (action === 'surge') {
      update.bits = (player.bits || 0) + SERVER_CONFIG.bits.surge;
      detail.bitsDelta = SERVER_CONFIG.bits.surge;
      const q = pickQuestion(session.pack_id, session.grade_tier, 'regular');
      update.active_question = { ...q, type: 'regular', startedAt: new Date().toISOString() };
    } else if (action === 'scan') {
      if (!targetId) return sendError(res, 400, 'targetId required for scan');
      const players = await loadPlayers(admin, session.id);
      const target = players.find(p => p.profile_id === targetId);
      if (!target) return sendError(res, 404, 'target not found');
      const code3 = target.vault_code || [];
      const idx = Math.floor(Math.random() * code3.length);
      detail.scannedDigit = code3[idx];
      detail.targetId = targetId;
      const q = pickQuestion(session.pack_id, session.grade_tier, 'regular');
      update.active_question = { ...q, type: 'regular', startedAt: new Date().toISOString() };
    } else if (action === 'crack') {
      if (!targetId) return sendError(res, 400, 'targetId required for crack');
      // Rate limit: 1 crack/15s
      if (player.last_crack_at) {
        const sinceMs = Date.now() - new Date(player.last_crack_at).getTime();
        if (sinceMs < SERVER_CONFIG.bits.crackRateLimitMs) {
          return sendError(res, 429, 'Slow down — crack rate limit', { retryMs: SERVER_CONFIG.bits.crackRateLimitMs - sinceMs });
        }
      }
      // Deal a bonus question; crack-attempt will be allowed after correct answer.
      const q = pickQuestion(session.pack_id, session.grade_tier, 'bonus');
      update.active_question = { ...q, type: 'bonus', targetId, startedAt: new Date().toISOString() };
      update.bonus_gate_used = true; // not yet earned
      update.pending_action_type = 'crack-pending';
      detail.targetId = targetId;
      detail.dealtBonus = true;
    }

    const { error } = await admin
      .from('cipher_heist_players')
      .update(update)
      .eq('session_id', session.id)
      .eq('profile_id', playerId);
    if (error) return sendError(res, 500, 'Could not apply action', { db: error.message });

    await logEvent(admin, session.id, `action_${action}`, playerId, targetId, {
      // Never include scanned digit or other secret info in public events
      action,
    });

    sendJson(res, 200, { ok: true, action, ...detail });
  } catch (err) {
    sendError(res, 500, err.message || 'heist-action failed');
  }
}
