// ==================== GAME CONFIG ====================
const LUMINA_ENABLED = typeof LuminaCore !== 'undefined';
const LUMINA_GAME_ID = 'signpostSleuth';

const ASSET_BASE = '../assets';
const SPRITE_PATHS = {
  sage: `${ASSET_BASE}/sprites/signpost-sleuth/sage_rgba.png`,
  sageCheer: `${ASSET_BASE}/sprites/signpost-sleuth/sage_cheer_rgba.png`,
  trophy: `${ASSET_BASE}/sprites/signpost-sleuth/trophy_rgba.png`,
};
const BG_PATHS = {
  title: `${ASSET_BASE}/backgrounds/signpost-sleuth/bg_title.jpg`,
  band: `${ASSET_BASE}/backgrounds/signpost-sleuth/bg_band.jpg`,
  lighthouse: `${ASSET_BASE}/backgrounds/signpost-sleuth/bg_lighthouse.jpg`,
  school: `${ASSET_BASE}/backgrounds/signpost-sleuth/bg_school.jpg`,
  pond: `${ASSET_BASE}/backgrounds/signpost-sleuth/bg_pond.jpg`,
  speed: `${ASSET_BASE}/backgrounds/signpost-sleuth/bg_speed.jpg`,
  quiz: `${ASSET_BASE}/backgrounds/signpost-sleuth/bg_quiz.jpg`,
  notebook: `${ASSET_BASE}/backgrounds/signpost-sleuth/bg_notebook.jpg`,
};

const QUIZ_DATE = new Date(2026, 9, 9);

const CASE_SCORING = {
  stop: 100,        // tapped the right sentence
  sign: 50,         // named the signpost on the first try
  ask: 50,          // picked the anchor question on the first try
  note: 50,         // picked the best sticky note on the first try
  falseStop: -25,   // tapped a sentence with no signpost
};

const SPEED_TUNING = {
  duration: 75,     // seconds
  correctBonusTime: 1,  // capped at duration so a run always ends
  wrongPenaltyTime: 3,
  fastAnswer: 3.5,  // seconds; answering faster earns a speed bonus
  basePoints: 100,
  wrongPause: 1.6,  // seconds the correct answer is shown after a miss
};

const REWARDS = {
  badgeXp: 20,
  caseXp: 30,
  casePointsPerXp: 20,  // case score / this = bonus XP
  speedPointsPerXp: 60,
  quizXpPerPct: 1,
  jotXp: 10,
  jotDailyLimit: 3,
};
