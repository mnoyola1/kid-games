// POST /api/cipher-heist/create-session
// Body: { host: { id, name, avatar }, packId, gradeTier, durationSec }
// Returns: { code, session, playerId }

import {
  applyCors, sendJson, sendError, readJsonBody, methodGuard,
  getAdmin, generateRoomCode, projectSession, logEvent,
} from './_helpers.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  try {
    const body = await readJsonBody(req);
    const host = body.host;
    if (!host?.id || !host?.name) return sendError(res, 400, 'host { id, name } is required');

    const packId = body.packId || 'math';
    const gradeTier = body.gradeTier || 'tier3';
    const durationSec = Math.min(900, Math.max(60, parseInt(body.durationSec, 10) || 300));

    const admin = getAdmin();

    // Generate a unique code (try up to 5 times)
    let code = null;
    for (let i = 0; i < 5; i++) {
      const candidate = generateRoomCode();
      const { data: existing } = await admin
        .from('cipher_heist_sessions')
        .select('id')
        .eq('code', candidate)
        .maybeSingle();
      if (!existing) { code = candidate; break; }
    }
    if (!code) return sendError(res, 500, 'Could not allocate a unique room code, try again.');

    const { data: session, error } = await admin
      .from('cipher_heist_sessions')
      .insert({
        code,
        host_id: host.id,
        status: 'lobby',
        pack_id: packId,
        grade_tier: gradeTier,
        duration_sec: durationSec,
      })
      .select('*')
      .single();
    if (error) return sendError(res, 500, 'Could not create session', { db: error.message });

    // Add the host as the first player
    const { error: pErr } = await admin.from('cipher_heist_players').insert({
      session_id: session.id,
      profile_id: host.id,
      name: host.name,
      avatar: host.avatar || '🧑',
      is_bot: false,
      stats: {},
    });
    if (pErr) return sendError(res, 500, 'Could not add host', { db: pErr.message });

    await logEvent(admin, session.id, 'session_created', host.id, null, { packId, gradeTier });

    sendJson(res, 200, {
      code,
      session: projectSession(session),
      playerId: host.id,
      isHost: true,
    });
  } catch (err) {
    sendError(res, 500, err.message || 'create-session failed');
  }
}
