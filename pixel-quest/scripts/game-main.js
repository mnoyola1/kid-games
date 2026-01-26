// ==================== MAIN GAME COMPONENT ====================
function PixelQuest() {
  // ==================== LUMINA CORE INTEGRATION ====================
  const [playerProfile, setPlayerProfile] = useState(null);
  const [playerName, setPlayerName] = useState('');
  
  useEffect(() => {
    if (typeof LuminaCore !== 'undefined') {
      const profile = LuminaCore.getActiveProfile();
      if (profile) {
        setPlayerProfile(profile);
        setPlayerName(profile.name);
        console.log('Pixel Quest: Playing as', profile.name);
        LuminaCore.recordGameStart(profile.id, 'pixelQuest');
      }
    }
  }, []);
  
  // ==================== GAME STATE ====================
  const [screen, setScreen] = useState('menu'); // menu, worldSelect, playing, checkpoint, levelComplete, gameover
  const [selectedWorld, setSelectedWorld] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [unlockedWorlds, setUnlockedWorlds] = useState(['math']);
  
  // Player state
  const [playerX, setPlayerX] = useState(50);
  const [playerY, setPlayerY] = useState(600);
  const [playerVx, setPlayerVx] = useState(0);
  const [playerVy, setPlayerVy] = useState(0);
  const [isGrounded, setIsGrounded] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  
  // Gameplay state
  const [coins, setCoins] = useState(0);
  const [stars, setStars] = useState(0);
  const [levelStars, setLevelStars] = useState(0);
  const [cameraX, setCameraX] = useState(0);
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [checkpointQuestion, setCheckpointQuestion] = useState(null);
  const [playerLives, setPlayerLives] = useState(3);
  
  // Refs
  const juiceSystem = useMemo(() => new JuiceSystem(), []);
  const audioManager = useMemo(() => {
    const manager = new AudioManager();
    manager.preloadMusic();
    return manager;
  }, []);
  const physicsEngine = useRef(null);
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const keysRef = useRef({});
  const lastUpdateRef = useRef(Date.now());
  
  // ==================== INITIALIZATION ====================
  useEffect(() => {
    if (screen === 'menu') {
      audioManager.playMusic('menu');
    } else if (screen === 'playing' && selectedWorld) {
      const musicKey = selectedWorld.musicKey || 'world1_math';
      audioManager.playMusic(musicKey);
    }
  }, [screen, selectedWorld, audioManager]);
  
  // ==================== INPUT HANDLING ====================
  useEffect(() => {
    if (screen !== 'playing') return;
    
    const handleKeyDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
      
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        exitLevel();
      }
    };
    
    const handleKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen, jump, exitLevel]);
  
  // ==================== GAME LOOP ====================
  useEffect(() => {
    if (screen !== 'playing' || !currentLevel) return;
    
    const loop = () => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;
      
      // Handle input
      let moveX = 0;
      if (keysRef.current['a'] || keysRef.current['arrowleft']) {
        moveX = -1;
        setFacingRight(false);
      }
      if (keysRef.current['d'] || keysRef.current['arrowright']) {
        moveX = 1;
        setFacingRight(true);
      }
      
      // Update player velocity
      setPlayerVx(moveX * PHYSICS.moveSpeed);
      
      // Apply gravity
      let newVy = playerVy + PHYSICS.gravity * deltaTime;
      if (newVy > PHYSICS.maxFallSpeed) newVy = PHYSICS.maxFallSpeed;
      
      // Update position
      let newX = playerX + playerVx * deltaTime;
      let newY = playerY + newVy * deltaTime;
      
      // Check platform collision
      const platformCheck = physicsEngine.current.isOnPlatform(
        newX, newY, PLAYER_SIZE, PLAYER_SIZE, currentLevel.platforms
      );
      
      if (platformCheck.onPlatform) {
        newY = platformCheck.platformY - PLAYER_SIZE;
        newVy = 0;
        setIsGrounded(true);
        setIsJumping(false);
      } else {
        setIsGrounded(false);
      }
      
      // Boundary checks
      if (newX < 0) newX = 0;
      if (newX > currentLevel.width - PLAYER_SIZE) {
        // Level complete!
        completeLevel();
        return;
      }
      if (newY > currentLevel.height) {
        // Player fell
        die();
        return;
      }
      
      setPlayerX(newX);
      setPlayerY(newY);
      setPlayerVy(newVy);
      
      // Update camera (follow player)
      const targetCameraX = newX - window.innerWidth / 2;
      setCameraX(Math.max(0, Math.min(targetCameraX, currentLevel.width - window.innerWidth)));
      
      // Check collectibles
      const collectible = physicsEngine.current.checkCollectibleCollision(
        newX, newY, PLAYER_SIZE, PLAYER_SIZE, currentLevel.collectibles
      );
      
      if (collectible) {
        collectItem(collectible);
      }
      
      // Check checkpoint
      const checkpoint = physicsEngine.current.checkCheckpointCollision(
        newX, newY, PLAYER_SIZE, PLAYER_SIZE, currentLevel.checkpoints
      );
      
      if (checkpoint && !checkpoint.activated) {
        activateCheckpoint(checkpoint);
      }
      
      // Check enemy collision
      const enemy = physicsEngine.current.checkEnemyCollision(
        newX, newY, PLAYER_SIZE, PLAYER_SIZE, currentLevel.enemies
      );
      
      if (enemy) {
        // Answer question to defeat enemy
        showEnemyQuestion(enemy);
      }

      const exitReached = physicsEngine.current.checkExitCollision(
        newX, newY, PLAYER_SIZE, PLAYER_SIZE, currentLevel.exit
      );
      if (exitReached) {
        completeLevel();
        return;
      }
      
      // Update enemies
      physicsEngine.current.updateEnemies(currentLevel.enemies, currentLevel.platforms, deltaTime);
      
      // Update juice
      juiceSystem.update(deltaTime);
      
      // Render juice
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        juiceSystem.render(ctx, cameraX, 0);
      }
      
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    
    // Initialize canvas
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    gameLoopRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [screen, currentLevel, playerX, playerY, playerVx, playerVy, isGrounded, juiceSystem]);
  
  // ==================== GAME FUNCTIONS ====================
  const jump = useCallback(() => {
    if (isGrounded && !isJumping) {
      setPlayerVy(PHYSICS.jumpVelocity);
      setIsJumping(true);
      setIsGrounded(false);
      audioManager.playSFX('jump');
      
      // Juice
      juiceSystem.createParticles(playerX + PLAYER_SIZE / 2, playerY + PLAYER_SIZE, {
        count: 6,
        colors: ['#FFF', '#CCC'],
        velocity: { min: 1, max: 3 },
        lifetime: 0.3,
        spread: 180
      });
    }
  }, [isGrounded, isJumping, playerX, playerY, audioManager, juiceSystem]);

  const exitLevel = useCallback(() => {
    audioManager.stopMusic();
    setScreen('worldSelect');
  }, [audioManager]);
  
  const collectItem = useCallback((collectible) => {
    collectible.collected = true;
    
    if (collectible.type === 'coin') {
      setCoins(prev => prev + 1);
      audioManager.playSFX('collect_coin');
      juiceSystem.collectItem(collectible.x, collectible.y, 'coin');
    } else if (collectible.type === 'star') {
      setStars(prev => prev + 1);
      setLevelStars(prev => prev + 1);
      audioManager.playSFX('collect_star');
      juiceSystem.collectItem(collectible.x, collectible.y, 'star');
    }
  }, [audioManager, juiceSystem]);
  
  const activateCheckpoint = useCallback((checkpoint) => {
    checkpoint.activated = true;
    
    // Generate question
    const question = generateQuestion(selectedWorld.id, 'easy');
    setCheckpointQuestion(question);
    setShowCheckpoint(true);
    
    audioManager.playSFX('checkpoint');
    juiceSystem.checkpointActivated(checkpoint.x, checkpoint.y);
  }, [selectedWorld, audioManager, juiceSystem]);
  
  const answerCheckpointQuestion = useCallback((answer) => {
    setShowCheckpoint(false);
    
    if (answer === checkpointQuestion.answer) {
      // Correct! Continue
      audioManager.playSFX('door_open');
      setCheckpointQuestion(null);
    } else {
      // Wrong - try again
      const checkpoint = currentLevel.checkpoints.find(c => !c.activated);
      if (checkpoint) {
        checkpoint.activated = false;
      }
      setCheckpointQuestion(null);
    }
  }, [checkpointQuestion, currentLevel, audioManager]);
  
  const showEnemyQuestion = useCallback((enemy) => {
    // Pause game and show question
    const question = generateQuestion(selectedWorld.id, 'easy');
    setCheckpointQuestion(question);
    setShowCheckpoint(true);
  }, [selectedWorld]);
  
  const completeLevel = useCallback(() => {
    audioManager.stopMusic();
    audioManager.playSFX('level_complete');
    audioManager.playMusic('victory');
    
    // Calculate stars (1-3 based on coins and stars collected)
    let finalStars = 1;
    if (levelStars >= 3 && coins >= 5) finalStars = 3;
    else if (levelStars >= 2 || coins >= 3) finalStars = 2;
    
    // Award to LuminaCore
    if (playerProfile) {
      const xpEarned = 50 + (finalStars * 25);
      const coinsEarned = coins;
      
      LuminaCore.addXP(playerProfile.id, xpEarned, 'pixelQuest');
      LuminaCore.addCoins(playerProfile.id, coinsEarned, 'pixelQuest');
      LuminaCore.addRewardPoints(playerProfile.id, Math.floor(xpEarned / 20));
      
      // Record game end
      const gameStats = {
        levelsCompleted: 1,
        starsCollected: levelStars,
        coinsCollected: coins,
        worldsUnlocked: unlockedWorlds.length,
        threeStarLevels: finalStars === 3 ? 1 : 0
      };
      
      LuminaCore.recordGameEnd(playerProfile.id, 'pixelQuest', gameStats);
      
      // Check achievements
      if (levelStars >= 3) LuminaCore.checkAchievement(playerProfile.id, 'pq_three_stars');
      if (coins >= 10) LuminaCore.checkAchievement(playerProfile.id, 'pq_coin_collector');
    }
    
    juiceSystem.levelComplete(playerX, playerY);
    setScreen('levelComplete');
  }, [playerProfile, levelStars, coins, playerX, playerY, audioManager, juiceSystem]);
  
  const die = useCallback(() => {
    setPlayerLives(prev => {
      const newLives = prev - 1;
      
      if (newLives <= 0) {
        // Game over
        audioManager.stopMusic();
        audioManager.playSFX('death');
        setScreen('gameover');
      } else {
        // Respawn
        setPlayerX(currentLevel.startX);
        setPlayerY(currentLevel.startY);
        setPlayerVx(0);
        setPlayerVy(0);
        setIsGrounded(true);
        setIsJumping(false);
        audioManager.playSFX('death');
        juiceSystem.playerDeath(playerX, playerY);
      }
      
      return newLives;
    });
  }, [currentLevel, playerX, playerY, audioManager, juiceSystem]);
  
  const selectWorld = useCallback((world) => {
    if (!unlockedWorlds.includes(world.id)) return;
    
    setSelectedWorld(world);
    startLevel(world, 1);
  }, [unlockedWorlds]);
  
  const startLevel = useCallback((world, levelNum) => {
    setScreen('playing');
    
    const level = generateLevel(world.id, levelNum);
    level.backgroundImage = world.backgroundImage;
    setCurrentLevel(level);
    setPlayerX(level.startX);
    setPlayerY(level.startY);
    setPlayerVx(0);
    setPlayerVy(0);
    setCoins(0);
    setStars(0);
    setLevelStars(0);
    setCameraX(0);
    setPlayerLives(3);
    setIsGrounded(true);
    setIsJumping(false);
    
    physicsEngine.current = new PhysicsEngine(level);
    
    // Initialize canvas
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    lastUpdateRef.current = Date.now();
  }, []);
  
  // ==================== RENDER ====================
  return (
    <div className="w-full h-screen overflow-hidden relative" style={{
      transform: `translate(${juiceSystem.getScreenShake().x}px, ${juiceSystem.getScreenShake().y}px)`
    }}>
      {/* Juice Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-30"
      />
      
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${selectedWorld?.bgGradient || 'from-purple-900 to-indigo-900'}`}>
        <div className="stars" />
      </div>
      
      {/* ==================== MENU ==================== */}
      {screen === 'menu' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <div className="text-center animate-float">
            <img
              src={ASSETS.sprites.player}
              alt="Pixel Quest Hero"
              className="mx-auto mb-4 w-24 h-24 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
            <h1 className="font-title text-6xl md:text-7xl text-amber-400 mb-2"
                style={{ textShadow: '0 0 30px rgba(251, 191, 36, 0.5)' }}>
              PIXEL QUEST
            </h1>
            <p className="font-game text-xl text-purple-300 mb-8">
              Jump, run, and learn!
            </p>
          </div>
          
          <button
            onClick={() => {
              audioManager.playSFX('select');
              setScreen('worldSelect');
            }}
            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 
                     text-white font-title text-2xl rounded-xl shadow-lg hover:scale-105
                     border-2 border-purple-400/50 transition-all animate-pulse-glow mb-4"
          >
            Select World
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
              {audioManager.musicEnabled ? 'Music: On' : 'Music: Off'}
            </button>
            <button
              onClick={() => audioManager.toggleSFX()}
              className="px-4 py-2 bg-slate-800/80 text-white rounded-lg hover:bg-slate-700 transition-all border border-purple-500/30"
            >
              {audioManager.sfxEnabled ? 'SFX: On' : 'SFX: Off'}
            </button>
          </div>
          
          {playerProfile && (
            <a href="../index.html" className="mt-8 text-purple-400 hover:text-purple-300 font-game">
              Return to Noyola Hub
            </a>
          )}
        </div>
      )}
      
      {/* ==================== WORLD SELECT ==================== */}
      {screen === 'worldSelect' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 overflow-auto">
          <h2 className="font-title text-4xl text-amber-400 mb-6">Choose Your World</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mb-6">
            {WORLDS.map(world => {
              const isUnlocked = unlockedWorlds.includes(world.id);
              return (
                <button
                  key={world.id}
                  onClick={() => isUnlocked && selectWorld(world)}
                  disabled={!isUnlocked}
                  className={`bg-slate-900/80 rounded-2xl p-6 border-2 transition-all text-left
                            ${isUnlocked 
                              ? 'border-purple-500/50 hover:border-purple-400 hover:scale-105 cursor-pointer' 
                              : 'border-slate-700/50 opacity-50 cursor-not-allowed'}`}
                >
                  <div className="world-card-thumb mb-3">
                    <img
                      src={world.backgroundImage}
                      alt={`${world.name} preview`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  </div>
                  <div className="font-title text-xl text-white mb-1">{world.name}</div>
                  <div className="font-game text-xs text-white/70 mb-2">{world.description}</div>
                  {!isUnlocked && (
                    <div className="mt-2 text-xs text-red-400">Locked</div>
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
      
      {/* ==================== GAMEPLAY ==================== */}
      {screen === 'playing' && currentLevel && (
        <div className="absolute inset-0 flex flex-col z-20">
          {/* HUD */}
          <div className="flex justify-between items-center p-4 bg-slate-900/80 border-b border-purple-500/30">
            <div className="font-title text-xl text-white">
              {selectedWorld?.name} | Level 1
            </div>
            <div className="flex gap-6 items-center">
              <div className="hud-stat">
                <img src={ASSETS.sprites.coin} alt="Coins" className="hud-icon" />
                <span>{coins}</span>
              </div>
              <div className="hud-stat">
                <img src={ASSETS.sprites.star} alt="Stars" className="hud-icon" />
                <span>{stars}/3</span>
              </div>
              <div className="hud-stat">
                <img src={ASSETS.sprites.heart} alt="Lives" className="hud-icon" />
                <span>{playerLives}</span>
              </div>
              <button
                onClick={exitLevel}
                className="px-3 py-1 bg-slate-700 text-white text-sm font-game rounded-md hover:bg-slate-600 transition-all border border-purple-500/30"
              >
                Exit Level
              </button>
            </div>
          </div>
          
          {/* Game Viewport */}
          <div 
            className="flex-1 relative overflow-hidden"
            style={{
              transform: `translateX(-${cameraX}px)`
            }}
          >
            {/* Level Background */}
            <div className="absolute inset-0" style={{ width: `${currentLevel.width}px` }}>
              {/* Background Image */}
              <img 
                src={currentLevel.backgroundImage || ASSETS.backgrounds.math} 
                alt="Background" 
                className="absolute inset-0 w-full h-full object-cover opacity-50"
                style={{ width: `${currentLevel.width}px`, height: `${currentLevel.height}px` }}
              />
              
              {/* Platforms */}
              {currentLevel.platforms.map((platform, i) => (
                <div
                  key={i}
                  className="platform absolute"
                  style={{
                    left: `${platform.x}px`,
                    top: `${platform.y}px`,
                    width: `${platform.width}px`,
                    height: `${platform.height}px`,
                    backgroundImage: `url(${ASSETS.sprites.platform})`,
                    backgroundSize: 'auto 100%',
                    backgroundRepeat: 'repeat-x',
                    imageRendering: 'pixelated'
                  }}
                />
              ))}
              
              {/* Collectibles */}
              {currentLevel.collectibles.map(collectible => {
                if (collectible.collected) return null;
                
                return (
                  <img
                    key={collectible.id}
                    src={collectible.type === 'star' ? ASSETS.sprites.star : ASSETS.sprites.coin}
                    alt={collectible.type}
                    className="collectible absolute"
                    style={{
                      left: `${collectible.x}px`,
                      top: `${collectible.y}px`,
                      width: `${collectible.size || (collectible.type === 'star' ? 48 : 32)}px`,
                      height: `${collectible.size || (collectible.type === 'star' ? 48 : 32)}px`,
                      transform: 'translate(-50%, -50%)',
                      imageRendering: 'pixelated'
                    }}
                  />
                );
              })}
              
              {/* Checkpoints */}
              {currentLevel.checkpoints.map((checkpoint, i) => (
                <div
                  key={i}
                  className={`checkpoint absolute ${checkpoint.activated ? 'activated' : ''}`}
                  style={{
                    left: `${checkpoint.x}px`,
                    top: `${checkpoint.y}px`,
                    width: `${checkpoint.width || 72}px`,
                    height: `${checkpoint.height || 56}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <img
                    src={ASSETS.sprites.checkpoint}
                    alt="Checkpoint"
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              ))}

              {currentLevel.exit && (
                <img
                  src={ASSETS.sprites.exit}
                  alt="Exit Portal"
                  className="absolute"
                  style={{
                    left: `${currentLevel.exit.x}px`,
                    top: `${currentLevel.exit.y}px`,
                    width: `${currentLevel.exit.width}px`,
                    height: `${currentLevel.exit.height}px`,
                    imageRendering: 'pixelated'
                  }}
                />
              )}
              
              {/* Enemies */}
              {currentLevel.enemies.map(enemy => (
                <img
                  key={enemy.id}
                  src={ASSETS.sprites.enemy}
                  alt="Enemy"
                  className="enemy absolute"
                  style={{
                    left: `${enemy.x}px`,
                    top: `${enemy.y}px`,
                    width: `${enemy.width}px`,
                    height: `${enemy.height}px`,
                    imageRendering: 'pixelated'
                  }}
                />
              ))}
              
              {/* Player */}
              <div
                className={`character absolute ${isJumping ? 'jumping' : isGrounded ? 'running' : ''}`}
                style={{
                  left: `${playerX}px`,
                  top: `${playerY}px`,
                  transform: `scaleX(${facingRight ? 1 : -1})`,
                  width: `${PLAYER_SIZE}px`,
                  height: `${PLAYER_SIZE}px`
                }}
              >
                <img 
                  src={ASSETS.sprites.player} 
                  alt="Player" 
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </div>
          </div>
          
          {/* Controls Hint */}
          <div className="absolute bottom-4 left-4 bg-slate-900/80 rounded-lg p-2 text-xs text-white/70 font-game">
            A/D or ←/→ to move | Space or ↑ to jump
          </div>
        </div>
      )}
      
      {/* ==================== CHECKPOINT QUESTION ==================== */}
      {showCheckpoint && checkpointQuestion && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full mx-4 border-2 border-purple-500/50">
            <div className="font-title text-2xl text-amber-400 mb-4 text-center">
              {checkpointQuestion.question}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => answerCheckpointQuestion(checkpointQuestion.answer)}
                className="px-4 py-3 bg-green-600 text-white font-game rounded-lg hover:bg-green-700 transition-all"
              >
                {checkpointQuestion.answer}
              </button>
              {checkpointQuestion.wrongAnswers.map((wrong, i) => (
                <button
                  key={i}
                  onClick={() => answerCheckpointQuestion(wrong)}
                  className="px-4 py-3 bg-red-600 text-white font-game rounded-lg hover:bg-red-700 transition-all"
                >
                  {wrong}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* ==================== LEVEL COMPLETE ==================== */}
      {screen === 'levelComplete' && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/70">
          <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full mx-4 border-2 border-green-500/50 text-center">
            <div className="flex justify-center gap-2 mb-4">
              {Array.from({ length: Math.max(1, Math.min(3, levelStars)) }).map((_, i) => (
                <img
                  key={`star-${i}`}
                  src={ASSETS.sprites.star}
                  alt="Star"
                  className="w-10 h-10"
                  style={{ imageRendering: 'pixelated' }}
                />
              ))}
            </div>
            <h2 className="font-title text-3xl text-green-400 mb-4">Level Complete!</h2>
            <div className="font-game text-lg text-white mb-6 space-y-2">
              <div>Coins: {coins}</div>
              <div>Stars: {stars}/3</div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (selectedWorld) {
                    startLevel(selectedWorld, 1);
                  }
                }}
                className="flex-1 py-3 bg-purple-600 text-white font-game rounded-lg hover:bg-purple-700 transition-all"
              >
                Play Again
              </button>
              <button
                onClick={() => {
                  setScreen('worldSelect');
                  audioManager.stopMusic();
                }}
                className="flex-1 py-3 bg-slate-700 text-white font-game rounded-lg hover:bg-slate-600 transition-all"
              >
                World Select
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ==================== GAME OVER ==================== */}
      {screen === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/70">
          <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full mx-4 border-2 border-red-500/50 text-center">
            <div className="flex justify-center mb-4">
              <img
                src={ASSETS.sprites.gameover}
                alt="Game Over"
                className="w-20 h-20"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <h2 className="font-title text-3xl text-red-400 mb-4">Game Over!</h2>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (selectedWorld) {
                    startLevel(selectedWorld, 1);
                  }
                }}
                className="flex-1 py-3 bg-purple-600 text-white font-game rounded-lg hover:bg-purple-700 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  setScreen('menu');
                  audioManager.stopMusic();
                }}
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
