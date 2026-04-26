/**
 * Cipher Heist - Game Engine (pure state machine)
 *
 * Pure, side-effect-free state-transition functions for both Solo and Hot-Seat modes.
 * The Online mode mirrors this same logic on the server (api/cipher-heist/*) so the
 * client never needs to trust local outcomes.
 *
 * Conventions:
 *  - All functions take a state object and return a NEW state object (or { state, ...result }).
 *  - State shape is described in chCreateSession() below.
 *  - Question shape comes from CIPHER_CONFIG.PACKS (game-config.js).
 *  - "now" is always passed in (Date.now() at the call site) — never read inside the engine.
 */

(function (global) {
  const C = global.CIPHER_CONFIG;
  if (!C) {
    console.error('Cipher Heist engine: CIPHER_CONFIG missing — load order is wrong');
    return;
  }

  // --------------------------------------------------------
  // Helpers
  // --------------------------------------------------------

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function logEvent(state, kind, payload = {}) {
    state.events.push({
      id: state.events.length + 1,
      kind,
      at: state.now,
      ...payload,
    });
    return state;
  }

  function setNow(state, now) {
    state.now = now;
    return state;
  }

  // --------------------------------------------------------
  // Session lifecycle
  // --------------------------------------------------------

  function chCreateSession(config) {
    const cfg = {
      mode: config.mode || 'solo', // 'solo' | 'hotseat' | 'online'
      packId: config.packId || 'math',
      gradeTier: config.gradeTier || 'tier3', // 'tier3' or 'tier5'
      durationSec: config.durationSec || 300,
      hostId: config.hostId || null,
    };
    return {
      status: 'lobby', // 'lobby' | 'vault-pick' | 'playing' | 'ended'
      config: cfg,
      now: 0,
      startedAt: null,
      endsAt: null,
      players: {}, // pid -> player state
      playerOrder: [], // join order (used by hot-seat for turn rotation)
      activeQuestions: {}, // pid -> question | null
      crackHistory: {}, // pid -> targetPid -> [{guess, feedback, at}]
      crackAttemptsUsed: {}, // pid -> targetPid -> count
      lastCrackAt: {}, // pid -> ts
      hotseatTurnIndex: 0, // index into playerOrder
      events: [],
      winner: null, // pid (set on end)
      bonusGate: {}, // pid -> { acquiredAt, used: bool } (for crack action gating)
    };
  }

  function chAddPlayer(state, player) {
    const s = clone(state);
    if (s.status !== 'lobby' && s.status !== 'vault-pick') {
      throw new Error(`Cannot add player while session status is ${s.status}`);
    }
    if (s.players[player.id]) return s;

    s.players[player.id] = {
      id: player.id,
      name: player.name || 'Player',
      avatar: player.avatar || '👤',
      isBot: !!player.isBot,
      botType: player.botType || null,
      vaultCode: null,
      bits: 0,
      firewalls: 0,
      pendingAction: null, // actionId unlocked but not yet used
      pendingActionType: null, // 'regular' | 'bonus' (which question unlocked it)
      lastCorrectAt: null,
      stats: {
        correct: 0,
        wrong: 0,
        fastCorrect: 0,
        bonusCorrect: 0,
        bonusWrong: 0,
        actionsUsed: 0,
        cracksAttempted: 0,
        cracksSucceeded: 0,
        defended: 0,
        usedScan: false,
        bitsStolen: 0,
        bitsLost: 0,
      },
      online: true,
    };
    s.playerOrder.push(player.id);
    s.crackHistory[player.id] = {};
    s.crackAttemptsUsed[player.id] = {};
    s.activeQuestions[player.id] = null;
    s.bonusGate[player.id] = null;

    return s;
  }

  function chSetVaultCode(state, pid, code) {
    const s = clone(state);
    if (!s.players[pid]) throw new Error('Unknown player');
    if (!global.chValidateVaultCode(code)) {
      throw new Error('Invalid vault code (must be 3 digits 1-9, no repeats)');
    }
    s.players[pid].vaultCode = code.slice();
    return s;
  }

  function chAllVaultsSet(state) {
    return Object.values(state.players).every(p => Array.isArray(p.vaultCode));
  }

  function chStartGame(state, now) {
    const s = clone(state);
    setNow(s, now);
    if (!chAllVaultsSet(s)) throw new Error('Not all players have set their vault code');
    s.status = 'playing';
    s.startedAt = now;
    s.endsAt = now + s.config.durationSec * 1000;

    // Seed first questions for each player
    Object.keys(s.players).forEach(pid => {
      dealQuestionInPlace(s, pid, 'regular');
    });

    logEvent(s, 'game_start', {
      players: Object.keys(s.players).length,
      durationSec: s.config.durationSec,
    });
    return s;
  }

  // --------------------------------------------------------
  // Questions
  // --------------------------------------------------------

  function dealQuestionInPlace(state, pid, type = 'regular') {
    const q = global.chPickQuestion(state.config.packId, state.config.gradeTier, type);
    if (!q) {
      state.activeQuestions[pid] = null;
      return;
    }
    state.activeQuestions[pid] = {
      ...q,
      type, // 'regular' | 'bonus'
      startedAt: state.now,
      answeredAt: null,
    };
  }

  function chDealQuestion(state, pid, type = 'regular') {
    const s = clone(state);
    dealQuestionInPlace(s, pid, type);
    return s;
  }

  function chSubmitAnswer(state, pid, choiceIdx, now) {
    const s = clone(state);
    setNow(s, now);
    const player = s.players[pid];
    const q = s.activeQuestions[pid];
    if (!player || !q) return { state: s, ok: false, reason: 'no_question' };

    const isBonus = q.type === 'bonus';
    const correct = choiceIdx === q.a;
    const elapsed = now - q.startedAt;

    let bits = 0;
    let speedTier = null;
    if (correct) {
      const score = global.chScoreAnswer(elapsed);
      bits = score.bits;
      speedTier = score.tier;
      player.bits += bits;
      player.stats.correct += 1;
      if (speedTier === 'fast') player.stats.fastCorrect += 1;
      if (isBonus) player.stats.bonusCorrect += 1;
      player.lastCorrectAt = now;
      // Unlock one action (per spec 3.3)
      player.pendingAction = 'unlocked';
      player.pendingActionType = q.type;
      // For crack-bonus flow, we also note bonusGate
      if (isBonus) {
        s.bonusGate[pid] = { acquiredAt: now, used: false };
      }
    } else {
      player.stats.wrong += 1;
      if (isBonus) player.stats.bonusWrong += 1;
    }

    s.activeQuestions[pid] = null;
    logEvent(s, correct ? 'answer_correct' : 'answer_wrong', {
      actor: pid,
      bits,
      speedTier,
      bonus: isBonus,
    });

    // After a regular question, re-deal a regular question immediately (for solo/hotseat).
    // After a bonus question, no re-deal — the player goes to crack flow next.
    if (!isBonus) {
      dealQuestionInPlace(s, pid, 'regular');
    }

    return { state: s, ok: true, correct, bits, speedTier, isBonus };
  }

  // --------------------------------------------------------
  // Actions (non-crack)
  // --------------------------------------------------------

  function chApplyAction(state, pid, actionId, opts = {}, now) {
    const s = clone(state);
    setNow(s, now);
    const player = s.players[pid];
    if (!player) return { state: s, ok: false, reason: 'no_player' };
    if (player.pendingAction !== 'unlocked') return { state: s, ok: false, reason: 'no_unlocked_action' };
    if (!C.ACTIONS[actionId]) return { state: s, ok: false, reason: 'bad_action' };

    if (actionId === 'firewall') {
      player.firewalls += 1;
      player.pendingAction = null;
      player.pendingActionType = null;
      player.stats.actionsUsed += 1;
      logEvent(s, 'action_firewall', { actor: pid });
      return { state: s, ok: true, kind: 'firewall' };
    }

    if (actionId === 'surge') {
      player.bits += C.BITS.surge;
      player.pendingAction = null;
      player.pendingActionType = null;
      player.stats.actionsUsed += 1;
      logEvent(s, 'action_surge', { actor: pid, bits: C.BITS.surge });
      return { state: s, ok: true, kind: 'surge', bits: C.BITS.surge };
    }

    if (actionId === 'scan') {
      const targetId = opts.targetId;
      const target = s.players[targetId];
      if (!target || targetId === pid) return { state: s, ok: false, reason: 'bad_target' };
      const digit = global.chPickScanDigit(target.vaultCode);
      player.pendingAction = null;
      player.pendingActionType = null;
      player.stats.actionsUsed += 1;
      player.stats.usedScan = true;
      logEvent(s, 'action_scan', { actor: pid, target: targetId, digit });
      return { state: s, ok: true, kind: 'scan', digit, targetId };
    }

    if (actionId === 'crack') {
      // Crack requires answering a bonus question first.
      // Mark intent: deal a bonus question. The actual crack-attempt happens after the bonus.
      player.pendingAction = 'crack-pending';
      player.stats.actionsUsed += 1;
      dealQuestionInPlace(s, pid, 'bonus');
      logEvent(s, 'action_crack_intent', { actor: pid });
      return { state: s, ok: true, kind: 'crack-pending' };
    }

    return { state: s, ok: false, reason: 'unhandled' };
  }

  // --------------------------------------------------------
  // Crack mini-game
  // --------------------------------------------------------

  function chCanCrack(state, attackerId, targetId, now) {
    const a = state.players[attackerId];
    const t = state.players[targetId];
    if (!a || !t || attackerId === targetId) return { ok: false, reason: 'bad_target' };
    // Must have a pending crack (bonus answered correctly) OR be in solo override mode
    const gate = state.bonusGate[attackerId];
    if (!gate || gate.used) return { ok: false, reason: 'no_crack_gate' };

    // Rate limit (spec section 6: 1 attempt / 15s)
    const last = state.lastCrackAt[attackerId] || 0;
    if (now - last < C.BITS.crackRateLimitMs) {
      return { ok: false, reason: 'rate_limited', wait: C.BITS.crackRateLimitMs - (now - last) };
    }

    // 3 attempts per attacker→target (spec section 6)
    const used = (state.crackAttemptsUsed[attackerId] && state.crackAttemptsUsed[attackerId][targetId]) || 0;
    if (used >= C.CRACK.maxAttemptsPerSession) {
      return { ok: false, reason: 'max_attempts' };
    }
    return { ok: true };
  }

  function chCrackAttempt(state, attackerId, targetId, guess, now) {
    const s = clone(state);
    setNow(s, now);
    const can = chCanCrack(s, attackerId, targetId, now);
    if (!can.ok) return { state: s, ok: false, reason: can.reason, wait: can.wait };

    const attacker = s.players[attackerId];
    const target = s.players[targetId];
    if (!global.chValidateVaultCode(guess)) return { state: s, ok: false, reason: 'bad_guess' };

    // Record attempt
    s.lastCrackAt[attackerId] = now;
    s.crackAttemptsUsed[attackerId] = s.crackAttemptsUsed[attackerId] || {};
    s.crackAttemptsUsed[attackerId][targetId] = (s.crackAttemptsUsed[attackerId][targetId] || 0) + 1;
    attacker.stats.cracksAttempted += 1;

    const feedback = global.chCrackFeedback(guess, target.vaultCode);
    const allExact = feedback.every(f => f === 'exact');

    s.crackHistory[attackerId] = s.crackHistory[attackerId] || {};
    s.crackHistory[attackerId][targetId] = s.crackHistory[attackerId][targetId] || [];
    s.crackHistory[attackerId][targetId].push({ guess: guess.slice(), feedback, at: now });

    // Mark gate as consumed (one bonus = one attempt sequence)
    if (s.bonusGate[attackerId]) s.bonusGate[attackerId].used = true;
    attacker.pendingAction = null;
    attacker.pendingActionType = null;

    if (allExact) {
      // Steal 30%
      const stolen = Math.ceil(target.bits * C.BITS.stealRatio);
      target.bits = Math.max(0, target.bits - stolen);
      attacker.bits += stolen;
      attacker.stats.cracksSucceeded += 1;
      attacker.stats.bitsStolen += stolen;
      target.stats.bitsLost += stolen;
      // Force target to choose a new vault code (per spec 3.4)
      target.vaultCode = null;

      logEvent(s, 'crack_success', {
        actor: attackerId,
        target: targetId,
        stolen,
        feedback,
      });

      // Re-deal regular question for attacker (back to flow)
      dealQuestionInPlace(s, attackerId, 'regular');

      return { state: s, ok: true, success: true, stolen, feedback, targetMustReroll: true };
    }

    // Failed crack — firewall absorbs if available
    let defended = false;
    if (target.firewalls > 0) {
      target.firewalls -= 1;
      target.stats.defended += 1;
      defended = true;
      logEvent(s, 'crack_blocked', {
        actor: attackerId,
        target: targetId,
        feedback,
      });
    } else {
      logEvent(s, 'crack_fail', {
        actor: attackerId,
        target: targetId,
        feedback,
      });
    }

    // After a failed crack, attacker returns to regular questions
    dealQuestionInPlace(s, attackerId, 'regular');

    return { state: s, ok: true, success: false, defended, feedback };
  }

  // --------------------------------------------------------
  // Tick / timeouts / end conditions
  // --------------------------------------------------------

  function chTick(state, now) {
    const s = clone(state);
    setNow(s, now);
    if (s.status !== 'playing') return s;

    // End of round
    if (now >= s.endsAt) {
      return chEndGame(s, now);
    }

    // Timeout active questions
    Object.keys(s.activeQuestions).forEach(pid => {
      const q = s.activeQuestions[pid];
      if (!q) return;
      const limit = q.type === 'bonus' ? C.BITS.bonusTimeoutMs : C.BITS.answerTimeoutMs;
      if (now - q.startedAt >= limit) {
        const player = s.players[pid];
        if (player) {
          player.stats.wrong += 1;
          if (q.type === 'bonus') {
            player.stats.bonusWrong += 1;
            player.pendingAction = null;
            player.pendingActionType = null;
            // Stale bonus gate cleared
            s.bonusGate[pid] = null;
          }
        }
        logEvent(s, 'answer_timeout', { actor: pid, bonus: q.type === 'bonus' });
        // Re-deal regular question
        dealQuestionInPlace(s, pid, 'regular');
      }
    });

    return s;
  }

  function chEndGame(state, now) {
    const s = clone(state);
    setNow(s, now);
    s.status = 'ended';

    // Sort players by bits desc to determine winner / placement
    const sorted = Object.values(s.players).sort((a, b) => b.bits - a.bits);
    s.winner = sorted.length ? sorted[0].id : null;
    s.placements = sorted.map((p, idx) => ({ pid: p.id, place: idx + 1, bits: p.bits }));
    logEvent(s, 'game_end', { winner: s.winner, placements: s.placements });
    return s;
  }

  // --------------------------------------------------------
  // Reward computation (LuminaCore grants)
  // --------------------------------------------------------

  function chComputeRewards(state, pid) {
    const player = state.players[pid];
    if (!player) return null;
    const R = C.REWARDS;
    let xp = R.participation.xp;
    let coins = R.participation.coins;

    xp += player.stats.correct * R.perCorrect.xp;
    coins += player.stats.correct * R.perCorrect.coins;
    xp += player.stats.cracksSucceeded * R.perCrack.xp;
    coins += player.stats.cracksSucceeded * R.perCrack.coins;
    xp += player.stats.defended * R.firewallDefend.xp;
    coins += player.stats.defended * R.firewallDefend.coins;

    const placement = (state.placements || []).find(p => p.pid === pid);
    if (placement && R.place[placement.place]) {
      xp += R.place[placement.place].xp;
      coins += R.place[placement.place].coins;
    }
    const rewardPoints = Math.floor(xp / 20);
    return { xp, coins, rewardPoints, placement: placement ? placement.place : null };
  }

  // --------------------------------------------------------
  // Public projection (strips secrets — used for spectator/online broadcast)
  // --------------------------------------------------------

  function chProjectPublic(state, viewerId = null) {
    const projected = clone(state);
    Object.values(projected.players).forEach(p => {
      if (p.id !== viewerId) {
        // Hide vault codes from non-owners
        delete p.vaultCode;
      }
    });
    // Strip raw events that include scan results to other viewers
    if (viewerId) {
      projected.events = projected.events.map(ev => {
        if (ev.kind === 'action_scan' && ev.actor !== viewerId) {
          const safe = { ...ev };
          delete safe.digit;
          return safe;
        }
        return ev;
      });
    } else {
      // No viewer: strip everything sensitive
      projected.events = projected.events.map(ev => {
        if (ev.kind === 'action_scan') {
          const safe = { ...ev };
          delete safe.digit;
          return safe;
        }
        return ev;
      });
    }
    return projected;
  }

  // --------------------------------------------------------
  // Hot-seat helpers
  // --------------------------------------------------------

  function chHotseatActivePid(state) {
    if (!state.playerOrder.length) return null;
    return state.playerOrder[state.hotseatTurnIndex % state.playerOrder.length];
  }

  function chHotseatAdvance(state) {
    const s = clone(state);
    s.hotseatTurnIndex = (s.hotseatTurnIndex + 1) % s.playerOrder.length;
    return s;
  }

  // --------------------------------------------------------
  // Export
  // --------------------------------------------------------

  global.CipherEngine = {
    chCreateSession,
    chAddPlayer,
    chSetVaultCode,
    chAllVaultsSet,
    chStartGame,
    chDealQuestion,
    chSubmitAnswer,
    chApplyAction,
    chCanCrack,
    chCrackAttempt,
    chTick,
    chEndGame,
    chComputeRewards,
    chProjectPublic,
    chHotseatActivePid,
    chHotseatAdvance,
  };
})(typeof window !== 'undefined' ? window : globalThis);
