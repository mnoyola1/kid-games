(() => {
  const { dom, runtime, systems } = window.SpaceNights;

  const init = () => {
    runtime.engine = new BABYLON.Engine(dom.canvas, true, { preserveDrawingBuffer: true });
    runtime.scene = new BABYLON.Scene(runtime.engine);
    runtime.scene.clearColor = new BABYLON.Color4(0.02, 0.04, 0.08, 1);
    runtime.scene.collisionsEnabled = true;

    systems.createEnvironment();
    systems.createPlayer();
    systems.createLights();
    systems.createLSG();
    systems.createPhantom();
    systems.createWorkbench();
    systems.createCrewMember();
    systems.createFlashlight();
    systems.createBuildPreview();
    systems.setupCamera();
    systems.setupInput();
    systems.setupTouchControls();
    systems.setupAudio();
    systems.setupCraftingUI();
    systems.setupLuminaCore();
    systems.setupRestart();

    runtime.engine.runRenderLoop(() => {
      const deltaSec = runtime.engine.getDeltaTime() / 1000;
      systems.update(deltaSec);
      runtime.scene.render();
    });

    window.addEventListener('resize', () => runtime.engine.resize());
  };

  window.SpaceNightsGame = { init };
})();
