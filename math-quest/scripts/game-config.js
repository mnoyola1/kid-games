// ==================== MATH QUEST CONFIGURATION ====================

// Difficulty Levels
const DIFFICULTY_LEVELS = {
  easy: {
    name: 'Easy',
    icon: '🌱',
    description: 'Perfect for learning!',
    operations: ['addition', 'subtraction'],
    numberRange: { min: 1, max: 20 },
    xpMultiplier: 0.8,
    coinMultiplier: 0.8
  },
  medium: {
    name: 'Medium',
    icon: '⚔️',
    description: 'A good challenge!',
    operations: ['addition', 'subtraction', 'multiplication'],
    numberRange: { min: 1, max: 50 },
    xpMultiplier: 1.0,
    coinMultiplier: 1.0
  },
  hard: {
    name: 'Hard',
    icon: '🔥',
    description: 'For math masters!',
    operations: ['addition', 'subtraction', 'multiplication', 'division'],
    numberRange: { min: 1, max: 100 },
    xpMultiplier: 1.5,
    coinMultiplier: 1.5
  }
};

// Areas/Regions
const AREAS = [
  {
    id: 'meadow',
    name: 'Peaceful Meadow',
    icon: '🌿',
    description: 'A calm starting area perfect for beginners',
    bgGradient: 'from-green-900 via-emerald-800 to-green-900',
    enemies: ['slime', 'rabbit'],
    difficulty: 'easy',
    unlocked: true
  },
  {
    id: 'forest',
    name: 'Mystic Forest',
    icon: '🌲',
    description: 'Dense woods filled with magical creatures',
    bgGradient: 'from-amber-900 via-orange-800 to-amber-900',
    enemies: ['wolf', 'spider'],
    difficulty: 'medium',
    unlocked: false
  },
  {
    id: 'mountain',
    name: 'Crystal Mountain',
    icon: '⛰️',
    description: 'Towering peaks with crystal guardians',
    bgGradient: 'from-blue-900 via-indigo-800 to-blue-900',
    enemies: ['golem', 'dragon'],
    difficulty: 'hard',
    unlocked: false
  },
  {
    id: 'castle',
    name: 'Dark Castle',
    icon: '🏰',
    description: 'The final challenge - defeat the Math King!',
    bgGradient: 'from-purple-900 via-violet-800 to-purple-900',
    enemies: ['knight', 'king'],
    difficulty: 'hard',
    unlocked: false,
    isBossArea: true
  }
];

// Enemy Types
const ENEMIES = {
  slime: {
    name: 'Slime',
    emoji: '🟢',
    hp: 20,
    attack: 5,
    xpReward: 10,
    coinReward: 5,
    difficulty: 'easy'
  },
  rabbit: {
    name: 'Bunny',
    emoji: '🐰',
    hp: 15,
    attack: 8,
    xpReward: 12,
    coinReward: 6,
    difficulty: 'easy'
  },
  wolf: {
    name: 'Forest Wolf',
    emoji: '🐺',
    hp: 40,
    attack: 12,
    xpReward: 25,
    coinReward: 12,
    difficulty: 'medium'
  },
  spider: {
    name: 'Giant Spider',
    emoji: '🕷️',
    hp: 35,
    attack: 15,
    xpReward: 22,
    coinReward: 10,
    difficulty: 'medium'
  },
  golem: {
    name: 'Crystal Golem',
    emoji: '🗿',
    hp: 80,
    attack: 20,
    xpReward: 50,
    coinReward: 25,
    difficulty: 'hard'
  },
  dragon: {
    name: 'Fire Dragon',
    emoji: '🐉',
    hp: 100,
    attack: 25,
    xpReward: 75,
    coinReward: 35,
    difficulty: 'hard'
  },
  knight: {
    name: 'Dark Knight',
    emoji: '⚔️',
    hp: 120,
    attack: 30,
    xpReward: 100,
    coinReward: 50,
    difficulty: 'hard'
  },
  king: {
    name: 'Math King',
    emoji: '👑',
    hp: 200,
    attack: 40,
    xpReward: 200,
    coinReward: 100,
    difficulty: 'hard',
    isBoss: true
  }
};

// Math Problem Generator
function generateMathProblem(difficulty) {
  const config = DIFFICULTY_LEVELS[difficulty];
  const operation = config.operations[Math.floor(Math.random() * config.operations.length)];
  const { min, max } = config.numberRange;
  
  let a, b, answer, question;
  
  switch (operation) {
    case 'addition':
      a = Math.floor(Math.random() * (max - min + 1)) + min;
      b = Math.floor(Math.random() * (max - min + 1)) + min;
      answer = a + b;
      question = `${a} + ${b} = ?`;
      break;
      
    case 'subtraction':
      a = Math.floor(Math.random() * (max - min + 1)) + min;
      b = Math.floor(Math.random() * (max - min + 1)) + min;
      // Ensure positive result
      if (a < b) [a, b] = [b, a];
      answer = a - b;
      question = `${a} - ${b} = ?`;
      break;
      
    case 'multiplication':
      a = Math.floor(Math.random() * 12) + 1; // 1-12 times tables
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      question = `${a} × ${b} = ?`;
      break;
      
    case 'division':
      b = Math.floor(Math.random() * 12) + 1;
      answer = Math.floor(Math.random() * 12) + 1;
      a = b * answer; // Ensure whole number result
      question = `${a} ÷ ${b} = ?`;
      break;
  }
  
  // Generate wrong answers
  const wrongAnswers = [];
  while (wrongAnswers.length < 3) {
    const wrong = answer + Math.floor(Math.random() * 20) - 10;
    if (wrong !== answer && wrong > 0 && !wrongAnswers.includes(wrong)) {
      wrongAnswers.push(wrong);
    }
  }
  
  // Shuffle answers
  const allAnswers = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
  
  return {
    question,
    answer,
    answers: allAnswers,
    operation,
    difficulty
  };
}

// Player Stats
const PLAYER_STATS = {
  maxHP: 100,
  attack: 10,
  level: 1,
  xp: 0,
  xpToNext: 50
};

// Utility Functions
const randomFrom = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
