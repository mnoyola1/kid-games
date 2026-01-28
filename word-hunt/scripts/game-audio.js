/**
 * AudioManager - Handles all audio for Word Hunt
 * Uses fresh Audio instances on touch devices (iOS/Safari) for reliable playback
 */
class AudioManager {
  constructor() {
    this.soundUrls = {};
    this.sounds = {};
    this.music = null;
    this.sfxVolume = 0.7;
    this.musicVolume = 0.4;
    this.initialized = false;
    this.isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }
  
  async init() {
    if (this.initialized) return;
    
    try {
      // Store URLs for touch devices (we create fresh Audio each play on iOS)
      const base = '../assets/audio/';
      this.soundUrls = {
        select: base + 'math-quest/sfx/click.mp3',
        found: base + 'math-quest/sfx/correct.mp3',
        wrong: base + 'math-quest/sfx/wrong.mp3',
        hint: base + 'word-hunt/sfx/hint.mp3',
        wordComplete: base + 'word-hunt/sfx/word-complete.mp3',
        puzzleComplete: base + 'word-hunt/sfx/puzzle-complete.mp3',
        victory: base + 'word-hunt/sfx/victory.mp3'
      };
      
      // Preload Audio elements (desktop reuses them; touch creates fresh each play)
      if (!this.isTouchDevice) {
        this.sounds.select = new Audio(this.soundUrls.select);
        this.sounds.found = new Audio(this.soundUrls.found);
        this.sounds.wrong = new Audio(this.soundUrls.wrong);
        this.sounds.hint = new Audio(this.soundUrls.hint);
        this.sounds.wordComplete = new Audio(this.soundUrls.wordComplete);
        this.sounds.puzzleComplete = new Audio(this.soundUrls.puzzleComplete);
        this.sounds.victory = new Audio(this.soundUrls.victory);
        
        Object.values(this.sounds).forEach(sound => {
          sound.volume = this.sfxVolume;
        });
      }
      
      this.initialized = true;
      console.log('🔊 AudioManager initialized' + (this.isTouchDevice ? ' (touch mode)' : ''));
    } catch (e) {
      console.warn('⚠️ Audio initialization failed (assets may not exist yet)', e);
    }
  }
  
  playSound(soundName) {
    try {
      if (this.isTouchDevice && this.soundUrls[soundName]) {
        // iOS/Safari: create fresh Audio each play - required for touch gesture playback
        const audio = new Audio(this.soundUrls[soundName]);
        audio.volume = this.sfxVolume;
        audio.play().catch(e => console.warn('Sound play failed:', e));
      } else {
        const sound = this.sounds[soundName];
        if (sound) {
          sound.currentTime = 0;
          sound.play().catch(e => console.warn('Sound play failed:', e));
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
