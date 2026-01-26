// ==================== GAME CONSTANTS ====================
const GAME_ID = 'wordForge';

// ==================== WORD LISTS ====================
const WORD_LISTS = {
  easy: [
    'iron', 'fire', 'gold', 'coal', 'steel', 'blade', 'helm', 'ring',
    'axe', 'bow', 'gem', 'ore', 'rod', 'bar', 'cap', 'belt', 'cape',
    'boot', 'glove', 'sword', 'shield', 'armor', 'hammer', 'dagger', 'torch',
    'stone', 'wood', 'rope', 'key', 'lock', 'chest', 'door', 'wall'
  ],
  medium: [
    'silver', 'bronze', 'copper', 'leather', 'dragon', 'crystal', 'phoenix',
    'thunder', 'shadow', 'diamond', 'emerald', 'sapphire', 'obsidian',
    'titanium', 'mithril', 'enchant', 'ancient', 'mystic', 'arcane',
    'dungeon', 'cavern', 'fortress', 'treasure', 'monster', 'warrior'
  ],
  hard: [
    'adamantine', 'legendary', 'celestial', 'ethereal', 'invincible',
    'indestructible', 'magnificent', 'extraordinary', 'supernatural',
    'transcendent', 'omnipotent', 'primordial', 'quintessence',
    'catastrophic', 'annihilation', 'obliteration'
  ]
};

// Combat trigger words
const COMBAT_WORDS = {
  attack: ['strike', 'slash', 'smash', 'crush', 'pierce'],
  defend: ['block', 'guard', 'shield', 'parry', 'dodge'],
  special: ['flame', 'frost', 'thunder', 'heal', 'surge']
};

// ==================== ITEMS ====================
const ITEMS = [
  // Weapons
  { 
    id: 'iron_sword', 
    name: 'Iron Sword', 
    type: 'weapon',
    emoji: '🗡️', 
    rarity: 'common',
    attack: 5,
    description: 'A sturdy blade',
    triggerWord: 'strike'
  },
  { 
    id: 'flame_blade', 
    name: 'Flame Blade', 
    type: 'weapon',
    emoji: '🔥', 
    rarity: 'rare',
    attack: 12,
    description: 'Burns enemies',
    triggerWord: 'flame'
  },
  { 
    id: 'thunder_hammer', 
    name: 'Thunder Hammer', 
    type: 'weapon',
    emoji: '⚡', 
    rarity: 'epic',
    attack: 18,
    description: 'Lightning strikes',
    triggerWord: 'thunder'
  },
  { 
    id: 'dragon_slayer', 
    name: 'Dragon Slayer', 
    type: 'weapon',
    emoji: '🐉', 
    rarity: 'legendary',
    attack: 30,
    description: 'Ultimate power',
    triggerWord: 'smash'
  },
  
  // Armor
  { 
    id: 'leather_vest', 
    name: 'Leather Vest', 
    type: 'armor',
    emoji: '🦺', 
    rarity: 'common',
    defense: 3,
    description: 'Basic protection',
    triggerWord: null
  },
  { 
    id: 'steel_armor', 
    name: 'Steel Armor', 
    type: 'armor',
    emoji: '🛡️', 
    rarity: 'uncommon',
    defense: 7,
    description: 'Solid defense',
    triggerWord: null
  },
  { 
    id: 'phoenix_armor', 
    name: 'Phoenix Armor', 
    type: 'armor',
    emoji: '🔶', 
    rarity: 'epic',
    defense: 15,
    description: 'Rises from ashes',
    triggerWord: null
  },
  
  // Accessories
  { 
    id: 'health_ring', 
    name: 'Health Ring', 
    type: 'accessory',
    emoji: '💍', 
    rarity: 'uncommon',
    health: 20,
    description: '+20 Max HP',
    triggerWord: null
  },
  { 
    id: 'healing_potion', 
    name: 'Healing Potion', 
    type: 'consumable',
    emoji: '🧪', 
    rarity: 'common',
    heal: 30,
    description: 'Restores 30 HP',
    triggerWord: 'heal'
  }
];

// ==================== ENEMIES ====================
const ENEMIES = [
  {
    id: 'slime',
    name: 'Slime',
    sprite: '../assets/sprites/word-forge/slime_realistic_rgba.png',
    animClass: 'monster-bounce',
    health: 15,
    attack: 3,
    xp: 10,
    coins: 5,
    floor: 1
  },
  {
    id: 'goblin',
    name: 'Goblin',
    sprite: '../assets/sprites/word-forge/goblin_realistic_rgba.png',
    animClass: 'monster-sway',
    health: 25,
    attack: 5,
    xp: 20,
    coins: 10,
    floor: 1
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    sprite: '../assets/sprites/word-forge/skeleton_realistic_rgba.png',
    animClass: 'monster-shake',
    health: 35,
    attack: 8,
    xp: 30,
    coins: 15,
    floor: 2
  },
  {
    id: 'fire_elemental',
    name: 'Fire Elemental',
    sprite: '../assets/sprites/word-forge/fire_elemental_realistic_rgba.png',
    animClass: 'monster-flicker',
    health: 50,
    attack: 12,
    xp: 50,
    coins: 25,
    floor: 3
  },
  {
    id: 'dragon',
    name: 'Ancient Dragon',
    sprite: '../assets/sprites/word-forge/dragon_realistic_rgba.png',
    animClass: 'monster-breathe',
    health: 150,
    attack: 20,
    xp: 200,
    coins: 100,
    floor: 3,
    isBoss: true
  }
];

// ==================== ROOM TYPES ====================
const ROOM_TYPES = {
  EMPTY: 'empty',
  COMBAT: 'combat',
  FORGE: 'forge',
  TREASURE: 'treasure',
  BOSS: 'boss',
  START: 'start'
};

// ==================== META UPGRADES ====================
const META_UPGRADES = [
  {
    id: 'max_health',
    name: 'Tougher Body',
    description: '+10 Max HP',
    cost: 50,
    maxLevel: 5,
    effect: { health: 10 }
  },
  {
    id: 'starting_items',
    name: 'Better Gear',
    description: 'Start with an item',
    cost: 100,
    maxLevel: 3,
    effect: { startingItem: true }
  },
  {
    id: 'extra_life',
    name: 'Second Chance',
    description: 'Revive once per run',
    cost: 200,
    maxLevel: 1,
    effect: { revive: true }
  }
];

// ==================== PLAYER DEFAULTS ====================
const PLAYER_DEFAULTS = {
  health: 50,
  maxHealth: 50,
  attack: 3,
  defense: 0,
  inventory: [],
  equipped: {
    weapon: null,
    armor: null,
    accessory: null
  }
};
