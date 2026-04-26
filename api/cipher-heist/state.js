// POST /api/cipher-heist/state
// Body: { code, viewerId? }
// Returns the public-projected session + players + recent events for clients
// that connect mid-round or want to refresh after reconnect.

import {
  sendJson, sendError, readJsonBody, methodGuard,
  getAdmin, loadSession, loadPlayers, projectSession, projectPlayer, loadCrackHistory,
} from './_helpers.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['POST', 'GET'])) return;
  try {
    let code = '';
    let viewerId = null;
    if (req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      code = (url.searchParams.get('code') || '').toUpperCase().trim();
      viewerId = url.searchParams.get('viewerId') || null;
    } else {
      const body = await readJsonBody(req);
      code = (body.code || '').toUpperCase().trim();
      viewerId = body.viewerId || null;
    }
    if (!code) return sendError(res, 400, 'code required');

    const admin = getAdmin();
    const session = await loadSession(admin, code);
    if (!session) return sendError(res, 404, 'Room not found');

    const players = await loadPlayers(admin, session.id);
    const history = await loadCrackHistory(admin, session.id);

    sendJson(res, 200, {
      session: projectSession(session),
      players: players.map(p => projectPlayer(p, viewerId)),
      crackHistory: history.map(h => ({
        id: h.id,
        attacker_id: h.attacker_id,
        target_id: h.target_id,
        feedback: h.feedback,
        created_at: h.created_at,
      })),
    });
  } catch (err) {
    sendError(res, 500, err.message || 'state failed');
  }
}
