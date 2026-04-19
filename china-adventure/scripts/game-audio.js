// ==================== AUDIO MANAGER ====================
// Manages background music + optional SFX layering for Dragon Scrolls of China.
// Tracks are generated via Vertex AI Lyria (see _shared/tools/audio/generate_music_vertex.py).
// SFX are generated via ElevenLabs (see _shared/tools/audio/generate_sfx.py).

class AudioManager {
  constructor() {
    this.musicPlayers = {};
    this.sfxCache = {};
    this.currentMusic = null;
    this.musicVolume = 0.45;
    this.sfxVolume = 0.6;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.musicPreloaded = false;
  }

  preloadMusic() {
    if (this.musicPreloaded) return;
    this.musicPreloaded = true;

    const MUSIC_TRACKS = {
      menu:    'menu',
      map:     'exploration',
      battle:  'battle',
      victory: 'victory',
      gameover:'victory',   // reuse victory until a dedicated gameover track exists
    };

    const MUSIC_BASE_URL = '../assets/audio/china-adventure/music/';
    // Lyria 3 preview returns MP3, Lyria 2 fallback returns WAV. Try WAV first
    // (what we actually ship), then fall back to MP3 if a future Lyria 3 pass
    // generates those.
    const EXTS = ['wav', 'mp3'];

    Object.entries(MUSIC_TRACKS).forEach(([key, basename]) => {
      const audio = new Audio(MUSIC_BASE_URL + basename + '.' + EXTS[0]);
      audio.preload = 'auto';
      audio.loop = !['victory', 'gameover'].includes(key);
      audio.volume = this.musicVolume;
      let extIndex = 0;
      audio.addEventListener('error', () => {
        extIndex += 1;
        if (extIndex < EXTS.length) {
          audio.src = MUSIC_BASE_URL + basename + '.' + EXTS[extIndex];
        }
      });
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
        console.warn('[china-adventure] Music play failed:', e);
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

  playSfx(name) {
    if (!this.sfxEnabled) return;
    const url = `../assets/audio/china-adventure/sfx/${name}.mp3`;
    let el = this.sfxCache[name];
    if (!el) {
      el = new Audio(url);
      el.preload = 'auto';
      this.sfxCache[name] = el;
    }
    try {
      el.currentTime = 0;
      el.volume = this.sfxVolume;
      el.play().catch(() => {});
    } catch (_) {}
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
