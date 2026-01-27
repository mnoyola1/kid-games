(() => {
  const { dom, constants, runtime, state, collections, systems, helpers } = window.SpaceNights;

  const setupCraftingUI = () => {
    if (!dom.craftingPanel || !dom.craftingRecipes || !dom.closeCraftingBtn) return;
    dom.closeCraftingBtn.addEventListener('click', closeCraftingPanel);
    renderCraftingRecipes();
  };

  const renderCraftingRecipes = () => {
    if (!dom.craftingRecipes) return;
    dom.craftingRecipes.innerHTML = '';
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
      dom.craftingRecipes.appendChild(row);
    });
  };

  const openCraftingPanel = () => {
    if (!dom.craftingPanel) return;
    dom.craftingPanel.classList.remove('hidden');
  };

  const closeCraftingPanel = () => {
    if (!dom.craftingPanel) return;
    dom.craftingPanel.classList.add('hidden');
  };

  const toggleCraftingPanel = () => {
    if (!dom.craftingPanel) return;
    dom.craftingPanel.classList.toggle('hidden');
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
      helpers.setStatusMessage?.('Not enough resources', 2);
      return;
    }
    Object.entries(computedCost).forEach(([key, value]) => {
      state.resources[key] -= value;
    });
    if (recipe.grants.fuelCells) state.fuelCells += recipe.grants.fuelCells;
    if (recipe.grants.barriers) state.inventory.barriers += recipe.grants.barriers;
    if (recipe.grants.turrets) state.inventory.turrets += recipe.grants.turrets;
    if (recipe.grants.medkits) state.inventory.medkits += recipe.grants.medkits;
    helpers.setStatusMessage?.(`Crafted ${recipe.name}`, 2);
  };

  const setBuildMode = (mode) => {
    if (mode === 'barrier' && state.inventory.barriers <= 0) {
      helpers.setStatusMessage?.('No barriers available', 2);
      return;
    }
    if (mode === 'turret' && state.inventory.turrets <= 0) {
      helpers.setStatusMessage?.('No turrets available', 2);
      return;
    }
    if (runtime.buildMode === mode) {
      runtime.buildMode = null;
      if (runtime.buildPreviewMesh) runtime.buildPreviewMesh.isVisible = false;
      if (runtime.buildGrid) runtime.buildGrid.isVisible = false;
      return;
    }
    runtime.buildMode = mode;
    if (runtime.buildGrid) runtime.buildGrid.isVisible = true;
    createBuildPreviewMesh(mode);
  };

  const createBuildPreviewMesh = (mode) => {
    const { scene } = runtime;
    if (!scene) return;

    if (runtime.buildPreviewMesh) {
      runtime.buildPreviewMesh.dispose();
    }
    if (mode === 'barrier') {
      runtime.buildPreviewMesh = BABYLON.MeshBuilder.CreateBox(
        'barrier-preview',
        { width: 1.5, height: 1.2, depth: 0.4 },
        scene
      );
    } else if (mode === 'turret') {
      runtime.buildPreviewMesh = BABYLON.MeshBuilder.CreateCylinder(
        'turret-preview',
        { height: 1.0, diameter: 0.6 },
        scene
      );
    }
    if (runtime.buildPreviewMesh) {
      const mat = new BABYLON.StandardMaterial('previewMat', scene);
      mat.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.9);
      mat.alpha = 0.4;
      runtime.buildPreviewMesh.material = mat;
      runtime.buildPreviewMesh.isPickable = false;
    }
  };

  const getBuildPlacementPosition = () => {
    const { camera, player } = runtime;
    if (!camera || !player) return new BABYLON.Vector3(0, constants.WORLD_FLOOR_Y, 0);

    const forward = camera.getForwardRay().direction;
    const flatForward = new BABYLON.Vector3(forward.x, 0, forward.z);
    if (flatForward.lengthSquared() < 0.01) return player.position.clone();
    flatForward.normalize();
    const raw = player.position.add(flatForward.scale(2.0));
    const snap = 1;
    const snappedX = Math.round(raw.x / snap) * snap;
    const snappedZ = Math.round(raw.z / snap) * snap;
    return new BABYLON.Vector3(snappedX, constants.WORLD_FLOOR_Y, snappedZ);
  };

  const updateBuildPreview = () => {
    if (!runtime.buildMode || !runtime.buildPreviewMesh) {
      if (runtime.buildGrid) runtime.buildGrid.isVisible = false;
      return;
    }
    const pos = getBuildPlacementPosition();
    if (runtime.buildGrid) {
      runtime.buildGrid.isVisible = true;
      runtime.buildGrid.position = new BABYLON.Vector3(pos.x, 0, pos.z);
    }
    if (runtime.buildMode === 'barrier') {
      runtime.buildPreviewMesh.position = new BABYLON.Vector3(pos.x, constants.WORLD_FLOOR_Y + 0.6, pos.z);
    } else if (runtime.buildMode === 'turret') {
      runtime.buildPreviewMesh.position = new BABYLON.Vector3(pos.x, constants.WORLD_FLOOR_Y + 0.5, pos.z);
    }
  };

  const confirmBuildPlacement = () => {
    if (!runtime.buildMode) return false;
    const pos = getBuildPlacementPosition();
    if (runtime.buildMode === 'barrier') {
      placeBarrierAt(pos);
    } else if (runtime.buildMode === 'turret') {
      placeTurretAt(pos);
    }
    return true;
  };

  const placeBarrierAt = (position) => {
    const { scene, player } = runtime;
    if (!scene || state.inventory.barriers <= 0 || !player) {
      helpers.setStatusMessage?.('No barriers available', 2);
      return;
    }
    const barrier = BABYLON.MeshBuilder.CreateBox(
      `barrier-${Date.now()}`,
      { width: 1.5, height: 1.2, depth: 0.4 },
      scene
    );
    barrier.position = new BABYLON.Vector3(position.x, constants.WORLD_FLOOR_Y + 0.6, position.z);
    barrier.checkCollisions = true;
    const mat = new BABYLON.StandardMaterial('barrierMat', scene);
    mat.diffuseColor = new BABYLON.Color3(0.3, 0.35, 0.45);
    barrier.material = mat;
    collections.barriers.push(barrier);
    state.inventory.barriers -= 1;
    helpers.setStatusMessage?.('Barrier placed', 2);
  };

  const placeTurretAt = (position) => {
    const { scene, player } = runtime;
    if (!scene || state.inventory.turrets <= 0 || !player) {
      helpers.setStatusMessage?.('No turrets available', 2);
      return;
    }
    const turret = BABYLON.MeshBuilder.CreateCylinder(
      `turret-${Date.now()}`,
      { height: 1.0, diameter: 0.6 },
      scene
    );
    turret.position = new BABYLON.Vector3(position.x, constants.WORLD_FLOOR_Y + 0.5, position.z);
    turret.checkCollisions = true;
    const mat = new BABYLON.StandardMaterial('turretMat', scene);
    mat.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1);
    turret.material = mat;
    collections.turrets.push({ mesh: turret, cooldown: 0 });
    state.inventory.turrets -= 1;
    helpers.setStatusMessage?.('Turret placed', 2);
  };

  systems.setupCraftingUI = setupCraftingUI;
  systems.renderCraftingRecipes = renderCraftingRecipes;
  systems.openCraftingPanel = openCraftingPanel;
  systems.closeCraftingPanel = closeCraftingPanel;
  systems.toggleCraftingPanel = toggleCraftingPanel;
  systems.craftRecipe = craftRecipe;
  systems.setBuildMode = setBuildMode;
  systems.updateBuildPreview = updateBuildPreview;
  systems.confirmBuildPlacement = confirmBuildPlacement;
  systems.placeBarrierAt = placeBarrierAt;
  systems.placeTurretAt = placeTurretAt;
})();
