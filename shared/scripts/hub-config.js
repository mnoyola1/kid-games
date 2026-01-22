// ==================== GAME DATA ====================
const GAMES = [
  {
    id: 'spell-siege',
    name: 'Spell Siege',
    subtitle: 'Tower Defense Spelling',
    icon: '🏰',
    url: './spell-siege/index.html',
    description: 'Defend your castle from monsters by spelling words! Cast spells and upgrade defenses.',
    features: ['📝 Custom Words', '🔊 Text-to-Speech', '⬆️ Upgrades'],
    active: true
  },
  {
    id: 'canada-adventure',
    name: 'Canada Adventure',
    subtitle: 'Region Battle RPG',
    icon: '🍁',
    url: './canada-adventure/index.html',
    description: 'Battle through Canada\'s regions by answering questions! Defeat enemies and level up.',
    features: ['⚔️ RPG Battles', '🗺️ 7 Regions', '📈 Leveling'],
    active: true
  },
  {
    id: 'lumina-racer',
    name: 'Lumina Racer',
    subtitle: 'Typing Racing',
    icon: '🏎️',
    url: './lumina-racer/index.html',
    description: 'Race through magical kingdoms! Type words to boost your speed and win.',
    features: ['🏁 Racing', '⌨️ Typing', '🏆 Combos'],
    active: true
  },
  {
    id: 'word-forge',
    name: 'Word Forge',
    subtitle: 'Crafting & Spelling',
    icon: '⚒️',
    url: './word-forge/index.html',
    description: 'Become a master blacksmith! Forge magical items by spelling correctly.',
    features: ['🗡️ Crafting', '📦 Collection', '⭐ 22 Items'],
    active: true
  },
  {
    id: 'shadows-halls',
    name: 'Shadows in the Halls',
    subtitle: 'Survival Horror Lite',
    icon: '🏫',
    url: './shadows-in-the-halls/index.html',
    description: 'Trapped in an infinite school after dark! Explore and escape the shadows.',
    features: ['🔦 Survival', '🧩 Puzzles', '👻 Stealth'],
    active: false
  },
  {
    id: 'world-of-lumina',
    name: 'World of Lumina',
    subtitle: 'Fantasy Adventure',
    icon: '🦊',
    url: '#',
    description: 'Enter the magical world of Lumina! Join Aurora on an epic quest.',
    features: ['📖 Epic Story', '⚔️ Boss Battles', '👨‍👩‍👧‍👦 Family'],
    active: false
  }
];

// ==================== STATE ====================
let pendingRewardId = null;
