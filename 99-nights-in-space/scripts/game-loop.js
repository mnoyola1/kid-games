(() => {
  const { dom, constants, runtime, state, inputState, touchState, collections, systems, helpers } = window.SpaceNights;

  const toggleFlashlight = () => {
    if (state.flashlightBattery <= 0) {
      helpers.setStatusMessage?.('Flashlight battery empty', 2);
      return;
    }
    state.flashlightOn = !state.flashlightOn;
    updateFlashlight(0);
  };

  const updateFlashlight = (deltaSec) => {
    const { flashlight, camera } = runtime;
    if (!flashlight || !camera) return;
    flashlight.position = camera.position.clone();
    flashlight.direction = camera.getForwardRay().direction;
    if (state.flashlightOn && state.flashlightBattery > 0) {
      flashlight.intensity = 2.2;
      const drain = GAME_CONFIG.flashlight.drainPerSec *
        (state.isNight ? GAME_CONFIG.flashlight.nightDrainMultiplier : 1);
      state.flashlightBattery = Math.max(0, state.flashlightBattery - drain * deltaSec);
      if (state.flashlightBattery <= 0) {
        state.flashlightOn = false;
        flashlight.intensity = 0;
      }
    } else {
      flashlight.intensity = 0;
      state.flashlightBattery = Math.min(
        GAME_CONFIG.flashlight.maxBatterySec,
        state.flashlightBattery + GAME_CONFIG.flashlight.rechargePerSec * deltaSec
      );
    }
  };

  const update = (deltaSec) => {
    if (state.gameOver) return;
    updateCycle(deltaSec);
    updateMovement(deltaSec);
    updateLSG(deltaSec);
    updateFlashlight(deltaSec);
    updatePhantom(deltaSec);
    updateEnemies(deltaSec);
    updateTurrets(deltaSec);
    systems.updatePickups(deltaSec);
    systems.updateBuildPreview();
    updateFear(deltaSec);
    systems.updateCrewEscort(deltaSec);
    systems.updateStatus(deltaSec);
    systems.updateInteractionPrompt();
    systems.updateHUD();
  };

  const updateCycle = (deltaSec) => {
    const phaseDuration = state.isNight
      ? GAME_CONFIG.cycle.nightDurationSec
      : GAME_CONFIG.cycle.dayDurationSec;
    state.timeInPhase += deltaSec;

    if (state.timeInPhase >= phaseDuration) {
      state.timeInPhase = 0;
      if (state.isNight) {
        state.cycle += 1;
        systems.awardCycleRewards();
        if (state.cycle > GAME_CONFIG.totalCycles) {
          systems.endGame(true);
          return;
        }
      }
      state.isNight = !state.isNight;
      updateLighting();
      if (state.isNight) {
        spawnPhantom();
        systems.spawnEnemiesForCycle();
        helpers.setStatusMessage?.('Lights Off - stay near the LSG', 3);
      } else {
        helpers.setStatusMessage?.('Lights On - explore the station', 3);
      }
    }
  };

  const updateLighting = () => {
    const { dayLight, nightLight } = runtime;
    if (!dayLight || !nightLight) return;

    if (state.isNight || state.fuel <= 0) {
      dayLight.intensity = 0.2;
      nightLight.intensity = 0.8;
    } else {
      dayLight.intensity = 0.9;
      nightLight.intensity = 0;
    }
    systems.updateAmbientAudio();
  };

  const updateMovement = (deltaSec) => {
    const { player, camera } = runtime;
    if (!player || !camera) return;

    const moveForward = inputState.forward || touchState.up;
    const moveBackward = inputState.backward || touchState.down;
    const moveLeft = inputState.left || touchState.left;
    const moveRight = inputState.right || touchState.right;

    const forward = camera.getForwardRay().direction;
    forward.y = 0;
    forward.normalize();
    const right = new BABYLON.Vector3(forward.z, 0, -forward.x);

    let move = BABYLON.Vector3.Zero();
    if (moveForward) move = move.add(forward);
    if (moveBackward) move = move.subtract(forward);
    if (moveLeft) move = move.subtract(right);
    if (moveRight) move = move.add(right);

    // Horizontal movement
    if (move.lengthSquared() > 0) {
      move.normalize();
      const speed = inputState.sprint ? GAME_CONFIG.player.sprintSpeed : GAME_CONFIG.player.walkSpeed;
      const horizontalVelocity = move.scale(speed * deltaSec);
      player.moveWithCollisions(horizontalVelocity);
      player.rotation.y = Math.atan2(move.x, move.z);
    }

    // Simple timer-based jump (no physics drift)
    if ((inputState.jump || touchState.jump) && !runtime.jump.isJumping) {
      // Start jump
      runtime.jump.isJumping = true;
      runtime.jump.timer = 0;
      runtime.jump.direction = 1; // Going up
      inputState.jump = false;
      touchState.jump = false;
    }

    // Process jump animation
    if (runtime.jump.isJumping) {
      runtime.jump.timer += deltaSec;

      if (runtime.jump.direction === 1) {
        // Going up - use smooth curve
        const progress = Math.min(runtime.jump.timer / constants.JUMP_DURATION, 1);
        const height = constants.JUMP_HEIGHT * Math.sin(progress * Math.PI / 2); // Ease out
        player.position.y = constants.GROUND_Y + height;

        if (progress >= 1) {
          // Reached peak, start coming down
          runtime.jump.direction = -1;
          runtime.jump.timer = 0;
        }
      } else {
        // Coming down - use smooth curve
        const progress = Math.min(runtime.jump.timer / constants.JUMP_DURATION, 1);
        const height = constants.JUMP_HEIGHT * Math.cos(progress * Math.PI / 2); // Ease in
        player.position.y = constants.GROUND_Y + height;

        if (progress >= 1) {
          // Landed
          runtime.jump.isJumping = false;
          player.position.y = constants.GROUND_Y;
        }
      }
    } else {
      // Not jumping - always keep player at ground level (prevents drift)
      player.position.y = constants.GROUND_Y;
    }

    camera.target = player.position.clone();
  };

  const updateLSG = (deltaSec) => {
    const drainRate = state.isNight ? 1 : GAME_CONFIG.cycle.dayDrainMultiplier;
    state.fuel = Math.max(0, state.fuel - drainRate * deltaSec);

    if (inputState.refuel || touchState.refuel) {
      tryRefuel();
      inputState.refuel = false;
      touchState.refuel = false;
    }

    if (state.fuel <= 0 && !state.phantomAggressive) {
      state.phantomAggressive = true;
      updateLighting();
      spawnPhantom();
      helpers.setStatusMessage?.('LSG offline - Phantom unleashed!', 3);
    }
  };

  const tryRefuel = () => {
    if (state.fuelCells <= 0) return false;
    const distance = BABYLON.Vector3.Distance(runtime.player.position, runtime.lsg.position);
    if (distance > 2.5) return false;

    state.fuelCells -= 1;
    state.fuel = Math.min(GAME_CONFIG.lsg.maxFuelSec, state.fuel + GAME_CONFIG.lsg.fuelPerCellSec);
    if (state.fuel > 0) {
      state.phantomAggressive = false;
      updateLighting();
    }
    helpers.setStatusMessage?.('LSG refueled');
    systems.playRefuelSfx();
    return true;
  };

  const refuelLSG = () => {
    tryRefuel();
  };

  const spawnPhantom = () => {
    if (!runtime.phantom) return;
    runtime.phantom.isVisible = true;
    const angle = Math.random() * Math.PI * 2;
    const radius = 10;
    runtime.phantom.position = new BABYLON.Vector3(
      Math.cos(angle) * radius,
      0.8,
      Math.sin(angle) * radius
    );
  };

  const updatePhantom = (deltaSec) => {
    const { phantom, lsg, player } = runtime;
    if (!phantom || !lsg || !player) return;

    if (!state.isNight && state.fuel > 0) {
      phantom.isVisible = false;
      return;
    }

    phantom.isVisible = true;
    const distanceToLSG = BABYLON.Vector3.Distance(phantom.position, lsg.position);
    const distanceToPlayer = BABYLON.Vector3.Distance(phantom.position, player.position);
    const playerSafe = helpers.isPlayerSafe?.();
    const shouldHold = playerSafe && !state.phantomAggressive;

    if (!shouldHold) {
      const direction = player.position.subtract(phantom.position);
      direction.y = 0;
      if (direction.lengthSquared() > 0.01) {
        direction.normalize();
        const speed = state.phantomAggressive ? GAME_CONFIG.phantom.aggressiveSpeed : GAME_CONFIG.phantom.speed;
        phantom.position = phantom.position.add(direction.scale(speed * deltaSec));
      }
    } else if (distanceToLSG < GAME_CONFIG.lsg.lightRadius - 0.8) {
      const away = phantom.position.subtract(lsg.position);
      away.y = 0;
      if (away.lengthSquared() > 0.01) {
        away.normalize();
        phantom.position = phantom.position.add(away.scale(0.6 * deltaSec));
      }
    }

    if (distanceToPlayer < GAME_CONFIG.phantom.attackRange && !playerSafe) {
      state.health = Math.max(0, state.health - GAME_CONFIG.phantom.damagePerSecond * deltaSec);
      systems.playDamageSfx();
      if (state.health <= 0) {
        systems.endGame(false);
      }
    }
  };

  const updateEnemies = (deltaSec) => {
    if (!collections.enemies.length) return;
    collections.enemies = collections.enemies.filter((enemy) => enemy.hp > 0 && !enemy.mesh.isDisposed());
    collections.enemies.forEach((enemy) => {
      const config = GAME_CONFIG.enemies[enemy.type];
      const toPlayer = runtime.player.position.subtract(enemy.mesh.position);
      toPlayer.y = 0;
      const distance = toPlayer.length();
      const chaseSpeed = distance < 8 ? config.speed : config.speed * 0.6;
      const distanceToLSG = runtime.lsg ? BABYLON.Vector3.Distance(enemy.mesh.position, runtime.lsg.position) : 999;
      const inSafeZone = runtime.lsg && distanceToLSG < GAME_CONFIG.lsg.lightRadius - 0.4;

      if (distance > 0.01) {
        toPlayer.normalize();
        if (inSafeZone && !state.phantomAggressive) {
          const away = enemy.mesh.position.subtract(runtime.lsg.position);
          away.y = 0;
          if (away.lengthSquared() > 0.01) {
            away.normalize();
            enemy.mesh.position = enemy.mesh.position.add(away.scale(chaseSpeed * deltaSec));
          }
        } else {
          enemy.mesh.position = enemy.mesh.position.add(toPlayer.scale(chaseSpeed * deltaSec));
        }
      }

      // Simple idle bob + sway animation on visual root
      if (enemy.visualRoot) {
        enemy.animOffset += deltaSec * 3.2;
        enemy.visualRoot.position.y = -1.0 + Math.sin(enemy.animOffset) * 0.08;
        enemy.visualRoot.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
        enemy.visualRoot.scaling = new BABYLON.Vector3(enemy.baseScale, enemy.baseScale, enemy.baseScale);
      } else {
        enemy.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
      }

      if (distance < config.attackRange) {
        state.health = Math.max(0, state.health - config.damagePerSecond * deltaSec);
        systems.playDamageSfx();
        if (enemy.visualRoot) {
          const pulse = 1 + Math.sin(enemy.animOffset * 6) * 0.05;
          enemy.visualRoot.scaling = new BABYLON.Vector3(
            enemy.baseScale * pulse,
            enemy.baseScale * pulse,
            enemy.baseScale * pulse
          );
        }
        if (state.health <= 0) {
          systems.endGame(false);
        }
      }
    });
  };

  const updateTurrets = (deltaSec) => {
    if (!collections.turrets.length || !collections.enemies.length) return;
    collections.turrets.forEach((turret) => {
      turret.cooldown = Math.max(0, turret.cooldown - deltaSec);
      if (turret.cooldown > 0) return;
      const target = collections.enemies.reduce((closest, enemy) => {
        const dist = BABYLON.Vector3.Distance(turret.mesh.position, enemy.mesh.position);
        if (!closest || dist < closest.dist) return { enemy, dist };
        return closest;
      }, null);
      if (target && target.dist < 6) {
        target.enemy.hp -= 10;
        turret.cooldown = 0.6;
      }
    });
  };

  const updateFear = (deltaSec) => {
    let fearGain = 0;
    if (state.isNight) fearGain += GAME_CONFIG.fear.nightGainPerSec;
    if (!helpers.isPlayerSafe?.()) fearGain += 0.4;
    if (state.health < 40) fearGain += GAME_CONFIG.fear.lowHealthGainPerSec;
    if (runtime.phantom && runtime.phantom.isVisible) {
      const distance = BABYLON.Vector3.Distance(runtime.phantom.position, runtime.player.position);
      if (distance < 6) fearGain += GAME_CONFIG.fear.phantomGainPerSec;
    }
    if (fearGain > 0) {
      state.fear = Math.min(GAME_CONFIG.fear.max, state.fear + fearGain * deltaSec);
    } else {
      state.fear = Math.max(0, state.fear - GAME_CONFIG.fear.safeLossPerSec * deltaSec);
    }
    if (dom.fearOverlay) {
      const alpha = Math.min(0.6, state.fear / GAME_CONFIG.fear.max * 0.6);
      dom.fearOverlay.style.background = `rgba(30, 10, 40, ${alpha})`;
    }
  };

  systems.toggleFlashlight = toggleFlashlight;
  systems.updateFlashlight = updateFlashlight;
  systems.update = update;
  systems.updateCycle = updateCycle;
  systems.updateLighting = updateLighting;
  systems.updateMovement = updateMovement;
  systems.updateLSG = updateLSG;
  systems.tryRefuel = tryRefuel;
  systems.refuelLSG = refuelLSG;
  systems.spawnPhantom = spawnPhantom;
  systems.updatePhantom = updatePhantom;
  systems.updateEnemies = updateEnemies;
  systems.updateTurrets = updateTurrets;
  systems.updateFear = updateFear;
})();
