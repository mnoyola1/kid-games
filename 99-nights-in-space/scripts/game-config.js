const GAME_CONFIG = {
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
    recipes: [
      { id: 'fuel_cell', name: 'Fuel Cell', cost: { scrap: 4, circuits: 2 }, grants: { fuelCells: 1 } },
      { id: 'barrier', name: 'Metal Barrier', cost: { scrap: 10 }, grants: { barriers: 1 } },
      { id: 'turret', name: 'Auto Turret', cost: { scrap: 20, circuits: 10 }, grants: { turrets: 1 } },
      { id: 'medkit', name: 'Medkit', cost: { scrap: 6, circuits: 4 }, grants: { medkits: 1 } }
    ]
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
    tiers: [
      { id: 1, name: 'Common', lootMultiplier: 1 },
      { id: 2, name: 'Good', lootMultiplier: 1.5 },
      { id: 3, name: 'Secure', lootMultiplier: 2 },
      { id: 4, name: 'Legendary', lootMultiplier: 3 }
    ]
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
