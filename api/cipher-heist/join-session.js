// POST /api/cipher-heist/join-session
// Body: { code: string (4 letters), player: { id, name, avatar }, vaultCode?: number[] }
// Returns: { session, players, playerId, isHost }
//
// Stores vaultCode in DB only — never echoes it back. Setting/changing the
// vault code is also done here (idempotent for the same player).

import {
  applyCors, sendJson, sendError, readJsonBody, methodGuard,
  getAdmin, loadSession, loadPlayers, projectSession, projectPlayer,
  validateVaultCode, logEvent,
} from './_helpers.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  try {
    const body = await readJsonBody(req);
    const code = (body.code || '').toUpperCase().trim();
    const player = body.player;
    if (!code || code.length !== 4) return sendError(res, 400, 'code must be 4 letters');
    if (!player?.id || !player?.name) return sendError(res, 400, 'player { id, name } is required');

    const admin = getAdmin();
    const session = await loadSession(admin, code);
    if (!session) return sendError(res, 404, 'Room not found');
    if (session.status === 'ended') return sendError(res, 410, 'Room is closed');
    if (session.status === 'playing') return sendError(res, 423, 'Round in progress — try again later');

    // Upsert player
    const playerRow = {
      session_id: session.id,
      profile_id: player.id,
      name: player.name,
      avatar: player.avatar || '👤',
      is_bot: false,
      online: true,
    };
    if (Array.isArray(body.vaultCode) && body.vaultCode.length) {
      if (!validateVaultCode(body.vaultCode)) {
        return sendError(res, 400, 'Invalid vault code (3 digits 1-9, no repeats)');
      }
      playerRow.vault_code = body.vaultCode;
    }

    const { error: upsertErr } = await admin
      .from('cipher_heist_players')
      .upsert(playerRow, { onConflict: 'session_id,profile_id' });
    if (upsertErr) return sendError(res, 500, 'Could not join', { db: upsertErr.message });

    await logEvent(admin, session.id, 'player_joined', player.id, null, { name: player.name });

    const players = await loadPlayers(admin, session.id);
    sendJson(res, 200, {
      session: projectSession(session),
      players: players.map(p => projectPlayer(p, player.id)),
      playerId: player.id,
      isHost: session.host_id === player.id,
    });
  } catch (err) {
    sendError(res, 500, err.message || 'join-session failed');
  }
}
