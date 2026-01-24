// ==================== PIXEL QUEST CONFIGURATION ====================

// Worlds
const WORLDS = [
  {
    id: 'math',
    name: 'Math World',
    icon: '🔢',
    description: 'Numbers and equations everywhere!',
    bgGradient: 'from-blue-900 via-cyan-800 to-blue-900',
    unlocked: true,
    levels: 3
  },
  {
    id: 'science',
    name: 'Science World',
    icon: '🔬',
    description: 'Discover the wonders of science!',
    bgGradient: 'from-green-900 via-emerald-800 to-green-900',
    unlocked: false,
    levels: 3
  },
  {
    id: 'history',
    name: 'History World',
    icon: '🏛️',
    description: 'Journey through time!',
    bgGradient: 'from-amber-900 via-orange-800 to-amber-900',
    unlocked: false,
    levels: 3
  },
  {
    id: 'language',
    name: 'Language World',
    icon: '📚',
    description: 'Words and stories await!',
    bgGradient: 'from-purple-900 via-pink-800 to-purple-900',
    unlocked: false,
    levels: 3
  },
  {
    id: 'boss',
    name: 'Final Challenge',
    icon: '👑',
    description: 'The ultimate test!',
    bgGradient: 'from-red-900 via-rose-800 to-red-900',
    unlocked: false,
    levels: 1
  }
];

// Level Generator
function generateLevel(worldId, levelNum, difficulty = 'normal') {
  const level = {
    id: `${worldId}_level${levelNum}`,
    worldId,
    levelNum,
    width: 2000, // pixels
    height: 800,
    platforms: [],
    collectibles: [],
    enemies: [],
    checkpoints: [],
    startX: 50,
    startY: 600,
    endX: 1950,
    endY: 600
  };
  
  // Generate platforms based on world theme
  if (worldId === 'math') {
    // Math-themed platforms (numbers, equations)
    level.platforms = [
      { x: 0, y: 700, width: 200, height: 20, type: 'ground' },
      { x: 250, y: 650, width: 150, height: 20, type: 'platform' },
      { x: 450, y: 600, width: 150, height: 20, type: 'platform' },
      { x: 650, y: 550, width: 150, height: 20, type: 'platform' },
      { x: 850, y: 500, width: 200, height: 20, type: 'checkpoint' }, // Checkpoint platform
      { x: 1100, y: 550, width: 150, height: 20, type: 'platform' },
      { x: 1300, y: 600, width: 150, height: 20, type: 'platform' },
      { x: 1500, y: 650, width: 150, height: 20, type: 'platform' },
      { x: 1700, y: 700, width: 300, height: 20, type: 'ground' }
    ];
    
    // Add checkpoint
    level.checkpoints.push({
      x: 950,
      y: 480,
      question: null, // Will be generated when reached
      activated: false
    });
    
    // Add collectibles (coins)
    for (let i = 0; i < 10; i++) {
      level.collectibles.push({
        id: `coin_${i}`,
        x: 300 + i * 150,
        y: 500 + Math.sin(i) * 50,
        type: 'coin',
        collected: false
      });
    }
    
    // Add stars (3 per level)
    level.collectibles.push(
      { id: 'star_1', x: 500, y: 550, type: 'star', collected: false },
      { id: 'star_2', x: 1200, y: 550, type: 'star', collected: false },
      { id: 'star_3', x: 1800, y: 650, type: 'star', collected: false }
    );
    
    // Add enemies
    level.enemies.push(
      { id: 'enemy_1', x: 400, y: 620, width: 40, height: 40, speed: 50, direction: 1, type: 'basic' },
      { id: 'enemy_2', x: 1150, y: 570, width: 40, height: 40, speed: 50, direction: -1, type: 'basic' }
    );
  } else {
    // Generic level structure for other worlds
    level.platforms = [
      { x: 0, y: 700, width: 200, height: 20, type: 'ground' },
      { x: 300, y: 650, width: 150, height: 20, type: 'platform' },
      { x: 600, y: 600, width: 200, height: 20, type: 'checkpoint' },
      { x: 900, y: 550, width: 150, height: 20, type: 'platform' },
      { x: 1200, y: 600, width: 150, height: 20, type: 'platform' },
      { x: 1500, y: 650, width: 150, height: 20, type: 'platform' },
      { x: 1700, y: 700, width: 300, height: 20, type: 'ground' }
    ];
    
    level.checkpoints.push({
      x: 700,
      y: 580,
      question: null,
      activated: false
    });
    
    for (let i = 0; i < 8; i++) {
      level.collectibles.push({
        id: `coin_${i}`,
        x: 350 + i * 180,
        y: 500 + Math.sin(i) * 50,
        type: 'coin',
        collected: false
      });
    }
    
    level.collectibles.push(
      { id: 'star_1', x: 500, y: 600, type: 'star', collected: false },
      { id: 'star_2', x: 1000, y: 500, type: 'star', collected: false },
      { id: 'star_3', x: 1600, y: 600, type: 'star', collected: false }
    );
  }
  
  return level;
}

// Question Generators (reuse from rhythm-academy or create new)
function generateMathQuestion(difficulty) {
  let a, b, answer, question;
  
  if (difficulty === 'easy') {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    answer = a + b;
    question = `${a} + ${b} = ?`;
  } else {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    if (op === '+') {
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      answer = a + b;
      question = `${a} + ${b} = ?`;
    } else if (op === '-') {
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      if (a < b) [a, b] = [b, a];
      answer = a - b;
      question = `${a} - ${b} = ?`;
    } else {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      question = `${a} × ${b} = ?`;
    }
  }
  
  const wrongAnswers = [];
  while (wrongAnswers.length < 3) {
    const wrong = answer + Math.floor(Math.random() * 20) - 10;
    if (wrong !== answer && wrong > 0 && !wrongAnswers.includes(wrong)) {
      wrongAnswers.push(wrong);
    }
  }
  
  return {
    type: 'math',
    question,
    answer: answer.toString(),
    wrongAnswers: wrongAnswers.map(a => a.toString())
  };
}

function generateSpellingQuestion(difficulty) {
  const words = {
    easy: ['cat', 'dog', 'sun', 'moon', 'star', 'tree'],
    medium: ['ocean', 'forest', 'castle', 'dragon', 'magic'],
    hard: ['challenge', 'mystery', 'journey', 'treasure', 'courage']
  };
  
  const wordList = words[difficulty] || words.easy;
  const word = wordList[Math.floor(Math.random() * wordList.length)];
  
  return {
    type: 'spelling',
    question: `Spell: ${word}`,
    answer: word.toLowerCase(),
    wrongAnswers: [
      word.split('').sort(() => Math.random() - 0.5).join(''),
      word.slice(0, -1) + word[0],
      word[word.length - 1] + word.slice(0, -1)
    ]
  };
}

function generateQuestion(worldId, difficulty = 'easy') {
  if (worldId === 'math') {
    return generateMathQuestion(difficulty);
  } else if (worldId === 'language') {
    return generateSpellingQuestion(difficulty);
  } else {
    // Default to math for other worlds
    return generateMathQuestion(difficulty);
  }
}

// Player Physics Constants
const PHYSICS = {
  gravity: 800, // pixels per second squared
  jumpVelocity: -400, // pixels per second (negative = up)
  moveSpeed: 200, // pixels per second
  maxFallSpeed: 600,
  groundFriction: 0.8
};

// Utility
const randomFrom = arr => arr[Math.floor(Math.random() * arr.length)];
