/**
 * Cipher Heist - Bot AI
 *
 * Two personas (Scout = Liam-tier eager, Sage = Emma-tier strategic).
 *
 * The bot is driven from the game loop via chBotTick(state, pid, now). It
 * decides ONE action per tick (answer / apply action / crack guess) so that
 * play feels human-paced. The bot also runs a real Mastermind-style solver
 * for crack guesses, using prior feedback rows + any scan results.
 *
 * Pure: returns { state, did, log } and never mutates the input state.
 */

(function (global) {
  const C = global.CIPHER_CONFIG;
  if (!C) {
    console.error('Cipher Heist bots: CIPHER_CONFIG missing');
    return;
  }
  const E = global.CipherEngine;

  // -------------------- Mastermind solver --------------------

  function generateCandidates() {
    const out = [];
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        if (b === a) continue;
        for (let c = 1; c <= 9; c++) {
          if (c === a || c === b) continue;
          out.push([a, b, c]);
        }
      }
    }
    return out;
  }

  // Filter candidates against historical feedback rows
  function consistentCandidates(history, knownDigits) {
    let pool = generateCandidates();
    if (history && history.length) {
      pool = pool.filter(cand => {
        for (const row of history) {
          const fb = global.chCrackFeedback(row.guess, cand);
          for (let i = 0; i < 3; i++) {
            if (fb[i] !== row.feedback[i]) return false;
          }
        }
        return true;
      });
    }
    if (knownDigits && knownDigits.length) {
      pool = pool.filter(cand => knownDigits.every(d => cand.includes(d)));
    }
    return pool;
  }

  // Pick a guess from the candidate pool. For Sage, use Knuth-ish minimax-lite:
  // pick the candidate that minimises the worst-case remaining set.
  function pickGuess(pool, persona) {
    if (pool.length === 0) {
      // Fallback: random valid code
      return global.chGenerateVaultCode();
    }
    if (pool.length === 1) return pool[0].slice();

    if (persona === 'scout' || pool.length > 80) {
      // Scout: just pick a random candidate
      return pool[Math.floor(Math.random() * pool.length)].slice();
    }

    // Sage: minimax — pick guess minimizing worst-case partition size
    let best = pool[0];
    let bestScore = Infinity;
    // Cap iterations for perf
    const sampleSize = Math.min(pool.length, 60);
    const sample = pool.slice(0, sampleSize);
    for (const guess of sample) {
      const buckets = {};
      for (const cand of pool) {
        const fb = global.chCrackFeedback(guess, cand).join('');
        buckets[fb] = (buckets[fb] || 0) + 1;
      }
      const worst = Math.max(...Object.values(buckets));
      if (worst < bestScore) {
        bestScore = worst;
        best = guess;
      }
    }
    return best.slice();
  }

  // -------------------- Action choice --------------------

  function chooseAction(state, botPid, persona) {
    const player = state.players[botPid];
    const persCfg = C.BOTS[persona];
    let weights = { ...persCfg.actionWeights };

    // If bot has very low bits, prefer surge
    if (player.bits < 30) weights.surge += 2;

    // If a recent crack succeeded against the bot, prefer firewall
    const recentCrack = state.events
      .slice(-15)
      .find(e => e.kind === 'crack_success' && e.target === botPid);
    if (recentCrack) weights.firewall += 3;

    // If lots of bits stockpiled, lean into crack/scan
    if (player.bits > 100) {
      weights.crack += 1.5;
      weights.scan += 1;
    }

    // If crack attempts maxed against all targets, exclude crack
    const opponents = Object.keys(state.players).filter(id => id !== botPid);
    const allMaxed = opponents.every(t => {
      const used = (state.crackAttemptsUsed[botPid] || {})[t] || 0;
      return used >= C.CRACK.maxAttemptsPerSession;
    });
    if (allMaxed) weights.crack = 0;

    // Roulette wheel
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [id, w] of Object.entries(weights)) {
      if ((r -= w) <= 0) return id;
    }
    return 'surge';
  }

  function chooseTarget(state, botPid) {
    const opponents = Object.values(state.players)
      .filter(p => p.id !== botPid)
      .map(p => ({
        ...p,
        crackUsed: (state.crackAttemptsUsed[botPid] || {})[p.id] || 0,
        knownGuesses: ((state.crackHistory[botPid] || {})[p.id] || []).length,
      }));

    if (opponents.length === 0) return null;

    // Score by: bits desc, attempts available desc, prior feedback rows desc
    opponents.sort((a, b) => {
      const aSlots = C.CRACK.maxAttemptsPerSession - a.crackUsed;
      const bSlots = C.CRACK.maxAttemptsPerSession - b.crackUsed;
      if (aSlots !== bSlots) return bSlots - aSlots;
      if (b.knownGuesses !== a.knownGuesses) return b.knownGuesses - a.knownGuesses;
      return b.bits - a.bits;
    });
    const top = opponents.find(o => o.crackUsed < C.CRACK.maxAttemptsPerSession);
    return top ? top.id : null;
  }

  // -------------------- Tick (one decision per call) --------------------

  function chBotTick(state, botPid, now) {
    const bot = state.players[botPid];
    if (!bot || !bot.isBot || state.status !== 'playing') return { state, did: null };
    const persona = bot.botType || 'scout';
    const persCfg = C.BOTS[persona];

    // 1) Active question? Answer it after a bot-ish delay.
    const q = state.activeQuestions[botPid];
    if (q) {
      const elapsed = now - q.startedAt;
      const [minMs, maxMs] = persCfg.speedRangeMs;
      // Bot answers somewhere in the speed range
      // (We compute a per-question delay deterministically based on q.startedAt)
      const targetDelay = minMs + ((q.startedAt % 100) / 100) * (maxMs - minMs);
      if (elapsed < targetDelay) return { state, did: null };

      const isBonus = q.type === 'bonus';
      const accuracy = isBonus ? persCfg.accuracy.bonus : persCfg.accuracy.regular;
      const willBeCorrect = Math.random() < accuracy;

      let choice = q.a;
      if (!willBeCorrect) {
        // Pick a random wrong option
        const wrongs = [0, 1, 2, 3].filter(i => i !== q.a);
        choice = wrongs[Math.floor(Math.random() * wrongs.length)];
      }
      const result = E.chSubmitAnswer(state, botPid, choice, now);
      return { state: result.state, did: 'answer', correct: result.correct, isBonus };
    }

    // 2) Crack-pending and bonus consumed correctly → guess a code
    const gate = state.bonusGate[botPid];
    if (gate && !gate.used) {
      const targetId = chooseTarget(state, botPid);
      if (!targetId) return { state, did: null };

      // Build knowledge: prior history + scan results from events
      const history = (state.crackHistory[botPid] && state.crackHistory[botPid][targetId]) || [];
      const knownDigits = state.events
        .filter(e => e.kind === 'action_scan' && e.actor === botPid && e.target === targetId && typeof e.digit === 'number')
        .map(e => e.digit);
      const pool = consistentCandidates(history, knownDigits);
      const guess = pickGuess(pool, persona);

      const result = E.chCrackAttempt(state, botPid, targetId, guess, now);
      return { state: result.state, did: 'crack', success: result.success, targetId, guess, feedback: result.feedback };
    }

    // 3) Pending unlocked action? Decide & apply
    if (bot.pendingAction === 'unlocked') {
      const actionId = chooseAction(state, botPid, persona);
      const opts = {};
      if (actionId === 'scan') {
        const targetId = chooseTarget(state, botPid);
        if (!targetId) return { state, did: null };
        opts.targetId = targetId;
      }
      const result = E.chApplyAction(state, botPid, actionId, opts, now);
      return { state: result.state, did: 'action', actionId };
    }

    // Nothing to do
    return { state, did: null };
  }

  global.CipherBots = {
    chBotTick,
    chooseAction,
    chooseTarget,
    consistentCandidates,
    pickGuess,
    generateCandidates,
  };
})(typeof window !== 'undefined' ? window : globalThis);
