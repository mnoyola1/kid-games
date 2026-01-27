(() => {
  const warn = (message) => {
    console.warn(`[99 Nights Config] ${message}`);
  };

  const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

  const applyDefaults = (target, defaults, path = []) => {
    if (!isObject(target) || !isObject(defaults)) return;
    Object.entries(defaults).forEach(([key, value]) => {
      const nextPath = [...path, key];
      if (isObject(value)) {
        if (!isObject(target[key])) {
          target[key] = {};
          warn(`Created missing object at ${nextPath.join('.')}`);
        }
        applyDefaults(target[key], value, nextPath);
      } else if (target[key] === undefined) {
        target[key] = value;
        warn(`Applied default for ${nextPath.join('.')}`);
      }
    });
  };

  const ensureNumber = (target, key, fallback, path = []) => {
    const value = target[key];
    if (typeof value !== 'number' || Number.isNaN(value)) {
      target[key] = fallback;
      warn(`Invalid number at ${[...path, key].join('.')}, set to ${fallback}`);
    }
  };

  const ensureArray = (target, key, fallback, path = []) => {
    if (!Array.isArray(target[key])) {
      target[key] = fallback;
      warn(`Invalid array at ${[...path, key].join('.')}, reset to default`);
    }
  };

  if (typeof GAME_CONFIG === 'undefined') {
    warn('GAME_CONFIG not found. Ensure game-config.js loads first.');
    return;
  }

  const defaults = {
    id: '99-nights-in-space',
    totalCycles: 99,
    cycle: {
      dayDurationSec: 240,
      nightDurationSec: 150,
      dayDrainMultiplier: 0.25
    },
    player: {
      walkSpeed: 3.6,
      sprintSpeed: 5.4,
      maxHealth: 100
    },
    lsg: {
      startFuelSec: 180,
      maxFuelSec: 360,
      fuelPerCellSec: 90,
      startCells: 3,
      lightRadius: 7.5
    },
    resources: {
      pickupRadius: 1.4,
      scrapPerPickup: 3,
      circuitsPerPickup: 1,
      fuelCellsPerPickup: 1
    },
    phantom: {
      speed: 1.9,
      aggressiveSpeed: 2.6,
      damagePerSecond: 18,
      attackRange: 1.3
    },
    flashlight: {
      maxBatterySec: 180,
      drainPerSec: 0.7,
      nightDrainMultiplier: 1.6,
      rechargePerSec: 0.5
    },
    crafting: {
      recipes: []
    },
    enemies: {
      voidHound: {
        speed: 2.4,
        damagePerSecond: 12,
        attackRange: 1.2,
        hp: 50
      },
      cargoBeast: {
        speed: 1.4,
        damagePerSecond: 22,
        attackRange: 1.6,
        hp: 150
      },
      corruptedCrew: {
        speed: 1.6,
        damagePerSecond: 10,
        attackRange: 1.1,
        hp: 40
      }
    },
    chests: {
      tiers: []
    },
    fear: {
      max: 100,
      nightGainPerSec: 0.5,
      phantomGainPerSec: 2.0,
      lowHealthGainPerSec: 0.8,
      safeLossPerSec: 1.8
    },
    audio: {
      masterVolume: 0.35,
      ambientVolume: 0.28,
      nightBoost: 0.18,
      sfxVolume: 0.5
    }
  };

  applyDefaults(GAME_CONFIG, defaults);

  ensureNumber(GAME_CONFIG, 'totalCycles', defaults.totalCycles, []);
  ensureNumber(GAME_CONFIG.cycle, 'dayDurationSec', defaults.cycle.dayDurationSec, ['cycle']);
  ensureNumber(GAME_CONFIG.cycle, 'nightDurationSec', defaults.cycle.nightDurationSec, ['cycle']);
  ensureNumber(GAME_CONFIG.cycle, 'dayDrainMultiplier', defaults.cycle.dayDrainMultiplier, ['cycle']);
  ensureNumber(GAME_CONFIG.player, 'walkSpeed', defaults.player.walkSpeed, ['player']);
  ensureNumber(GAME_CONFIG.player, 'sprintSpeed', defaults.player.sprintSpeed, ['player']);
  ensureNumber(GAME_CONFIG.player, 'maxHealth', defaults.player.maxHealth, ['player']);
  ensureNumber(GAME_CONFIG.lsg, 'startFuelSec', defaults.lsg.startFuelSec, ['lsg']);
  ensureNumber(GAME_CONFIG.lsg, 'maxFuelSec', defaults.lsg.maxFuelSec, ['lsg']);
  ensureNumber(GAME_CONFIG.lsg, 'fuelPerCellSec', defaults.lsg.fuelPerCellSec, ['lsg']);
  ensureNumber(GAME_CONFIG.lsg, 'startCells', defaults.lsg.startCells, ['lsg']);
  ensureNumber(GAME_CONFIG.lsg, 'lightRadius', defaults.lsg.lightRadius, ['lsg']);
  ensureNumber(GAME_CONFIG.resources, 'pickupRadius', defaults.resources.pickupRadius, ['resources']);
  ensureNumber(GAME_CONFIG.resources, 'scrapPerPickup', defaults.resources.scrapPerPickup, ['resources']);
  ensureNumber(GAME_CONFIG.resources, 'circuitsPerPickup', defaults.resources.circuitsPerPickup, ['resources']);
  ensureNumber(GAME_CONFIG.resources, 'fuelCellsPerPickup', defaults.resources.fuelCellsPerPickup, ['resources']);
  ensureNumber(GAME_CONFIG.phantom, 'speed', defaults.phantom.speed, ['phantom']);
  ensureNumber(GAME_CONFIG.phantom, 'aggressiveSpeed', defaults.phantom.aggressiveSpeed, ['phantom']);
  ensureNumber(GAME_CONFIG.phantom, 'damagePerSecond', defaults.phantom.damagePerSecond, ['phantom']);
  ensureNumber(GAME_CONFIG.phantom, 'attackRange', defaults.phantom.attackRange, ['phantom']);
  ensureNumber(GAME_CONFIG.flashlight, 'maxBatterySec', defaults.flashlight.maxBatterySec, ['flashlight']);
  ensureNumber(GAME_CONFIG.flashlight, 'drainPerSec', defaults.flashlight.drainPerSec, ['flashlight']);
  ensureNumber(GAME_CONFIG.flashlight, 'nightDrainMultiplier', defaults.flashlight.nightDrainMultiplier, ['flashlight']);
  ensureNumber(GAME_CONFIG.flashlight, 'rechargePerSec', defaults.flashlight.rechargePerSec, ['flashlight']);
  ensureNumber(GAME_CONFIG.fear, 'max', defaults.fear.max, ['fear']);
  ensureNumber(GAME_CONFIG.fear, 'nightGainPerSec', defaults.fear.nightGainPerSec, ['fear']);
  ensureNumber(GAME_CONFIG.fear, 'phantomGainPerSec', defaults.fear.phantomGainPerSec, ['fear']);
  ensureNumber(GAME_CONFIG.fear, 'lowHealthGainPerSec', defaults.fear.lowHealthGainPerSec, ['fear']);
  ensureNumber(GAME_CONFIG.fear, 'safeLossPerSec', defaults.fear.safeLossPerSec, ['fear']);
  ensureNumber(GAME_CONFIG.audio, 'masterVolume', defaults.audio.masterVolume, ['audio']);
  ensureNumber(GAME_CONFIG.audio, 'ambientVolume', defaults.audio.ambientVolume, ['audio']);
  ensureNumber(GAME_CONFIG.audio, 'nightBoost', defaults.audio.nightBoost, ['audio']);
  ensureNumber(GAME_CONFIG.audio, 'sfxVolume', defaults.audio.sfxVolume, ['audio']);

  ensureArray(GAME_CONFIG.crafting, 'recipes', defaults.crafting.recipes, ['crafting']);
  ensureArray(GAME_CONFIG.chests, 'tiers', defaults.chests.tiers, ['chests']);

  window.SpaceNightsConfig = GAME_CONFIG;
})();
