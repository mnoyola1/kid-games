/**
 * Cipher Heist - Game Configuration
 *
 * Holds:
 *  - bits economy + timing constants
 *  - action definitions (Crack, Firewall, Bit Surge, Scan)
 *  - AI personas (Scout Bot, Sage Bot)
 *  - Vex (the Raccoon mascot) voice lines
 *  - Six subject packs with grade-3 and grade-5 regular + bonus pools
 *  - Helpers: pickQuestion, scoreAnswer, generateBotVaultCode
 */

const CIPHER_CONFIG = {
  GAME_ID: 'cipherHeist',
  VERSION: '1.0.0',

  // ----- Round timing -----
  DURATIONS: [
    { id: 'short', label: '3 minutes', seconds: 180 },
    { id: 'standard', label: '5 minutes', seconds: 300 },
    { id: 'long', label: '7 minutes', seconds: 420 },
  ],

  // ----- Bits economy -----
  BITS: {
    fast: 30,        // < 5s answer
    medium: 20,      // 5-10s
    slow: 10,        // 10s+
    surge: 20,       // Bit Surge action bonus
    stealRatio: 0.30, // 30% of target on successful crack
    answerSpeedFastMs: 5000,
    answerSpeedMediumMs: 10000,
    answerTimeoutMs: 15000, // Wrong if not answered in 15s
    bonusTimeoutMs: 10000,  // Bonus question allowance
    crackRateLimitMs: 15000, // Per spec section 6: 1 crack/15s
  },

  // ----- Crack mini-game -----
  CRACK: {
    codeLength: 3,
    digitMin: 1,
    digitMax: 9, // 1..9 inclusive (no zero, no repeats per spec 3.1)
    maxAttemptsPerSession: 3,
    bonusQuestionRequired: true,
  },

  // ----- Heist actions -----
  // iconImage is preferred when present; icon (emoji) is the fallback if asset 404s.
  ACTIONS: {
    crack: {
      id: 'crack',
      icon: '🔓',
      iconImage: '/assets/sprites/cipher-heist/noir/icon-lock-unlocked.png',
      label: 'Crack a Vault',
      description: 'Answer a bonus question, then take a shot at a rival code.',
      colorClass: 'from-rose-700 to-red-900',
    },
    firewall: {
      id: 'firewall',
      icon: '🛡️',
      iconImage: '/assets/sprites/cipher-heist/noir/icon-firewall.png',
      label: 'Install Firewall',
      description: 'Absorb the next failed crack on your vault.',
      colorClass: 'from-amber-700 to-yellow-900',
    },
    surge: {
      id: 'surge',
      icon: '⚡',
      iconImage: '/assets/sprites/cipher-heist/noir/icon-bit-surge.png',
      label: 'Bit Surge',
      description: 'Instant +20 bits.',
      colorClass: 'from-amber-600 to-yellow-700',
    },
    scan: {
      id: 'scan',
      icon: '🔍',
      iconImage: '/assets/sprites/cipher-heist/noir/icon-scope.png',
      label: 'Scan Opponent',
      description: 'Reveal one digit (only the value, not the position) of an opponent\'s code.',
      colorClass: 'from-amber-700 to-amber-900',
    },
  },

  // ----- LuminaCore reward formula (spec section 5) -----
  REWARDS: {
    participation: { xp: 15, coins: 5 },
    perCorrect: { xp: 3, coins: 1 },
    perCrack: { xp: 10, coins: 5 },
    firewallDefend: { xp: 8, coins: 3 },
    place: {
      1: { xp: 25, coins: 15 },
      2: { xp: 15, coins: 10 },
      3: { xp: 10, coins: 5 },
    },
  },

  // ----- AI personas -----
  // accuracyByTier: probability the bot answers correctly given a question of that bonus tier
  // speedRangeMs: how long the bot "thinks" before answering (capped to answerTimeoutMs)
  // actionWeights: relative weights for choosing each action after a correct answer
  // personality: voice/style for floating banter
  BOTS: {
    scout: {
      id: 'scout',
      name: 'Scout Bot',
      avatar: '/assets/sprites/cipher-heist/noir/scout-bot_nobg.png',
      grade: 3,
      // Eager kid — fast but error-prone, loves cracking
      accuracy: { regular: 0.72, bonus: 0.55 },
      speedRangeMs: [1200, 4500],
      actionWeights: { crack: 4, firewall: 1.5, surge: 2, scan: 1 },
      personality: 'eager',
      banter: [
        "Got it!",
        "Coming for you!",
        "Bits up!",
        "Heh, easy one.",
        "Let's go!",
      ],
    },
    sage: {
      id: 'sage',
      name: 'Sage Bot',
      avatar: '/assets/sprites/cipher-heist/noir/sage-bot_nobg.png',
      grade: 5,
      // Strategic — slower but accurate, plays defense
      accuracy: { regular: 0.86, bonus: 0.7 },
      speedRangeMs: [2200, 7500],
      actionWeights: { crack: 2.5, firewall: 3, surge: 1.5, scan: 2 },
      personality: 'calculating',
      banter: [
        "Calculated.",
        "Predictable.",
        "Stacking shields.",
        "Patience pays.",
        "Noted.",
      ],
    },
  },

  // ----- Vex the Raccoon (mascot) voice lines -----
  // Used for in-game text bubbles + (optionally) audio playback if voice files exist.
  // file: filename in assets/audio/cipher-heist/voice/ — if missing, falls back to text-only.
  VEX_LINES: {
    welcome: { text: "Welcome to the Cipher Heist Terminal, Agent. Pick your code, paws first.", file: "vex-welcome.mp3" },
    vaultTip: { text: "Pick digits you'll remember. Enemies are watching… well, not yet.", file: "vex-vault-tip.mp3" },
    correct: { text: "Boom! Bits incoming. What's your move?", file: "vex-correct.mp3" },
    wrong: { text: "Shake it off. Next question's yours.", file: "vex-wrong.mp3" },
    firewall: { text: "Shield's up. Let 'em try.", file: "vex-firewall.mp3" },
    cracked: { text: "They got in! Time to rebuild.", file: "vex-cracked.mp3" },
    crackSuccess: { text: "You cracked it! Smooth moves, Agent.", file: "vex-crack-success.mp3" },
    crackFail: { text: "Door slammed. Reload your guess.", file: "vex-crack-fail.mp3" },
    win: { text: "Mission complete. You ran this terminal.", file: "vex-win.mp3" },
    lose: { text: "You'll crack 'em next time. Vex believes in you.", file: "vex-lose.mp3" },
    surge: { text: "Bit Surge live. Stack 'em high.", file: "vex-surge.mp3" },
    scan: { text: "One digit, one whisper. Use it well.", file: "vex-scan.mp3" },
    finalMinute: { text: "Sixty seconds. Rivals are sweating.", file: "vex-final-minute.mp3" },
  },

  // ----- Subject packs -----
  // Each pack has tier3 (grade 3) and tier5 (grade 5).
  // Each tier: { regular: [...], bonus: [...] }  (bonus questions are a step harder per spec 3.4)
  // Question shape: { q: string, choices: [4 strings], a: 0|1|2|3, hint?: string }
  PACKS: {
    math: {
      id: 'math',
      name: 'Math Blast',
      icon: '🧮',
      iconImage: '/assets/sprites/cipher-heist/noir/icon-pack-math.png',
      description: 'Multiplication, division, fractions, mental math.',
      tier3: {
        regular: [
          { q: "5 + 7", choices: ["10", "11", "12", "13"], a: 2 },
          { q: "9 - 4", choices: ["3", "4", "5", "6"], a: 2 },
          { q: "3 × 4", choices: ["7", "9", "12", "15"], a: 2 },
          { q: "6 × 2", choices: ["10", "11", "12", "13"], a: 2 },
          { q: "8 ÷ 2", choices: ["2", "3", "4", "6"], a: 2 },
          { q: "10 ÷ 5", choices: ["1", "2", "3", "5"], a: 1 },
          { q: "7 + 8", choices: ["13", "14", "15", "16"], a: 2 },
          { q: "11 - 6", choices: ["3", "4", "5", "6"], a: 2 },
          { q: "5 × 5", choices: ["20", "22", "24", "25"], a: 3 },
          { q: "9 + 6", choices: ["13", "14", "15", "16"], a: 2 },
          { q: "12 - 5", choices: ["6", "7", "8", "9"], a: 1 },
          { q: "4 × 6", choices: ["18", "22", "24", "26"], a: 2 },
          { q: "16 ÷ 4", choices: ["3", "4", "5", "6"], a: 1 },
          { q: "Half of 14", choices: ["6", "7", "8", "9"], a: 1 },
        ],
        bonus: [
          { q: "(3 × 4) + 7", choices: ["17", "19", "21", "23"], a: 1 },
          { q: "20 - (6 + 5)", choices: ["7", "8", "9", "10"], a: 2 },
          { q: "15 ÷ 3 × 2", choices: ["8", "10", "12", "15"], a: 1 },
          { q: "(8 + 4) ÷ 2", choices: ["4", "5", "6", "8"], a: 2 },
          { q: "Double 12 minus 9", choices: ["13", "14", "15", "16"], a: 2 },
          { q: "Sum of 17 and 26", choices: ["41", "42", "43", "44"], a: 2 },
          { q: "1/2 of 18", choices: ["8", "9", "10", "12"], a: 1 },
          { q: "Smallest factor of 15 (other than 1)", choices: ["2", "3", "4", "5"], a: 1 },
        ],
      },
      tier5: {
        regular: [
          { q: "12 × 7", choices: ["72", "78", "84", "94"], a: 2 },
          { q: "144 ÷ 12", choices: ["10", "11", "12", "14"], a: 2 },
          { q: "3/4 of 16", choices: ["8", "10", "12", "14"], a: 2 },
          { q: "0.5 × 24", choices: ["10", "11", "12", "14"], a: 2 },
          { q: "Square of 9", choices: ["72", "79", "81", "99"], a: 2 },
          { q: "(15 × 4) + 8", choices: ["62", "64", "68", "72"], a: 2 },
          { q: "Convert 3/5 to a decimal", choices: ["0.3", "0.5", "0.6", "0.75"], a: 2 },
          { q: "GCF of 24 and 36", choices: ["6", "9", "12", "18"], a: 2 },
          { q: "8 × 7 - 6", choices: ["46", "48", "50", "52"], a: 2 },
          { q: "200 - 7 × 11", choices: ["121", "123", "127", "133"], a: 1 },
          { q: "Round 47.6 to the nearest whole", choices: ["46", "47", "48", "50"], a: 2 },
          { q: "5/8 + 1/8", choices: ["5/8", "6/8", "6/16", "7/8"], a: 1 },
          { q: "Perimeter of 6×4 rectangle", choices: ["10", "20", "24", "26"], a: 1 },
          { q: "Area of 6×4 rectangle", choices: ["10", "20", "24", "26"], a: 2 },
        ],
        bonus: [
          { q: "2 × (8 + 4) - 5", choices: ["17", "18", "19", "20"], a: 2 },
          { q: "100 - (6 × 7)", choices: ["56", "57", "58", "59"], a: 2 },
          { q: "Convert 7/10 to a percent", choices: ["7%", "17%", "70%", "77%"], a: 2 },
          { q: "(48 ÷ 6) + (3 × 5)", choices: ["21", "22", "23", "24"], a: 2 },
          { q: "Volume of 3×4×5 box", choices: ["12", "20", "32", "60"], a: 3 },
          { q: "0.25 + 0.6", choices: ["0.65", "0.75", "0.85", "0.95"], a: 2 },
          { q: "LCM of 4 and 6", choices: ["8", "10", "12", "24"], a: 2 },
          { q: "x in 4x = 36", choices: ["7", "8", "9", "10"], a: 2 },
        ],
      },
    },

    spelling: {
      id: 'spelling',
      name: 'Spell Storm',
      icon: '🔤',
      iconImage: '/assets/sprites/cipher-heist/noir/icon-pack-spell.png',
      description: 'Pick the correctly spelled word.',
      tier3: {
        regular: [
          { q: "Pick the correct spelling:", choices: ["frend", "freind", "friend", "fryend"], a: 2 },
          { q: "Pick the correct spelling:", choices: ["becuse", "becose", "because", "becose"], a: 2 },
          { q: "Pick the correct spelling:", choices: ["picher", "picture", "pickture", "pikture"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["happen", "hapen", "happan", "hapine"], a: 0 },
          { q: "Pick the correct spelling:", choices: ["tommorow", "tomorrow", "tomorow", "tommorrow"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["brite", "bryte", "bright", "brigth"], a: 2 },
          { q: "Pick the correct spelling:", choices: ["enuogh", "enough", "enouf", "enouph"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["famly", "famely", "family", "familly"], a: 2 },
          { q: "Pick the correct spelling:", choices: ["bicycle", "bicicle", "bycicle", "bisicle"], a: 0 },
          { q: "Pick the correct spelling:", choices: ["truble", "trubble", "trouble", "troble"], a: 2 },
          { q: "Pick the correct spelling:", choices: ["thier", "their", "ther", "theyr"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["recieve", "receive", "receeve", "reseive"], a: 1 },
        ],
        bonus: [
          { q: "Pick the correct spelling:", choices: ["seperate", "separate", "saparate", "seperete"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["necesary", "necessery", "necessary", "neccessary"], a: 2 },
          { q: "Pick the correct spelling:", choices: ["definately", "definitely", "definitley", "definatly"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["beleive", "believe", "beleve", "beleeve"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["embarrass", "embarass", "embaras", "embarras"], a: 0 },
          { q: "Pick the correct spelling:", choices: ["acommodate", "accomodate", "accommodate", "accomadate"], a: 2 },
        ],
      },
      tier5: {
        regular: [
          { q: "Pick the correct spelling:", choices: ["separete", "separate", "seperate", "separete"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["concience", "consience", "conscience", "consciense"], a: 2 },
          { q: "Pick the correct spelling:", choices: ["calender", "calendar", "callender", "calandar"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["responsable", "responsible", "responsibal", "responsibile"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["independance", "independence", "independense", "independents"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["enviroment", "environment", "enviornment", "environmant"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["restaurant", "restaraunt", "resturaunt", "restraunt"], a: 0 },
          { q: "Pick the correct spelling:", choices: ["tomatos", "tomatoes", "tomatos", "tomatose"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["rythm", "rythym", "rhythm", "rythmn"], a: 2 },
          { q: "Pick the correct spelling:", choices: ["paralel", "parellel", "parallel", "paralell"], a: 2 },
          { q: "Pick the correct spelling:", choices: ["mischievious", "mischievous", "mischeivous", "mischievus"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["miniscule", "minuscule", "minascule", "minuscle"], a: 1 },
        ],
        bonus: [
          { q: "Pick the correct spelling:", choices: ["concious", "conscience", "conscious", "consious"], a: 2 },
          { q: "Pick the correct spelling:", choices: ["beaurocratic", "bureaucratic", "burocratic", "beurocratic"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["acquaintence", "aquaintance", "acquaintance", "aqaintance"], a: 2 },
          { q: "Pick the correct spelling:", choices: ["reccommend", "recommend", "recomend", "reccomend"], a: 1 },
          { q: "Pick the correct spelling:", choices: ["accidently", "accidentaly", "accidentally", "accidentialy"], a: 2 },
          { q: "Pick the correct spelling:", choices: ["preceed", "precede", "preceede", "presede"], a: 1 },
        ],
      },
    },

    science: {
      id: 'science',
      name: 'Science Lab',
      icon: '🧪',
      iconImage: '/assets/sprites/cipher-heist/noir/icon-pack-science.png',
      description: 'Earth, life, and physical science basics.',
      tier3: {
        regular: [
          { q: "What planet do we live on?", choices: ["Mars", "Earth", "Venus", "Saturn"], a: 1 },
          { q: "Which is a mammal?", choices: ["Shark", "Snake", "Dolphin", "Eagle"], a: 2 },
          { q: "Which animal lays eggs?", choices: ["Dog", "Cow", "Chicken", "Cat"], a: 2 },
          { q: "What do plants need to grow?", choices: ["Snow", "Sunlight", "Salt", "Soda"], a: 1 },
          { q: "How many legs does an insect have?", choices: ["4", "6", "8", "10"], a: 1 },
          { q: "Which is liquid at room temperature?", choices: ["Ice", "Water", "Steam", "Diamond"], a: 1 },
          { q: "Where does the Sun rise?", choices: ["North", "South", "East", "West"], a: 2 },
          { q: "What gas do we breathe in?", choices: ["Helium", "Oxygen", "Nitrogen", "Argon"], a: 1 },
          { q: "Which is a reptile?", choices: ["Frog", "Lizard", "Salmon", "Bat"], a: 1 },
          { q: "What part of a plant makes food?", choices: ["Roots", "Stem", "Leaves", "Flower"], a: 2 },
          { q: "Which season is coldest?", choices: ["Spring", "Summer", "Fall", "Winter"], a: 3 },
          { q: "What pulls things to the ground?", choices: ["Magnetism", "Gravity", "Friction", "Wind"], a: 1 },
        ],
        bonus: [
          { q: "Which is NOT a state of matter?", choices: ["Solid", "Liquid", "Energy", "Gas"], a: 2 },
          { q: "Which is the largest planet?", choices: ["Earth", "Mars", "Saturn", "Jupiter"], a: 3 },
          { q: "What organ pumps blood?", choices: ["Lungs", "Heart", "Liver", "Brain"], a: 1 },
          { q: "Which animal is a herbivore?", choices: ["Lion", "Wolf", "Cow", "Hawk"], a: 2 },
          { q: "What do bees make?", choices: ["Silk", "Honey", "Wax only", "Cocoons"], a: 1 },
          { q: "Which is the smallest unit of life?", choices: ["Tissue", "Organ", "Cell", "Molecule"], a: 2 },
        ],
      },
      tier5: {
        regular: [
          { q: "Which planet is closest to the Sun?", choices: ["Venus", "Mercury", "Earth", "Mars"], a: 1 },
          { q: "What is the boiling point of water (°C)?", choices: ["50", "75", "100", "212"], a: 2 },
          { q: "Which gas do plants release?", choices: ["Carbon dioxide", "Nitrogen", "Hydrogen", "Oxygen"], a: 3 },
          { q: "What process turns liquid water to gas?", choices: ["Condensation", "Precipitation", "Evaporation", "Filtration"], a: 2 },
          { q: "Which layer of Earth is hottest?", choices: ["Crust", "Mantle", "Outer core", "Inner core"], a: 3 },
          { q: "Which organ filters waste from blood?", choices: ["Heart", "Stomach", "Kidneys", "Lungs"], a: 2 },
          { q: "What's the unit of force?", choices: ["Joule", "Newton", "Watt", "Pascal"], a: 1 },
          { q: "Which is a renewable energy source?", choices: ["Coal", "Oil", "Wind", "Natural gas"], a: 2 },
          { q: "DNA is found mainly in the:", choices: ["Cell wall", "Cytoplasm", "Mitochondria", "Nucleus"], a: 3 },
          { q: "What rock forms from cooled magma?", choices: ["Sedimentary", "Igneous", "Metamorphic", "Coral"], a: 1 },
          { q: "Which is NOT a planet?", choices: ["Pluto", "Mercury", "Saturn", "Neptune"], a: 0 },
          { q: "What causes ocean tides?", choices: ["Sun only", "Wind", "Earth's spin", "Moon's gravity"], a: 3 },
        ],
        bonus: [
          { q: "Which scientist proposed gravity laws?", choices: ["Einstein", "Newton", "Darwin", "Galileo"], a: 1 },
          { q: "Photosynthesis happens in which organelle?", choices: ["Ribosome", "Chloroplast", "Vacuole", "Lysosome"], a: 1 },
          { q: "Speed of light is approximately:", choices: ["300 m/s", "30,000 m/s", "300,000 km/s", "3,000 km/s"], a: 2 },
          { q: "What's the chemical symbol for gold?", choices: ["Gd", "Go", "Au", "Ag"], a: 2 },
          { q: "What galaxy contains Earth?", choices: ["Andromeda", "Triangulum", "Milky Way", "Whirlpool"], a: 2 },
          { q: "Earth's atmosphere is mostly:", choices: ["Oxygen", "Carbon dioxide", "Hydrogen", "Nitrogen"], a: 3 },
        ],
      },
    },

    vocab: {
      id: 'vocab',
      name: 'Word Quest',
      icon: '📖',
      iconImage: '/assets/sprites/cipher-heist/noir/icon-pack-word.png',
      description: 'Vocabulary, definitions, and synonyms.',
      tier3: {
        regular: [
          { q: "What does 'enormous' mean?", choices: ["Tiny", "Very big", "Loud", "Bright"], a: 1 },
          { q: "Synonym for 'happy':", choices: ["Sad", "Joyful", "Tired", "Angry"], a: 1 },
          { q: "What does 'rapid' mean?", choices: ["Slow", "Quiet", "Fast", "Smooth"], a: 2 },
          { q: "Antonym of 'easy':", choices: ["Simple", "Difficult", "Quick", "Open"], a: 1 },
          { q: "Synonym for 'brave':", choices: ["Scared", "Bold", "Quiet", "Bored"], a: 1 },
          { q: "What does 'fragile' mean?", choices: ["Easily broken", "Strong", "Heavy", "Loud"], a: 0 },
          { q: "Antonym of 'begin':", choices: ["Start", "Open", "End", "Try"], a: 2 },
          { q: "Synonym for 'shout':", choices: ["Whisper", "Yell", "Walk", "Sit"], a: 1 },
          { q: "What does 'curious' mean?", choices: ["Bored", "Scared", "Eager to know", "Hungry"], a: 2 },
          { q: "Antonym of 'shiny':", choices: ["Bright", "Dull", "Smooth", "Clean"], a: 1 },
          { q: "Synonym for 'tiny':", choices: ["Big", "Small", "Long", "Wide"], a: 1 },
          { q: "What does 'invisible' mean?", choices: ["Loud", "Cannot be seen", "Heavy", "Soft"], a: 1 },
        ],
        bonus: [
          { q: "What does 'magnificent' mean?", choices: ["Sad", "Wonderful", "Cheap", "Tiny"], a: 1 },
          { q: "Antonym of 'generous':", choices: ["Kind", "Selfish", "Loud", "Friendly"], a: 1 },
          { q: "Synonym for 'frequent':", choices: ["Rare", "Often", "Slow", "Loud"], a: 1 },
          { q: "What does 'reluctant' mean?", choices: ["Eager", "Unwilling", "Funny", "Bright"], a: 1 },
          { q: "Antonym of 'ancient':", choices: ["Old", "Modern", "Big", "Quiet"], a: 1 },
          { q: "Synonym for 'observe':", choices: ["Hide", "Watch", "Throw", "Listen"], a: 1 },
        ],
      },
      tier5: {
        regular: [
          { q: "What does 'meticulous' mean?", choices: ["Careless", "Very careful", "Loud", "Lazy"], a: 1 },
          { q: "Synonym for 'benevolent':", choices: ["Kind", "Cruel", "Quiet", "Tired"], a: 0 },
          { q: "What does 'arduous' mean?", choices: ["Easy", "Difficult", "Pretty", "Quick"], a: 1 },
          { q: "Antonym of 'optimistic':", choices: ["Hopeful", "Pessimistic", "Excited", "Friendly"], a: 1 },
          { q: "Synonym for 'eloquent':", choices: ["Silent", "Well-spoken", "Boring", "Confused"], a: 1 },
          { q: "What does 'tenacious' mean?", choices: ["Lazy", "Persistent", "Quiet", "Forgetful"], a: 1 },
          { q: "Synonym for 'lethargic':", choices: ["Energetic", "Sluggish", "Curious", "Bold"], a: 1 },
          { q: "Antonym of 'verbose':", choices: ["Concise", "Loud", "Funny", "Boring"], a: 0 },
          { q: "What does 'novice' mean?", choices: ["Expert", "Beginner", "Teacher", "Stranger"], a: 1 },
          { q: "Synonym for 'aloof':", choices: ["Friendly", "Distant", "Smart", "Quick"], a: 1 },
          { q: "What does 'candid' mean?", choices: ["Sneaky", "Honest", "Loud", "Shy"], a: 1 },
          { q: "Antonym of 'frugal':", choices: ["Cheap", "Wasteful", "Honest", "Quiet"], a: 1 },
        ],
        bonus: [
          { q: "What does 'ephemeral' mean?", choices: ["Lasting forever", "Short-lived", "Dangerous", "Tasty"], a: 1 },
          { q: "Synonym for 'ubiquitous':", choices: ["Rare", "Hidden", "Everywhere", "Heavy"], a: 2 },
          { q: "What does 'gregarious' mean?", choices: ["Shy", "Sociable", "Angry", "Smart"], a: 1 },
          { q: "Antonym of 'pragmatic':", choices: ["Practical", "Idealistic", "Fast", "Quiet"], a: 1 },
          { q: "Synonym for 'enigmatic':", choices: ["Obvious", "Mysterious", "Funny", "Loud"], a: 1 },
          { q: "What does 'placate' mean?", choices: ["Anger", "Soothe", "Hide", "Run"], a: 1 },
        ],
      },
    },

    geography: {
      id: 'geography',
      name: 'Geography Run',
      icon: '🌍',
      iconImage: '/assets/sprites/cipher-heist/noir/icon-pack-geo.png',
      description: 'States, capitals, continents, and landmarks.',
      tier3: {
        regular: [
          { q: "How many continents are there?", choices: ["5", "6", "7", "8"], a: 2 },
          { q: "Which continent is the largest?", choices: ["Africa", "Asia", "Europe", "Americas"], a: 1 },
          { q: "Which is the longest river in the US?", choices: ["Mississippi", "Hudson", "Rio Grande", "Colorado"], a: 0 },
          { q: "Capital of the United States?", choices: ["New York", "Washington D.C.", "Boston", "Atlanta"], a: 1 },
          { q: "Which ocean is the largest?", choices: ["Atlantic", "Indian", "Arctic", "Pacific"], a: 3 },
          { q: "Which country is shaped like a boot?", choices: ["Spain", "France", "Italy", "Greece"], a: 2 },
          { q: "Which state has Hollywood?", choices: ["Texas", "California", "Florida", "Nevada"], a: 1 },
          { q: "What's the tallest mountain on Earth?", choices: ["K2", "Everest", "Denali", "Kilimanjaro"], a: 1 },
          { q: "Which country has the most people?", choices: ["USA", "Russia", "India", "Brazil"], a: 2 },
          { q: "Which is a desert?", choices: ["Amazon", "Sahara", "Alps", "Nile"], a: 1 },
          { q: "Capital of France?", choices: ["Lyon", "Paris", "Nice", "Marseille"], a: 1 },
          { q: "Which is in North America?", choices: ["Spain", "Canada", "Egypt", "Japan"], a: 1 },
        ],
        bonus: [
          { q: "Which is the smallest continent?", choices: ["Europe", "Antarctica", "Australia", "South America"], a: 2 },
          { q: "Capital of Japan?", choices: ["Beijing", "Tokyo", "Seoul", "Bangkok"], a: 1 },
          { q: "Which river runs through Egypt?", choices: ["Amazon", "Nile", "Tigris", "Danube"], a: 1 },
          { q: "Which is a peninsula?", choices: ["Hawaii", "Florida", "Iceland", "Greenland"], a: 1 },
          { q: "Capital of Australia?", choices: ["Sydney", "Melbourne", "Canberra", "Perth"], a: 2 },
          { q: "Largest state in the US?", choices: ["California", "Texas", "Alaska", "Montana"], a: 2 },
        ],
      },
      tier5: {
        regular: [
          { q: "Capital of Canada?", choices: ["Toronto", "Montreal", "Ottawa", "Vancouver"], a: 2 },
          { q: "Capital of Brazil?", choices: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"], a: 2 },
          { q: "Which country is landlocked?", choices: ["Italy", "Switzerland", "Spain", "Greece"], a: 1 },
          { q: "The Andes are in which continent?", choices: ["Africa", "Asia", "South America", "Europe"], a: 2 },
          { q: "Which is the deepest ocean trench?", choices: ["Java", "Mariana", "Tonga", "Puerto Rico"], a: 1 },
          { q: "Capital of Egypt?", choices: ["Alexandria", "Cairo", "Giza", "Luxor"], a: 1 },
          { q: "The Sahara is in which continent?", choices: ["Asia", "Australia", "Africa", "Europe"], a: 2 },
          { q: "Which strait separates Asia and North America?", choices: ["Gibraltar", "Bering", "Hormuz", "Magellan"], a: 1 },
          { q: "Capital of South Korea?", choices: ["Seoul", "Pyongyang", "Busan", "Jeju"], a: 0 },
          { q: "Which mountain range divides Europe and Asia?", choices: ["Alps", "Andes", "Urals", "Atlas"], a: 2 },
          { q: "Capital of Argentina?", choices: ["Lima", "Bogotá", "Buenos Aires", "Santiago"], a: 2 },
          { q: "Which country has the Eiffel Tower?", choices: ["Italy", "Spain", "France", "Germany"], a: 2 },
        ],
        bonus: [
          { q: "Capital of Kenya?", choices: ["Nairobi", "Mombasa", "Kampala", "Addis Ababa"], a: 0 },
          { q: "Which is the largest desert (cold included)?", choices: ["Sahara", "Gobi", "Antarctic", "Arabian"], a: 2 },
          { q: "Mount Fuji is in which country?", choices: ["China", "Korea", "Japan", "Vietnam"], a: 2 },
          { q: "Which sea is between Europe and Africa?", choices: ["Black", "Baltic", "Red", "Mediterranean"], a: 3 },
          { q: "Capital of New Zealand?", choices: ["Auckland", "Wellington", "Christchurch", "Dunedin"], a: 1 },
          { q: "Which country has the Great Barrier Reef?", choices: ["Brazil", "Indonesia", "Australia", "Philippines"], a: 2 },
        ],
      },
    },

    // Stub for the Custom Pack — UI is deferred per plan, but the engine
    // accepts pack id 'custom' so you can wire it up later.
    custom: {
      id: 'custom',
      name: 'Custom Pack',
      icon: '✏️',
      description: 'Host enters their own questions. (UI coming soon.)',
      stub: true,
      tier3: { regular: [], bonus: [] },
      tier5: { regular: [], bonus: [] },
    },
  },
};

// ============================================================
// Helpers
// ============================================================

function chPickQuestion(packId, gradeTier, type = 'regular') {
  const pack = CIPHER_CONFIG.PACKS[packId];
  if (!pack) return null;
  const tier = pack[gradeTier] || pack.tier3;
  const pool = (tier && tier[type]) || [];
  if (pool.length === 0) {
    // Fall back to regular pool if bonus is empty
    if (type === 'bonus' && tier && tier.regular && tier.regular.length) {
      return tier.regular[Math.floor(Math.random() * tier.regular.length)];
    }
    return null;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function chScoreAnswer(elapsedMs) {
  const B = CIPHER_CONFIG.BITS;
  if (elapsedMs < B.answerSpeedFastMs) return { tier: 'fast', bits: B.fast };
  if (elapsedMs < B.answerSpeedMediumMs) return { tier: 'medium', bits: B.medium };
  return { tier: 'slow', bits: B.slow };
}

function chFormatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.max(0, seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Generate a random valid 3-digit vault code (digits 1-9, no repeats).
function chGenerateVaultCode() {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  // Fisher-Yates pick 3
  for (let i = digits.length - 1; i > digits.length - 4; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(-3);
}

function chValidateVaultCode(code) {
  if (!Array.isArray(code) || code.length !== CIPHER_CONFIG.CRACK.codeLength) return false;
  for (const d of code) {
    if (typeof d !== 'number' || d < CIPHER_CONFIG.CRACK.digitMin || d > CIPHER_CONFIG.CRACK.digitMax) return false;
  }
  return new Set(code).size === code.length;
}

// Spec 3.4 Wordle-style feedback. Returns array of 'exact' | 'partial' | 'miss'.
function chCrackFeedback(guess, target) {
  const result = ['miss', 'miss', 'miss'];
  const used = [false, false, false];

  // First pass: exact matches
  for (let i = 0; i < 3; i++) {
    if (guess[i] === target[i]) {
      result[i] = 'exact';
      used[i] = true;
    }
  }
  // Second pass: partials
  for (let i = 0; i < 3; i++) {
    if (result[i] === 'exact') continue;
    for (let j = 0; j < 3; j++) {
      if (!used[j] && guess[i] === target[j]) {
        result[i] = 'partial';
        used[j] = true;
        break;
      }
    }
  }
  return result;
}

// Pick one digit at random from a target's vault code (used by Scan action).
function chPickScanDigit(targetCode) {
  if (!Array.isArray(targetCode) || targetCode.length === 0) return null;
  return targetCode[Math.floor(Math.random() * targetCode.length)];
}

// Export to window for cross-script access
if (typeof window !== 'undefined') {
  window.CIPHER_CONFIG = CIPHER_CONFIG;
  window.chPickQuestion = chPickQuestion;
  window.chScoreAnswer = chScoreAnswer;
  window.chFormatTime = chFormatTime;
  window.chGenerateVaultCode = chGenerateVaultCode;
  window.chValidateVaultCode = chValidateVaultCode;
  window.chCrackFeedback = chCrackFeedback;
  window.chPickScanDigit = chPickScanDigit;
}
