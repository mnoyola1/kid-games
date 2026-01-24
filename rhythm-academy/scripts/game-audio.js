// ==================== AUDIO MANAGER ====================
class AudioManager {
  constructor() {
    this.musicPlayers = {};
    this.currentMusic = null;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.6;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.sfxCache = {};
  }
  
  preloadMusic() {
    const MUSIC_TRACKS = {
      menu: 'menu.mp3',
      song1_easy: 'song1_easy.mp3',
      song2_medium: 'song2_medium.mp3',
      song3_hard: 'song3_hard.mp3',
      victory: 'victory.mp3'
    };
    
    const MUSIC_BASE_URL = '../assets/audio/rhythm-academy/music/';
    
    Object.entries(MUSIC_TRACKS).forEach(([key, filename]) => {
      const audio = new Audio(MUSIC_BASE_URL + filename);
      audio.preload = 'auto';
      audio.loop = key !== 'victory';
      audio.volume = this.musicVolume;
      this.musicPlayers[key] = audio;
    });
  }
  
  playMusic(track) {
    if (!this.musicEnabled) return;
    
    if (this.currentMusic && this.musicPlayers[this.currentMusic]) {
      this.musicPlayers[this.currentMusic].pause();
      this.musicPlayers[this.currentMusic].currentTime = 0;
    }
    
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
      hit_perfect: 'hit_perfect.mp3',
      hit_good: 'hit_good.mp3',
      hit_miss: 'hit_miss.mp3',
      combo_break: 'combo_break.mp3',
      combo_10: 'combo_10.mp3',
      combo_20: 'combo_20.mp3',
      star_earned: 'star_earned.mp3',
      song_complete: 'song_complete.mp3',
      select: 'select.mp3',
      click: 'click.mp3'
    };
    
    const SFX_BASE_URL = '../assets/audio/rhythm-academy/sfx/';
    
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
