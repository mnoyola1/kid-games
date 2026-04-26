// POST /api/cipher-heist/end-session
// Body: { code }
// Tally winners (highest bits), compute LuminaCore reward payloads per player,
// and mark session ended. Client commits the rewards locally for non-bot
// players.

import {
  sendJson, sendError, readJsonBody, methodGuard,
  getAdmin, loadSession, loadPlayers, logEvent,
} from './_helpers.js';

const REWARDS = {
  participation: { xp: 15, coins: 5 },
  perCorrect: { xp: 3, coins: 1 },
  perCrack: { xp: 10, coins: 5 },
  firewallDefend: { xp: 8, coins: 3 },
  place: {
    1: { xp: 25, coins: 15 },
    2: { xp: 15, coins: 10 },
    3: { xp: 10, coins: 5 },
  },
};

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  try {
    const body = await readJsonBody(req);
    const code = (body.code || '').toUpperCase().trim();
    if (!code) return sendError(res, 400, 'code required');

    const admin = getAdmin();
    const session = await loadSession(admin, code);
    if (!session) return sendError(res, 404, 'Room not found');
    if (session.status === 'ended') {
      // idempotent
      const players = await loadPlayers(admin, session.id);
      return sendJson(res, 200, { rewards: computeRewards(players), winnerId: session.winner_id });
    }

    const players = await loadPlayers(admin, session.id);
    const sorted = [...players].sort((a, b) => (b.bits || 0) - (a.bits || 0));
    const winner = sorted[0] || null;
    const rewards = computeRewards(players);

    await admin
      .from('cipher_heist_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString(), winner_id: winner?.profile_id || null })
      .eq('id', session.id);

    await logEvent(admin, session.id, 'game_end', null, winner?.profile_id || null, {
      finalBits: sorted.map(p => ({ id: p.profile_id, bits: p.bits })),
    });

    sendJson(res, 200, { rewards, winnerId: winner?.profile_id || null });
  } catch (err) {
    sendError(res, 500, err.message || 'end-session failed');
  }
}

function computeRewards(players) {
  const sorted = [...players].sort((a, b) => (b.bits || 0) - (a.bits || 0));
  return sorted.map((p, idx) => {
    const place = idx + 1;
    const stats = p.stats || {};
    const placeReward = REWARDS.place[place] || { xp: 0, coins: 0 };
    let xp = REWARDS.participation.xp + placeReward.xp;
    let coins = REWARDS.participation.coins + placeReward.coins;
    xp += (stats.questions_correct || 0) * REWARDS.perCorrect.xp;
    coins += (stats.questions_correct || 0) * REWARDS.perCorrect.coins;
    xp += (stats.cracks_success || 0) * REWARDS.perCrack.xp;
    coins += (stats.cracks_success || 0) * REWARDS.perCrack.coins;
    xp += (stats.firewalls_used || 0) * REWARDS.firewallDefend.xp;
    coins += (stats.firewalls_used || 0) * REWARDS.firewallDefend.coins;
    return {
      profile_id: p.profile_id,
      name: p.name,
      isBot: p.is_bot,
      place,
      bits: p.bits || 0,
      stats,
      xp,
      coins,
      rewardPoints: Math.floor(xp / 20),
    };
  });
}
