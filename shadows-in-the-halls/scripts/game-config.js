// ==================== GAME CONSTANTS ====================
const GAME_ID = 'shadows-in-the-halls';

// Battery System
const BATTERY_DRAIN_RATE = 1; // 1% per second (100 seconds per full battery)
const BATTERY_DRAIN_RUNNING = 2; // 2% per second when running
const LOW_BATTERY_THRESHOLD = 20;
const BATTERY_PICKUP_AMOUNT = 60;

// Player Movement
const PLAYER_WALK_SPEED = 100; // pixels per second
const PLAYER_RUN_SPEED = 180;
const PLAYER_SIZE = 32;

// Flashlight
const LIGHT_RADIUS_NORMAL = 150;
const LIGHT_RADIUS_LOW = 75;

// Map
const GRID_SIZE = 5;
const ROOM_SIZE = 600;

// Enemy Types
const ENEMY_TYPES = {
  lurker: {
    hp: 1,
    speed: 50,
    detectionRange: 100,
    sprite: 'shadow_lurker',
    behavior: 'patrol'
  },
  chaser: {
    hp: 1,
    speed: 80,
    detectionRange: 150,
    sprite: 'shadow_chaser',
    behavior: 'chase'
  }
};

// ==================== PUZZLES ====================

// Math Puzzles (3rd-5th grade)
const MATH_PUZZLES = [
  // Easy (3rd grade)
  { question: "5 + 7 = ?", answer: "12", difficulty: 1, grade: 3 },
  { question: "3 × 4 = ?", answer: "12", difficulty: 1, grade: 3 },
  { question: "20 - 8 = ?", answer: "12", difficulty: 1, grade: 3 },
  { question: "15 + 5 = ?", answer: "20", difficulty: 1, grade: 3 },
  { question: "6 × 2 = ?", answer: "12", difficulty: 1, grade: 3 },
  { question: "18 - 9 = ?", answer: "9", difficulty: 1, grade: 3 },
  { question: "10 + 10 = ?", answer: "20", difficulty: 1, grade: 3 },
  { question: "5 × 5 = ?", answer: "25", difficulty: 1, grade: 3 },
  
  // Medium (4th grade)
  { question: "12 × 3 = ?", answer: "36", difficulty: 2, grade: 4 },
  { question: "(5 + 3) × 2 = ?", answer: "16", difficulty: 2, grade: 4 },
  { question: "45 ÷ 5 = ?", answer: "9", difficulty: 2, grade: 4 },
  { question: "7 × 8 = ?", answer: "56", difficulty: 2, grade: 4 },
  { question: "36 ÷ 4 = ?", answer: "9", difficulty: 2, grade: 4 },
  { question: "15 × 4 = ?", answer: "60", difficulty: 2, grade: 4 },
  { question: "(10 + 2) × 3 = ?", answer: "36", difficulty: 2, grade: 4 },
  { question: "72 ÷ 8 = ?", answer: "9", difficulty: 2, grade: 4 },
  
  // Hard (5th grade)
  { question: "2 × (8 + 4) - 5 = ?", answer: "19", difficulty: 3, grade: 5 },
  { question: "100 - (6 × 7) = ?", answer: "58", difficulty: 3, grade: 5 },
  { question: "(15 × 2) + (8 × 3) = ?", answer: "54", difficulty: 3, grade: 5 },
  { question: "120 ÷ (4 + 2) = ?", answer: "20", difficulty: 3, grade: 5 },
  { question: "3 × (12 - 5) + 6 = ?", answer: "27", difficulty: 3, grade: 5 },
  { question: "(48 ÷ 6) + (9 × 4) = ?", answer: "44", difficulty: 3, grade: 5 },
];

// Word Puzzles (Unscramble)
const WORD_PUZZLES = [
  { scrambled: "OSTRY", answer: "STORY", hint: "A tale or narrative" },
  { scrambled: "NAITR", answer: "TRAIN", hint: "Transportation on tracks" },
  { scrambled: "BELTA", answer: "TABLE", hint: "Furniture for eating" },
  { scrambled: "HAICR", answer: "CHAIR", hint: "Something to sit on" },
  { scrambled: "KOOB", answer: "BOOK", hint: "Read for learning" },
  { scrambled: "HOSCO", answer: "SCHOOL", hint: "Where you learn" },
  { scrambled: "PENCLI", answer: "PENCIL", hint: "Writing tool" },
  { scrambled: "PAPRE", answer: "PAPER", hint: "Write on this" },
  { scrambled: "ERTTCA", answer: "TEACHER", hint: "Helps you learn" },
  { scrambled: "NDFIRE", answer: "FRIEND", hint: "Someone close to you" },
];

// Pattern Puzzles
const PATTERN_PUZZLES = [
  { sequence: [2, 4, 8, 16], answer: "32", hint: "Doubling pattern" },
  { sequence: [3, 6, 9, 12], answer: "15", hint: "Counting by 3s" },
  { sequence: [5, 10, 15, 20], answer: "25", hint: "Counting by 5s" },
  { sequence: [1, 4, 9, 16], answer: "25", hint: "Square numbers" },
  { sequence: [10, 20, 30, 40], answer: "50", hint: "Counting by 10s" },
];

// ==================== ROOM TYPES ====================
const ROOM_TYPES = [
  'hallway',
  'classroom', 
  'office',
  'bathroom',
  'safe_room',
  'library',
  'cafeteria'
];

// ==================== ITEMS ====================
const ITEMS = {
  battery: { 
    name: "Battery", 
    icon: "🔋",
    effect: "+60% flashlight", 
    stackable: true 
  },
  key_red: { 
    name: "Red Key", 
    icon: "🔴🔑",
    effect: "Opens red doors", 
    stackable: false 
  },
  key_blue: { 
    name: "Blue Key", 
    icon: "🔵🔑",
    effect: "Opens blue doors", 
    stackable: false 
  },
  key_yellow: { 
    name: "Yellow Key", 
    icon: "🟡🔑",
    effect: "Opens yellow doors", 
    stackable: false 
  },
};

// ==================== META PROGRESSION ====================
const UPGRADES = [
  { 
    id: 'battery_life', 
    name: 'Longer Battery', 
    cost: 100, 
    effect: '+30s per battery',
    description: 'Batteries last 30 seconds longer'
  },
  { 
    id: 'move_speed', 
    name: 'Faster Movement', 
    cost: 150, 
    effect: '+10% speed',
    description: 'Move 10% faster'
  },
  { 
    id: 'inventory', 
    name: 'Bigger Backpack', 
    cost: 200, 
    effect: '+2 slots',
    description: 'Carry 2 more items'
  },
  { 
    id: 'extra_hp', 
    name: 'Extra Health', 
    cost: 250, 
    effect: '+1 HP',
    description: 'Survive one more hit'
  },
  { 
    id: 'light_radius', 
    name: 'Brighter Light', 
    cost: 300, 
    effect: '+25% radius',
    description: 'See further in the dark'
  },
];

// ==================== REWARD CALCULATIONS ====================
const PUZZLE_REWARDS = {
  1: { xp: 15, coins: 2 }, // Easy
  2: { xp: 25, coins: 3 }, // Medium
  3: { xp: 40, coins: 5 }, // Hard
};

function calculateMemoryFragments(runData) {
  let fragments = 0;
  fragments += runData.roomsExplored * 5;
  fragments += runData.puzzlesSolved * 10;
  fragments += runData.escaped ? 50 : 0;
  return fragments;
}
