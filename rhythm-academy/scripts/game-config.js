// ==================== RHYTHM ACADEMY CONFIGURATION ====================

// Difficulty Levels
const DIFFICULTY_LEVELS = {
  easy: {
    name: 'Easy',
    icon: '🌱',
    lanes: 4,
    noteSpeed: 200, // pixels per second
    perfectWindow: 150, // milliseconds
    goodWindow: 300,
    questionTypes: ['spelling', 'addition', 'subtraction']
  },
  medium: {
    name: 'Medium',
    icon: '⚔️',
    lanes: 5,
    noteSpeed: 250,
    perfectWindow: 120,
    goodWindow: 250,
    questionTypes: ['spelling', 'addition', 'subtraction', 'multiplication', 'geography']
  },
  hard: {
    name: 'Hard',
    icon: '🔥',
    lanes: 6,
    noteSpeed: 300,
    perfectWindow: 100,
    goodWindow: 200,
    questionTypes: ['spelling', 'multiplication', 'division', 'geography', 'science']
  }
};

// Songs
const SONGS = [
  {
    id: 'song1',
    name: 'Learning Beat',
    icon: '🎵',
    description: 'A fun introduction to rhythm!',
    musicFile: 'song1_easy.mp3',
    bpm: 120,
    duration: 60, // seconds
    difficulty: 'easy',
    unlocked: true,
    notePattern: [
      { time: 0, lane: 0, question: null },
      { time: 0.5, lane: 1, question: null },
      { time: 1, lane: 2, question: null },
      { time: 1.5, lane: 3, question: null },
      { time: 2, lane: 0, question: 'spelling' },
      { time: 2.5, lane: 1, question: 'math' },
      { time: 3, lane: 2, question: null },
      { time: 3.5, lane: 3, question: 'spelling' },
      // Pattern continues...
    ]
  },
  {
    id: 'song2',
    name: 'Math Melody',
    icon: '🎶',
    description: 'Master math to the beat!',
    musicFile: 'song2_medium.mp3',
    bpm: 140,
    duration: 90,
    difficulty: 'medium',
    unlocked: false,
    notePattern: []
  },
  {
    id: 'song3',
    name: 'Epic Challenge',
    icon: '🎸',
    description: 'The ultimate rhythm test!',
    musicFile: 'song3_hard.mp3',
    bpm: 160,
    duration: 120,
    difficulty: 'hard',
    unlocked: false,
    notePattern: []
  }
];

// Question Generators
function generateSpellingQuestion(difficulty) {
  const words = {
    easy: ['cat', 'dog', 'sun', 'moon', 'star', 'tree', 'bird', 'fish'],
    medium: ['ocean', 'forest', 'castle', 'dragon', 'magic', 'adventure', 'explore', 'discover'],
    hard: ['challenge', 'mystery', 'journey', 'treasure', 'courage', 'wisdom', 'victory', 'legend']
  };
  
  const wordList = words[difficulty] || words.easy;
  const word = wordList[Math.floor(Math.random() * wordList.length)];
  
  return {
    type: 'spelling',
    question: `Spell: ${word}`,
    answer: word.toLowerCase(),
    wrongAnswers: generateWrongSpellings(word)
  };
}

function generateMathQuestion(difficulty) {
  let a, b, answer, question;
  
  if (difficulty === 'easy') {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    answer = a + b;
    question = `${a} + ${b} = ?`;
  } else if (difficulty === 'medium') {
    const op = Math.random() > 0.5 ? '+' : '-';
    a = Math.floor(Math.random() * 50) + 1;
    b = Math.floor(Math.random() * 50) + 1;
    if (op === '-') {
      if (a < b) [a, b] = [b, a];
      answer = a - b;
      question = `${a} - ${b} = ?`;
    } else {
      answer = a + b;
      question = `${a} + ${b} = ?`;
    }
  } else {
    const ops = ['+', '-', '×', '÷'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    if (op === '×') {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      question = `${a} × ${b} = ?`;
    } else if (op === '÷') {
      b = Math.floor(Math.random() * 12) + 1;
      answer = Math.floor(Math.random() * 12) + 1;
      a = b * answer;
      question = `${a} ÷ ${b} = ?`;
    } else if (op === '+') {
      a = Math.floor(Math.random() * 100) + 1;
      b = Math.floor(Math.random() * 100) + 1;
      answer = a + b;
      question = `${a} + ${b} = ?`;
    } else {
      a = Math.floor(Math.random() * 100) + 1;
      b = Math.floor(Math.random() * 100) + 1;
      if (a < b) [a, b] = [b, a];
      answer = a - b;
      question = `${a} - ${b} = ?`;
    }
  }
  
  return {
    type: 'math',
    question,
    answer: answer.toString(),
    wrongAnswers: generateWrongMathAnswers(answer)
  };
}

function generateGeographyQuestion(difficulty) {
  const questions = {
    easy: [
      { q: 'What is the capital of Canada?', a: 'Ottawa', wrong: ['Toronto', 'Vancouver', 'Montreal'] },
      { q: 'What is the largest ocean?', a: 'Pacific', wrong: ['Atlantic', 'Indian', 'Arctic'] },
      { q: 'How many continents are there?', a: '7', wrong: ['5', '6', '8'] }
    ],
    medium: [
      { q: 'What is the longest river in the world?', a: 'Nile', wrong: ['Amazon', 'Mississippi', 'Yangtze'] },
      { q: 'What is the smallest country?', a: 'Vatican City', wrong: ['Monaco', 'San Marino', 'Liechtenstein'] },
      { q: 'What is the highest mountain?', a: 'Mount Everest', wrong: ['K2', 'Kilimanjaro', 'Denali'] }
    ],
    hard: [
      { q: 'What is the capital of Australia?', a: 'Canberra', wrong: ['Sydney', 'Melbourne', 'Perth'] },
      { q: 'Which country has the most time zones?', a: 'France', wrong: ['Russia', 'USA', 'China'] },
      { q: 'What is the driest desert?', a: 'Atacama', wrong: ['Sahara', 'Gobi', 'Kalahari'] }
    ]
  };
  
  const qList = questions[difficulty] || questions.easy;
  const selected = qList[Math.floor(Math.random() * qList.length)];
  
  return {
    type: 'geography',
    question: selected.q,
    answer: selected.a,
    wrongAnswers: selected.wrong
  };
}

function generateQuestion(type, difficulty) {
  switch (type) {
    case 'spelling':
      return generateSpellingQuestion(difficulty);
    case 'math':
    case 'addition':
    case 'subtraction':
    case 'multiplication':
    case 'division':
      return generateMathQuestion(difficulty);
    case 'geography':
      return generateGeographyQuestion(difficulty);
    default:
      return generateSpellingQuestion(difficulty);
  }
}

function generateWrongSpellings(word) {
  const wrong = [];
  while (wrong.length < 3) {
    let wrongWord = word.split('').sort(() => Math.random() - 0.5).join('');
    if (wrongWord !== word && !wrong.includes(wrongWord)) {
      wrong.push(wrongWord);
    }
  }
  return wrong;
}

function generateWrongMathAnswers(correct) {
  const wrong = [];
  const correctNum = parseInt(correct);
  while (wrong.length < 3) {
    const offset = Math.floor(Math.random() * 20) - 10;
    const wrongAns = (correctNum + offset).toString();
    if (wrongAns !== correct && wrongAns !== '0' && !wrong.includes(wrongAns)) {
      wrong.push(wrongAns);
    }
  }
  return wrong;
}

// Utility
const randomFrom = arr => arr[Math.floor(Math.random() * arr.length)];
