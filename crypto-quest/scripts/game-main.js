/**
 * Crypto Quest - Main Game Component
 * Cryptogram puzzle game where players decode secret messages
 */

function CryptoQuest() {
  // Player profile
  const [playerProfile, setPlayerProfile] = useState(null);
  
  // Game state
  const [gameState, setGameState] = useState('menu'); // menu, playing, victory, gameover
  const [difficulty, setDifficulty] = useState('easy');
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [cipher, setCipher] = useState(null);
  const [encryptedMessage, setEncryptedMessage] = useState('');
  
  // Player input
  const [userMapping, setUserMapping] = useState({}); // encrypted -> decrypted guesses
  const [selectedLetter, setSelectedLetter] = useState(null);
  
  // Game progress
  const [hintsUsed, setHintsUsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  
  // Audio
  const audioManager = useRef(new AudioManager());
  
  // Initialize
  useEffect(() => {
    // Load player profile
    if (typeof LuminaCore !== 'undefined') {
      const profile = LuminaCore.getActiveProfile();
      if (profile) {
        setPlayerProfile(profile);
        LuminaCore.recordGameStart(profile.id, 'cryptoQuest');
      }
    }
    
    // Initialize audio
    audioManager.current.init();
  }, []);
  
  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameState, timeRemaining]);
  
  // Start new puzzle
  const startGame = (selectedDifficulty) => {
    const puzzle = getRandomPuzzle(selectedDifficulty);
    const newCipher = generateCipher();
    const encrypted = encryptMessage(puzzle.message, newCipher);
    
    setDifficulty(selectedDifficulty);
    setCurrentPuzzle(puzzle);
    setCipher(newCipher);
    setEncryptedMessage(encrypted);
    setUserMapping({});
    setSelectedLetter(null);
    setHintsUsed(0);
    setMistakes(0);
    setTimeRemaining(CRYPTO_CONFIG.TIME_LIMITS[selectedDifficulty]);
    setScore(CRYPTO_CONFIG.DIFFICULTY[selectedDifficulty].baseScore);
    setGameState('playing');
    
    audioManager.current.playMusic('gameplay');
  };
  
  // Handle letter selection for mapping
  const handleEncryptedClick = (encryptedChar) => {
    if (encryptedChar === ' ' || gameState !== 'playing') return;
    audioManager.current.playSound('click');
    setSelectedLetter(encryptedChar);
  };
  
  // Handle decrypted letter guess
  const handleGuessLetter = (guessedChar) => {
    if (!selectedLetter || gameState !== 'playing') return;
    
    // Get the reverse cipher (decrypted -> encrypted)
    const reverseCipher = {};
    Object.keys(cipher).forEach(key => {
      reverseCipher[cipher[key]] = key;
    });
    
    // Check if guess is correct
    const correctAnswer = reverseCipher[selectedLetter];
    const isCorrect = guessedChar === correctAnswer;
    
    if (isCorrect) {
      audioManager.current.playSound('correct');
      
      // Update user mapping
      const newMapping = { ...userMapping };
      newMapping[selectedLetter] = guessedChar;
      setUserMapping(newMapping);
      
      // Create particle effect
      createParticleEffect(selectedLetter, '#22c55e');
      
      // Check if puzzle is solved
      const uniqueLetters = new Set(encryptedMessage.replace(/ /g, ''));
      const mappedCount = Object.keys(newMapping).length;
      
      if (mappedCount === uniqueLetters.size) {
        handlePuzzleComplete();
      }
    } else {
      audioManager.current.playSound('wrong');
      setMistakes(prev => prev + 1);
      
      // Deduct points for mistake
      setScore(prev => Math.max(0, prev - 5));
      
      // Create error particle effect
      createParticleEffect(selectedLetter, '#ef4444');
    }
    
    setSelectedLetter(null);
  };
  
  // Use hint
  const useHint = () => {
    const difficultyConfig = CRYPTO_CONFIG.DIFFICULTY[difficulty];
    
    if (hintsUsed >= difficultyConfig.maxHints || gameState !== 'playing') return;
    
    audioManager.current.playSound('hint');
    
    // Find an unmapped letter
    const reverseCipher = {};
    Object.keys(cipher).forEach(key => {
      reverseCipher[cipher[key]] = key;
    });
    
    const unmappedLetters = [...new Set(encryptedMessage.replace(/ /g, ''))]
      .filter(char => !userMapping[char]);
    
    if (unmappedLetters.length > 0) {
      const hintLetter = unmappedLetters[0];
      const correctAnswer = reverseCipher[hintLetter];
      
      const newMapping = { ...userMapping };
      newMapping[hintLetter] = correctAnswer;
      setUserMapping(newMapping);
      
      setHintsUsed(prev => prev + 1);
      setScore(prev => Math.max(0, prev - difficultyConfig.hintPenalty));
      
      // Create hint particle effect
      createParticleEffect(hintLetter, '#facc15');
    }
  };
  
  // Particle effect helper
  const createParticleEffect = (letter, color) => {
    // Simple visual feedback (actual particles would be implemented in DOM)
    console.log(`✨ Particle effect for ${letter} with color ${color}`);
  };
  
  // Puzzle complete
  const handlePuzzleComplete = () => {
    audioManager.current.stopMusic();
    audioManager.current.playSound('complete');
    
    // Calculate final score with time bonus
    const difficultyConfig = CRYPTO_CONFIG.DIFFICULTY[difficulty];
    const timeBonus = timeRemaining * difficultyConfig.timeBonus;
    const perfectBonus = mistakes === 0 && hintsUsed === 0 
      ? CRYPTO_CONFIG.REWARDS[difficulty].perfectBonus 
      : 0;
    
    const finalScore = score + timeBonus + perfectBonus;
    setScore(finalScore);
    
    // Award XP and coins
    if (playerProfile) {
      const xpEarned = CRYPTO_CONFIG.REWARDS[difficulty].baseXP + Math.floor(timeBonus / 2);
      const coinsEarned = CRYPTO_CONFIG.REWARDS[difficulty].baseCoins + Math.floor(timeBonus / 4);
      const rewardPoints = Math.floor(xpEarned / 20);
      
      LuminaCore.addXP(playerProfile.id, xpEarned, 'cryptoQuest');
      LuminaCore.addCoins(playerProfile.id, coinsEarned);
      LuminaCore.addRewardPoints(playerProfile.id, rewardPoints);
      
      // Record game stats
      LuminaCore.recordGameEnd(playerProfile.id, 'cryptoQuest', {
        score: finalScore,
        puzzlesSolved: puzzlesSolved + 1,
        difficulty: difficulty,
        hintsUsed: hintsUsed,
        mistakes: mistakes,
        timeRemaining: timeRemaining
      });
      
      // Check achievements
      LuminaCore.checkAchievement(playerProfile.id, 'cq_first_solve');
      if (mistakes === 0 && hintsUsed === 0) {
        LuminaCore.checkAchievement(playerProfile.id, 'cq_perfect_solve');
      }
      if (difficulty === 'hard') {
        LuminaCore.checkAchievement(playerProfile.id, 'cq_master_decoder');
      }
    }
    
    setPuzzlesSolved(prev => prev + 1);
    setGameState('victory');
  };
  
  // Game over (time expired)
  const handleGameOver = () => {
    audioManager.current.stopMusic();
    audioManager.current.playSound('wrong');
    
    if (playerProfile) {
      LuminaCore.recordGameEnd(playerProfile.id, 'cryptoQuest', {
        score: score,
        puzzlesSolved: puzzlesSolved,
        difficulty: difficulty,
        completed: false
      });
    }
    
    setGameState('gameover');
  };
  
  // Play again
  const playAgain = () => {
    startGame(difficulty);
  };
  
  // Return to menu
  const returnToMenu = () => {
    audioManager.current.stopMusic();
    setGameState('menu');
  };
  
  // Get decrypted message preview
  const getDecryptedPreview = () => {
    return encryptedMessage.split('').map(char => {
      if (char === ' ') return ' ';
      return userMapping[char] || '_';
    }).join('');
  };
  
  // Calculate progress percentage
  const getProgress = () => {
    const uniqueLetters = new Set(encryptedMessage.replace(/ /g, ''));
    const mappedCount = Object.keys(userMapping).length;
    return Math.floor((mappedCount / uniqueLetters.size) * 100);
  };
  
  // Render menu
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400">
              🔐 Crypto Quest
            </h1>
            <p className="text-xl text-purple-200">
              Decode secret messages and uncover hidden wisdom!
            </p>
          </div>
          
          {/* Player Info */}
          {playerProfile && (
            <div className="bg-purple-900/40 rounded-xl p-4 mb-6 text-center">
              <p className="text-purple-200 text-lg">
                Playing as <span className="text-yellow-400 font-bold">{playerProfile.name}</span>
                {' - Level '}<span className="text-yellow-400 font-bold">{playerProfile.level}</span>
              </p>
            </div>
          )}
          
          {/* Difficulty Selection */}
          <div className="bg-purple-900/60 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-purple-100 mb-4 text-center">
              Select Difficulty
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(CRYPTO_CONFIG.DIFFICULTY).map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => startGame(diff.id)}
                  className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-6 px-4 rounded-lg"
                >
                  <div className="text-4xl mb-2">{diff.icon}</div>
                  <div className="text-xl mb-2">{diff.name}</div>
                  <div className="text-sm opacity-80">
                    {diff.baseScore} pts base
                    <br />
                    {diff.maxHints} hints
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* How to Play */}
          <div className="bg-purple-900/40 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-purple-100 mb-3">
              📖 How to Play
            </h3>
            <ul className="text-purple-200 space-y-2">
              <li>🔤 Each letter is replaced with another letter</li>
              <li>🎯 Click an encrypted letter, then guess the real letter</li>
              <li>💡 Use hints if you're stuck (costs points!)</li>
              <li>⏱️ Solve before time runs out</li>
              <li>⭐ Perfect solve (no mistakes/hints) = bonus points!</li>
            </ul>
          </div>
          
          {/* Return to Hub */}
          {playerProfile && (
            <div className="text-center">
              <a
                href="../index.html"
                className="inline-block bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg"
              >
                🏠 Return to Noyola Hub
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Render game
  if (gameState === 'playing') {
    const progress = getProgress();
    const decryptedPreview = getDecryptedPreview();
    const difficultyConfig = CRYPTO_CONFIG.DIFFICULTY[difficulty];
    
    // Get available letters for guessing
    const usedGuesses = new Set(Object.values(userMapping));
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-yellow-400">
                {difficultyConfig.icon} {difficultyConfig.name}
              </h2>
              <p className="text-purple-200">{currentPuzzle.category}</p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">
                ⭐ {score}
              </div>
              <div className="text-lg text-purple-200">
                ⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="bg-purple-900/60 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-purple-200">Progress</span>
              <span className="text-yellow-400 font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-purple-900 rounded-full h-4">
              <div
                className="progress-bar-fill bg-gradient-to-r from-yellow-400 to-pink-500 h-4 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {/* Encrypted Message */}
          <div className="bg-purple-900/60 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-purple-100 mb-4 text-center">
              🔐 Encrypted Message
            </h3>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {encryptedMessage.split('').map((char, index) => (
                <div
                  key={index}
                  onClick={() => handleEncryptedClick(char)}
                  className={`crypto-letter w-12 h-12 flex items-center justify-center rounded-lg font-bold text-xl cursor-pointer
                    ${char === ' ' ? 'invisible' : ''}
                    ${char === selectedLetter ? 'bg-yellow-500 text-black' : 'bg-purple-700 text-white'}
                    ${userMapping[char] ? 'border-4 border-green-500' : 'border-2 border-purple-500'}
                  `}
                >
                  {char}
                </div>
              ))}
            </div>
            
            {/* Decrypted Preview */}
            <div className="bg-purple-800 rounded-lg p-4">
              <h4 className="text-sm text-purple-300 mb-2">Your Solution:</h4>
              <div className="text-2xl font-bold text-center text-green-400 font-mono tracking-wider">
                {decryptedPreview}
              </div>
            </div>
          </div>
          
          {/* Letter Selection */}
          <div className="bg-purple-900/60 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-purple-100 mb-4 text-center">
              {selectedLetter ? (
                <>Select the letter for <span className="text-yellow-400 text-2xl">{selectedLetter}</span></>
              ) : (
                'Click an encrypted letter above to start guessing'
              )}
            </h3>
            
            <div className="grid grid-cols-13 gap-2">
              {alphabet.map(letter => (
                <button
                  key={letter}
                  onClick={() => handleGuessLetter(letter)}
                  disabled={!selectedLetter || usedGuesses.has(letter)}
                  className={`w-10 h-10 rounded-lg font-bold text-lg
                    ${usedGuesses.has(letter) 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }
                  `}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={useHint}
              disabled={hintsUsed >= difficultyConfig.maxHints}
              className="hint-button bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-bold py-3 px-6 rounded-lg"
            >
              💡 Hint ({hintsUsed}/{difficultyConfig.maxHints})
            </button>
            
            <button
              onClick={returnToMenu}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg"
            >
              ❌ Give Up
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-purple-900/40 rounded-lg p-4">
              <div className="text-purple-300 text-sm">Hints Used</div>
              <div className="text-2xl font-bold text-yellow-400">{hintsUsed}</div>
            </div>
            <div className="bg-purple-900/40 rounded-lg p-4">
              <div className="text-purple-300 text-sm">Mistakes</div>
              <div className="text-2xl font-bold text-red-400">{mistakes}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render victory
  if (gameState === 'victory') {
    const isPerfect = mistakes === 0 && hintsUsed === 0;
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="victory-banner max-w-2xl w-full bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-yellow-400 mb-4">
            Message Decoded!
          </h2>
          
          <div className="bg-black/30 rounded-xl p-6 mb-6">
            <p className="text-2xl text-green-400 font-bold mb-2">
              "{currentPuzzle.message}"
            </p>
            <p className="text-purple-300">- {currentPuzzle.category}</p>
          </div>
          
          {/* Stars */}
          <div className="flex justify-center gap-2 mb-6 text-6xl">
            <span className="star-icon">⭐</span>
            {mistakes === 0 && <span className="star-icon">⭐</span>}
            {isPerfect && <span className="star-icon">⭐</span>}
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-800/50 rounded-lg p-4">
              <div className="text-purple-300 text-sm">Final Score</div>
              <div className="text-3xl font-bold text-yellow-400">{score}</div>
            </div>
            <div className="bg-purple-800/50 rounded-lg p-4">
              <div className="text-purple-300 text-sm">Time Remaining</div>
              <div className="text-3xl font-bold text-green-400">{timeRemaining}s</div>
            </div>
            <div className="bg-purple-800/50 rounded-lg p-4">
              <div className="text-purple-300 text-sm">Hints Used</div>
              <div className="text-2xl font-bold text-yellow-400">{hintsUsed}</div>
            </div>
            <div className="bg-purple-800/50 rounded-lg p-4">
              <div className="text-purple-300 text-sm">Mistakes</div>
              <div className="text-2xl font-bold text-red-400">{mistakes}</div>
            </div>
          </div>
          
          {isPerfect && (
            <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 font-bold text-lg">
                🌟 PERFECT SOLVE! 🌟
                <br />
                <span className="text-sm">No mistakes, no hints - amazing!</span>
              </p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex flex-col gap-4">
            <button
              onClick={playAgain}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 px-8 rounded-lg text-xl"
            >
              🔄 Solve Another
            </button>
            
            <button
              onClick={returnToMenu}
              className="bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              📋 Main Menu
            </button>
            
            {playerProfile && (
              <a
                href="../index.html"
                className="bg-purple-800 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg inline-block"
              >
                🏠 Return to Noyola Hub
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Render game over
  if (gameState === 'gameover') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gradient-to-br from-red-900 to-purple-900 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-4xl font-bold text-red-400 mb-4">
            Time's Up!
          </h2>
          
          <div className="bg-black/30 rounded-xl p-6 mb-6">
            <p className="text-xl text-purple-300 mb-2">
              The message was:
            </p>
            <p className="text-2xl text-yellow-400 font-bold">
              "{currentPuzzle.message}"
            </p>
          </div>
          
          <p className="text-purple-200 mb-6">
            Don't give up! Try again and decode it faster!
          </p>
          
          <div className="flex flex-col gap-4">
            <button
              onClick={playAgain}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-lg text-xl"
            >
              🔄 Try Again
            </button>
            
            <button
              onClick={returnToMenu}
              className="bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              📋 Main Menu
            </button>
            
            {playerProfile && (
              <a
                href="../index.html"
                className="bg-purple-800 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg inline-block"
              >
                🏠 Return to Noyola Hub
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}

// Export for use
window.CryptoQuest = CryptoQuest;
