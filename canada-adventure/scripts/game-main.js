// ==================== MAIN GAME COMPONENT ====================

    function CanadaAdventure() {
      const [screen, setScreen] = useState('title');
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
      
      // Stats tracking for Lumina integration
      const [questionsCorrect, setQuestionsCorrect] = useState(0);
      const [questionsTotal, setQuestionsTotal] = useState(0);
      const [maxCombo, setMaxCombo] = useState(0);
      const sessionStartRef = useRef(Date.now());
      
      const xpNeeded = level * 100;
      
      // Initialize from LuminaCore on mount
      useEffect(() => {
        if (LUMINA_ENABLED) {
          const player = LuminaCore.getCurrentPlayer();
          if (player) {
            setPlayerName(player.name);
            console.log(`[Canada Adventure] Loaded player: ${player.name}`);
          }
        }
      }, []);

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
          setMessage(`â¬†ï¸ LEVEL UP! Now Level ${level + 1}!`);
        }
        setXp(newXP);
      };

      const startBattle = (regionIdx) => {
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
        setMessage(`A wild ${mon.name} appears!`);
        
        setTimeout(() => {
          setPhase('player');
          setMessage('Your turn! Choose an action.');
        }, 1500);
      };

      const pickAction = (action) => {
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
          setMessage('You raise your shield! ðŸ›¡ï¸');
          setTimeout(() => enemyTurn(), 1000);
        } else if (action === 'item') {
          setPhase('item');
          setMessage('Choose an item:');
        }
      };

      const answer = (ans) => {
        const correct = ans === question.a;
        
        if (correct) {
          const newCombo = combo + 1;
          setCombo(newCombo);
          const dmg = (selectedAction === 'special' ? 3 : 1) + (newCombo > 2 ? Math.floor(newCombo / 2) : 0);
          
          setPhase('attack');
          setHeroAttacking(true);
          setMessage(`âœ… CORRECT! ${newCombo > 2 ? `ðŸ”¥ ${newCombo}x COMBO! ` : ''}${dmg} damage!`);
          
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
          setMessage(`âŒ Wrong! Answer: ${question.a}`);
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
          const newHP = Math.max(0, hp - dmg);
          setHp(newHP);
          setIsDefending(false);
          
          setTimeout(() => {
            setHeroHit(false);
            if (newHP <= 0) {
              setPhase('defeat');
              setMessage('ðŸ’€ Defeated...');
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
        setCoins(c => c + coinReward);
        gainXP(xpReward);
        setTotalDefeated(t => t + 1);
        setMessage(`ðŸŽ‰ VICTORY! +${coinReward}ðŸª™ +${xpReward}XP`);
        
        setTimeout(() => {
          setPhase('map');
          setMonster(null);
        }, 2500);
      };

      const useItem = (item) => {
        if (inventory[item] <= 0) return;
        setInventory(prev => ({ ...prev, [item]: prev[item] - 1 }));
        
        if (item === 'potion') {
          const heal = 5;
          setHp(h => Math.min(h + heal, maxHp));
          setMessage(`ðŸ§ª +${heal} HP!`);
        } else if (item === 'bomb') {
          const dmg = 3;
          const newHP = Math.max(0, monsterHp - dmg);
          setMonsterHp(newHP);
          setMonsterHit(true);
          setMessage(`ðŸ’£ BOOM! ${dmg} damage!`);
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
      };

      // TITLE SCREEN
      if (screen === 'title') {
        return (
          <div className="min-h-screen bg-gradient-to-b from-red-600 via-white to-red-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center border-8 border-red-700">
              <div className="flex justify-center mb-4">
                <PixelSprite type="hero" scale={5} />
              </div>
              <h1 className="text-4xl font-black text-red-600">CANADA</h1>
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
              
              <button
                onClick={() => { setPhase('map'); setScreen('game'); }}
                className="w-full py-4 bg-gradient-to-b from-green-500 to-green-700 text-white rounded-2xl text-xl font-black border-b-4 border-green-900 active:translate-y-1"
              >
                âš”ï¸ START GAME âš”ï¸
              </button>
            </div>
          </div>
        );
      }

      // GAME OVER
      if (screen === 'gameover') {
        return (
          <div className="min-h-screen bg-gradient-to-b from-gray-800 to-black flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-3xl p-6 max-w-sm w-full text-center border-4 border-gray-700">
              <div className="text-6xl mb-4">ðŸ’€</div>
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
                ðŸ”„ TRY AGAIN
              </button>
            </div>
          </div>
        );
      }

      // MAP SCREEN
      if (screen === 'game' && phase === 'map') {
        return (
          <div className="min-h-screen bg-gradient-to-b from-sky-400 to-blue-600 p-3">
            <div className="bg-gray-900/90 rounded-xl p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black border-2 border-yellow-400">
                    {level}
                  </div>
                  <span className="text-white font-bold">{playerName}</span>
                </div>
                <span className="text-yellow-400 font-black">ðŸª™ {coins}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <HPBar current={hp} max={maxHp} color="red" />
                <HPBar current={mp} max={maxMp} color="blue" />
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${(xp/xpNeeded)*100}%` }} />
              </div>
            </div>
            
            <div className="bg-gray-900/50 rounded-2xl p-2 mb-3 border-4 border-amber-700">
              <CanadaMap 
                unlockedRegions={unlockedRegions}
                onSelectRegion={startBattle}
                currentRegion={currentRegion}
              />
            </div>
            
            <div className="text-center text-white font-bold mb-3">
              âš”ï¸ Tap a region to battle! ({totalDefeated} defeated)
            </div>
            
            <button
              onClick={() => setScreen('shop')}
              className="w-full py-4 bg-gradient-to-b from-amber-400 to-amber-600 text-white rounded-xl text-lg font-black border-b-4 border-amber-800"
            >
              ðŸª™ SHOP
            </button>
          </div>
        );
      }

      // SHOP SCREEN
      if (screen === 'shop') {
        return (
          <div className="min-h-screen bg-gradient-to-b from-amber-500 to-orange-600 p-4">
            <div className="max-w-sm mx-auto">
              <div className="flex justify-between mb-4">
                <button onClick={() => setScreen('game')} className="bg-white px-4 py-2 rounded-full font-bold">â† Back</button>
                <div className="bg-white px-4 py-2 rounded-full font-bold">ðŸª™ {coins}</div>
              </div>
              
              <h1 className="text-3xl font-black text-white text-center mb-4">ðŸª™ SHOP</h1>
              
              <div className="space-y-3">
                {[
                  { id: 'potion', name: 'Potion', desc: '+5 HP', cost: 20, icon: 'ðŸ§ª' },
                  { id: 'bomb', name: 'Bomb', desc: '3 damage', cost: 35, icon: 'ðŸ’£' },
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
                        if (coins >= item.cost) {
                          setCoins(c => c - item.cost);
                          setInventory(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
                        }
                      }}
                      disabled={coins < item.cost}
                      className={`px-4 py-2 rounded-lg font-bold ${coins >= item.cost ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
                    >
                      {item.cost}ðŸª™
                    </button>
                  </div>
                ))}
                
                <div className="bg-white rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">â¤ï¸â€ðŸ©¹</span>
                    <div>
                      <div className="font-bold">Full Heal</div>
                      <div className="text-sm text-gray-500">All HP & MP</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (coins >= 50) {
                        setCoins(c => c - 50);
                        setHp(maxHp);
                        setMp(maxMp);
                      }
                    }}
                    disabled={coins < 50 || (hp >= maxHp && mp >= maxMp)}
                    className={`px-4 py-2 rounded-lg font-bold ${coins >= 50 && (hp < maxHp || mp < maxMp) ? 'bg-red-500 text-white' : 'bg-gray-300'}`}
                  >
                    50ðŸª™
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
          <div className={`min-h-screen bg-gradient-to-b ${region.bg} p-3`}>
            <div className="bg-gray-900/80 rounded-xl p-2 mb-2">
              <div className="flex justify-between text-white text-sm mb-1">
                <span className="font-bold">{playerName}</span>
                <span>Lv.{level}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <HPBar current={hp} max={maxHp} color="red" />
                <HPBar current={mp} max={maxMp} color="blue" />
              </div>
            </div>
            
            {combo > 1 && (
              <div className="text-center mb-2">
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full font-black animate-pulse">
                  ðŸ”¥ {combo}x COMBO
                </span>
              </div>
            )}
            
            <div className="bg-black/40 rounded-2xl p-4 mb-3" style={{ minHeight: 180 }}>
              <div className="flex justify-end mb-6">
                <div className="text-center">
                  <div className="mb-2">
                    <HPBar current={monsterHp} max={monster.maxHp} label={monster.name + (monster.isBoss ? ' ðŸ‘‘' : '')} />
                  </div>
                  <PixelSprite type={monster.sprite} scale={4} isHit={monsterHit} flip />
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="relative">
                  <PixelSprite type="hero" scale={4} isHit={heroHit} isAttacking={heroAttacking} />
                  {isDefending && <div className="absolute -top-2 -right-2 text-2xl">ðŸ›¡ï¸</div>}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/90 rounded-xl p-3 mb-3">
              <p className="text-white font-bold text-center">{message}</p>
            </div>
            
            {phase === 'player' && (
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => pickAction('attack')} className="bg-red-500 p-3 rounded-xl text-white font-bold">
                  <div className="text-xl">âš”ï¸</div><div className="text-xs">Attack</div>
                </button>
                <button onClick={() => pickAction('special')} disabled={mp < 2} className={`p-3 rounded-xl text-white font-bold ${mp >= 2 ? 'bg-yellow-500' : 'bg-gray-500'}`}>
                  <div className="text-xl">âœ¨</div><div className="text-xs">Special</div>
                </button>
                <button onClick={() => pickAction('defend')} className="bg-blue-500 p-3 rounded-xl text-white font-bold">
                  <div className="text-xl">ðŸ›¡ï¸</div><div className="text-xs">Defend</div>
                </button>
                <button onClick={() => pickAction('item')} className="bg-green-500 p-3 rounded-xl text-white font-bold">
                  <div className="text-xl">ðŸŽ’</div><div className="text-xs">Item</div>
                </button>
              </div>
            )}
            
            {phase === 'question' && question && (
              <div>
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
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => useItem('potion')} disabled={inventory.potion <= 0} className={`p-3 rounded-xl text-center ${inventory.potion > 0 ? 'bg-green-500' : 'bg-gray-500'}`}>
                  <div className="text-xl">ðŸ§ª</div>
                  <div className="text-white text-xs font-bold">x{inventory.potion}</div>
                </button>
                <button onClick={() => useItem('bomb')} disabled={inventory.bomb <= 0} className={`p-3 rounded-xl text-center ${inventory.bomb > 0 ? 'bg-red-500' : 'bg-gray-500'}`}>
                  <div className="text-xl">ðŸ’£</div>
                  <div className="text-white text-xs font-bold">x{inventory.bomb}</div>
                </button>
                <button onClick={() => { setPhase('player'); setMessage('Your turn!'); }} className="p-3 rounded-xl text-center bg-gray-600">
                  <div className="text-xl">â†©ï¸</div>
                  <div className="text-white text-xs font-bold">Back</div>
                </button>
              </div>
            )}
          </div>
        );
      }

      return null;
    }

