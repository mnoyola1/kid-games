// POST /api/cipher-heist/start-session
// Body: { code }
// Host-only: validates all players have set vault codes, transitions session
// to 'playing', deals an initial regular question to every player, sets the
// timer.

import {
  sendJson, sendError, readJsonBody, methodGuard,
  getAdmin, loadSession, loadPlayers, pickQuestion, logEvent,
} from './_helpers.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  try {
    const body = await readJsonBody(req);
    const code = (body.code || '').toUpperCase().trim();
    if (!code) return sendError(res, 400, 'code required');

    const admin = getAdmin();
    const session = await loadSession(admin, code);
    if (!session) return sendError(res, 404, 'Room not found');
    if (session.status === 'playing') return sendError(res, 409, 'Already playing');
    if (session.status === 'ended') return sendError(res, 410, 'Room closed');

    const players = await loadPlayers(admin, session.id);
    if (players.length < 2) return sendError(res, 400, 'Need at least 2 players');
    if (!players.every(p => Array.isArray(p.vault_code) && p.vault_code.length === 3)) {
      return sendError(res, 400, 'All players must lock a vault code first');
    }

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + session.duration_sec * 1000);

    // Deal initial regular question to each player
    for (const p of players) {
      const q = pickQuestion(session.pack_id, session.grade_tier, 'regular');
      const aq = { ...q, type: 'regular', startedAt: startedAt.toISOString() };
      await admin
        .from('cipher_heist_players')
        .update({
          active_question: aq,
          pending_action: null,
          pending_action_type: null,
          bonus_gate_used: true,
        })
        .eq('session_id', session.id)
        .eq('profile_id', p.profile_id);
    }

    const { error } = await admin
      .from('cipher_heist_sessions')
      .update({
        status: 'playing',
        started_at: startedAt.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .eq('id', session.id);
    if (error) return sendError(res, 500, 'Could not start', { db: error.message });

    await logEvent(admin, session.id, 'game_start', session.host_id, null, {
      players: players.length,
      durationSec: session.duration_sec,
    });

    sendJson(res, 200, { ok: true, startedAt, endsAt });
  } catch (err) {
    sendError(res, 500, err.message || 'start-session failed');
  }
}
