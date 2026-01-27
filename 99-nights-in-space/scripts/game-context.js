(() => {
  const dom = {
    canvas: document.getElementById('renderCanvas'),
    cycleIndicator: document.getElementById('cycle-indicator'),
    fuelMeter: document.getElementById('fuel-meter'),
    fuelCells: document.getElementById('fuel-cells'),
    healthMeter: document.getElementById('health-meter'),
    flashlightMeter: document.getElementById('flashlight-meter'),
    fearMeter: document.getElementById('fear-meter'),
    scrapCount: document.getElementById('scrap-count'),
    circuitCount: document.getElementById('circuit-count'),
    phaseTimer: document.getElementById('phase-timer'),
    statusIndicator: document.getElementById('status-indicator'),
    gameMessage: document.getElementById('game-message'),
    gameMessageTitle: document.getElementById('game-message-title'),
    gameMessageBody: document.getElementById('game-message-body'),
    restartButton: document.getElementById('restart-button'),
    touchControls: document.getElementById('touch-controls'),
    interactionPrompt: document.getElementById('interaction-prompt'),
    interactionText: document.getElementById('interaction-text'),
    interactBtn: document.getElementById('interact-btn'),
    fearOverlay: document.getElementById('fear-overlay'),
    craftingPanel: document.getElementById('crafting-panel'),
    craftingRecipes: document.getElementById('crafting-recipes'),
    closeCraftingBtn: document.getElementById('close-crafting'),
    crewStatus: document.getElementById('crew-status'),
    crewMessage: document.getElementById('crew-message')
  };

  const ASSET_ROOT = window.location.protocol === 'file:' ? '../assets' : '/assets';
  const assets = {
    ASSET_ROOT,
    MODEL_BASE_URL:
      `${ASSET_ROOT}/models/99-nights-in-space/kenney-space-kit/Models/OBJ%20format/`,
    QUAT_GLTF_BASE_URL:
      `${ASSET_ROOT}/models/99-nights-in-space/quaternius-sci-fi/megakit/Modular%20SciFi%20MegaKit%5BStandard%5D/glTF/`,
    SKETCHFAB_BASE_URL:
      `${ASSET_ROOT}/models/99-nights-in-space/sketchfab/source/`
  };

  // =============================================================================
  // IMPORTANT: TWO-FLOOR SYSTEM
  // =============================================================================
  // This game has TWO separate floor layers:
  //   1. COLLISION FLOOR: Invisible CreateGround at Y=0 (handles physics collisions)
  //   2. VISUAL FLOOR: glTF Platform_Metal.gltf at Y=0.05 (what the player sees)
  //
  // The visual floor tiles have thickness, so their TOP SURFACE is higher (~Y=0.4).
  // The player must be positioned to stand on the VISUAL floor, NOT the collision floor.
  // This is why GROUND_Y is set higher than the collision floor at Y=0.
  //
  // If the player appears to sink into the floor or float above it, adjust GROUND_Y.
  // DO NOT change based on collision floor position - use the VISUAL floor as reference.
  // =============================================================================
  const constants = {
    // Align visual floor and collision floor at Y=0
    VISUAL_FLOOR_Y: 0,
    // glTF floor tiles sit above their pivot; offset them down to match collision floor
    FLOOR_VISUAL_OFFSET: -0.4,
    // Player capsule center when standing on floor
    GROUND_Y: 0.9,
    COLLISION_Y_OFFSET: 0,
    WORLD_FLOOR_Y: 0,
    JUMP_HEIGHT: 2.0,
    JUMP_DURATION: 0.5
  };

  const inputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    refuel: false,
    interact: false,
    jump: false,
    flashlight: false,
    craft: false,
    placeBarrier: false,
    placeTurret: false
  };

  const touchState = {
    up: false,
    down: false,
    left: false,
    right: false,
    refuel: false,
    interact: false,
    jump: false,
    craft: false
  };

  const state = {
    cycle: 1,
    isNight: false,
    timeInPhase: 0,
    fuel: GAME_CONFIG.lsg.startFuelSec,
    fuelCells: GAME_CONFIG.lsg.startCells,
    health: GAME_CONFIG.player.maxHealth,
    flashlightBattery: GAME_CONFIG.flashlight.maxBatterySec,
    flashlightOn: false,
    fear: 0,
    gameOver: false,
    phantomAggressive: false,
    resources: {
      scrap: 0,
      circuits: 0
    },
    inventory: {
      barriers: 0,
      turrets: 0,
      medkits: 0
    },
    crewEscortActive: false,
    crewRescued: false,
    statusMessage: '',
    statusTimer: 0
  };

  const runtime = {
    engine: null,
    scene: null,
    camera: null,
    player: null,
    lsg: null,
    lsgLight: null,
    phantom: null,
    dayLight: null,
    nightLight: null,
    flashlight: null,
    audioState: null,
    workbench: null,
    crewMember: null,
    buildMode: null,
    buildPreviewMesh: null,
    buildGrid: null,
    fadedWalls: [],
    playerProfile: null,
    jump: {
      isJumping: false,
      timer: 0,
      direction: 1
    }
  };

  const collections = {
    pickups: [],
    chests: [],
    enemies: [],
    turrets: [],
    barriers: []
  };

  window.SpaceNights = {
    dom,
    assets,
    constants,
    inputState,
    touchState,
    state,
    runtime,
    collections,
    helpers: {},
    systems: {}
  };
})();
