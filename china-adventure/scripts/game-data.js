// ==================== GAME DATA ====================
// Dragon Scrolls of China - based on a 5th-grade study guide.
// Questions authored from study-sheet-extracted.json

// Difficulty tag:
//   'easy'   - ok for 3rd grade (Liam Mode / Scout)
//   'medium' - 4th-5th grade (available in both modes)
//   'hard'   - 5th grade vocabulary heavy (Sage Mode only)
// A question belongs to both modes if `modes: ['liam','emma']` or simply omits the field.

const allQuestions = [
  // ===== BEIJING (Capital) =====
  { q: 'What is the capital city of China?', a: 'Beijing', wrong: ['Shanghai', 'Hong Kong', 'Tokyo'], region: 'beijing', difficulty: 'easy' },
  { q: 'Beijing is famous for all of these things EXCEPT:', a: 'Pyramids', wrong: ['Shopping', 'Markets', 'Festivals'], region: 'beijing', difficulty: 'easy' },
  { q: 'Which of these can you do in Beijing?', a: 'Enjoy the arts, music, and festivals', wrong: ['Go surfing', 'Ski down mountains', 'Visit the Amazon rainforest'], region: 'beijing', difficulty: 'easy' },
  { q: 'What is the MOST important festival in China for?', a: 'The New Year', wrong: ['Halloween', 'Thanksgiving', 'Independence Day'], region: 'beijing', difficulty: 'easy' },
  { q: '"What you do not want done to yourself, do not do to others" is called the:', a: 'Golden Rule', wrong: ['Silver Law', 'Dragon Code', 'Emperor\'s Rule'], region: 'beijing', difficulty: 'medium' },
  { q: 'Which activity would you NOT find in Beijing?', a: 'Tropical jungle tours', wrong: ['Shopping markets', 'Music concerts', 'Art galleries'], region: 'beijing', difficulty: 'easy' },

  // ===== GREAT WALL =====
  { q: 'Why was the Great Wall of China built?', a: 'To protect China from invaders', wrong: ['To grow vegetables', 'For tourists', 'To hold water'], region: 'greatwall', difficulty: 'easy' },
  { q: 'Where do Mongols traditionally live?', a: 'Round yurts', wrong: ['Igloos', 'Skyscrapers', 'Tree houses'], region: 'greatwall', difficulty: 'easy' },
  { q: 'What does "rebel" mean?', a: 'To fight back against', wrong: ['To agree with', 'To run away from', 'To build up'], region: 'greatwall', difficulty: 'medium' },
  { q: 'Ancient Chinese rulers were known as:', a: 'Emperors', wrong: ['Presidents', 'Kings', 'Chiefs'], region: 'greatwall', difficulty: 'easy' },
  { q: 'The Great Wall was mostly used to defend against whom?', a: 'Invaders from the north', wrong: ['Sea pirates', 'Dragons', 'Farmers'], region: 'greatwall', difficulty: 'medium' },
  { q: 'Who formed the Red Guard to support communism?', a: 'Students', wrong: ['Soldiers', 'Farmers', 'Teachers'], region: 'greatwall', difficulty: 'medium' },

  // ===== SICHUAN RICE TERRACES =====
  { q: 'In which Chinese province is rice grown on terraced paddies?', a: 'Sichuan', wrong: ['Tibet', 'Beijing', 'Hong Kong'], region: 'sichuan', difficulty: 'easy' },
  { q: 'Rice in Sichuan is grown on:', a: 'Terraced paddies', wrong: ['Flat fields', 'Sand dunes', 'Mountain peaks'], region: 'sichuan', difficulty: 'easy' },
  { q: 'What is a basin?', a: 'A round lowland', wrong: ['A tall mountain', 'A dry desert', 'A deep ocean'], region: 'sichuan', difficulty: 'medium' },
  { q: 'What is a gorge?', a: 'A narrow valley with a steep wall', wrong: ['A round lowland', 'A flat field', 'A city square'], region: 'sichuan', difficulty: 'medium' },
  { q: 'What is a steppe?', a: 'Land that is dry and windy', wrong: ['A wet rainforest', 'A frozen ocean', 'A busy city'], region: 'sichuan', difficulty: 'hard' },

  // ===== SILK ROAD =====
  { q: 'The Silk Road allowed trade between China and:', a: 'Europe and Asia', wrong: ['Africa and Australia', 'South America', 'Antarctica'], region: 'silkroad', difficulty: 'easy' },
  { q: 'What leaves are fed to silkworms to make silk?', a: 'Mulberry leaves', wrong: ['Oak leaves', 'Bamboo shoots', 'Rice leaves'], region: 'silkroad', difficulty: 'easy' },
  { q: 'Silk is made by:', a: 'Silkworms eating mulberry leaves', wrong: ['Spiders in caves', 'Sheep wool', 'Cotton plants'], region: 'silkroad', difficulty: 'easy' },
  { q: 'What is a compass?', a: 'An instrument for showing directions', wrong: ['A tool for cooking', 'A kind of map', 'A writing brush'], region: 'silkroad', difficulty: 'easy' },
  { q: 'Traders on the Silk Road traveled across:', a: 'Deserts, mountains, and steppes', wrong: ['Oceans only', 'Only Chinese cities', 'The Pacific Ocean'], region: 'silkroad', difficulty: 'medium' },
  { q: 'Joining which group helped China\'s economy grow?', a: 'World Trade Organization', wrong: ['United Nations', 'Red Guard', 'Silk Road Council'], region: 'silkroad', difficulty: 'medium' },

  // ===== TIBET HIGHLANDS =====
  { q: 'Where is Mt. Everest, the tallest mountain on the planet?', a: 'Tibet', wrong: ['Beijing', 'Sichuan', 'Hong Kong'], region: 'tibet', difficulty: 'easy' },
  { q: 'Mt. Everest is the tallest mountain on:', a: 'The planet', wrong: ['China only', 'Asia only', 'Tibet only'], region: 'tibet', difficulty: 'easy' },
  { q: 'What is a pagoda?', a: 'An old temple with graceful curved roofs', wrong: ['A round lowland', 'A busy market', 'A silk garment'], region: 'tibet', difficulty: 'medium' },
  { q: 'Which of these is most likely found in Tibet?', a: 'Snowy mountains', wrong: ['Tropical beaches', 'Sandy deserts', 'Rice paddies'], region: 'tibet', difficulty: 'easy' },
  { q: 'A high, flat, cold area like Tibet is best described as a:', a: 'Plateau', wrong: ['Gorge', 'Basin', 'Coast'], region: 'tibet', difficulty: 'hard' },

  // ===== FORBIDDEN CITY (Imperial) =====
  { q: 'What does "imperial" mean?', a: 'A system ruled by emperors', wrong: ['A system with no rulers', 'A kind of music', 'A style of clothing'], region: 'forbiddencity', difficulty: 'medium' },
  { q: 'What is a dynasty?', a: 'A ruling family', wrong: ['A Chinese festival', 'A type of dragon', 'A city neighborhood'], region: 'forbiddencity', difficulty: 'medium' },
  { q: 'Calligraphy is the Chinese art of:', a: 'Beautiful writing', wrong: ['Making pottery', 'Painting landscapes', 'Shadow puppets'], region: 'forbiddencity', difficulty: 'easy' },
  { q: 'What is porcelain?', a: 'A fine, thin pottery made from white clay', wrong: ['A silk fabric', 'A writing brush', 'A type of mountain'], region: 'forbiddencity', difficulty: 'medium' },
  { q: 'What is architecture?', a: 'The style of a building', wrong: ['The color of a flag', 'A kind of dance', 'A cooking method'], region: 'forbiddencity', difficulty: 'medium' },
  { q: 'What is a courtyard?', a: 'An open area surrounded by buildings', wrong: ['A Chinese festival', 'A ruler\'s throne', 'A type of temple'], region: 'forbiddencity', difficulty: 'medium' },
  { q: 'Emperors ruled China during many different:', a: 'Dynasties', wrong: ['Festivals', 'Markets', 'Pagodas'], region: 'forbiddencity', difficulty: 'medium' },
  { q: 'Which of these is an ancient Chinese invention?', a: 'The compass', wrong: ['The telephone', 'The airplane', 'The television'], region: 'forbiddencity', difficulty: 'easy' },

  // ===== MODERN CHINA =====
  { q: 'What is communism?', a: 'A system where property and goods are shared equally', wrong: ['A rule by emperors', 'A form of pottery', 'A trade route'], region: 'moderncity', difficulty: 'hard' },
  { q: 'What is a political party?', a: 'A group that directs government', wrong: ['A birthday celebration', 'A traveling market', 'A ruling family'], region: 'moderncity', difficulty: 'hard' },
  { q: 'What does "deforestation" mean?', a: 'The destruction of forests', wrong: ['Planting many trees', 'Making paper', 'Growing rice'], region: 'moderncity', difficulty: 'medium' },
  { q: 'What is technology?', a: 'The knowledge and skills to make new things', wrong: ['A kind of pottery', 'An ancient building', 'A ruling family'], region: 'moderncity', difficulty: 'medium' },
  { q: 'What does "boom" mean in economics?', a: 'A time of quick growth', wrong: ['A loud noise only', 'A kind of storm', 'A slowdown'], region: 'moderncity', difficulty: 'medium' },
  { q: 'What does "cooperate" mean?', a: 'To help each other', wrong: ['To fight each other', 'To ignore each other', 'To race each other'], region: 'moderncity', difficulty: 'easy' },
  { q: 'Hong Kong was controlled by which country until 1997?', a: 'Great Britain', wrong: ['Japan', 'Russia', 'France'], region: 'moderncity', difficulty: 'medium' },
  { q: 'How many years must Chinese children attend school (at least)?', a: 'Nine years', wrong: ['Three years', 'Twelve years', 'Six years'], region: 'moderncity', difficulty: 'easy' },
  { q: 'The Communist party says goods should be divided:', a: 'Equally between all people', wrong: ['Only to the rich', 'Only to emperors', 'Only to farmers'], region: 'moderncity', difficulty: 'medium' },
];

