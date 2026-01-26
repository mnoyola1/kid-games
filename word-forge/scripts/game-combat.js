// ==================== COMBAT SYSTEM ====================

/**
 * Initialize combat state
 */
function initCombat(enemies, player) {
  return {
    enemies: enemies.map((e, i) => ({ ...e, id: `enemy_${i}`, currentHealth: e.health })),
    player: {
      ...player,
      currentHealth: player.health
    },
    turn: 'player',
    currentWord: null,
    combo: 0,
    log: []
  };
}

/**
 * Start player turn - generate word to spell
 */
function startPlayerTurn(combat, floor) {
  const word = getRandomCombatWord(floor);
  combat.currentWord = word;
  combat.turn = 'player';
  return word;
}

/**
 * Get random word for combat based on floor difficulty
 */
function getRandomCombatWord(floor) {
  let pool = [...WORD_LISTS.easy];
  if (floor >= 2) pool.push(...WORD_LISTS.medium);
  if (floor >= 3) pool.push(...WORD_LISTS.hard);
  
  return pool[Math.floor(Math.random() * pool.length)].toLowerCase();
}

/**
 * Process player spelling attempt
 */
function processSpelling(combat, input, onCorrect, onWrong) {
  const correct = input.toLowerCase() === combat.currentWord;
  
  if (correct) {
    combat.combo++;
    if (onCorrect) onCorrect(combat.combo);
    return true;
  } else {
    combat.combo = 0;
    if (onWrong) onWrong();
    return false;
  }
}

/**
 * Player attacks enemy
 */
function playerAttack(combat, targetIndex) {
  const target = combat.enemies[targetIndex];
  if (!target || target.currentHealth <= 0) return null;
  
  const equipped = combat.player.equipped;
  const weapon = equipped.weapon;
  
  // Calculate damage
  let damage = combat.player.attack;
  if (weapon) {
    damage += weapon.attack;
  }
  
  // Combo bonus
  if (combat.combo > 1) {
    damage = Math.floor(damage * (1 + combat.combo * 0.1));
  }
  
  // Apply damage
  target.currentHealth -= damage;
  
  combat.log.push({
    type: 'player_attack',
    damage,
    target: target.name,
    combo: combat.combo
  });
  
  // Check if enemy died
  if (target.currentHealth <= 0) {
    target.currentHealth = 0;
    combat.log.push({
      type: 'enemy_defeated',
      enemy: target.name,
      xp: target.xp,
      coins: target.coins
    });
  }
  
  return { damage, killed: target.currentHealth <= 0 };
}

/**
 * Use item ability (triggered by spelling special word)
 */
function useItemAbility(combat, item) {
  if (!item || !item.triggerWord) return null;
  
  const result = { type: 'ability', item: item.name };
  
  // Weapon abilities
  if (item.type === 'weapon') {
    // Find first living enemy
    const target = combat.enemies.find(e => e.currentHealth > 0);
    if (target) {
      const damage = Math.floor(item.attack * 1.5); // 50% bonus damage
      target.currentHealth -= damage;
      result.damage = damage;
      result.target = target.name;
      
      if (target.currentHealth <= 0) {
        target.currentHealth = 0;
        result.killed = true;
      }
    }
  }
  
  // Healing
  if (item.id === 'healing_potion') {
    const healed = Math.min(item.heal, combat.player.maxHealth - combat.player.currentHealth);
    combat.player.currentHealth += healed;
    result.healed = healed;
  }
  
  combat.log.push(result);
  return result;
}

/**
 * Enemy turn - all living enemies attack
 */
function enemyTurn(combat) {
  const livingEnemies = combat.enemies.filter(e => e.currentHealth > 0);
  let totalDamage = 0;
  
  livingEnemies.forEach(enemy => {
    let damage = enemy.attack;
    
    // Apply player defense
    const equipped = combat.player.equipped;
    if (equipped.armor) {
      damage = Math.max(1, damage - equipped.armor.defense);
    }
    
    totalDamage += damage;
    
    combat.log.push({
      type: 'enemy_attack',
      enemy: enemy.name,
      damage
    });
  });
  
  combat.player.currentHealth -= totalDamage;
  
  return {
    totalDamage,
    playerDead: combat.player.currentHealth <= 0
  };
}

/**
 * Check if combat is over
 */
function isCombatOver(combat) {
  const allEnemiesDead = combat.enemies.every(e => e.currentHealth <= 0);
  const playerDead = combat.player.currentHealth <= 0;
  
  if (allEnemiesDead) {
    return { over: true, victory: true };
  }
  
  if (playerDead) {
    return { over: true, victory: false };
  }
  
  return { over: false };
}

/**
 * Calculate combat rewards
 */
function calculateRewards(combat) {
  const defeated = combat.enemies.filter(e => e.currentHealth <= 0);
  
  return {
    xp: defeated.reduce((sum, e) => sum + e.xp, 0),
    coins: defeated.reduce((sum, e) => sum + e.coins, 0),
    comboBonus: combat.combo >= 5 ? Math.floor(combat.combo * 5) : 0
  };
}

/**
 * Defend action (reduce next damage)
 */
function playerDefend(combat) {
  combat.defending = true;
  combat.log.push({
    type: 'player_defend'
  });
}

/**
 * Apply defend bonus if active
 */
function applyDefendBonus(combat, damage) {
  if (combat.defending) {
    combat.defending = false;
    return Math.floor(damage * 0.5); // 50% damage reduction
  }
  return damage;
}
