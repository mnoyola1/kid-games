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
    cardImage: '../assets/backgrounds/lumina-racer/track_archives.png',
    description: 'Race through floating books and ancient knowledge!',
    laps: 3,
    order: 1,
    difficulty: 'Focus Warmup',
    unlocked: true
  },
  { 
    id: 'calculation', 
    name: 'Calculation Fields', 
    emoji: '🔢',
    bg: 'from-cyan-900 via-blue-800 to-indigo-900',
    bgImage: '../assets/backgrounds/lumina-racer/track_calculation.png',
    cardImage: '../assets/backgrounds/lumina-racer/track_calculation.png',
    description: 'Speed through geometric crystals and math symbols!',
    laps: 3,
    order: 2,
    difficulty: 'Logic Sprint',
    unlocked: true
  },
  { 
    id: 'sanctuary', 
    name: 'The Sanctuary', 
    emoji: '🏰',
    bg: 'from-purple-900 via-violet-800 to-purple-900',
    bgImage: '../assets/backgrounds/lumina-racer/track_sanctuary.png',
    cardImage: '../assets/backgrounds/lumina-racer/track_sanctuary.png',
    description: 'Dash around the magical floating castle!',
    laps: 4,
    order: 3,
    difficulty: 'Endurance Run',
    unlocked: true
  },
  { 
    id: 'fog', 
    name: 'Fog Frontier', 
    emoji: '🌫️',
    bg: 'from-slate-800 via-gray-700 to-slate-800',
    bgImage: '../assets/backgrounds/lumina-racer/track_fog.png',
    cardImage: '../assets/backgrounds/lumina-racer/track_fog.png',
    description: 'Brave the mysterious edge of The Fog!',
    laps: 5,
    order: 4,
    difficulty: 'Mastery Trial',
    unlocked: true
  },
  { 
    id: 'starlight', 
    name: 'Starlight Circuit', 
    emoji: '🌌',
    bg: 'from-indigo-900 via-sky-900 to-slate-900',
    bgImage: '../assets/backgrounds/lumina-racer/track_starlight.png',
    cardImage: '../assets/backgrounds/lumina-racer/track_starlight.png',
    description: 'Glide through cosmic lanes and aurora streams!',
    laps: 4,
    order: 5,
    difficulty: 'Starstride',
    unlocked: false
  },
  { 
    id: 'pulse', 
    name: 'Pulse Canyon', 
    emoji: '⚡',
    bg: 'from-red-900 via-fuchsia-900 to-purple-900',
    bgImage: '../assets/backgrounds/lumina-racer/track_pulse.png',
    cardImage: '../assets/backgrounds/lumina-racer/track_pulse.png',
    description: 'Ride the neon canyon pulse waves!',
    laps: 5,
    order: 6,
    difficulty: 'Final Surge',
    unlocked: false
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
    vehicle: '../assets/sprites/lumina-racer/emma_vehicle_rgba.png',
    wordList: 'default',
    ui: {
      borderClass: 'border-purple-500/50 hover:border-purple-400',
      glowClass: 'hover:shadow-[0_0_30px_rgba(147,51,234,0.3)]',
      titleClass: 'text-purple-400'
    }
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
    vehicle: '../assets/sprites/lumina-racer/liam_vehicle_rgba.png',
    wordList: 'liam',
    ui: {
      borderClass: 'border-orange-500/50 hover:border-orange-400',
      glowClass: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]',
      titleClass: 'text-orange-400'
    }
  },
  mario: {
    name: 'Mario',
    title: 'The Builder',
    emoji: '🛠️',
    color: 'emerald',
    special: 'Steady Hands',
    specialDesc: 'Keeps calm under pressure',
    avatar: '../assets/mario_step_profile.png',
    portrait: '../assets/sprites/lumina-racer/mario_portrait_rgba.png',
    vehicle: '../assets/sprites/lumina-racer/mario_vehicle_rgba.png',
    wordList: 'default',
    ui: {
      borderClass: 'border-emerald-500/50 hover:border-emerald-400',
      glowClass: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.35)]',
      titleClass: 'text-emerald-400'
    }
  },
  adri: {
    name: 'Adri',
    title: 'The Navigator',
    emoji: '🧭',
    color: 'rose',
    special: 'Calm Precision',
    specialDesc: 'Stays on track with style',
    avatar: '../assets/adriana_terra_profile.png',
    portrait: '../assets/sprites/lumina-racer/adri_portrait_rgba.png',
    vehicle: '../assets/sprites/lumina-racer/adri_vehicle_rgba.png',
    wordList: 'default',
    ui: {
      borderClass: 'border-rose-500/50 hover:border-rose-400',
      glowClass: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.35)]',
      titleClass: 'text-rose-400'
    }
  },
  guest: {
    name: 'Guest',
    title: 'The Drifter',
    emoji: '🎫',
    color: 'sky',
    special: 'Wild Card',
    specialDesc: 'Ready for any track',
    avatar: '../assets/guest-avatar.svg',
    portrait: '../assets/sprites/lumina-racer/guest_portrait_rgba.png',
    vehicle: '../assets/sprites/lumina-racer/guest_vehicle_rgba.png',
    wordList: 'default',
    ui: {
      borderClass: 'border-sky-500/50 hover:border-sky-400',
      glowClass: 'hover:shadow-[0_0_30px_rgba(56,189,248,0.35)]',
      titleClass: 'text-sky-400'
    }
  },
  nova: {
    name: 'Nova',
    title: 'The Comet',
    emoji: '☄️',
    color: 'teal',
    special: 'Sky Burst',
    specialDesc: 'Blazes through combos',
    avatar: '../assets/sprites/lumina-racer/nova_portrait_rgba.png',
    portrait: '../assets/sprites/lumina-racer/nova_portrait_rgba.png',
    vehicle: '../assets/sprites/lumina-racer/nova_vehicle_rgba.png',
    wordList: 'default',
    ui: {
      borderClass: 'border-teal-500/50 hover:border-teal-400',
      glowClass: 'hover:shadow-[0_0_30px_rgba(20,184,166,0.35)]',
      titleClass: 'text-teal-400'
    }
  },
  kai: {
    name: 'Kai',
    title: 'The Wave',
    emoji: '🌊',
    color: 'cyan',
    special: 'Flow State',
    specialDesc: 'Smooth and steady rhythm',
    avatar: '../assets/sprites/lumina-racer/kai_portrait_rgba.png',
    portrait: '../assets/sprites/lumina-racer/kai_portrait_rgba.png',
    vehicle: '../assets/sprites/lumina-racer/kai_vehicle_rgba.png',
    wordList: 'default',
    ui: {
      borderClass: 'border-cyan-500/50 hover:border-cyan-400',
      glowClass: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.35)]',
      titleClass: 'text-cyan-400'
    }
  },
  zara: {
    name: 'Zara',
    title: 'The Spark',
    emoji: '✨',
    color: 'amber',
    special: 'Radiant Boost',
    specialDesc: 'Lights up the track',
    avatar: '../assets/sprites/lumina-racer/zara_portrait_rgba.png',
    portrait: '../assets/sprites/lumina-racer/zara_portrait_rgba.png',
    vehicle: '../assets/sprites/lumina-racer/zara_vehicle_rgba.png',
    wordList: 'default',
    ui: {
      borderClass: 'border-amber-500/50 hover:border-amber-400',
      glowClass: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.35)]',
      titleClass: 'text-amber-400'
    }
  }
};

const AI_DIFFICULTY_TIERS = [
  { label: 'Rival', difficulty: 0.35 },
  { label: 'Challenger', difficulty: 0.45 },
  { label: 'Ace', difficulty: 0.55 },
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
    victory: '../assets/backgrounds/lumina-racer/screen_victory.png',
    characterSelect: '../assets/backgrounds/lumina-racer/screen_character_select.png',
    trackSelect: '../assets/backgrounds/lumina-racer/screen_track_select.png'
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