// 7 regions of China, unlocked by level. Matches canada-adventure structure so the
// core engine can be reused.
const REGION_BACKGROUNDS = {
  beijing: '../assets/backgrounds/china-adventure/bg_beijing.png',
  greatwall: '../assets/backgrounds/china-adventure/bg_greatwall.png',
  sichuan: '../assets/backgrounds/china-adventure/bg_sichuan.png',
  silkroad: '../assets/backgrounds/china-adventure/bg_silkroad.png',
  tibet: '../assets/backgrounds/china-adventure/bg_tibet.png',
  forbiddencity: '../assets/backgrounds/china-adventure/bg_forbiddencity.png',
  moderncity: '../assets/backgrounds/china-adventure/bg_moderncity.png',
};

const regions = [
  { id: 'beijing',       name: 'Beijing',        emoji: '🏯', color: '#DC2626', unlockLevel: 1, bgImage: REGION_BACKGROUNDS.beijing,       dragonScroll: 'Scroll of the Capital' },
  { id: 'greatwall',     name: 'Great Wall',     emoji: '🧱', color: '#A16207', unlockLevel: 2, bgImage: REGION_BACKGROUNDS.greatwall,     dragonScroll: 'Scroll of the Guardians' },
  { id: 'sichuan',       name: 'Sichuan',        emoji: '🌾', color: '#16A34A', unlockLevel: 3, bgImage: REGION_BACKGROUNDS.sichuan,       dragonScroll: 'Scroll of the Terraces' },
  { id: 'silkroad',      name: 'Silk Road',      emoji: '🐪', color: '#D97706', unlockLevel: 4, bgImage: REGION_BACKGROUNDS.silkroad,      dragonScroll: 'Scroll of the Traders' },
  { id: 'tibet',         name: 'Tibet',          emoji: '🏔️', color: '#0EA5E9', unlockLevel: 5, bgImage: REGION_BACKGROUNDS.tibet,         dragonScroll: 'Scroll of the Peak' },
  { id: 'forbiddencity', name: 'Forbidden City', emoji: '👑', color: '#B91C1C', unlockLevel: 6, bgImage: REGION_BACKGROUNDS.forbiddencity, dragonScroll: 'Scroll of the Emperor' },
  { id: 'moderncity',    name: 'Modern China',   emoji: '🌆', color: '#0891B2', unlockLevel: 7, bgImage: REGION_BACKGROUNDS.moderncity,    dragonScroll: 'Scroll of the New Dawn' },
];

