// ==================== GAME DATA ====================

// Lumina Core integration flag - set to true to sync with hub
const LUMINA_ENABLED = typeof LuminaCore !== 'undefined';

// All questions from the study guide
const allQuestions = [
  { q: 'How many sides of Canada are surrounded by oceans?', a: 'Three', wrong: ['Two', 'Four', 'One'], region: 'atlantic' },
  { q: 'What is east of the Canadian Rockies where farmers grow wheat?', a: 'The Central Plains', wrong: ['The Tundra', 'The Coastline', 'The Canadian Shield'], region: 'plains' },
  { q: 'Which city has the largest population in Canada?', a: 'Toronto', wrong: ['Montreal', 'Vancouver', 'Quebec City'], region: 'ontario' },
  { q: 'Where is Banff located?', a: 'The Central Plains region', wrong: ['The Coastline', 'The Tundra', 'The Atlantic region'], region: 'rockies' },
  { q: 'In which city do people speak both French and English?', a: 'Montreal', wrong: ['Toronto', 'Vancouver', 'Ottawa'], region: 'quebec' },
  { q: 'How did Native Canadians first arrive from Asia?', a: 'By traveling the land bridge', wrong: ['By boat', 'By airplane', 'By swimming'], region: 'arctic' },
  { q: 'Which French explorer founded Quebec City?', a: 'Samuel de Champlain', wrong: ['Jacques Cartier', 'Louis Riel', 'Pierre Trudeau'], region: 'quebec' },
  { q: 'Which war was fought between France and England for control of Canada?', a: "The Seven Years' War", wrong: ['World War I', 'The War of 1812', 'The Cold War'], region: 'quebec' },
  { q: 'When was Canada able to make its own laws for the first time?', a: '1931', wrong: ['1867', '1901', '1982'], region: 'ontario' },
  { q: 'What is the legislative branch in Canada called?', a: 'Parliament', wrong: ['Congress', 'Senate', 'Assembly'], region: 'ontario' },
  { q: "What is Canada's most important international trade partner?", a: 'United States', wrong: ['China', 'Mexico', 'United Kingdom'], region: 'plains' },
  { q: 'What do Canadians use wood to make?', a: 'Paper', wrong: ['Plastic', 'Metal', 'Glass'], region: 'shield' },
  { q: 'Jobs where workers help someone are part of what industries?', a: 'Service industries', wrong: ['Manufacturing', 'Mining', 'Farming'], region: 'ontario' },
  { q: 'What tree gives Canada its syrup AND national symbol?', a: 'Maple', wrong: ['Oak', 'Pine', 'Birch'], region: 'quebec' },
  { q: 'What is a PRAIRIE?', a: 'Flat land covered with grass', wrong: ['Frozen land without trees', 'Land along an ocean', 'A mountain range'], region: 'plains' },
  { q: 'What is a TUNDRA?', a: 'Frozen land without trees', wrong: ['A grassy plain', 'A forest', 'A river valley'], region: 'arctic' },
  { q: 'What is a REGION?', a: 'An area with common features', wrong: ['A type of government', 'A kind of animal', 'A frozen lake'], region: 'plains' },
  { q: 'What is a LOWLAND?', a: 'Area lower than land around it', wrong: ['A tall mountain', 'Land along the ocean', 'A frozen area'], region: 'atlantic' },
  { q: 'What is a COASTLINE?', a: 'Land along an ocean', wrong: ['A frozen area', 'A prairie', 'A mountain top'], region: 'atlantic' },
  { q: 'Who are the INUIT?', a: 'Arctic people in northern Canada', wrong: ['French explorers', 'British soldiers', 'American traders'], region: 'arctic' },
  { q: 'What is a PROVINCE?', a: 'Political area of a country', wrong: ['A type of food', 'A frozen river', 'A kind of tree'], region: 'ontario' },
  { q: 'What does BARTER mean?', a: 'Trade without using money', wrong: ['To build a house', 'To travel by boat', 'To grow wheat'], region: 'arctic' },
  { q: 'Which animal lives in the Canadian Shield?', a: 'Moose', wrong: ['Penguin', 'Kangaroo', 'Lion'], region: 'shield' },
  { q: 'Which animal lives in the Canadian Shield?', a: 'Gray wolves', wrong: ['Elephant', 'Giraffe', 'Zebra'], region: 'shield' },
  { q: 'Which animal can you find in the Canadian Shield?', a: 'Deer', wrong: ['Polar bear', 'Tiger', 'Hippo'], region: 'shield' },
];

const regions = [
  { id: 'atlantic', name: 'Atlantic', color: '#3b82f6', bg: 'from-blue-400 to-blue-600', unlockLevel: 1 },
  { id: 'quebec', name: 'Quebec', color: '#8b5cf6', bg: 'from-purple-400 to-purple-600', unlockLevel: 2 },
  { id: 'ontario', name: 'Ontario', color: '#f59e0b', bg: 'from-amber-400 to-orange-500', unlockLevel: 3 },
  { id: 'shield', name: 'Shield', color: '#10b981', bg: 'from-green-400 to-green-600', unlockLevel: 4 },
  { id: 'plains', name: 'Plains', color: '#eab308', bg: 'from-yellow-400 to-amber-500', unlockLevel: 5 },
  { id: 'rockies', name: 'Rockies', color: '#64748b', bg: 'from-gray-400 to-slate-600', unlockLevel: 6 },
  { id: 'arctic', name: 'Arctic', color: '#06b6d4', bg: 'from-cyan-300 to-blue-500', unlockLevel: 7 },
];

const monsters = {
  atlantic: [
    { name: 'Sea Serpent', hp: 2, attack: 1, sprite: 'serpent' },
    { name: 'Lobster Knight', hp: 4, attack: 2, sprite: 'lobster', isBoss: true },
  ],
  quebec: [
    { name: 'Maple Golem', hp: 3, attack: 1, sprite: 'golem' },
    { name: 'French Fox', hp: 5, attack: 2, sprite: 'fox', isBoss: true },
  ],
  ontario: [
    { name: 'City Slime', hp: 3, attack: 1, sprite: 'slime' },
    { name: 'Tower Bot', hp: 6, attack: 2, sprite: 'robot', isBoss: true },
  ],
  shield: [
    { name: 'Wolf Pack', hp: 3, attack: 2, sprite: 'wolf' },
    { name: 'Forest Troll', hp: 6, attack: 2, sprite: 'troll', isBoss: true },
  ],
  plains: [
    { name: 'Wheat Wraith', hp: 4, attack: 1, sprite: 'wraith' },
    { name: 'Tornado Spirit', hp: 6, attack: 3, sprite: 'tornado', isBoss: true },
  ],
  rockies: [
    { name: 'Mountain Yeti', hp: 5, attack: 2, sprite: 'yeti' },
    { name: 'Rock Golem', hp: 7, attack: 3, sprite: 'rockgolem', isBoss: true },
  ],
  arctic: [
    { name: 'Ice Dragon', hp: 5, attack: 2, sprite: 'dragon' },
    { name: 'Blizzard Witch', hp: 8, attack: 3, sprite: 'witch', isBoss: true },
  ],
};

// ==================== UTILITY FUNCTIONS ====================
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
