// ==================== PHYSICS ENGINE ====================
class PhysicsEngine {
  constructor(level) {
    this.level = level;
  }
  
  // Check collision between two rectangles
  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }
  
  // Check if point is on platform
  isOnPlatform(x, y, width, height, platforms) {
    const playerBottom = y + height;
    const playerCenterX = x + width / 2;
    
    for (const platform of platforms) {
      if (
        playerCenterX >= platform.x &&
        playerCenterX <= platform.x + platform.width &&
        playerBottom >= platform.y - 5 &&
        playerBottom <= platform.y + 10
      ) {
        return { onPlatform: true, platformY: platform.y };
      }
    }
    
    return { onPlatform: false, platformY: null };
  }
  
  // Check collision with collectibles
  checkCollectibleCollision(x, y, width, height, collectibles) {
    const playerRect = { x, y, width, height };
    
    for (const collectible of collectibles) {
      if (collectible.collected) continue;
      
      const collectibleRect = {
        x: collectible.x - 15,
        y: collectible.y - 15,
        width: 30,
        height: 30
      };
      
      if (this.checkCollision(playerRect, collectibleRect)) {
        return collectible;
      }
    }
    
    return null;
  }
  
  // Check collision with enemies
  checkEnemyCollision(x, y, width, height, enemies) {
    const playerRect = { x, y, width, height };
    
    for (const enemy of enemies) {
      const enemyRect = {
        x: enemy.x,
        y: enemy.y,
        width: enemy.width,
        height: enemy.height
      };
      
      if (this.checkCollision(playerRect, enemyRect)) {
        return enemy;
      }
    }
    
    return null;
  }
  
  // Check checkpoint collision
  checkCheckpointCollision(x, y, width, height, checkpoints) {
    const playerRect = { x, y, width, height };
    
    for (const checkpoint of checkpoints) {
      if (checkpoint.activated) continue;
      
      const checkpointRect = {
        x: checkpoint.x - 30,
        y: checkpoint.y - 30,
        width: 60,
        height: 60
      };
      
      if (this.checkCollision(playerRect, checkpointRect)) {
        return checkpoint;
      }
    }
    
    return null;
  }
  
  // Update enemy positions
  updateEnemies(enemies, platforms, deltaTime) {
    enemies.forEach(enemy => {
      // Move enemy
      enemy.x += enemy.speed * enemy.direction * deltaTime;
      
      // Check platform boundaries
      let onPlatform = false;
      for (const platform of platforms) {
        if (
          enemy.x >= platform.x &&
          enemy.x + enemy.width <= platform.x + platform.width &&
          enemy.y + enemy.height >= platform.y - 5 &&
          enemy.y + enemy.height <= platform.y + 5
        ) {
          onPlatform = true;
          
          // Check if enemy reached platform edge
          if (enemy.x <= platform.x || enemy.x + enemy.width >= platform.x + platform.width) {
            enemy.direction *= -1;
          }
        }
      }
      
      // If not on platform, reverse direction
      if (!onPlatform && enemy.y < 700) {
        enemy.direction *= -1;
      }
    });
  }
}
