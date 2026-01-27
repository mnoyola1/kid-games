(() => {
  const { dom, runtime, state, collections, systems, helpers } = window.SpaceNights;

  const setStatusMessage = (message, durationSec = 2) => {
    state.statusMessage = message;
    state.statusTimer = durationSec;
  };

  const isPlayerSafe = () => {
    const { player, lsg } = runtime;
    if (!player || !lsg) return false;
    const distance = BABYLON.Vector3.Distance(player.position, lsg.position);
    return distance <= GAME_CONFIG.lsg.lightRadius && state.fuel > 0;
  };

  const getNearbyInteractable = () => {
    if (!runtime.player) return null;
    const interactRadius = 2.5;

    for (const chest of collections.chests) {
      if (chest.isOpen) continue;
      const distance = BABYLON.Vector3.Distance(runtime.player.position, chest.collisionBox.position);
      if (distance <= interactRadius) {
        return { type: 'chest', object: chest };
      }
    }

    if (runtime.workbench) {
      const distance = BABYLON.Vector3.Distance(runtime.player.position, runtime.workbench.position);
      if (distance <= interactRadius) {
        return { type: 'workbench', object: runtime.workbench };
      }
    }

    if (runtime.crewMember && !state.crewRescued && !state.crewEscortActive) {
      const distance = BABYLON.Vector3.Distance(runtime.player.position, runtime.crewMember.position);
      if (distance <= interactRadius) {
        return { type: 'crew', object: runtime.crewMember };
      }
    }

    // Also check if near LSG for refueling
    if (runtime.lsg) {
      const distance = BABYLON.Vector3.Distance(runtime.player.position, runtime.lsg.position);
      if (distance <= interactRadius && state.fuelCells > 0 && state.lsgFuel < GAME_CONFIG.lsg.maxFuel) {
        return { type: 'lsg', object: runtime.lsg };
      }
    }

    return null;
  };

  const updateInteractionPrompt = () => {
    if (!dom.interactionPrompt || !dom.interactionText || !dom.interactBtn) return;
    const interactable = getNearbyInteractable();

    if (interactable) {
      dom.interactionPrompt.classList.remove('hidden');
      if (interactable.type === 'chest') {
        dom.interactionText.textContent = 'Press E to Open';
        dom.interactBtn.textContent = 'Open';
      } else if (interactable.type === 'workbench') {
        dom.interactionText.textContent = 'Press E to Craft';
        dom.interactBtn.textContent = 'Craft';
      } else if (interactable.type === 'crew') {
        dom.interactionText.textContent = 'Press E to Escort';
        dom.interactBtn.textContent = 'Escort';
      } else if (interactable.type === 'lsg') {
        dom.interactionText.textContent = 'Press E to Refuel';
        dom.interactBtn.textContent = 'Refuel';
      }
    } else {
      dom.interactionPrompt.classList.add('hidden');
    }
  };

  const handleInteraction = () => {
    if (runtime.buildMode) {
      systems.confirmBuildPlacement();
      return;
    }
    const interactable = getNearbyInteractable();
    if (!interactable) return;

    if (interactable.type === 'chest') {
      systems.openChest(interactable.object);
    } else if (interactable.type === 'workbench') {
      systems.openCraftingPanel();
    } else if (interactable.type === 'crew') {
      startCrewEscort();
    } else if (interactable.type === 'lsg') {
      systems.refuelLSG();
    }
  };

  const setupLuminaCore = () => {
    if (typeof LuminaCore === 'undefined') return;
    const profile = LuminaCore.getActiveProfile();
    if (profile) {
      runtime.playerProfile = profile;
      LuminaCore.recordGameStart(profile.id, GAME_CONFIG.id);
    }
  };

  const setupRestart = () => {
    if (!dom.restartButton) return;
    dom.restartButton.addEventListener('click', () => {
      window.location.reload();
    });
  };

  const updateStatus = (deltaSec) => {
    if (state.statusTimer <= 0) return;
    state.statusTimer = Math.max(0, state.statusTimer - deltaSec);
    if (state.statusTimer === 0) {
      state.statusMessage = '';
    }
  };

  const updateHUD = () => {
    if (!dom.cycleIndicator || !dom.fuelMeter || !dom.fuelCells || !dom.healthMeter || !dom.phaseTimer) return;
    const phaseLabel = state.isNight ? 'Lights Off' : 'Lights On';
    dom.cycleIndicator.textContent = `Cycle ${state.cycle} / ${GAME_CONFIG.totalCycles} · ${phaseLabel}`;

    const fuelPct = Math.round((state.fuel / GAME_CONFIG.lsg.maxFuelSec) * 100);
    dom.fuelMeter.textContent = `${Math.max(0, fuelPct)}%`;
    dom.fuelCells.textContent = `Cells: ${state.fuelCells}`;
    dom.healthMeter.textContent = `${Math.round(state.health)}%`;
    if (dom.flashlightMeter) {
      const flashPct = Math.round((state.flashlightBattery / GAME_CONFIG.flashlight.maxBatterySec) * 100);
      dom.flashlightMeter.textContent = `${Math.max(0, flashPct)}% ${state.flashlightOn ? 'On' : 'Off'}`;
    }
    if (dom.fearMeter) {
      dom.fearMeter.textContent = `${Math.round(state.fear)}%`;
    }
    if (dom.scrapCount) {
      dom.scrapCount.textContent = `${state.resources.scrap}`;
    }
    if (dom.circuitCount) {
      dom.circuitCount.textContent = `${state.resources.circuits}`;
    }

    const phaseDuration = state.isNight
      ? GAME_CONFIG.cycle.nightDurationSec
      : GAME_CONFIG.cycle.dayDurationSec;
    const remaining = Math.max(0, Math.ceil(phaseDuration - state.timeInPhase));
    dom.phaseTimer.textContent = `${remaining}s`;

    if (state.statusTimer > 0) {
      dom.statusIndicator.textContent = state.statusMessage;
      return;
    }

    if (state.fuel <= 0) {
      dom.statusIndicator.textContent = 'LSG offline - Phantom unleashed!';
    } else if (state.isNight) {
      dom.statusIndicator.textContent = isPlayerSafe() ? 'Safe zone active' : 'Lights off - stay close to LSG';
    } else {
      dom.statusIndicator.textContent = 'Systems stable';
    }
  };

  const awardCycleRewards = () => {
    if (!runtime.playerProfile || typeof LuminaCore === 'undefined') return;
    LuminaCore.addXP(runtime.playerProfile.id, 10, GAME_CONFIG.id);
    LuminaCore.addCoins(runtime.playerProfile.id, 5, GAME_CONFIG.id);
  };

  const endGame = (victory) => {
    state.gameOver = true;
    if (dom.gameMessage) {
      dom.gameMessage.classList.remove('hidden');
    }
    if (victory) {
      if (dom.gameMessageTitle) dom.gameMessageTitle.textContent = 'Rescue Window Reached!';
      if (dom.gameMessageBody) dom.gameMessageBody.textContent = 'You survived all 99 cycles. The rescue team is inbound.';
    } else {
      if (dom.gameMessageTitle) dom.gameMessageTitle.textContent = 'The Phantom Caught You';
      if (dom.gameMessageBody) dom.gameMessageBody.textContent = 'Respawn at the LSG and regroup for the next run.';
    }

    if (runtime.playerProfile && typeof LuminaCore !== 'undefined') {
      LuminaCore.recordGameEnd(runtime.playerProfile.id, GAME_CONFIG.id, {
        cyclesSurvived: Math.max(0, state.cycle - (state.isNight ? 1 : 0)),
        survived: victory ? 1 : 0
      });
    }
  };

  const startCrewEscort = () => {
    if (!runtime.crewMember || state.crewEscortActive || state.crewRescued) return;
    state.crewEscortActive = true;
    if (dom.crewStatus) {
      dom.crewStatus.classList.remove('hidden');
    }
    setStatusMessage('Crew member following you', 2);
  };

  const updateCrewEscort = (deltaSec) => {
    if (!runtime.crewMember || !state.crewEscortActive) return;
    const toPlayer = runtime.player.position.subtract(runtime.crewMember.position);
    toPlayer.y = 0;
    if (toPlayer.lengthSquared() > 0.5) {
      toPlayer.normalize();
      runtime.crewMember.position = runtime.crewMember.position.add(toPlayer.scale(1.4 * deltaSec));
    }
    const distanceToLSG = BABYLON.Vector3.Distance(runtime.crewMember.position, runtime.lsg.position);
    if (distanceToLSG < 2.5) {
      state.crewEscortActive = false;
      state.crewRescued = true;
      if (dom.crewStatus) {
        dom.crewStatus.classList.add('hidden');
      }
      runtime.crewMember.dispose();
      setStatusMessage('Crew member rescued! +25% crafting speed', 3);
    }
  };

  const updatePickups = (deltaSec) => {
    if (!collections.pickups.length) return;
    const pickupRadius = GAME_CONFIG.resources.pickupRadius;

    collections.pickups = collections.pickups.filter((pickup) => {
      if (!pickup.mesh || pickup.mesh.isDisposed()) {
        return false;
      }

      pickup.bobOffset += deltaSec * 2.2;
      pickup.mesh.position.y = pickup.baseY + Math.sin(pickup.bobOffset) * 0.15;
      pickup.mesh.rotation.y += deltaSec;

      const distance = BABYLON.Vector3.Distance(runtime.player.position, pickup.mesh.position);
      if (distance <= pickupRadius) {
        collectPickup(pickup.type);
        pickup.mesh.dispose();
        return false;
      }
      return true;
    });
  };

  const collectPickup = (type) => {
    if (type === 'scrap') {
      state.resources.scrap += GAME_CONFIG.resources.scrapPerPickup;
      setStatusMessage('Collected scrap');
    } else if (type === 'circuit') {
      state.resources.circuits += GAME_CONFIG.resources.circuitsPerPickup;
      setStatusMessage('Recovered circuit components');
    } else {
      state.fuelCells += GAME_CONFIG.resources.fuelCellsPerPickup;
      setStatusMessage('Fuel cell found');
    }
    systems.playPickupSfx(type);
  };

  helpers.setStatusMessage = setStatusMessage;
  helpers.isPlayerSafe = isPlayerSafe;

  systems.getNearbyInteractable = getNearbyInteractable;
  systems.updateInteractionPrompt = updateInteractionPrompt;
  systems.handleInteraction = handleInteraction;
  systems.setupLuminaCore = setupLuminaCore;
  systems.setupRestart = setupRestart;
  systems.updateStatus = updateStatus;
  systems.updateHUD = updateHUD;
  systems.awardCycleRewards = awardCycleRewards;
  systems.endGame = endGame;
  systems.startCrewEscort = startCrewEscort;
  systems.updateCrewEscort = updateCrewEscort;
  systems.updatePickups = updatePickups;
  systems.collectPickup = collectPickup;
  systems.isPlayerSafe = isPlayerSafe;
})();
