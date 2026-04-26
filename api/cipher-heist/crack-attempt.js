// POST /api/cipher-heist/crack-attempt
// Body: { code, attackerId, targetId, guess: number[] }
//
// Server-authoritative crack:
//   1. Verifies the attacker has consumed a bonus correct (bonus_gate_used=false).
//   2. Enforces 3 attempts per attacker→target.
//   3. Enforces 15s rate limit on attacker.
//   4. Compares guess to target.vault_code, emits Wordle feedback.
//   5. On exact match: steals 30% of target's bits; awards crack reward.
//   6. On wrong + target has firewall: consumes one firewall (defender wins).
//   7. Logs full attempt to crack_history; emits public event.

import {
  sendJson, sendError, readJsonBody, methodGuard,
  getAdmin, loadSession, validateVaultCode, crackFeedback, logEvent, SERVER_CONFIG,
} from './_helpers.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  try {
    const body = await readJsonBody(req);
    const code = (body.code || '').toUpperCase().trim();
    const attackerId = body.attackerId;
    const targetId = body.targetId;
    const guess = body.guess;
    if (!code || !attackerId || !targetId) return sendError(res, 400, 'code, attackerId, targetId required');
    if (!validateVaultCode(guess)) return sendError(res, 400, 'guess must be 3 digits 1-9 with no repeats');
    if (attackerId === targetId) return sendError(res, 400, 'cannot attack yourself');

    const admin = getAdmin();
    const session = await loadSession(admin, code);
    if (!session) return sendError(res, 404, 'Room not found');
    if (session.status !== 'playing') return sendError(res, 409, 'Round not active');

    // Load both players in one query
    const { data: rows, error: rErr } = await admin
      .from('cipher_heist_players')
      .select('*')
      .eq('session_id', session.id)
      .in('profile_id', [attackerId, targetId]);
    if (rErr || !rows || rows.length !== 2) return sendError(res, 404, 'Players not found');
    const attacker = rows.find(r => r.profile_id === attackerId);
    const target   = rows.find(r => r.profile_id === targetId);
    if (!attacker || !target) return sendError(res, 404, 'Players not found');

    if (attacker.bonus_gate_used) {
      return sendError(res, 403, 'Answer the bonus question correctly before cracking');
    }
    if (attacker.last_crack_at) {
      const sinceMs = Date.now() - new Date(attacker.last_crack_at).getTime();
      if (sinceMs < SERVER_CONFIG.bits.crackRateLimitMs) {
        return sendError(res, 429, 'Crack rate limit', { retryMs: SERVER_CONFIG.bits.crackRateLimitMs - sinceMs });
      }
    }

    // Count prior attempts for this pair
    const { data: history } = await admin
      .from('cipher_heist_crack_history')
      .select('id')
      .eq('session_id', session.id)
      .eq('attacker_id', attackerId)
      .eq('target_id', targetId);
    if ((history?.length || 0) >= SERVER_CONFIG.crack.maxAttemptsPerSession) {
      return sendError(res, 403, 'No attempts left on this target');
    }

    const targetCode = target.vault_code;
    if (!Array.isArray(targetCode) || targetCode.length !== 3) {
      return sendError(res, 409, 'Target has no vault code set');
    }

    const feedback = crackFeedback(guess, targetCode);
    const exact = feedback.every(f => f === 'exact');
    const now = new Date().toISOString();

    // Persist history row
    await admin.from('cipher_heist_crack_history').insert({
      session_id: session.id,
      attacker_id: attackerId,
      target_id: targetId,
      guess,
      feedback,
    });

    let stolen = 0;
    let firewallConsumed = false;

    if (exact) {
      // Crack success — defender's firewall is bypassed (per spec firewall only stops failed attempts? we treat as steal succeeds always when guess exact).
      stolen = Math.ceil((target.bits || 0) * SERVER_CONFIG.bits.stealRatio);
      const attackerBits = (attacker.bits || 0) + stolen;
      const targetBits = Math.max(0, (target.bits || 0) - stolen);
      await admin
        .from('cipher_heist_players')
        .update({
          bits: attackerBits,
          stats: {
            ...(attacker.stats || {}),
            cracks_success: ((attacker.stats || {}).cracks_success || 0) + 1,
            bits_stolen: ((attacker.stats || {}).bits_stolen || 0) + stolen,
          },
          last_crack_at: now,
          bonus_gate_used: true, // consume gate
        })
        .eq('session_id', session.id)
        .eq('profile_id', attackerId);
      await admin
        .from('cipher_heist_players')
        .update({
          bits: targetBits,
          stats: {
            ...(target.stats || {}),
            times_cracked: ((target.stats || {}).times_cracked || 0) + 1,
          },
        })
        .eq('session_id', session.id)
        .eq('profile_id', targetId);
    } else {
      // Wrong — if target has firewall, consume one to defend
      if ((target.firewalls || 0) > 0) {
        firewallConsumed = true;
        await admin
          .from('cipher_heist_players')
          .update({
            firewalls: target.firewalls - 1,
            stats: {
              ...(target.stats || {}),
              firewalls_used: ((target.stats || {}).firewalls_used || 0) + 1,
            },
          })
          .eq('session_id', session.id)
          .eq('profile_id', targetId);
      }
      await admin
        .from('cipher_heist_players')
        .update({
          last_crack_at: now,
          bonus_gate_used: true, // consume gate
        })
        .eq('session_id', session.id)
        .eq('profile_id', attackerId);
    }

    await logEvent(admin, session.id, exact ? 'crack_success' : 'crack_fail', attackerId, targetId, {
      feedback, stolen, firewallConsumed,
      // Never include the actual code or guess in public events
    });

    sendJson(res, 200, { feedback, exact, stolen, firewallConsumed });
  } catch (err) {
    sendError(res, 500, err.message || 'crack-attempt failed');
  }
}
