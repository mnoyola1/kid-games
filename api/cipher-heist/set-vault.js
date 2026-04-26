// POST /api/cipher-heist/set-vault
// Body: { code, playerId, vaultCode: number[] }
// Stores the vault code server-side. Never echoes it back.

import {
  sendJson, sendError, readJsonBody, methodGuard,
  getAdmin, loadSession, validateVaultCode, logEvent,
} from './_helpers.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  try {
    const body = await readJsonBody(req);
    const code = (body.code || '').toUpperCase().trim();
    const playerId = body.playerId;
    const vaultCode = body.vaultCode;
    if (!code || !playerId) return sendError(res, 400, 'code and playerId required');
    if (!validateVaultCode(vaultCode)) return sendError(res, 400, 'Invalid vault code');

    const admin = getAdmin();
    const session = await loadSession(admin, code);
    if (!session) return sendError(res, 404, 'Room not found');
    if (session.status === 'ended') return sendError(res, 410, 'Room closed');

    const { error } = await admin
      .from('cipher_heist_players')
      .update({ vault_code: vaultCode })
      .eq('session_id', session.id)
      .eq('profile_id', playerId);
    if (error) return sendError(res, 500, 'Could not set vault', { db: error.message });

    await logEvent(admin, session.id, 'vault_set', playerId);
    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendError(res, 500, err.message || 'set-vault failed');
  }
}
