// ==================== AUDIO MANAGER ====================
class AudioManager {
  constructor() {
    this.musicPlayers = {};
    this.currentMusic = null;
    this.musicVolume = 0.4;
    this.sfxVolume = 0.6;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.sfxCache = {};
  }
  
  preloadMusic() {
    const MUSIC_TRACKS = {
      menu: 'menu.mp3',
      world1_math: 'world1_math.mp3',
      world2_science: 'world2_science.mp3',
      world3_history: 'world3_history.mp3',
      boss: 'boss.mp3',
      victory: 'victory.mp3'
    };
    
    const MUSIC_BASE_URL = '../assets/audio/pixel-quest/music/';
    
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
  
  playSFX(soundName) {
    if (!this.sfxEnabled) return;
    
    const SFX_FILES = {
      jump: 'jump.mp3',
      land: 'land.mp3',
      collect_coin: 'collect_coin.mp3',
      collect_star: 'collect_star.mp3',
      checkpoint: 'checkpoint.mp3',
      enemy_defeat: 'enemy_defeat.mp3',
      powerup_collect: 'powerup_collect.mp3',
      level_complete: 'level_complete.mp3',
      death: 'death.mp3',
      door_open: 'door_open.mp3',
      select: 'select.mp3',
      click: 'click.mp3'
    };
    
    const SFX_BASE_URL = '../assets/audio/pixel-quest/sfx/';
    
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
