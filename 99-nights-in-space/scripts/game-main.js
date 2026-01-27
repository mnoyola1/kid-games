(() => {
  const canvas = document.getElementById('renderCanvas');
  const cycleIndicator = document.getElementById('cycle-indicator');
  const fuelMeter = document.getElementById('fuel-meter');
  const fuelCells = document.getElementById('fuel-cells');
  const healthMeter = document.getElementById('health-meter');
  const flashlightMeter = document.getElementById('flashlight-meter');
  const fearMeter = document.getElementById('fear-meter');
  const scrapCount = document.getElementById('scrap-count');
  const circuitCount = document.getElementById('circuit-count');
  const phaseTimer = document.getElementById('phase-timer');
  const statusIndicator = document.getElementById('status-indicator');
  const gameMessage = document.getElementById('game-message');
  const gameMessageTitle = document.getElementById('game-message-title');
  const gameMessageBody = document.getElementById('game-message-body');
  const restartButton = document.getElementById('restart-button');
  const touchControls = document.getElementById('touch-controls');

  let engine = null;
  let scene = null;
  let camera = null;
  let player = null;
  let lsg = null;
  let lsgLight = null;
  let phantom = null;
  let dayLight = null;
  let nightLight = null;
  let pickups = [];
  let audioState = null;
  let chests = [];
  let flashlight = null;
  let enemies = [];
  let turrets = [];
  let barriers = [];
  let crewMember = null;
  let workbench = null;
  
  const interactionPrompt = document.getElementById('interaction-prompt');
  const interactionText = document.getElementById('interaction-text');
  const interactBtn = document.getElementById('interact-btn');
  const fearOverlay = document.getElementById('fear-overlay');
  const craftingPanel = document.getElementById('crafting-panel');
  const craftingRecipes = document.getElementById('crafting-recipes');
  const closeCraftingBtn = document.getElementById('close-crafting');
  const crewStatus = document.getElementById('crew-status');
  const crewMessage = document.getElementById('crew-message');

  const ASSET_ROOT = window.location.protocol === 'file:' ? '../assets' : '/assets';
  const MODEL_BASE_URL =
    `${ASSET_ROOT}/models/99-nights-in-space/kenney-space-kit/Models/OBJ%20format/`;
  const QUAT_GLTF_BASE_URL =
    `${ASSET_ROOT}/models/99-nights-in-space/quaternius-sci-fi/megakit/Modular%20SciFi%20MegaKit%5BStandard%5D/glTF/`;
  const SKETCHFAB_BASE_URL =
    `${ASSET_ROOT}/models/99-nights-in-space/sketchfab/source/`;

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

  // =============================================================================
  // IMPORTANT: TWO-FLOOR SYSTEM
  // =============================================================================
  // This game has TWO separate floor layers:
  //   1. COLLISION FLOOR: Invisible CreateGround at Y=0 (handles physics collisions)
  //   2. VISUAL FLOOR: glTF Platform_Metal.gltf at Y=0.05 (what the player sees)
  //
  // The visual floor tiles have thickness, so their TOP SURFACE is higher (~Y=0.4).
  // The player must be positioned to stand on the VISUAL floor, NOT the collision floor.
  // This is why GROUND_Y is set to 2.5 (much higher than the collision floor at Y=0).
  //
  // If the player appears to sink into the floor or float above it, adjust GROUND_Y.
  // DO NOT change based on collision floor position - use the VISUAL floor as reference.
  // =============================================================================
  
  // Jump state - simple timer-based jump (no physics drift)
  const GROUND_Y = 2.5; // Player capsule center when standing on VISUAL floor (not collision floor!)
  const JUMP_HEIGHT = 2.0; // Maximum jump height
  const JUMP_DURATION = 0.5; // Time to reach peak (seconds)
  let isJumping = false;
  let jumpTimer = 0;
  let jumpDirection = 1; // 1 = going up, -1 = coming down

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

  let playerProfile = null;

  const init = () => {
    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true });
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.02, 0.04, 0.08, 1);
    scene.collisionsEnabled = true;

    createEnvironment();
    createPlayer();
    createLights();
    createLSG();
    createPhantom();
    createWorkbench();
    createCrewMember();
    createFlashlight();
    setupCamera();
    setupInput();
    setupTouchControls();
    setupAudio();
    setupCraftingUI();
    setupLuminaCore();
    setupRestart();

    engine.runRenderLoop(() => {
      const deltaSec = engine.getDeltaTime() / 1000;
      update(deltaSec);
      scene.render();
    });

    window.addEventListener('resize', () => engine.resize());
  };

  const createEnvironment = () => {
    // Texture base path (same folder as wall models)
    const textureBase = QUAT_GLTF_BASE_URL + 'Walls/';

    const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
    groundMat.diffuseTexture = new BABYLON.Texture(textureBase + 'T_Trim_02_BaseColor.png', scene);
    groundMat.diffuseTexture.uScale = 2;
    groundMat.diffuseTexture.vScale = 2;
    groundMat.bumpTexture = new BABYLON.Texture(textureBase + 'T_Trim_02_Normal.png', scene);
    groundMat.bumpTexture.uScale = 2;
    groundMat.bumpTexture.vScale = 2;
    groundMat.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    groundMat.specularPower = 16;

    const wallMat = new BABYLON.StandardMaterial('wallMat', scene);
    wallMat.diffuseTexture = new BABYLON.Texture(textureBase + 'T_Trim_01_BaseColor_Red.png', scene);
    wallMat.diffuseTexture.uScale = 1;
    wallMat.diffuseTexture.vScale = 2;
    wallMat.bumpTexture = new BABYLON.Texture(textureBase + 'T_Trim_01_Normal.png', scene);
    wallMat.bumpTexture.uScale = 1;
    wallMat.bumpTexture.vScale = 2;
    wallMat.specularColor = new BABYLON.Color3(0.25, 0.25, 0.3);
    wallMat.specularPower = 24;
    wallMat.emissiveColor = new BABYLON.Color3(0.02, 0.03, 0.05);

    const rooms = [
      {
        name: 'core',
        centerX: 0,
        centerZ: 0,
        width: 12,
        depth: 12,
        doors: { east: true, west: true }
      },
      {
        name: 'east',
        centerX: 15,
        centerZ: 0,
        width: 10,
        depth: 10,
        doors: { west: true }
      },
      {
        name: 'west',
        centerX: -15,
        centerZ: 0,
        width: 10,
        depth: 10,
        doors: { east: true }
      }
    ];

    rooms.forEach((room) => {
      createRoom(room, groundMat, wallMat);
      createRoomModules(room);
    });

    createFloorTile('corridor-east', 4, 4, new BABYLON.Vector3(8, 0, 0), groundMat, true);
    createFloorTile('corridor-west', 4, 4, new BABYLON.Vector3(-8, 0, 0), groundMat, true);
    createCorridorModules();

    spawnPropModel('prop-barrel-1', 'barrel.obj', new BABYLON.Vector3(4, 0.6, -3), 0.6, wallMat);
    spawnPropModel('prop-barrel-2', 'barrels.obj', new BABYLON.Vector3(-4, 0.6, 3), 0.55, wallMat);
    spawnPropModel('prop-structure', 'structure_detailed.obj', new BABYLON.Vector3(0, 0.6, -5), 0.45, wallMat);
    spawnPropModel('prop-supports', 'supports_high.obj', new BABYLON.Vector3(8, 0.6, 2), 0.5, wallMat);
    spawnPropModel('prop-turret', 'turret_single.obj', new BABYLON.Vector3(14, 0.6, -2), 0.5, wallMat);
    spawnPropModel('prop-rover', 'rover.obj', new BABYLON.Vector3(-13.5, 0.6, -2), 0.45, wallMat);
    spawnPropModel('prop-dish', 'satelliteDish.obj', new BABYLON.Vector3(-14, 0.6, 2), 0.45, wallMat);

    // Create interactable chests
    createChest('chest-1', new BABYLON.Vector3(14, 0, 3), { scrap: 3, circuits: 1 });
    createChest('chest-2', new BABYLON.Vector3(-14, 0, 2), { fuelCells: 2, scrap: 1 });

    createPickups();
  };

  const createRoom = (room, groundMat, wallMat) => {
    const wallHeight = 4;
    const wallThickness = 0.6;
    const doorWidth = 3.2;
    const halfWidth = room.width / 2;
    const halfDepth = room.depth / 2;

    createFloorTile(
      `${room.name}-floor`,
      room.width,
      room.depth,
      new BABYLON.Vector3(room.centerX, 0, room.centerZ),
      groundMat,
      true
    );

    const northZ = room.centerZ - halfDepth;
    const southZ = room.centerZ + halfDepth;
    const eastX = room.centerX + halfWidth;
    const westX = room.centerX - halfWidth;

    createWallWithDoor(
      `${room.name}-north`,
      true,
      room.centerX,
      northZ,
      room.width,
      room.doors?.north ? doorWidth : 0,
      wallHeight,
      wallThickness,
      wallMat,
      true
    );
    createWallWithDoor(
      `${room.name}-south`,
      true,
      room.centerX,
      southZ,
      room.width,
      room.doors?.south ? doorWidth : 0,
      wallHeight,
      wallThickness,
      wallMat,
      true
    );
    createWallWithDoor(
      `${room.name}-east`,
      false,
      eastX,
      room.centerZ,
      room.depth,
      room.doors?.east ? doorWidth : 0,
      wallHeight,
      wallThickness,
      wallMat,
      true
    );
    createWallWithDoor(
      `${room.name}-west`,
      false,
      westX,
      room.centerZ,
      room.depth,
      room.doors?.west ? doorWidth : 0,
      wallHeight,
      wallThickness,
      wallMat,
      true
    );
  };

  const createFloorTile = (name, width, depth, position, material, collisionOnly = false) => {
    const floor = BABYLON.MeshBuilder.CreateGround(name, { width, height: depth }, scene);
    floor.position = position.clone();
    floor.material = material;
    floor.checkCollisions = true;
    if (collisionOnly) {
      setCollisionOnly(floor);
    }
  };

  const createWallWithDoor = (
    name,
    horizontal,
    centerX,
    centerZ,
    length,
    doorWidth,
    wallHeight,
    wallThickness,
    material,
    collisionOnly = false
  ) => {
    if (!doorWidth || length <= doorWidth + 0.2) {
      const wall = createWallSegment(
        name,
        horizontal ? length : wallThickness,
        wallHeight,
        horizontal ? wallThickness : length,
        new BABYLON.Vector3(centerX, wallHeight / 2, centerZ),
        material,
        collisionOnly
      );
      return wall;
    }

    const segmentLength = (length - doorWidth) / 2;
    const offset = doorWidth / 2 + segmentLength / 2;

    if (horizontal) {
      createWallSegment(
        `${name}-left`,
        segmentLength,
        wallHeight,
        wallThickness,
        new BABYLON.Vector3(centerX - offset, wallHeight / 2, centerZ),
        material,
        collisionOnly
      );
      createWallSegment(
        `${name}-right`,
        segmentLength,
        wallHeight,
        wallThickness,
        new BABYLON.Vector3(centerX + offset, wallHeight / 2, centerZ),
        material,
        collisionOnly
      );
    } else {
      createWallSegment(
        `${name}-top`,
        wallThickness,
        wallHeight,
        segmentLength,
        new BABYLON.Vector3(centerX, wallHeight / 2, centerZ - offset),
        material,
        collisionOnly
      );
      createWallSegment(
        `${name}-bottom`,
        wallThickness,
        wallHeight,
        segmentLength,
        new BABYLON.Vector3(centerX, wallHeight / 2, centerZ + offset),
        material,
        collisionOnly
      );
    }
  };

  const createWallSegment = (name, width, height, depth, position, material, collisionOnly = false) => {
    const wall = BABYLON.MeshBuilder.CreateBox(name, { width, height, depth }, scene);
    wall.position = position.clone();
    wall.material = material;
    wall.checkCollisions = true;
    if (collisionOnly) {
      setCollisionOnly(wall);
    }
    return wall;
  };

  const setCollisionOnly = (mesh) => {
    // Keep walls visible - they serve as both collision and visual
    mesh.isPickable = false;
  };

  const createRoomModules = (room) => {
    const tileSize = 4;
    const moduleScale = 1; // Adjusted scale to match room size
    const floorCountX = Math.max(1, Math.round(room.width / tileSize));
    const floorCountZ = Math.max(1, Math.round(room.depth / tileSize));
    const startX = room.centerX - ((floorCountX - 1) * tileSize) / 2;
    const startZ = room.centerZ - ((floorCountZ - 1) * tileSize) / 2;

    // Only spawn floor tiles - collision walls handle blocking
    for (let x = 0; x < floorCountX; x += 1) {
      for (let z = 0; z < floorCountZ; z += 1) {
        spawnGltfModule(
          `${room.name}-floor-${x}-${z}`,
          'Platforms/Platform_Metal.gltf',
          new BABYLON.Vector3(startX + x * tileSize, 0.05, startZ + z * tileSize),
          new BABYLON.Vector3(0, 0, 0),
          moduleScale
        );
      }
    }

    // Door frames only (walls are handled by visible collision boxes)
    if (room.doors?.east) {
      spawnGltfModule(
        `${room.name}-door-east`,
        'Platforms/Door_Frame_Square.gltf',
        new BABYLON.Vector3(room.centerX + room.width / 2, 0, room.centerZ),
        new BABYLON.Vector3(0, Math.PI / 2, 0),
        moduleScale
      );
    }
    if (room.doors?.west) {
      spawnGltfModule(
        `${room.name}-door-west`,
        'Platforms/Door_Frame_Square.gltf',
        new BABYLON.Vector3(room.centerX - room.width / 2, 0, room.centerZ),
        new BABYLON.Vector3(0, -Math.PI / 2, 0),
        moduleScale
      );
    }
  };

  const createCorridorModules = () => {
    const moduleScale = 1;
    const corridorTiles = [
      new BABYLON.Vector3(8, 0.05, 0),
      new BABYLON.Vector3(-8, 0.05, 0)
    ];

    corridorTiles.forEach((position, index) => {
      spawnGltfModule(
        `corridor-floor-${index}`,
        'Platforms/Platform_Metal.gltf',
        position,
        new BABYLON.Vector3(0, 0, 0),
        moduleScale
      );
    });
  };

  const createProp = (name, position, material) => {
    const prop = BABYLON.MeshBuilder.CreateBox(name, { width: 1.2, height: 1.2, depth: 1.2 }, scene);
    prop.position = position.clone();
    prop.material = material;
    prop.checkCollisions = true;
    return prop;
  };

  const spawnPropModel = (name, fileName, position, scale, fallbackMaterial) => {
    const placeholder = createProp(`${name}-placeholder`, position, fallbackMaterial);
    placeholder.scaling = new BABYLON.Vector3(0.7, 0.7, 0.7);

    BABYLON.SceneLoader.ImportMeshAsync('', MODEL_BASE_URL, fileName, scene)
      .then((result) => {
        const root = new BABYLON.TransformNode(name, scene);
        root.position = position.clone();
        root.scaling = new BABYLON.Vector3(scale, scale, scale);

        result.meshes.forEach((mesh) => {
          if (mesh.getTotalVertices && mesh.getTotalVertices() === 0) {
            return;
          }
          mesh.parent = root;
          mesh.position = BABYLON.Vector3.Zero();
          mesh.rotation = BABYLON.Vector3.Zero();
          mesh.checkCollisions = true;
        });

        placeholder.dispose();
      })
      .catch(() => {
        placeholder.scaling = new BABYLON.Vector3(0.9, 0.9, 0.9);
      });
  };

  const spawnGltfModule = (name, filePath, position, rotation, scale) => {
    // QUAT_GLTF_BASE_URL is pre-encoded, just concatenate with file path
    const fullUrl = QUAT_GLTF_BASE_URL + filePath;

    BABYLON.SceneLoader.ImportMeshAsync('', '', fullUrl, scene)
      .then((result) => {
        const root = new BABYLON.TransformNode(name, scene);
        root.position = position.clone();
        root.rotation = rotation.clone();
        root.scaling = new BABYLON.Vector3(scale, scale, scale);

        // Stop any animations (like chest opening/closing)
        if (result.animationGroups && result.animationGroups.length > 0) {
          result.animationGroups.forEach((group) => {
            group.stop();
            group.reset();
          });
        }

        result.meshes.forEach((mesh) => {
          if (mesh.getTotalVertices && mesh.getTotalVertices() === 0) {
            return;
          }
          mesh.parent = root;
          mesh.alwaysSelectAsActiveMesh = true;
          mesh.checkCollisions = false;
          // Keep original material colors - don't override emissive
        });
        console.log(`✓ Loaded: ${name}`);
      })
      .catch((error) => {
        setStatusMessage(`Module load failed: ${filePath}`, 3);
        console.warn('✗ Module load failed', filePath, error);
      });
  };

  const createChest = (id, position, contents) => {
    const tier = GAME_CONFIG.chests.tiers[Math.floor(Math.random() * GAME_CONFIG.chests.tiers.length)];
    const lootMultiplier = tier.lootMultiplier;
    const scaledContents = {
      scrap: contents.scrap ? Math.ceil(contents.scrap * lootMultiplier) : 0,
      circuits: contents.circuits ? Math.ceil(contents.circuits * lootMultiplier) : 0,
      fuelCells: contents.fuelCells ? Math.ceil(contents.fuelCells * lootMultiplier) : 0
    };
    // Create invisible collision box
    const collisionBox = BABYLON.MeshBuilder.CreateBox(
      `${id}-collision`,
      { width: 1.5, height: 1.2, depth: 1.0 },
      scene
    );
    collisionBox.position = position.clone();
    collisionBox.position.y = 0.6;
    collisionBox.checkCollisions = true;
    collisionBox.isVisible = false;
    collisionBox.isPickable = false;

    const chest = {
      id,
      position: position.clone(),
      contents: scaledContents,
      tier,
      isOpen: false,
      collisionBox,
      visualMesh: null,
      animationGroups: []
    };

    // Load glTF visual model
    const filePath = 'Props/Prop_Chest.gltf';
    const fullUrl = QUAT_GLTF_BASE_URL + filePath;

    BABYLON.SceneLoader.ImportMeshAsync('', fullUrl, '', scene)
      .then((result) => {
        const root = new BABYLON.TransformNode(`${id}-root`, scene);
        root.position = position.clone();
        root.position.y = 0.4;
        root.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
        root.scaling = new BABYLON.Vector3(1.3, 1.3, 1.3);

        result.meshes.forEach((mesh) => {
          if (mesh.getTotalVertices && mesh.getTotalVertices() === 0) return;
          mesh.parent = root;
          mesh.alwaysSelectAsActiveMesh = true;
          mesh.checkCollisions = false;
        });

        chest.visualMesh = root;
        chest.animationGroups = result.animationGroups || [];

        // Stop any auto-playing animations
        chest.animationGroups.forEach((group) => {
          group.stop();
          group.reset();
        });

        console.log(`✓ Chest loaded: ${id}`);
      })
      .catch((error) => {
        console.warn('✗ Chest load failed', id, error);
      });

    chests.push(chest);
    return chest;
  };

  const openChest = (chest) => {
    if (chest.isOpen) return;
    chest.isOpen = true;

    // Play opening animation if available
    if (chest.animationGroups.length > 0) {
      const openAnim = chest.animationGroups[0];
      openAnim.start(false, 1.0, openAnim.from, openAnim.to, false);
    }

    // Give player the contents
    let message = `Opened ${chest.tier?.name || 'Common'} chest! Found: `;
    const items = [];

    if (chest.contents.scrap) {
      state.resources.scrap += chest.contents.scrap;
      items.push(`${chest.contents.scrap} scrap`);
    }
    if (chest.contents.circuits) {
      state.resources.circuits += chest.contents.circuits;
      items.push(`${chest.contents.circuits} circuits`);
    }
    if (chest.contents.fuelCells) {
      state.fuelCells += chest.contents.fuelCells;
      items.push(`${chest.contents.fuelCells} fuel cells`);
    }

    message += items.join(', ');
    setStatusMessage(message, 3);
    playChestSfx();
  };

  const playChestSfx = () => {
    if (!audioState || !audioState.ready) return;
    // Play a nice chest opening sound
    playSfx(330, 0.1, 'triangle', 0.3);
    setTimeout(() => playSfx(440, 0.15, 'triangle', 0.25), 100);
    setTimeout(() => playSfx(550, 0.2, 'triangle', 0.2), 200);
  };

  const getNearbyInteractable = () => {
    if (!player) return null;
    const interactRadius = 2.5;

    for (const chest of chests) {
      if (chest.isOpen) continue;
      const distance = BABYLON.Vector3.Distance(player.position, chest.collisionBox.position);
      if (distance <= interactRadius) {
        return { type: 'chest', object: chest };
      }
    }

    if (workbench) {
      const distance = BABYLON.Vector3.Distance(player.position, workbench.position);
      if (distance <= interactRadius) {
        return { type: 'workbench', object: workbench };
      }
    }

    if (crewMember && !state.crewRescued && !state.crewEscortActive) {
      const distance = BABYLON.Vector3.Distance(player.position, crewMember.position);
      if (distance <= interactRadius) {
        return { type: 'crew', object: crewMember };
      }
    }

    // Also check if near LSG for refueling
    if (lsg) {
      const distance = BABYLON.Vector3.Distance(player.position, lsg.position);
      if (distance <= interactRadius && state.fuelCells > 0 && state.lsgFuel < GAME_CONFIG.lsg.maxFuel) {
        return { type: 'lsg', object: lsg };
      }
    }

    return null;
  };

  const updateInteractionPrompt = () => {
    const interactable = getNearbyInteractable();

    if (interactable) {
      interactionPrompt.classList.remove('hidden');
      if (interactable.type === 'chest') {
        interactionText.textContent = 'Press E to Open';
        interactBtn.textContent = 'Open';
    } else if (interactable.type === 'workbench') {
      interactionText.textContent = 'Press E to Craft';
      interactBtn.textContent = 'Craft';
    } else if (interactable.type === 'crew') {
      interactionText.textContent = 'Press E to Escort';
      interactBtn.textContent = 'Escort';
      } else if (interactable.type === 'lsg') {
        interactionText.textContent = 'Press E to Refuel';
        interactBtn.textContent = 'Refuel';
      }
    } else {
      interactionPrompt.classList.add('hidden');
    }
  };

  const handleInteraction = () => {
    const interactable = getNearbyInteractable();
    if (!interactable) return;

    if (interactable.type === 'chest') {
      openChest(interactable.object);
    } else if (interactable.type === 'workbench') {
      openCraftingPanel();
    } else if (interactable.type === 'crew') {
      startCrewEscort();
    } else if (interactable.type === 'lsg') {
      refuelLSG();
    }
  };

  const createPickups = () => {
    const pickupPositions = [
      { id: 'scrap-1', type: 'scrap', position: new BABYLON.Vector3(3, 0.6, 3) },
      { id: 'scrap-2', type: 'scrap', position: new BABYLON.Vector3(-3, 0.6, -3) },
      { id: 'scrap-3', type: 'scrap', position: new BABYLON.Vector3(12, 0.6, -3) },
      { id: 'scrap-4', type: 'scrap', position: new BABYLON.Vector3(-12, 0.6, -3) },
      { id: 'circuit-1', type: 'circuit', position: new BABYLON.Vector3(15, 0.6, -2) },
      { id: 'circuit-2', type: 'circuit', position: new BABYLON.Vector3(-15, 0.6, -2) },
      { id: 'fuel-1', type: 'fuel', position: new BABYLON.Vector3(0, 0.6, -4) },
      { id: 'fuel-2', type: 'fuel', position: new BABYLON.Vector3(8, 0.6, 0) },
      { id: 'fuel-3', type: 'fuel', position: new BABYLON.Vector3(-8, 0.6, 0) }
    ];

    pickups = pickupPositions.map((pickup) => createPickup(pickup.id, pickup.type, pickup.position));
  };

  const createPickup = (id, type, position) => {
    const mesh = BABYLON.MeshBuilder.CreateBox(id, { width: 0.6, height: 0.6, depth: 0.6 }, scene);
    mesh.position = position.clone();
    mesh.isPickable = false;

    const material = new BABYLON.StandardMaterial(`${id}-mat`, scene);
    if (type === 'scrap') {
      material.emissiveColor = new BABYLON.Color3(0.6, 0.8, 0.9);
      material.diffuseColor = new BABYLON.Color3(0.2, 0.35, 0.5);
    } else if (type === 'circuit') {
      material.emissiveColor = new BABYLON.Color3(0.4, 1, 0.5);
      material.diffuseColor = new BABYLON.Color3(0.1, 0.4, 0.2);
    } else {
      material.emissiveColor = new BABYLON.Color3(1, 0.8, 0.2);
      material.diffuseColor = new BABYLON.Color3(0.4, 0.25, 0.1);
    }
    mesh.material = material;

    return {
      id,
      type,
      mesh,
      baseY: position.y,
      bobOffset: Math.random() * Math.PI * 2
    };
  };

  const createPlayer = () => {
    // Collision capsule (invisible)
    player = BABYLON.MeshBuilder.CreateCapsule('player', { height: 1.8, radius: 0.4 }, scene);
    player.position = new BABYLON.Vector3(0, GROUND_Y, 6);
    player.checkCollisions = true;
    player.ellipsoid = new BABYLON.Vector3(0.4, 0.9, 0.4);
    player.ellipsoidOffset = new BABYLON.Vector3(0, 0.9, 0);
    player.visibility = 0;

    // Load astronaut model (Sketchfab GLB)
    const astronautUrl = SKETCHFAB_BASE_URL + 'sample.glb';
    BABYLON.SceneLoader.ImportMeshAsync('', '', astronautUrl, scene)
      .then((result) => {
        const playerModel = new BABYLON.TransformNode('playerModel', scene);
        playerModel.parent = player;
        // Position model so feet align with floor
        // Model origin is at center, so offset down to put feet at ground level
        playerModel.position = new BABYLON.Vector3(0, -1.35, 0);
        // Scale up astronaut
        playerModel.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
        playerModel.rotation = new BABYLON.Vector3(0, Math.PI, 0);

        // Stop any animations
        if (result.animationGroups && result.animationGroups.length > 0) {
          result.animationGroups.forEach((group) => {
            group.stop();
            group.reset();
          });
        }

        result.meshes.forEach((mesh) => {
          if (mesh.getTotalVertices && mesh.getTotalVertices() > 0) {
            mesh.parent = playerModel;
            // GLB models typically include their own materials, so we preserve them
            // Only override if needed for consistency
            mesh.alwaysSelectAsActiveMesh = true;
            mesh.checkCollisions = false;
          }
        });
        console.log('✓ Player model loaded (Sketchfab GLB)');
      })
      .catch((err) => {
        console.warn('Sketchfab model failed, trying Kenney fallback', err);
        // Fallback to Kenney astronaut model
        BABYLON.SceneLoader.ImportMeshAsync('', MODEL_BASE_URL, 'astronautA.obj', scene)
          .then((result) => {
            const playerModel = new BABYLON.TransformNode('playerModel', scene);
            playerModel.parent = player;
            // Position model so feet align with floor
            playerModel.position = new BABYLON.Vector3(0, -1.35, 0);
            playerModel.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
            playerModel.rotation = new BABYLON.Vector3(0, Math.PI, 0);

            result.meshes.forEach((mesh) => {
              if (mesh.getTotalVertices && mesh.getTotalVertices() > 0) {
                mesh.parent = playerModel;
                const mat = new BABYLON.StandardMaterial('playerModelMat', scene);
                mat.diffuseColor = new BABYLON.Color3(0.95, 0.6, 0.25);
                mat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                mat.specularPower = 16;
                mesh.material = mat;
              }
            });
            console.log('✓ Player model loaded (Kenney fallback)');
          })
          .catch((fallbackErr) => {
            console.warn('All player models failed, using capsule', fallbackErr);
            player.visibility = 1;
            const playerMat = new BABYLON.StandardMaterial('playerMat', scene);
            playerMat.diffuseColor = new BABYLON.Color3(0.35, 0.6, 0.9);
            player.material = playerMat;
          });
      });
  };

  const createLights = () => {
    // Bright ambient light for visibility
    dayLight = new BABYLON.HemisphericLight('dayLight', new BABYLON.Vector3(0, 1, 0), scene);
    dayLight.intensity = 1.8;
    dayLight.groundColor = new BABYLON.Color3(0.5, 0.5, 0.6); // Strong fill from below

    // Directional light for 3D depth
    const dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-0.5, -1, 0.5), scene);
    dirLight.intensity = 0.8;
    dirLight.diffuse = new BABYLON.Color3(1, 0.98, 0.95);

    // Additional fill light
    const fillLight = new BABYLON.HemisphericLight('fillLight', new BABYLON.Vector3(0, -1, 0), scene);
    fillLight.intensity = 0.4;
    fillLight.diffuse = new BABYLON.Color3(0.6, 0.7, 0.8);

    nightLight = new BABYLON.PointLight('nightLight', new BABYLON.Vector3(0, 6, 0), scene);
    nightLight.intensity = 0;
    nightLight.diffuse = new BABYLON.Color3(0.8, 0.2, 0.2);
  };

  const createLSG = () => {
    // Collision cylinder (invisible)
    lsg = BABYLON.MeshBuilder.CreateCylinder('lsg', { height: 2, diameter: 1.6 }, scene);
    lsg.position = new BABYLON.Vector3(0, 1, 0);
    lsg.checkCollisions = true;
    lsg.visibility = 0;

    // Load Quaternius Access Point as the LSG (more detailed)
    const lsgUrl = QUAT_GLTF_BASE_URL + 'Props/Prop_AccessPoint.gltf';
    BABYLON.SceneLoader.ImportMeshAsync('', '', lsgUrl, scene)
      .then((result) => {
        const lsgModel = new BABYLON.TransformNode('lsgModel', scene);
        // Lower the model to sit on the ground - position base at y=0
        // LSG collision cylinder center is at y=1, so model needs to be at y=-1 to sit on ground
        lsgModel.position = new BABYLON.Vector3(0, -1.0, 0);
        lsgModel.scaling = new BABYLON.Vector3(1.8, 1.8, 1.8);

        // Stop animations
        if (result.animationGroups) {
          result.animationGroups.forEach((g) => { g.stop(); g.reset(); });
        }

        result.meshes.forEach((mesh) => {
          if (mesh.getTotalVertices && mesh.getTotalVertices() > 0) {
            mesh.parent = lsgModel;
            // Add glow effect
            if (mesh.material) {
              mesh.material.emissiveColor = new BABYLON.Color3(0.15, 0.3, 0.5);
            }
          }
        });
        console.log('✓ LSG model loaded');
      })
      .catch((err) => {
        console.warn('LSG model failed, using fallback', err);
        lsg.visibility = 1;
        const lsgMat = new BABYLON.StandardMaterial('lsgMat', scene);
        lsgMat.emissiveColor = new BABYLON.Color3(0.3, 0.7, 1);
        lsgMat.diffuseColor = new BABYLON.Color3(0.08, 0.2, 0.3);
        lsg.material = lsgMat;
      });

    lsgLight = new BABYLON.PointLight('lsgLight', new BABYLON.Vector3(0, 2.4, 0), scene);
    lsgLight.intensity = 1.2;
    lsgLight.range = GAME_CONFIG.lsg.lightRadius;
    lsgLight.diffuse = new BABYLON.Color3(0.3, 0.6, 1);
  };

  const createWorkbench = () => {
    workbench = BABYLON.MeshBuilder.CreateBox('workbench', { width: 1.2, height: 0.8, depth: 0.8 }, scene);
    workbench.position = new BABYLON.Vector3(2.2, 0.4, 1.5);
    workbench.checkCollisions = true;
    const mat = new BABYLON.StandardMaterial('workbenchMat', scene);
    mat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.7);
    mat.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.2);
    workbench.material = mat;
  };

  const createCrewMember = () => {
    const crew = BABYLON.MeshBuilder.CreateSphere('crewMember', { diameter: 1.0 }, scene);
    crew.position = new BABYLON.Vector3(15, GROUND_Y, 2);
    crew.checkCollisions = false;
    const mat = new BABYLON.StandardMaterial('crewMat', scene);
    mat.diffuseColor = new BABYLON.Color3(0.6, 0.9, 0.6);
    mat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.1);
    crew.material = mat;
    crewMember = crew;
  };

  const createFlashlight = () => {
    flashlight = new BABYLON.SpotLight(
      'flashlight',
      new BABYLON.Vector3(0, 1.8, 0),
      new BABYLON.Vector3(0, -0.3, 1),
      Math.PI / 4,
      12,
      scene
    );
    flashlight.intensity = 0;
    flashlight.diffuse = new BABYLON.Color3(0.9, 0.95, 1);
  };

  const createPhantom = () => {
    // Collision sphere (invisible)
    phantom = BABYLON.MeshBuilder.CreateSphere('phantom', { diameter: 1.5 }, scene);
    phantom.position = new BABYLON.Vector3(0, 0.8, -10);
    phantom.isVisible = false;

    // Load Quaternius Alien (Cyclop - creepy one-eyed alien)
    const alienUrl = QUAT_GLTF_BASE_URL + 'Aliens/Alien_Cyclop.gltf';
    BABYLON.SceneLoader.ImportMeshAsync('', '', alienUrl, scene)
      .then((result) => {
        const phantomModel = new BABYLON.TransformNode('phantomModel', scene);
        phantomModel.parent = phantom;
        phantomModel.position = new BABYLON.Vector3(0, -0.75, 0);
        phantomModel.scaling = new BABYLON.Vector3(1.2, 1.2, 1.2);

        // Stop any animations
        if (result.animationGroups) {
          result.animationGroups.forEach((g) => { g.stop(); g.reset(); });
        }

        result.meshes.forEach((mesh) => {
          if (mesh.getTotalVertices && mesh.getTotalVertices() > 0) {
            mesh.parent = phantomModel;
            // Make it ghostly/shadowy
            if (mesh.material) {
              mesh.material.emissiveColor = new BABYLON.Color3(0.2, 0.05, 0.25);
              mesh.material.alpha = 0.8;
            } else {
              const mat = new BABYLON.StandardMaterial('phantomModelMat', scene);
              mat.diffuseColor = new BABYLON.Color3(0.1, 0.05, 0.15);
              mat.emissiveColor = new BABYLON.Color3(0.25, 0.08, 0.3);
              mat.alpha = 0.8;
              mesh.material = mat;
            }
          }
        });
        console.log('✓ Phantom model loaded');
      })
      .catch((err) => {
        console.warn('Phantom model failed, using Kenney alien fallback', err);
        // Fallback to Kenney alien
        BABYLON.SceneLoader.ImportMeshAsync('', MODEL_BASE_URL, 'alien.obj', scene)
          .then((result) => {
            const phantomModel = new BABYLON.TransformNode('phantomModel', scene);
            phantomModel.parent = phantom;
            phantomModel.position = new BABYLON.Vector3(0, -0.75, 0);
            phantomModel.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
            result.meshes.forEach((mesh) => {
              if (mesh.getTotalVertices && mesh.getTotalVertices() > 0) {
                mesh.parent = phantomModel;
                const mat = new BABYLON.StandardMaterial('phantomModelMat', scene);
                mat.diffuseColor = new BABYLON.Color3(0.1, 0.05, 0.15);
                mat.emissiveColor = new BABYLON.Color3(0.2, 0.05, 0.25);
                mat.alpha = 0.85;
                mesh.material = mat;
              }
            });
          })
          .catch(() => {
            phantom.isVisible = true;
            const phantomMat = new BABYLON.StandardMaterial('phantomMat', scene);
            phantomMat.emissiveColor = new BABYLON.Color3(0.2, 0.05, 0.25);
            phantomMat.diffuseColor = new BABYLON.Color3(0.05, 0.02, 0.08);
            phantom.material = phantomMat;
          });
      });
  };

  const spawnEnemy = (type, position) => {
    const config = GAME_CONFIG.enemies[type];
    const mesh = BABYLON.MeshBuilder.CreateSphere(`${type}-${Date.now()}`, { diameter: 1.2 }, scene);
    mesh.position = position.clone();
    mesh.checkCollisions = false;
    const mat = new BABYLON.StandardMaterial(`${type}-mat`, scene);
    if (type === 'voidHound') {
      mat.diffuseColor = new BABYLON.Color3(0.4, 0.1, 0.6);
    } else if (type === 'cargoBeast') {
      mat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1);
    } else {
      mat.diffuseColor = new BABYLON.Color3(0.6, 0.2, 0.2);
    }
    mesh.material = mat;
    enemies.push({
      type,
      mesh,
      hp: config.hp,
      cooldown: 0
    });
  };

  const spawnEnemiesForCycle = () => {
    if (!state.isNight) return;
    if (state.cycle >= 6 && !enemies.some((e) => e.type === 'voidHound')) {
      spawnEnemy('voidHound', new BABYLON.Vector3(10, GROUND_Y, -6));
    }
    if (state.cycle >= 15 && !enemies.some((e) => e.type === 'cargoBeast')) {
      spawnEnemy('cargoBeast', new BABYLON.Vector3(-10, GROUND_Y, -6));
    }
    if (state.cycle >= 20 && enemies.filter((e) => e.type === 'corruptedCrew').length < 2) {
      spawnEnemy('corruptedCrew', new BABYLON.Vector3(0, GROUND_Y, -12));
      spawnEnemy('corruptedCrew', new BABYLON.Vector3(6, GROUND_Y, -12));
    }
  };

  const setupCamera = () => {
    const fixedRadius = 6; // Fixed camera distance (like 99 Nights)
    
    camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 4,  // Lower angle (more behind player)
      fixedRadius,
      player.position.clone(),
      scene
    );
    camera.attachControl(canvas, true);
    
    // Lock camera angle limits
    camera.lowerBetaLimit = 0.4;
    camera.upperBetaLimit = 1.0;
    
    // Lock zoom to fixed distance - no zoom in/out allowed
    camera.lowerRadiusLimit = fixedRadius;
    camera.upperRadiusLimit = fixedRadius;
    
    // Disable all zoom controls
    camera.wheelPrecision = 0;           // Disable mouse wheel zoom
    camera.pinchPrecision = 0;           // Disable pinch zoom
    camera.panningSensibility = 0;       // Disable panning
    camera.inputs.removeByType('ArcRotateCameraMouseWheelInput');  // Remove wheel input completely
    
    // Don't use camera collision
    camera.checkCollisions = false;

    // Track walls that might block view for fading
    scene.registerBeforeRender(() => {
      fadeBlockingWalls();
    });
  };

  // Array to track walls that were faded
  let fadedWalls = [];

  const fadeBlockingWalls = () => {
    if (!player || !camera) return;

    // Restore previously faded walls
    fadedWalls.forEach((wall) => {
      if (wall.material) {
        wall.material.alpha = 1;
      }
    });
    fadedWalls = [];

    // Cast ray from camera to player
    const cameraPos = camera.position;
    const playerPos = player.position.clone();
    playerPos.y += 0.9; // Player center height

    const direction = playerPos.subtract(cameraPos).normalize();
    const distance = BABYLON.Vector3.Distance(cameraPos, playerPos);

    const ray = new BABYLON.Ray(cameraPos, direction, distance);
    const hits = scene.multiPickWithRay(ray);

    if (hits) {
      hits.forEach((hit) => {
        const mesh = hit.pickedMesh;
        // Only fade walls (not player, pickups, etc.)
        if (mesh && mesh.name && (mesh.name.includes('wall') || mesh.name.includes('Wall'))) {
          if (mesh.material) {
            mesh.material.alpha = 0.3;
            fadedWalls.push(mesh);
          }
        }
      });
    }
  };

  const setupInput = () => {
    window.addEventListener('keydown', (event) => {
      if (state.gameOver) return;
      switch (event.key.toLowerCase()) {
        case 'w':
          inputState.forward = true;
          break;
        case 's':
          inputState.backward = true;
          break;
        case 'a':
          inputState.left = true;
          break;
        case 'd':
          inputState.right = true;
          break;
        case 'shift':
          inputState.sprint = true;
          break;
        case 'e':
          if (!inputState.interact) {
            inputState.interact = true;
            handleInteraction();
          }
          break;
        case 'f':
          if (!inputState.flashlight) {
            inputState.flashlight = true;
            toggleFlashlight();
          }
          break;
        case 'c':
          if (!inputState.craft) {
            inputState.craft = true;
            toggleCraftingPanel();
          }
          break;
        case 'b':
          inputState.placeBarrier = true;
          placeBarrier();
          break;
        case 't':
          inputState.placeTurret = true;
          placeTurret();
          break;
        case ' ':
          event.preventDefault(); // Prevent page scroll
          inputState.jump = true;
          break;
        default:
          break;
      }
    });

    window.addEventListener('keyup', (event) => {
      switch (event.key.toLowerCase()) {
        case 'w':
          inputState.forward = false;
          break;
        case 's':
          inputState.backward = false;
          break;
        case 'a':
          inputState.left = false;
          break;
        case 'd':
          inputState.right = false;
          break;
        case 'shift':
          inputState.sprint = false;
          break;
        case 'e':
          inputState.interact = false;
          break;
        case 'f':
          inputState.flashlight = false;
          break;
        case 'c':
          inputState.craft = false;
          break;
        case 'b':
          inputState.placeBarrier = false;
          break;
        case 't':
          inputState.placeTurret = false;
          break;
        case ' ':
          inputState.jump = false;
          break;
        default:
          break;
      }
    });
  };

  const setupTouchControls = () => {
    if (navigator.maxTouchPoints > 0) {
      touchControls.classList.remove('hidden');
    }

    document.querySelectorAll('.touch-btn').forEach((button) => {
      const direction = button.dataset.direction;
      const action = button.dataset.action;
      const setState = (value) => {
        if (direction) {
          touchState[direction] = value;
        }
        if (action === 'refuel') {
          touchState.refuel = value;
        }
        if (action === 'jump') {
          touchState.jump = value;
        }
        if (action === 'craft') {
          touchState.craft = value;
          if (value) toggleCraftingPanel();
        }
      };

      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        setState(true);
      });
      button.addEventListener('pointerup', () => setState(false));
      button.addEventListener('pointerleave', () => setState(false));
      button.addEventListener('pointercancel', () => setState(false));
    });

    // Setup interaction button (for chests, etc.)
    if (interactBtn) {
      interactBtn.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        handleInteraction();
      });
    }
  };

  const setupAudio = () => {
    audioState = {
      context: null,
      masterGain: null,
      ambientGain: null,
      nightGain: null,
      noise: null,
      humOsc: null,
      nightOsc: null,
      ready: false,
      lastSfx: {}
    };

    const unlockAudio = () => {
      if (audioState.ready) return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      audioState.context = context;

      audioState.masterGain = context.createGain();
      audioState.masterGain.gain.value = GAME_CONFIG.audio.masterVolume;
      audioState.masterGain.connect(context.destination);

      audioState.ambientGain = context.createGain();
      audioState.ambientGain.gain.value = GAME_CONFIG.audio.ambientVolume;
      audioState.ambientGain.connect(audioState.masterGain);

      audioState.nightGain = context.createGain();
      audioState.nightGain.gain.value = 0;
      audioState.nightGain.connect(audioState.masterGain);

      audioState.humOsc = createOscillator(context, 55, 'sine', audioState.ambientGain);
      audioState.noise = createNoise(context, audioState.ambientGain);
      audioState.nightOsc = createOscillator(context, 140, 'triangle', audioState.nightGain);

      audioState.ready = true;
      updateAmbientAudio();
    };

    const unlockAndResume = () => {
      unlockAudio();
      if (audioState.context && audioState.context.state === 'suspended') {
        audioState.context.resume();
      }
    };

    window.addEventListener('pointerdown', unlockAndResume, { once: true });
    window.addEventListener('keydown', unlockAndResume, { once: true });
  };

  const toggleFlashlight = () => {
    if (state.flashlightBattery <= 0) {
      setStatusMessage('Flashlight battery empty', 2);
      return;
    }
    state.flashlightOn = !state.flashlightOn;
    updateFlashlight(0);
  };

  const updateFlashlight = (deltaSec) => {
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

  const placeBarrier = () => {
    if (state.inventory.barriers <= 0 || !player) {
      setStatusMessage('No barriers available', 2);
      return;
    }
    const barrier = BABYLON.MeshBuilder.CreateBox(
      `barrier-${Date.now()}`,
      { width: 1.5, height: 1.2, depth: 0.4 },
      scene
    );
    const forward = camera.getForwardRay().direction;
    const position = player.position.add(new BABYLON.Vector3(forward.x, 0, forward.z).normalize().scale(1.8));
    barrier.position = new BABYLON.Vector3(position.x, GROUND_Y - 0.3, position.z);
    barrier.checkCollisions = true;
    const mat = new BABYLON.StandardMaterial('barrierMat', scene);
    mat.diffuseColor = new BABYLON.Color3(0.3, 0.35, 0.45);
    barrier.material = mat;
    barriers.push(barrier);
    state.inventory.barriers -= 1;
    setStatusMessage('Barrier placed', 2);
  };

  const placeTurret = () => {
    if (state.inventory.turrets <= 0 || !player) {
      setStatusMessage('No turrets available', 2);
      return;
    }
    const turret = BABYLON.MeshBuilder.CreateCylinder(
      `turret-${Date.now()}`,
      { height: 1.0, diameter: 0.6 },
      scene
    );
    const forward = camera.getForwardRay().direction;
    const position = player.position.add(new BABYLON.Vector3(forward.x, 0, forward.z).normalize().scale(2.2));
    turret.position = new BABYLON.Vector3(position.x, GROUND_Y - 0.4, position.z);
    turret.checkCollisions = true;
    const mat = new BABYLON.StandardMaterial('turretMat', scene);
    mat.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1);
    turret.material = mat;
    turrets.push({ mesh: turret, cooldown: 0 });
    state.inventory.turrets -= 1;
    setStatusMessage('Turret placed', 2);
  };

  const createOscillator = (context, frequency, type, target) => {
    const osc = context.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    osc.connect(target);
    osc.start();
    return osc;
  };

  const createNoise = (context, target) => {
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    source.connect(filter);
    filter.connect(target);
    source.start(0);
    return { source, filter };
  };

  const updateAmbientAudio = () => {
    if (!audioState || !audioState.ready) return;
    const now = audioState.context.currentTime;
    const nightTarget = state.isNight || state.fuel <= 0 ? GAME_CONFIG.audio.nightBoost : 0;
    const baseTarget = GAME_CONFIG.audio.ambientVolume + (state.isNight ? 0.05 : 0);
    audioState.nightGain.gain.setTargetAtTime(nightTarget, now, 0.4);
    audioState.ambientGain.gain.setTargetAtTime(baseTarget, now, 0.4);
  };

  const shouldThrottleSfx = (key, intervalSec) => {
    const now = performance.now();
    if (audioState.lastSfx[key] && now - audioState.lastSfx[key] < intervalSec * 1000) {
      return true;
    }
    audioState.lastSfx[key] = now;
    return false;
  };

  const playSfx = (frequency, duration, type, volume) => {
    if (!audioState || !audioState.ready) return;
    const now = audioState.context.currentTime;
    const osc = audioState.context.createOscillator();
    const gain = audioState.context.createGain();
    const scaledVolume = volume * GAME_CONFIG.audio.sfxVolume;

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(scaledVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(audioState.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  };

  const playPickupSfx = (type) => {
    if (!audioState || !audioState.ready || shouldThrottleSfx('pickup', 0.15)) return;
    const frequency = type === 'fuel' ? 520 : type === 'circuit' ? 620 : 420;
    playSfx(frequency, 0.18, 'triangle', 0.35);
  };

  const playRefuelSfx = () => {
    if (!audioState || !audioState.ready || shouldThrottleSfx('refuel', 0.25)) return;
    playSfx(300, 0.2, 'sawtooth', 0.4);
  };

  const playDamageSfx = () => {
    if (!audioState || !audioState.ready || shouldThrottleSfx('damage', 0.3)) return;
    playSfx(120, 0.15, 'square', 0.45);
  };

  const setupLuminaCore = () => {
    if (typeof LuminaCore === 'undefined') return;
    const profile = LuminaCore.getActiveProfile();
    if (profile) {
      playerProfile = profile;
      LuminaCore.recordGameStart(profile.id, GAME_CONFIG.id);
    }
  };

  const setupRestart = () => {
    restartButton.addEventListener('click', () => {
      window.location.reload();
    });
  };

  const setupCraftingUI = () => {
    if (!craftingPanel || !craftingRecipes || !closeCraftingBtn) return;
    closeCraftingBtn.addEventListener('click', closeCraftingPanel);
    renderCraftingRecipes();
  };

  const renderCraftingRecipes = () => {
    craftingRecipes.innerHTML = '';
    GAME_CONFIG.crafting.recipes.forEach((recipe) => {
      const costMultiplier = state.crewRescued ? 0.75 : 1;
      const computedCost = Object.entries(recipe.cost).reduce((acc, [key, value]) => {
        acc[key] = Math.ceil(value * costMultiplier);
        return acc;
      }, {});
      const row = document.createElement('div');
      row.className = 'recipe-row';
      const costText = Object.entries(computedCost)
        .map(([key, value]) => `${value} ${key}`)
        .join(', ');
      row.innerHTML = `
        <div>${recipe.name}</div>
        <div>${costText}</div>
        <button type="button" data-recipe="${recipe.id}">Craft</button>
      `;
      row.querySelector('button').addEventListener('click', () => craftRecipe(recipe.id));
      craftingRecipes.appendChild(row);
    });
  };

  const openCraftingPanel = () => {
    if (!craftingPanel) return;
    craftingPanel.classList.remove('hidden');
  };

  const closeCraftingPanel = () => {
    if (!craftingPanel) return;
    craftingPanel.classList.add('hidden');
  };

  const toggleCraftingPanel = () => {
    if (!craftingPanel) return;
    craftingPanel.classList.toggle('hidden');
  };

  const craftRecipe = (recipeId) => {
    const recipe = GAME_CONFIG.crafting.recipes.find((r) => r.id === recipeId);
    if (!recipe) return;
    const costMultiplier = state.crewRescued ? 0.75 : 1;
    const computedCost = Object.entries(recipe.cost).reduce((acc, [key, value]) => {
      acc[key] = Math.ceil(value * costMultiplier);
      return acc;
    }, {});
    const canAfford = Object.entries(computedCost).every(([key, value]) => state.resources[key] >= value);
    if (!canAfford) {
      setStatusMessage('Not enough resources', 2);
      return;
    }
    Object.entries(computedCost).forEach(([key, value]) => {
      state.resources[key] -= value;
    });
    if (recipe.grants.fuelCells) state.fuelCells += recipe.grants.fuelCells;
    if (recipe.grants.barriers) state.inventory.barriers += recipe.grants.barriers;
    if (recipe.grants.turrets) state.inventory.turrets += recipe.grants.turrets;
    if (recipe.grants.medkits) state.inventory.medkits += recipe.grants.medkits;
    setStatusMessage(`Crafted ${recipe.name}`, 2);
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
    updatePickups(deltaSec);
    updateFear(deltaSec);
    updateCrewEscort(deltaSec);
    updateStatus(deltaSec);
    updateInteractionPrompt();
    updateHUD();
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
        awardCycleRewards();
        if (state.cycle > GAME_CONFIG.totalCycles) {
          endGame(true);
          return;
        }
      }
      state.isNight = !state.isNight;
      updateLighting();
      if (state.isNight) {
        spawnPhantom();
        spawnEnemiesForCycle();
        setStatusMessage('Lights Off - stay near the LSG', 3);
      } else {
        setStatusMessage('Lights On - explore the station', 3);
      }
    }
  };

  const updateLighting = () => {
    if (state.isNight || state.fuel <= 0) {
      dayLight.intensity = 0.2;
      nightLight.intensity = 0.8;
    } else {
      dayLight.intensity = 0.9;
      nightLight.intensity = 0;
    }
    updateAmbientAudio();
  };

  const updateMovement = (deltaSec) => {
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
    if ((inputState.jump || touchState.jump) && !isJumping) {
      // Start jump
      isJumping = true;
      jumpTimer = 0;
      jumpDirection = 1; // Going up
      inputState.jump = false;
      touchState.jump = false;
    }

    // Process jump animation
    if (isJumping) {
      jumpTimer += deltaSec;
      
      if (jumpDirection === 1) {
        // Going up - use smooth curve
        const progress = Math.min(jumpTimer / JUMP_DURATION, 1);
        const height = JUMP_HEIGHT * Math.sin(progress * Math.PI / 2); // Ease out
        player.position.y = GROUND_Y + height;
        
        if (progress >= 1) {
          // Reached peak, start coming down
          jumpDirection = -1;
          jumpTimer = 0;
        }
      } else {
        // Coming down - use smooth curve
        const progress = Math.min(jumpTimer / JUMP_DURATION, 1);
        const height = JUMP_HEIGHT * Math.cos(progress * Math.PI / 2); // Ease in
        player.position.y = GROUND_Y + height;
        
        if (progress >= 1) {
          // Landed
          isJumping = false;
          player.position.y = GROUND_Y;
        }
      }
    } else {
      // Not jumping - always keep player at ground level (prevents drift)
      player.position.y = GROUND_Y;
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
      setStatusMessage('LSG offline - Phantom unleashed!', 3);
    }
  };

  const tryRefuel = () => {
    if (state.fuelCells <= 0) return false;
    const distance = BABYLON.Vector3.Distance(player.position, lsg.position);
    if (distance > 2.5) return false;

    state.fuelCells -= 1;
    state.fuel = Math.min(GAME_CONFIG.lsg.maxFuelSec, state.fuel + GAME_CONFIG.lsg.fuelPerCellSec);
    if (state.fuel > 0) {
      state.phantomAggressive = false;
      updateLighting();
    }
    setStatusMessage('LSG refueled');
    playRefuelSfx();
    return true;
  };

  const refuelLSG = () => {
    tryRefuel();
  };

  const spawnPhantom = () => {
    phantom.isVisible = true;
    const angle = Math.random() * Math.PI * 2;
    const radius = 10;
    phantom.position = new BABYLON.Vector3(
      Math.cos(angle) * radius,
      0.8,
      Math.sin(angle) * radius
    );
  };

  const updatePhantom = (deltaSec) => {
    if (!state.isNight && state.fuel > 0) {
      phantom.isVisible = false;
      return;
    }

    phantom.isVisible = true;
    const distanceToLSG = BABYLON.Vector3.Distance(phantom.position, lsg.position);
    const distanceToPlayer = BABYLON.Vector3.Distance(phantom.position, player.position);
    const playerSafe = isPlayerSafe();
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
      playDamageSfx();
      if (state.health <= 0) {
        endGame(false);
      }
    }
  };

  const updateEnemies = (deltaSec) => {
    if (!enemies.length) return;
    enemies = enemies.filter((enemy) => enemy.hp > 0 && !enemy.mesh.isDisposed());
    enemies.forEach((enemy) => {
      const config = GAME_CONFIG.enemies[enemy.type];
      const direction = player.position.subtract(enemy.mesh.position);
      direction.y = 0;
      if (direction.lengthSquared() > 0.01) {
        direction.normalize();
        enemy.mesh.position = enemy.mesh.position.add(direction.scale(config.speed * deltaSec));
      }
      const distance = BABYLON.Vector3.Distance(enemy.mesh.position, player.position);
      if (distance < config.attackRange) {
        state.health = Math.max(0, state.health - config.damagePerSecond * deltaSec);
        playDamageSfx();
        if (state.health <= 0) {
          endGame(false);
        }
      }
    });
  };

  const updateTurrets = (deltaSec) => {
    if (!turrets.length || !enemies.length) return;
    turrets.forEach((turret) => {
      turret.cooldown = Math.max(0, turret.cooldown - deltaSec);
      if (turret.cooldown > 0) return;
      const target = enemies.reduce((closest, enemy) => {
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
    if (!isPlayerSafe()) fearGain += 0.4;
    if (state.health < 40) fearGain += GAME_CONFIG.fear.lowHealthGainPerSec;
    if (phantom && phantom.isVisible) {
      const distance = BABYLON.Vector3.Distance(phantom.position, player.position);
      if (distance < 6) fearGain += GAME_CONFIG.fear.phantomGainPerSec;
    }
    if (fearGain > 0) {
      state.fear = Math.min(GAME_CONFIG.fear.max, state.fear + fearGain * deltaSec);
    } else {
      state.fear = Math.max(0, state.fear - GAME_CONFIG.fear.safeLossPerSec * deltaSec);
    }
    if (fearOverlay) {
      const alpha = Math.min(0.6, state.fear / GAME_CONFIG.fear.max * 0.6);
      fearOverlay.style.background = `rgba(30, 10, 40, ${alpha})`;
    }
  };

  const startCrewEscort = () => {
    if (!crewMember || state.crewEscortActive || state.crewRescued) return;
    state.crewEscortActive = true;
    crewStatus.classList.remove('hidden');
    setStatusMessage('Crew member following you', 2);
  };

  const updateCrewEscort = (deltaSec) => {
    if (!crewMember || !state.crewEscortActive) return;
    const toPlayer = player.position.subtract(crewMember.position);
    toPlayer.y = 0;
    if (toPlayer.lengthSquared() > 0.5) {
      toPlayer.normalize();
      crewMember.position = crewMember.position.add(toPlayer.scale(1.4 * deltaSec));
    }
    const distanceToLSG = BABYLON.Vector3.Distance(crewMember.position, lsg.position);
    if (distanceToLSG < 2.5) {
      state.crewEscortActive = false;
      state.crewRescued = true;
      crewStatus.classList.add('hidden');
      crewMember.dispose();
      setStatusMessage('Crew member rescued! +25% crafting speed', 3);
    }
  };

  const isPlayerSafe = () => {
    const distance = BABYLON.Vector3.Distance(player.position, lsg.position);
    return distance <= GAME_CONFIG.lsg.lightRadius && state.fuel > 0;
  };

  const updatePickups = (deltaSec) => {
    if (!pickups.length) return;
    const pickupRadius = GAME_CONFIG.resources.pickupRadius;

    pickups = pickups.filter((pickup) => {
      if (!pickup.mesh || pickup.mesh.isDisposed()) {
        return false;
      }

      pickup.bobOffset += deltaSec * 2.2;
      pickup.mesh.position.y = pickup.baseY + Math.sin(pickup.bobOffset) * 0.15;
      pickup.mesh.rotation.y += deltaSec;

      const distance = BABYLON.Vector3.Distance(player.position, pickup.mesh.position);
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
    playPickupSfx(type);
  };

  const updateStatus = (deltaSec) => {
    if (state.statusTimer <= 0) return;
    state.statusTimer = Math.max(0, state.statusTimer - deltaSec);
    if (state.statusTimer === 0) {
      state.statusMessage = '';
    }
  };

  const setStatusMessage = (message, durationSec = 2) => {
    state.statusMessage = message;
    state.statusTimer = durationSec;
  };

  const updateHUD = () => {
    const phaseLabel = state.isNight ? 'Lights Off' : 'Lights On';
    cycleIndicator.textContent = `Cycle ${state.cycle} / ${GAME_CONFIG.totalCycles} · ${phaseLabel}`;

    const fuelPct = Math.round((state.fuel / GAME_CONFIG.lsg.maxFuelSec) * 100);
    fuelMeter.textContent = `${Math.max(0, fuelPct)}%`;
    fuelCells.textContent = `Cells: ${state.fuelCells}`;
    healthMeter.textContent = `${Math.round(state.health)}%`;
    if (flashlightMeter) {
      const flashPct = Math.round((state.flashlightBattery / GAME_CONFIG.flashlight.maxBatterySec) * 100);
      flashlightMeter.textContent = `${Math.max(0, flashPct)}% ${state.flashlightOn ? 'On' : 'Off'}`;
    }
    if (fearMeter) {
      fearMeter.textContent = `${Math.round(state.fear)}%`;
    }
    scrapCount.textContent = `${state.resources.scrap}`;
    circuitCount.textContent = `${state.resources.circuits}`;

    const phaseDuration = state.isNight
      ? GAME_CONFIG.cycle.nightDurationSec
      : GAME_CONFIG.cycle.dayDurationSec;
    const remaining = Math.max(0, Math.ceil(phaseDuration - state.timeInPhase));
    phaseTimer.textContent = `${remaining}s`;

    if (state.statusTimer > 0) {
      statusIndicator.textContent = state.statusMessage;
      return;
    }

    if (state.fuel <= 0) {
      statusIndicator.textContent = 'LSG offline - Phantom unleashed!';
    } else if (state.isNight) {
      statusIndicator.textContent = isPlayerSafe() ? 'Safe zone active' : 'Lights off - stay close to LSG';
    } else {
      statusIndicator.textContent = 'Systems stable';
    }
  };

  const awardCycleRewards = () => {
    if (!playerProfile || typeof LuminaCore === 'undefined') return;
    LuminaCore.addXP(playerProfile.id, 10, GAME_CONFIG.id);
    LuminaCore.addCoins(playerProfile.id, 5, GAME_CONFIG.id);
  };

  const endGame = (victory) => {
    state.gameOver = true;
    gameMessage.classList.remove('hidden');
    if (victory) {
      gameMessageTitle.textContent = 'Rescue Window Reached!';
      gameMessageBody.textContent = 'You survived all 99 cycles. The rescue team is inbound.';
    } else {
      gameMessageTitle.textContent = 'The Phantom Caught You';
      gameMessageBody.textContent = 'Respawn at the LSG and regroup for the next run.';
    }

    if (playerProfile && typeof LuminaCore !== 'undefined') {
      LuminaCore.recordGameEnd(playerProfile.id, GAME_CONFIG.id, {
        cyclesSurvived: Math.max(0, state.cycle - (state.isNight ? 1 : 0)),
        survived: victory ? 1 : 0
      });
    }
  };

  window.SpaceNightsGame = { init };
})();
