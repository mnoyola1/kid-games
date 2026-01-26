// ==================== DUNGEON GENERATION ====================

/**
 * Generate a procedural dungeon floor
 * @param {number} floor Floor number (1-indexed)
 * @returns {Object} Dungeon data with rooms
 */
function generateDungeon(floor) {
  const roomCount = 8 + floor * 2; // More rooms per floor
  const rooms = [];
  
  // Start room
  rooms.push({
    id: 0,
    type: ROOM_TYPES.START,
    connections: [1],
    cleared: true,
    visited: true
  });
  
  // Generate normal rooms
  for (let i = 1; i < roomCount - 1; i++) {
    const roomType = selectRoomType(floor, i, roomCount);
    rooms.push({
      id: i,
      type: roomType,
      connections: [],
      cleared: false,
      visited: false,
      ...getRoomContent(roomType, floor)
    });
  }
  
  // Boss room (last room)
  rooms.push({
    id: roomCount - 1,
    type: ROOM_TYPES.BOSS,
    connections: [],
    cleared: false,
    visited: false,
    enemy: generateBoss(floor)
  });
  
  // Create connections (linear path with some branches)
  for (let i = 0; i < rooms.length - 1; i++) {
    // Main path
    if (!rooms[i].connections.includes(i + 1)) {
      rooms[i].connections.push(i + 1);
    }
    
    // Add some branches (30% chance)
    if (Math.random() < 0.3 && i < rooms.length - 2) {
      const branch = Math.min(i + 2, rooms.length - 1);
      if (!rooms[i].connections.includes(branch)) {
        rooms[i].connections.push(branch);
      }
    }
  }
  
  // Deduplicate all connections
  rooms.forEach(room => {
    room.connections = [...new Set(room.connections)];
  });
  
  return {
    floor,
    rooms,
    currentRoom: 0,
    roomsCleared: 0
  };
}

/**
 * Select room type based on floor and position
 */
function selectRoomType(floor, index, total) {
  const position = index / total;
  
  // Early rooms: more forges
  if (position < 0.3 && Math.random() < 0.3) {
    return ROOM_TYPES.FORGE;
  }
  
  // Mid rooms: mix of combat and treasure
  if (position < 0.7) {
    return Math.random() < 0.7 ? ROOM_TYPES.COMBAT : ROOM_TYPES.TREASURE;
  }
  
  // Late rooms: mostly combat
  return Math.random() < 0.85 ? ROOM_TYPES.COMBAT : ROOM_TYPES.EMPTY;
}

/**
 * Generate room content based on type
 */
function getRoomContent(type, floor) {
  switch (type) {
    case ROOM_TYPES.COMBAT:
      return {
        enemies: generateEnemies(floor),
        reward: { coins: 5 + floor * 5, xp: 10 + floor * 10 }
      };
      
    case ROOM_TYPES.FORGE:
      return {
        craftingWords: getRandomWords(floor, 3),
        availableItems: getAvailableItems(floor)
      };
      
    case ROOM_TYPES.TREASURE:
      return {
        chest: {
          coins: 20 + floor * 10,
          item: getRandomItem(floor)
        }
      };
      
    case ROOM_TYPES.EMPTY:
      return {};
      
    default:
      return {};
  }
}

/**
 * Generate enemies for a combat room
 */
function generateEnemies(floor) {
  const possibleEnemies = ENEMIES.filter(e => e.floor <= floor && !e.isBoss);
  const count = Math.min(1 + Math.floor(floor / 2), 3);
  const enemies = [];
  
  for (let i = 0; i < count; i++) {
    const template = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
    enemies.push({
      ...template,
      health: template.health * (1 + floor * 0.2), // Scale with floor
      maxHealth: template.health * (1 + floor * 0.2),
      attack: Math.ceil(template.attack * (1 + floor * 0.15))
    });
  }
  
  return enemies;
}

/**
 * Generate boss for boss room
 */
function generateBoss(floor) {
  const boss = ENEMIES.find(e => e.isBoss);
  return {
    ...boss,
    health: boss.health * (1 + floor * 0.5),
    maxHealth: boss.health * (1 + floor * 0.5),
    attack: Math.ceil(boss.attack * (1 + floor * 0.3))
  };
}

/**
 * Get random words for crafting
 */
function getRandomWords(floor, count) {
  let pool = [...WORD_LISTS.easy];
  if (floor >= 2) pool.push(...WORD_LISTS.medium);
  if (floor >= 3) pool.push(...WORD_LISTS.hard);
  
  // Shuffle and take count
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get items available for crafting at this floor
 */
function getAvailableItems(floor) {
  return ITEMS.filter(item => {
    const rarityFloor = {
      common: 1,
      uncommon: 1,
      rare: 2,
      epic: 3,
      legendary: 3
    };
    return floor >= (rarityFloor[item.rarity] || 1);
  });
}

/**
 * Get random item as treasure
 */
function getRandomItem(floor) {
  const available = getAvailableItems(floor);
  if (available.length === 0) return null;
  
  // Weight by rarity (lower rarity = higher chance)
  const weights = {
    common: 50,
    uncommon: 30,
    rare: 15,
    epic: 4,
    legendary: 1
  };
  
  const weightedPool = [];
  available.forEach(item => {
    const weight = weights[item.rarity] || 1;
    for (let i = 0; i < weight; i++) {
      weightedPool.push(item);
    }
  });
  
  return weightedPool[Math.floor(Math.random() * weightedPool.length)];
}

/**
 * Move to next room
 */
function moveToRoom(dungeon, roomId) {
  const room = dungeon.rooms[roomId];
  if (!room) return false;
  
  room.visited = true;
  dungeon.currentRoom = roomId;
  return true;
}

/**
 * Clear current room (mark as complete)
 */
function clearRoom(dungeon) {
  const room = dungeon.rooms[dungeon.currentRoom];
  if (room && !room.cleared) {
    room.cleared = true;
    dungeon.roomsCleared++;
    return true;
  }
  return false;
}

/**
 * Get available exits from current room
 */
function getAvailableExits(dungeon) {
  const currentRoom = dungeon.rooms[dungeon.currentRoom];
  if (!currentRoom) return [];
  
  // Deduplicate connection IDs and map to rooms
  const uniqueConnections = [...new Set(currentRoom.connections)];
  return uniqueConnections
    .map(id => dungeon.rooms[id])
    .filter(room => room !== undefined);
}
