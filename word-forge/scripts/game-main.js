const DungeonForge = () => {
  // ==================== STATE ====================
  const [screen, setScreen] = useState('title');
  const [playerProfile, setPlayerProfile] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [menuMusicOption, setMenuMusicOption] = useState('menu'); // 'menu', 'menu_alt1', 'menu_alt2'
  
  // Player state
  const [player, setPlayer] = useState(null);
  const [metaProgress, setMetaProgress] = useState({
    fragments: 0,
    upgrades: {},
    runsCompleted: 0,
    furthestFloor: 0,
    blueprints: []
  });
  
  // Run state
  const [dungeon, setDungeon] = useState(null);
  const [combat, setCombat] = useState(null);
  const [currentWord, setCurrentWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  
  // Forge state
  const [craftingWords, setCraftingWords] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const inputRef = useRef(null);
  
  // ==================== LUMINA CORE INTEGRATION ====================
  useEffect(() => {
    if (typeof LuminaCore !== 'undefined') {
      const profile = LuminaCore.getActiveProfile();
      if (profile) {
        setPlayerProfile(profile);
        console.log('⚒️ Dungeon Forge: Playing as', profile.name);
        LuminaCore.recordGameStart(profile.id, GAME_ID);
        
        // Load meta progress
        const stats = LuminaCore.getGameStats(profile.id, GAME_ID);
        if (stats && stats.metaProgress) {
          setMetaProgress(stats.metaProgress);
        }
      }
    }
  }, []);
  
  // Initialize forge state when entering forge room
  useEffect(() => {
    if (screen === 'forge' && dungeon) {
      const room = dungeon.rooms[dungeon.currentRoom];
      if (room) {
        setCraftingWords(room.craftingWords.map(w => ({ word: w, spelled: false, input: '' })));
        setSelectedItem(room.availableItems[0]);
      }
    }
  }, [screen, dungeon?.currentRoom]);
  
  // ==================== GAME FUNCTIONS ====================
  
  const startNewRun = () => {
    initAudio();
    
    // Initialize player
    const newPlayer = {
      ...PLAYER_DEFAULTS,
      health: PLAYER_DEFAULTS.maxHealth + (metaProgress.upgrades.max_health || 0) * 10,
      maxHealth: PLAYER_DEFAULTS.maxHealth + (metaProgress.upgrades.max_health || 0) * 10,
      inventory: [],
      equipped: {
        weapon: null,
        armor: null,
        accessory: null
      }
    };
    
    // Starting items from upgrades
    if (metaProgress.upgrades.starting_items) {
      const startingWeapon = ITEMS.find(i => i.id === 'iron_sword');
      newPlayer.inventory.push(startingWeapon);
    }
    
    setPlayer(newPlayer);
    
    // Generate first floor
    const newDungeon = generateDungeon(1);
    setDungeon(newDungeon);
    
    setScreen('dungeon');
    if (soundEnabled) playMusic(menuMusicOption);
  };
  
  const enterRoom = (roomId) => {
    moveToRoom(dungeon, roomId);
    const room = dungeon.rooms[roomId];
    
    if (soundEnabled) playSound('door');
    
    if (room.type === ROOM_TYPES.COMBAT) {
      startCombat(room);
    } else if (room.type === ROOM_TYPES.BOSS) {
      startCombat(room, true);
    } else if (room.type === ROOM_TYPES.FORGE) {
      setScreen('forge');
    } else if (room.type === ROOM_TYPES.TREASURE) {
      setScreen('treasure');
    }
    
    setDungeon({...dungeon});
  };
  
  const startCombat = (room, isBoss = false) => {
    const enemies = room.enemies || [room.enemy];
    const newCombat = initCombat(enemies, player);
    setCombat(newCombat);
    setScreen('combat');
    
    if (soundEnabled) playMusic(isBoss ? 'boss' : 'combat');
    
    // Start first turn
    setTimeout(() => {
      const word = startPlayerTurn(newCombat, dungeon.floor);
      setCurrentWord(word);
      setTimeout(() => inputRef.current?.focus(), 100);
    }, 500);
  };
  
  const handleSpellInput = (e) => {
    const value = e.target.value.toLowerCase();
    setUserInput(value);
    
    if (value === currentWord) {
      // Correct!
      setFeedback({ type: 'correct' });
      if (soundEnabled) playSound('correct');
      
      setTimeout(() => {
        // Attack enemy
        const result = playerAttack(combat, 0);
        if (soundEnabled) {
          playSound('attack');
          if (result.killed) {
            playSound('enemy_death');
          }
        }
        
        // Check if combat over
        const status = isCombatOver(combat);
        if (status.over) {
          endCombat(status.victory);
        } else {
          // Enemy turn
          setTimeout(() => {
            const enemyResult = enemyTurn(combat);
            if (soundEnabled && enemyResult.totalDamage > 0) {
              playSound('damage');
            }
            
            // Check if player died
            if (enemyResult.playerDead) {
              endCombat(false);
            } else {
              // Next player turn
              setPlayer({...combat.player});
              const word = startPlayerTurn(combat, dungeon.floor);
              setCurrentWord(word);
              setUserInput('');
              setFeedback(null);
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }, 1000);
        }
        
        setCombat({...combat});
      }, 600);
    } else if (value.length > 0 && !currentWord.startsWith(value)) {
      // Wrong
      setFeedback({ type: 'wrong' });
      if (soundEnabled) playSound('wrong');
      setUserInput('');
      setTimeout(() => setFeedback(null), 400);
    }
  };
  
  const endCombat = (victory) => {
    if (victory) {
      const rewards = calculateRewards(combat);
      
      // Award XP and coins
      if (playerProfile) {
        LuminaCore.addXP(playerProfile.id, rewards.xp, GAME_ID);
        LuminaCore.addCoins(playerProfile.id, rewards.coins, GAME_ID);
        LuminaCore.addRewardPoints(playerProfile.id, Math.floor(rewards.xp / 20));
      }
      
      // Meta fragments
      setMetaProgress(prev => ({
        ...prev,
        fragments: prev.fragments + Math.floor(rewards.xp / 10)
      }));
      
      clearRoom(dungeon);
      setPlayer({...combat.player});
      setScreen('victory');
      
      if (soundEnabled) playMusic('victory', false);
      
    } else {
      // Player died
      setScreen('death');
      if (soundEnabled) playMusic('death', false);
      
      // Save meta progress
      if (playerProfile) {
        const stats = {
          metaProgress: {
            ...metaProgress,
            runsCompleted: metaProgress.runsCompleted + 1,
            furthestFloor: Math.max(metaProgress.furthestFloor, dungeon.floor)
          }
        };
        LuminaCore.recordGameEnd(playerProfile.id, GAME_ID, stats);
      }
    }
  };
  
  const continueExploring = () => {
    setScreen('dungeon');
    setCombat(null);
    setUserInput('');
    setFeedback(null);
    if (soundEnabled) playMusic(menuMusicOption);
  };
  
  const craftItem = (item, words) => {
    // Check if player spelled all words
    if (words.every(w => w.spelled)) {
      player.inventory.push(item);
      setPlayer({...player});
      
      if (soundEnabled) playSound('craft');
      setFeedback({ type: 'crafted', item });
      
      setTimeout(() => {
        setFeedback(null);
        clearRoom(dungeon);
        continueExploring();
      }, 2000);
    }
  };
  
  const openChest = () => {
    const room = dungeon.rooms[dungeon.currentRoom];
    if (room.chest) {
      if (room.chest.item) {
        player.inventory.push(room.chest.item);
      }
      
      if (playerProfile && room.chest.coins) {
        LuminaCore.addCoins(playerProfile.id, room.chest.coins, GAME_ID);
      }
      
      if (soundEnabled) playSound('chest');
      
      setPlayer({...player});
      clearRoom(dungeon);
      
      setTimeout(() => continueExploring(), 1500);
    }
  };
  
  const equipItem = (item) => {
    const slot = item.type === 'weapon' ? 'weapon' : 
                 item.type === 'armor' ? 'armor' : 'accessory';
    
    player.equipped[slot] = item;
    
    // Update player stats
    if (item.type === 'armor') {
      player.defense = item.defense;
    }
    if (item.type === 'accessory' && item.health) {
      player.maxHealth += item.health;
      player.health = Math.min(player.health + item.health, player.maxHealth);
    }
    
    setPlayer({...player});
    if (soundEnabled) playSound('equip');
  };
  
  const descendFloor = () => {
    const newFloor = dungeon.floor + 1;
    const newDungeon = generateDungeon(newFloor);
    setDungeon(newDungeon);
    setScreen('dungeon');
    
    if (soundEnabled) playSound('door');
  };
  
  // ==================== RENDER TITLE SCREEN ====================
  if (screen === 'title') {
    return (
      <div className="dungeon-bg min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="dungeon-overlay" />
        
        <div className="relative z-10 text-center max-w-2xl">
          <div className="text-8xl mb-4 animate-float">⚒️</div>
          <h1 className="font-title text-5xl md:text-7xl text-amber-400 mb-2 drop-shadow-glow">
            DUNGEON FORGE
          </h1>
          <p className="text-orange-400 text-xl mb-2">Roguelike Spelling Adventure</p>
          <p className="text-gray-400 text-sm mb-8">Craft items • Battle monsters • Spell words to survive</p>
          
          {playerProfile && (
            <div className="bg-black/70 backdrop-blur rounded-xl p-4 mb-6 border border-amber-900/50">
              <p className="text-amber-400 mb-2">Playing as: <span className="font-bold">{playerProfile.name}</span></p>
              <p className="text-gray-400 text-sm">Furthest Floor: {metaProgress.furthestFloor || 0} • Fragments: {metaProgress.fragments || 0}</p>
            </div>
          )}
          
          <div className="flex gap-4 justify-center mb-4">
            <button
              onClick={startNewRun}
              className="px-8 py-4 bg-gradient-to-b from-amber-600 to-amber-800 text-white rounded-xl text-xl font-bold 
                       border-b-4 border-amber-900 hover:from-amber-500 hover:to-amber-700 transition-all transform hover:scale-105
                       shadow-lg"
            >
              🗡️ START RUN
            </button>
            
            <button
              onClick={() => setScreen('upgrades')}
              className="px-6 py-4 bg-gradient-to-b from-purple-600 to-purple-800 text-white rounded-xl font-bold 
                       border-b-4 border-purple-900 hover:from-purple-500 hover:to-purple-700 transition-all"
            >
              ⬆️ Upgrades
            </button>
          </div>
          
          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
            >
              {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
            </button>
            
            {/* Music Selector */}
            <div className="bg-black/50 backdrop-blur rounded-lg p-3 border border-gray-700">
              <p className="text-gray-400 text-xs mb-2">Menu Music:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMenuMusicOption('menu');
                    if (soundEnabled && screen === 'title') {
                      stopMusic();
                      playMusic('menu');
                    }
                  }}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    menuMusicOption === 'menu'
                      ? 'bg-amber-600 text-white'
                      : 'bg-black/50 text-gray-400 hover:bg-black/70'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => {
                    setMenuMusicOption('menu_alt1');
                    if (soundEnabled && screen === 'title') {
                      stopMusic();
                      playMusic('menu_alt1');
                    }
                  }}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    menuMusicOption === 'menu_alt1'
                      ? 'bg-amber-600 text-white'
                      : 'bg-black/50 text-gray-400 hover:bg-black/70'
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => {
                    setMenuMusicOption('menu_alt2');
                    if (soundEnabled && screen === 'title') {
                      stopMusic();
                      playMusic('menu_alt2');
                    }
                  }}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    menuMusicOption === 'menu_alt2'
                      ? 'bg-amber-600 text-white'
                      : 'bg-black/50 text-gray-400 hover:bg-black/70'
                  }`}
                >
                  Epic
                </button>
              </div>
            </div>
          </div>
          
          {playerProfile && (
            <div className="mt-6">
              <a
                href="../index.html"
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                🏠 Return to Noyola Hub
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // ==================== RENDER DUNGEON EXPLORATION ====================
  if (screen === 'dungeon' && dungeon) {
    const currentRoom = dungeon.rooms[dungeon.currentRoom];
    const exits = getAvailableExits(dungeon);
    
    return (
      <div className="dungeon-bg min-h-screen flex flex-col p-4 relative overflow-hidden" style={{
        backgroundImage: `url('../assets/backgrounds/word-forge/floor${Math.min(dungeon.floor, 4)}${dungeon.floor >= 4 ? '_plus' : ''}.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="dungeon-overlay" />
        
        {/* Mini-Map */}
        <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur rounded-xl p-3 border border-amber-900/50">
          <div className="text-amber-400 text-xs font-bold mb-2 text-center">Floor Map</div>
          <div className="grid gap-1" style={{
            gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(dungeon.rooms.length))}, 1fr)`
          }}>
            {dungeon.rooms.map((room, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-sm transition-all ${
                  i === dungeon.currentRoom
                    ? 'bg-amber-400 ring-2 ring-amber-300 animate-pulse'
                    : room.visited
                    ? room.cleared
                      ? 'bg-green-600'
                      : 'bg-blue-600'
                    : 'bg-gray-700'
                }`}
                title={`Room ${i + 1}${i === dungeon.currentRoom ? ' (Current)' : room.visited ? ' (Visited)' : ' (Unexplored)'}`}
              >
                {room.type === ROOM_TYPES.BOSS && (
                  <div className="w-full h-full flex items-center justify-center text-[8px]">👑</div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-gray-400 space-y-0.5">
            <div>🟡 You</div>
            <div>🟢 Cleared</div>
            <div>🔵 Visited</div>
            <div>⚫ Unknown</div>
          </div>
        </div>
        
        {/* Header */}
        <div className="relative z-10 bg-black/70 backdrop-blur rounded-xl p-4 mb-4 border border-amber-900/30">
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={() => setScreen('title')}
              className="px-3 py-1 bg-black/50 text-gray-300 rounded-lg text-sm hover:bg-black/70 transition-all"
            >
              ← Menu
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-amber-400 font-bold text-lg">Floor {dungeon.floor}</div>
              <div className="text-sm text-gray-400">Room {dungeon.currentRoom + 1}/{dungeon.rooms.length}</div>
            </div>
            <div>
              <div className="text-red-400 font-bold text-lg">❤️ {player.health}/{player.maxHealth}</div>
              <div className="text-sm text-gray-400">{player.inventory.length} items</div>
            </div>
          </div>
        </div>
        
        {/* Room Display */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
          <div className="bg-black/80 backdrop-blur rounded-2xl p-8 max-w-lg w-full border-2 border-amber-900/50">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">
                {currentRoom.type === ROOM_TYPES.START && '🚪'}
                {currentRoom.type === ROOM_TYPES.COMBAT && '⚔️'}
                {currentRoom.type === ROOM_TYPES.FORGE && '⚒️'}
                {currentRoom.type === ROOM_TYPES.TREASURE && '📦'}
                {currentRoom.type === ROOM_TYPES.BOSS && '🐉'}
                {currentRoom.type === ROOM_TYPES.EMPTY && '🌑'}
              </div>
              <h2 className="font-title text-2xl text-amber-400 mb-2">
                {currentRoom.type === ROOM_TYPES.START && 'Starting Chamber'}
                {currentRoom.type === ROOM_TYPES.COMBAT && 'Monster Lair'}
                {currentRoom.type === ROOM_TYPES.FORGE && 'Ancient Forge'}
                {currentRoom.type === ROOM_TYPES.TREASURE && 'Treasure Room'}
                {currentRoom.type === ROOM_TYPES.BOSS && 'Boss Arena'}
                {currentRoom.type === ROOM_TYPES.EMPTY && 'Empty Hall'}
              </h2>
              <p className="text-gray-400 text-sm">
                {currentRoom.cleared && '✓ Cleared'}
                {!currentRoom.cleared && currentRoom.type === ROOM_TYPES.START && 'Choose your path'}
                {!currentRoom.cleared && currentRoom.type !== ROOM_TYPES.START && 'Unexplored'}
              </p>
            </div>
            
            {/* Exits */}
            {currentRoom.cleared && exits.length > 0 && (
              <div className="space-y-2">
                <p className="text-gray-400 text-sm text-center mb-3">Choose your path:</p>
                {exits.map(room => (
                  <button
                    key={room.id}
                    onClick={() => enterRoom(room.id)}
                    className="w-full p-4 bg-gradient-to-r from-amber-900/50 to-orange-900/50 rounded-xl border border-amber-700/50
                             hover:from-amber-800/70 hover:to-orange-800/70 transition-all transform hover:scale-[1.02]
                             flex items-center justify-between"
                  >
                    <span className="text-amber-300">
                      {room.type === ROOM_TYPES.COMBAT && '⚔️ Combat'}
                      {room.type === ROOM_TYPES.FORGE && '⚒️ Forge'}
                      {room.type === ROOM_TYPES.TREASURE && '📦 Treasure'}
                      {room.type === ROOM_TYPES.BOSS && '🐉 BOSS'}
                      {room.type === ROOM_TYPES.EMPTY && '🌑 Empty'}
                    </span>
                    <span className="text-gray-500 text-sm">→</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Floor complete */}
            {currentRoom.type === ROOM_TYPES.BOSS && currentRoom.cleared && (
              <button
                onClick={descendFloor}
                className="w-full p-4 bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl font-bold text-white
                         border-b-4 border-purple-900 hover:from-purple-500 hover:to-purple-700 transition-all"
              >
                ⬇️ Descend to Floor {dungeon.floor + 1}
              </button>
            )}
          </div>
          
          {/* Inventory */}
          <div className="mt-4 bg-black/70 backdrop-blur rounded-xl p-4 max-w-lg w-full border border-amber-900/30">
            <p className="text-amber-400 font-bold mb-2">Inventory</p>
            <div className="grid grid-cols-4 gap-2">
              {player.inventory.map((item, i) => (
                <button
                  key={i}
                  onClick={() => equipItem(item)}
                  className={`aspect-square rounded-lg border-2 flex items-center justify-center text-2xl
                    ${player.equipped[item.type === 'weapon' ? 'weapon' : item.type === 'armor' ? 'armor' : 'accessory']?.id === item.id
                      ? 'border-amber-400 bg-amber-900/30'
                      : 'border-gray-700 bg-black/50'}`}
                  title={item.name}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // ==================== RENDER COMBAT ====================
  if (screen === 'combat' && combat) {
    const livingEnemies = combat.enemies.filter(e => e.currentHealth > 0);
    
    return (
      <div className="dungeon-bg min-h-screen flex flex-col p-4 relative overflow-hidden" style={{
        backgroundImage: `url('../assets/backgrounds/word-forge/floor${Math.min(dungeon.floor, 4)}${dungeon.floor >= 4 ? '_plus' : ''}.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="dungeon-overlay dungeon-combat" />
        
        {/* Header */}
        <div className="relative z-10 flex justify-between items-center mb-4">
          <div className="bg-black/70 backdrop-blur rounded-lg px-4 py-2 border border-red-900/50">
            <div className="text-red-400 font-bold">❤️ {combat.player.currentHealth}/{combat.player.maxHealth}</div>
          </div>
          <div className="bg-black/70 backdrop-blur rounded-lg px-4 py-2 border border-amber-900/50">
            {combat.combo > 0 && (
              <div className="text-orange-400 font-bold">🔥 {combat.combo}x Combo</div>
            )}
          </div>
        </div>
        
        {/* Enemies */}
        <div className="relative z-10 flex justify-center gap-4 mb-6">
          {livingEnemies.map((enemy, i) => (
            <div key={i} className="bg-black/70 backdrop-blur rounded-xl p-4 border-2 border-red-900/50">
              <div className="flex justify-center mb-2">
                <img 
                  src={enemy.sprite} 
                  alt={enemy.name}
                  className="w-24 h-24 object-contain monster-animate"
                  style={{ imageRendering: 'auto' }}
                />
              </div>
              <div className="text-sm text-amber-400 font-bold">{enemy.name}</div>
              <div className="text-xs text-gray-400">{Math.ceil(enemy.currentHealth)}/{enemy.maxHealth} HP</div>
              <div className="w-24 h-2 bg-black/50 rounded-full mt-2 border border-red-900/50">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all"
                  style={{ width: `${(enemy.currentHealth / enemy.maxHealth) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Spell Input */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
          <div className="bg-black/80 backdrop-blur rounded-2xl p-6 max-w-md w-full border-2 border-amber-900/50">
            <p className="text-center text-gray-400 text-sm mb-3">Spell this word to attack:</p>
            
            <div className="flex justify-center gap-1 mb-4">
              {currentWord.split('').map((letter, i) => (
                <div 
                  key={i}
                  className={`w-10 h-12 flex items-center justify-center text-2xl font-bold rounded-lg border-2 transition-all ${
                    i < userInput.length
                      ? userInput[i] === letter
                        ? 'bg-green-500/30 border-green-500 text-green-400'
                        : 'bg-red-500/30 border-red-500 text-red-400 animate-shake'
                      : 'bg-black/50 border-amber-700 text-amber-400'
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
              onChange={handleSpellInput}
              className="w-full p-4 text-center text-2xl font-bold bg-black/70 border-2 border-amber-700 rounded-xl 
                       text-white tracking-widest focus:border-amber-500 focus:outline-none"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck="false"
            />
            
            {feedback && (
              <div className={`mt-3 text-center p-2 rounded-lg ${
                feedback.type === 'correct' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {feedback.type === 'correct' ? '✓ Correct! Attacking...' : '✗ Try again!'}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // ==================== RENDER FORGE ====================
  if (screen === 'forge' && dungeon) {
    const room = dungeon.rooms[dungeon.currentRoom];
    
    // Wait for state to initialize
    if (!selectedItem || craftingWords.length === 0) {
      return null;
    }
    
    return (
      <div className="dungeon-bg min-h-screen flex flex-col p-4 relative overflow-hidden">
        <div className="dungeon-overlay" />
        
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
          <div className="bg-black/80 backdrop-blur rounded-2xl p-6 max-w-lg w-full border-2 border-amber-900/50">
            <h2 className="font-title text-2xl text-amber-400 text-center mb-4">⚒️ Ancient Forge</h2>
            
            <p className="text-gray-400 text-sm text-center mb-6">
              Spell all words to craft: <span className="text-amber-400 font-bold">{selectedItem.name}</span>
            </p>
            
            <div className="space-y-3 mb-6">
              {craftingWords.map((word, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={word.input}
                    onChange={(e) => {
                      const newWords = [...craftingWords];
                      newWords[i].input = e.target.value.toLowerCase();
                      if (newWords[i].input === word.word) {
                        newWords[i].spelled = true;
                        if (soundEnabled) playSound('correct');
                      }
                      setCraftingWords(newWords);
                    }}
                    disabled={word.spelled}
                    placeholder={word.word}
                    className="flex-1 p-3 bg-black/70 border-2 border-amber-700 rounded-lg text-white text-center
                             disabled:bg-green-900/30 disabled:border-green-500"
                  />
                  {word.spelled && <span className="text-green-400 text-2xl">✓</span>}
                </div>
              ))}
            </div>
            
            <button
              onClick={() => craftItem(selectedItem, craftingWords)}
              disabled={!craftingWords.every(w => w.spelled)}
              className="w-full p-4 bg-gradient-to-r from-amber-600 to-amber-800 rounded-xl font-bold text-white
                       border-b-4 border-amber-900 hover:from-amber-500 hover:to-amber-700 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔨 Forge {selectedItem.name}
            </button>
            
            <button
              onClick={continueExploring}
              className="w-full mt-2 p-3 bg-black/50 text-gray-400 rounded-lg hover:bg-black/70 transition-all"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // ==================== RENDER TREASURE ====================
  if (screen === 'treasure' && dungeon) {
    const room = dungeon.rooms[dungeon.currentRoom];
    
    return (
      <div className="dungeon-bg min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="dungeon-overlay" />
        
        <div className="relative z-10 text-center">
          <div className="text-8xl mb-4 animate-float">📦</div>
          <h2 className="font-title text-3xl text-amber-400 mb-6">Treasure Found!</h2>
          
          <div className="bg-black/80 backdrop-blur rounded-2xl p-8 max-w-md border-2 border-amber-900/50">
            {room.chest.item && (
              <div className="mb-4">
                <div className="text-6xl mb-2">{room.chest.item.emoji}</div>
                <div className="text-xl text-amber-400 font-bold">{room.chest.item.name}</div>
                <div className="text-sm text-gray-400">{room.chest.item.description}</div>
              </div>
            )}
            
            {room.chest.coins && (
              <div className="text-lg text-yellow-400">+{room.chest.coins} 🪙 Coins</div>
            )}
            
            <button
              onClick={openChest}
              className="mt-6 px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-800 rounded-xl font-bold text-white
                       border-b-4 border-amber-900 hover:from-amber-500 hover:to-amber-700 transition-all"
            >
              Take Loot
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // ==================== RENDER VICTORY ====================
  if (screen === 'victory') {
    return (
      <div className="dungeon-bg min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="dungeon-overlay" />
        
        <div className="relative z-10 text-center">
          <div className="text-8xl mb-4 animate-float">🎉</div>
          <h2 className="font-title text-4xl text-amber-400 mb-6">VICTORY!</h2>
          
          <button
            onClick={continueExploring}
            className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-800 rounded-xl font-bold text-white text-lg
                     border-b-4 border-amber-900 hover:from-amber-500 hover:to-amber-700 transition-all"
          >
            Continue Exploring
          </button>
        </div>
      </div>
    );
  }
  
  // ==================== RENDER DEATH ====================
  if (screen === 'death') {
    return (
      <div className="dungeon-bg min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="dungeon-overlay" style={{opacity: 0.3}} />
        
        <div className="relative z-10 text-center">
          <div className="text-8xl mb-4">💀</div>
          <h2 className="font-title text-4xl text-red-400 mb-2">You Died</h2>
          <p className="text-gray-400 mb-6">Reached Floor {dungeon.floor}</p>
          
          <div className="bg-black/80 backdrop-blur rounded-2xl p-6 max-w-md mb-6 border border-gray-700">
            <p className="text-amber-400 font-bold mb-2">Fragments Collected: {metaProgress.fragments}</p>
            <p className="text-sm text-gray-400">Use fragments to unlock permanent upgrades</p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setScreen('title')}
              className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-800 rounded-xl font-bold text-white
                       border-b-4 border-amber-900 hover:from-amber-500 hover:to-amber-700 transition-all"
            >
              Return to Hub
            </button>
            
            <button
              onClick={startNewRun}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl font-bold text-white
                       border-b-4 border-purple-900 hover:from-purple-500 hover:to-purple-700 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // ==================== RENDER UPGRADES ====================
  if (screen === 'upgrades') {
    return (
      <div className="dungeon-bg min-h-screen flex flex-col p-4 relative overflow-hidden">
        <div className="dungeon-overlay" />
        
        <div className="relative z-10 max-w-2xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setScreen('title')}
              className="px-4 py-2 bg-black/50 text-gray-300 rounded-lg"
            >
              ← Back
            </button>
            <div className="text-amber-400 font-bold">Fragments: {metaProgress.fragments}</div>
          </div>
          
          <h2 className="font-title text-3xl text-amber-400 text-center mb-6">⬆️ Permanent Upgrades</h2>
          
          <div className="space-y-3">
            {META_UPGRADES.map(upgrade => {
              const level = metaProgress.upgrades[upgrade.id] || 0;
              const canAfford = metaProgress.fragments >= upgrade.cost;
              const maxed = level >= upgrade.maxLevel;
              
              return (
                <div key={upgrade.id} className="bg-black/70 backdrop-blur rounded-xl p-4 border border-amber-900/30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-amber-400">{upgrade.name}</div>
                      <div className="text-sm text-gray-400">{upgrade.description}</div>
                    </div>
                    <div className="text-sm text-gray-500">Lv.{level}/{upgrade.maxLevel}</div>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (canAfford && !maxed) {
                        setMetaProgress(prev => ({
                          ...prev,
                          fragments: prev.fragments - upgrade.cost,
                          upgrades: {
                            ...prev.upgrades,
                            [upgrade.id]: (prev.upgrades[upgrade.id] || 0) + 1
                          }
                        }));
                        if (soundEnabled) playSound('equip');
                      }
                    }}
                    disabled={!canAfford || maxed}
                    className="w-full p-2 bg-amber-900/30 text-amber-400 rounded-lg text-sm font-bold
                             hover:bg-amber-800/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {maxed ? 'MAX LEVEL' : `Upgrade (${upgrade.cost} fragments)`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};
