// ==================== GAME CONFIG ====================
const LUMINA_ENABLED = typeof LuminaCore !== 'undefined';
const LUMINA_GAME_ID = 'hudsonRiverRush';

const ASSET_BASE = '../assets';
const SPRITE_PATHS = {
  boat: `${ASSET_BASE}/sprites/hudson-river-rush/boat_rgba.png`,
  log: `${ASSET_BASE}/sprites/hudson-river-rush/log_rgba.png`,
  rock: `${ASSET_BASE}/sprites/hudson-river-rush/rock_rgba.png`,
  snowcloud: `${ASSET_BASE}/sprites/hudson-river-rush/snowcloud_rgba.png`,
  ice: `${ASSET_BASE}/sprites/hudson-river-rush/ice_rgba.png`,
  otis: `${ASSET_BASE}/sprites/hudson-river-rush/otis_rgba.png`,
  trophy: `${ASSET_BASE}/sprites/hudson-river-rush/trophy_rgba.png`,
};
const BG_PATHS = {
  title: `${ASSET_BASE}/backgrounds/hudson-river-rush/bg_title.png`,
  harbor: `${ASSET_BASE}/backgrounds/hudson-river-rush/bg_harbor.png`,
  hudson: `${ASSET_BASE}/backgrounds/hudson-river-rush/bg_hudson.png`,
  adirondacks: `${ASSET_BASE}/backgrounds/hudson-river-rush/bg_adirondacks.png`,
  canal: `${ASSET_BASE}/backgrounds/hudson-river-rush/bg_canal.png`,
  niagara: `${ASSET_BASE}/backgrounds/hudson-river-rush/bg_niagara.png`,
};

// Logical canvas size; scaled to fit the viewport.
const RIVER_W = 540;
const RIVER_H = 860;
const LANES = 3;
const BOAT_Y = 700;

const RIVER_TUNING = {
  cruiseSpeed: 230,        // px/s between questions
  questionSpeed: 125,      // px/s while an answer gate approaches (reading time)
  bossQuestionSpeed: 165,
  readDelay: 1.6,          // seconds the question shows before its gate spawns
  obstacleGap: [4.4, 5.6], // seconds between questions; the last ~2s are obstacle-free
  maxHull: 4,
  boostTime: 0.9,
  snowSlowTime: 1.4,
};

// Bank scenery + water colors per leg (canvas-drawn river).
const LEG_THEMES = {
  harbor:      { water: ['#1d6fa3', '#2b86c2'], bank: '#6b7280', bankEdge: '#9ca3af', scenery: 'city' },
  hudson:      { water: ['#1f6f8b', '#2a8aa8'], bank: '#4d7c0f', bankEdge: '#a16207', scenery: 'cliffs' },
  adirondacks: { water: ['#155e75', '#1e7a94'], bank: '#166534', bankEdge: '#14532d', scenery: 'pines' },
  canal:       { water: ['#3b7a8f', '#4b93a8'], bank: '#65a30d', bankEdge: '#78716c', scenery: 'farms' },
  niagara:     { water: ['#1e5f86', '#2f7fb0'], bank: '#e2e8f0', bankEdge: '#94a3b8', scenery: 'snow' },
};

// Mini-map of New York State (0-100 box). The route follows the real trip:
// NYC harbor -> up the Hudson -> Adirondacks -> back to Albany -> Erie Canal west -> Niagara.
const NY_OUTLINE = '4,64 4,52 12,45 24,40 44,35 54,27 61,15 71,7 88,4 88,32 87,62 86,76 99,79 98,84 87,88 81,90 79,83 70,71 60,66 4,66';
const ROUTE_PATH = '84,86 84,62 80,30 84,47 62,46 50,48 30,46 9,51';
const ROUTE_POINTS = {
  harbor: { x: 84, y: 86, label: 'NYC Harbor', lx: 77, ly: 88, anchor: 'end' },
  hudson: { x: 84, y: 62, label: 'Hudson Valley', lx: 77, ly: 63, anchor: 'end' },
  adirondacks: { x: 80, y: 30, label: 'Adirondacks', lx: 73, ly: 31, anchor: 'end' },
  canal: { x: 50, y: 48, label: 'Syracuse', lx: 50, ly: 41, anchor: 'middle' },
  niagara: { x: 9, y: 51, label: 'Niagara Falls', lx: 3, ly: 61, anchor: 'start' },
};

const TEST_DATE = new Date(2026, 9, 1);

const REWARDS = {
  xpPerCorrect: 4,
  coinsPerCorrect: 2,
  legXp: 25,
  legCoins: 10,
  bossXp: 60,
  practiceXpPerPoint: 2,
};
