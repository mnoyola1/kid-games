(() => {
  const { assets, constants, runtime, systems, helpers } = window.SpaceNights;

  const createEnvironment = () => {
    const { scene } = runtime;
    if (!scene) return;

    // Texture base path (same folder as wall models)
    const textureBase = `${assets.QUAT_GLTF_BASE_URL}Walls/`;

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
    systems.createChest('chest-1', new BABYLON.Vector3(14, 0, 3), { scrap: 3, circuits: 1 });
    systems.createChest('chest-2', new BABYLON.Vector3(-14, 0, 2), { fuelCells: 2, scrap: 1 });

    systems.createPickups();
  };

  const createRoom = (room, groundMat, wallMat) => {
    const { scene } = runtime;
    if (!scene) return;

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
    const { scene } = runtime;
    if (!scene) return null;

    const floor = BABYLON.MeshBuilder.CreateGround(name, { width, height: depth }, scene);
    floor.position = position.clone();
    floor.material = material;
    floor.checkCollisions = true;
    if (collisionOnly) {
      setCollisionOnly(floor);
    }
    return floor;
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
    const { scene } = runtime;
    if (!scene) return null;

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
    return null;
  };

  const createWallSegment = (name, width, height, depth, position, material, collisionOnly = false) => {
    const { scene } = runtime;
    if (!scene) return null;

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
    const { scene } = runtime;
    if (!scene) return;

    const tileSize = 4;
    const moduleScale = 1;
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
          new BABYLON.Vector3(
            startX + x * tileSize,
            constants.VISUAL_FLOOR_Y + constants.FLOOR_VISUAL_OFFSET,
            startZ + z * tileSize
          ),
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
      new BABYLON.Vector3(8, constants.VISUAL_FLOOR_Y + constants.FLOOR_VISUAL_OFFSET, 0),
      new BABYLON.Vector3(-8, constants.VISUAL_FLOOR_Y + constants.FLOOR_VISUAL_OFFSET, 0)
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
    const { scene } = runtime;
    if (!scene) return null;

    const prop = BABYLON.MeshBuilder.CreateBox(name, { width: 1.2, height: 1.2, depth: 1.2 }, scene);
    prop.position = position.clone();
    prop.material = material;
    prop.checkCollisions = true;
    return prop;
  };

  const spawnPropModel = (name, fileName, position, scale, fallbackMaterial) => {
    const { scene } = runtime;
    if (!scene) return;

    const placeholder = createProp(`${name}-placeholder`, position, fallbackMaterial);
    if (placeholder) {
      placeholder.scaling = new BABYLON.Vector3(0.7, 0.7, 0.7);
    }

    BABYLON.SceneLoader.ImportMeshAsync('', assets.MODEL_BASE_URL, fileName, scene)
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

        if (placeholder) {
          placeholder.dispose();
        }
      })
      .catch(() => {
        if (placeholder) {
          placeholder.scaling = new BABYLON.Vector3(0.9, 0.9, 0.9);
        }
      });
  };

  const spawnGltfModule = (name, filePath, position, rotation, scale) => {
    const { scene } = runtime;
    if (!scene) return;

    // QUAT_GLTF_BASE_URL is pre-encoded, just concatenate with file path
    const fullUrl = assets.QUAT_GLTF_BASE_URL + filePath;

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
        if (helpers.setStatusMessage) {
          helpers.setStatusMessage(`Module load failed: ${filePath}`, 3);
        }
        console.warn('✗ Module load failed', filePath, error);
      });
  };

  systems.createEnvironment = createEnvironment;
  systems.createRoom = createRoom;
  systems.createFloorTile = createFloorTile;
  systems.createWallWithDoor = createWallWithDoor;
  systems.createWallSegment = createWallSegment;
  systems.createRoomModules = createRoomModules;
  systems.createCorridorModules = createCorridorModules;
  systems.createProp = createProp;
  systems.spawnPropModel = spawnPropModel;
  systems.spawnGltfModule = spawnGltfModule;
})();
