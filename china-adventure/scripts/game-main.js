// ==================== MAIN GAME COMPONENT ====================
// Dragon Scrolls of China - educational RPG adapted from Canada Adventure.
// Supports two difficulty modes (Scout/Sage) tuned for 3rd- and 5th-grade players.

function ChinaAdventure() {
  const [mode, setMode] = useState('liam');      // 'liam' (Scout) | 'emma' (Sage)
  const modeCfg = MODES[mode];

  const [screen, setScreen] = useState('title'); // title | game | shop | gameover
  const [playerProfile, setPlayerProfile] = useState(null);
  const [playerName, setPlayerName] = useState('Liam');
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(50);
  const [hp, setHp] = useState(modeCfg.maxHp);
  const [maxHp, setMaxHp] = useState(modeCfg.maxHp);
  const [mp, setMp] = useState(modeCfg.maxMp);
  const [maxMp, setMaxMp] = useState(modeCfg.maxMp);
  const [unlockedRegions, setUnlockedRegions] = useState([0]);
  const [totalDefeated, setTotalDefeated] = useState(0);
  const [currentRegion, setCurrentRegion] = useState(0);
  const [collectedScrolls, setCollectedScrolls] = useState([]); // region ids whose boss has been defeated

  const [monster, setMonster] = useState(null);
  const [monsterHp, setMonsterHp] = useState(0);
  const [phase, setPhase] = useState('map');
  const [combo, setCombo] = useState(0);
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [message, setMessage] = useState('');
  const [isDefending, setIsDefending] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const [heroHit, setHeroHit] = useState(false);
  const [monsterHit, setMonsterHit] = useState(false);
  const [heroAttacking, setHeroAttacking] = useState(false);

  const [inventory, setInventory] = useState({ potion: 3, bomb: 1 });
  const [flash, setFlash] = useState(null);
  const [shake, setShake] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [bursts, setBursts] = useState([]);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [sessionRecorded, setSessionRecorded] = useState(false);

  // Holds a saved game (if any) loaded from LuminaCore on mount. The title
  // screen checks this to decide between a single "Begin Quest" button and the
  // Continue / New Game pair. Cleared when the player chooses New Game, after
  // a successful Continue, or after a Game Over.
  const [pendingSave, setPendingSave] = useState(null);

  // Stats tracking for Lumina integration
  const [questionsCorrect, setQuestionsCorrect] = useState(0);
  const [questionsTotal, setQuestionsTotal] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const sessionStartRef = useRef(Date.now());
  const audioRef = useRef(null);
  const floatingIdRef = useRef(0);
  const burstIdRef = useRef(0);

  const xpNeeded = level * 100;
  const xpPercent = Math.min(100, Math.floor((xp / xpNeeded) * 100));
  const activeRegion = regions[currentRegion];
  const explorerRank = Math.min(10, 1 + Math.floor(totalDefeated / 3));

  // ==================== SAVE / RESUME ====================
  // saveProgress() snapshots the currently-resumable state (no mid-battle
  // transient fields) into LuminaCore, which persists locally (synchronous
  // localStorage) and fires a non-blocking cloud sync. It's guarded so it
  // NEVER fires during an active battle — standard JRPG "save at the map"
  // convention, keeps us clear of animation/phase/timer corruption.
  const saveProgress = () => {
    if (typeof LUMINA_ENABLED === 'undefined' || !LUMINA_ENABLED) return;
    if (!playerProfile) return;
    if (screen !== 'game' || phase !== 'map') return;
    LuminaCore.setGameSave(playerProfile.id, 'chinaAdventure', {
      mode,
      playerName,
      level,
      xp,
      coins,
      hp,
      maxHp,
      mp,
      maxMp,
      unlockedRegions,
      currentRegion,
      collectedScrolls,
      totalDefeated,
      inventory,
    });
  };

  // Ref mirror of saveProgress so long-lived listeners (visibilitychange)
  // always call the latest closure without re-subscribing on every state
  // change.
  const saveProgressRef = useRef(saveProgress);
  useEffect(() => {
    saveProgressRef.current = saveProgress;
  });

  const initAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new AudioManager();
      audioRef.current.preloadMusic();
    }
  };

  const playCurrentMusic = () => {
    if (!audioRef.current || !musicEnabled) return;

    if (screen === 'title')    return audioRef.current.playMusic('menu');
    if (screen === 'gameover') return audioRef.current.playMusic('gameover');
    if (screen === 'shop')     return audioRef.current.playMusic('map');
    if (screen === 'game' && phase === 'map') return audioRef.current.playMusic('map');
    if (screen === 'game' && monster)         return audioRef.current.playMusic('battle');
  };

  const playSfx = (name) => {
    if (audioRef.current) audioRef.current.playSfx(name);
  };

  const triggerFlash = (color = '#ffffff') => {
    setFlash(color);
    setTimeout(() => setFlash(null), 250);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 350);
  };

  const pushFloatingText = (text, color = '#FBBF24') => {
    const id = floatingIdRef.current++;
    setFloatingTexts(prev => [...prev, { id, text, color }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(item => item.id !== id));
    }, 900);
  };

  const pushBurst = (x, y) => {
    const id = burstIdRef.current++;
    setBursts(prev => [...prev, { id, x, y }]);
    setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 700);
  };

  // Initialize from LuminaCore on mount. Also looks for a previously-saved
  // game for this profile so the title screen can offer Continue / New Game
  // instead of the single Begin Quest button.
  useEffect(() => {
    if (typeof LUMINA_ENABLED !== 'undefined' && LUMINA_ENABLED) {
      const player = LuminaCore.getActiveProfile();
      if (player) {
        setPlayerName(player.name);
        setPlayerProfile(player);
        LuminaCore.recordGameStart(player.id, 'chinaAdventure');
        const saved = LuminaCore.getGameSave
          ? LuminaCore.getGameSave(player.id, 'chinaAdventure')
          : null;
        if (saved) setPendingSave(saved);
        console.log(`[China Adventure] Loaded player: ${player.name}${saved ? ' (save found)' : ''}`);
      }
    }
  }, []);

  useEffect(() => {
    if (!hasInteracted) return;
    playCurrentMusic();
    // Use !!monster (a stable boolean) — not the monster object — so this
    // effect only re-fires when a battle actually starts or ends, never when
    // the monster's HP updates during an attack. playMusic() also now skips
    // the rewind if the same track is already playing (belt-and-suspenders).
  }, [screen, phase, !!monster, musicEnabled, hasInteracted]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (hasInteracted) return;
      initAudio();
      setHasInteracted(true);
      playCurrentMusic();
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    return () => window.removeEventListener('pointerdown', handleFirstInteraction);
  }, [hasInteracted]);

  useEffect(() => {
    if (screen === 'gameover' && playerProfile && !sessionRecorded) {
      const playTimeSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      LuminaCore.recordGameEnd(playerProfile.id, 'chinaAdventure', {
        score: totalDefeated * 100,
        gamesWon: 0,
        playTimeMinutes: Math.max(1, Math.floor(playTimeSeconds / 60)),
        questionsCorrect,
        questionsTotal,
        regionsUnlocked: unlockedRegions.length,
        enemiesDefeated: totalDefeated,
        maxCombo,
      });
      // Defeat is terminal — don't leave a stale save around that would let
      // the player Continue back into HP=0 after returning to the hub.
      if (LuminaCore.clearGameSave) {
        LuminaCore.clearGameSave(playerProfile.id, 'chinaAdventure');
      }
      setPendingSave(null);
      setSessionRecorded(true);
    }
  }, [screen, playerProfile, sessionRecorded, totalDefeated, questionsCorrect, questionsTotal, unlockedRegions.length, maxCombo]);

  useEffect(() => {
    if (combo > maxCombo) setMaxCombo(combo);
  }, [combo, maxCombo]);

  // Auto-save on progression-relevant state changes. Re-runs whenever a
  // durable stat changes; saveProgress() itself is gated to only fire when
  // the player is sitting on the map (not mid-battle, not mid-question).
  // This naturally captures: post-victory (phase → map), shop purchases,
  // level-ups, region unlocks, scroll collection, and mode changes.
  useEffect(() => {
    if (screen !== 'game' || phase !== 'map' || !playerProfile) return;
    saveProgress();
    // saveProgress is intentionally NOT in the dependency list — it's a fresh
    // function every render that closes over current state; listing the
    // explicit state dependencies here is what gates save frequency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    screen, phase, playerProfile,
    mode, playerName,
    level, xp, coins,
    hp, maxHp, mp, maxMp,
    unlockedRegions, currentRegion, collectedScrolls,
    totalDefeated, inventory,
  ]);

  // Defensive catch-all: when the tab/PWA backgrounds (iOS terminates
  // backgrounded PWAs aggressively), flush the current state to storage.
  // Uses a ref so we don't re-subscribe the listener on every state change.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) saveProgressRef.current?.();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Centralized "exit to Noyola Hub" helper. We route EVERY exit from the game
  // through here so an accidental tap, swipe-back, or ghost-click during a
  // battle can never yank the player out mid-fight without asking first.
  const exitToHub = () => {
    const inActiveBattle = screen === 'game' && monster && phase !== 'map';
    if (inActiveBattle) {
      const ok = window.confirm(
        'Leave the battle and return to the Noyola Hub? Your current fight will be lost.'
      );
      if (!ok) return;
    }
    window.location.href = '../index.html';
  };

  // Guard against iOS/Safari "swipe from left edge = browser back" during an
  // active battle. Without this, a stray thumb on the iPad bezel silently sends
  // the player back to the hub with no prompt. We push a sentinel history entry
  // when a battle starts and intercept popstate to confirm before leaving.
  useEffect(() => {
    const inActiveBattle = screen === 'game' && !!monster && phase !== 'map';
    if (!inActiveBattle) return;

    window.history.pushState({ chinaBattleGuard: true }, '', window.location.href);

    const onPopState = () => {
      const ok = window.confirm(
        'Leave the battle and return to the Noyola Hub? Your current fight will be lost.'
      );
      if (ok) {
        window.location.href = '../index.html';
      } else {
        window.history.pushState({ chinaBattleGuard: true }, '', window.location.href);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [screen, !!monster, phase]);

  const gainXP = (amt) => {
    let newXP = xp + amt;
    if (newXP >= xpNeeded) {
      newXP -= xpNeeded;
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setMaxHp(h => h + 2);
      setHp(h => Math.min(h + 3, maxHp + 2));
      setMaxMp(m => m + 1);
      setMp(m => m + 1);
      const nextRegion = regions.findIndex(r => r.unlockLevel === nextLevel);
      if (nextRegion !== -1 && !unlockedRegions.includes(nextRegion)) {
        setUnlockedRegions(prev => [...prev, nextRegion]);
        pushFloatingText(`🗺️ New region: ${regions[nextRegion].name}!`, '#FBBF24');
      }
      triggerFlash('#fde68a');
      pushFloatingText(`Level ${nextLevel}!`, '#fef3c7');
      setMessage(`⬆️ LEVEL UP! Now Level ${nextLevel}!`);
      playSfx('levelup');
    }
    setXp(newXP);
  };

  const startBattle = (regionIdx) => {
    initAudio();
    setCurrentRegion(regionIdx);
    const region = regions[regionIdx];
    const pool = monsters[region.id];
    const isBoss = totalDefeated > 0 && totalDefeated % modeCfg.bossEveryNBattles === (modeCfg.bossEveryNBattles - 1);
    const mon = isBoss ? pool.find(m => m.isBoss) : pool.find(m => !m.isBoss);

    setMonster({ ...mon, maxHp: mon.hp });
    setMonsterHp(mon.hp);
    setCombo(0);
    setIsDefending(false);
    setPhase('intro');
    triggerFlash(isBoss ? '#FBBF24' : '#93c5fd');
    setMessage(`A wild ${mon.name} appears!${isBoss ? ' 👑 (BOSS)' : ''}`);

    setTimeout(() => {
      setPhase('player');
      setMessage('Your turn! Choose an action.');
    }, 1500);
  };

  const pickQuestion = (regionId) => {
    const regionPool = allQuestions.filter(q => q.region === regionId && modeCfg.questionFilter(q));
    const pool = regionPool.length > 0 ? regionPool : allQuestions.filter(modeCfg.questionFilter);
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const pickAction = (action) => {
    initAudio();
    setSelectedAction(action);

    if (action === 'attack' || action === 'special') {
      if (action === 'special') setMp(m => m - 2);
      const q = pickQuestion(activeRegion.id);
      setQuestion(q);
      setOptions(shuffle([q.a, ...q.wrong]));
      setPhase('question');
      setMessage('Answer correctly to attack!');
    } else if (action === 'defend') {
      setIsDefending(true);
      setMessage('You raise your shield! 🛡️');
      setTimeout(() => enemyTurn(), 1000);
    } else if (action === 'item') {
      setPhase('item');
      setMessage('Choose an item:');
    }
  };

  const answer = (ans) => {
    const correct = ans === question.a;
    setQuestionsTotal(total => total + 1);

    if (correct) {
      setQuestionsCorrect(total => total + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      const baseDmg = (selectedAction === 'special' ? 3 : 1) + modeCfg.heroAttackBonus;
      const dmg = baseDmg + (newCombo > 2 ? Math.floor(newCombo / 2) : 0);

      setPhase('attack');
      setHeroAttacking(true);
      triggerFlash('#bbf7d0');
      triggerShake();
      pushFloatingText(`-${dmg} HP`, '#34d399');
      pushBurst(160 + Math.random() * 120, 40 + Math.random() * 60);
      playSfx('correct');
      setMessage(`✅ CORRECT! ${newCombo > 2 ? `🔥 ${newCombo}x COMBO! ` : ''}${dmg} damage!`);

      // Golden Rule secret achievement
      if (question.a === 'Golden Rule' && playerProfile) {
        LuminaCore.awardAchievement(playerProfile.id, 'cn_golden_rule');
      }

      setTimeout(() => {
        setHeroAttacking(false);
        setMonsterHit(true);
        const newHP = Math.max(0, monsterHp - dmg);
        setMonsterHp(newHP);
        playSfx('attack_hit');
        setTimeout(() => {
          setMonsterHit(false);
          if (newHP <= 0) {
            victory();
          } else {
            enemyTurn();
          }
        }, 500);
      }, 400);
    } else {
      setCombo(0);
      triggerFlash('#fecaca');
      pushFloatingText('Miss!', '#f87171');
      playSfx('wrong');
      let hint = `Answer: ${question.a}`;
      if (modeCfg.showHint && question.a.length > 2) {
        const masked = `${question.a[0]}${'•'.repeat(question.a.length - 2)}${question.a[question.a.length - 1]}`;
        hint = `Hint: ${masked}  |  Answer: ${question.a}`;
      }
      setMessage(`❌ Not quite. ${hint}`);
      setTimeout(() => enemyTurn(), 1800);
    }
  };

  const enemyTurn = () => {
    setPhase('enemyTurn');
    let dmg = Math.max(1, Math.round(monster.attack * modeCfg.enemyDamageScale));
    if (isDefending) dmg = Math.max(1, Math.floor(dmg / 2));

    setMessage(`${monster.name} attacks!${isDefending ? ' Blocked!' : ''} -${dmg} HP`);

    setTimeout(() => {
      setHeroHit(true);
      triggerShake();
      triggerFlash('#fecaca');
      pushFloatingText(`-${dmg} HP`, '#f87171');
      const newHP = Math.max(0, hp - dmg);
      setHp(newHP);
      setIsDefending(false);

      setTimeout(() => {
        setHeroHit(false);
        if (newHP <= 0) {
          setPhase('defeat');
          setMessage('💀 Defeated...');
          setTimeout(() => setScreen('gameover'), 2000);
        } else {
          setPhase('player');
          setMessage('Your turn!');
        }
      }, 500);
    }, 600);
  };

  const victory = () => {
    setPhase('victory');
    const coinReward = Math.round((20 + currentRegion * 10 + (monster.isBoss ? 50 : 0)) * modeCfg.coinMultiplier);
    const xpReward   = Math.round((30 + currentRegion * 15 + (monster.isBoss ? 100 : 0)) * modeCfg.xpMultiplier);
    const luminaXp   = Math.max(12, Math.floor(xpReward * 0.4));
    const luminaCoins= Math.max(2, Math.floor(coinReward * 0.3));
    const luminaPoints = Math.max(1, Math.floor(luminaXp / 20));

    setCoins(c => c + coinReward);
    gainXP(xpReward);
    setTotalDefeated(t => t + 1);

    if (monster.isBoss && !collectedScrolls.includes(activeRegion.id)) {
      setCollectedScrolls(prev => [...prev, activeRegion.id]);
      pushFloatingText(`📜 ${activeRegion.dragonScroll}`, '#FBBF24');
    }

    triggerFlash('#fde68a');
    pushFloatingText(`+${coinReward}🪙`, '#fbbf24');
    pushFloatingText(`+${xpReward} XP`, '#a7f3d0');
    pushBurst(180, 80);
    playSfx('victory');
    if (audioRef.current && musicEnabled) {
      audioRef.current.playMusic('victory');
    }
    setMessage(`🎉 VICTORY! +${coinReward}🪙 +${xpReward}XP`);

    if (playerProfile) {
      LuminaCore.addXP(playerProfile.id, luminaXp, 'chinaAdventure');
      LuminaCore.addCoins(playerProfile.id, luminaCoins, 'chinaAdventure');
      LuminaCore.addRewardPoints(playerProfile.id, luminaPoints);
      LuminaCore.checkDailyChallengeProgress(playerProfile.id, 'chinaAdventure', {
        questionsCorrect,
        questionsTotal,
      });
      LuminaCore.checkCrossGameAchievements(playerProfile.id);
    }

    setTimeout(() => {
      setPhase('map');
      setMonster(null);
    }, 2500);
  };

  const useItem = (item) => {
    if (inventory[item] <= 0) return;
    initAudio();
    setInventory(prev => ({ ...prev, [item]: prev[item] - 1 }));

    if (item === 'potion') {
      const heal = 5;
      setHp(h => Math.min(h + heal, maxHp));
      triggerFlash('#bbf7d0');
      pushFloatingText(`+${heal} HP`, '#34d399');
      setMessage(`🧪 +${heal} HP!`);
    } else if (item === 'bomb') {
      const dmg = 3;
      const newHP = Math.max(0, monsterHp - dmg);
      setMonsterHp(newHP);
      setMonsterHit(true);
      triggerFlash('#fee2e2');
      pushFloatingText(`-${dmg} HP`, '#f87171');
      setMessage(`💣 BOOM! ${dmg} damage!`);
      setTimeout(() => setMonsterHit(false), 300);

      if (newHP <= 0) {
        setTimeout(() => victory(), 800);
        return;
      }
    }
    setTimeout(() => enemyTurn(), 1000);
  };

  const applyMode = (newMode) => {
    setMode(newMode);
    const cfg = MODES[newMode];
    setMaxHp(cfg.maxHp);
    setHp(cfg.maxHp);
    setMaxMp(cfg.maxMp);
    setMp(cfg.maxMp);
  };

  const restart = () => {
    const cfg = MODES[mode];
    setLevel(1); setXp(0); setCoins(50);
    setHp(cfg.maxHp); setMaxHp(cfg.maxHp); setMp(cfg.maxMp); setMaxMp(cfg.maxMp);
    setUnlockedRegions([0]); setTotalDefeated(0);
    setCollectedScrolls([]);
    setInventory({ potion: 3, bomb: 1 });
    setPhase('map'); setMonster(null);
    setScreen('title');
    setSessionRecorded(false);
    setPendingSave(null);
    sessionStartRef.current = Date.now();
    if (audioRef.current) audioRef.current.stopMusic();
  };

  // Load the pending save back into React state and drop the player on the
  // map. Music follows automatically via the existing screen/phase effect.
  const continueGame = () => {
    if (!pendingSave || !pendingSave.state) return;
    initAudio();
    setHasInteracted(true);
    const s = pendingSave.state;
    if (s.mode && MODES[s.mode]) setMode(s.mode);
    if (s.playerName) setPlayerName(s.playerName);
    setLevel(s.level ?? 1);
    setXp(s.xp ?? 0);
    setCoins(s.coins ?? 50);
    setMaxHp(s.maxHp ?? MODES[s.mode || mode].maxHp);
    setHp(Math.min(s.hp ?? s.maxHp ?? MODES[s.mode || mode].maxHp, s.maxHp ?? MODES[s.mode || mode].maxHp));
    setMaxMp(s.maxMp ?? MODES[s.mode || mode].maxMp);
    setMp(Math.min(s.mp ?? s.maxMp ?? MODES[s.mode || mode].maxMp, s.maxMp ?? MODES[s.mode || mode].maxMp));
    setUnlockedRegions(Array.isArray(s.unlockedRegions) && s.unlockedRegions.length > 0 ? s.unlockedRegions : [0]);
    setCurrentRegion(typeof s.currentRegion === 'number' ? s.currentRegion : 0);
    setCollectedScrolls(Array.isArray(s.collectedScrolls) ? s.collectedScrolls : []);
    setTotalDefeated(s.totalDefeated ?? 0);
    setInventory(s.inventory && typeof s.inventory === 'object' ? s.inventory : { potion: 3, bomb: 1 });
    setPendingSave(null);
    setMonster(null);
    setPhase('map');
    setScreen('game');
    setSessionRecorded(false);
    sessionStartRef.current = Date.now();
  };

  // Confirm + wipe the existing save, then fall through to the normal fresh
  // quest flow. Respects whatever name/difficulty the player just picked on
  // the title screen.
  const newGame = () => {
    if (pendingSave) {
      const ok = window.confirm('Start a new adventure? Your saved progress will be lost.');
      if (!ok) return;
      if (playerProfile && typeof LUMINA_ENABLED !== 'undefined' && LUMINA_ENABLED && LuminaCore.clearGameSave) {
        LuminaCore.clearGameSave(playerProfile.id, 'chinaAdventure');
      }
      setPendingSave(null);
    }
    initAudio();
    setHasInteracted(true);
    setPhase('map');
    setScreen('game');
  };

  // TITLE SCREEN
  if (screen === 'title') {
    return (
      <div className={`min-h-[100dvh] cn-title-gradient flex items-center justify-center p-4 ${shake ? 'screen-shake' : ''}`}>
        <div className={`flash-overlay ${flash ? 'active' : ''}`} style={{ backgroundColor: flash || 'transparent' }} />
        <div className="bg-white/95 rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center border-8 border-red-700 glass-panel">
          <div className="flex justify-center mb-3">
            <PixelSprite type="hero" scale={5} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-3xl">🐉</span>
            <h1 className="text-3xl font-black text-red-700 tracking-wide">DRAGON SCROLLS</h1>
          </div>
          <h2 className="text-xl font-bold text-amber-600 mb-3">of CHINA</h2>
          <p className="text-xs text-gray-500 mb-3 italic">Battle through 7 regions and collect the scrolls of the Middle Kingdom.</p>

          <div className="mb-3 p-3 bg-gray-100 rounded-xl text-left">
            <p className="text-xs text-gray-500 mb-2 font-bold">Your Name:</p>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value || 'Hero')}
              className="w-full p-3 text-center text-xl font-bold border-4 border-gray-300 rounded-xl"
              maxLength={10}
            />
          </div>

          <div className="mb-3">
            <p className="text-xs text-gray-500 font-bold mb-2">Difficulty:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(MODES).map(m => (
                <button
                  key={m.id}
                  onClick={() => applyMode(m.id)}
                  className={`p-3 rounded-xl text-left border-4 transition-colors ${
                    mode === m.id
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-amber-400'
                  }`}
                >
                  <div className="font-black text-sm">{m.label}</div>
                  <div className="text-[11px] text-gray-500 leading-tight">{m.subtitle}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-3 text-sm font-bold text-gray-600">
            <span>Explorer Rank {explorerRank}</span>
            <button
              onClick={() => {
                initAudio();
                if (audioRef.current) {
                  const enabled = audioRef.current.toggleMusic();
                  setMusicEnabled(enabled);
                  if (enabled) {
                    setHasInteracted(true);
                    playCurrentMusic();
                  }
                }
              }}
              className="px-3 py-1 rounded-full bg-gray-200"
            >
              {musicEnabled ? '🔊 Music On' : '🔇 Music Off'}
            </button>
          </div>

          {pendingSave ? (
            <div className="space-y-2">
              <button
                onClick={continueGame}
                className="w-full py-4 bg-gradient-to-b from-red-600 to-red-800 text-white rounded-2xl text-xl font-black border-b-4 border-red-900 active:translate-y-1"
              >
                ▶️ CONTINUE
                <div className="text-[11px] font-semibold text-red-100 opacity-90">
                  Lv.{pendingSave.state.level ?? 1} · {regions[pendingSave.state.currentRegion ?? 0]?.name || 'Map'}
                </div>
              </button>
              <button
                onClick={newGame}
                className="w-full py-3 bg-gradient-to-b from-gray-200 to-gray-300 text-gray-800 rounded-xl text-base font-black border-b-4 border-gray-400 active:translate-y-1"
              >
                🐉 NEW QUEST
              </button>
            </div>
          ) : (
            <button
              onClick={newGame}
              className="w-full py-4 bg-gradient-to-b from-red-600 to-red-800 text-white rounded-2xl text-xl font-black border-b-4 border-red-900 active:translate-y-1"
            >
              🐉 BEGIN QUEST 🐉
            </button>
          )}
          <a href="../index.html" className="block mt-3 text-xs text-gray-500 hover:text-red-700">
            🏠 Return to Noyola Hub
          </a>
        </div>
      </div>
    );
  }

  // GAME OVER
  if (screen === 'gameover') {
    return (
      <div className={`min-h-[100dvh] bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4 ${shake ? 'screen-shake' : ''}`}>
        <div className={`flash-overlay ${flash ? 'active' : ''}`} style={{ backgroundColor: flash || 'transparent' }} />
        <div className="bg-gray-900 rounded-3xl p-6 max-w-sm w-full text-center border-4 border-red-700 glass-panel">
          <div className="text-6xl mb-4">🐉</div>
          <h1 className="text-3xl font-black text-red-500 mb-1">Quest Paused</h1>
          <p className="text-sm text-gray-400 mb-4">The dragons rest until you are ready again.</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-gray-800 p-3 rounded-xl">
              <div className="text-xl font-black text-yellow-400">{totalDefeated}</div>
              <div className="text-[10px] text-gray-400">Defeated</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-xl">
              <div className="text-xl font-black text-purple-400">Lv.{level}</div>
              <div className="text-[10px] text-gray-400">Level</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-xl">
              <div className="text-xl font-black text-amber-400">{collectedScrolls.length}/7</div>
              <div className="text-[10px] text-gray-400">Scrolls</div>
            </div>
          </div>
          <button onClick={restart} className="w-full py-4 bg-red-600 text-white rounded-xl text-xl font-black">
            🔄 TRY AGAIN
          </button>
          <a href="../index.html" className="block mt-4 text-sm text-gray-300 hover:text-white">
            🏠 Return to Noyola Hub
          </a>
        </div>
      </div>
    );
  }

  // MAP SCREEN
  if (screen === 'game' && phase === 'map') {
    return (
      <div
        className={`min-h-[100dvh] max-h-[100dvh] overflow-hidden p-3 flex flex-col relative ${shake ? 'screen-shake' : ''}`}
        style={{
          backgroundImage: activeRegion?.bgImage ? `url(${activeRegion.bgImage})` : undefined,
          backgroundColor: '#7F1D1D',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className={`flash-overlay ${flash ? 'active' : ''}`} style={{ backgroundColor: flash || 'transparent' }} />

        <div className="relative z-10 flex flex-col flex-1 min-h-0 w-full max-w-5xl mx-auto">
          <div className="cn-panel rounded-xl p-3 mb-3 glass-panel">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center text-white font-black border-2 border-yellow-400">
                  {level}
                </div>
                <div>
                  <div className="text-white font-bold">{playerName}</div>
                  <div className="text-xs text-yellow-200">Explorer Rank {explorerRank} · {modeCfg.label}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-black">🪙 {coins}</span>
                <button
                  onClick={() => {
                    initAudio();
                    if (audioRef.current) {
                      const enabled = audioRef.current.toggleMusic();
                      setMusicEnabled(enabled);
                      if (enabled) {
                        setHasInteracted(true);
                        playCurrentMusic();
                      }
                    }
                  }}
                  className="px-3 py-1 rounded-full bg-gray-700 text-xs font-bold text-white"
                >
                  {musicEnabled ? '🔊' : '🔇'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <HPBar current={hp} max={maxHp} color="red" />
              <HPBar current={mp} max={maxMp} color="blue" />
            </div>
            <div className="flex justify-between text-xs text-gray-200 mb-1">
              <span>{xp}/{xpNeeded} XP</span>
              <span>{unlockedRegions.length}/7 Regions · 📜 {collectedScrolls.length}/7</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-2xl p-2 mb-3 border-4 border-amber-700 glass-panel">
            <ChinaMap
              unlockedRegions={unlockedRegions}
              onSelectRegion={startBattle}
              currentRegion={currentRegion}
              className="max-h-[360px] md:max-h-[420px]"
            />
          </div>

          <div className="text-center text-white font-bold mb-3">
            ⚔️ Tap a region to battle! ({totalDefeated} defeated)
          </div>

          <div className="grid grid-cols-2 gap-2 max-w-3xl w-full mx-auto">
            <button
              onClick={() => { initAudio(); setScreen('shop'); }}
              className="py-3 bg-gradient-to-b from-amber-400 to-amber-600 text-white rounded-xl text-lg font-black border-b-4 border-amber-800"
            >
              🪙 SHOP
            </button>
            <a
              href="../index.html"
              className="py-3 bg-gray-800/80 text-white rounded-xl text-lg font-black border-b-4 border-gray-900 text-center"
            >
              🏠 HUB
            </a>
          </div>
        </div>
      </div>
    );
  }

  // SHOP SCREEN
  if (screen === 'shop') {
    return (
      <div className={`min-h-[100dvh] max-h-[100dvh] bg-gradient-to-b from-red-700 to-amber-600 p-4 flex flex-col ${shake ? 'screen-shake' : ''}`}>
        <div className={`flash-overlay ${flash ? 'active' : ''}`} style={{ backgroundColor: flash || 'transparent' }} />
        <div className="max-w-sm mx-auto w-full flex flex-col flex-1 min-h-0">
          <div className="flex justify-between mb-4">
            <button onClick={() => { setScreen('game'); setPhase('map'); }} className="bg-white px-4 py-2 rounded-full font-bold">← Back</button>
            <div className="bg-white px-4 py-2 rounded-full font-bold">🪙 {coins}</div>
          </div>

          <h1 className="text-3xl font-black text-white text-center mb-4">🏮 MERCHANT'S STALL</h1>

          <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0">
            {[
              { id: 'potion', name: 'Dragon Elixir', desc: '+5 HP', cost: 20, icon: '🧪' },
              { id: 'bomb',   name: 'Firecracker',   desc: '3 damage', cost: 35, icon: '🧨' },
            ].map(item => (
              <div key={item.id} className="bg-white rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <div className="font-bold">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.desc} | Have: {inventory[item.id]}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    initAudio();
                    if (coins >= item.cost) {
                      setCoins(c => c - item.cost);
                      setInventory(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
                      triggerFlash('#bbf7d0');
                      playSfx('coin');
                    }
                  }}
                  disabled={coins < item.cost}
                  className={`px-4 py-2 rounded-lg font-bold ${coins >= item.cost ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
                >
                  {item.cost}🪙
                </button>
              </div>
            ))}

            <div className="bg-white rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">❤️‍🩹</span>
                <div>
                  <div className="font-bold">Full Heal</div>
                  <div className="text-sm text-gray-500">All HP & MP</div>
                </div>
              </div>
              <button
                onClick={() => {
                  initAudio();
                  if (coins >= 50) {
                    setCoins(c => c - 50);
                    setHp(maxHp);
                    setMp(maxMp);
                    triggerFlash('#bbf7d0');
                    playSfx('coin');
                  }
                }}
                disabled={coins < 50 || (hp >= maxHp && mp >= maxMp)}
                className={`px-4 py-2 rounded-lg font-bold ${coins >= 50 && (hp < maxHp || mp < maxMp) ? 'bg-red-500 text-white' : 'bg-gray-300'}`}
              >
                50🪙
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // BATTLE SCREEN
  if (screen === 'game' && monster) {
    const region = regions[currentRegion];

    return (
      <div
        className={`min-h-[100dvh] max-h-[100dvh] overflow-hidden p-3 relative ${shake ? 'screen-shake' : ''}`}
        style={{
          backgroundImage: region.bgImage ? `url(${region.bgImage})` : undefined,
          backgroundColor: '#7F1D1D',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className={`flash-overlay ${flash ? 'active' : ''}`} style={{ backgroundColor: flash || 'transparent' }} />

        <div className="relative z-10 flex flex-col min-h-[100dvh] w-full max-w-5xl mx-auto">
          {/*
            Pause/exit menu icon — isolated in the top-right corner of the
            viewport, far from any action buttons the player is tapping during
            combat. Previously the exit was a bare link directly under the
            Attack row; iOS fat-finger / ghost-click taps were hitting it and
            bouncing players back to the hub mid-fight. exitToHub() now gates
            every exit behind a confirm dialog while a battle is active.
          */}
          <button
            type="button"
            onClick={exitToHub}
            aria-label="Pause menu / return to Noyola Hub"
            className="absolute top-2 right-2 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 text-white text-base border border-white/30 active:scale-95"
          >
            ⏸︎
          </button>

          <div className="cn-panel rounded-xl p-2 mb-2 glass-panel">
            <div className="flex justify-between text-white text-sm mb-1 pr-10">
              <span className="font-bold">{playerName}</span>
              <span>Lv.{level} · {region.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <HPBar current={hp} max={maxHp} color="red" />
              <HPBar current={mp} max={maxMp} color="blue" />
            </div>
          </div>

          {combo > 1 && (
            <div className="text-center mb-2">
              <span className="bg-orange-500 text-white px-3 py-1 rounded-full font-black animate-pulse">
                🔥 {combo}x COMBO
              </span>
            </div>
          )}

          <div className={`relative bg-black/50 rounded-2xl p-4 mb-3 glass-panel ${monster.isBoss && phase === 'intro' ? 'cn-boss-intro' : ''}`} style={{ minHeight: 200 }}>
            {floatingTexts.map((item, index) => (
              <div
                key={item.id}
                className="cn-float-text text-lg"
                style={{ top: 10 + index * 20, color: item.color }}
              >
                {item.text}
              </div>
            ))}

            <ParticleBurst bursts={bursts} />

            <div className="flex justify-end mb-6">
              <div className="text-center">
                <div className="mb-2">
                  <HPBar current={monsterHp} max={monster.maxHp} label={monster.name + (monster.isBoss ? ' 👑' : '')} />
                </div>
                <PixelSprite type={monster.sprite} scale={4} isHit={monsterHit} flip />
              </div>
            </div>

            <div className="flex justify-start">
              <div className="relative">
                <PixelSprite type="hero" scale={4} isHit={heroHit} isAttacking={heroAttacking} />
                {isDefending && <div className="absolute -top-2 -right-2 text-2xl">🛡️</div>}
              </div>
            </div>
          </div>

          <div className="cn-panel rounded-xl p-3 mb-3 glass-panel">
            <p className="text-white font-bold text-center">{message}</p>
          </div>

          {phase === 'player' && (
            <div className="grid grid-cols-4 gap-2 max-w-3xl w-full mx-auto">
              <button onClick={() => pickAction('attack')} className="bg-red-600 p-3 rounded-xl text-white font-bold">
                <div className="text-xl">⚔️</div><div className="text-xs">Attack</div>
              </button>
              <button onClick={() => pickAction('special')} disabled={mp < 2} className={`p-3 rounded-xl text-white font-bold ${mp >= 2 ? 'bg-yellow-500' : 'bg-gray-500'}`}>
                <div className="text-xl">✨</div><div className="text-xs">Dragon</div>
              </button>
              <button onClick={() => pickAction('defend')} className="bg-blue-600 p-3 rounded-xl text-white font-bold">
                <div className="text-xl">🛡️</div><div className="text-xs">Defend</div>
              </button>
              <button onClick={() => pickAction('item')} className="bg-green-600 p-3 rounded-xl text-white font-bold">
                <div className="text-xl">🎒</div><div className="text-xs">Item</div>
              </button>
            </div>
          )}

          {phase === 'question' && question && (
            <div className="max-w-3xl w-full mx-auto">
              <div className="bg-white rounded-xl p-3 mb-3">
                <p className="font-bold text-gray-800">{question.q}</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {options.map((opt, i) => (
                  <button key={i} onClick={() => answer(opt)} className="w-full p-3 bg-white rounded-xl text-left font-bold flex items-center active:bg-green-100">
                    <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center mr-3 font-black">
                      {['A','B','C','D'][i]}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 'item' && (
            <div className="grid grid-cols-3 gap-2 max-w-3xl w-full mx-auto">
              <button onClick={() => useItem('potion')} disabled={inventory.potion <= 0} className={`p-3 rounded-xl text-center ${inventory.potion > 0 ? 'bg-green-500' : 'bg-gray-500'}`}>
                <div className="text-xl">🧪</div>
                <div className="text-white text-xs font-bold">x{inventory.potion}</div>
              </button>
              <button onClick={() => useItem('bomb')} disabled={inventory.bomb <= 0} className={`p-3 rounded-xl text-center ${inventory.bomb > 0 ? 'bg-red-500' : 'bg-gray-500'}`}>
                <div className="text-xl">🧨</div>
                <div className="text-white text-xs font-bold">x{inventory.bomb}</div>
              </button>
              <button onClick={() => { setPhase('player'); setMessage('Your turn!'); }} className="p-3 rounded-xl text-center bg-gray-600">
                <div className="text-xl">↩️</div>
                <div className="text-white text-xs font-bold">Back</div>
              </button>
            </div>
          )}

          {/*
            No exit link at the bottom of the battle screen anymore. All
            exits go through the top-right ⏸︎ pause icon (exitToHub), which
            confirms before leaving. This prevents any fat-finger / ghost-click
            from the action row leaking into a hub navigation.
          */}
        </div>
      </div>
    );
  }

  return null;
}
