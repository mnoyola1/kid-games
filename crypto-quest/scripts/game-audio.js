/**
 * AudioManager - Handles all audio for Crypto Quest
 */
class AudioManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.sfxVolume = 0.7;
    this.musicVolume = 0.4;
    this.initialized = false;
  }
  
  async init() {
    if (this.initialized) return;
    
    try {
      // Load sound effects
      this.sounds.correct = new Audio('../assets/audio/shared/sfx/correct.mp3');
      this.sounds.wrong = new Audio('../assets/audio/shared/sfx/wrong.mp3');
      this.sounds.click = new Audio('../assets/audio/shared/sfx/click.mp3');
      this.sounds.hint = new Audio('../assets/audio/crypto-quest/sfx/hint.mp3');
      this.sounds.complete = new Audio('../assets/audio/crypto-quest/sfx/complete.mp3');
      this.sounds.victory = new Audio('../assets/audio/crypto-quest/sfx/victory.mp3');
      
      // Set volumes
      Object.values(this.sounds).forEach(sound => {
        sound.volume = this.sfxVolume;
      });
      
      this.initialized = true;
      console.log('🔊 AudioManager initialized');
    } catch (e) {
      console.warn('⚠️ Audio initialization failed (assets may not exist yet)', e);
    }
  }
  
  playSound(soundName) {
    try {
      const sound = this.sounds[soundName];
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.warn('Sound play failed:', e));
      }
    } catch (e) {
      console.warn('Sound play error:', e);
    }
  }
  
  playMusic(trackName) {
    try {
      if (this.music) {
        this.music.pause();
      }
      
      this.music = new Audio(`../assets/audio/crypto-quest/music/${trackName}.wav`);
      this.music.volume = this.musicVolume;
      this.music.loop = true;
      this.music.play().catch(e => console.warn('Music play failed:', e));
    } catch (e) {
      console.warn('Music play error:', e);
    }
  }
  
  stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
  }
  
  setMusicVolume(volume) {
    this.musicVolume = volume;
    if (this.music) {
      this.music.volume = volume;
    }
  }
  
  setSFXVolume(volume) {
    this.sfxVolume = volume;
    Object.values(this.sounds).forEach(sound => {
      sound.volume = volume;
    });
  }
}
