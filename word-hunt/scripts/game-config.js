/**
 * Word Hunt - Game Configuration
 * Word search puzzles with themed word lists
 */

const WORD_HUNT_CONFIG = {
  // Grid sizes by difficulty
  GRID_SIZES: {
    easy: 10,
    medium: 12,
    hard: 15
  },
  
  // Time limits (seconds)
  TIME_LIMITS: {
    easy: 240,    // 4 minutes
    medium: 300,  // 5 minutes
    hard: 420     // 7 minutes
  },
  
  // Difficulty settings
  DIFFICULTY: {
    easy: {
      id: 'easy',
      name: 'Word Finder',
      icon: '🌱',
      gridSize: 10,
      wordCount: 6,
      baseScore: 100,
      hintPenalty: 15,
      diagonals: false
    },
    medium: {
      id: 'medium',
      name: 'Word Hunter',
      icon: '⚔️',
      gridSize: 12,
      wordCount: 8,
      baseScore: 200,
      hintPenalty: 20,
      diagonals: true
    },
    hard: {
      id: 'hard',
      name: 'Word Master',
      icon: '🔥',
      gridSize: 15,
      wordCount: 10,
      baseScore: 300,
      hintPenalty: 25,
      diagonals: true
    }
  },
  
  // Themed word lists
  THEMES: {
    animals: {
      id: 'animals',
      name: 'Animals',
      icon: '🦁',
      color: 'green',
      words: {
        easy: ['CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'BEAR'],
        medium: ['ELEPHANT', 'GIRAFFE', 'PENGUIN', 'DOLPHIN', 'TIGER', 'MONKEY', 'ZEBRA', 'RABBIT'],
        hard: ['RHINOCEROS', 'HIPPOPOTAMUS', 'CHIMPANZEE', 'CROCODILE', 'KANGAROO', 'BUTTERFLY', 'JELLYFISH', 'FLAMINGO', 'OCTOPUS', 'CHAMELEON']
      }
    },
    
    science: {
      id: 'science',
      name: 'Science',
      icon: '🔬',
      color: 'blue',
      words: {
        easy: ['ATOM', 'CELL', 'BONE', 'HEAT', 'LIGHT', 'SOUND'],
        medium: ['GRAVITY', 'ENERGY', 'OXYGEN', 'CARBON', 'PLANET', 'MAGNET', 'FOSSIL', 'VOLUME'],
        hard: ['PHOTOSYNTHESIS', 'ELECTRICITY', 'MAGNETISM', 'EVAPORATION', 'CONDENSATION', 'ATMOSPHERE', 'ECOSYSTEM', 'MOLECULE', 'ORGANISM', 'CHEMICAL']
      }
    },
    
    space: {
      id: 'space',
      name: 'Space',
      icon: '🚀',
      color: 'purple',
      words: {
        easy: ['STAR', 'MOON', 'SUN', 'MARS', 'EARTH', 'COMET'],
        medium: ['JUPITER', 'SATURN', 'MERCURY', 'NEPTUNE', 'URANUS', 'GALAXY', 'METEOR', 'ROCKET'],
        hard: ['CONSTELLATION', 'ASTRONAUT', 'TELESCOPE', 'SATELLITE', 'BLACKHOLE', 'ASTEROID', 'SUPERNOVA', 'MILKYWAY', 'PLANETARY', 'SPACECRAFT']
      }
    },
    
    geography: {
      id: 'geography',
      name: 'Geography',
      icon: '🌍',
      color: 'emerald',
      words: {
        easy: ['CITY', 'LAKE', 'HILL', 'RIVER', 'OCEAN', 'FOREST'],
        medium: ['MOUNTAIN', 'VOLCANO', 'DESERT', 'ISLAND', 'CANYON', 'GLACIER', 'VALLEY', 'PLATEAU'],
        hard: ['CONTINENTAL', 'PENINSULA', 'ARCHIPELAGO', 'RAINFOREST', 'EQUATOR', 'HEMISPHERE', 'LONGITUDE', 'LATITUDE', 'TUNDRA', 'SAVANNAH']
      }
    },
    
    food: {
      id: 'food',
      name: 'Food',
      icon: '🍕',
      color: 'orange',
      words: {
        easy: ['PIZZA', 'APPLE', 'BREAD', 'MILK', 'RICE', 'PASTA'],
        medium: ['SANDWICH', 'PANCAKE', 'CHICKEN', 'BROCCOLI', 'CARROT', 'CHEESE', 'COOKIE', 'BANANA'],
        hard: ['SPAGHETTI', 'HAMBURGER', 'STRAWBERRY', 'WATERMELON', 'CHOCOLATE', 'BLUEBERRY', 'PINEAPPLE', 'RASPBERRY', 'BURRITO', 'QUESADILLA']
      }
    },
    
    sports: {
      id: 'sports',
      name: 'Sports',
      icon: '⚽',
      color: 'red',
      words: {
        easy: ['BALL', 'GOAL', 'RUN', 'JUMP', 'SWIM', 'KICK'],
        medium: ['SOCCER', 'HOCKEY', 'TENNIS', 'BASEBALL', 'FOOTBALL', 'VOLLEYBALL', 'GOLF', 'SKATING'],
        hard: ['BASKETBALL', 'SWIMMING', 'GYMNASTICS', 'WRESTLING', 'BADMINTON', 'CYCLING', 'SURFING', 'ARCHERY', 'SOFTBALL', 'LACROSSE']
      }
    }
  },
  
  // XP and Coin rewards
  REWARDS: {
    easy: {
      baseXP: 50,
      baseCoins: 25,
      perWordXP: 10,
      perWordCoins: 5,
      speedBonus: 2
    },
    medium: {
      baseXP: 100,
      baseCoins: 50,
      perWordXP: 15,
      perWordCoins: 8,
      speedBonus: 3
    },
    hard: {
      baseXP: 150,
      baseCoins: 75,
      perWordXP: 20,
      perWordCoins: 10,
      speedBonus: 5
    }
  }
};

/**
 * Generate a word search grid
 * @param {Array} words - List of words to hide
 * @param {number} gridSize - Size of the grid (NxN)
 * @param {boolean} useDiagonals - Allow diagonal word placement
 * @returns {Object} Grid data with word positions
 */
function generateWordSearch(words, gridSize, useDiagonals = false) {
  // Initialize empty grid
  const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
  const wordPositions = [];
  
  // Directions: [dx, dy]
  const directions = [
    [1, 0],   // right
    [0, 1],   // down
    [-1, 0],  // left
    [0, -1],  // up
  ];
  
  if (useDiagonals) {
    directions.push(
      [1, 1],   // diagonal down-right
      [-1, -1], // diagonal up-left
      [1, -1],  // diagonal up-right
      [-1, 1]   // diagonal down-left
    );
  }
  
  // Place each word
  words.forEach(word => {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!placed && attempts < maxAttempts) {
      attempts++;
      
      // Random starting position and direction
      const startRow = Math.floor(Math.random() * gridSize);
      const startCol = Math.floor(Math.random() * gridSize);
      const dir = directions[Math.floor(Math.random() * directions.length)];
      
      // Check if word fits
      let fits = true;
      const positions = [];
      
      for (let i = 0; i < word.length; i++) {
        const row = startRow + dir[1] * i;
        const col = startCol + dir[0] * i;
        
        // Out of bounds?
        if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
          fits = false;
          break;
        }
        
        // Cell empty or matches?
        if (grid[row][col] !== '' && grid[row][col] !== word[i]) {
          fits = false;
          break;
        }
        
        positions.push({ row, col });
      }
      
      // Place word if it fits
      if (fits) {
        positions.forEach((pos, i) => {
          grid[pos.row][pos.col] = word[i];
        });
        
        wordPositions.push({
          word,
          positions,
          found: false
        });
        
        placed = true;
      }
    }
    
    // If word couldn't be placed after max attempts, force it horizontally at top
    if (!placed) {
      const row = wordPositions.length % gridSize;
      const col = 0;
      const positions = [];
      
      for (let i = 0; i < word.length && col + i < gridSize; i++) {
        grid[row][col + i] = word[i];
        positions.push({ row, col: col + i });
      }
      
      wordPositions.push({
        word,
        positions,
        found: false
      });
    }
  });
  
  // Fill empty cells with random letters
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col] === '') {
        grid[row][col] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }
  
  return { grid, wordPositions };
}

/**
 * Get a random theme
 * @returns {Object} Theme object
 */
function getRandomTheme() {
  const themeKeys = Object.keys(WORD_HUNT_CONFIG.THEMES);
  const randomKey = themeKeys[Math.floor(Math.random() * themeKeys.length)];
  return WORD_HUNT_CONFIG.THEMES[randomKey];
}

/**
 * Get theme by ID
 * @param {string} themeId - Theme ID
 * @returns {Object} Theme object
 */
function getThemeById(themeId) {
  return WORD_HUNT_CONFIG.THEMES[themeId];
}
