// ==================== MAIN GAME COMPONENT ====================

const ShadowsInTheHalls = () => {
  // Player Profile
  const [playerProfile, setPlayerProfile] = React.useState(null);
  const [playerName, setPlayerName] = React.useState('');

  // Game State
  const [screen, setScreen] = React.useState('title'); // title, playing, puzzle, paused, gameover, victory
  const [isPaused, setIsPaused] = React.useState(false);
  
  // Player State
  const [player, setPlayer] = React.useState({
    x: 300,
    y: 300,
    battery: 100,
    hp: 1,
    inventory: [],
    isRunning: false,
  });

  // Map State
  const [currentRoom, setCurrentRoom] = React.useState({ x: 2, y: 2 });
  const [map, setMap] = React.useState([]);
  const [discoveredRooms, setDiscoveredRooms] = React.useState(['2_2']);
  
  // Game State
  const [enemies, setEnemies] = React.useState([]);
  const [items, setItems] = React.useState([]);
  const [exitRoom, setExitRoom] = React.useState(null);
  
  // Puzzle State
  const [currentPuzzle, setCurrentPuzzle] = React.useState(null);
  const [lockedDoors, setLockedDoors] = React.useState([]);
  
  // Run Stats
  const [runStats, setRunStats] = React.useState({
    roomsExplored: 1,
    puzzlesSolved: 0,
    batteriesCollected: 0,
    timeElapsed: 0,
  });

  // Input State
  const [keys, setKeys] = React.useState({});
  const [lastBatteryWarning, setLastBatteryWarning] = React.useState(0);

  // ==================== PLAYER EMOJI SELECTOR ====================
  const getPlayerEmoji = React.useCallback(() => {
    if (!playerProfile) {
      return '🤖'; // Default to guest (robot)
    }
    
    // Map profile IDs to their respective emojis
    const emojiMap = {
      emma: '👧',
      liam: '🧒',
      guest: '🤖',
    };

    return emojiMap[playerProfile.id] || '🤖';
  }, [playerProfile]);

  // ==================== LUMINACORE INTEGRATION ====================
  React.useEffect(() => {
    if (typeof LuminaCore !== 'undefined') {
      const profile = LuminaCore.getActiveProfile();
      if (profile) {
        setPlayerProfile(profile);
        setPlayerName(profile.name);
        console.log('🏫 Shadows in the Halls: Playing as', profile.name);
      }
    }

    // Initialize audio on user interaction
    const initAudio = async () => {
      await audioManager.init();
    };
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  // ==================== INITIALIZE GAME ====================
  const initializeGame = React.useCallback(() => {
    console.log('🎮 Initializing new run...');
    
    // Record game start
    if (playerProfile) {
      LuminaCore.recordGameStart(playerProfile.id, GAME_ID);
    }

    // Generate simple 5x5 map
    const newMap = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const isStart = x === 2 && y === 2;
        // Assign room types with variety
        let roomType;
        if (isStart) {
          roomType = 'safe_room';
        } else {
          const roll = Math.random();
          if (roll < 0.5) roomType = 'hallway';
          else if (roll < 0.8) roomType = 'classroom';
          else roomType = 'office';
        }
        row.push({
          type: roomType,
          hasNorthDoor: y > 0,
          hasSouthDoor: y < GRID_SIZE - 1,
          hasEastDoor: x < GRID_SIZE - 1,
          hasWestDoor: x > 0,
          items: [],
          enemies: [],
        });
      }
      newMap.push(row);
    }
    
    // Set exit room (edge of map, far from start)
    const exitX = Math.random() > 0.5 ? 0 : 4;
    const exitY = Math.floor(Math.random() * GRID_SIZE);
    setExitRoom({ x: exitX, y: exitY });
    
    setMap(newMap);
    
    // Reset player
    setPlayer({
      x: 300,
      y: 300,
      battery: 100,
      hp: 1,
      inventory: [],
      isRunning: false,
    });
    
    // Reset game state
    setCurrentRoom({ x: 2, y: 2 });
    setDiscoveredRooms(['2_2']);
    setRunStats({
      roomsExplored: 1,
      puzzlesSolved: 0,
      batteriesCollected: 0,
      timeElapsed: 0,
    });
    
    // Spawn some items in rooms
    const newItems = [];
    for (let i = 0; i < 3; i++) {
      const roomX = Math.floor(Math.random() * GRID_SIZE);
      const roomY = Math.floor(Math.random() * GRID_SIZE);
      if (roomX !== 2 || roomY !== 2) { // Not in starting room
        newItems.push({
          type: 'battery',
          roomX,
          roomY,
          x: Math.random() * 500 + 50,
          y: Math.random() * 500 + 50,
        });
      }
    }
    setItems(newItems);
    
    // Spawn enemies
    const newEnemies = [];
    for (let i = 0; i < 3; i++) {
      const roomX = Math.floor(Math.random() * GRID_SIZE);
      const roomY = Math.floor(Math.random() * GRID_SIZE);
      if (roomX !== 2 || roomY !== 2) {
        newEnemies.push({
          id: `enemy_${i}`,
          type: 'lurker',
          roomX,
          roomY,
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
          patrolIndex: 0,
          patrolPoints: [
            { x: 100, y: 100 },
            { x: 500, y: 100 },
            { x: 500, y: 500 },
            { x: 100, y: 500 },
          ],
        });
      }
    }
    setEnemies(newEnemies);
    
    // Generate some locked doors with puzzles
    const newLockedDoors = [];
    for (let i = 0; i < 2; i++) {
      const direction = ['north', 'south', 'east', 'west'][Math.floor(Math.random() * 4)];
      const roomX = Math.floor(Math.random() * GRID_SIZE);
      const roomY = Math.floor(Math.random() * GRID_SIZE);
      
      // Pick random puzzle
      const allPuzzles = [...MATH_PUZZLES, ...WORD_PUZZLES, ...PATTERN_PUZZLES];
      const puzzle = allPuzzles[Math.floor(Math.random() * allPuzzles.length)];
      
      newLockedDoors.push({
        roomX,
        roomY,
        direction,
        puzzle,
        unlocked: false,
      });
    }
    setLockedDoors(newLockedDoors);
    
    setScreen('playing');
  }, [playerProfile]);

  // ==================== KEYBOARD INPUT ====================
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
      if (e.key === 'Escape') setIsPaused(prev => !prev);
    };

    const handleKeyUp = (e) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ==================== GAME LOOP ====================
  React.useEffect(() => {
    if (screen !== 'playing' || isPaused) return;

    const gameLoop = setInterval(() => {
      const deltaTime = 1 / 60; // 60 FPS

      // Update player position
      setPlayer(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const isRunning = keys['shift'];
        const speed = isRunning ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;
        const movement = speed * deltaTime;

        if (keys['w'] || keys['arrowup']) newY -= movement;
        if (keys['s'] || keys['arrowdown']) newY += movement;
        if (keys['a'] || keys['arrowleft']) newX -= movement;
        if (keys['d'] || keys['arrowright']) newX += movement;

        // Keep within room bounds
        newX = Math.max(PLAYER_SIZE, Math.min(ROOM_SIZE - PLAYER_SIZE, newX));
        newY = Math.max(PLAYER_SIZE, Math.min(ROOM_SIZE - PLAYER_SIZE, newY));

        // Drain battery
        const drainRate = isRunning ? BATTERY_DRAIN_RUNNING : BATTERY_DRAIN_RATE;
        let newBattery = prev.battery - (drainRate * deltaTime);
        
        // Battery warning
        if (newBattery <= LOW_BATTERY_THRESHOLD && Date.now() - lastBatteryWarning > 5000) {
          console.log('⚠️ Battery low!');
          audioManager.play('batteryLow');
          audioManager.play('flashlightDying');
          setLastBatteryWarning(Date.now());
        }

        // Game over if battery dies
        if (newBattery <= 0) {
          endGame(false);
          return prev;
        }

        return {
          ...prev,
          x: newX,
          y: newY,
          battery: Math.max(0, newBattery),
          isRunning,
        };
      });

      // Check for door transitions
      checkDoorTransitions();

      // Check for item pickups
      checkItemPickups();

      // Check for enemy collisions
      checkEnemyCollisions();

      // Update run time
      setRunStats(prev => ({
        ...prev,
        timeElapsed: prev.timeElapsed + deltaTime,
      }));

    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [screen, isPaused, keys, currentRoom, player]);

  // ==================== HELPER FUNCTIONS ====================
  
  const checkDoorTransitions = () => {
    const threshold = 50;
    
    // North door
    if (player.y < threshold && currentRoom.y > 0) {
      const doorLocked = lockedDoors.find(d => 
        d.roomX === currentRoom.x && d.roomY === currentRoom.y && d.direction === 'north' && !d.unlocked
      );
      if (doorLocked) {
        showPuzzle(doorLocked);
      } else {
        moveToRoom(currentRoom.x, currentRoom.y - 1, 'north');
      }
    }
    
    // South door
    if (player.y > ROOM_SIZE - threshold && currentRoom.y < GRID_SIZE - 1) {
      const doorLocked = lockedDoors.find(d => 
        d.roomX === currentRoom.x && d.roomY === currentRoom.y && d.direction === 'south' && !d.unlocked
      );
      if (doorLocked) {
        showPuzzle(doorLocked);
      } else {
        moveToRoom(currentRoom.x, currentRoom.y + 1, 'south');
      }
    }
    
    // East door
    if (player.x > ROOM_SIZE - threshold && currentRoom.x < GRID_SIZE - 1) {
      const doorLocked = lockedDoors.find(d => 
        d.roomX === currentRoom.x && d.roomY === currentRoom.y && d.direction === 'east' && !d.unlocked
      );
      if (doorLocked) {
        showPuzzle(doorLocked);
      } else {
        moveToRoom(currentRoom.x + 1, currentRoom.y, 'east');
      }
    }
    
    // West door
    if (player.x < threshold && currentRoom.x > 0) {
      const doorLocked = lockedDoors.find(d => 
        d.roomX === currentRoom.x && d.roomY === currentRoom.y && d.direction === 'west' && !d.unlocked
      );
      if (doorLocked) {
        showPuzzle(doorLocked);
      } else {
        moveToRoom(currentRoom.x - 1, currentRoom.y, 'west');
      }
    }
  };

  const moveToRoom = (newX, newY, direction) => {
    setCurrentRoom({ x: newX, y: newY });
    
    // Update discovered rooms
    const roomKey = `${newX}_${newY}`;
    if (!discoveredRooms.includes(roomKey)) {
      setDiscoveredRooms(prev => [...prev, roomKey]);
      setRunStats(prev => ({
        ...prev,
        roomsExplored: prev.roomsExplored + 1,
      }));
    }
    
    // Move player to opposite side
    setPlayer(prev => {
      let newPlayerX = prev.x;
      let newPlayerY = prev.y;
      
      if (direction === 'north') newPlayerY = ROOM_SIZE - 60;
      if (direction === 'south') newPlayerY = 60;
      if (direction === 'east') newPlayerX = 60;
      if (direction === 'west') newPlayerX = ROOM_SIZE - 60;
      
      return { ...prev, x: newPlayerX, y: newPlayerY };
    });

    // Check if reached exit
    if (exitRoom && newX === exitRoom.x && newY === exitRoom.y) {
      endGame(true);
    }
  };

  const checkItemPickups = () => {
    items.forEach(item => {
      if (item.roomX === currentRoom.x && item.roomY === currentRoom.y) {
        const distance = Math.sqrt(
          Math.pow(player.x - item.x, 2) + Math.pow(player.y - item.y, 2)
        );
        
        if (distance < 30) {
          pickupItem(item);
        }
      }
    });
  };

  const pickupItem = (item) => {
    if (item.type === 'battery') {
      setPlayer(prev => ({
        ...prev,
        battery: Math.min(100, prev.battery + BATTERY_PICKUP_AMOUNT),
      }));
      setRunStats(prev => ({
        ...prev,
        batteriesCollected: prev.batteriesCollected + 1,
      }));
      audioManager.play('batteryPickup');
      console.log('🔋 Battery collected!');
    } else if (player.inventory.length < 4) {
      setPlayer(prev => ({
        ...prev,
        inventory: [...prev.inventory, ITEMS[item.type]],
      }));
      audioManager.play('batteryPickup'); // Reuse for key pickups
      console.log(`📦 Picked up ${ITEMS[item.type].name}`);
    }
    
    // Remove item from world
    setItems(prev => prev.filter(i => i !== item));
  };

  const checkEnemyCollisions = () => {
    enemies.forEach(enemy => {
      if (enemy.roomX === currentRoom.x && enemy.roomY === currentRoom.y) {
        const distance = Math.sqrt(
          Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
        );
        
        if (distance < 40) {
          console.log('👻 Caught by shadow!');
          endGame(false);
        }
      }
    });
  };

  const showPuzzle = (door) => {
    setIsPaused(true);
    setCurrentPuzzle(door.puzzle);
    setScreen('puzzle');
  };

  const handlePuzzleSolved = (success) => {
    if (success) {
      // Play sound effects
      audioManager.play('puzzleSolve');
      audioManager.play('puzzleCorrect');
      audioManager.play('doorUnlock');
      
      // Unlock door
      setLockedDoors(prev => 
        prev.map(d => 
          d.puzzle === currentPuzzle ? { ...d, unlocked: true } : d
        )
      );
      
      // Update stats and award XP
      const difficulty = currentPuzzle.difficulty || 1;
      setRunStats(prev => ({
        ...prev,
        puzzlesSolved: prev.puzzlesSolved + 1,
      }));
      
      if (playerProfile) {
        const rewards = PUZZLE_REWARDS[difficulty];
        LuminaCore.addXP(playerProfile.id, rewards.xp, GAME_ID);
        LuminaCore.addCoins(playerProfile.id, rewards.coins, GAME_ID);
        // Reduced reward points ratio from *0.1 (xp/10) to *0.05 (xp/20)
        LuminaCore.addRewardPoints(playerProfile.id, Math.floor(rewards.xp * 0.05));
        console.log(`✨ Puzzle solved! +${rewards.xp} XP, +${rewards.coins} coins`);
      }
    }
    
    setCurrentPuzzle(null);
    setScreen('playing');
    setIsPaused(false);
  };

  const endGame = (escaped) => {
    console.log(escaped ? '✅ Escaped!' : '💀 Game Over');
    
    // Play appropriate sound
    if (escaped) {
      audioManager.play('escapeFound');
    } else {
      audioManager.play('caught');
    }
    
    // Award escape bonus
    if (escaped && playerProfile) {
      // Reduced escape bonus for better progression balance
      const escapeBonus = 40 + (runStats.puzzlesSolved * 5);  // Reduced from 100 + n*10 to 40 + n*5
      LuminaCore.addXP(playerProfile.id, escapeBonus, GAME_ID);
      LuminaCore.addCoins(playerProfile.id, 20, GAME_ID);
      LuminaCore.addRewardPoints(playerProfile.id, 4);  // Reduced from 10 to 4
      
      // Check achievements
      LuminaCore.checkAchievement(playerProfile.id, 'shadows_first_escape');
    }
    
    // Record game end
    if (playerProfile) {
      LuminaCore.recordGameEnd(playerProfile.id, GAME_ID, {
        score: runStats.puzzlesSolved * 10 + runStats.roomsExplored * 5,
        gamesWon: escaped ? 1 : 0,
        customStats: {
          roomsExplored: runStats.roomsExplored,
          puzzlesSolved: runStats.puzzlesSolved,
          batteriesCollected: runStats.batteriesCollected,
          timeElapsed: Math.floor(runStats.timeElapsed),
          escaped: escaped,
        },
      });
    }
    
    setScreen(escaped ? 'victory' : 'gameover');
  };

  // ==================== RENDER ====================
  return (
    <div className="w-full h-screen bg-shadows-dark overflow-hidden">
      {screen === 'title' && (
        <TitleScreen 
          onStart={initializeGame}
          playerName={playerName}
        />
      )}

      {screen === 'playing' && (
        <>
          <GameHUD
            battery={player.battery}
            hp={player.hp}
            inventory={player.inventory}
            roomsExplored={runStats.roomsExplored}
            puzzlesSolved={runStats.puzzlesSolved}
          />

          {/* Game Canvas */}
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            {/* Room */}
            <div className="relative" style={{ width: ROOM_SIZE, height: ROOM_SIZE }}>
              <div className="absolute inset-0 border-4 border-shadows-moonlight overflow-hidden">
                {/* Room Background */}
                {map.length > 0 && map[currentRoom.y] && map[currentRoom.y][currentRoom.x] && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url('../assets/backgrounds/shadows-in-the-halls/${
                        map[currentRoom.y][currentRoom.x].type === 'safe_room' ? 'safe_room' :
                        map[currentRoom.y][currentRoom.x].type === 'classroom' ? 'classroom' :
                        'hallway_dark'
                      }.png')`,
                      opacity: 0.7
                    }}
                  />
                )}
                
                {/* Dark overlay for atmosphere */}
                <div className="absolute inset-0 bg-black/40" />
                
                {/* Room content */}
                <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-body opacity-50">
                  Room {currentRoom.x}-{currentRoom.y}
                  {exitRoom && currentRoom.x === exitRoom.x && currentRoom.y === exitRoom.y && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                      <img 
                        src="../assets/sprites/shadows-in-the-halls/exit_sign.png"
                        alt="Exit"
                        className="w-32 h-16 object-contain animate-pulse"
                        style={{ filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.8))' }}
                      />
                      <div className="text-green-400 text-3xl font-bold animate-pulse">
                        EXIT
                      </div>
                    </div>
                  )}
                </div>

                {/* Items in current room */}
                {items.filter(item => item.roomX === currentRoom.x && item.roomY === currentRoom.y).map((item, i) => (
                  <div
                    key={i}
                    className="absolute animate-pulse"
                    style={{ left: item.x - 16, top: item.y - 16, width: 32, height: 32 }}
                  >
                    <img 
                      src="../assets/sprites/shadows-in-the-halls/battery_icon.png" 
                      alt="Battery"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}

                {/* Enemies in current room */}
                {enemies.filter(enemy => enemy.roomX === currentRoom.x && enemy.roomY === currentRoom.y).map((enemy) => (
                  <div
                    key={enemy.id}
                    className="absolute opacity-90"
                    style={{ left: enemy.x - 24, top: enemy.y - 24, width: 48, height: 48 }}
                  >
                    <img 
                      src={`../assets/sprites/shadows-in-the-halls/shadow_${enemy.type}.png`}
                      alt={`Shadow ${enemy.type}`}
                      className="w-full h-full object-contain animate-pulse"
                      style={{ filter: 'drop-shadow(0 0 8px rgba(74, 20, 140, 0.6))' }}
                    />
                  </div>
                ))}

                {/* Player */}
                <div
                  className="absolute transition-all flex items-center justify-center"
                  style={{ 
                    left: player.x - 24, 
                    top: player.y - 24, 
                    width: 48, 
                    height: 48,
                    fontSize: '40px',
                    filter: 'drop-shadow(0 0 8px rgba(0, 188, 212, 0.9))'
                  }}
                >
                  {getPlayerEmoji()}
                </div>

                {/* Flashlight beam */}
                <div
                  className="absolute rounded-full pointer-events-none transition-all"
                  style={{
                    left: player.x - (player.battery > LOW_BATTERY_THRESHOLD ? LIGHT_RADIUS_NORMAL : LIGHT_RADIUS_LOW),
                    top: player.y - (player.battery > LOW_BATTERY_THRESHOLD ? LIGHT_RADIUS_NORMAL : LIGHT_RADIUS_LOW),
                    width: (player.battery > LOW_BATTERY_THRESHOLD ? LIGHT_RADIUS_NORMAL : LIGHT_RADIUS_LOW) * 2,
                    height: (player.battery > LOW_BATTERY_THRESHOLD ? LIGHT_RADIUS_NORMAL : LIGHT_RADIUS_LOW) * 2,
                    background: `radial-gradient(circle, rgba(244,208,63,0.3) 0%, transparent 70%)`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </>
      )}

      {screen === 'puzzle' && currentPuzzle && (
        <PuzzleModal
          puzzle={currentPuzzle}
          onSubmit={handlePuzzleSolved}
          onClose={() => {
            setScreen('playing');
            setCurrentPuzzle(null);
            setIsPaused(false);
          }}
        />
      )}

      {screen === 'gameover' && (
        <GameOverScreen
          stats={runStats}
          onRestart={initializeGame}
          onExit={() => setScreen('title')}
          playerName={playerName}
        />
      )}

      {screen === 'victory' && (
        <VictoryScreen
          stats={runStats}
          onRestart={initializeGame}
          onExit={() => setScreen('title')}
          playerName={playerName}
        />
      )}

      {isPaused && screen === 'playing' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-white text-center">
            <h2 className="text-4xl font-horror mb-8">PAUSED</h2>
            <button
              onClick={() => setIsPaused(false)}
              className="bg-shadows-cyan text-black font-bold px-8 py-4 rounded-lg"
            >
              Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
