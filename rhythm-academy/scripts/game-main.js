// ==================== MAIN GAME COMPONENT ====================
function RhythmAcademy() {
  // ==================== LUMINA CORE INTEGRATION ====================
  const [playerProfile, setPlayerProfile] = useState(null);
  const [playerName, setPlayerName] = useState('');
  
  useEffect(() => {
    if (typeof LuminaCore !== 'undefined') {
      const profile = LuminaCore.getActiveProfile();
      if (profile) {
        setPlayerProfile(profile);
        setPlayerName(profile.name);
        console.log('🎵 Rhythm Academy: Playing as', profile.name);
        LuminaCore.recordGameStart(profile.id, 'rhythmAcademy');
      }
    }
  }, []);
  
  // ==================== GAME STATE ====================
  const [screen, setScreen] = useState('menu'); // menu, songSelect, playing, results
  const [selectedSong, setSelectedSong] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');
  const [unlockedSongs, setUnlockedSongs] = useState(['song1']);
  
  // Gameplay state
  const [rhythmEngine, setRhythmEngine] = useState(null);
  const [activeNotes, setActiveNotes] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [pendingLane, setPendingLane] = useState(null);
  const [pendingNote, setPendingNote] = useState(null);
  const [gameStats, setGameStats] = useState(null);
  
  // Refs
  const juiceSystem = useMemo(() => new JuiceSystem(), []);
  const audioManager = useMemo(() => {
    const manager = new AudioManager();
    manager.preloadMusic();
    return manager;
  }, []);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const gameLoopRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  
  // ==================== INITIALIZATION ====================
  useEffect(() => {
    if (screen === 'menu') {
      audioManager.playMusic('menu');
    } else if (screen === 'playing' && selectedSong) {
      const musicKey = selectedSong.musicFile.replace('.mp3', '');
      audioManager.playMusic(musicKey);
    }
  }, [screen, selectedSong, audioManager]);
  
  // ==================== GAME LOOP ====================
  useEffect(() => {
    if (screen !== 'playing' || !rhythmEngine) return;
    
    const loop = () => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;
      
      // Update rhythm engine
      rhythmEngine.update(deltaTime);
      
      // Update active notes
      setActiveNotes(rhythmEngine.getActiveNotes());
      
      // Update score and combo
      const stats = rhythmEngine.getStats();
      setScore(stats.score);
      setCombo(stats.combo);
      setMaxCombo(stats.maxCombo);
      
      // Check if song complete
      if (rhythmEngine.isComplete()) {
        endSong();
      }
      
      // Update juice system
      juiceSystem.update(deltaTime);
      
      // Render juice
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        juiceSystem.render(ctx, 0, 0);
      }
      
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    
    gameLoopRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [screen, rhythmEngine, juiceSystem]);
  
  // ==================== SONG SELECTION ====================
  const selectSong = useCallback((song) => {
    if (!unlockedSongs.includes(song.id)) return;
    
    setSelectedSong(song);
    setDifficulty(song.difficulty);
    startSong(song);
  }, [unlockedSongs]);
  
  const startSong = useCallback((song) => {
    setScreen('playing');
    
    const engine = new RhythmEngine(
      song.difficulty,
      song,
      handleNoteHit,
      handleNoteMiss
    );
    
    setRhythmEngine(engine);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setActiveNotes([]);
    
    // Initialize canvas
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    // Start engine
    setTimeout(() => {
      engine.start();
    }, 1000); // 1 second countdown
  }, []);
  
  const handleNoteHit = useCallback((note, hitType, lane) => {
    // Juice effects
    const currentDiff = selectedSong ? selectedSong.difficulty : difficulty;
    const laneWidth = window.innerWidth / DIFFICULTY_LEVELS[currentDiff].lanes;
    const x = lane * laneWidth + laneWidth / 2;
    const y = window.innerHeight - 100;
    
    juiceSystem.noteHit(x, y, hitType);
    
    // Floating score text
    const scoreText = hitType === 'perfect' ? '+100' : '+50';
    juiceSystem.createFloatingText(x, y, scoreText, {
      color: hitType === 'perfect' ? '#4CAF50' : '#FFC107',
      fontSize: 28,
      duration: 800
    });
    
    // Audio
    if (hitType === 'perfect') {
      audioManager.playSFX('hit_perfect');
    } else {
      audioManager.playSFX('hit_good');
    }
    
    // Combo milestones
    if (combo + 1 === 10) {
      audioManager.playSFX('combo_10');
      juiceSystem.flashScreen('#FFD700', 200);
    } else if (combo + 1 === 20) {
      audioManager.playSFX('combo_20');
      juiceSystem.flashScreen('#FFD700', 300);
    }
  }, [selectedSong, difficulty, combo, juiceSystem, audioManager]);
  
  const handleNoteMiss = useCallback((note) => {
    audioManager.playSFX('hit_miss');
    if (combo > 0) {
      audioManager.playSFX('combo_break');
    }
  }, [combo, audioManager]);
  
  const hitLane = useCallback((lane) => {
    if (!rhythmEngine) return;
    
    const result = rhythmEngine.hitNote(lane);
    
    if (!result.hit && result.reason === 'needs_answer') {
      // Show question modal
      setCurrentQuestion(result.note.question);
      setPendingLane(lane);
      setPendingNote(result.note);
      setShowQuestion(true);
    } else if (result.hit) {
      handleNoteHit(result.note, result.type, lane);
    }
  }, [rhythmEngine, handleNoteHit]);
  
  const answerQuestion = useCallback((answer) => {
    setShowQuestion(false);
    
    if (pendingLane !== null && pendingNote) {
      const result = rhythmEngine.hitNote(pendingLane, answer);
      if (result.hit) {
        handleNoteHit(result.note, result.type, pendingLane);
      } else {
        handleNoteMiss(result.note);
      }
    }
    
    setPendingLane(null);
    setPendingNote(null);
    setCurrentQuestion(null);
  }, [pendingLane, pendingNote, rhythmEngine, handleNoteHit, handleNoteMiss]);
  
  const endSong = useCallback(() => {
    if (!rhythmEngine) return;
    
    rhythmEngine.stop();
    audioManager.stopMusic();
    
    const stats = rhythmEngine.getStats();
    setGameStats(stats);
    
    // Award to LuminaCore
    if (playerProfile) {
      const xpEarned = Math.floor(stats.score / 10);
      const coinsEarned = Math.floor(stats.score / 20);
      
      LuminaCore.addXP(playerProfile.id, xpEarned, 'rhythmAcademy');
      LuminaCore.addCoins(playerProfile.id, coinsEarned, 'rhythmAcademy');
      LuminaCore.addRewardPoints(playerProfile.id, Math.floor(xpEarned / 20));
      
      // Record game end
      const gameStats = {
        songsCompleted: 1,
        highScore: stats.score,
        maxCombo: stats.maxCombo,
        perfectSongs: stats.accuracy >= 90 ? 1 : 0,
        threeStarSongs: stats.stars === 3 ? 1 : 0
      };
      
      LuminaCore.recordGameEnd(playerProfile.id, 'rhythmAcademy', gameStats);
      
      // Check achievements
      if (stats.maxCombo >= 10) LuminaCore.checkAchievement(playerProfile.id, 'ra_combo_master');
      if (stats.accuracy >= 90) LuminaCore.checkAchievement(playerProfile.id, 'ra_perfect_accuracy');
      if (stats.stars === 3) LuminaCore.checkAchievement(playerProfile.id, 'ra_three_stars');
    }
    
    // Unlock next song if 3 stars
    if (stats.stars === 3 && selectedSong) {
      const songIndex = SONGS.findIndex(s => s.id === selectedSong.id);
      if (songIndex >= 0 && songIndex < SONGS.length - 1) {
        const nextSong = SONGS[songIndex + 1];
        if (!unlockedSongs.includes(nextSong.id)) {
          setUnlockedSongs(prev => [...prev, nextSong.id]);
        }
      }
    }
    
    audioManager.playSFX('song_complete');
    audioManager.playMusic('victory');
    setScreen('results');
  }, [rhythmEngine, playerProfile, selectedSong, unlockedSongs, audioManager]);
  
  // ==================== KEYBOARD CONTROLS ====================
  useEffect(() => {
    if (screen !== 'playing') return;
    
    const handleKeyPress = (e) => {
      const key = e.key.toLowerCase();
      const laneMap = {
        'a': 0, 's': 1, 'd': 2, 'f': 3, 'g': 4, 'h': 5
      };
      
      if (laneMap.hasOwnProperty(key)) {
        const lane = laneMap[key];
        const currentDiff = selectedSong ? selectedSong.difficulty : difficulty;
        if (lane < DIFFICULTY_LEVELS[currentDiff].lanes) {
          hitLane(lane);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [screen, selectedSong, difficulty, hitLane]);
  
  // ==================== RENDER ====================
  const config = DIFFICULTY_LEVELS[difficulty] || DIFFICULTY_LEVELS.easy;
  const lanes = config.lanes;
  const laneWidth = 100 / lanes;
  
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
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-900">
        <div className="stars" />
        {screen === 'menu' && (
          <img 
            src="../assets/backgrounds/rhythm-academy/menu_bg.png" 
            alt="Background" 
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
      </div>
      
      {/* ==================== MENU ==================== */}
      {screen === 'menu' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <div className="text-center animate-float">
            <div className="text-8xl mb-4">🎵</div>
            <h1 className="font-title text-6xl md:text-7xl text-amber-400 mb-2"
                style={{ textShadow: '0 0 30px rgba(251, 191, 36, 0.5)' }}>
              RHYTHM ACADEMY
            </h1>
            <p className="font-game text-xl text-purple-300 mb-8">
              Hit notes to the beat while learning! 🎶
            </p>
          </div>
          
          <button
            onClick={() => {
              audioManager.playSFX('select');
              setScreen('songSelect');
            }}
            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 
                     text-white font-title text-2xl rounded-xl shadow-lg hover:scale-105
                     border-2 border-purple-400/50 transition-all animate-pulse-glow mb-4"
          >
            🎼 SELECT SONG
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
      
      {/* ==================== SONG SELECT ==================== */}
      {screen === 'songSelect' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 overflow-auto">
          <h2 className="font-title text-4xl text-amber-400 mb-6">Choose Your Song</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mb-6">
            {SONGS.map(song => {
              const isUnlocked = unlockedSongs.includes(song.id);
              return (
                <button
                  key={song.id}
                  onClick={() => isUnlocked && selectSong(song)}
                  disabled={!isUnlocked}
                  className={`bg-slate-900/80 rounded-2xl p-6 border-2 transition-all text-left
                            ${isUnlocked 
                              ? 'border-purple-500/50 hover:border-purple-400 hover:scale-105 cursor-pointer' 
                              : 'border-slate-700/50 opacity-50 cursor-not-allowed'}`}
                >
                  <div className="text-4xl mb-2">{song.icon}</div>
                  <div className="font-title text-xl text-white mb-1">{song.name}</div>
                  <div className="font-game text-xs text-white/70 mb-2">{song.description}</div>
                  <div className="font-game text-xs text-amber-400">
                    {DIFFICULTY_LEVELS[song.difficulty].icon} {DIFFICULTY_LEVELS[song.difficulty].name}
                  </div>
                  {!isUnlocked && (
                    <div className="mt-2 text-xs text-red-400">🔒 Locked - Get 3 stars on previous song!</div>
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
      {screen === 'playing' && (
        <div className="absolute inset-0 flex flex-col z-20">
          {/* HUD */}
          <div className="flex justify-between items-center p-4 bg-slate-900/80 border-b border-purple-500/30">
            <div className="font-title text-xl text-white">
              {selectedSong?.name} | {config.name}
            </div>
            <div className="flex gap-6 items-center">
              <div className="text-amber-400 font-game">
                Score: <span className="text-white">{score.toLocaleString()}</span>
              </div>
              {combo > 0 && (
                <div className="text-yellow-400 font-title text-2xl">
                  🔥 {combo}x
                </div>
              )}
            </div>
          </div>
          
          {/* Lanes */}
          <div className="flex-1 flex relative">
            {Array.from({ length: lanes }).map((_, laneIndex) => {
              const laneNotes = activeNotes.filter(n => n.lane === laneIndex);
              const isActive = false; // Could track which lane is being pressed
              
              return (
                <div
                  key={laneIndex}
                  className={`note-lane flex-1 relative ${isActive ? 'active' : ''}`}
                  style={{ width: `${laneWidth}%` }}
                  onClick={() => hitLane(laneIndex)}
                >
                  {/* Hit Zone */}
                  <div className="hit-zone" />
                  
                  {/* Falling Notes */}
                  {laneNotes.map(note => {
                    const timeUntilHit = rhythmEngine?.getTimeUntilHit(note.time) || 0;
                    const y = rhythmEngine?.calculateNoteY(timeUntilHit) || 0;
                    
                    return (
                      <div
                        key={note.id}
                        className="falling-note"
                        style={{
                          top: `${y}px`,
                          animation: `noteFall ${(timeUntilHit + 2)}s linear`
                        }}
                      >
                        {note.question ? (
                          <span className="text-2xl">❓</span>
                        ) : (
                          <img 
                            src="../assets/sprites/rhythm-academy/note_rgba.png" 
                            alt="Note" 
                            className="w-12 h-12 object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Lane Key Indicator */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                                bg-slate-800/80 rounded-lg px-4 py-2 font-title text-xl text-white">
                    {['A', 'S', 'D', 'F', 'G', 'H'][laneIndex]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* ==================== QUESTION MODAL ==================== */}
      {showQuestion && currentQuestion && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full mx-4 border-2 border-purple-500/50">
            <div className="font-title text-2xl text-amber-400 mb-4 text-center">
              {currentQuestion.question}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => answerQuestion(currentQuestion.answer)}
                className="px-4 py-3 bg-green-600 text-white font-game rounded-lg hover:bg-green-700 transition-all"
              >
                {currentQuestion.answer}
              </button>
              {currentQuestion.wrongAnswers.map((wrong, i) => (
                <button
                  key={i}
                  onClick={() => answerQuestion(wrong)}
                  className="px-4 py-3 bg-red-600 text-white font-game rounded-lg hover:bg-red-700 transition-all"
                >
                  {wrong}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* ==================== RESULTS ==================== */}
      {screen === 'results' && gameStats && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/70">
          <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full mx-4 border-2 border-purple-500/50 text-center">
            <div className="text-6xl mb-4">{'⭐'.repeat(gameStats.stars)}</div>
            <h2 className="font-title text-3xl text-amber-400 mb-4">Song Complete!</h2>
            <div className="font-game text-lg text-white mb-6 space-y-2">
              <div>Score: {gameStats.score.toLocaleString()}</div>
              <div>Accuracy: {gameStats.accuracy}%</div>
              <div>Max Combo: {gameStats.maxCombo}x</div>
              <div>Perfect Hits: {gameStats.perfectHits}</div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setScreen('songSelect');
                  audioManager.stopMusic();
                }}
                className="flex-1 py-3 bg-purple-600 text-white font-game rounded-lg hover:bg-purple-700 transition-all"
              >
                Song Select
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
