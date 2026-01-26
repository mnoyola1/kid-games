// ==================== MAIN GAME COMPONENT ====================
function LuminaRacer() {
  // ==================== LUMINA CORE INTEGRATION ====================
  const [playerProfile, setPlayerProfile] = useState(null);
  const [playerName, setPlayerName] = useState('');
  
  useEffect(() => {
    if (typeof LuminaCore !== 'undefined') {
      const profile = LuminaCore.getActiveProfile();
      if (profile) {
        setPlayerProfile(profile);
        setPlayerName(profile.name);
        // Auto-select character based on logged-in profile
        const profileId = profile.id.toLowerCase();
        if (profileId === 'emma' || profileId === 'liam') {
          setCharacter(profileId);
          console.log('🏎️ Lumina Racer: Playing as', profile.name, `(${profileId})`);
        } else {
          // Guest profile - default to emma character
          setCharacter('emma');
          console.log('🏎️ Lumina Racer: Guest profile, using Emma character');
        }
        LuminaCore.recordGameStart(profile.id, 'luminaRacer');
      } else {
        console.warn('⚠️ No active player found for Lumina Racer.');
        // Default to emma if no profile
        setCharacter('emma');
      }
    } else {
      // LuminaCore not available - standalone mode, default to emma
      console.log('🏎️ Lumina Racer: Standalone mode, using Emma character');
      setCharacter('emma');
    }
  }, []);
  
  // Game state
  const [screen, setScreen] = useState('menu'); // menu, charSelect, trackSelect, countdown, racing, results
  const [character, setCharacter] = useState(null);
  const [track, setTrack] = useState(null);
  const [words, setWords] = useState(DEFAULT_WORDS);
  const [customWordsInput, setCustomWordsInput] = useState('');
  
  // Race state
  const [playerPosition, setPlayerPosition] = useState(0);
  const [aiPositions, setAiPositions] = useState([0, 0, 0]);
  const [currentLap, setCurrentLap] = useState(1);
  const [currentWord, setCurrentWord] = useState('');
  const [typedWord, setTypedWord] = useState('');
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [boostActive, setBoostActive] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [raceTime, setRaceTime] = useState(0);
  const [finished, setFinished] = useState(false);
  const [finalPlace, setFinalPlace] = useState(0);
  const [showBoostEffect, setShowBoostEffect] = useState(false);
  
  // Aurora
  const [auroraMessage, setAuroraMessage] = useState('');
  const [auroraVisible, setAuroraVisible] = useState(false);
  
  // Audio Manager
  const audioManager = useMemo(() => {
    const manager = new AudioManager();
    manager.preloadMusic();
    return manager;
  }, []);
  
  // Refs
  const inputRef = useRef(null);
  const gameLoopRef = useRef(null);
  const raceTimerRef = useRef(null);
  const usedWordsRef = useRef(new Set());
  
  const TRACK_LENGTH = 100;
  const LAP_LENGTH = track ? TRACK_LENGTH / track.laps : 25;
  
  // Aurora speaks
  const auroraSpeak = useCallback((category) => {
    const message = randomFrom(AURORA_COMMENTS[category] || AURORA_COMMENTS.correct);
    setAuroraMessage(message);
    setAuroraVisible(true);
    setTimeout(() => setAuroraVisible(false), 2500);
  }, []);
  
  // Get next word
  const getNextWord = useCallback(() => {
    const available = words.filter(w => !usedWordsRef.current.has(w));
    if (available.length === 0) {
      usedWordsRef.current.clear();
      return words[Math.floor(Math.random() * words.length)];
    }
    const word = available[Math.floor(Math.random() * available.length)];
    usedWordsRef.current.add(word);
    return word;
  }, [words]);
  
  // Start countdown
  const startCountdown = useCallback(() => {
    setScreen('countdown');
    setCountdown(3);
    setPlayerPosition(0);
    setAiPositions([0, 0, 0]);
    setCurrentLap(1);
    setWordsCompleted(0);
    setMistakes(0);
    setCombo(0);
    setMaxCombo(0);
    setRaceTime(0);
    setFinished(false);
    setFinalPlace(0);
    usedWordsRef.current.clear();
    
    // Parse custom words or use character defaults
    let gameWords = character === 'liam' ? LIAM_WORDS : DEFAULT_WORDS;
    if (customWordsInput.trim()) {
      const custom = customWordsInput
        .toLowerCase()
        .split(/[\s,]+/)
        .map(w => w.trim())
        .filter(w => w.length >= 2);
      if (custom.length >= 5) {
        gameWords = custom;
      }
    }
    setWords(gameWords);
    
    const nextWord = gameWords[Math.floor(Math.random() * gameWords.length)];
    setCurrentWord(nextWord);
    setTypedWord('');
    
    auroraSpeak('start');
    
    let count = 3;
    const countInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        audioManager.playSFX('countdown');
      } else {
        clearInterval(countInterval);
        setScreen('racing');
        audioManager.playSFX('countdown');
        speakWord(nextWord);
        inputRef.current?.focus();
      }
    }, 1000);
  }, [character, customWordsInput, auroraSpeak]);
  
  // Game loop
  useEffect(() => {
    if (screen !== 'racing' || finished) return;
    
    const loop = setInterval(() => {
      // Move AI racers
      setAiPositions(prev => prev.map((pos, i) => {
        if (pos >= TRACK_LENGTH) return pos;
        const racer = AI_RACERS[i];
        const baseSpeed = 0.10 * racer.difficulty;
        const variance = (Math.random() - 0.5) * 0.1;
        return Math.min(TRACK_LENGTH, pos + baseSpeed + variance);
      }));
      
      // Update race time
      setRaceTime(t => t + 0.05);
    }, 50);
    
    gameLoopRef.current = loop;
    return () => clearInterval(loop);
  }, [screen, finished]);
  
  // Check for race completion
  useEffect(() => {
    if (screen !== 'racing' || finished) return;
    
    // Get all positions
    const positions = [
      { id: 'player', pos: playerPosition },
      ...aiPositions.map((pos, i) => ({ id: `ai${i}`, pos }))
    ].sort((a, b) => b.pos - a.pos);
    
    const playerRank = positions.findIndex(p => p.id === 'player') + 1;
    
    // Aurora commentary based on position
    if (playerPosition > 0 && playerPosition % 20 < 1) {
      if (playerRank === 1) {
        auroraSpeak('winning');
      } else if (playerRank > 2) {
        auroraSpeak('losing');
      }
    }
    
    // Check if player finished
    if (playerPosition >= TRACK_LENGTH) {
      setFinished(true);
      audioManager.playSFX('finish');
      setFinalPlace(playerRank);
      if (playerRank === 1) {
        auroraSpeak('finish');
      } else {
        auroraSpeak('lostRace');
      }
      setTimeout(() => setScreen('results'), 1500);
    }
    
    // Check if all AI finished (player loses)
    if (aiPositions.every(p => p >= TRACK_LENGTH) && !finished) {
      setFinished(true);
      audioManager.playSFX('finish');
      setFinalPlace(4);
      auroraSpeak('lostRace');
      setTimeout(() => setScreen('results'), 1500);
    }
  }, [playerPosition, aiPositions, screen, finished, auroraSpeak, audioManager]);
  
  // Update current lap
  useEffect(() => {
    if (track && playerPosition > 0) {
      const newLap = Math.min(track.laps, Math.floor(playerPosition / LAP_LENGTH) + 1);
      if (newLap > currentLap) {
        setCurrentLap(newLap);
        audioManager.playSFX('lap');
      }
    }
  }, [playerPosition, track, LAP_LENGTH, currentLap, audioManager]);
  
  // Handle input
  const handleInputChange = useCallback((e) => {
    const val = e.target.value
      .toLowerCase()
      .replace(/[''`]/g, "'");
    setTypedWord(val);
    
    // Check if word is complete
    if (val === currentWord) {
      // Correct!
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(m => Math.max(m, newCombo));
      setWordsCompleted(w => w + 1);
      
      // Calculate boost
      let boost = 3 + Math.min(newCombo * 0.5, 3);
      
      // Character special abilities
      if (character === 'liam' && val.length > 0) {
        // Quick Instinct - bonus for fast typing
        boost += 1;
      }
      
      // Big boost for combos
      if (newCombo >= 5 && newCombo % 5 === 0) {
        boost += 3;
        setBoostActive(true);
        setShowBoostEffect(true);
        audioManager.playSFX('boost');
        auroraSpeak('boost');
        setTimeout(() => {
          setBoostActive(false);
          setShowBoostEffect(false);
        }, 500);
      } else {
        audioManager.playSFX('correct');
        auroraSpeak('correct');
      }
      
      setPlayerPosition(p => Math.min(TRACK_LENGTH, p + boost));
      
      // Next word
      const nextWord = getNextWord();
      setCurrentWord(nextWord);
      setTypedWord('');
      speakWord(nextWord);
    }
  }, [currentWord, combo, character, getNextWord, auroraSpeak, audioManager]);
  
  // Handle key press
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && screen === 'racing') {
      setScreen('trackSelect');
    } else if (e.key === 'Enter' && screen === 'racing') {
      // Check partial match for mistake
      if (typedWord && typedWord !== currentWord) {
        setMistakes(m => m + 1);
        setCombo(0);
        audioManager.playSFX('wrong');
        auroraSpeak('wrong');
        setTypedWord('');
      }
    }
  }, [screen, typedWord, currentWord, auroraSpeak, audioManager]);
  
  // Calculate stats
  const accuracy = wordsCompleted > 0 
    ? Math.round((wordsCompleted / (wordsCompleted + mistakes)) * 100) 
    : 100;
  
  const wpm = raceTime > 0 
    ? Math.round((wordsCompleted / raceTime) * 60) 
    : 0;
  
  // Record game results to LuminaCore
  const recordGameResults = useCallback(() => {
    if (!playerProfile || typeof LuminaCore === 'undefined') return;
    
    const won = finalPlace === 1;
    // Reduced XP for quicker game - was too generous
    const xpEarned = Math.floor(
      (wordsCompleted * 3) +  // Reduced from 10 to 3 XP per word
      (won ? 30 : 0) +  // Reduced from 100 to 30 for winning
      (finalPlace === 2 ? 15 : finalPlace === 3 ? 8 : 0) +  // Reduced placement bonuses
      (maxCombo >= 5 ? 10 : 0)  // Reduced combo bonus
    );
    const coinsEarned = Math.floor(wordsCompleted * 2 + (won ? 50 : 0));
    // Reduced reward points ratio from /10 to /20 for slower progression
    const rewardPointsEarned = Math.floor(xpEarned / 20);
    
    LuminaCore.addXP(playerProfile.id, xpEarned, 'luminaRacer');
    LuminaCore.addCoins(playerProfile.id, coinsEarned, 'luminaRacer');
    LuminaCore.addRewardPoints(playerProfile.id, rewardPointsEarned);
    
    LuminaCore.recordGameEnd(playerProfile.id, 'luminaRacer', {
      score: wordsCompleted * 100 + (won ? 1000 : 0),
      gamesWon: won ? 1 : 0,
      wordsTyped: wordsCompleted,
      mistakes: mistakes,
      accuracy: accuracy,
      maxCombo: maxCombo,
      wpm: wpm,
      finalPlace: finalPlace,
      trackId: track?.id,
      raceTime: raceTime,
      status: won ? 'victory' : 'completed',
    });
    
    // Check achievements
    if (won) LuminaCore.checkAchievement(playerProfile.id, 'lr_first_win');
    if (wordsCompleted >= 20) LuminaCore.checkAchievement(playerProfile.id, 'lr_speed_demon');
    if (maxCombo >= 10) LuminaCore.checkAchievement(playerProfile.id, 'lr_combo_master');
    
    console.log('✨ Race Complete! Rewards earned:', { xp: xpEarned, coins: coinsEarned, rewardPoints: rewardPointsEarned });
  }, [playerProfile, finalPlace, wordsCompleted, mistakes, accuracy, maxCombo, wpm, track, raceTime]);
  
  // Play music based on screen
  useEffect(() => {
    if (screen === 'menu') {
      audioManager.playMusic('menu');
    } else if (screen === 'racing') {
      audioManager.playMusic('gameplay');
    } else if (screen === 'results') {
      const won = finalPlace === 1;
      audioManager.playMusic(won ? 'victory' : 'gameover');
    } else {
      audioManager.stopMusic();
    }
  }, [screen, finalPlace, audioManager]);
  
  // Record results when screen changes to results
  useEffect(() => {
    if (screen === 'results' && playerProfile) {
      recordGameResults();
    }
  }, [screen, playerProfile, recordGameResults]);
  
  // ==================== RENDER ====================
  return (
    <div className="w-full h-screen game-bg overflow-hidden relative">
      <div className="stars" />
      
      {/* ==================== MENU ==================== */}
      {screen === 'menu' && (
        <div className="absolute inset-0 z-20">
          {/* Background Image */}
          <div className="absolute inset-0 pointer-events-none"
               style={{
                 backgroundImage: `url(${GAME_ASSETS.backgrounds.menuMain})`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center'
               }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-purple-900/40 to-black/60" />
          </div>
          
          {/* Content Layer */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center animate-float mb-8">
              <div className="text-8xl mb-4">🏎️</div>
              <h1 className="font-title text-6xl md:text-7xl text-amber-400 mb-2"
                  style={{ textShadow: '0 0 30px rgba(251, 191, 36, 0.5), 0 4px 0 #92400e' }}>
                LUMINA RACER
              </h1>
              <p className="font-game text-xl text-purple-300 mb-8">
                Type to Race Through Magical Kingdoms! 🦊
              </p>
              {/* Aurora portrait */}
              {AURORA.portrait && (
                <img 
                  src={AURORA.portrait} 
                  alt="Aurora the Fox"
                  className="w-32 h-32 mx-auto object-contain mb-4 animate-float"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(96, 165, 250, 0.8))' }}
                />
              )}
            </div>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('START RACING clicked! Character:', character);
                alert('Button clicked! Character: ' + character);
                // Skip character select if profile is already set
                if (character) {
                  setScreen('trackSelect');
                } else {
                  setScreen('charSelect');
                }
              }}
              style={{
                position: 'relative',
                zIndex: 9999,
                padding: '16px 48px',
                fontSize: '24px',
                cursor: 'pointer',
                pointerEvents: 'all',
                touchAction: 'manipulation'
              }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 
                       text-white font-title rounded-xl shadow-lg hover:scale-105
                       border-2 border-purple-400/50 transition-all animate-pulse-glow mb-4"
            >
              🏁 START RACING
            </button>
            
            {/* Audio Controls */}
            <div className="flex gap-4 mt-4">
            <button
              onClick={() => {
                const enabled = audioManager.toggleMusic();
                if (enabled) {
                  audioManager.playMusic('menu');
                }
              }}
              className="px-4 py-2 bg-slate-800/80 text-white rounded-lg hover:bg-slate-700 transition-all border border-purple-500/30"
              title="Toggle Music"
            >
              {audioManager.musicEnabled ? '🔊' : '🔇'} Music
            </button>
            <button
              onClick={() => audioManager.toggleSFX()}
              className="px-4 py-2 bg-slate-800/80 text-white rounded-lg hover:bg-slate-700 transition-all border border-purple-500/30"
              title="Toggle Sound Effects"
            >
              {audioManager.sfxEnabled ? '🔊' : '🔇'} SFX
            </button>
          </div>
          
            <div className="mt-8 text-purple-400/60 font-game text-sm">
              Made with ❤️ for Emma & Liam
            </div>
            
            {/* Aurora floating */}
            <div className="absolute bottom-8 right-8 text-6xl animate-float">
              🦊
            </div>
          </div>
        </div>
      )}
      
      {/* ==================== CHARACTER SELECT ==================== */}
      {screen === 'charSelect' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4">
          <h2 className="font-title text-4xl text-amber-400 mb-8 animate-float">
            Choose Your Racer
          </h2>
          
          <div className="flex gap-6 mb-8">
            {Object.entries(CHARACTERS).map(([key, char]) => (
              <button
                key={key}
                onClick={() => {
                  setCharacter(key);
                  setScreen('trackSelect');
                }}
                className={`bg-slate-900/80 rounded-2xl p-6 border-2 transition-all hover:scale-105
                          ${char.color === 'purple' ? 'border-purple-500/50 hover:border-purple-400' : 'border-orange-500/50 hover:border-orange-400'}
                          ${char.color === 'purple' ? 'hover:shadow-[0_0_30px_rgba(147,51,234,0.3)]' : 'hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]'}`}
              >
                <div className="w-32 h-32 mx-auto mb-4 overflow-hidden">
                  <img 
                    src={char.portrait || char.avatar} 
                    alt={char.name}
                    className="w-full h-full object-contain"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(147, 51, 234, 0.5))' }}
                    onError={(e) => { 
                      e.target.style.display = 'none'; 
                      const fallback = document.createElement('div');
                      fallback.className = 'w-full h-full flex items-center justify-center';
                      fallback.innerHTML = `<span class="text-5xl">${char.emoji}</span>`;
                      e.target.parentElement.appendChild(fallback);
                    }}
                  />
                </div>
                <div className="font-title text-2xl text-white mb-1">{char.name}</div>
                <div className={`font-game text-sm mb-3 ${char.color === 'purple' ? 'text-purple-400' : 'text-orange-400'}`}>
                  {char.title}
                </div>
                <div className="bg-slate-800 rounded-lg p-2">
                  <div className="font-game text-xs text-amber-400">✨ {char.special}</div>
                  <div className="font-game text-xs text-slate-400">{char.specialDesc}</div>
                </div>
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setScreen('menu')}
            className="px-6 py-2 bg-slate-700 text-slate-300 font-game rounded-lg hover:bg-slate-600 transition-all"
          >
            ← Back
          </button>
        </div>
      )}
      
      {/* ==================== TRACK SELECT ==================== */}
      {screen === 'trackSelect' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 overflow-auto">
          <h2 className="font-title text-4xl text-amber-400 mb-6">
            Select Your Track
          </h2>
          
          {/* Custom words input */}
          <div className="w-full max-w-lg mb-6">
            <label className="block text-purple-300 font-game mb-2 text-sm">
              📝 Custom Spelling Words (optional)
            </label>
            <textarea
              value={customWordsInput}
              onChange={(e) => setCustomWordsInput(e.target.value)}
              placeholder="Paste weekly spelling words here..."
              className="w-full h-20 bg-slate-800 border-2 border-slate-600 rounded-lg p-3
                       text-white font-game text-sm resize-none focus:border-purple-500 focus:outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-2xl">
            {TRACKS.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTrack(t);
                  startCountdown();
                }}
                className={`bg-gradient-to-br ${t.bg} rounded-2xl p-4 border-2 border-white/20 
                          transition-all hover:scale-105 hover:border-white/40 text-left`}
              >
                <div className="text-4xl mb-2">{t.emoji}</div>
                <div className="font-title text-xl text-white">{t.name}</div>
                <div className="font-game text-xs text-white/70 mb-2">{t.description}</div>
                <div className="font-game text-xs text-amber-400">{t.laps} Laps</div>
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setScreen('charSelect')}
            className="px-6 py-2 bg-slate-700 text-slate-300 font-game rounded-lg hover:bg-slate-600 transition-all"
          >
            ← Change Character
          </button>
        </div>
      )}
      
      {/* ==================== COUNTDOWN ==================== */}
      {screen === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50">
          <div className="text-center">
            <div className="font-title text-9xl text-amber-400 animate-countdown"
                 key={countdown}
                 style={{ textShadow: '0 0 50px rgba(251, 191, 36, 0.8)' }}>
              {countdown}
            </div>
            <div className="font-game text-2xl text-purple-300 mt-4">
              Get Ready to Race!
            </div>
          </div>
        </div>
      )}
      
      {/* ==================== RACING ==================== */}
      {screen === 'racing' && (
        <div className="absolute inset-0 track-bg"
             style={{
               backgroundImage: track?.bgImage ? `url(${track.bgImage})` : undefined,
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               backgroundColor: track?.bgImage ? undefined : undefined
             }}>
          {/* Gradient overlay if using image */}
          {track?.bgImage && (
            <div className={`absolute inset-0 bg-gradient-to-b ${track.bg} opacity-40`} />
          )}
          {!track?.bgImage && (
            <div className={`absolute inset-0 bg-gradient-to-b ${track.bg}`} />
          )}
          {/* Speed lines effect */}
          <div className={`speed-lines ${boostActive ? 'active' : ''}`}>
            {[...Array(10)].map((_, i) => (
              <div 
                key={i}
                className="speed-line"
                style={{ 
                  top: `${10 + i * 8}%`, 
                  width: `${Math.random() * 100 + 50}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
          
          {/* Boost effect */}
          {showBoostEffect && <div className="boost-effect" />}
          
          {/* HUD - Top */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
            <div className="bg-slate-900/80 rounded-xl p-3 border border-purple-500/30">
              <div className="font-game text-amber-400">
                {track?.emoji} {track?.name}
              </div>
              <div className="font-title text-white text-2xl">
                Lap {currentLap}/{track?.laps}
              </div>
            </div>
            
            <div className="bg-slate-900/80 rounded-xl p-3 border border-purple-500/30 text-center">
              <div className="font-game text-purple-300 text-sm">Time</div>
              <div className="font-title text-white text-xl">
                {Math.floor(raceTime)}:{String(Math.floor((raceTime % 1) * 100)).padStart(2, '0')}
              </div>
            </div>
            
            <div className="bg-slate-900/80 rounded-xl p-3 border border-purple-500/30 text-right">
              <div className="font-game text-green-400">Words: {wordsCompleted}</div>
              {combo > 1 && (
                <div className="font-title text-orange-400 animate-race-pulse">
                  🔥 {combo}x Combo!
                </div>
              )}
            </div>
          </div>
          
          {/* Race Track Visual */}
          <div className="absolute left-4 right-4 top-1/4" style={{ height: '45%' }}>
            {/* Finish line */}
            <div className="absolute right-0 top-0 bottom-0 w-4 finish-line rounded-r" />
            
            {/* AI Racers */}
            {AI_RACERS.map((racer, i) => (
              <div
                key={i}
                className="racer-track h-12 mb-2 relative rounded-lg flex items-center"
              >
                <div 
                  className="absolute transition-all duration-100"
                  style={{ 
                    left: `${Math.min(95, aiPositions[i])}%`,
                    filter: `drop-shadow(0 0 10px ${racer.color})`
                  }}
                >
                  {racer.vehicle ? (
                    <img 
                      src={racer.vehicle} 
                      alt={racer.name}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <span className="text-3xl">{racer.emoji}</span>
                  )}
                </div>
                <div className="absolute left-2 font-game text-xs text-white/50">
                  {racer.name}
                </div>
              </div>
            ))}
            
            {/* Player Track */}
            <div className="racer-track h-16 relative rounded-lg flex items-center border-2 border-amber-500/50">
              <div 
                className={`absolute transition-all duration-100 ${boostActive ? 'animate-boost' : ''}`}
                style={{ 
                  left: `${Math.min(95, playerPosition)}%`,
                  filter: 'drop-shadow(0 0 15px rgba(251, 191, 36, 0.8))'
                }}
              >
                {CHARACTERS[character]?.vehicle ? (
                  <img 
                    src={CHARACTERS[character].vehicle} 
                    alt={CHARACTERS[character].name}
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <span className="text-4xl">{CHARACTERS[character]?.emoji || '🏎️'}</span>
                )}
              </div>
              <div className="absolute left-2 font-title text-sm text-amber-400">
                {CHARACTERS[character]?.name || 'You'}
              </div>
            </div>
          </div>
          
          {/* Aurora Commentary */}
          {auroraVisible && (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-full z-20">
              <div className="bg-slate-900/90 rounded-2xl p-4 border-2 border-amber-500/50 flex items-center gap-3 animate-aurora-bounce">
                {AURORA.cheering ? (
                  <img 
                    src={AURORA.cheering} 
                    alt="Aurora"
                    className="w-16 h-16 object-contain"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(96, 165, 250, 0.8))' }}
                  />
                ) : (
                  <span className="text-4xl">🦊</span>
                )}
                <span className="font-game text-white text-lg">{auroraMessage}</span>
              </div>
            </div>
          )}
          
          {/* Word Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900/90 border-t border-purple-500/30">
            <div className="max-w-2xl mx-auto">
              {/* Current Word Display */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-3 bg-slate-800 rounded-xl px-6 py-3 border-2 border-purple-500/50">
                  <span className="font-title text-3xl text-white tracking-wider">
                    {currentWord.split('').map((char, i) => (
                      <span 
                        key={i}
                        className={i < typedWord.length && currentWord.startsWith(typedWord) 
                          ? 'text-green-400' 
                          : 'text-white'}
                      >
                        {char}
                      </span>
                    ))}
                  </span>
                  <button
                    onClick={() => speakWord(currentWord)}
                    className="text-purple-400 hover:text-purple-300 text-xl"
                  >
                    🔊
                  </button>
                </div>
              </div>
              
              {/* Input */}
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
                placeholder="Type here..."
                className="magic-input w-full px-6 py-4 rounded-xl text-center
                         font-game text-2xl text-white placeholder-purple-400/50"
              />
              
              <p className="text-center text-slate-500 text-sm mt-2 font-game">
                Press ESC to quit race
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* ==================== RESULTS ==================== */}
      {screen === 'results' && (
        <div className="absolute inset-0 flex items-center justify-center z-30"
             style={finalPlace === 1 ? {
               backgroundImage: `url(${GAME_ASSETS.backgrounds.victory})`,
               backgroundSize: 'cover',
               backgroundPosition: 'center'
             } : { backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          {finalPlace === 1 && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-amber-900/40 to-black/60" />
          )}
          <div className="bg-slate-900/90 rounded-3xl p-8 max-w-md w-full mx-4 border-2 border-purple-500/50 text-center relative z-10">
            {/* Trophy/Place */}
            <div className="text-7xl mb-4">
              {finalPlace === 1 ? '🏆' : finalPlace === 2 ? '🥈' : finalPlace === 3 ? '🥉' : '🏁'}
            </div>
            
            <h2 className={`font-title text-4xl mb-2 ${finalPlace === 1 ? 'text-amber-400' : 'text-purple-400'}`}>
              {finalPlace === 1 ? 'CHAMPION!' : finalPlace <= 3 ? `${finalPlace}${finalPlace === 2 ? 'nd' : 'rd'} Place!` : 'Race Complete!'}
            </h2>
            
            <p className="font-game text-slate-400 mb-6">
              {finalPlace === 1 ? 'You conquered the track!' : 'Great effort, keep practicing!'}
            </p>
            
            {/* Stats */}
            <div className="bg-slate-800 rounded-xl p-4 mb-6 text-left font-game">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-400">Track:</div>
                <div className="text-white text-right">{track?.emoji} {track?.name}</div>
                <div className="text-slate-400">Time:</div>
                <div className="text-white text-right">
                  {Math.floor(raceTime)}:{String(Math.floor((raceTime % 1) * 100)).padStart(2, '0')}
                </div>
                <div className="text-slate-400">Words Typed:</div>
                <div className="text-amber-400 text-right">{wordsCompleted}</div>
                <div className="text-slate-400">Accuracy:</div>
                <div className="text-green-400 text-right">{accuracy}%</div>
                <div className="text-slate-400">Best Combo:</div>
                <div className="text-orange-400 text-right">{maxCombo}x</div>
                <div className="text-slate-400">WPM:</div>
                <div className="text-purple-400 text-right">{wpm}</div>
              </div>
            </div>
            
            {/* Aurora comment */}
            <div className="flex items-center justify-center gap-3 bg-amber-500/10 rounded-xl p-3 mb-6">
              {AURORA.portrait ? (
                <img 
                  src={AURORA.portrait} 
                  alt="Aurora"
                  className="w-12 h-12 object-contain"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.5))' }}
                />
              ) : (
                <span className="text-3xl">🦊</span>
              )}
              <span className="font-game text-amber-400">
                {finalPlace === 1 
                  ? "INCREDIBLE! You're a true Lumina champion!" 
                  : "Keep practicing! Every race makes you faster!"}
              </span>
            </div>
            
            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setScreen('trackSelect')}
                className="flex-1 py-3 bg-slate-700 text-slate-300 font-game rounded-lg
                         hover:bg-slate-600 transition-all"
              >
                🗺️ Tracks
              </button>
              <button
                onClick={startCountdown}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 
                         text-white font-game rounded-lg hover:scale-105 transition-all"
              >
                🔄 Race Again
              </button>
            </div>
            
            <button
              onClick={() => setScreen('menu')}
              className="w-full mt-3 py-2 text-slate-500 font-game text-sm hover:text-slate-400"
            >
              ← Main Menu
            </button>
            
            {playerProfile && (
              <a
                href="../index.html"
                className="block w-full mt-2 py-2 text-purple-400 font-game text-sm hover:text-purple-300 text-center"
              >
                🏠 Return to Noyola Hub
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
