// ==================== MAIN GAME COMPONENT ====================

    function CanadaAdventure() {
      const [screen, setScreen] = useState('title');
      const [playerProfile, setPlayerProfile] = useState(null);
      const [playerName, setPlayerName] = useState('Liam');
      const [level, setLevel] = useState(1);
      const [xp, setXp] = useState(0);
      const [coins, setCoins] = useState(50);
      const [hp, setHp] = useState(10);
      const [maxHp, setMaxHp] = useState(10);
      const [mp, setMp] = useState(5);
      const [maxMp, setMaxMp] = useState(5);
      const [unlockedRegions, setUnlockedRegions] = useState([0]);
      const [totalDefeated, setTotalDefeated] = useState(0);
      const [currentRegion, setCurrentRegion] = useState(0);
      
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
      const [musicEnabled, setMusicEnabled] = useState(true);
      const [hasInteracted, setHasInteracted] = useState(false);
      const [sessionRecorded, setSessionRecorded] = useState(false);
      
      // Stats tracking for Lumina integration
      const [questionsCorrect, setQuestionsCorrect] = useState(0);
      const [questionsTotal, setQuestionsTotal] = useState(0);
      const [maxCombo, setMaxCombo] = useState(0);
      const sessionStartRef = useRef(Date.now());
      const audioRef = useRef(null);
      const floatingIdRef = useRef(0);
      
      const xpNeeded = level * 100;
      const xpPercent = Math.min(100, Math.floor((xp / xpNeeded) * 100));
      const activeRegion = regions[currentRegion];
      const explorerRank = Math.min(10, 1 + Math.floor(totalDefeated / 3));
      
      const initAudio = () => {
        if (!audioRef.current) {
          audioRef.current = new AudioManager();
          audioRef.current.preloadMusic();
        }
      };

      const playCurrentMusic = () => {
        if (!audioRef.current || !musicEnabled) return;
        
        if (screen === 'title') {
          audioRef.current.playMusic('menu');
          return;
        }
        
        if (screen === 'gameover') {
          audioRef.current.playMusic('gameover');
          return;
        }
        
        if (screen === 'shop') {
          audioRef.current.playMusic('map');
          return;
        }
        
        if (screen === 'game' && phase === 'map') {
          audioRef.current.playMusic('map');
          return;
        }
        
        if (screen === 'game' && monster) {
          audioRef.current.playMusic('battle');
        }
      };

      const triggerFlash = (color = '#ffffff') => {
        setFlash(color);
        setTimeout(() => setFlash(null), 250);
      };

      const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 350);
      };

      const pushFloatingText = (text, color = '#fbbf24') => {
        const id = floatingIdRef.current++;
        setFloatingTexts(prev => [...prev, { id, text, color }]);
        setTimeout(() => {
          setFloatingTexts(prev => prev.filter(item => item.id !== id));
        }, 900);
      };

      // Initialize from LuminaCore on mount
      useEffect(() => {
        if (LUMINA_ENABLED) {
          const player = LuminaCore.getActiveProfile();
          if (player) {
            setPlayerName(player.name);
            setPlayerProfile(player);
            LuminaCore.recordGameStart(player.id, 'canadaAdventure');
            console.log(`[Canada Adventure] Loaded player: ${player.name}`);
          }
        }
      }, []);

      useEffect(() => {
        if (!hasInteracted) return;
        playCurrentMusic();
      }, [screen, phase, monster, musicEnabled, hasInteracted]);

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
          LuminaCore.recordGameEnd(playerProfile.id, 'canadaAdventure', {
            score: totalDefeated * 100,
            gamesWon: 0,
            playTimeMinutes: Math.max(1, Math.floor(playTimeSeconds / 60)),
            questionsCorrect,
            questionsTotal,
            regionsUnlocked: unlockedRegions.length,
            enemiesDefeated: totalDefeated,
            maxCombo
          });
          setSessionRecorded(true);
        }
      }, [screen, playerProfile, sessionRecorded, totalDefeated, questionsCorrect, questionsTotal, unlockedRegions.length, maxCombo]);

      useEffect(() => {
        if (combo > maxCombo) {
          setMaxCombo(combo);
        }
      }, [combo, maxCombo]);

      const gainXP = (amt) => {
        let newXP = xp + amt;
        if (newXP >= xpNeeded) {
          newXP -= xpNeeded;
          setLevel(l => l + 1);
          setMaxHp(h => h + 2);
          setHp(h => Math.min(h + 3, maxHp + 2));
          setMaxMp(m => m + 1);
          setMp(m => m + 1);
          const nextRegion = regions.findIndex(r => r.unlockLevel === level + 1);
          if (nextRegion !== -1 && !unlockedRegions.includes(nextRegion)) {
            setUnlockedRegions(prev => [...prev, nextRegion]);
          }
          triggerFlash('#fde68a');
          pushFloatingText(`Level ${level + 1}!`, '#fef3c7');
          setMessage(`⬆️ LEVEL UP! Now Level ${level + 1}!`);
        }
        setXp(newXP);
      };

      const startBattle = (regionIdx) => {
        initAudio();
        setCurrentRegion(regionIdx);
        const region = regions[regionIdx];
        const pool = monsters[region.id];
        const isBoss = totalDefeated > 0 && totalDefeated % 3 === 2;
        const mon = isBoss ? pool.find(m => m.isBoss) : pool.find(m => !m.isBoss);
        
        setMonster({ ...mon, maxHp: mon.hp });
        setMonsterHp(mon.hp);
        setCombo(0);
        setIsDefending(false);
        setPhase('intro');
        triggerFlash('#93c5fd');
        setMessage(`A wild ${mon.name} appears!`);
        
        setTimeout(() => {
          setPhase('player');
          setMessage('Your turn! Choose an action.');
        }, 1500);
      };

      const pickAction = (action) => {
        initAudio();
        setSelectedAction(action);
        
        if (action === 'attack' || action === 'special') {
          if (action === 'special') setMp(m => m - 2);
          const region = regions[currentRegion];
          const pool = allQuestions.filter(q => q.region === region.id);
          const qs = pool.length > 0 ? pool : allQuestions;
          const q = qs[Math.floor(Math.random() * qs.length)];
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
          const dmg = (selectedAction === 'special' ? 3 : 1) + (newCombo > 2 ? Math.floor(newCombo / 2) : 0);
          
          setPhase('attack');
          setHeroAttacking(true);
          triggerFlash('#bbf7d0');
          triggerShake();
          pushFloatingText(`-${dmg} HP`, '#34d399');
          setMessage(`✅ CORRECT! ${newCombo > 2 ? `🔥 ${newCombo}x COMBO! ` : ''}${dmg} damage!`);
          
          setTimeout(() => {
            setHeroAttacking(false);
            setMonsterHit(true);
            const newHP = Math.max(0, monsterHp - dmg);
            setMonsterHp(newHP);
            
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
          const hint = question.a.length > 2 ? `${question.a[0]}${'•'.repeat(question.a.length - 2)}${question.a[question.a.length - 1]}` : `${question.a[0]}•`;
          setMessage(`❌ Wrong! Answer: ${question.a} | Hint: ${hint}`);
          setTimeout(() => enemyTurn(), 1500);
        }
      };

      const enemyTurn = () => {
        setPhase('enemyTurn');
        let dmg = monster.attack;
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
        const coinReward = 20 + currentRegion * 10 + (monster.isBoss ? 50 : 0);
        const xpReward = 30 + currentRegion * 15 + (monster.isBoss ? 100 : 0);
        const luminaXp = Math.max(12, Math.floor(xpReward * 0.4));
        const luminaCoins = Math.max(2, Math.floor(coinReward * 0.3));
        const luminaPoints = Math.max(1, Math.floor(luminaXp / 20));
        setCoins(c => c + coinReward);
        gainXP(xpReward);
        setTotalDefeated(t => t + 1);
        triggerFlash('#fde68a');
        pushFloatingText(`+${coinReward}🪙`, '#fbbf24');
        pushFloatingText(`+${xpReward} XP`, '#a7f3d0');
        if (audioRef.current && musicEnabled) {
          audioRef.current.playMusic('victory');
        }
        setMessage(`🎉 VICTORY! +${coinReward}🪙 +${xpReward}XP`);
        
        if (playerProfile) {
          LuminaCore.addXP(playerProfile.id, luminaXp, 'canadaAdventure');
          LuminaCore.addCoins(playerProfile.id, luminaCoins, 'canadaAdventure');
          LuminaCore.addRewardPoints(playerProfile.id, luminaPoints);
          LuminaCore.checkDailyChallengeProgress(playerProfile.id, 'canadaAdventure', {
            questionsCorrect,
            questionsTotal
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

      const restart = () => {
        setLevel(1); setXp(0); setCoins(50);
        setHp(10); setMaxHp(10); setMp(5); setMaxMp(5);
        setUnlockedRegions([0]); setTotalDefeated(0);
        setInventory({ potion: 3, bomb: 1 });
        setPhase('map'); setMonster(null);
        setScreen('title');
        setSessionRecorded(false);
        sessionStartRef.current = Date.now();
        if (audioRef.current) {
          audioRef.current.stopMusic();
        }
      };

      // TITLE SCREEN
      if (screen === 'title') {
        return (
          <div className={`min-h-[100dvh] bg-gradient-to-b from-red-600 via-white to-red-600 flex items-center justify-center p-4 ${shake ? 'screen-shake' : ''}`}>
            <div className={`flash-overlay ${flash ? 'active' : ''}`} style={{ backgroundColor: flash || 'transparent' }} />
            <div className="bg-white/95 rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center border-8 border-red-700 glass-panel">
              <div className="flex justify-center mb-4">
                <PixelSprite type="hero" scale={5} />
              </div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h1 className="text-4xl font-black text-red-600">CANADA</h1>
                <span className="text-xs font-black uppercase tracking-widest bg-red-600 text-white px-2 py-1 rounded-full">Revamp 01-26</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-600 mb-4">ADVENTURE</h2>
              
              <div className="mb-4 p-3 bg-gray-100 rounded-xl">
                <p className="text-sm text-gray-500 mb-2">Your Name:</p>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value || 'Hero')}
                  className="w-full p-3 text-center text-xl font-bold border-4 border-gray-300 rounded-xl"
                  maxLength={10}
                />
              </div>
              
              <div className="flex items-center justify-between mb-4 text-sm font-bold text-gray-600">
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
              
              <button
                onClick={() => { initAudio(); setHasInteracted(true); setPhase('map'); setScreen('game'); }}
                className="w-full py-4 bg-gradient-to-b from-green-500 to-green-700 text-white rounded-2xl text-xl font-black border-b-4 border-green-900 active:translate-y-1"
              >
                🎯 START GAME 🎯
              </button>
            </div>
          </div>
        );
      }

      // GAME OVER
      if (screen === 'gameover') {
        return (
          <div className={`min-h-[100dvh] bg-gradient-to-b from-gray-800 to-black flex items-center justify-center p-4 ${shake ? 'screen-shake' : ''}`}>
            <div className={`flash-overlay ${flash ? 'active' : ''}`} style={{ backgroundColor: flash || 'transparent' }} />
            <div className="bg-gray-900 rounded-3xl p-6 max-w-sm w-full text-center border-4 border-gray-700 glass-panel">
              <div className="text-6xl mb-4">💀</div>
              <h1 className="text-3xl font-black text-red-500 mb-4">GAME OVER</h1>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-2xl font-black text-yellow-400">{totalDefeated}</div>
                  <div className="text-xs text-gray-400">Defeated</div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-2xl font-black text-purple-400">Lv.{level}</div>
                  <div className="text-xs text-gray-400">Level</div>
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
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-black/45" />
            <div className={`flash-overlay ${flash ? 'active' : ''}`} style={{ backgroundColor: flash || 'transparent' }} />
            
            <div className="relative z-10 flex flex-col flex-1 min-h-0 w-full max-w-5xl mx-auto">
              <div className="bg-gray-900/85 rounded-xl p-3 mb-3 glass-panel">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black border-2 border-yellow-400">
                      {level}
                    </div>
                    <div>
                      <div className="text-white font-bold">{playerName}</div>
                      <div className="text-xs text-yellow-200">Explorer Rank {explorerRank}</div>
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
                  <span>{unlockedRegions.length}/7 Regions</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${xpPercent}%` }} />
                </div>
              </div>
              
              <div className="bg-gray-900/50 rounded-2xl p-2 mb-3 border-4 border-amber-700 glass-panel">
                <CanadaMap 
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
          <div className={`min-h-[100dvh] max-h-[100dvh] bg-gradient-to-b from-amber-500 to-orange-600 p-4 flex flex-col ${shake ? 'screen-shake' : ''}`}>
            <div className={`flash-overlay ${flash ? 'active' : ''}`} style={{ backgroundColor: flash || 'transparent' }} />
            <div className="max-w-sm mx-auto w-full flex flex-col flex-1 min-h-0">
              <div className="flex justify-between mb-4">
                <button onClick={() => { setScreen('game'); setPhase('map'); }} className="bg-white px-4 py-2 rounded-full font-bold">← Back</button>
                <div className="bg-white px-4 py-2 rounded-full font-bold">🪙 {coins}</div>
              </div>
              
              <h1 className="text-3xl font-black text-white text-center mb-4">🪙 SHOP</h1>
              
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0">
                {[
                  { id: 'potion', name: 'Potion', desc: '+5 HP', cost: 20, icon: '🧪' },
                  { id: 'bomb', name: 'Bomb', desc: '3 damage', cost: 35, icon: '💣' },
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
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-black/45" />
            <div className={`flash-overlay ${flash ? 'active' : ''}`} style={{ backgroundColor: flash || 'transparent' }} />
            
            <div className="relative z-10 flex flex-col min-h-[100dvh] w-full max-w-5xl mx-auto">
              <div className="bg-gray-900/85 rounded-xl p-2 mb-2 glass-panel">
                <div className="flex justify-between text-white text-sm mb-1">
                  <span className="font-bold">{playerName}</span>
                  <span>Lv.{level} • {region.name}</span>
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
              
              <div className="relative bg-black/40 rounded-2xl p-4 mb-3 glass-panel" style={{ minHeight: 200 }}>
                {floatingTexts.map((item, index) => (
                  <div
                    key={item.id}
                    className="absolute left-1/2 -translate-x-1/2 text-lg font-black animate-bounce"
                    style={{ top: 10 + index * 18, color: item.color }}
                  >
                    {item.text}
                  </div>
                ))}
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
              
              <div className="bg-gray-900/90 rounded-xl p-3 mb-3 glass-panel">
                <p className="text-white font-bold text-center">{message}</p>
              </div>
              
              {phase === 'player' && (
                <div className="grid grid-cols-4 gap-2 max-w-3xl w-full mx-auto">
                  <button onClick={() => pickAction('attack')} className="bg-red-500 p-3 rounded-xl text-white font-bold">
                    <div className="text-xl">⚔️</div><div className="text-xs">Attack</div>
                  </button>
                  <button onClick={() => pickAction('special')} disabled={mp < 2} className={`p-3 rounded-xl text-white font-bold ${mp >= 2 ? 'bg-yellow-500' : 'bg-gray-500'}`}>
                    <div className="text-xl">✨</div><div className="text-xs">Special</div>
                  </button>
                  <button onClick={() => pickAction('defend')} className="bg-blue-500 p-3 rounded-xl text-white font-bold">
                    <div className="text-xl">🛡️</div><div className="text-xs">Defend</div>
                  </button>
                  <button onClick={() => pickAction('item')} className="bg-green-500 p-3 rounded-xl text-white font-bold">
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
                        <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center mr-3 font-black">
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
                    <div className="text-xl">💣</div>
                    <div className="text-white text-xs font-bold">x{inventory.bomb}</div>
                  </button>
                  <button onClick={() => { setPhase('player'); setMessage('Your turn!'); }} className="p-3 rounded-xl text-center bg-gray-600">
                    <div className="text-xl">↩️</div>
                    <div className="text-white text-xs font-bold">Back</div>
                  </button>
                </div>
              )}
              
              <a href="../index.html" className="mt-3 text-center text-sm text-white/90 hover:text-white">
                🏠 Return to Noyola Hub
              </a>
            </div>
          </div>
        );
      }

      return null;
    }

