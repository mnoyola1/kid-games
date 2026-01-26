// ==================== AUDIO MANAGER ====================
class AudioManager {
  constructor() {
    this.musicPlayers = {};
    this.currentMusic = null;
    this.musicVolume = 0.45;
    this.musicEnabled = true;
    this.musicPreloaded = false;
  }
  
  preloadMusic() {
    if (this.musicPreloaded) return;
    this.musicPreloaded = true;
    
    const MUSIC_TRACKS = {
      menu: 'menu.wav',
      map: 'map.wav',
      battle: 'battle.wav',
      victory: 'victory.wav',
      gameover: 'gameover.wav'
    };
    
    const MUSIC_BASE_URL = '../assets/audio/canada-adventure/music/';
    
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
  
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    } else if (this.currentMusic) {
      this.playMusic(this.currentMusic);
    }
    return this.musicEnabled;
  }
}
