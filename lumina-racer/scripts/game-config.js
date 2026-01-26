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
    bgImage: '../assets/backgrounds/lumina-racer/track_archives.png',
    description: 'Race through floating books and ancient knowledge!',
    laps: 3
  },
  { 
    id: 'calculation', 
    name: 'Calculation Fields', 
    emoji: '🔢',
    bg: 'from-cyan-900 via-blue-800 to-indigo-900',
    bgImage: '../assets/backgrounds/lumina-racer/track_calculation.png',
    description: 'Speed through geometric crystals and math symbols!',
    laps: 3
  },
  { 
    id: 'sanctuary', 
    name: 'The Sanctuary', 
    emoji: '🏰',
    bg: 'from-purple-900 via-violet-800 to-purple-900',
    bgImage: '../assets/backgrounds/lumina-racer/track_sanctuary.png',
    description: 'Dash around the magical floating castle!',
    laps: 4
  },
  { 
    id: 'fog', 
    name: 'Fog Frontier', 
    emoji: '🌫️',
    bg: 'from-slate-800 via-gray-700 to-slate-800',
    bgImage: '../assets/backgrounds/lumina-racer/track_fog.png',
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
    avatar: '../assets/Emma_Lumina.png',
    portrait: '../assets/sprites/lumina-racer/emma_portrait_rgba.png',
    vehicle: '../assets/sprites/lumina-racer/emma_vehicle_rgba.png'
  },
  liam: {
    name: 'Liam', 
    title: 'The Scout',
    emoji: '⚔️',
    color: 'orange',
    special: 'Quick Instinct',
    specialDesc: 'Bonus boost for fast answers',
    avatar: '../assets/Liam_Lumina.png',
    portrait: '../assets/sprites/lumina-racer/liam_portrait_rgba.png',
    vehicle: '../assets/sprites/lumina-racer/liam_vehicle_rgba.png'
  }
};

const AI_RACERS = [
  { name: 'Shadow Runner', emoji: '👻', color: '#6b7280', difficulty: 0.35, vehicle: '../assets/sprites/lumina-racer/shadow_runner_vehicle_rgba.png' },
  { name: 'Crystal Dasher', emoji: '💎', color: '#06b6d4', difficulty: 0.45, vehicle: '../assets/sprites/lumina-racer/crystal_dasher_vehicle_rgba.png' },
  { name: 'Storm Chaser', emoji: '⚡', color: '#f59e0b', difficulty: 0.55, vehicle: '../assets/sprites/lumina-racer/storm_chaser_vehicle_rgba.png' },
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

// Aurora the Fox companion
const AURORA = {
  name: 'Aurora',
  portrait: '../assets/sprites/lumina-racer/aurora_fox_rgba.png',
  cheering: '../assets/sprites/lumina-racer/aurora_cheering_rgba.png'
};

// Game assets
const GAME_ASSETS = {
  backgrounds: {
    menuMain: '../assets/backgrounds/lumina-racer/menu_main.png',
    victory: '../assets/backgrounds/lumina-racer/screen_victory.png'
  },
  effects: {
    correct: '../assets/sprites/lumina-racer/effect_correct.png',
    wrong: '../assets/sprites/lumina-racer/effect_wrong.png',
    finish: '../assets/sprites/lumina-racer/effect_finish.png'
  },
  powerups: {
    speed: '../assets/sprites/lumina-racer/powerup_speed_rgba.png',
    shield: '../assets/sprites/lumina-racer/powerup_shield_rgba.png',
    timeSlow: '../assets/sprites/lumina-racer/powerup_timeslow_rgba.png'
  }
};

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
const randomFrom = arr => arr[Math.floor(Math.random() * arr.length)];
