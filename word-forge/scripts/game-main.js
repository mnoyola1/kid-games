const WordForge = () => {
      // ==================== LUMINA CORE INTEGRATION ====================
      const [playerProfile, setPlayerProfile] = useState(null);
      
      useEffect(() => {
        if (typeof LuminaCore !== 'undefined') {
          const profile = LuminaCore.getActiveProfile();
          if (profile) {
            setPlayerProfile(profile);
            setPlayerName(profile.name);
            console.log('⚒️ Word Forge: Playing as', profile.name);
            LuminaCore.recordGameStart(profile.id, 'wordForge');
          } else {
            console.warn('⚠️ No active player found for Word Forge.');
          }
        }
      }, []);
      
      const [screen, setScreen] = useState('title');
      const [playerName, setPlayerName] = useState('Blacksmith');
      const [coins, setCoins] = useState(0);
      const [level, setLevel] = useState(1);
      const [xp, setXp] = useState(0);
      const [collection, setCollection] = useState([]);
      const [currentRecipe, setCurrentRecipe] = useState(null);
      const [ingredientsCollected, setIngredientsCollected] = useState(0);
      const [currentWord, setCurrentWord] = useState('');
      const [userInput, setUserInput] = useState('');
      const [combo, setCombo] = useState(0);
      const [feedback, setFeedback] = useState(null);
      const [showForgeAnimation, setShowForgeAnimation] = useState(false);
      const [justForgedItem, setJustForgedItem] = useState(null);
      const [itemsForged, setItemsForged] = useState(0);
      const [soundEnabled, setSoundEnabled] = useState(true);
      
      const inputRef = useRef(null);
      const xpToLevel = level * 150;
      
      // Get available recipes based on level
      const availableRecipes = useMemo(() => {
        const rarityUnlocks = {
          common: 1,
          uncommon: 2,
          rare: 4,
          epic: 6,
          legendary: 8
        };
        return RECIPES.filter(r => level >= rarityUnlocks[r.rarity] && !collection.some(c => c.id === r.id));
      }, [level, collection]);
      
      // Pick a random word based on difficulty
      const pickWord = useCallback(() => {
        let list = WORD_LISTS.easy;
        if (level >= 5) list = [...WORD_LISTS.easy, ...WORD_LISTS.medium];
        if (level >= 8) list = [...WORD_LISTS.easy, ...WORD_LISTS.medium, ...WORD_LISTS.hard];
        return list[Math.floor(Math.random() * list.length)].toLowerCase();
      }, [level]);
      
      // Start forging a new item
      const startForging = useCallback((recipe) => {
        setCurrentRecipe(recipe);
        setIngredientsCollected(0);
        setCurrentWord(pickWord());
        setUserInput('');
        setScreen('forging');
        setTimeout(() => inputRef.current?.focus(), 100);
      }, [pickWord]);
      
      // Select random recipe
      const selectRandomRecipe = useCallback(() => {
        if (availableRecipes.length === 0) {
          // All items collected! Pick a random one to re-forge
          const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
          startForging(recipe);
        } else {
          // Weight towards rarer items as you level up
          let pool = [...availableRecipes];
          if (level >= 4 && Math.random() < 0.3) {
            pool = pool.filter(r => ['rare', 'epic', 'legendary'].includes(r.rarity));
          }
          if (pool.length === 0) pool = availableRecipes;
          const recipe = pool[Math.floor(Math.random() * pool.length)];
          startForging(recipe);
        }
      }, [availableRecipes, level, startForging]);
      
      // Handle input change
      const handleInputChange = (e) => {
        const value = e.target.value.toLowerCase();
        setUserInput(value);
        if (soundEnabled) playSound('type');
        
        if (value === currentWord) {
          // Correct!
          const newCombo = combo + 1;
          setCombo(newCombo);
          setIngredientsCollected(prev => prev + 1);
          
          if (soundEnabled) {
            if (newCombo >= 5) playSound('combo');
            else playSound('correct');
            playSound('hammer');
          }
          
          // XP and coins
          const baseXp = 10 + currentWord.length * 2;
          const comboBonus = Math.floor(baseXp * (newCombo * 0.1));
          const totalXp = baseXp + comboBonus;
          
          const baseCoin = 5 + Math.floor(currentWord.length / 2);
          const coinBonus = newCombo >= 3 ? Math.floor(baseCoin * 0.5) : 0;
          setCoins(c => c + baseCoin + coinBonus);
          
          setFeedback({ type: 'correct', combo: newCombo, xp: totalXp, coins: baseCoin + coinBonus });
          
          // Check if recipe complete
          if (ingredientsCollected + 1 >= currentRecipe.ingredients) {
            // Forge the item!
            setTimeout(() => {
              forgeItem(totalXp);
            }, 500);
          } else {
            // Next word
            setTimeout(() => {
              setUserInput('');
              setCurrentWord(pickWord());
              setFeedback(null);
            }, 600);
          }
          
          // Gain XP
          setXp(prev => {
            const newXp = prev + totalXp;
            if (newXp >= xpToLevel) {
              setLevel(l => l + 1);
              return newXp - xpToLevel;
            }
            return newXp;
          });
          
        } else if (value.length > 0 && !currentWord.startsWith(value)) {
          // Wrong!
          setCombo(0);
          if (soundEnabled) playSound('wrong');
          setFeedback({ type: 'wrong' });
          setUserInput('');
          setTimeout(() => setFeedback(null), 400);
        }
      };
      
      // Forge the item
      const forgeItem = (finalXp) => {
        setShowForgeAnimation(true);
        if (soundEnabled) {
          playSound('forge');
          if (currentRecipe.rarity === 'legendary') {
            setTimeout(() => playSound('legendary'), 500);
          }
        }
        
        setTimeout(() => {
          const newItem = { ...currentRecipe, forgedAt: Date.now() };
          setCollection(prev => {
            if (!prev.some(i => i.id === newItem.id)) {
              return [...prev, newItem];
            }
            return prev;
          });
          setJustForgedItem(newItem);
          setItemsForged(i => i + 1);
          setShowForgeAnimation(false);
          setScreen('forged');
        }, 1500);
      };
      
      // Get rarity styles
      const getRarityClass = (rarity) => `rarity-${rarity}`;
      const getRarityBgClass = (rarity) => `rarity-bg-${rarity}`;
      
      // ==================== TITLE SCREEN ====================
      if (screen === 'title') {
        return (
          <div className="forge-bg min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <EmberParticles />
            <div className="fire-pit" />
            
            <div className="relative z-10 text-center">
              <div className="text-8xl mb-4 animate-float filter drop-shadow-lg">⚒️</div>
              <h1 className="font-title text-5xl md:text-6xl text-forge-gold mb-2" style={{ textShadow: '0 0 30px rgba(255, 215, 0, 0.5)' }}>
                WORD FORGE
              </h1>
              <p className="text-forge-ember text-lg mb-8">Master Blacksmith Academy</p>
              
              <div className="bg-black/50 backdrop-blur rounded-2xl p-6 mb-6 max-w-md mx-auto border-2 border-forge-steel/30">
                <p className="text-gray-400 text-sm mb-3">Enter your name, Blacksmith:</p>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value || 'Blacksmith')}
                  className="w-full p-3 text-center text-xl font-bold forge-input rounded-xl text-forge-gold"
                  maxLength={12}
                  onClick={() => initAudio()}
                />
              </div>
              
              <button
                onClick={() => { initAudio(); setScreen('menu'); }}
                className="px-8 py-4 bg-gradient-to-b from-forge-ember to-red-700 text-white rounded-xl text-xl font-bold 
                         border-b-4 border-red-900 hover:from-forge-fire hover:to-forge-ember transition-all transform hover:scale-105
                         shadow-lg shadow-red-900/50"
              >
                🔥 START FORGING 🔥
              </button>
              
              <p className="text-gray-500 text-sm mt-6">Spell words to forge legendary items!</p>
            </div>
          </div>
        );
      }
      
      // ==================== MENU SCREEN ====================
      if (screen === 'menu') {
        return (
          <div className="forge-bg min-h-screen flex flex-col p-4 relative overflow-hidden">
            <EmberParticles />
            <div className="fire-pit" />
            
            {/* Header */}
            <div className="relative z-10 bg-black/60 backdrop-blur rounded-2xl p-4 mb-4 border border-forge-steel/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-forge-ember to-red-700 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-forge-gold">
                    {level}
                  </div>
                  <div>
                    <div className="text-forge-gold font-bold">{playerName}</div>
                    <div className="text-xs text-gray-400">Master Blacksmith</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-forge-gold font-bold text-lg">🪙 {coins}</div>
                  <div className="text-xs text-gray-400">{collection.length}/{RECIPES.length} items</div>
                </div>
              </div>
              
              {/* XP Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Level {level}</span>
                  <span>{xp}/{xpToLevel} XP</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-forge-steel/30">
                  <div 
                    className="h-full bg-gradient-to-r from-forge-ember to-forge-gold transition-all"
                    style={{ width: `${(xp / xpToLevel) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Main Actions */}
            <div className="relative z-10 flex-1 flex flex-col gap-4 max-w-md mx-auto w-full">
              <button
                onClick={selectRandomRecipe}
                className="flex-1 min-h-[140px] bg-gradient-to-br from-forge-ember/80 to-red-800/80 backdrop-blur rounded-2xl p-6 
                         border-2 border-forge-gold/50 hover:border-forge-gold transition-all transform hover:scale-[1.02]
                         flex flex-col items-center justify-center gap-3 shadow-xl shadow-red-900/30"
              >
                <div className="text-5xl animate-float">🔨</div>
                <div className="font-title text-2xl text-forge-gold">FORGE ITEM</div>
                <div className="text-sm text-orange-200">Spell ingredients to craft!</div>
              </button>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setScreen('collection')}
                  className="flex-1 bg-black/60 backdrop-blur rounded-2xl p-4 border border-forge-steel/30 
                           hover:border-forge-gold/50 transition-all flex flex-col items-center gap-2"
                >
                  <div className="text-3xl">📦</div>
                  <div className="font-bold text-white">Collection</div>
                  <div className="text-xs text-gray-400">{collection.length} items</div>
                </button>
                
                <button
                  onClick={() => setScreen('recipes')}
                  className="flex-1 bg-black/60 backdrop-blur rounded-2xl p-4 border border-forge-steel/30 
                           hover:border-forge-gold/50 transition-all flex flex-col items-center gap-2"
                >
                  <div className="text-3xl">📜</div>
                  <div className="font-bold text-white">Recipes</div>
                  <div className="text-xs text-gray-400">{availableRecipes.length} available</div>
                </button>
              </div>
              
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="bg-black/40 backdrop-blur rounded-xl p-3 border border-forge-steel/20 text-gray-400 text-sm"
              >
                {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
              </button>
            </div>
            
            {/* Stats */}
            <div className="relative z-10 mt-4 grid grid-cols-3 gap-3 max-w-md mx-auto w-full">
              <div className="bg-black/40 rounded-xl p-3 text-center border border-forge-steel/20">
                <div className="text-2xl font-bold text-forge-gold">{itemsForged}</div>
                <div className="text-xs text-gray-500">Forged</div>
              </div>
              <div className="bg-black/40 rounded-xl p-3 text-center border border-forge-steel/20">
                <div className="text-2xl font-bold text-green-400">{combo > 0 ? combo : '-'}</div>
                <div className="text-xs text-gray-500">Best Combo</div>
              </div>
              <div className="bg-black/40 rounded-xl p-3 text-center border border-forge-steel/20">
                <div className="text-2xl font-bold text-purple-400">Lv.{level}</div>
                <div className="text-xs text-gray-500">Rank</div>
              </div>
            </div>
          </div>
        );
      }
      
      // ==================== FORGING SCREEN ====================
      if (screen === 'forging' && currentRecipe) {
        return (
          <div className="forge-bg min-h-screen flex flex-col p-4 relative overflow-hidden">
            <EmberParticles />
            <div className="fire-pit" />
            
            {/* Header */}
            <div className="relative z-10 flex justify-between items-center mb-4">
              <button
                onClick={() => { setScreen('menu'); setCurrentRecipe(null); setCombo(0); }}
                className="px-4 py-2 bg-black/50 rounded-lg text-gray-300 text-sm border border-forge-steel/30"
              >
                ← Back
              </button>
              
              <div className="flex items-center gap-4">
                {combo >= 3 && (
                  <div className="px-3 py-1 bg-orange-500/80 rounded-full text-white font-bold animate-combo-pop">
                    🔥 {combo}x Combo!
                  </div>
                )}
                <div className="text-forge-gold font-bold">🪙 {coins}</div>
              </div>
            </div>
            
            {/* Recipe Info */}
            <div className={`relative z-10 bg-black/60 backdrop-blur rounded-2xl p-4 mb-4 border-2 ${getRarityBgClass(currentRecipe.rarity)}`}>
              <div className="flex items-center gap-4">
                <div className="text-5xl">{currentRecipe.emoji}</div>
                <div className="flex-1">
                  <div className={`font-title text-xl ${getRarityClass(currentRecipe.rarity)}`}>{currentRecipe.name}</div>
                  <div className="text-sm text-gray-400">{currentRecipe.description}</div>
                  <div className="text-xs text-gray-500 mt-1 capitalize">{currentRecipe.rarity}</div>
                </div>
              </div>
              
              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Ingredients</span>
                  <span>{ingredientsCollected}/{currentRecipe.ingredients}</span>
                </div>
                <div className="flex gap-2">
                  {[...Array(currentRecipe.ingredients)].map((_, i) => (
                    <div 
                      key={i}
                      className={`flex-1 h-3 rounded-full transition-all ${
                        i < ingredientsCollected 
                          ? 'bg-gradient-to-r from-forge-ember to-forge-gold shadow-lg shadow-orange-500/30' 
                          : 'bg-black/50 border border-forge-steel/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Forge Area */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
              {showForgeAnimation ? (
                <div className="text-center">
                  <div className="text-8xl animate-item-forge mb-4">{currentRecipe.emoji}</div>
                  <div className={`font-title text-2xl ${getRarityClass(currentRecipe.rarity)} animate-pulse`}>
                    FORGING...
                  </div>
                </div>
              ) : (
                <>
                  {/* Word to spell */}
                  <div className="bg-black/70 backdrop-blur rounded-2xl p-6 mb-6 border-2 border-forge-steel/50 min-w-[280px]">
                    <div className="text-center mb-4">
                      <span className="text-gray-400 text-sm">Spell this ingredient:</span>
                    </div>
                    <div className="flex justify-center gap-1 mb-4">
                      {currentWord.split('').map((letter, i) => (
                        <div 
                          key={i}
                          className={`w-10 h-12 flex items-center justify-center text-2xl font-bold rounded-lg border-2 transition-all ${
                            i < userInput.length
                              ? userInput[i] === letter
                                ? 'bg-green-500/30 border-green-500 text-green-400'
                                : 'bg-red-500/30 border-red-500 text-red-400'
                              : 'bg-black/50 border-forge-steel/30 text-forge-gold'
                          }`}
                        >
                          {i < userInput.length ? userInput[i].toUpperCase() : letter.toUpperCase()}
                        </div>
                      ))}
                    </div>
                    
                    <input
                      ref={inputRef}
                      type="text"
                      value={userInput}
                      onChange={handleInputChange}
                      className="w-full p-4 text-center text-2xl font-bold forge-input rounded-xl text-white tracking-widest"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </div>
                  
                  {/* Feedback */}
                  {feedback && (
                    <div className={`text-center p-3 rounded-xl ${
                      feedback.type === 'correct' 
                        ? 'bg-green-500/20 border border-green-500/50' 
                        : 'bg-red-500/20 border border-red-500/50 animate-shake'
                    }`}>
                      {feedback.type === 'correct' ? (
                        <div className="text-green-400 font-bold">
                          ✓ Perfect! +{feedback.xp} XP +{feedback.coins} 🪙
                          {feedback.combo >= 3 && <span className="ml-2">🔥 Combo x{feedback.combo}!</span>}
                        </div>
                      ) : (
                        <div className="text-red-400 font-bold">✗ Try again!</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Anvil decoration */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-6xl opacity-20 anvil">
              ⚒️
            </div>
          </div>
        );
      }
      
      // ==================== FORGED SCREEN ====================
      if (screen === 'forged' && justForgedItem) {
        return (
          <div className="forge-bg min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <EmberParticles />
            <div className="fire-pit" />
            
            <div className="relative z-10 text-center">
              <div className="text-6xl mb-2 animate-float">🎉</div>
              <h2 className="font-title text-3xl text-forge-gold mb-6">ITEM FORGED!</h2>
              
              <div className={`bg-black/70 backdrop-blur rounded-3xl p-8 mb-6 border-2 ${getRarityBgClass(justForgedItem.rarity)} max-w-sm mx-auto`}>
                <div className="text-8xl mb-4 animate-item-forge">{justForgedItem.emoji}</div>
                <div className={`font-title text-2xl mb-2 ${getRarityClass(justForgedItem.rarity)}`}>
                  {justForgedItem.name}
                </div>
                <div className="text-gray-400 mb-2">{justForgedItem.description}</div>
                <div className={`text-sm capitalize font-bold ${getRarityClass(justForgedItem.rarity)}`}>
                  {justForgedItem.rarity}
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => { setJustForgedItem(null); selectRandomRecipe(); }}
                  className="px-6 py-3 bg-gradient-to-b from-forge-ember to-red-700 text-white rounded-xl font-bold 
                           border-b-4 border-red-900 hover:from-forge-fire hover:to-forge-ember transition-all"
                >
                  🔨 Forge Another
                </button>
                <button
                  onClick={() => { setJustForgedItem(null); setScreen('menu'); }}
                  className="px-6 py-3 bg-black/50 text-gray-300 rounded-xl font-bold border border-forge-steel/30"
                >
                  ← Menu
                </button>
              </div>
            </div>
          </div>
        );
      }
      
      // ==================== COLLECTION SCREEN ====================
      if (screen === 'collection') {
        const sortedCollection = [...collection].sort((a, b) => {
          const order = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
          return order[a.rarity] - order[b.rarity];
        });
        
        return (
          <div className="forge-bg min-h-screen flex flex-col p-4 relative overflow-hidden">
            <div className="fire-pit opacity-30" />
            
            {/* Header */}
            <div className="relative z-10 flex justify-between items-center mb-4">
              <button
                onClick={() => setScreen('menu')}
                className="px-4 py-2 bg-black/50 rounded-lg text-gray-300 text-sm border border-forge-steel/30"
              >
                ← Back
              </button>
              <h2 className="font-title text-xl text-forge-gold">📦 Collection</h2>
              <div className="text-sm text-gray-400">{collection.length}/{RECIPES.length}</div>
            </div>
            
            {/* Collection Grid */}
            <div className="relative z-10 flex-1 overflow-auto scroll-hide">
              {collection.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <div className="text-5xl mb-4">🔨</div>
                  <p>No items forged yet!</p>
                  <p className="text-sm mt-2">Start forging to build your collection.</p>
                </div>
              ) : (
                <div className="collection-grid">
                  {sortedCollection.map(item => (
                    <div 
                      key={item.id}
                      className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-2 ${getRarityBgClass(item.rarity)} backdrop-blur`}
                    >
                      <div className="text-3xl">{item.emoji}</div>
                      <div className={`text-xs font-bold truncate w-full text-center mt-1 ${getRarityClass(item.rarity)}`}>
                        {item.name.split(' ')[0]}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }
      
      // ==================== RECIPES SCREEN ====================
      if (screen === 'recipes') {
        const groupedRecipes = {
          legendary: RECIPES.filter(r => r.rarity === 'legendary'),
          epic: RECIPES.filter(r => r.rarity === 'epic'),
          rare: RECIPES.filter(r => r.rarity === 'rare'),
          uncommon: RECIPES.filter(r => r.rarity === 'uncommon'),
          common: RECIPES.filter(r => r.rarity === 'common'),
        };
        
        const rarityUnlocks = { common: 1, uncommon: 2, rare: 4, epic: 6, legendary: 8 };
        
        return (
          <div className="forge-bg min-h-screen flex flex-col p-4 relative overflow-hidden">
            <div className="fire-pit opacity-30" />
            
            {/* Header */}
            <div className="relative z-10 flex justify-between items-center mb-4">
              <button
                onClick={() => setScreen('menu')}
                className="px-4 py-2 bg-black/50 rounded-lg text-gray-300 text-sm border border-forge-steel/30"
              >
                ← Back
              </button>
              <h2 className="font-title text-xl text-forge-gold">📜 Recipes</h2>
              <div className="text-sm text-gray-400">Lv.{level}</div>
            </div>
            
            {/* Recipes List */}
            <div className="relative z-10 flex-1 overflow-auto scroll-hide space-y-4">
              {Object.entries(groupedRecipes).map(([rarity, recipes]) => {
                const unlocked = level >= rarityUnlocks[rarity];
                return (
                  <div key={rarity} className={!unlocked ? 'opacity-40' : ''}>
                    <div className={`font-bold capitalize mb-2 flex items-center gap-2 ${getRarityClass(rarity)}`}>
                      {rarity}
                      {!unlocked && <span className="text-xs text-gray-500">(Unlock at Lv.{rarityUnlocks[rarity]})</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {recipes.map(recipe => {
                        const owned = collection.some(c => c.id === recipe.id);
                        return (
                          <div 
                            key={recipe.id}
                            className={`rounded-xl border p-3 flex items-center gap-3 ${getRarityBgClass(rarity)} ${owned ? '' : 'opacity-60'}`}
                          >
                            <div className="text-2xl">{recipe.emoji}</div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-bold truncate ${owned ? getRarityClass(rarity) : 'text-gray-500'}`}>
                                {recipe.name}
                              </div>
                              <div className="text-xs text-gray-500">{recipe.ingredients} ingredients</div>
                            </div>
                            {owned && <span className="text-green-400">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      
      return null;
    };