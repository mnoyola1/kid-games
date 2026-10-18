// ==================== MASTERY + ANSWER CHECKING ====================
// Each study-guide item has a level 0-4. Level 3+ counts as "test ready".
// Weak items are picked more often, and misses come back within the same stage.

const MASTERY_READY_LEVEL = 3;

class MasteryStore {
  constructor(profileId) {
    this.key = `bb_progress_${profileId || 'guest'}`;
    this.data = this._load();
  }

  _blank() {
    return { v: 1, items: {}, stagesCleared: [], bossBeaten: false, bestPractice: null, practiceRuns: 0 };
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) return { ...this._blank(), ...JSON.parse(raw) };
    } catch (_) {}
    return this._blank();
  }

  // Cloud save (LuminaCore) may be newer than this device's localStorage.
  mergeFrom(state) {
    if (!state || !state.items) return;
    Object.entries(state.items).forEach(([id, rec]) => {
      const mine = this.data.items[id];
      if (!mine || (rec.last || 0) > (mine.last || 0)) this.data.items[id] = rec;
    });
    this.data.stagesCleared = Array.from(new Set([...(this.data.stagesCleared || []), ...(state.stagesCleared || [])]));
    this.data.bossBeaten = this.data.bossBeaten || !!state.bossBeaten;
    if (state.bestPractice != null && (this.data.bestPractice == null || state.bestPractice > this.data.bestPractice)) {
      this.data.bestPractice = state.bestPractice;
    }
    this.data.practiceRuns = Math.max(this.data.practiceRuns || 0, state.practiceRuns || 0);
    this.save();
  }

  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (_) {}
  }

  rec(id) {
    if (!this.data.items[id]) this.data.items[id] = { level: 0, correct: 0, wrong: 0, last: 0 };
    return this.data.items[id];
  }

  level(id) {
    return this.data.items[id] ? this.data.items[id].level : 0;
  }

  record(id, correct, weight = 1) {
    const r = this.rec(id);
    if (correct) {
      r.correct += 1;
      r.level = Math.min(4, r.level + weight);
    } else {
      r.wrong += 1;
      r.level = Math.max(0, r.level - 1);
    }
    r.last = Date.now();
    this.save();
  }

  readiness(items) {
    const total = items.length * MASTERY_READY_LEVEL;
    const sum = items.reduce((acc, it) => acc + Math.min(MASTERY_READY_LEVEL, this.level(it.id)), 0);
    return total ? Math.round((sum / total) * 100) : 0;
  }

  clearStage(stageId) {
    if (!this.data.stagesCleared.includes(stageId)) this.data.stagesCleared.push(stageId);
    this.save();
  }
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Weighted order: low-mastery items float to the front, with some randomness.
function orderByNeed(questions, mastery) {
  return questions
    .map(q => ({ q, w: Math.pow(5 - mastery.level(q.item), 2) * (0.5 + Math.random()) }))
    .sort((a, b) => b.w - a.w)
    .map(x => x.q);
}

function normalizeAnswer(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(the|a|an)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

// 'exact' | 'close' (right word, spelling slip) | 'wrong'
function checkFill(input, accepted) {
  const got = normalizeAnswer(input);
  if (!got) return 'wrong';
  const squash = s => s.replace(/\s/g, '');
  for (const ans of accepted) {
    const want = normalizeAnswer(ans);
    if (got === want || squash(got) === squash(want)) return 'exact';
  }
  for (const ans of accepted) {
    const want = squash(normalizeAnswer(ans));
    const allowed = want.length <= 5 ? 1 : 2;
    if (levenshtein(squash(got), want) <= allowed) return 'close';
  }
  return 'wrong';
}
