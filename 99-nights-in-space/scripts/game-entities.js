(() => {
  const { assets, constants, runtime, state, collections, systems, helpers } = window.SpaceNights;

  const createChest = (id, position, contents) => {
    const { scene } = runtime;
    if (!scene) return null;

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
    const fullUrl = assets.QUAT_GLTF_BASE_URL + filePath;

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

    collections.chests.push(chest);
    return chest;
  };

  const playChestSfx = () => {
    if (!runtime.audioState || !runtime.audioState.ready) return;
    // Play a nice chest opening sound
    systems.playSfx(330, 0.1, 'triangle', 0.3);
    setTimeout(() => systems.playSfx(440, 0.15, 'triangle', 0.25), 100);
    setTimeout(() => systems.playSfx(550, 0.2, 'triangle', 0.2), 200);
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
    if (helpers.setStatusMessage) {
      helpers.setStatusMessage(message, 3);
    }
    playChestSfx();
  };

  const createPickups = () => {
    const { scene } = runtime;
    if (!scene) return;

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

    collections.pickups = pickupPositions.map((pickup) => createPickup(pickup.id, pickup.type, pickup.position));
  };

  const createPickup = (id, type, position) => {
    const { scene } = runtime;
    if (!scene) return null;

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
    const { scene } = runtime;
    if (!scene) return;

    // Collision capsule (invisible)
    const player = BABYLON.MeshBuilder.CreateCapsule('player', { height: 1.8, radius: 0.4 }, scene);
    player.position = new BABYLON.Vector3(0, constants.GROUND_Y, 6);
    player.checkCollisions = true;
    player.ellipsoid = new BABYLON.Vector3(0.4, 0.9, 0.4);
    player.ellipsoidOffset = new BABYLON.Vector3(0, 0.9, 0);
    player.visibility = 0;
    runtime.player = player;

    // Load astronaut model (Sketchfab GLB)
    const astronautUrl = assets.SKETCHFAB_BASE_URL + 'sample.glb';
    BABYLON.SceneLoader.ImportMeshAsync('', '', astronautUrl, scene)
      .then((result) => {
        const playerModel = new BABYLON.TransformNode('playerModel', scene);
        playerModel.parent = player;
        // Position model so feet align with floor
        // Model origin is at center, so offset down to put feet at ground level
        playerModel.position = new BABYLON.Vector3(0, -1.35, 0);
        // Scale up astronaut
        playerModel.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
        playerModel.rotation = new BABYLON.Vector3(0, 0, 0);

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
        BABYLON.SceneLoader.ImportMeshAsync('', assets.MODEL_BASE_URL, 'astronautA.obj', scene)
          .then((result) => {
            const playerModel = new BABYLON.TransformNode('playerModel', scene);
            playerModel.parent = player;
            // Position model so feet align with floor
            playerModel.position = new BABYLON.Vector3(0, -1.35, 0);
            playerModel.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
            playerModel.rotation = new BABYLON.Vector3(0, 0, 0);

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
    const { scene } = runtime;
    if (!scene) return;

    // Bright ambient light for visibility
    runtime.dayLight = new BABYLON.HemisphericLight('dayLight', new BABYLON.Vector3(0, 1, 0), scene);
    runtime.dayLight.intensity = 1.8;
    runtime.dayLight.groundColor = new BABYLON.Color3(0.5, 0.5, 0.6); // Strong fill from below

    // Directional light for 3D depth
    const dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-0.5, -1, 0.5), scene);
    dirLight.intensity = 0.8;
    dirLight.diffuse = new BABYLON.Color3(1, 0.98, 0.95);

    // Additional fill light
    const fillLight = new BABYLON.HemisphericLight('fillLight', new BABYLON.Vector3(0, -1, 0), scene);
    fillLight.intensity = 0.4;
    fillLight.diffuse = new BABYLON.Color3(0.6, 0.7, 0.8);

    runtime.nightLight = new BABYLON.PointLight('nightLight', new BABYLON.Vector3(0, 6, 0), scene);
    runtime.nightLight.intensity = 0;
    runtime.nightLight.diffuse = new BABYLON.Color3(0.8, 0.2, 0.2);
  };

  const createLSG = () => {
    const { scene } = runtime;
    if (!scene) return;

    // Collision cylinder (invisible)
    const lsg = BABYLON.MeshBuilder.CreateCylinder('lsg', { height: 2, diameter: 1.6 }, scene);
    lsg.position = new BABYLON.Vector3(0, 1, 0);
    lsg.checkCollisions = true;
    lsg.visibility = 0;
    runtime.lsg = lsg;

    // Load Quaternius Access Point as the LSG (more detailed)
    const lsgUrl = assets.QUAT_GLTF_BASE_URL + 'Props/Prop_AccessPoint.gltf';
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

    runtime.lsgLight = new BABYLON.PointLight('lsgLight', new BABYLON.Vector3(0, 2.4, 0), scene);
    runtime.lsgLight.intensity = 1.2;
    runtime.lsgLight.range = GAME_CONFIG.lsg.lightRadius;
    runtime.lsgLight.diffuse = new BABYLON.Color3(0.3, 0.6, 1);
  };

  const createWorkbench = () => {
    const { scene } = runtime;
    if (!scene) return;

    const workbench = BABYLON.MeshBuilder.CreateBox('workbench', { width: 1.2, height: 0.8, depth: 0.8 }, scene);
    workbench.position = new BABYLON.Vector3(2.2, constants.WORLD_FLOOR_Y + 0.4, 1.5);
    workbench.checkCollisions = true;
    const mat = new BABYLON.StandardMaterial('workbenchMat', scene);
    mat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.7);
    mat.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.2);
    workbench.material = mat;
    runtime.workbench = workbench;
  };

  const createCrewMember = () => {
    const { scene } = runtime;
    if (!scene) return;

    const crew = BABYLON.MeshBuilder.CreateSphere('crewMember', { diameter: 1.0 }, scene);
    crew.position = new BABYLON.Vector3(15, constants.WORLD_FLOOR_Y + 0.5, 2);
    crew.checkCollisions = false;
    const mat = new BABYLON.StandardMaterial('crewMat', scene);
    mat.diffuseColor = new BABYLON.Color3(0.6, 0.9, 0.6);
    mat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.1);
    crew.material = mat;
    runtime.crewMember = crew;
  };

  const createFlashlight = () => {
    const { scene } = runtime;
    if (!scene) return;

    runtime.flashlight = new BABYLON.SpotLight(
      'flashlight',
      new BABYLON.Vector3(0, 1.8, 0),
      new BABYLON.Vector3(0, -0.3, 1),
      Math.PI / 4,
      12,
      scene
    );
    runtime.flashlight.intensity = 0;
    runtime.flashlight.diffuse = new BABYLON.Color3(0.9, 0.95, 1);
  };

  const createBuildPreview = () => {
    runtime.buildGrid = createGridLines(6, 1);
    runtime.buildGrid.isVisible = false;
    runtime.buildGrid.isPickable = false;
  };

  const createPhantom = () => {
    const { scene } = runtime;
    if (!scene) return;

    // Collision sphere (invisible)
    const phantom = BABYLON.MeshBuilder.CreateSphere('phantom', { diameter: 1.5 }, scene);
    phantom.position = new BABYLON.Vector3(0, 0.8, -10);
    phantom.isVisible = false;
    runtime.phantom = phantom;

    // Load Quaternius Alien (Cyclop - creepy one-eyed alien)
    const alienUrl = assets.QUAT_GLTF_BASE_URL + 'Aliens/Alien_Cyclop.gltf';
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
        BABYLON.SceneLoader.ImportMeshAsync('', assets.MODEL_BASE_URL, 'alien.obj', scene)
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
    const { scene } = runtime;
    if (!scene) return;

    const config = GAME_CONFIG.enemies[type];
    const mesh = BABYLON.MeshBuilder.CreateSphere(`${type}-${Date.now()}`, { diameter: 1.2 }, scene);
    mesh.position = position.clone();
    mesh.checkCollisions = false;
    mesh.isVisible = false;

    const enemy = {
      type,
      mesh,
      hp: config.hp,
      cooldown: 0,
      visualRoot: null,
      animOffset: Math.random() * Math.PI * 2,
      baseScale: 1
    };

    const modelMap = {
      voidHound: { file: 'Aliens/Alien_Scolitex.gltf', scale: 1.0 },
      cargoBeast: { file: 'Aliens/Alien_Oculichrysalis.gltf', scale: 1.2 },
      corruptedCrew: { file: 'Aliens/Alien_Cyclop.gltf', scale: 0.9 }
    };

    const modelInfo = modelMap[type];
    if (modelInfo) {
      const url = assets.QUAT_GLTF_BASE_URL + modelInfo.file;
      BABYLON.SceneLoader.ImportMeshAsync('', '', url, scene)
        .then((result) => {
          const root = new BABYLON.TransformNode(`${type}-root-${Date.now()}`, scene);
          root.parent = mesh;
          root.position = new BABYLON.Vector3(0, -1.0, 0);
          enemy.baseScale = modelInfo.scale;
          root.scaling = new BABYLON.Vector3(modelInfo.scale, modelInfo.scale, modelInfo.scale);

          if (result.animationGroups) {
            result.animationGroups.forEach((g) => { g.stop(); g.reset(); });
          }

          result.meshes.forEach((child) => {
            if (child.getTotalVertices && child.getTotalVertices() > 0) {
              child.parent = root;
              child.alwaysSelectAsActiveMesh = true;
              child.checkCollisions = false;
              if (type === 'corruptedCrew' && child.material) {
                child.material.emissiveColor = new BABYLON.Color3(0.3, 0.05, 0.05);
              }
            }
          });
          enemy.visualRoot = root;
        })
        .catch(() => {
          mesh.isVisible = true;
          const mat = new BABYLON.StandardMaterial(`${type}-mat`, scene);
          mat.diffuseColor = new BABYLON.Color3(0.6, 0.2, 0.2);
          mesh.material = mat;
        });
    }

    collections.enemies.push(enemy);
  };

  const createGridLines = (size, step) => {
    const { scene } = runtime;
    if (!scene) return null;

    const lines = [];
    const half = size / 2;
    for (let i = -half; i <= half; i += step) {
      lines.push([
        new BABYLON.Vector3(i, constants.WORLD_FLOOR_Y + 0.02, -half),
        new BABYLON.Vector3(i, constants.WORLD_FLOOR_Y + 0.02, half)
      ]);
      lines.push([
        new BABYLON.Vector3(-half, constants.WORLD_FLOOR_Y + 0.02, i),
        new BABYLON.Vector3(half, constants.WORLD_FLOOR_Y + 0.02, i)
      ]);
    }
    const grid = BABYLON.MeshBuilder.CreateLineSystem('build-grid', { lines }, scene);
    grid.color = new BABYLON.Color3(0.2, 0.6, 1);
    return grid;
  };

  const spawnEnemiesForCycle = () => {
    if (!state.isNight) return;
    if (state.cycle >= 6 && !collections.enemies.some((e) => e.type === 'voidHound')) {
      spawnEnemy('voidHound', new BABYLON.Vector3(10, constants.GROUND_Y, -6));
    }
    if (state.cycle >= 15 && !collections.enemies.some((e) => e.type === 'cargoBeast')) {
      spawnEnemy('cargoBeast', new BABYLON.Vector3(-10, constants.GROUND_Y, -6));
    }
    if (state.cycle >= 20 && collections.enemies.filter((e) => e.type === 'corruptedCrew').length < 2) {
      spawnEnemy('corruptedCrew', new BABYLON.Vector3(0, constants.GROUND_Y, -12));
      spawnEnemy('corruptedCrew', new BABYLON.Vector3(6, constants.GROUND_Y, -12));
    }
  };

  systems.createChest = createChest;
  systems.openChest = openChest;
  systems.playChestSfx = playChestSfx;
  systems.createPickups = createPickups;
  systems.createPickup = createPickup;
  systems.createPlayer = createPlayer;
  systems.createLights = createLights;
  systems.createLSG = createLSG;
  systems.createWorkbench = createWorkbench;
  systems.createCrewMember = createCrewMember;
  systems.createFlashlight = createFlashlight;
  systems.createBuildPreview = createBuildPreview;
  systems.createPhantom = createPhantom;
  systems.spawnEnemy = spawnEnemy;
  systems.createGridLines = createGridLines;
  systems.spawnEnemiesForCycle = spawnEnemiesForCycle;
})();
