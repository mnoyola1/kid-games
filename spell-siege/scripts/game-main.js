    // ==================== MAIN GAME COMPONENT ====================
    function SpellSiege() {
      // Game states
      const [gameState, setGameState] = useState('menu'); // menu, setup, playing, paused, gameover, victory
      const [difficulty, setDifficulty] = useState(null);
      const [words, setWords] = useState(DEFAULT_WORDS);
      const [customWordsInput, setCustomWordsInput] = useState('');
      
      // Game data
      const [wave, setWave] = useState(1);
      const [enemies, setEnemies] = useState([]);
      const [castleHealth, setCastleHealth] = useState(5);
      const [maxHealth, setMaxHealth] = useState(5);
      const [coins, setCoins] = useState(0);
      const [combo, setCombo] = useState(0);
      const [maxCombo, setMaxCombo] = useState(0);
      const [typedWord, setTypedWord] = useState('');
      const [targetEnemy, setTargetEnemy] = useState(null);
      const [spellEffects, setSpellEffects] = useState([]);
      const [announcements, setAnnouncements] = useState([]);
      const [shakeScreen, setShakeScreen] = useState(false);
      
      // Upgrades
      const [upgrades, setUpgrades] = useState({
        spellPower: 0,
        slowField: 0,
        shield: 0,
        castleRepair: 0
      });
      const [hasShield, setHasShield] = useState(false);
      
      // Stats
      const [wordsTyped, setWordsTyped] = useState(0);
      const [mistakes, setMistakes] = useState(0);
      const [enemiesDefeated, setEnemiesDefeated] = useState(0);
      const [waveEnemiesRemaining, setWaveEnemiesRemaining] = useState(0);
      const [missedWords, setMissedWords] = useState([]);
      
      // Audio state
      const [musicEnabled, setMusicEnabled] = useState(true);
      const [sfxEnabled, setSfxEnabled] = useState(true);
      
      // Refs
      const gameLoopRef = useRef(null);
      const spawnTimerRef = useRef(null);
      const inputRef = useRef(null);
      const enemyIdCounter = useRef(0);
      const waveEnemiesSpawned = useRef(0);
      
      // Initialize audio on first interaction
      const initAudio = useCallback(async () => {
        await audioManager.initTone();
        audioManager.preloadMusic();
      }, []);
      
      // Get music track for current wave
      const getMusicTrackForWave = useCallback((w) => {
        if (w <= 3) return 'early';
        if (w <= 7) return 'mid';
        return 'final';
      }, []);
      
      // Add announcement
      const addAnnouncement = useCallback((text, type = 'info') => {
        const id = Date.now();
        setAnnouncements(prev => [...prev, { id, text, type }]);
        setTimeout(() => {
          setAnnouncements(prev => prev.filter(a => a.id !== id));
        }, 2000);
      }, []);
      
      // Create spell effect
      const createSpellEffect = useCallback((x, y, color) => {
        const id = Date.now() + Math.random();
        setSpellEffects(prev => [...prev, { id, x, y, color }]);
        setTimeout(() => {
          setSpellEffects(prev => prev.filter(e => e.id !== id));
        }, 400);
      }, []);
      
      // Spawn enemy
      const spawnEnemy = useCallback(() => {
        if (!difficulty) return;
        
        const settings = DIFFICULTY_SETTINGS[difficulty];
        if (enemies.length >= settings.maxEnemies) return;
        
        const totalEnemiesForWave = 5 + wave * 2;
        if (waveEnemiesSpawned.current >= totalEnemiesForWave) return;
        
        // Determine enemy type based on wave
        let type = 'basic';
        const roll = Math.random();
        
        if (wave >= 3 && roll < 0.15 + (wave * 0.02)) {
          type = 'armored';
        }
        if (wave >= 5 && waveEnemiesSpawned.current === totalEnemiesForWave - 1) {
          // Last enemy of wave 5+ is a boss
          type = 'boss';
          audioManager.playBossSpawn();
          addAnnouncement('ðŸ”¥ BOSS INCOMING! ðŸ”¥', 'boss');
        }
        
        // Pick a word
        const availableWords = words.filter(w => !enemies.some(e => e.word === w));
        if (availableWords.length === 0) return;
        
        const word = availableWords[Math.floor(Math.random() * availableWords.length)];
        
        // Simple random positioning
        const enemy = {
          id: ++enemyIdCounter.current,
          type,
          word,
          x: 5 + Math.random() * 10, // Start 5-15% from left
          y: 15 + Math.random() * 55, // Random Y between 15-70%
          hits: ENEMY_TYPES[type].hits,
          speed: settings.baseSpeed * (1 - upgrades.slowField * 0.15) * (1 + wave * 0.05)
        };
        
        setEnemies(prev => [...prev, enemy]);
        waveEnemiesSpawned.current++;
        setWaveEnemiesRemaining(totalEnemiesForWave - waveEnemiesSpawned.current + enemies.length + 1);
        speakWord(word);
      }, [difficulty, enemies, wave, words, upgrades.slowField, addAnnouncement]);
      
      // Game loop
      useEffect(() => {
        if (gameState !== 'playing') return;
        
        const loop = setInterval(() => {
          setEnemies(prev => {
            const updated = prev.map(enemy => ({
              ...enemy,
              x: enemy.x + enemy.speed * 0.15
            }));
            
            // Check for enemies reaching castle (85% mark)
            const reachedCastle = updated.filter(e => e.x >= 85);
            const remaining = updated.filter(e => e.x < 85);
            
            if (reachedCastle.length > 0) {
              reachedCastle.forEach(e => {
                setMissedWords(mw => [...mw, e.word]);
              });
              
              setCastleHealth(h => {
                let damage = reachedCastle.length;
                let newHealth = h;
                
                // Check shield
                if (hasShield && damage > 0) {
                  setHasShield(false);
                  damage--;
                  addAnnouncement('ðŸ›¡ï¸ Shield blocked!', 'shield');
                }
                
                if (damage > 0) {
                  newHealth = Math.max(0, h - damage);
                  audioManager.playCastleDamage();
                  setShakeScreen(true);
                  setTimeout(() => setShakeScreen(false), 500);
                  addAnnouncement(`ðŸ’” -${damage} Heart${damage > 1 ? 's' : ''}!`, 'damage');
                  setCombo(0);
                }
                
                return newHealth;
              });
            }
            
            return remaining;
          });
        }, 50);
        
        gameLoopRef.current = loop;
        return () => clearInterval(loop);
      }, [gameState, hasShield, addAnnouncement]);
      
      // Enemy spawning
      useEffect(() => {
        if (gameState !== 'playing' || !difficulty) return;
        
        const settings = DIFFICULTY_SETTINGS[difficulty];
        const spawn = setInterval(spawnEnemy, settings.spawnInterval);
        spawnTimerRef.current = spawn;
        
        // Initial spawn
        setTimeout(spawnEnemy, 500);
        
        return () => clearInterval(spawn);
      }, [gameState, difficulty, spawnEnemy]);
      
      // Check for wave completion
      useEffect(() => {
        if (gameState !== 'playing') return;
        
        const totalEnemiesForWave = 5 + wave * 2;
        
        if (waveEnemiesSpawned.current >= totalEnemiesForWave && enemies.length === 0) {
          // Wave complete!
          if (wave >= 10) {
            // Victory!
            setGameState('victory');
            audioManager.stopMusic();
            audioManager.playMusic('victory');
          } else {
            // Next wave
            audioManager.playWaveComplete();
            addAnnouncement(`âœ¨ Wave ${wave} Complete! âœ¨`, 'wave');
            
            setTimeout(() => {
              setWave(w => w + 1);
              waveEnemiesSpawned.current = 0;
              
              // Change music if needed
              const newTrack = getMusicTrackForWave(wave + 1);
              const currentTrack = getMusicTrackForWave(wave);
              if (newTrack !== currentTrack) {
                audioManager.playMusic(newTrack);
              }
            }, 1500);
          }
        }
        
        setWaveEnemiesRemaining(Math.max(0, totalEnemiesForWave - waveEnemiesSpawned.current) + enemies.length);
      }, [enemies.length, wave, gameState, addAnnouncement, getMusicTrackForWave]);
      
      // Check for game over
      useEffect(() => {
        if (castleHealth <= 0 && gameState === 'playing') {
          setGameState('gameover');
          audioManager.stopMusic();
          audioManager.playMusic('gameover');
        }
      }, [castleHealth, gameState]);
      
      // Handle word completion
      const handleWordComplete = useCallback((completedWord) => {
        const matchingEnemies = enemies.filter(e => e.word === completedWord);
        if (matchingEnemies.length === 0) return false;
        
        // Target closest to castle
        const target = matchingEnemies.sort((a, b) => b.x - a.x)[0];
        const damage = 1 + upgrades.spellPower;
        const newHits = target.hits - damage;
        
        createSpellEffect(target.x, target.y, ENEMY_TYPES[target.type].color);
        audioManager.playSpellCast();
        
        if (newHits <= 0) {
          // Defeated!
          const comboBonus = Math.floor(combo / 3) * 5;
          const coinReward = ENEMY_TYPES[target.type].coins + comboBonus;
          
          setEnemies(prev => prev.filter(e => e.id !== target.id));
          setCoins(prev => prev + coinReward);
          setEnemiesDefeated(d => d + 1);
          setWordsTyped(w => w + 1);
          audioManager.playEnemyDefeat();
          
          setCombo(c => {
            const newCombo = c + 1;
            setMaxCombo(m => Math.max(m, newCombo));
            if (newCombo > 0 && newCombo % 5 === 0) {
              addAnnouncement(`ðŸ”¥ ${newCombo}x Combo!`, 'combo');
              audioManager.playCombo(newCombo);
            }
            return newCombo;
          });
        } else {
          // Damaged but not defeated
          setEnemies(prev => prev.map(e =>
            e.id === target.id ? { ...e, hits: newHits } : e
          ));
          addAnnouncement('âš”ï¸ Armor cracked!', 'hit');
          audioManager.playSpellCast();
        }
        
        return true;
      }, [enemies, upgrades.spellPower, combo, createSpellEffect, addAnnouncement]);
      
      // Handle input change
      const handleInputChange = useCallback((e) => {
        // Normalize smart quotes to straight apostrophe, then filter
        const val = e.target.value
          .toLowerCase()
          .replace(/[''`]/g, "'") // Convert smart quotes to straight apostrophe
          .replace(/[^a-z']/g, '');
        setTypedWord(val);
        
        // Auto-target matching enemy
        const matchingEnemies = enemies.filter(en => en.word.startsWith(val));
        if (matchingEnemies.length > 0) {
          setTargetEnemy(matchingEnemies.sort((a, b) => b.x - a.x)[0].id);
        } else {
          setTargetEnemy(null);
        }
        
        // Check for complete word match
        if (val.length > 0 && handleWordComplete(val)) {
          setTypedWord('');
          setTargetEnemy(null);
        } else if (val.length > 0 && matchingEnemies.length === 0) {
          // No matching enemies - mistake
          if (!DIFFICULTY_SETTINGS[difficulty]?.typingGrace) {
            setMistakes(m => m + 1);
            setCombo(0);
          }
          setTypedWord('');
        }
      }, [enemies, difficulty, handleWordComplete]);
      
      // Handle key press
      const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape' && gameState === 'playing') {
          setGameState('paused');
          audioManager.pauseMusic();
        } else if (e.key === 'Enter' && gameState === 'playing') {
          e.preventDefault();
          if (typedWord && handleWordComplete(typedWord)) {
            setTypedWord('');
            setTargetEnemy(null);
          }
        }
      }, [gameState, typedWord, handleWordComplete]);
      
      // Focus input when playing
      useEffect(() => {
        if (gameState === 'playing' && inputRef.current) {
          inputRef.current.focus();
        }
      }, [gameState, enemies]);
      
      // Buy upgrade
      const buyUpgrade = useCallback((key) => {
        const upgrade = UPGRADES[key];
        if (coins < upgrade.cost) return;
        if (key !== 'castleRepair' && upgrades[key] >= upgrade.maxLevel) return;
        
        setCoins(c => c - upgrade.cost);
        
        if (key === 'castleRepair') {
          setCastleHealth(h => Math.min(maxHealth, h + 1));
          addAnnouncement('ðŸ’– +1 Heart!', 'heal');
        } else if (key === 'shield') {
          setHasShield(true);
          setUpgrades(u => ({ ...u, [key]: u[key] + 1 }));
          addAnnouncement('ðŸ›¡ï¸ Shield activated!', 'shield');
        } else {
          setUpgrades(u => ({ ...u, [key]: u[key] + 1 }));
        }
      }, [coins, upgrades, maxHealth, addAnnouncement]);
      
      // Start game
      const startGame = useCallback(() => {
        if (!difficulty) return;
        
        initAudio().then(() => {
          const settings = DIFFICULTY_SETTINGS[difficulty];
          
          // Parse custom words or use defaults based on difficulty
          let gameWords = difficulty === 'liam' ? LIAM_DEFAULT_WORDS : DEFAULT_WORDS;
          if (customWordsInput.trim()) {
            const custom = customWordsInput
              .toLowerCase()
              .split(/[\s,]+/)
              .map(w => w.trim())
              .filter(w => w.length >= 2 && /^[a-z']+$/.test(w));
            if (custom.length >= 5) {
              gameWords = custom;
            }
          }
          
          setWords(gameWords);
          setWave(1);
          setEnemies([]);
          setCastleHealth(settings.startingHealth);
          setMaxHealth(settings.startingHealth);
          setCoins(0);
          setCombo(0);
          setMaxCombo(0);
          setTypedWord('');
          setTargetEnemy(null);
          setWordsTyped(0);
          setMistakes(0);
          setEnemiesDefeated(0);
          setMissedWords([]);
          setUpgrades({ spellPower: 0, slowField: 0, shield: 0, castleRepair: 0 });
          setHasShield(false);
          waveEnemiesSpawned.current = 0;
          
          setGameState('playing');
          audioManager.playMusic('early');
        });
      }, [difficulty, customWordsInput, initAudio]);
      
      // Resume game
      const resumeGame = useCallback(() => {
        setGameState('playing');
        audioManager.resumeMusic();
        inputRef.current?.focus();
      }, []);
      
      // Quit to menu
      const quitToMenu = useCallback(() => {
        audioManager.stopMusic();
        setGameState('menu');
        setDifficulty(null);
        audioManager.playMusic('menu');
      }, []);
      
      // Toggle audio
      const toggleMusic = useCallback(() => {
        setMusicEnabled(e => {
          audioManager.setMusicEnabled(!e);
          return !e;
        });
      }, []);
      
      const toggleSfx = useCallback(() => {
        setSfxEnabled(e => {
          audioManager.setSfxEnabled(!e);
          return !e;
        });
      }, []);
      
      // Play menu music on mount
      useEffect(() => {
        initAudio().then(() => {
          audioManager.playMusic('menu');
        });
      }, [initAudio]);
      
      // Calculate accuracy
      const accuracy = wordsTyped > 0 
        ? Math.round((wordsTyped / (wordsTyped + mistakes)) * 100) 
        : 100;
      
      // ==================== RENDER ====================
      return (
        <div 
          className={`w-full h-screen game-bg overflow-hidden relative ${shakeScreen ? 'animate-shake' : ''}`}
          onKeyDown={handleKeyDown}
        >
          {/* Stars background */}
          <div className="stars" />
          
          {/* ==================== MENU SCREEN ==================== */}
          {gameState === 'menu' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <div className="text-center animate-float">
                <h1 className="font-title text-6xl md:text-8xl text-amber-400 mb-2 tracking-wider"
                    style={{ textShadow: '0 0 30px rgba(251, 191, 36, 0.5), 0 4px 0 #92400e' }}>
                  SPELL SIEGE
                </h1>
                <p className="font-game text-xl text-purple-300 mb-12">
                  âš”ï¸ Tower Defense Spelling Adventure âš”ï¸
                </p>
              </div>
              
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => { initAudio(); setGameState('setup'); }}
                  className="magic-btn px-12 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 
                           text-white font-game text-2xl rounded-xl shadow-lg hover:scale-105
                           border-2 border-purple-400/50"
                >
                  ðŸ° Start Quest
                </button>
                
                <div className="flex gap-4 justify-center mt-4">
                  <button
                    onClick={toggleMusic}
                    className={`px-4 py-2 rounded-lg font-game text-sm transition-all
                              ${musicEnabled ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                  >
                    ðŸŽµ Music {musicEnabled ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={toggleSfx}
                    className={`px-4 py-2 rounded-lg font-game text-sm transition-all
                              ${sfxEnabled ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                  >
                    ðŸ”Š SFX {sfxEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
              
              <div className="absolute bottom-8 text-purple-400/60 font-game text-sm">
                Made with â¤ï¸ for Emma & Liam
              </div>
            </div>
          )}
          
          {/* ==================== SETUP SCREEN ==================== */}
          {gameState === 'setup' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4">
              <div className="bg-slate-900/90 rounded-2xl p-8 max-w-lg w-full border-2 border-purple-500/30
                            shadow-[0_0_50px_rgba(139,92,246,0.3)]">
                <h2 className="font-title text-3xl text-amber-400 text-center mb-6">Choose Your Hero</h2>
                
                {/* Difficulty selection */}
                <div className="flex gap-4 mb-6">
                  {Object.entries(DIFFICULTY_SETTINGS).map(([key, settings]) => (
                    <button
                      key={key}
                      onClick={() => setDifficulty(key)}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all font-game
                                ${difficulty === key 
                                  ? 'bg-purple-600 border-purple-400 scale-105' 
                                  : 'bg-slate-800 border-slate-600 hover:border-purple-500'}`}
                    >
                      <div className="text-4xl mb-2">{settings.emoji}</div>
                      <div className="text-lg text-white">{settings.name}</div>
                      <div className="text-xs text-slate-400">{settings.description}</div>
                    </button>
                  ))}
                </div>
                
                {/* Custom words */}
                <div className="mb-6">
                  <label className="block text-purple-300 font-game mb-2 text-sm">
                    ðŸ“ Custom Spelling Words (optional)
                  </label>
                  <textarea
                    value={customWordsInput}
                    onChange={(e) => setCustomWordsInput(e.target.value)}
                    placeholder="Paste weekly spelling words here, separated by spaces or commas..."
                    className="w-full h-24 bg-slate-800 border-2 border-slate-600 rounded-lg p-3
                             text-white font-game text-sm resize-none focus:border-purple-500 focus:outline-none"
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    Minimum 5 words, letters only. Leave blank for default fantasy words.
                  </p>
                </div>
                
                {/* Start button */}
                <div className="flex gap-4">
                  <button
                    onClick={quitToMenu}
                    className="px-6 py-3 bg-slate-700 text-slate-300 font-game rounded-lg
                             hover:bg-slate-600 transition-all"
                  >
                    â† Back
                  </button>
                  <button
                    onClick={startGame}
                    disabled={!difficulty}
                    className={`flex-1 py-3 font-game text-lg rounded-lg transition-all
                              ${difficulty 
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:scale-105' 
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                  >
                    âš”ï¸ Begin Battle!
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* ==================== GAME SCREEN ==================== */}
          {(gameState === 'playing' || gameState === 'paused') && (
            <>
              {/* HUD - Top */}
              <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
                {/* Left: Wave & Enemies */}
                <div className="bg-slate-900/80 rounded-xl p-3 border border-purple-500/30">
                  <div className="font-title text-amber-400 text-xl">Wave {wave}/10</div>
                  <div className="font-game text-purple-300 text-sm">
                    {waveEnemiesRemaining} enemies left
                  </div>
                </div>
                
                {/* Center: Health */}
                <div className="bg-slate-900/80 rounded-xl px-4 py-2 border border-purple-500/30 flex items-center gap-2">
                  {[...Array(maxHealth)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`text-2xl heart transition-all ${i < castleHealth ? '' : 'opacity-30 grayscale'}`}
                    >
                      {i < castleHealth ? 'â¤ï¸' : 'ðŸ–¤'}
                    </span>
                  ))}
                  {hasShield && <span className="text-2xl ml-2">ðŸ›¡ï¸</span>}
                </div>
                
                {/* Right: Coins & Combo */}
                <div className="bg-slate-900/80 rounded-xl p-3 border border-purple-500/30 text-right">
                  <div className="font-game text-amber-400 text-xl">ðŸ’° {coins}</div>
                  {combo > 0 && (
                    <div className={`font-game text-orange-400 text-sm ${combo % 5 === 0 ? 'animate-combo-pop' : ''}`}>
                      ðŸ”¥ {combo}x Combo!
                    </div>
                  )}
                </div>
              </div>
              
              {/* Audio controls */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10" style={{ marginTop: '60px' }}>
                <button
                  onClick={toggleMusic}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                            ${musicEnabled ? 'bg-green-600' : 'bg-slate-700'}`}
                >
                  {musicEnabled ? 'ðŸŽµ' : 'ðŸ”‡'}
                </button>
                <button
                  onClick={toggleSfx}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                            ${sfxEnabled ? 'bg-green-600' : 'bg-slate-700'}`}
                >
                  {sfxEnabled ? 'ðŸ”Š' : 'ðŸ”ˆ'}
                </button>
              </div>
              
              {/* Game field */}
              <div className="absolute inset-0 overflow-hidden" onClick={() => inputRef.current?.focus()}>
                {/* Castle (right side) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 castle-glow">
                  <div className="text-8xl">ðŸ°</div>
                </div>
                
                {/* Enemies */}
                {enemies.map(enemy => (
                  <div
                    key={enemy.id}
                    className="absolute transition-all duration-75 animate-enemy-spawn"
                    style={{
                      left: `${enemy.x}%`,
                      top: `${enemy.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {/* Word bubble */}
                    <div className={`word-bubble rounded-lg px-3 py-1 mb-2 text-center
                                  ${targetEnemy === enemy.id ? 'ring-2 ring-amber-400' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-game text-white text-lg tracking-wide">
                          {enemy.word.split('').map((char, i) => (
                            <span 
                              key={i}
                              className={i < typedWord.length && enemy.word.startsWith(typedWord) 
                                ? 'text-green-400' 
                                : 'text-white'}
                            >
                              {char}
                            </span>
                          ))}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); speakWord(enemy.word); }}
                          className="text-purple-400 hover:text-purple-300 text-sm"
                        >
                          ðŸ”Š
                        </button>
                      </div>
                      {enemy.hits > 1 && (
                        <div className="text-xs text-purple-400">
                          {'ðŸ’œ'.repeat(enemy.hits)}
                        </div>
                      )}
                    </div>
                    
                    {/* Enemy sprite */}
                    <div 
                      className="text-5xl text-center enemy-glow"
                      style={{ color: ENEMY_TYPES[enemy.type].color }}
                    >
                      {ENEMY_TYPES[enemy.type].emoji}
                    </div>
                  </div>
                ))}
                
                {/* Spell effects */}
                {spellEffects.map(effect => (
                  <div
                    key={effect.id}
                    className="absolute spell-effect animate-spell-fire"
                    style={{
                      left: `${effect.x}%`,
                      top: `${effect.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="text-6xl">âœ¨</div>
                  </div>
                ))}
                
                {/* Announcements */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                  {announcements.map(a => (
                    <div
                      key={a.id}
                      className={`font-title text-2xl px-6 py-2 rounded-xl animate-combo-pop
                                ${a.type === 'combo' ? 'text-orange-400 bg-orange-900/50' :
                                  a.type === 'wave' ? 'text-green-400 bg-green-900/50' :
                                  a.type === 'boss' ? 'text-purple-400 bg-purple-900/50' :
                                  a.type === 'damage' ? 'text-red-400 bg-red-900/50' :
                                  a.type === 'heal' ? 'text-pink-400 bg-pink-900/50' :
                                  'text-blue-400 bg-blue-900/50'}`}
                    >
                      {a.text}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Bottom: Input & Upgrades */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/90 border-t border-purple-500/30">
                {/* Typing input */}
                <div className="text-center mb-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={typedWord}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="Type a word..."
                    className="magic-input w-72 md:w-96 px-6 py-3 rounded-xl text-center
                             font-game text-xl text-white placeholder-purple-400/50"
                  />
                </div>
                
                {/* Upgrades */}
                <div className="flex justify-center gap-2 flex-wrap">
                  {Object.entries(UPGRADES).map(([key, upgrade]) => {
                    const currentLevel = upgrades[key];
                    const maxed = key !== 'castleRepair' && currentLevel >= upgrade.maxLevel;
                    const canBuy = coins >= upgrade.cost && !maxed;
                    const cantRepair = key === 'castleRepair' && castleHealth >= maxHealth;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => buyUpgrade(key)}
                        disabled={!canBuy || cantRepair}
                        title={upgrade.description}
                        className={`px-3 py-2 rounded-lg font-game text-sm transition-all
                                  ${maxed || cantRepair
                                    ? 'bg-green-700/50 text-green-300 cursor-default'
                                    : canBuy
                                      ? 'bg-purple-600 hover:bg-purple-500 text-white hover:scale-105'
                                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                      >
                        <div>{upgrade.name}</div>
                        <div className="text-xs">
                          {maxed ? 'âœ“ MAX' : cantRepair ? 'âœ“ FULL' : `ðŸ’°${upgrade.cost}`}
                          {key !== 'castleRepair' && key !== 'shield' && !maxed && ` (${currentLevel}/${upgrade.maxLevel})`}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                <p className="text-center text-slate-500 text-sm mt-2 font-game">
                  Press ESC to pause
                </p>
              </div>
              
              {/* PAUSED Overlay */}
              {gameState === 'paused' && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
                  <div className="bg-slate-900 rounded-2xl p-8 border-2 border-purple-500/50 text-center">
                    <h2 className="font-title text-4xl text-amber-400 mb-6">â¸ï¸ PAUSED</h2>
                    <div className="flex flex-col gap-4">
                      <button
                        onClick={resumeGame}
                        className="px-8 py-3 bg-green-600 text-white font-game text-lg rounded-lg
                                 hover:bg-green-500 transition-all"
                      >
                        â–¶ï¸ Resume
                      </button>
                      <button
                        onClick={quitToMenu}
                        className="px-8 py-3 bg-slate-700 text-slate-300 font-game rounded-lg
                                 hover:bg-slate-600 transition-all"
                      >
                        ðŸ  Quit to Menu
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* ==================== GAME OVER SCREEN ==================== */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
              <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full mx-4 border-2 border-red-500/50 text-center">
                <h2 className="font-title text-4xl text-red-400 mb-2">ðŸ’” GAME OVER</h2>
                <p className="font-game text-slate-400 mb-6">The castle has fallen...</p>
                
                <div className="bg-slate-800 rounded-xl p-4 mb-6 text-left font-game">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-400">Wave Reached:</div>
                    <div className="text-white text-right">{wave}</div>
                    <div className="text-slate-400">Enemies Defeated:</div>
                    <div className="text-white text-right">{enemiesDefeated}</div>
                    <div className="text-slate-400">Words Spelled:</div>
                    <div className="text-white text-right">{wordsTyped}</div>
                    <div className="text-slate-400">Accuracy:</div>
                    <div className="text-white text-right">{accuracy}%</div>
                    <div className="text-slate-400">Best Combo:</div>
                    <div className="text-white text-right">{maxCombo}x</div>
                  </div>
                  
                  {missedWords.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="text-red-400 mb-2">ðŸ“ Words to Practice:</div>
                      <div className="flex flex-wrap gap-2">
                        {[...new Set(missedWords)].slice(0, 10).map((word, i) => (
                          <span key={i} className="px-2 py-1 bg-red-900/30 text-red-300 rounded text-xs">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={quitToMenu}
                    className="flex-1 py-3 bg-slate-700 text-slate-300 font-game rounded-lg
                             hover:bg-slate-600 transition-all"
                  >
                    ðŸ  Menu
                  </button>
                  <button
                    onClick={startGame}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 
                             text-white font-game rounded-lg hover:scale-105 transition-all"
                  >
                    ðŸ”„ Try Again
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* ==================== VICTORY SCREEN ==================== */}
          {gameState === 'victory' && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
              <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full mx-4 border-2 border-amber-500/50 text-center">
                <h2 className="font-title text-4xl text-amber-400 mb-2 animate-float">ðŸ† VICTORY! ðŸ†</h2>
                <p className="font-game text-green-400 mb-6">The kingdom is saved!</p>
                
                <div className="bg-slate-800 rounded-xl p-4 mb-6 text-left font-game">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-400">Enemies Defeated:</div>
                    <div className="text-amber-400 text-right">{enemiesDefeated}</div>
                    <div className="text-slate-400">Words Spelled:</div>
                    <div className="text-amber-400 text-right">{wordsTyped}</div>
                    <div className="text-slate-400">Accuracy:</div>
                    <div className="text-amber-400 text-right">{accuracy}%</div>
                    <div className="text-slate-400">Best Combo:</div>
                    <div className="text-amber-400 text-right">{maxCombo}x</div>
                    <div className="text-slate-400">Total Coins:</div>
                    <div className="text-amber-400 text-right">ðŸ’° {coins}</div>
                    <div className="text-slate-400">Hearts Remaining:</div>
                    <div className="text-amber-400 text-right">{'â¤ï¸'.repeat(castleHealth)}</div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={quitToMenu}
                    className="flex-1 py-3 bg-slate-700 text-slate-300 font-game rounded-lg
                             hover:bg-slate-600 transition-all"
                  >
                    ðŸ  Menu
                  </button>
                  <button
                    onClick={startGame}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 
                             text-white font-game rounded-lg hover:scale-105 transition-all"
                  >
                    ðŸ”„ Play Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
