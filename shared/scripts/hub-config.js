// ==================== GAME DATA ====================
const GAMES = [
  {
    id: 'spell-siege',
    name: 'Spell Siege',
    subtitle: 'Tower Defense Spelling',
    icon: '🏰',
    url: './spell-siege/index.html',
    description: 'Defend your castle from invading monsters by typing words correctly! Cast magical spells, earn coins, and upgrade your defenses.',
    features: ['📝 Custom Words', '🔊 Text-to-Speech', '⬆️ Upgrades', '🎵 Epic Music'],
    active: true,
    tags: ['popular']
  },
  {
    id: 'canada-adventure',
    name: 'Canada Adventure',
    subtitle: 'Region Battle RPG',
    icon: '🍁',
    url: './canada-adventure/index.html',
    description: 'Battle through Canada\'s regions by answering questions! Defeat enemies, earn coins, and level up your explorer.',
    features: ['⚔️ RPG Battles', '🗺️ 7 Regions', '🔋 Power-ups', '📈 Leveling'],
    active: true
  },
  {
    id: 'lumina-racer',
    name: 'Lumina Racer',
    subtitle: 'Typing Racing',
    icon: '🏎️',
    url: './lumina-racer/index.html',
    description: 'Race through magical kingdoms! Type words to boost your speed and compete against Aurora\'s friends.',
    features: ['🏁 Racing', '⌨️ Typing', '🔥 Aurora', '🎯 Combos'],
    active: true
  },
  {
    id: 'word-forge',
    name: 'Word Forge',
    subtitle: 'Crafting & Spelling',
    icon: '⚒️',
    url: './word-forge/index.html',
    description: 'Become a master blacksmith! Forge magical items and weapons by spelling correctly.',
    features: ['🗡️ Crafting', '📦 Collection', '⭐ Items', '🎨 Pixel Art'],
    active: true
  },
  {
    id: 'shadows-in-the-halls',
    name: 'Shadows in the Halls',
    subtitle: 'Survival Horror Lite',
    icon: '🏫',
    url: './shadows-in-the-halls/index.html',
    description: 'Escape the infinite school! Solve puzzles, avoid shadows, and survive before your flashlight dies.',
    features: ['🔦 Battery Management', '🧩 Math & Word Puzzles', '👻 Stealth', '🗺️ Exploration'],
    active: true
  },
  {
    id: 'math-quest',
    name: 'Math Quest',
    subtitle: 'Adventure RPG',
    icon: '⚔️',
    url: './math-quest/index.html',
    description: 'Embark on an epic adventure through the Numbers Realm! Defeat monsters with math and save the kingdom!',
    features: ['⚔️ RPG Combat', '🧮 Math Problems', '🎯 Combos', '🏆 Progression'],
    active: true
  },
  {
    id: 'rhythm-academy',
    name: 'Rhythm Academy',
    subtitle: 'Music Learning',
    icon: '🎵',
    url: './rhythm-academy/index.html',
    description: 'Hit notes to the beat while learning! Master rhythm and education in one epic game!',
    features: ['🎵 Rhythm Gameplay', '📚 Educational Questions', '🔥 Combos', '⭐ Star Ratings'],
    active: true,
    tags: ['new']
  },
  {
    id: 'piano-path',
    name: 'Piano Path',
    subtitle: 'Piano Learning',
    icon: '🎹',
    url: './piano-path/index.html',
    description: 'Learn real songs by following glowing piano keys. Play along on your piano and build mastery!',
    features: ['✨ Guided Lights', '🎯 Practice Mode', '🏆 Star Ratings', '🎵 Real Songs'],
    active: true,
    tags: ['new']
  },
  {
    id: 'pixel-quest',
    name: 'Pixel Quest',
    subtitle: 'Educational Platformer',
    icon: '🎮',
    url: './pixel-quest/index.html',
    description: 'Jump and run through educational worlds! Solve challenges and collect stars!',
    features: ['🦘 Platforming', '🧩 Checkpoint Challenges', '⭐ Star Collection', '🌍 Multiple Worlds'],
    active: true,
    tags: ['new']
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
