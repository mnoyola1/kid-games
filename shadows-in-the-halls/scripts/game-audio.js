// ==================== AUDIO MANAGER ====================

class AudioManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    const basePath = '../assets/audio/shadows-in-the-halls';
    
    // Load all sound effects
    this.sounds = {
      footstep: new Audio(`${basePath}/sfx/footstep.mp3`),
      doorUnlock: new Audio(`${basePath}/sfx/door_unlock.mp3`),
      batteryPickup: new Audio(`${basePath}/sfx/battery_pickup.mp3`),
      puzzleSolve: new Audio(`${basePath}/sfx/puzzle_solve.mp3`),
      shadowGrowl: new Audio(`${basePath}/sfx/shadow_growl.mp3`),
      flashlightDying: new Audio(`${basePath}/sfx/flashlight_dying.mp3`),
      caught: new Audio(`${basePath}/sfx/caught.mp3`),
      
      // Voice lines
      batteryLow: new Audio(`${basePath}/voice/battery_low.mp3`),
      puzzleCorrect: new Audio(`${basePath}/voice/puzzle_correct.mp3`),
      escapeFound: new Audio(`${basePath}/voice/escape_found.mp3`),
    };

    // Set volumes
    Object.values(this.sounds).forEach(sound => {
      sound.volume = 0.7;
    });

    // Lower volume for ambient sounds
    if (this.sounds.shadowGrowl) this.sounds.shadowGrowl.volume = 0.5;
    if (this.sounds.footstep) this.sounds.footstep.volume = 0.4;

    this.initialized = true;
    console.log('🔊 Audio Manager initialized');
  }

  play(soundName, options = {}) {
    if (!this.enabled || !this.initialized) return;
    
    const sound = this.sounds[soundName];
    if (!sound) {
      console.warn(`Sound not found: ${soundName}`);
      return;
    }

    try {
      // Clone for overlapping sounds
      const soundClone = sound.cloneNode();
      soundClone.volume = options.volume !== undefined ? options.volume : sound.volume;
      
      soundClone.play().catch(err => {
        console.warn(`Failed to play ${soundName}:`, err);
      });
    } catch (err) {
      console.warn(`Error playing ${soundName}:`, err);
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// Create global instance
const audioManager = new AudioManager();
