(() => {
  const { runtime, state, systems } = window.SpaceNights;

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

  const setupAudio = () => {
    runtime.audioState = {
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
      if (runtime.audioState.ready) return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      runtime.audioState.context = context;

      runtime.audioState.masterGain = context.createGain();
      runtime.audioState.masterGain.gain.value = GAME_CONFIG.audio.masterVolume;
      runtime.audioState.masterGain.connect(context.destination);

      runtime.audioState.ambientGain = context.createGain();
      runtime.audioState.ambientGain.gain.value = GAME_CONFIG.audio.ambientVolume;
      runtime.audioState.ambientGain.connect(runtime.audioState.masterGain);

      runtime.audioState.nightGain = context.createGain();
      runtime.audioState.nightGain.gain.value = 0;
      runtime.audioState.nightGain.connect(runtime.audioState.masterGain);

      runtime.audioState.humOsc = createOscillator(context, 55, 'sine', runtime.audioState.ambientGain);
      runtime.audioState.noise = createNoise(context, runtime.audioState.ambientGain);
      runtime.audioState.nightOsc = createOscillator(context, 140, 'triangle', runtime.audioState.nightGain);

      runtime.audioState.ready = true;
      updateAmbientAudio();
    };

    const unlockAndResume = () => {
      unlockAudio();
      if (runtime.audioState.context && runtime.audioState.context.state === 'suspended') {
        runtime.audioState.context.resume();
      }
    };

    window.addEventListener('pointerdown', unlockAndResume, { once: true });
    window.addEventListener('keydown', unlockAndResume, { once: true });
  };

  const updateAmbientAudio = () => {
    if (!runtime.audioState || !runtime.audioState.ready) return;
    const now = runtime.audioState.context.currentTime;
    const nightTarget = state.isNight || state.fuel <= 0 ? GAME_CONFIG.audio.nightBoost : 0;
    const baseTarget = GAME_CONFIG.audio.ambientVolume + (state.isNight ? 0.05 : 0);
    runtime.audioState.nightGain.gain.setTargetAtTime(nightTarget, now, 0.4);
    runtime.audioState.ambientGain.gain.setTargetAtTime(baseTarget, now, 0.4);
  };

  const shouldThrottleSfx = (key, intervalSec) => {
    const now = performance.now();
    if (runtime.audioState.lastSfx[key] && now - runtime.audioState.lastSfx[key] < intervalSec * 1000) {
      return true;
    }
    runtime.audioState.lastSfx[key] = now;
    return false;
  };

  const playSfx = (frequency, duration, type, volume) => {
    if (!runtime.audioState || !runtime.audioState.ready) return;
    const now = runtime.audioState.context.currentTime;
    const osc = runtime.audioState.context.createOscillator();
    const gain = runtime.audioState.context.createGain();
    const scaledVolume = volume * GAME_CONFIG.audio.sfxVolume;

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(scaledVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(runtime.audioState.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  };

  const playPickupSfx = (type) => {
    if (!runtime.audioState || !runtime.audioState.ready || shouldThrottleSfx('pickup', 0.15)) return;
    const frequency = type === 'fuel' ? 520 : type === 'circuit' ? 620 : 420;
    playSfx(frequency, 0.18, 'triangle', 0.35);
  };

  const playRefuelSfx = () => {
    if (!runtime.audioState || !runtime.audioState.ready || shouldThrottleSfx('refuel', 0.25)) return;
    playSfx(300, 0.2, 'sawtooth', 0.4);
  };

  const playDamageSfx = () => {
    if (!runtime.audioState || !runtime.audioState.ready || shouldThrottleSfx('damage', 0.3)) return;
    playSfx(120, 0.15, 'square', 0.45);
  };

  systems.setupAudio = setupAudio;
  systems.updateAmbientAudio = updateAmbientAudio;
  systems.playSfx = playSfx;
  systems.playPickupSfx = playPickupSfx;
  systems.playRefuelSfx = playRefuelSfx;
  systems.playDamageSfx = playDamageSfx;
  systems.shouldThrottleSfx = shouldThrottleSfx;
})();
