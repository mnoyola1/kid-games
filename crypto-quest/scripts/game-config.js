/**
 * Crypto Quest - Game Configuration
 * Cryptogram puzzles with educational messages
 */

const CRYPTO_CONFIG = {
  // Difficulty levels
  DIFFICULTY: {
    EASY: {
      id: 'easy',
      name: 'Code Cadet',
      icon: '🌱',
      baseScore: 100,
      hintPenalty: 10,
      timeBonus: 2, // points per second remaining
      maxHints: 5
    },
    MEDIUM: {
      id: 'medium',
      name: 'Cipher Scout',
      icon: '⚔️',
      baseScore: 200,
      hintPenalty: 15,
      timeBonus: 3,
      maxHints: 3
    },
    HARD: {
      id: 'hard',
      name: 'Crypto Master',
      icon: '🔥',
      baseScore: 300,
      hintPenalty: 20,
      timeBonus: 5,
      maxHints: 2
    }
  },
  
  // Cryptogram puzzles
  PUZZLES: {
    easy: [
      {
        id: 'easy_1',
        message: 'BE KIND TO EVERYONE',
        category: 'Life Lesson',
        hint: 'Think about how to treat people'
      },
      {
        id: 'easy_2',
        message: 'READING IS FUN',
        category: 'Education',
        hint: 'What do you do with books?'
      },
      {
        id: 'easy_3',
        message: 'PRACTICE MAKES PERFECT',
        category: 'Life Lesson',
        hint: 'How do you get better at something?'
      },
      {
        id: 'easy_4',
        message: 'STAY CURIOUS',
        category: 'Wisdom',
        hint: 'Keep asking questions'
      },
      {
        id: 'easy_5',
        message: 'BELIEVE IN YOURSELF',
        category: 'Motivation',
        hint: 'Have confidence'
      },
      {
        id: 'easy_6',
        message: 'FAMILY IS IMPORTANT',
        category: 'Life Lesson',
        hint: 'The people who love you'
      },
      {
        id: 'easy_7',
        message: 'LEARNING NEVER STOPS',
        category: 'Education',
        hint: 'You can always grow'
      },
      {
        id: 'easy_8',
        message: 'BE YOUR BEST SELF',
        category: 'Motivation',
        hint: 'Try to improve every day'
      }
    ],
    
    medium: [
      {
        id: 'med_1',
        message: 'THE EARLY BIRD GETS THE WORM',
        category: 'Proverb',
        hint: 'Famous saying about waking up early'
      },
      {
        id: 'med_2',
        message: 'ACTIONS SPEAK LOUDER THAN WORDS',
        category: 'Proverb',
        hint: 'What you do matters more than what you say'
      },
      {
        id: 'med_3',
        message: 'KNOWLEDGE IS POWER',
        category: 'Wisdom',
        hint: 'Learning makes you strong'
      },
      {
        id: 'med_4',
        message: 'EVERY CLOUD HAS A SILVER LINING',
        category: 'Proverb',
        hint: 'Something good in every bad situation'
      },
      {
        id: 'med_5',
        message: 'HONESTY IS THE BEST POLICY',
        category: 'Life Lesson',
        hint: 'Always tell the truth'
      },
      {
        id: 'med_6',
        message: 'TEAMWORK MAKES THE DREAM WORK',
        category: 'Collaboration',
        hint: 'Working together is powerful'
      },
      {
        id: 'med_7',
        message: 'MISTAKES ARE PROOF YOU ARE TRYING',
        category: 'Motivation',
        hint: 'Errors show effort'
      },
      {
        id: 'med_8',
        message: 'THE JOURNEY OF A THOUSAND MILES BEGINS WITH ONE STEP',
        category: 'Proverb',
        hint: 'Start small to achieve big things'
      }
    ],
    
    hard: [
      {
        id: 'hard_1',
        message: 'THE ONLY IMPOSSIBLE JOURNEY IS THE ONE YOU NEVER BEGIN',
        category: 'Wisdom',
        hint: 'Start to succeed'
      },
      {
        id: 'hard_2',
        message: 'IMAGINATION IS MORE IMPORTANT THAN KNOWLEDGE',
        category: 'Einstein Quote',
        hint: 'Famous scientist said this'
      },
      {
        id: 'hard_3',
        message: 'IN THE MIDDLE OF DIFFICULTY LIES OPPORTUNITY',
        category: 'Einstein Quote',
        hint: 'Challenges bring chances'
      },
      {
        id: 'hard_4',
        message: 'EDUCATION IS THE MOST POWERFUL WEAPON TO CHANGE THE WORLD',
        category: 'Mandela Quote',
        hint: 'Learning transforms everything'
      },
      {
        id: 'hard_5',
        message: 'THE FUTURE BELONGS TO THOSE WHO BELIEVE IN THEIR DREAMS',
        category: 'Roosevelt Quote',
        hint: 'Dream believers win'
      },
      {
        id: 'hard_6',
        message: 'SUCCESS IS NOT FINAL FAILURE IS NOT FATAL COURAGE COUNTS',
        category: 'Churchill Quote',
        hint: 'Keep going no matter what'
      },
      {
        id: 'hard_7',
        message: 'THE BEST WAY TO PREDICT YOUR FUTURE IS TO CREATE IT',
        category: 'Lincoln Quote',
        hint: 'You control your destiny'
      },
      {
        id: 'hard_8',
        message: 'BELIEVE YOU CAN AND YOU ARE HALFWAY THERE',
        category: 'Roosevelt Quote',
        hint: 'Confidence is half the battle'
      }
    ]
  },
  
  // XP and Coin rewards
  REWARDS: {
    easy: {
      baseXP: 40,
      baseCoins: 20,
      perfectBonus: 20
    },
    medium: {
      baseXP: 80,
      baseCoins: 40,
      perfectBonus: 40
    },
    hard: {
      baseXP: 120,
      baseCoins: 60,
      perfectBonus: 60
    }
  },
  
  // Time limits (seconds)
  TIME_LIMITS: {
    easy: 180,    // 3 minutes
    medium: 240,  // 4 minutes
    hard: 300     // 5 minutes
  }
};

/**
 * Generate a random cipher mapping
 * @returns {Object} mapping of A-Z to shuffled A-Z
 */
function generateCipher() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const shuffled = [...alphabet];
  
  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Ensure no letter maps to itself (make it harder)
  let hasMatch = true;
  let attempts = 0;
  while (hasMatch && attempts < 100) {
    hasMatch = false;
    for (let i = 0; i < alphabet.length; i++) {
      if (alphabet[i] === shuffled[i]) {
        hasMatch = true;
        // Swap with next position
        const swapIndex = (i + 1) % alphabet.length;
        [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
      }
    }
    attempts++;
  }
  
  // Create mapping object
  const cipher = {};
  alphabet.forEach((letter, index) => {
    cipher[letter] = shuffled[index];
  });
  
  return cipher;
}

/**
 * Encrypt a message using the cipher
 * @param {string} message - Original message
 * @param {Object} cipher - Cipher mapping
 * @returns {string} Encrypted message
 */
function encryptMessage(message, cipher) {
  return message
    .toUpperCase()
    .split('')
    .map(char => {
      if (char >= 'A' && char <= 'Z') {
        return cipher[char];
      }
      return char; // Keep spaces and punctuation
    })
    .join('');
}

/**
 * Get a random puzzle for the given difficulty
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {Object} Puzzle object
 */
function getRandomPuzzle(difficulty) {
  const puzzles = CRYPTO_CONFIG.PUZZLES[difficulty];
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}
