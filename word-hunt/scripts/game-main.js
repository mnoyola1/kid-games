/**
 * Word Hunt - Main Game Component
 * Word search puzzle game with themed word lists
 */

function WordHunt() {
  // Player profile
  const [playerProfile, setPlayerProfile] = useState(null);
  
  // Game state
  const [gameState, setGameState] = useState('menu'); // menu, playing, victory
  const [difficulty, setDifficulty] = useState('easy');
  const [theme, setTheme] = useState(null);
  
  // Grid data
  const [grid, setGrid] = useState([]);
  const [wordPositions, setWordPositions] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  
  // Game progress
  const [hintsUsed, setHintsUsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [score, setScore] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Audio
  const audioManager = useRef(new AudioManager());
  
  // Initialize
  useEffect(() => {
    // Load player profile
    if (typeof LuminaCore !== 'undefined') {
      const profile = LuminaCore.getActiveProfile();
      if (profile) {
        setPlayerProfile(profile);
        LuminaCore.recordGameStart(profile.id, 'wordHunt');
      }
    }
    
    // Initialize audio
    audioManager.current.init();
  }, []);
  
  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameState, timeRemaining]);
  
  // Start new game
  const startGame = (selectedDifficulty, selectedTheme) => {
    const difficultyConfig = WORD_HUNT_CONFIG.DIFFICULTY[selectedDifficulty];
    const themeData = typeof selectedTheme === 'string' 
      ? getThemeById(selectedTheme) 
      : selectedTheme;
    
    const words = themeData.words[selectedDifficulty];
    const { grid: newGrid, wordPositions: newPositions } = generateWordSearch(
      words,
      difficultyConfig.gridSize,
      difficultyConfig.diagonals
    );
    
    setDifficulty(selectedDifficulty);
    setTheme(themeData);
    setGrid(newGrid);
    setWordPositions(newPositions);
    setSelectedCells([]);
    setFoundWords([]);
    setHintsUsed(0);
    setTimeRemaining(WORD_HUNT_CONFIG.TIME_LIMITS[selectedDifficulty]);
    setScore(difficultyConfig.baseScore);
    setGameState('playing');
    
    audioManager.current.playMusic('gameplay');
  };
  
  // Handle cell mouse down
  const handleCellMouseDown = (row, col) => {
    if (gameState !== 'playing') return;
    
    setIsDragging(true);
    setSelectedCells([{ row, col }]);
    audioManager.current.playSound('select');
  };
  
  // Handle cell mouse enter (while dragging)
  const handleCellMouseEnter = (row, col) => {
    if (!isDragging || gameState !== 'playing') return;
    
    // Check if cell is adjacent to last selected cell
    const lastCell = selectedCells[selectedCells.length - 1];
    const isAdjacent = Math.abs(row - lastCell.row) <= 1 && Math.abs(col - lastCell.col) <= 1;
    
    // Check if cell is already in selection
    const alreadySelected = selectedCells.some(cell => cell.row === row && cell.col === col);
    
    if (isAdjacent && !alreadySelected) {
      setSelectedCells(prev => [...prev, { row, col }]);
      audioManager.current.playSound('select');
    }
  };
  
  // Handle mouse up (end selection)
  const handleMouseUp = () => {
    if (!isDragging || gameState !== 'playing') return;
    
    setIsDragging(false);
    checkWord();
  };
  
  // Check if selected cells form a word
  const checkWord = () => {
    if (selectedCells.length < 2) {
      setSelectedCells([]);
      return;
    }
    
    // Get selected word
    const selectedWord = selectedCells
      .map(cell => grid[cell.row][cell.col])
      .join('');
    
    // Check if it matches any unfound word
    const matchingWord = wordPositions.find(wp => {
      if (foundWords.includes(wp.word)) return false;
      
      // Check forward
      if (wp.word === selectedWord) return true;
      
      // Check backward
      const reversed = selectedWord.split('').reverse().join('');
      if (wp.word === reversed) return true;
      
      return false;
    });
    
    if (matchingWord) {
      // Word found!
      audioManager.current.playSound('wordComplete');
      
      setFoundWords(prev => [...prev, matchingWord.word]);
      
      // Calculate points for this word
      const difficultyConfig = WORD_HUNT_CONFIG.DIFFICULTY[difficulty];
      const rewards = WORD_HUNT_CONFIG.REWARDS[difficulty];
      const wordPoints = rewards.perWordXP;
      setScore(prev => prev + wordPoints);
      
      // Check if all words found
      if (foundWords.length + 1 === wordPositions.length) {
        setTimeout(() => handlePuzzleComplete(), 500);
      }
    } else {
      // Wrong selection
      audioManager.current.playSound('wrong');
    }
    
    setSelectedCells([]);
  };
  
  // Use hint
  const useHint = () => {
    if (gameState !== 'playing') return;
    
    const difficultyConfig = WORD_HUNT_CONFIG.DIFFICULTY[difficulty];
    
    // Find first unfound word
    const unfoundWord = wordPositions.find(wp => !foundWords.includes(wp.word));
    
    if (unfoundWord) {
      audioManager.current.playSound('hint');
      
      // Reveal first letter
      const firstPos = unfoundWord.positions[0];
      setSelectedCells([firstPos]);
      
      // Deduct points
      setScore(prev => Math.max(0, prev - difficultyConfig.hintPenalty));
      setHintsUsed(prev => prev + 1);
      
      // Clear hint after 2 seconds
      setTimeout(() => setSelectedCells([]), 2000);
    }
  };
  
  // Handle puzzle complete
  const handlePuzzleComplete = () => {
    audioManager.current.stopMusic();
    audioManager.current.playSound('puzzleComplete');
    
    // Calculate final score
    const rewards = WORD_HUNT_CONFIG.REWARDS[difficulty];
    const timeBonus = timeRemaining * rewards.speedBonus;
    const finalScore = score + timeBonus;
    
    setScore(finalScore);
    
    // Award XP and coins
    if (playerProfile) {
      const xpEarned = rewards.baseXP + (foundWords.length * rewards.perWordXP);
      const coinsEarned = rewards.baseCoins + (foundWords.length * rewards.perWordCoins);
      const rewardPoints = Math.floor(xpEarned / 20);
      
      LuminaCore.addXP(playerProfile.id, xpEarned, 'wordHunt');
      LuminaCore.addCoins(playerProfile.id, coinsEarned);
      LuminaCore.addRewardPoints(playerProfile.id, rewardPoints);
      
      // Record game stats
      LuminaCore.recordGameEnd(playerProfile.id, 'wordHunt', {
        score: finalScore,
        wordsFound: foundWords.length,
        difficulty: difficulty,
        theme: theme.id,
        hintsUsed: hintsUsed,
        timeRemaining: timeRemaining
      });
      
      // Check achievements
      LuminaCore.checkAchievement(playerProfile.id, 'wh_first_puzzle');
      if (hintsUsed === 0) {
        LuminaCore.checkAchievement(playerProfile.id, 'wh_no_hints');
      }
      if (difficulty === 'hard') {
        LuminaCore.checkAchievement(playerProfile.id, 'wh_word_master');
      }
    }
    
    setGameState('victory');
  };
  
  // Return to menu
  const returnToMenu = () => {
    audioManager.current.stopMusic();
    setGameState('menu');
  };
  
  // Play again
  const playAgain = () => {
    startGame(difficulty, theme);
  };
  
  // Check if cell is selected
  const isCellSelected = (row, col) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col);
  };
  
  // Check if cell is part of found word
  const isCellFound = (row, col) => {
    return wordPositions.some(wp => {
      if (!foundWords.includes(wp.word)) return false;
      return wp.positions.some(pos => pos.row === row && pos.col === col);
    });
  };
  
  // Calculate progress
  const getProgress = () => {
    if (wordPositions.length === 0) return 0;
    return Math.floor((foundWords.length / wordPositions.length) * 100);
  };
  
  // Render menu
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              🔍 Word Hunt
            </h1>
            <p className="text-xl text-blue-200">
              Find all the hidden words in the grid!
            </p>
          </div>
          
          {/* Player Info */}
          {playerProfile && (
            <div className="bg-blue-900/40 rounded-xl p-4 mb-6 text-center">
              <p className="text-blue-200 text-lg">
                Playing as <span className="text-yellow-400 font-bold">{playerProfile.name}</span>
                {' - Level '}<span className="text-yellow-400 font-bold">{playerProfile.level}</span>
              </p>
            </div>
          )}
          
          {/* Difficulty Selection */}
          <div className="bg-blue-900/60 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-blue-100 mb-4 text-center">
              Select Difficulty
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Object.values(WORD_HUNT_CONFIG.DIFFICULTY).map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setDifficulty(diff.id)}
                  className={`py-6 px-4 rounded-lg font-bold text-xl
                    ${difficulty === diff.id 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' 
                      : 'bg-blue-800 hover:bg-blue-700 text-blue-200'
                    }
                  `}
                >
                  <div className="text-4xl mb-2">{diff.icon}</div>
                  <div className="mb-2">{diff.name}</div>
                  <div className="text-sm opacity-80">
                    {diff.gridSize}x{diff.gridSize} grid
                    <br />
                    {diff.wordCount} words
                  </div>
                </button>
              ))}
            </div>
            
            {/* Theme Selection */}
            <h3 className="text-xl font-bold text-blue-100 mb-3 text-center">
              Choose a Theme
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(WORD_HUNT_CONFIG.THEMES).map((themeOption) => (
                <button
                  key={themeOption.id}
                  onClick={() => startGame(difficulty, themeOption)}
                  className="bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-4 rounded-lg"
                >
                  <div className="text-3xl mb-1">{themeOption.icon}</div>
                  <div>{themeOption.name}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* How to Play */}
          <div className="bg-blue-900/40 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-blue-100 mb-3">
              📖 How to Play
            </h3>
            <ul className="text-blue-200 space-y-2">
              <li>🖱️ Click and drag to select letters</li>
              <li>🔤 Words can be horizontal, vertical, or diagonal</li>
              <li>↔️ Words can be spelled forwards or backwards</li>
              <li>💡 Use hints if you're stuck (costs points!)</li>
              <li>⏱️ Find all words before time runs out!</li>
            </ul>
          </div>
          
          {/* Return to Hub */}
          {playerProfile && (
            <div className="text-center">
              <a
                href="../index.html"
                className="inline-block bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg"
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
    const difficultyConfig = WORD_HUNT_CONFIG.DIFFICULTY[difficulty];
    
    return (
      <div className="min-h-screen p-4" onMouseUp={handleMouseUp}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-yellow-400">
                {theme.icon} {theme.name}
              </h2>
              <p className="text-blue-200">{difficultyConfig.name}</p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">
                ⭐ {score}
              </div>
              <div className="text-lg text-blue-200">
                ⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="bg-blue-900/60 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-blue-200">Words Found</span>
              <span className="text-yellow-400 font-bold">{foundWords.length}/{wordPositions.length}</span>
            </div>
            <div className="w-full bg-blue-900 rounded-full h-4">
              <div
                className="progress-bar-fill bg-gradient-to-r from-green-400 to-emerald-500 h-4 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Word Grid */}
            <div className="lg:col-span-3">
              <div className="bg-blue-900/60 rounded-xl p-6">
                <div 
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${difficultyConfig.gridSize}, minmax(0, 1fr))`
                  }}
                >
                  {grid.map((row, rowIndex) =>
                    row.map((letter, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                        onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                        className={`grid-cell aspect-square flex items-center justify-center
                          font-bold text-lg md:text-xl rounded-lg cursor-pointer
                          border-2 select-none
                          ${isCellFound(rowIndex, colIndex) ? 'found' : ''}
                          ${isCellSelected(rowIndex, colIndex) ? 'selected' : ''}
                          ${!isCellFound(rowIndex, colIndex) && !isCellSelected(rowIndex, colIndex) 
                            ? 'bg-blue-800 text-white border-blue-600 hover:bg-blue-700' 
                            : ''
                          }
                        `}
                      >
                        {letter}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={useHint}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-lg"
                >
                  💡 Hint ({hintsUsed})
                </button>
                
                <button
                  onClick={returnToMenu}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg"
                >
                  ❌ Give Up
                </button>
              </div>
            </div>
            
            {/* Word List */}
            <div className="lg:col-span-1">
              <div className="bg-blue-900/60 rounded-xl p-6">
                <h3 className="text-xl font-bold text-blue-100 mb-4 text-center">
                  Word List
                </h3>
                
                <div className="space-y-2">
                  {wordPositions.map((wp) => (
                    <div
                      key={wp.word}
                      className={`word-item px-4 py-2 rounded-lg font-bold text-center
                        ${foundWords.includes(wp.word)
                          ? 'bg-green-600 text-white line-through found'
                          : 'bg-blue-800 text-blue-200'
                        }
                      `}
                    >
                      {wp.word}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render victory
  if (gameState === 'victory') {
    const isPerfect = hintsUsed === 0;
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="victory-banner max-w-2xl w-full bg-gradient-to-br from-blue-900 to-purple-900 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-yellow-400 mb-4">
            All Words Found!
          </h2>
          
          <div className="bg-black/30 rounded-xl p-6 mb-6">
            <p className="text-2xl text-green-400 font-bold mb-2">
              {theme.icon} {theme.name}
            </p>
            <p className="text-blue-300">{foundWords.length} words discovered!</p>
          </div>
          
          {/* Stars */}
          <div className="flex justify-center gap-2 mb-6 text-6xl">
            <span className="star-icon">⭐</span>
            {timeRemaining > 60 && <span className="star-icon">⭐</span>}
            {isPerfect && <span className="star-icon">⭐</span>}
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-800/50 rounded-lg p-4">
              <div className="text-blue-300 text-sm">Final Score</div>
              <div className="text-3xl font-bold text-yellow-400">{score}</div>
            </div>
            <div className="bg-blue-800/50 rounded-lg p-4">
              <div className="text-blue-300 text-sm">Time Remaining</div>
              <div className="text-3xl font-bold text-green-400">{timeRemaining}s</div>
            </div>
          </div>
          
          {isPerfect && (
            <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 font-bold text-lg">
                🌟 PERFECT! NO HINTS USED! 🌟
              </p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex flex-col gap-4">
            <button
              onClick={playAgain}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 px-8 rounded-lg text-xl"
            >
              🔄 Play Again
            </button>
            
            <button
              onClick={returnToMenu}
              className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              📋 Main Menu
            </button>
            
            {playerProfile && (
              <a
                href="../index.html"
                className="bg-blue-800 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg inline-block"
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
window.WordHunt = WordHunt;
