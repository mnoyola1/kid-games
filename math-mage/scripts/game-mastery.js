// ==================== MATH MAGE — MASTERY + SPACED REPETITION ====================
// Per-fact mastery state machine and a weighted-random selector that biases
// toward weak / not-recently-seen / recently-missed facts.
//
// Mastery key is order-independent: factKey(6,7) === factKey(7,6). 6×7 and
// 7×6 are the same fact for learning purposes (commutativity). The two
// orderings still surface separately at problem-presentation time so the kid
// sees both phrasings, but they share one mastery cell.
//
// State machine (per fact, per profile):
//   untested → seen → bronze → silver → gold
//
// Thresholds (Phase 1, tunable):
//   seen    : has appeared at least once
//   bronze  : 3 correct (any speed)
//   silver  : 5 correct, ≥1 under 2.0s
//   gold    : 7 correct, all of last 5 attempts under 2.0s, none missed
//
// Persistence:
//   localStorage[MM_LS_MASTERY + ':' + profileId] = { facts: { 'a:b': {...} } }
//   (Synced via LuminaCore's existing cloud-sync as part of game stats once
//    we record session end.)

(function () {
  const {
    MM_FACT_MIN, MM_FACT_MAX,
    MM_LS_MASTERY,
  } = window.MathMageConfig;

  // ---- Fact key (order-independent) ----
  function factKey(a, b) {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return `${lo}:${hi}`;
  }

  // ---- Default per-fact record ----
  function defaultFactRecord() {
    return {
      // Cumulative counts over all time (across sessions).
      attempts: 0,
      correct: 0,
      misses: 0,
      // Recent attempt history (newest first; trimmed to 10).
      recent: [], // each entry: { correct: bool, ms: number, ts: epochMs }
      // Best response time (in ms, on a CORRECT answer). null if never correct.
      bestMs: null,
      lastSeenTs: 0,
      lastMissedTs: 0,
      level: 'untested', // untested | seen | bronze | silver | gold
    };
  }

  // ---- LocalStorage ----
  function storageKey(profileId) {
    return MM_LS_MASTERY + ':' + (profileId || 'guest');
  }

  function loadAll(profileId) {
    try {
      const raw = localStorage.getItem(storageKey(profileId));
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.facts && typeof parsed.facts === 'object') {
        return parsed;
      }
    } catch (e) { /* ignore */ }
    return { facts: {} };
  }

  function saveAll(profileId, store) {
    try {
      localStorage.setItem(storageKey(profileId), JSON.stringify(store));
    } catch (e) { /* ignore */ }
  }

  // ---- Get / ensure ----
  function getFact(store, a, b) {
    const k = factKey(a, b);
    if (!store.facts[k]) store.facts[k] = defaultFactRecord();
    return store.facts[k];
  }

  // ---- Level recompute ----
  // Recomputes `level` from the cumulative + recent stats. Idempotent — safe
  // to call after every attempt.
  function recomputeLevel(rec) {
    if (rec.attempts === 0) { rec.level = 'untested'; return; }

    if (rec.correct < 3) { rec.level = 'seen'; return; }
    if (rec.correct < 5) { rec.level = 'bronze'; return; }

    // Silver: at least one CORRECT response under 2s.
    const hasFastCorrect = rec.bestMs != null && rec.bestMs < 2000;
    if (rec.correct < 7 || !hasFastCorrect) { rec.level = 'silver'; return; }

    // Gold: 7+ correct, none missed in last 5 attempts, all last-5 correct
    // attempts under 2.0s.
    const last5 = rec.recent.slice(0, 5);
    const last5Missed = last5.some((r) => !r.correct);
    const last5SlowCorrect = last5.some((r) => r.correct && r.ms >= 2000);
    if (last5Missed || last5SlowCorrect) { rec.level = 'silver'; return; }

    rec.level = 'gold';
  }

  // ---- Public: record an attempt ----
  function recordAttempt({ profileId, a, b, correct, ms }) {
    const store = loadAll(profileId);
    const rec = getFact(store, a, b);
    const ts = Date.now();
    rec.attempts++;
    if (correct) {
      rec.correct++;
      if (rec.bestMs == null || ms < rec.bestMs) rec.bestMs = ms;
    } else {
      rec.misses++;
      rec.lastMissedTs = ts;
    }
    rec.recent.unshift({ correct, ms, ts });
    if (rec.recent.length > 10) rec.recent.length = 10;
    rec.lastSeenTs = ts;
    recomputeLevel(rec);
    saveAll(profileId, store);
    return rec;
  }

  // ---- Public: snapshot for UI (mastery board) ----
  // Returns a flat array of { a, b, key, level, attempts, correct, ... } for
  // every (a,b) with a >= b in the requested range. Order-independent.
  function snapshot(profileId, { min = MM_FACT_MIN, max = MM_FACT_MAX } = {}) {
    const store = loadAll(profileId);
    const out = [];
    for (let a = min; a <= max; a++) {
      for (let b = a; b <= max; b++) {
        const k = factKey(a, b);
        const rec = store.facts[k] || defaultFactRecord();
        out.push({ a, b, key: k, ...rec });
      }
    }
    return out;
  }

  // ---- Public: per-target-table snapshot (the 13 cells for the picker) ----
  function targetTableSnapshot(profileId, target) {
    const store = loadAll(profileId);
    const out = [];
    for (let n = MM_FACT_MIN; n <= MM_FACT_MAX; n++) {
      const rec = store.facts[factKey(target, n)] || defaultFactRecord();
      out.push({ a: target, b: n, key: factKey(target, n), ...rec });
    }
    return out;
  }

  // ---- Spaced-repetition selector ----
  //
  // Picks the next problem from a candidate pool with weights:
  //   0.50  facts at lowest mastery in the pool
  //   0.30  facts not seen in last 24h
  //   0.20  pure random
  //   force include: any fact with a recent miss (added independently first)
  //
  // To prevent the same fact appearing twice in a row, we track `lastKey`.
  //
  // The candidate pool is the array of {a,b} the caller cares about — usually
  // the 26 ordered pairs of the target table (so the kid sees both 6×7 and
  // 7×6 framings). We resolve mastery via the order-independent factKey.

  const LEVEL_RANK = { untested: 0, seen: 1, bronze: 2, silver: 3, gold: 4 };

  function pickNext({ profileId, pool, lastKey = null, forceMissedKey = null }) {
    if (!pool || !pool.length) return null;
    const store = loadAll(profileId);
    const now = Date.now();

    // Force-include a recently-missed fact if requested (still respect "no repeat").
    if (forceMissedKey) {
      const candidates = pool.filter((p) => factKey(p.a, p.b) === forceMissedKey);
      if (candidates.length && (candidates.length > 1 || forceMissedKey !== lastKey)) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        if (factKey(pick.a, pick.b) !== lastKey) return pick;
      }
    }

    const filtered = pool.filter((p) => factKey(p.a, p.b) !== lastKey);
    const eligible = filtered.length ? filtered : pool;

    // Roll the bucket.
    const r = Math.random();
    let bucket;
    if (r < 0.50)      bucket = 'lowestMastery';
    else if (r < 0.80) bucket = 'stale';
    else               bucket = 'random';

    const enriched = eligible.map((p) => {
      const rec = store.facts[factKey(p.a, p.b)] || defaultFactRecord();
      return { p, rec };
    });

    let candidates = enriched;

    if (bucket === 'lowestMastery') {
      const minRank = enriched.reduce((m, e) => Math.min(m, LEVEL_RANK[e.rec.level] ?? 0), 4);
      candidates = enriched.filter((e) => (LEVEL_RANK[e.rec.level] ?? 0) === minRank);
    } else if (bucket === 'stale') {
      const cutoff = now - 24 * 60 * 60 * 1000;
      const stale = enriched.filter((e) => (e.rec.lastSeenTs || 0) < cutoff);
      if (stale.length) candidates = stale;
      // else fall through to random (pool may be all fresh in early sessions)
    }

    if (!candidates.length) candidates = enriched;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    return pick.p;
  }

  // ---- Reset (for parent / debug) ----
  function resetMastery(profileId) {
    try { localStorage.removeItem(storageKey(profileId)); } catch (e) {}
  }

  window.MathMageMastery = {
    factKey,
    recordAttempt,
    snapshot,
    targetTableSnapshot,
    pickNext,
    resetMastery,
  };
})();