// Monsters use the pixel sprite keys from game-sprites.js.
// hp/attack are tuned so Liam (Scout) mode feels fair; Emma (Sage) mode scales these.
const monsters = {
  beijing: [
    { name: 'Paper Lantern Wisp',  sprite: 'lanternWisp', hp: 4,  attack: 1, isBoss: false },
    { name: 'Lion Dance Guardian', sprite: 'lionDancer',  hp: 10, attack: 2, isBoss: true },
  ],
  greatwall: [
    { name: 'Mongol Raider',    sprite: 'mongolRaider',    hp: 6,  attack: 2, isBoss: false },
    { name: 'Mongol Chieftain', sprite: 'mongolChieftain', hp: 14, attack: 3, isBoss: true },
  ],
  sichuan: [
    { name: 'Rice Paddy Sprite', sprite: 'riceSprite', hp: 7,  attack: 2, isBoss: false },
    { name: 'Panda Sage',        sprite: 'pandaSage',  hp: 16, attack: 3, isBoss: true },
  ],
  silkroad: [
    { name: 'Silk Serpent',      sprite: 'silkSerpent',  hp: 8,  attack: 2, isBoss: false },
    { name: 'Caravan Djinn',     sprite: 'caravanDjinn', hp: 18, attack: 4, isBoss: true },
  ],
  tibet: [
    { name: 'Snow Yeti',        sprite: 'snowYeti',        hp: 9,  attack: 3, isBoss: false },
    { name: 'Himalayan Dragon', sprite: 'himalayanDragon', hp: 20, attack: 4, isBoss: true },
  ],
  forbiddencity: [
    { name: 'Porcelain Wraith', sprite: 'porcelainWraith', hp: 10, attack: 3, isBoss: false },
    { name: 'Imperial Phoenix', sprite: 'imperialPhoenix', hp: 22, attack: 5, isBoss: true },
  ],
  moderncity: [
    { name: 'Smog Sprite',  sprite: 'smogSprite',  hp: 11, attack: 3, isBoss: false },
    { name: 'Megacity Golem', sprite: 'megacityGolem', hp: 24, attack: 5, isBoss: true },
  ],
};

// Difficulty modes - affect HP, damage, reward multipliers, question pool filtering.
const MODES = {
  liam: {
    id: 'liam',
    label: 'Scout Mode',
    subtitle: 'Great for younger players',
    maxHp: 12,
    maxMp: 6,
    heroAttackBonus: 1,
    enemyDamageScale: 0.75,
    bossEveryNBattles: 4,
    questionFilter: (q) => q.difficulty !== 'hard',
    xpMultiplier: 1.0,
    coinMultiplier: 1.0,
    showHint: true,
  },
  emma: {
    id: 'emma',
    label: 'Sage Mode',
    subtitle: 'Challenging 5th-grade level',
    maxHp: 10,
    maxMp: 5,
    heroAttackBonus: 0,
    enemyDamageScale: 1.0,
    bossEveryNBattles: 3,
    questionFilter: () => true,
    xpMultiplier: 1.25,
    coinMultiplier: 1.25,
    showHint: false,
  },
};

// Utility
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Golden Rule question id - used to award the secret achievement
const GOLDEN_RULE_QUESTION = allQuestions.find(q => q.a === 'Golden Rule');
