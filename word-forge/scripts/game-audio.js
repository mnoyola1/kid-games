// ==================== SOUND SYSTEM ====================
let synth = null;
let metalSynth = null;
let noiseSynth = null;

const initAudio = async () => {
  if (synth) return;
  await Tone.start();
  
  synth = new Tone.PolySynth(Tone.Synth).toDestination();
  synth.volume.value = -10;
  
  metalSynth = new Tone.MetalSynth().toDestination();
  metalSynth.volume.value = -15;
  
  noiseSynth = new Tone.NoiseSynth().toDestination();
  noiseSynth.volume.value = -20;
};

const playSound = (type) => {
  if (!synth) return;
  
  switch(type) {
    case 'type':
      synth.triggerAttackRelease('C5', '0.05');
      break;
    case 'correct':
      synth.triggerAttackRelease(['E5', 'G5', 'C6'], '0.2');
      break;
    case 'wrong':
      synth.triggerAttackRelease(['C4', 'Eb4'], '0.3');
      break;
    case 'hammer':
      metalSynth.triggerAttackRelease('C2', '0.1');
      break;
    case 'forge':
      synth.triggerAttackRelease(['C4', 'E4', 'G4', 'C5'], '0.5');
      noiseSynth.triggerAttackRelease('0.3');
      break;
    case 'legendary':
      const now = Tone.now();
      synth.triggerAttackRelease('C5', '0.2', now);
      synth.triggerAttackRelease('E5', '0.2', now + 0.1);
      synth.triggerAttackRelease('G5', '0.2', now + 0.2);
      synth.triggerAttackRelease('C6', '0.4', now + 0.3);
      break;
    case 'combo':
      synth.triggerAttackRelease(['G5', 'B5', 'D6'], '0.15');
      break;
  }
};
