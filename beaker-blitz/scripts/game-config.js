// ==================== GAME CONFIG ====================
const LUMINA_ENABLED = typeof LuminaCore !== 'undefined';
const LUMINA_GAME_ID = 'beakerBlitz';

const ASSET_BASE = '../assets';
const SPRITE_PATHS = {
  bolt: `${ASSET_BASE}/sprites/beaker-blitz/bolt_rgba.png`,
  fizz: `${ASSET_BASE}/sprites/beaker-blitz/fizz_rgba.png`,
  slime: `${ASSET_BASE}/sprites/beaker-blitz/slime_rgba.png`,
  potion: `${ASSET_BASE}/sprites/beaker-blitz/potion_rgba.png`,
  rocket: `${ASSET_BASE}/sprites/beaker-blitz/rocket_rgba.png`,
  trophy: `${ASSET_BASE}/sprites/beaker-blitz/trophy_rgba.png`,
};
const BG_PATHS = {
  title: `${ASSET_BASE}/backgrounds/beaker-blitz/bg_title.png`,
  observe: `${ASSET_BASE}/backgrounds/beaker-blitz/bg_observe.png`,
  hypothesis: `${ASSET_BASE}/backgrounds/beaker-blitz/bg_hypothesis.png`,
  experiment: `${ASSET_BASE}/backgrounds/beaker-blitz/bg_experiment.png`,
  truefalse: `${ASSET_BASE}/backgrounds/beaker-blitz/bg_truefalse.png`,
  boss: `${ASSET_BASE}/backgrounds/beaker-blitz/bg_boss.png`,
};

// Logical canvas size; scaled to fit the viewport.
const LAB_W = 540;
const LAB_H = 860;
const BOT_Y = 735;          // center of Bolt
const CATCH_Y = BOT_Y - 70; // beaker mouth

const LAB_TUNING = {
  botSpeed: 620,            // px/s with keyboard
  bubbleSpeed: 70,          // px/s while answer bubbles fall (reading time)
  bossBubbleSpeed: 92,
  readDelay: 1.8,           // seconds the question shows before bubbles drop
  betweenTime: [4.2, 5.4],  // seconds of slime + atoms between questions
  hazardSpeed: [240, 320],
  maxHearts: 4,
};

// Tint over the stage background so falling bubbles stay readable.
const STAGE_THEMES = {
  observe:    { tint: 'rgba(12, 74, 110, 0.45)', floor: '#0e7490', accent: '#67e8f9' },
  hypothesis: { tint: 'rgba(76, 29, 149, 0.45)', floor: '#6d28d9', accent: '#fde047' },
  experiment: { tint: 'rgba(20, 83, 45, 0.45)',  floor: '#15803d', accent: '#86efac' },
  truefalse:  { tint: 'rgba(30, 41, 59, 0.5)',   floor: '#334155', accent: '#f9a8d4' },
  boss:       { tint: 'rgba(30, 27, 75, 0.5)',   floor: '#312e81', accent: '#fdba74' },
};

const TEST_DATE = new Date(2026, 9, 22);

const REWARDS = {
  xpPerCorrect: 4,
  coinsPerCorrect: 2,
  stageXp: 25,
  stageCoins: 10,
  bossXp: 60,
  practiceXpPerPoint: 3,
};
