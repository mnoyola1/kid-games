/**
 * AudioManager - Handles all audio for Word Hunt
 */
class AudioManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.sfxVolume = 0.7;
    this.musicVolume = 0.4;
    this.initialized = false;
    this.unlocked = false;
  }
  
  async init() {
    if (this.initialized) return;
    
    try {
      // Load sound effects - use math-quest sounds for common SFX
      this.sounds.select = new Audio('../assets/audio/math-quest/sfx/click.mp3');
      this.sounds.found = new Audio('../assets/audio/math-quest/sfx/correct.mp3');
      this.sounds.wrong = new Audio('../assets/audio/math-quest/sfx/wrong.mp3');
      this.sounds.hint = new Audio('../assets/audio/word-hunt/sfx/hint.mp3');
      this.sounds.wordComplete = new Audio('../assets/audio/word-hunt/sfx/word-complete.mp3');
      this.sounds.puzzleComplete = new Audio('../assets/audio/word-hunt/sfx/puzzle-complete.mp3');
      this.sounds.victory = new Audio('../assets/audio/word-hunt/sfx/victory.mp3');
      
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
  
  // Unlock audio on iOS/Safari (call on first user interaction)
  unlock() {
    if (this.unlocked) return;
    
    try {
      // Play and immediately pause all sounds to unlock iOS audio
      Object.values(this.sounds).forEach(sound => {
        if (sound) {
          sound.play().then(() => {
            sound.pause();
            sound.currentTime = 0;
          }).catch(() => {});
        }
      });
      
      this.unlocked = true;
      console.log('🔓 Audio unlocked for iOS/Safari');
    } catch (e) {
      console.warn('Audio unlock failed:', e);
    }
  }
  
  playSound(soundName) {
    try {
      const sound = this.sounds[soundName];
      if (sound) {
        sound.currentTime = 0;
        const playPromise = sound.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.warn('Sound play failed:', soundName, e);
            // Try to unlock if not already
            if (!this.unlocked) {
              this.unlock();
            }
          });
        }
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
      
      this.music = new Audio(`../assets/audio/word-hunt/music/${trackName}.wav`);
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
