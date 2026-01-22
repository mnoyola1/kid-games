// ==================== CONSTANTS ====================
const DEFAULT_WORDS = [
  'magic', 'crystal', 'aurora', 'light', 'spark', 'glow', 'shine', 'star',
  'dream', 'wish', 'hope', 'brave', 'swift', 'dash', 'zoom', 'speed',
  'flame', 'frost', 'wind', 'storm', 'thunder', 'shadow', 'spirit', 'soul',
  'quest', 'hero', 'power', 'energy', 'force', 'boost', 'turbo', 'flash'
];

// Liam's contraction words
const LIAM_WORDS = [
  "won't", "aren't", "haven't", "he'd", "hasn't", "doesn't",
  "we'd", "hadn't", "weren't", "they'd", "i'm", "shouldn't",
  "they're", "i'd", "wouldn't", "should've", "would've", "couldn't"
];

const TRACKS = [
  { 
    id: 'archives', 
    name: 'The Archives', 
    emoji: '📚',
    bg: 'from-amber-900 via-orange-800 to-amber-900',
    description: 'Race through floating books and ancient knowledge!',
    laps: 3
  },
  { 
    id: 'calculation', 
    name: 'Calculation Fields', 
    emoji: '🔢',
    bg: 'from-cyan-900 via-blue-800 to-indigo-900',
    description: 'Speed through geometric crystals and math symbols!',
    laps: 3
  },
  { 
    id: 'sanctuary', 
    name: 'The Sanctuary', 
    emoji: '🏰',
    bg: 'from-purple-900 via-violet-800 to-purple-900',
    description: 'Dash around the magical floating castle!',
    laps: 4
  },
  { 
    id: 'fog', 
    name: 'Fog Frontier', 
    emoji: '🌫️',
    bg: 'from-slate-800 via-gray-700 to-slate-800',
    description: 'Brave the mysterious edge of The Fog!',
    laps: 5
  }
];

const CHARACTERS = {
  emma: {
    name: 'Emma',
    title: 'The Sage',
    emoji: '🧙‍♀️',
    color: 'purple',
    special: 'Deep Focus',
    specialDesc: 'Extra time on hard words',
    avatar: '../assets/Emma_Lumina.png'
  },
  liam: {
    name: 'Liam', 
    title: 'The Scout',
    emoji: '⚔️',
    color: 'orange',
    special: 'Quick Instinct',
    specialDesc: 'Bonus boost for fast answers',
    avatar: '../assets/Liam_Lumina.png'
  }
};

const AI_RACERS = [
  { name: 'Shadow Runner', emoji: '👻', color: '#6b7280', difficulty: 0.35 },
  { name: 'Crystal Dasher', emoji: '💎', color: '#06b6d4', difficulty: 0.45 },
  { name: 'Storm Chaser', emoji: '⚡', color: '#f59e0b', difficulty: 0.55 },
];

const AURORA_COMMENTS = {
  start: [
    "Let's GO! May the words be with you! ✨",
    "Time to race! Remember, spelling is speed! 🦊",
    "Ready, set, TYPE! I believe in you! 💫"
  ],
  correct: [
    "YES! That's the spirit! 🔥",
    "Perfect! Keep that momentum! ⚡",
    "Brilliant spelling! You're flying! 🌟",
    "Magnificent! The Fog doesn't stand a chance! 💜"
  ],
  wrong: [
    "Oops! Shake it off, you've got this! 💪",
    "Close! Try the next one! 🦊",
    "Even I make mistakes... sometimes... rarely... 😅"
  ],
  boost: [
    "TURBO TIME! 🚀",
    "MAXIMUM OVERDRIVE! ⚡",
    "WHOOOOSH! 💨"
  ],
  winning: [
    "You're in the lead! Don't look back! 👀",
    "FIRST PLACE! Keep typing! 🥇"
  ],
  losing: [
    "You can catch up! Type faster! 📝",
    "Don't give up! Every word counts! 💜"
  ],
  finish: [
    "INCREDIBLE! You did it! 🎉",
    "VICTORY! The Sanctuary celebrates! 🏆",
    "CHAMPION! Step and Terra would be proud! ❤️"
  ],
  lostRace: [
    "Good effort! Practice makes perfect! 💪",
    "You'll get them next time! I know it! 🦊"
  ]
};

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
const randomFrom = arr => arr[Math.floor(Math.random() * arr.length)];
