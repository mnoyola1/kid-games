// ==================== AUDIO MANAGER ====================
class AudioManager {
  constructor() {
    this.musicPlayers = {};
    this.currentMusic = null;
    this.musicVolume = 0.4;
    this.sfxVolume = 0.6;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.musicPreloaded = false;
    this.sfxCache = {};
  }
  
  preloadMusic() {
    if (this.musicPreloaded) return;
    this.musicPreloaded = true;
    
    const MUSIC_TRACKS = {
      menu: 'menu.mp3',
      gameplay: 'gameplay.mp3',
      victory: 'victory.mp3',
      gameover: 'gameover.mp3'
    };
    
    const MUSIC_BASE_URL = '../assets/audio/lumina-racer/music/';
    
    Object.entries(MUSIC_TRACKS).forEach(([key, filename]) => {
      const audio = new Audio(MUSIC_BASE_URL + filename);
      audio.preload = 'auto';
      audio.loop = !['victory', 'gameover'].includes(key);
      audio.volume = this.musicVolume;
      this.musicPlayers[key] = audio;
    });
  }
  
  playMusic(track) {
    if (!this.musicEnabled) return;
    
    // Stop current music
    if (this.currentMusic && this.musicPlayers[this.currentMusic]) {
      this.musicPlayers[this.currentMusic].pause();
      this.musicPlayers[this.currentMusic].currentTime = 0;
    }
    
    // Play new track
    if (this.musicPlayers[track]) {
      this.currentMusic = track;
      this.musicPlayers[track].currentTime = 0;
      this.musicPlayers[track].volume = this.musicVolume;
      this.musicPlayers[track].play().catch(e => {
        console.warn('Music play failed:', e);
      });
    }
  }
  
  stopMusic() {
    if (this.currentMusic && this.musicPlayers[this.currentMusic]) {
      this.musicPlayers[this.currentMusic].pause();
      this.musicPlayers[this.currentMusic].currentTime = 0;
      this.currentMusic = null;
    }
  }
  
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic && this.musicPlayers[this.currentMusic]) {
      this.musicPlayers[this.currentMusic].volume = this.musicVolume;
    }
  }
  
  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }
  
  playSFX(soundName) {
    if (!this.sfxEnabled) return;
    
    const SFX_FILES = {
      correct: 'correct.mp3',
      wrong: 'wrong.mp3',
      boost: 'boost.mp3',
      finish: 'finish.mp3',
      countdown: 'countdown.mp3',
      lap: 'lap.mp3'
    };
    
    const SFX_BASE_URL = '../assets/audio/lumina-racer/sfx/';
    
    // Use cached audio or create new
    if (!this.sfxCache[soundName]) {
      const filename = SFX_FILES[soundName];
      if (!filename) {
        console.warn('SFX not found:', soundName);
        return;
      }
      const audio = new Audio(SFX_BASE_URL + filename);
      audio.volume = this.sfxVolume;
      this.sfxCache[soundName] = audio;
    }
    
    // Clone and play (allows overlapping sounds)
    const audio = this.sfxCache[soundName].cloneNode();
    audio.volume = this.sfxVolume;
    audio.play().catch(e => {
      console.warn('SFX play failed:', e);
    });
  }
  
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    } else if (this.currentMusic) {
      this.playMusic(this.currentMusic);
    }
    return this.musicEnabled;
  }
  
  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }
}
