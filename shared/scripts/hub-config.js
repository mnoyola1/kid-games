// ==================== GAME DATA ====================
const GAMES = [
  {
    id: 'spell-quest',
    name: 'Spell Quest',
    subtitle: 'Spelling Bee RPG',
    icon: '📜',
    url: './spell-quest/index.html',
    description: 'Hear the word, inscribe the rune. The Keeper reads your handwriting and grades each spelling test like a real teacher — then drills you on the misses.',
    features: ['🗣️ Natural Voice', '✍️ Handwriting', '📸 Photo Upload', '🔁 Practice Loop'],
    active: true,
    tags: ['new']
  },
  {
    id: 'cipher-heist',
    name: 'Cipher Heist',
    subtitle: 'Hacker Heist Quiz',
    icon: '🔓',
    url: './cipher-heist/index.html',
    description: 'Crack rival vaults with skill-based deduction. Answer questions to fuel your tools, defend your code, outsmart your opponents.',
    features: ['🧠 Mastermind Logic', '🤖 Solo or Vs', '🛡 Firewalls', '⚡ Bit Surge'],
    active: true,
    tags: ['new']
  },
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
    id: 'china-adventure',
    name: 'Dragon Scrolls of China',
    subtitle: 'Ancient China RPG',
    icon: '🐉',
    url: './china-adventure/index.html',
    description: 'Journey through 7 regions of China - from Beijing to the Great Wall, Tibet, and the Silk Road. Battle guardians, collect dragon scrolls, and master real 5th-grade social-studies content in Scout or Sage mode.',
    features: ['🐉 RPG Battles', '🗺️ 7 China Regions', '🏯 Scout & Sage Modes', '📜 Dragon Scrolls'],
    active: true,
    tags: ['new']
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
    name: 'Dungeon Forge',
    subtitle: 'Roguelike Spelling',
    icon: '⚒️',
    url: './word-forge/index.html',
    description: 'Explore procedural dungeons where spelling saves your life! Battle monsters, craft items, and survive the depths in this addictive roguelike.',
    features: ['🗡️ Roguelike', '⚔️ Combat', '🎲 Procedural', '⬆️ Upgrades'],
    active: true,
    tags: ['popular']
  },
  {
    id: 'word-hunt',
    name: 'Word Hunt',
    subtitle: 'Word Search Puzzles',
    icon: '🔍',
    url: './word-hunt/index.html',
    description: 'Find hidden words in themed grids! Search horizontally, vertically, and diagonally across animals, science, space, and more.',
    features: ['🎨 6 Themes', '🔤 Multi-Direction', '⭐ Perfect Bonus', '🎯 Progress Tracking'],
    active: true,
    tags: ['new']
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
    id: 'math-mage',
    name: 'Math Mage',
    subtitle: 'Multiplication Action Arcade',
    icon: '🪄',
    url: './math-mage/index.html',
    description: 'Master your times tables by casting multiplication spells against shadowy wraiths. Per-fact mastery tracking + spaced repetition focus your weekly target table.',
    features: ['🎯 Per-Fact Mastery', '🔁 Spaced Repetition', '🎙️ Voice Narration', '⚡ Action Arcade'],
    active: true,
    tags: ['new']
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
  },
  {
    id: '99-nights-in-space',
    name: '99 Nights in Space',
    subtitle: 'Survival Horror',
    icon: '🚀',
    url: './99-nights-in-space/index.html',
    description: 'Survive 99 power cycles aboard a haunted space station. Keep the LSG fueled, explore in daylight, and endure the dark.',
    features: ['🛡️ LSG Defense', '🌑 Day/Night Cycle', '👤 3D Survival', '🛰️ Space Horror'],
    active: false
  },
  {
    id: 'crypto-quest',
    name: 'Crypto Quest',
    subtitle: 'Cryptogram Puzzles',
    icon: '🔐',
    url: './crypto-quest/index.html',
    description: 'Decode secret messages by cracking encrypted ciphers! Each letter is replaced - use logic and hints to reveal hidden wisdom.',
    features: ['🔤 Letter Substitution', '💡 Hint System', '📜 Inspiring Messages', '⏱️ Time Challenge'],
    active: false
  }
];

// ==================== STATE ====================
let pendingRewardId = null;
