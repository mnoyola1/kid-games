(() => {
  const { dom, runtime, inputState, touchState, systems, state } = window.SpaceNights;

  const setupCamera = () => {
    const { scene, player } = runtime;
    if (!scene || !player) return;

    const fixedRadius = 6; // Fixed camera distance (like 99 Nights)

    runtime.camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 4, // Lower angle (more behind player)
      fixedRadius,
      player.position.clone(),
      scene
    );
    runtime.camera.attachControl(dom.canvas, true);

    // Lock camera angle limits
    runtime.camera.lowerBetaLimit = 0.4;
    runtime.camera.upperBetaLimit = 1.0;

    // Lock zoom to fixed distance - no zoom in/out allowed
    runtime.camera.lowerRadiusLimit = fixedRadius;
    runtime.camera.upperRadiusLimit = fixedRadius;

    // Disable all zoom controls
    runtime.camera.wheelPrecision = 0; // Disable mouse wheel zoom
    runtime.camera.pinchPrecision = 0; // Disable pinch zoom
    runtime.camera.panningSensibility = 0; // Disable panning
    runtime.camera.inputs.removeByType('ArcRotateCameraMouseWheelInput');

    // Don't use camera collision
    runtime.camera.checkCollisions = false;

    // Track walls that might block view for fading
    scene.registerBeforeRender(() => {
      fadeBlockingWalls();
    });
  };

  const fadeBlockingWalls = () => {
    const { scene, player, camera } = runtime;
    if (!scene || !player || !camera) return;

    // Restore previously faded walls
    runtime.fadedWalls.forEach((wall) => {
      if (wall.material) {
        wall.material.alpha = 1;
      }
    });
    runtime.fadedWalls = [];

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
            runtime.fadedWalls.push(mesh);
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
            systems.handleInteraction();
          }
          break;
        case 'f':
          if (!inputState.flashlight) {
            inputState.flashlight = true;
            systems.toggleFlashlight();
          }
          break;
        case 'c':
          if (!inputState.craft) {
            inputState.craft = true;
            systems.toggleCraftingPanel();
          }
          break;
        case 'b':
          inputState.placeBarrier = true;
          systems.setBuildMode('barrier');
          break;
        case 't':
          inputState.placeTurret = true;
          systems.setBuildMode('turret');
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
    if (navigator.maxTouchPoints > 0 && dom.touchControls) {
      dom.touchControls.classList.remove('hidden');
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
          if (value) systems.toggleCraftingPanel();
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
    if (dom.interactBtn) {
      dom.interactBtn.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        systems.handleInteraction();
      });
    }
  };

  systems.setupCamera = setupCamera;
  systems.fadeBlockingWalls = fadeBlockingWalls;
  systems.setupInput = setupInput;
  systems.setupTouchControls = setupTouchControls;
})();
