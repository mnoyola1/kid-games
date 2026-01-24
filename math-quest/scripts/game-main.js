// ==================== MAIN GAME COMPONENT ====================
function MathQuest() {
  // ==================== LUMINA CORE INTEGRATION ====================
  const [playerProfile, setPlayerProfile] = useState(null);
  const [playerName, setPlayerName] = useState('');
  
  useEffect(() => {
    if (typeof LuminaCore !== 'undefined') {
      const profile = LuminaCore.getActiveProfile();
      if (profile) {
        setPlayerProfile(profile);
        setPlayerName(profile.name);
        console.log('⚔️ Math Quest: Playing as', profile.name);
        LuminaCore.recordGameStart(profile.id, 'mathQuest');
      }
    }
  }, []);
  
  // ==================== GAME STATE ====================
  const [screen, setScreen] = useState('menu'); // menu, areaSelect, battle, victory, gameover
  const [currentArea, setCurrentArea] = useState(null);
  const [currentEnemy, setCurrentEnemy] = useState(null);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [battleState, setBattleState] = useState('problem'); // problem, attacking, enemyTurn, defeated
  
  // Player stats
  const [playerHP, setPlayerHP] = useState(100);
  const [maxHP, setMaxHP] = useState(100);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerXP, setPlayerXP] = useState(0);
  const [xpToNext, setXpToNext] = useState(50);
  const [playerCoins, setPlayerCoins] = useState(0);
  const [playerAttack, setPlayerAttack] = useState(10);
  
  // Enemy stats
  const [enemyHP, setEnemyHP] = useState(0);
  const [enemyMaxHP, setEnemyMaxHP] = useState(0);
  
  // Battle stats
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  
  // Difficulty
  const [difficulty, setDifficulty] = useState('easy');
  const [unlockedAreas, setUnlockedAreas] = useState(['meadow']);
  
  // Juice & Effects
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [battleMessage, setBattleMessage] = useState('');
  const [playerHit, setPlayerHit] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  
  // Refs
  const juiceSystem = useMemo(() => new JuiceSystem(), []);
  const audioManager = useMemo(() => {
    const manager = new AudioManager();
    manager.preloadMusic();
    return manager;
  }, []);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Game loop for juice system
  useEffect(() => {
    if (screen !== 'battle' && screen !== 'menu') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let lastTime = Date.now();
    
    const loop = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and render juice
      juiceSystem.update(deltaTime);
      juiceSystem.render(ctx, 0, 0);
      
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    
    loop();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [screen, juiceSystem]);
  
  // ==================== INITIALIZATION ====================
  useEffect(() => {
    if (screen === 'menu') {
      audioManager.playMusic('menu');
    } else if (screen === 'battle') {
      if (currentEnemy?.isBoss) {
        audioManager.playMusic('boss');
      } else {
        audioManager.playMusic('gameplay');
      }
    }
  }, [screen, currentEnemy, audioManager]);
  
  const generateNewProblem = useCallback(() => {
    const problem = generateMathProblem(difficulty);
    setCurrentProblem(problem);
    setSelectedAnswer(null);
    setBattleState('problem');
  }, [difficulty]);
  
  // ==================== AREA SELECTION ====================
  const selectArea = useCallback((area) => {
    if (!unlockedAreas.includes(area.id)) return;
    
    setCurrentArea(area);
    setDifficulty(area.difficulty);
    
    // Start battle
    setScreen('battle');
    const enemyType = randomFrom(area.enemies);
    const enemy = ENEMIES[enemyType];
    setCurrentEnemy(enemy);
    setEnemyHP(enemy.hp);
    setEnemyMaxHP(enemy.hp);
    setBattleState('problem');
    setCombo(0);
    setSelectedAnswer(null);
    setPlayerHit(false);
    setEnemyHit(false);
    const problem = generateMathProblem(area.difficulty);
    setCurrentProblem(problem);
  }, [unlockedAreas]);
  
  const selectAnswer = useCallback((answer) => {
    if (battleState !== 'problem' || selectedAnswer !== null) return;
    
    setSelectedAnswer(answer);
    setTotalAnswers(prev => prev + 1);
    
    if (answer === currentProblem.answer) {
      // CORRECT!
      setCorrectAnswers(prev => prev + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));
      
      // Juice
      juiceSystem.correctAnswer(400, 300);
      audioManager.playSFX('correct');
      audioManager.playLayeredSound(['correct', 'attack'], [0, 100]);
      
      // Calculate damage
      const baseDamage = playerAttack;
      const comboBonus = Math.min(newCombo * 2, 20);
      const totalDamage = baseDamage + comboBonus;
      
      // Attack enemy
      setBattleState('attacking');
      setEnemyHit(true);
      setTimeout(() => setEnemyHit(false), 300);
      
      juiceSystem.playerAttack(400, 200);
      juiceSystem.shakeScreen(3, 100);
      
      const newEnemyHP = Math.max(0, enemyHP - totalDamage);
      setEnemyHP(newEnemyHP);
      
      // Floating damage
      juiceSystem.createFloatingText(400, 200, `-${totalDamage}`, {
        color: '#F44336',
        fontSize: 28,
        duration: 800
      });
      
      if (newEnemyHP <= 0) {
        // Enemy defeated!
        setTimeout(() => {
          handleEnemyDefeated();
        }, 500);
      } else {
        // Continue battle
        setTimeout(() => {
          generateNewProblem();
        }, 1000);
      }
    } else {
      // WRONG!
      juiceSystem.wrongAnswer(400, 300);
      audioManager.playSFX('wrong');
      setCombo(0);
      
      // Enemy attacks
      setTimeout(() => {
        enemyAttack();
      }, 500);
    }
  }, [battleState, selectedAnswer, currentProblem, combo, enemyHP, playerAttack, difficulty, juiceSystem, audioManager, generateNewProblem, handleEnemyDefeated]);
  
  const enemyAttack = useCallback(() => {
    setBattleState('enemyTurn');
    setPlayerHit(true);
    setTimeout(() => setPlayerHit(false), 300);
    
    const damage = currentEnemy.attack;
    const newHP = Math.max(0, playerHP - damage);
    setPlayerHP(newHP);
    
    juiceSystem.enemyAttack(200, 300);
    juiceSystem.shakeScreen(4, 120);
    audioManager.playSFX('hit');
    
    juiceSystem.createFloatingText(200, 300, `-${damage}`, {
      color: '#F44336',
      fontSize: 24,
      duration: 800
    });
    
    if (newHP <= 0) {
      // Game over
      setTimeout(() => {
        gameOver();
      }, 1000);
    } else {
      // Continue
      setTimeout(() => {
        generateNewProblem();
      }, 1000);
    }
  }, [playerHP, currentEnemy, juiceSystem, audioManager, generateNewProblem, gameOver]);
  
  const handleEnemyDefeated = useCallback(() => {
    setBattleState('defeated');
    setEnemiesDefeated(prev => prev + 1);
    
    const xpReward = Math.floor(currentEnemy.xpReward * DIFFICULTY_LEVELS[difficulty].xpMultiplier);
    const coinReward = Math.floor(currentEnemy.coinReward * DIFFICULTY_LEVELS[difficulty].coinMultiplier);
    
    // Juice celebration
    juiceSystem.enemyDefeated(400, 200, xpReward, coinReward);
    audioManager.playLayeredSound(['defeat', 'coin'], [0, 200]);
    
    // Award rewards
    setPlayerXP(prev => {
      const newXP = prev + xpReward;
      checkLevelUp(newXP);
      return newXP;
    });
    setPlayerCoins(prev => prev + coinReward);
    
    // Award to LuminaCore
    if (playerProfile) {
      LuminaCore.addXP(playerProfile.id, xpReward, 'mathQuest');
      LuminaCore.addCoins(playerProfile.id, coinReward, 'mathQuest');
      LuminaCore.addRewardPoints(playerProfile.id, Math.floor(xpReward / 20));
    }
    
    // Check for area unlock
    if (enemiesDefeated + 1 >= 5 && !unlockedAreas.includes('forest')) {
      setUnlockedAreas(prev => [...prev, 'forest']);
      setBattleMessage('🌲 Forest Unlocked!');
    } else if (enemiesDefeated + 1 >= 15 && !unlockedAreas.includes('mountain')) {
      setUnlockedAreas(prev => [...prev, 'mountain']);
      setBattleMessage('⛰️ Mountain Unlocked!');
    } else if (enemiesDefeated + 1 >= 30 && !unlockedAreas.includes('castle')) {
      setUnlockedAreas(prev => [...prev, 'castle']);
      setBattleMessage('🏰 Castle Unlocked!');
    }
    
    // Continue or return
    setTimeout(() => {
      setBattleMessage('Continue?');
    }, 2000);
  }, [currentEnemy, difficulty, playerProfile, enemiesDefeated, unlockedAreas, juiceSystem, audioManager]);
  
  const checkLevelUp = useCallback((newXP) => {
    if (newXP >= xpToNext) {
      const newLevel = playerLevel + 1;
      setPlayerLevel(newLevel);
      setXpToNext(newLevel * 50);
      setMaxHP(prev => prev + 20);
      setPlayerHP(prev => Math.min(prev + 20, maxHP + 20));
      setPlayerAttack(prev => prev + 5);
      
      // Level up juice!
      setShowLevelUp(true);
      juiceSystem.levelUp(300, 300);
      audioManager.playSFX('levelup');
      
      setTimeout(() => {
        setShowLevelUp(false);
      }, 3000);
    }
  }, [playerLevel, xpToNext, maxHP, juiceSystem, audioManager]);
  
  const continueBattle = useCallback(() => {
    if (currentArea) {
      const enemyType = randomFrom(currentArea.enemies);
      const enemy = ENEMIES[enemyType];
      setCurrentEnemy(enemy);
      setEnemyHP(enemy.hp);
      setEnemyMaxHP(enemy.hp);
      setBattleState('problem');
      setCombo(0);
      setSelectedAnswer(null);
      setPlayerHit(false);
      setEnemyHit(false);
      setBattleMessage('');
      const problem = generateMathProblem(currentArea.difficulty);
      setCurrentProblem(problem);
    }
  }, [currentArea]);
  
  const returnToAreaSelect = useCallback(() => {
    setScreen('areaSelect');
    setCurrentEnemy(null);
    setCurrentProblem(null);
    audioManager.stopMusic();
  }, [audioManager]);
  
  const gameOver = useCallback(() => {
    setScreen('gameover');
    audioManager.playMusic('gameover');
    
    // Record game results
    if (playerProfile) {
      const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
      LuminaCore.recordGameEnd(playerProfile.id, 'mathQuest', {
        enemiesDefeated,
        correctAnswers,
        totalAnswers,
        accuracy,
        maxCombo,
        playerLevel
      });
      
      // Check achievements
      if (enemiesDefeated >= 1) LuminaCore.checkAchievement(playerProfile.id, 'mq_first_win');
      if (enemiesDefeated >= 10) LuminaCore.checkAchievement(playerProfile.id, 'mq_veteran');
      if (maxCombo >= 10) LuminaCore.checkAchievement(playerProfile.id, 'mq_combo_master');
      if (playerLevel >= 5) LuminaCore.checkAchievement(playerProfile.id, 'mq_level_5');
    }
  }, [playerProfile, enemiesDefeated, correctAnswers, totalAnswers, maxCombo, playerLevel, audioManager]);
  
  // ==================== RENDER ====================
  return (
    <div className="w-full h-screen overflow-hidden relative" style={{
      transform: `translate(${juiceSystem.getScreenShake().x}px, ${juiceSystem.getScreenShake().y}px)`
    }}>
      {/* Juice Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-30"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${currentArea?.bgGradient || 'from-purple-900 to-indigo-900'}`}>
        <div className="stars" />
      </div>
      
      {/* ==================== MENU ==================== */}
      {screen === 'menu' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <div className="text-center animate-float">
            <div className="text-8xl mb-4">⚔️</div>
            <h1 className="font-title text-6xl md:text-7xl text-amber-400 mb-2"
                style={{ textShadow: '0 0 30px rgba(251, 191, 36, 0.5)' }}>
              MATH QUEST
            </h1>
            <p className="font-game text-xl text-purple-300 mb-8">
              Defeat monsters with math! Save the Numbers Realm! 🦊
            </p>
          </div>
          
          <button
            onClick={() => {
              audioManager.playSFX('select');
              setScreen('areaSelect');
            }}
            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 
                     text-white font-title text-2xl rounded-xl shadow-lg hover:scale-105
                     border-2 border-purple-400/50 transition-all animate-pulse-glow mb-4"
          >
            🗺️ START ADVENTURE
          </button>
          
          {/* Audio Controls */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => {
                const enabled = audioManager.toggleMusic();
                if (enabled) audioManager.playMusic('menu');
              }}
              className="px-4 py-2 bg-slate-800/80 text-white rounded-lg hover:bg-slate-700 transition-all border border-purple-500/30"
            >
              {audioManager.musicEnabled ? '🔊' : '🔇'} Music
            </button>
            <button
              onClick={() => audioManager.toggleSFX()}
              className="px-4 py-2 bg-slate-800/80 text-white rounded-lg hover:bg-slate-700 transition-all border border-purple-500/30"
            >
              {audioManager.sfxEnabled ? '🔊' : '🔇'} SFX
            </button>
          </div>
          
          {playerProfile && (
            <a href="../index.html" className="mt-8 text-purple-400 hover:text-purple-300 font-game">
              🏠 Return to Noyola Hub
            </a>
          )}
        </div>
      )}
      
      {/* ==================== AREA SELECT ==================== */}
      {screen === 'areaSelect' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 overflow-auto">
          <h2 className="font-title text-4xl text-amber-400 mb-6">Choose Your Adventure</h2>
          
          <div className="grid grid-cols-2 gap-4 max-w-2xl mb-6">
            {AREAS.map(area => {
              const isUnlocked = unlockedAreas.includes(area.id);
              return (
                <button
                  key={area.id}
                  onClick={() => isUnlocked && selectArea(area)}
                  disabled={!isUnlocked}
                  className={`bg-slate-900/80 rounded-2xl p-6 border-2 transition-all text-left
                            ${isUnlocked 
                              ? 'border-purple-500/50 hover:border-purple-400 hover:scale-105 cursor-pointer' 
                              : 'border-slate-700/50 opacity-50 cursor-not-allowed'}`}
                >
                  <div className="text-4xl mb-2">{area.icon}</div>
                  <div className="font-title text-xl text-white mb-1">{area.name}</div>
                  <div className="font-game text-xs text-white/70 mb-2">{area.description}</div>
                  <div className="font-game text-xs text-amber-400">
                    {DIFFICULTY_LEVELS[area.difficulty].icon} {DIFFICULTY_LEVELS[area.difficulty].name}
                  </div>
                  {!isUnlocked && (
                    <div className="mt-2 text-xs text-red-400">🔒 Locked</div>
                  )}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => {
              audioManager.playSFX('select');
              setScreen('menu');
            }}
            className="px-6 py-2 bg-slate-700 text-slate-300 font-game rounded-lg hover:bg-slate-600 transition-all"
          >
            ← Back
          </button>
        </div>
      )}
      
      {/* ==================== BATTLE ==================== */}
      {screen === 'battle' && currentEnemy && (
        <div className="absolute inset-0 flex flex-col z-20 p-4">
          {/* HUD */}
          <div className="flex justify-between items-start mb-4">
            {/* Player Stats */}
            <div className="bg-slate-900/80 rounded-xl p-4 border border-purple-500/30 min-w-[200px]">
              <div className="font-title text-lg text-white mb-2">{playerName}</div>
              <div className="text-sm text-purple-300 mb-1">Level {playerLevel}</div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400">❤️</span>
                <div className="flex-1 bg-slate-700 rounded-full h-4">
                  <div 
                    className="bg-red-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${(playerHP / maxHP) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-white">{playerHP}/{maxHP}</span>
              </div>
              <div className="text-xs text-amber-400 mt-1">
                XP: {playerXP}/{xpToNext} | 💰 {playerCoins}
              </div>
              {combo > 0 && (
                <div className="text-xs text-yellow-400 mt-1">🔥 Combo: {combo}x</div>
              )}
            </div>
            
            {/* Enemy Stats */}
            <div className="bg-slate-900/80 rounded-xl p-4 border border-red-500/30 min-w-[200px] text-right">
              <div className="font-title text-lg text-white mb-2">{currentEnemy.name}</div>
              <div className="text-4xl mb-2">{currentEnemy.emoji}</div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400">❤️</span>
                <div className="flex-1 bg-slate-700 rounded-full h-4">
                  <div 
                    className="bg-red-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${(enemyHP / enemyMaxHP) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-white">{enemyHP}/{enemyMaxHP}</span>
              </div>
            </div>
          </div>
          
          {/* Battle Area */}
          <div className="flex-1 flex items-center justify-center relative">
            {/* Player */}
            <div className={`absolute left-1/4 transform transition-all ${playerHit ? 'scale-110' : 'scale-100'}`}>
              <div className="text-8xl">⚔️</div>
              <div className="font-title text-center text-white mt-2">{playerName}</div>
            </div>
            
            {/* VS */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-4xl text-purple-400 font-title">
              VS
            </div>
            
            {/* Enemy */}
            <div className={`absolute right-1/4 transform transition-all ${enemyHit ? 'scale-110' : 'scale-100'}`}>
              <div className="text-8xl">{currentEnemy.emoji}</div>
              <div className="font-title text-center text-white mt-2">{currentEnemy.name}</div>
            </div>
          </div>
          
          {/* Math Problem */}
          {battleState === 'problem' && currentProblem && (
            <div className="bg-slate-900/90 rounded-2xl p-6 border-2 border-purple-500/50">
              <div className="text-center mb-4">
                <div className="font-title text-3xl text-amber-400 mb-2">{currentProblem.question}</div>
                <div className="text-sm text-purple-300">Solve to attack!</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {currentProblem.answers.map((answer, i) => (
                  <button
                    key={i}
                    onClick={() => selectAnswer(answer)}
                    className={`px-6 py-4 bg-slate-800 rounded-xl font-title text-2xl transition-all
                              ${selectedAnswer === answer 
                                ? answer === currentProblem.answer 
                                  ? 'bg-green-600 scale-105' 
                                  : 'bg-red-600 scale-105'
                                : 'hover:bg-slate-700 hover:scale-105'}`}
                  >
                    {answer}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Battle Messages */}
          {battleState === 'attacking' && (
            <div className="bg-slate-900/90 rounded-2xl p-6 border-2 border-blue-500/50 text-center">
              <div className="font-title text-2xl text-blue-400">Attacking!</div>
            </div>
          )}
          
          {battleState === 'enemyTurn' && (
            <div className="bg-slate-900/90 rounded-2xl p-6 border-2 border-red-500/50 text-center">
              <div className="font-title text-2xl text-red-400">{currentEnemy.name} attacks!</div>
            </div>
          )}
          
          {battleState === 'defeated' && (
            <div className="bg-slate-900/90 rounded-2xl p-6 border-2 border-green-500/50 text-center">
              <div className="font-title text-3xl text-green-400 mb-2">Victory! 🎉</div>
              {battleMessage && (
                <div className="font-game text-lg text-amber-400 mt-2">{battleMessage}</div>
              )}
              <div className="flex gap-4 mt-4 justify-center">
                <button
                  onClick={continueBattle}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                >
                  Continue
                </button>
                <button
                  onClick={returnToAreaSelect}
                  className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
                >
                  Return
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* ==================== LEVEL UP ==================== */}
      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-3xl p-8 text-center animate-bounce-in">
            <div className="text-6xl mb-4">⭐</div>
            <div className="font-title text-4xl text-white mb-2">LEVEL UP!</div>
            <div className="font-game text-xl text-yellow-200">You are now Level {playerLevel}!</div>
          </div>
        </div>
      )}
      
      {/* ==================== GAME OVER ==================== */}
      {screen === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/70">
          <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full mx-4 border-2 border-red-500/50 text-center">
            <div className="text-6xl mb-4">💀</div>
            <h2 className="font-title text-3xl text-red-400 mb-4">Defeated!</h2>
            <div className="font-game text-lg text-white mb-6">
              <div>Enemies Defeated: {enemiesDefeated}</div>
              <div>Correct Answers: {correctAnswers}/{totalAnswers}</div>
              <div>Max Combo: {maxCombo}x</div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setScreen('areaSelect');
                  setPlayerHP(maxHP);
                  setEnemiesDefeated(0);
                  setCorrectAnswers(0);
                  setTotalAnswers(0);
                  setCombo(0);
                }}
                className="flex-1 py-3 bg-purple-600 text-white font-game rounded-lg hover:bg-purple-700 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => setScreen('menu')}
                className="flex-1 py-3 bg-slate-700 text-white font-game rounded-lg hover:bg-slate-600 transition-all"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
