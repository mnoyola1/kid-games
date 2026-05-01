// ==================== MATH MAGE — CONFIG ====================
// Constants, fact bank, target-table selector, reward formulas.
// Pure data + small pure helpers. Anything stateful lives elsewhere.

const MM_GAME_ID = 'math-mage';

// Range of multiplicands we care about (Liam's school covers 0–12).
const MM_FACT_MIN = 0;
const MM_FACT_MAX = 12;

// Wave shape for one session. Phase 1: simple ramp + boss wave with all
// 13 facts of the target table in random order.
const MM_WAVES = [
  { id: 1, label: 'Wave I',   problems: 6,  speedMs: 9000, theme: 'gentle' },
  { id: 2, label: 'Wave II',  problems: 8,  speedMs: 8000, theme: 'rising' },
  { id: 3, label: 'Wave III', problems: 10, speedMs: 7000, theme: 'rising' },
  { id: 4, label: 'Wave IV',  problems: 10, speedMs: 6500, theme: 'fierce' },
  { id: 5, label: 'Boss Wave', problems: 13, speedMs: 7000, theme: 'boss', isBoss: true },
];

const MM_STARTING_HP = 5;

// Single-table mode: 13 facts (target × 0 .. target × 12).
// Mixed mode: full grid 0..12 × 0..12.
const MM_TARGET_TABLES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Profile-aware default. Liam → ×6 (this week's school target). Emma → ×7.
function mmDefaultTargetTable(profile) {
  const id = profile && profile.id;
  if (id === 'liam')  return 6;
  if (id === 'emma')  return 7;
  if (id === 'cami')  return 3;
  if (id === 'javi')  return 2;
  return 6;
}

// Build the canonical fact list for a target table. Returns an array of
// { a, b, answer } where one of (a,b) === target. Includes the commutative
// pair (b, target) too, since 6×7 and 7×6 should both surface to teach
// commutativity. Mastery itself is shared (see game-mastery.js: factKey).
function mmFactsForTable(target) {
  const facts = [];
  for (let n = MM_FACT_MIN; n <= MM_FACT_MAX; n++) {
    facts.push({ a: target, b: n, answer: target * n });
    if (n !== target) facts.push({ a: n, b: target, answer: target * n });
  }
  return facts;
}

// Full grid for "Mixed Master" mode.
function mmAllFacts() {
  const facts = [];
  for (let a = MM_FACT_MIN; a <= MM_FACT_MAX; a++) {
    for (let b = MM_FACT_MIN; b <= MM_FACT_MAX; b++) {
      facts.push({ a, b, answer: a * b });
    }
  }
  return facts;
}

// Skip-count sequence used in the inter-wave visual & for the "skip-count
// gap" representation. (target × 0..12) → [0, 6, 12, 18, ... 72]
function mmSkipCount(target) {
  const out = [];
  for (let n = MM_FACT_MIN; n <= MM_FACT_MAX; n++) out.push(target * n);
  return out;
}

// English number names 0..12 (used by Web Speech and "word form" representation).
const MM_NUMBER_NAMES = [
  'zero', 'one', 'two', 'three', 'four', 'five',
  'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
];

function mmNumberName(n) {
  if (n >= 0 && n <= 12) return MM_NUMBER_NAMES[n];
  return String(n);
}

// "six times seven is forty-two" — used after a MISS to teach the full fact,
// and by the handwriting lock-in moment when the kid has just produced the
// answer themselves.
function mmFactPhrase(a, b) {
  return `${mmNumberName(a)} times ${mmNumberName(b)} is ${a * b}`;
}

// "six times seven" — used on FIRST APPEARANCE so the kid hears the
// question alongside seeing it, but still has to retrieve the answer.
// (Speaking the full fact before they attempt would short-circuit recall —
// recognition, not retrieval.)
function mmQuestionPhrase(a, b) {
  return `${mmNumberName(a)} times ${mmNumberName(b)}`;
}

// "Seven groups of six" — word-form representation.
function mmGroupPhrase(a, b) {
  return `${mmNumberName(b)} groups of ${mmNumberName(a)}`;
}

// ---------- Rewards ---------- //
// Tuned so a clean session of ~47 problems lands ~80 XP for a 3rd grader,
// scaling up to ~150 XP for a perfect boss-wave clear. Targets ~500 reward
// points/week per the hub's reward-balancing guidelines.
function mmComputeRewards({ correct, total, comboBest, hpRemaining, bossCleared }) {
  const accuracy = total > 0 ? correct / total : 0;
  let xp = 30 + correct * 2;
  if (accuracy === 1 && total > 0) xp += 25;          // perfect run bonus
  if (comboBest >= 10) xp += 15;                      // long-combo bonus
  if (hpRemaining === MM_STARTING_HP) xp += 10;       // flawless bonus
  if (bossCleared) xp += 30;                          // boss bonus
  xp = Math.floor(xp);
  const coins = Math.floor(xp * 0.5);
  const rewardPoints = Math.floor(xp / 20);
  return { xp, coins, rewardPoints };
}

// ---------- LocalStorage keys ---------- //
const MM_LS_TARGET_TABLE = 'mathMage.targetTable.v1'; // per profile id
const MM_LS_MASTERY      = 'mathMage.mastery.v1';     // per profile id

// ---------- Encouragement / feedback fallbacks ---------- //
const MM_PRAISE = [
  'Sharp casting!', 'Lightning fast!', 'Beautifully done.', 'A clean strike.',
  'The runes obey you.', 'Mastery rising.', 'The wraith fades.', 'Spellbound!',
];
const MM_TRY_AGAIN = [
  'Steady — try that one again.',
  'Almost! Re-cast carefully.',
  'The rune flickered. Hold the form.',
  'A near miss. Aim true.',
];

// Expose globally for other scripts (Babel-standalone shares the global scope).
window.MathMageConfig = {
  MM_GAME_ID,
  MM_FACT_MIN, MM_FACT_MAX,
  MM_WAVES,
  MM_STARTING_HP,
  MM_TARGET_TABLES,
  MM_LS_TARGET_TABLE, MM_LS_MASTERY,
  MM_PRAISE, MM_TRY_AGAIN,
  mmDefaultTargetTable,
  mmFactsForTable,
  mmAllFacts,
  mmSkipCount,
  mmNumberName,
  mmFactPhrase,
  mmQuestionPhrase,
  mmGroupPhrase,
  mmComputeRewards,
};
