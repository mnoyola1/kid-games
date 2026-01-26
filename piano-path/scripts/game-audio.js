// ==================== AUDIO MANAGER ====================

class AudioManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.sfx = {};
    this.sfxVolume = 0.6;
    this.musicVolume = 0.35;
    this.enabled = true;
  }

  ensureContext() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.9;
      this.masterGain.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  preloadSfx() {
    this.sfx = {
      click: new Audio('../assets/audio/rhythm-academy/sfx/click.mp3'),
      select: new Audio('../assets/audio/rhythm-academy/sfx/select.mp3'),
      success: new Audio('../assets/audio/rhythm-academy/sfx/star_earned.mp3'),
      miss: new Audio('../assets/audio/rhythm-academy/sfx/hit_miss.mp3'),
      combo: new Audio('../assets/audio/rhythm-academy/sfx/combo_10.mp3'),
    };

    Object.values(this.sfx).forEach((audio) => {
      audio.volume = this.sfxVolume;
      audio.preload = 'auto';
    });
  }

  playSfx(name) {
    if (!this.enabled) return;
    const audio = this.sfx[name];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  playNote(note, duration = 0.6, velocity = 0.7, when = 0) {
    if (!this.enabled) return;
    this.ensureContext();

    const now = this.context.currentTime + when;
    const frequency = this.getFrequency(note);
    if (!frequency) return;

    const osc = this.context.createOscillator();
    const osc2 = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    osc.type = 'triangle';
    osc2.type = 'sine';
    osc.frequency.value = frequency;
    osc2.frequency.value = frequency * 2;
    filter.type = 'lowpass';
    filter.frequency.value = 2200;
    filter.Q.value = 0.7;

    const attack = 0.02;
    const decay = 0.2;
    const sustain = 0.55;
    const release = 0.25;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(velocity, now + attack);
    gainNode.gain.linearRampToValueAtTime(velocity * sustain, now + attack + decay);
    gainNode.gain.setValueAtTime(velocity * sustain, now + duration);
    gainNode.gain.linearRampToValueAtTime(0, now + duration + release);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration + release);
    osc2.stop(now + duration + release);
  }

  playChord(notes, duration = 0.6, velocity = 0.7) {
    notes.forEach((note) => this.playNote(note, duration, velocity));
  }

  getFrequency(note) {
    const noteMap = {
      C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5,
      'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11
    };

    const match = note.match(/^([A-G]#?)(\d)$/);
    if (!match) return null;
    const [, pitch, octave] = match;
    const midi = 12 * (parseInt(octave, 10) + 1) + noteMap[pitch];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }
}
