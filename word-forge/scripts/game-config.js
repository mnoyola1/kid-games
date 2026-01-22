// ==================== WORD LISTS ====================
const WORD_LISTS = {
  easy: [
    'iron', 'fire', 'gold', 'coal', 'steel', 'blade', 'helm', 'ring',
    'axe', 'bow', 'gem', 'ore', 'rod', 'bar', 'cap', 'belt', 'cape',
    'boot', 'glove', 'sword', 'shield', 'armor', 'hammer', 'dagger'
  ],
  medium: [
    'silver', 'bronze', 'copper', 'leather', 'dragon', 'crystal', 'phoenix',
    'thunder', 'shadow', 'diamond', 'emerald', 'sapphire', 'obsidian',
    'titanium', 'mithril', 'enchant', 'ancient', 'mystic', 'arcane'
  ],
  hard: [
    'adamantine', 'legendary', 'celestial', 'ethereal', 'invincible',
    'indestructible', 'magnificent', 'extraordinary', 'supernatural',
    'transcendent', 'omnipotent', 'primordial', 'quintessence'
  ]
};

// ==================== RECIPES ====================
const RECIPES = [
  // Common (2 ingredients)
  { id: 'iron_sword', name: 'Iron Sword', emoji: '🗡️', rarity: 'common', ingredients: 2, description: 'A sturdy blade for beginners' },
  { id: 'wooden_shield', name: 'Wooden Shield', emoji: '🛡️', rarity: 'common', ingredients: 2, description: 'Basic protection' },
  { id: 'leather_cap', name: 'Leather Cap', emoji: '🧢', rarity: 'common', ingredients: 2, description: 'Light head protection' },
  { id: 'iron_ring', name: 'Iron Ring', emoji: '💍', rarity: 'common', ingredients: 2, description: 'Simple but effective' },
  { id: 'cloth_boots', name: 'Cloth Boots', emoji: '👢', rarity: 'common', ingredients: 2, description: 'Comfortable footwear' },
  
  // Uncommon (3 ingredients)
  { id: 'steel_axe', name: 'Steel Axe', emoji: '🪓', rarity: 'uncommon', ingredients: 3, description: 'Cuts through anything' },
  { id: 'bronze_helm', name: 'Bronze Helm', emoji: '⛑️', rarity: 'uncommon', ingredients: 3, description: 'Shiny protection' },
  { id: 'hunter_bow', name: 'Hunter\'s Bow', emoji: '🏹', rarity: 'uncommon', ingredients: 3, description: 'For precise shots' },
  { id: 'silver_pendant', name: 'Silver Pendant', emoji: '📿', rarity: 'uncommon', ingredients: 3, description: 'Wards off evil' },
  { id: 'chain_mail', name: 'Chain Mail', emoji: '🦺', rarity: 'uncommon', ingredients: 3, description: 'Flexible armor' },
  
  // Rare (4 ingredients)
  { id: 'flame_blade', name: 'Flame Blade', emoji: '🔥', rarity: 'rare', ingredients: 4, description: 'Burns with eternal fire' },
  { id: 'ice_shield', name: 'Ice Shield', emoji: '❄️', rarity: 'rare', ingredients: 4, description: 'Freezes attackers' },
  { id: 'thunder_hammer', name: 'Thunder Hammer', emoji: '⚡', rarity: 'rare', ingredients: 4, description: 'Calls down lightning' },
  { id: 'shadow_cloak', name: 'Shadow Cloak', emoji: '🌑', rarity: 'rare', ingredients: 4, description: 'Blend into darkness' },
  { id: 'crystal_crown', name: 'Crystal Crown', emoji: '👑', rarity: 'rare', ingredients: 4, description: 'Enhances magic' },
  
  // Epic (5 ingredients)
  { id: 'dragon_slayer', name: 'Dragon Slayer', emoji: '🐉', rarity: 'epic', ingredients: 5, description: 'Legendary dragon killer' },
  { id: 'phoenix_armor', name: 'Phoenix Armor', emoji: '🔶', rarity: 'epic', ingredients: 5, description: 'Rise from defeat' },
  { id: 'void_dagger', name: 'Void Dagger', emoji: '🌀', rarity: 'epic', ingredients: 5, description: 'Cuts through dimensions' },
  { id: 'starlight_staff', name: 'Starlight Staff', emoji: '✨', rarity: 'epic', ingredients: 5, description: 'Channel cosmic power' },
  
  // Legendary (6 ingredients)
  { id: 'excalibur', name: 'Excalibur', emoji: '⚔️', rarity: 'legendary', ingredients: 6, description: 'The sword of kings' },
  { id: 'aegis', name: 'Aegis of Gods', emoji: '🛡️', rarity: 'legendary', ingredients: 6, description: 'Divine protection' },
  { id: 'infinity_gauntlet', name: 'Infinity Gauntlet', emoji: '🧤', rarity: 'legendary', ingredients: 6, description: 'Ultimate power' },
];
