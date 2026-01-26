// ==================== MAIN GAME COMPONENT ====================
function PianoPath() {
  // ==================== LUMINA CORE INTEGRATION ====================
  const [playerProfile, setPlayerProfile] = useState(null);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    if (typeof LuminaCore !== 'undefined') {
      const profile = LuminaCore.getActiveProfile();
      if (profile) {
        setPlayerProfile(profile);
        setPlayerName(profile.name);
        console.log('🎹 Piano Path: Playing as', profile.name);
      }
    }
  }, []);

  // ==================== STATE ====================
  const [screen, setScreen] = useState('menu'); // menu, select, practice, results
  const [selectedSong, setSelectedSong] = useState(null);
  const [mode, setMode] = useState('guided');
  const [tempo, setTempo] = useState(1);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeNotes, setActiveNotes] = useState([]);
  const [pressedNotes, setPressedNotes] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctNotes, setCorrectNotes] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [unlockedSongs, setUnlockedSongs] = useState([SONGS[0].id]);
  const [songStars, setSongStars] = useState({});
  const [sessionRewards, setSessionRewards] = useState(null);
  const [tip, setTip] = useState(QUICK_TIPS[0]);
  const [showHelp, setShowHelp] = useState(false);
  const [songPage, setSongPage] = useState(0);

  const audioManager = useMemo(() => {
    const manager = new AudioManager();
    manager.preloadSfx();
    return manager;
  }, []);

  const pianoRef = useRef(null);
  const playbackTimeoutRef = useRef(null);
  const stepStartRef = useRef(0);
  const stepHitRef = useRef(new Set());
  const hasRecordedStartRef = useRef(false);

  const totalStepNotes = useMemo(() => {
    if (!selectedSong) return 0;
    return selectedSong.steps.reduce((sum, step) => sum + step.notes.length, 0);
  }, [selectedSong]);

  // ==================== PROGRESS STORAGE ====================
  useEffect(() => {
    const stored = localStorage.getItem('piano-path-progress');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.unlockedSongs) setUnlockedSongs(parsed.unlockedSongs);
        if (parsed.songStars) setSongStars(parsed.songStars);
      } catch (e) {
        console.warn('Piano Path: Failed to parse progress');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('piano-path-progress', JSON.stringify({
      unlockedSongs,
      songStars
    }));
  }, [unlockedSongs, songStars]);

  useEffect(() => {
    setTip(QUICK_TIPS[Math.floor(Math.random() * QUICK_TIPS.length)]);
  }, [screen]);

  useEffect(() => {
    if (screen === 'select') {
      setSongPage(0);
    }
  }, [screen]);

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(SONGS.length / pageSize));
  const pageSongs = useMemo(() => {
    const start = songPage * pageSize;
    return SONGS.slice(start, start + pageSize);
  }, [songPage]);

  // ==================== INPUT HANDLING ====================
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) return;
      const note = KEY_BINDS[event.key.toLowerCase()];
      if (note) {
        handleNotePress(note, true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNotePress]);

  const handleNotePress = useCallback((note, fromKeyboard = false) => {
    audioManager.ensureContext();
    audioManager.playNote(note, 0.45, 0.75);

    setPressedNotes((prev) => [...new Set([...prev, note])]);
    setTimeout(() => {
      setPressedNotes((prev) => prev.filter((n) => n !== note));
    }, 160);

    if (screen !== 'practice' || !selectedSong) return;

    const currentStep = selectedSong.steps[stepIndex];
    if (!currentStep) return;

    const expected = currentStep.notes;
    const alreadyHit = stepHitRef.current.has(note);

    if (expected.includes(note) && !alreadyHit) {
      stepHitRef.current.add(note);
      registerHit(note);

      if (mode === 'practice' && stepHitRef.current.size >= expected.length) {
        advanceStep();
      }
    } else {
      registerMiss(note, fromKeyboard);
    }
  }, [screen, selectedSong, stepIndex, mode, audioManager]);

  // ==================== JUICE HELPERS ====================
  const spawnSparkles = (note) => {
    const keyElement = document.querySelector(`[data-note="${note}"]`);
    const container = pianoRef.current;
    if (!keyElement || !container) return;

    const keyRect = keyElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const sparkleId = `sparkle-${Date.now()}-${Math.random()}`;
    const x = keyRect.left - containerRect.left + keyRect.width / 2;
    const y = keyRect.top - containerRect.top + keyRect.height / 2;

    setSparkles((prev) => [...prev, { id: sparkleId, x, y }]);
    setTimeout(() => {
      setSparkles((prev) => prev.filter((spark) => spark.id !== sparkleId));
    }, 800);
  };

  const spawnFloatingText = (note, text, color) => {
    const keyElement = document.querySelector(`[data-note="${note}"]`);
    const container = pianoRef.current;
    if (!keyElement || !container) return;

    const keyRect = keyElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const textId = `float-${Date.now()}-${Math.random()}`;
    const x = keyRect.left - containerRect.left + keyRect.width / 2;
    const y = keyRect.top - containerRect.top;

    setFloatingTexts((prev) => [...prev, { id: textId, x, y, text, color }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== textId));
    }, 1000);
  };

  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 200);
  };

  // ==================== GAMEPLAY LOGIC ====================
  const getStepDurationMs = useCallback((step) => {
    if (!selectedSong) return 500;
    const beatMs = (60 / selectedSong.bpm) * 1000;
    return beatMs * step.beats / tempo;
  }, [selectedSong, tempo]);

  const startSong = useCallback((song) => {
    if (playerProfile && !hasRecordedStartRef.current) {
      LuminaCore.recordGameStart(playerProfile.id, GAME_ID);
      hasRecordedStartRef.current = true;
    }
    setSelectedSong(song);
    setScreen('practice');
    setMode('guided');
    setStepIndex(0);
    setActiveNotes(song.steps[0]?.notes || []);
    stepStartRef.current = Date.now();
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectNotes(0);
    setTotalNotes(song.steps.reduce((sum, step) => sum + step.notes.length, 0));
    setMistakes(0);
    setSessionRewards(null);
    setIsPlaying(false);
    stepHitRef.current = new Set();
  }, [playerProfile]);

  const registerHit = (note) => {
    const step = selectedSong?.steps[stepIndex];
    if (!step) return;

    const stepDuration = getStepDurationMs(step);
    const elapsed = Date.now() - stepStartRef.current;
    const timingRatio = stepDuration > 0 ? elapsed / stepDuration : 0;
    const perfect = timingRatio <= 0.5;
    const points = perfect ? 100 : 60;

    setCombo((prev) => {
      const nextCombo = prev + 1;
      setMaxCombo((maxPrev) => Math.max(maxPrev, nextCombo));
      setScore((scorePrev) => scorePrev + points + Math.min(nextCombo * 5, 50));
      if (nextCombo === 8 || nextCombo === 16) {
        audioManager.playSfx('combo');
        triggerFlash();
      }
      return nextCombo;
    });
    setCorrectNotes((prev) => prev + 1);

    spawnSparkles(note);
    spawnFloatingText(note, perfect ? '+100' : '+60', perfect ? '#4ade80' : '#fbbf24');
    audioManager.playSfx('success');
  };

  const registerMiss = (note, fromKeyboard) => {
    setMistakes((prev) => prev + 1);
    setCombo(0);
    triggerShake();
    audioManager.playSfx('miss');

    if (!fromKeyboard) {
      spawnFloatingText(note, 'Oops', '#f87171');
    }
  };

  const advanceStep = useCallback(() => {
    const nextIndex = stepIndex + 1;
    const nextStep = selectedSong?.steps[nextIndex];
    stepHitRef.current = new Set();

    if (!nextStep) {
      finishSong();
      return;
    }

    setStepIndex(nextIndex);
    setActiveNotes(nextStep.notes);
    stepStartRef.current = Date.now();
  }, [stepIndex, selectedSong]);

  const playGuidedStep = useCallback(() => {
    if (!selectedSong) return;
    const step = selectedSong.steps[stepIndex];
    if (!step) return;

    stepStartRef.current = Date.now();
    stepHitRef.current = new Set();
    setActiveNotes(step.notes);
    audioManager.playChord(step.notes, getStepDurationMs(step) / 1000, 0.75);

    playbackTimeoutRef.current = setTimeout(() => {
      if (stepHitRef.current.size < step.notes.length) {
        registerMiss(step.notes[0], false);
      }
      advanceStep();
    }, getStepDurationMs(step));
  }, [selectedSong, stepIndex, audioManager, getStepDurationMs, advanceStep]);

  useEffect(() => {
    if (screen !== 'practice' || !selectedSong) return;
    if (mode !== 'guided' || !isPlaying) return;
    playGuidedStep();

    return () => {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
    };
  }, [screen, selectedSong, mode, isPlaying, stepIndex, playGuidedStep]);

  const finishSong = () => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
    }

    const accuracy = totalNotes > 0 ? Math.round((correctNotes / totalNotes) * 100) : 0;
    const earnedStars = accuracy >= 90 ? 3 : accuracy >= 75 ? 2 : accuracy >= 60 ? 1 : 0;
    const perfectRun = accuracy >= 95 && mistakes <= 1;

    setSongStars((prev) => ({
      ...prev,
      [selectedSong.id]: Math.max(prev[selectedSong.id] || 0, earnedStars)
    }));

    if (accuracy >= selectedSong.goalAccuracy) {
      const unlocked = [...unlockedSongs];
      selectedSong.unlocks.forEach((id) => {
        if (!unlocked.includes(id)) unlocked.push(id);
      });
      setUnlockedSongs(unlocked);
    }

    const baseXp = 35;
    const accuracyXp = Math.floor(accuracy * 0.6);
    const comboBonus = Math.floor(maxCombo * 2);
    const xpEarned = Math.floor(baseXp + accuracyXp + comboBonus);
    const coinsEarned = Math.floor(xpEarned * 0.5);
    const rewardPoints = Math.floor(xpEarned / 20);

    if (playerProfile) {
      LuminaCore.addXP(playerProfile.id, xpEarned, GAME_ID);
      LuminaCore.addCoins(playerProfile.id, coinsEarned, GAME_ID);
      LuminaCore.addRewardPoints(playerProfile.id, rewardPoints);

      const stats = {
        highScore: score,
        songsCompleted: 1,
        perfectRuns: perfectRun ? 1 : 0,
        maxCombo: maxCombo,
        notesHit: correctNotes,
        notesTotal: totalNotes,
        twinkleCompleted: selectedSong.id === 'twinkle' ? 1 : 0,
        gamesWon: accuracy >= selectedSong.goalAccuracy ? 1 : 0
      };

      LuminaCore.recordGameEnd(playerProfile.id, GAME_ID, stats);
      LuminaCore.checkDailyChallengeProgress(playerProfile.id, GAME_ID, stats);
      LuminaCore.checkCrossGameAchievements(playerProfile.id);
    }

    setSessionRewards({
      accuracy,
      stars: earnedStars,
      xpEarned,
      coinsEarned,
      rewardPoints,
      perfectRun
    });

    setScreen('results');
    setIsPlaying(false);
  };

  const resetToMenu = () => {
    setScreen('menu');
    setSelectedSong(null);
    setStepIndex(0);
    setActiveNotes([]);
    setIsPlaying(false);
  };

  // ==================== UI HELPERS ====================
  const renderPianoKeys = () => {
    const whiteKeys = PIANO_KEYS.filter((key) => key.type === 'white');
    const blackKeys = PIANO_KEYS.filter((key) => key.type === 'black');

    return (
      <div className={`piano-shell ${shake ? 'shake' : ''}`} ref={pianoRef}>
        <div className="piano-keys">
          {whiteKeys.map((key) => {
            const isActive = activeNotes.includes(key.note);
            const isPressed = pressedNotes.includes(key.note);
            return (
              <button
                key={key.note}
                className={`white-key ${isActive ? 'active guided' : ''} ${isPressed ? 'pressed' : ''}`}
                data-note={key.note}
                onClick={() => handleNotePress(key.note)}
              >
                <span className="key-label">{key.label}</span>
              </button>
            );
          })}

          {blackKeys.map((key) => {
            const isActive = activeNotes.includes(key.note);
            const isPressed = pressedNotes.includes(key.note);
            const left = `calc(${(key.order + key.offset) * 100 / whiteKeys.length}%)`;
            return (
              <button
                key={key.note}
                className={`black-key ${isActive ? 'active guided' : ''} ${isPressed ? 'pressed' : ''}`}
                style={{ left }}
                data-note={key.note}
                onClick={() => handleNotePress(key.note)}
              >
                <span className="key-label">{key.label}</span>
              </button>
            );
          })}

          {sparkles.map((sparkle) => (
            <div
              key={sparkle.id}
              className="sparkle"
              style={{ left: sparkle.x, top: sparkle.y }}
            />
          ))}

          {floatingTexts.map((item) => (
            <div
              key={item.id}
              className="floating-text"
              style={{ left: item.x, top: item.y, color: item.color }}
            >
              {item.text}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ==================== RENDER ====================
  return (
    <div className="game-bg">
      <div className="stars" />
      <div className={`screen-flash ${flash ? 'active' : ''}`} />

      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-title text-yellow-300">Piano Path</h1>
            <p className="text-purple-200">Follow the lights. Play the song.</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-purple-200">Player</div>
            <div className="text-xl font-semibold text-white">{playerName || 'Guest'}</div>
          </div>
        </div>

        {screen === 'menu' && (
          <div className="piano-stage p-8 space-y-8 animate-bounce-in">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-title text-white">Learn real piano songs</h2>
                <p className="text-purple-100 text-lg">
                  Choose a song, watch the keys light up, and play along on your own piano.
                  Practice mode lets you go note-by-note at your own pace.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="badge-pill">🎹 Visual Guides</span>
                  <span className="badge-pill">✨ Instant Feedback</span>
                  <span className="badge-pill">🏆 Star Ratings</span>
                </div>
                <p className="text-sm text-purple-200">Tip: {tip}</p>
                <div className="flex gap-3">
                  <button
                    className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-semibold px-6 py-3 rounded-full transition-all"
                    onClick={() => {
                      audioManager.ensureContext();
                      audioManager.playSfx('click');
                      setScreen('select');
                    }}
                  >
                    Start Learning
                  </button>
                  <button
                    className="border border-purple-300 text-purple-100 px-6 py-3 rounded-full hover:bg-purple-700/40 transition-all"
                    onClick={() => {
                      audioManager.playSfx('select');
                      setShowHelp(true);
                    }}
                  >
                    How to Play
                  </button>
                </div>
              </div>
              <div>
                {renderPianoKeys()}
              </div>
            </div>
          </div>
        )}

        {screen === 'select' && (
          <div className="piano-stage p-8 space-y-6 animate-bounce-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-title text-white">Choose a Song</h2>
              <button
                className="text-purple-200 hover:text-white"
                onClick={resetToMenu}
              >
                ← Back
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {pageSongs.map((song) => {
                const unlocked = unlockedSongs.includes(song.id);
                const stars = songStars[song.id] || 0;
                return (
                  <button
                    key={song.id}
                    className={`p-5 rounded-2xl border transition-all text-left ${
                      unlocked
                        ? 'border-yellow-400/40 bg-purple-900/60 hover:bg-purple-800/70'
                        : 'border-purple-900 bg-purple-950/40 opacity-60'
                    }`}
                    onClick={() => {
                      if (!unlocked) return;
                      audioManager.playSfx('select');
                      startSong(song);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-white">{song.title}</h3>
                      <span className="text-sm text-purple-200">{song.difficulty}</span>
                    </div>
                    <p className="text-purple-200 text-sm mt-1">{song.subtitle}</p>
                    <div className="flex items-center gap-2 mt-3 text-yellow-300">
                      {'★'.repeat(stars)}{'☆'.repeat(3 - stars)}
                    </div>
                    <div className="text-xs text-purple-300 mt-2">
                      {unlocked ? `Goal: ${song.goalAccuracy}% accuracy` : 'Locked'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                className="text-purple-200 hover:text-white disabled:opacity-40"
                onClick={() => setSongPage((prev) => Math.max(0, prev - 1))}
                disabled={songPage === 0}
              >
                ← Prev
              </button>
              <div className="text-sm text-purple-300">
                Page {songPage + 1} of {totalPages}
              </div>
              <button
                className="text-purple-200 hover:text-white disabled:opacity-40"
                onClick={() => setSongPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={songPage >= totalPages - 1}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {screen === 'practice' && selectedSong && (
          <div className="space-y-6">
            <div className="piano-stage p-6 flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="badge-pill">{MODE_INFO[mode].icon} {MODE_INFO[mode].label}</span>
                  <span className="text-purple-200">Song: {selectedSong.title}</span>
                  <span className="text-purple-300 text-sm">Step {stepIndex + 1} / {selectedSong.steps.length}</span>
                </div>

                <div className="progress-rail">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, (stepIndex / selectedSong.steps.length) * 100)}%` }}
                  />
                </div>

                <div className="flex flex-wrap gap-4 text-purple-100">
                  <div>Score: <span className="text-yellow-300 font-semibold">{score}</span></div>
                  <div>Combo: <span className="text-green-300 font-semibold">{combo}</span></div>
                  <div>Accuracy: <span className="text-blue-300 font-semibold">
                    {totalNotes ? Math.round((correctNotes / totalNotes) * 100) : 0}%</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {Object.keys(MODE_INFO).map((key) => (
                    <button
                      key={key}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        mode === key ? 'bg-yellow-400 text-purple-900' : 'bg-purple-800/60 text-purple-100'
                      }`}
                      onClick={() => {
                        audioManager.playSfx('click');
                        setMode(key);
                        setIsPlaying(false);
                        setActiveNotes(selectedSong.steps[stepIndex]?.notes || []);
                        stepHitRef.current = new Set();
                        stepStartRef.current = Date.now();
                      }}
                    >
                      {MODE_INFO[key].label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-purple-200">
                  <span>Tempo</span>
                  {[0.75, 1, 1.25].map((value) => (
                    <button
                      key={value}
                      className={`px-3 py-1 rounded-full border ${
                        tempo === value ? 'border-yellow-300 text-yellow-200' : 'border-purple-600 text-purple-200'
                      }`}
                      onClick={() => {
                        audioManager.playSfx('click');
                        setTempo(value);
                      }}
                    >
                      {Math.round(value * 100)}%
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  {mode === 'guided' && (
                    <button
                      className="bg-green-400 text-green-950 px-5 py-2 rounded-full font-semibold"
                      onClick={() => {
                        audioManager.ensureContext();
                        audioManager.playSfx('select');
                        setIsPlaying(true);
                      }}
                      disabled={isPlaying}
                    >
                      {isPlaying ? 'Playing...' : 'Play Song'}
                    </button>
                  )}
                  <button
                    className="bg-purple-700/70 text-purple-100 px-5 py-2 rounded-full"
                    onClick={() => {
                      audioManager.playSfx('click');
                      setScreen('select');
                      setIsPlaying(false);
                    }}
                  >
                    Change Song
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="bg-purple-900/40 border border-purple-700/50 rounded-2xl p-4">
                  <div className="text-purple-200 text-sm">Now Playing</div>
                  <div className="text-xl font-semibold text-white">{selectedSong.title}</div>
                  <div className="text-purple-300">{MODE_INFO[mode].description}</div>
                </div>

                <div className="bg-purple-900/40 border border-purple-700/50 rounded-2xl p-4">
                  <div className="text-purple-200 text-sm">Next Notes</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activeNotes.map((note) => (
                      <span key={note} className="badge-pill">{note}</span>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-purple-200">
                  Tip: Play along on your real piano while the lights guide you.
                </div>
              </div>
            </div>

            {renderPianoKeys()}
          </div>
        )}

        {screen === 'results' && selectedSong && sessionRewards && (
          <div className="piano-stage p-8 space-y-6 animate-bounce-in">
            <h2 className="text-3xl font-title text-white">Great Practice!</h2>
            <p className="text-purple-200">You finished {selectedSong.title}. Keep going for a perfect run!</p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-purple-900/60 rounded-2xl p-4">
                <div className="text-sm text-purple-200">Accuracy</div>
                <div className="text-3xl font-bold text-yellow-300">{sessionRewards.accuracy}%</div>
                <div className="text-yellow-200">{'★'.repeat(sessionRewards.stars)}{'☆'.repeat(3 - sessionRewards.stars)}</div>
              </div>
              <div className="bg-purple-900/60 rounded-2xl p-4">
                <div className="text-sm text-purple-200">Rewards</div>
                <div className="text-lg text-green-300">+{sessionRewards.xpEarned} XP</div>
                <div className="text-lg text-yellow-200">+{sessionRewards.coinsEarned} Coins</div>
                <div className="text-sm text-purple-300">+{sessionRewards.rewardPoints} Reward Points</div>
              </div>
              <div className="bg-purple-900/60 rounded-2xl p-4">
                <div className="text-sm text-purple-200">Streak</div>
                <div className="text-3xl font-bold text-blue-300">x{maxCombo}</div>
                <div className="text-sm text-purple-300">{sessionRewards.perfectRun ? 'Perfect run bonus!' : 'Aim for 95%+'}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="bg-yellow-400 text-purple-900 px-6 py-3 rounded-full font-semibold"
                onClick={() => {
                  audioManager.playSfx('select');
                  startSong(selectedSong);
                }}
              >
                Play Again
              </button>
              <button
                className="bg-purple-700/70 text-purple-100 px-6 py-3 rounded-full"
                onClick={() => {
                  audioManager.playSfx('click');
                  setScreen('select');
                }}
              >
                Choose Another Song
              </button>
            </div>
          </div>
        )}

        {playerProfile && (
          <div className="mt-8">
            <a href="../index.html" className="hub-return-link text-purple-200 hover:text-white">
              🏠 Return to Noyola Hub
            </a>
          </div>
        )}
      </div>

      {showHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-purple-950 border border-purple-700/50 rounded-2xl p-6 max-w-lg text-purple-100 space-y-4">
            <h3 className="text-2xl font-title text-white">How to Play</h3>
            <ul className="space-y-2 text-sm text-purple-200">
              <li>• Choose a song and watch the glowing keys.</li>
              <li>• Guided mode plays the song while you follow along.</li>
              <li>• Practice mode waits for your notes to move on.</li>
              <li>• Use keyboard keys A S D F G H J for white keys.</li>
              <li>• Aim for 75%+ accuracy to unlock new songs.</li>
            </ul>
            <button
              className="bg-yellow-400 text-purple-900 px-5 py-2 rounded-full font-semibold"
              onClick={() => {
                audioManager.playSfx('click');
                setShowHelp(false);
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
