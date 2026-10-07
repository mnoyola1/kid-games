// ==================== MASTERY + SAVE DATA ====================
// Each quiz skill has a level 0-4. Level 3+ counts as "quiz ready".
// Skills per signpost: def (when it shows up), ask (anchor question), spot (find it in a story), tells (what it reveals).

const MASTERY_READY_LEVEL = 3;
const SKILL_FACETS = [
  { key: 'def', label: 'When it shows up' },
  { key: 'ask', label: 'Question to ask' },
  { key: 'spot', label: 'Spot it in a story' },
  { key: 'tells', label: 'What it tells you' },
];

function buildSkillList(signposts) {
  const list = [];
  signposts.forEach(sp => SKILL_FACETS.forEach(f => list.push({ id: `${sp.id}_${f.key}`, sp: sp.id, facet: f.key })));
  list.push({ id: 'why', sp: null, facet: 'why' });
  return list;
}

class MasteryStore {
  constructor(profileId) {
    this.key = `ps_progress_${profileId || 'guest'}`;
    this.data = this._load();
  }

  _blank() {
    return { v: 1, items: {}, badges: [], cases: {}, speedBest: 0, bestQuiz: null, quizRuns: 0, jots: [], jotXpDays: {} };
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
    if (!state) return;
    Object.entries(state.items || {}).forEach(([id, rec]) => {
      const mine = this.data.items[id];
      if (!mine || (rec.last || 0) > (mine.last || 0)) this.data.items[id] = rec;
    });
    this.data.badges = Array.from(new Set([...(this.data.badges || []), ...(state.badges || [])]));
    Object.entries(state.cases || {}).forEach(([id, c]) => {
      const mine = this.data.cases[id];
      if (!mine || (c.best || 0) > (mine.best || 0)) this.data.cases[id] = c;
    });
    this.data.speedBest = Math.max(this.data.speedBest || 0, state.speedBest || 0);
    if (state.bestQuiz != null && (this.data.bestQuiz == null || state.bestQuiz > this.data.bestQuiz)) this.data.bestQuiz = state.bestQuiz;
    this.data.quizRuns = Math.max(this.data.quizRuns || 0, state.quizRuns || 0);
    const jotIds = new Set(this.data.jots.map(j => j.id));
    (state.jots || []).forEach(j => { if (!jotIds.has(j.id)) this.data.jots.push(j); });
    this.data.jots.sort((a, b) => b.id - a.id);
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

  readiness(skills) {
    const total = skills.length * MASTERY_READY_LEVEL;
    const sum = skills.reduce((acc, s) => acc + Math.min(MASTERY_READY_LEVEL, this.level(s.id)), 0);
    return total ? Math.round((sum / total) * 100) : 0;
  }

  signpostReadiness(spId) {
    const ids = SKILL_FACETS.map(f => `${spId}_${f.key}`);
    const sum = ids.reduce((acc, id) => acc + Math.min(MASTERY_READY_LEVEL, this.level(id)), 0);
    return Math.round((sum / (ids.length * MASTERY_READY_LEVEL)) * 100);
  }

  addBadge(spId) {
    if (this.data.badges.includes(spId)) return false;
    this.data.badges.push(spId);
    this.save();
    return true;
  }

  saveCase(caseId, score, stars) {
    const prev = this.data.cases[caseId] || { best: 0, stars: 0, runs: 0 };
    this.data.cases[caseId] = { best: Math.max(prev.best, score), stars: Math.max(prev.stars, stars), runs: prev.runs + 1 };
    this.save();
    return !prev.runs;
  }

  addJot(jot) {
    this.data.jots.unshift({ ...jot, id: Date.now() });
    const day = new Date().toDateString();
    this.data.jotXpDays[day] = (this.data.jotXpDays[day] || 0) + 1;
    this.save();
    return this.data.jotXpDays[day];
  }

  deleteJot(id) {
    this.data.jots = this.data.jots.filter(j => j.id !== id);
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
function orderByNeed(items, mastery, skillOf) {
  return items
    .map(it => ({ it, w: Math.pow(5 - mastery.level(skillOf(it)), 2) * (0.5 + Math.random()) }))
    .sort((a, b) => b.w - a.w)
    .map(x => x.it);
}

function normalizeAnswer(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasTerm(text, term) {
  const t = normalizeAnswer(term).replace(/\s+/g, '\\s+');
  return new RegExp(`\\b${t}`).test(text);
}

// Returns [{label, ok}] for a written answer.
function checkWritten(input, checks) {
  const text = ' ' + normalizeAnswer(input) + ' ';
  return checks.map(c => {
    let ok = true;
    if (c.any) ok = ok && c.any.some(term => hasTerm(text, term));
    if (c.all) ok = ok && c.all.every(term => hasTerm(text, term));
    return { label: c.label, ok };
  });
}

// ==================== SPEECH INPUT ====================
const SpeechInput = {
  supported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },
  start(onText, onEnd) {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) return () => {};
    const rec = new Rec();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript + ' ';
        else interim += r[0].transcript;
      }
      onText(finalText.trim(), interim);
    };
    rec.onerror = () => {};
    rec.onend = () => onEnd && onEnd(finalText.trim());
    try { rec.start(); } catch (_) {}
    return () => { try { rec.stop(); } catch (_) {} };
  },
};
