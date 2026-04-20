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
    // Prefer Lyria 3 MP3s (longer, smaller, better) — generated via
    // _shared/tools/audio/extend_music.py. Fall back to the original
    // Lyria 2 WAVs for any tracks that haven't been upgraded yet.
    const EXTS = ['mp3', 'wav'];

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

    const targetEl = this.musicPlayers[track];
    if (!targetEl) return;

    // If the requested track is already the current track AND actually
    // playing, do nothing — this is the common case when a parent component
    // re-renders (e.g. the player attacked and monster HP changed) and calls
    // playMusic('battle') again. Restarting from 0 here is what caused the
    // "music skips when I click attack" issue.
    if (this.currentMusic === track && !targetEl.paused) {
      return;
    }

    // If same track but currently paused (e.g. tab was backgrounded), just
    // resume from where we left off rather than rewinding.
    if (this.currentMusic === track && targetEl.paused) {
      targetEl.volume = this.musicVolume;
      targetEl.play().catch(e => {
        console.warn('[china-adventure] Music resume failed:', e);
      });
      return;
    }

    // Switching to a different track: stop + rewind the old one, start the
    // new one from the beginning.
    if (this.currentMusic && this.musicPlayers[this.currentMusic]) {
      this.musicPlayers[this.currentMusic].pause();
      this.musicPlayers[this.currentMusic].currentTime = 0;
    }

    this.currentMusic = track;
    targetEl.currentTime = 0;
    targetEl.volume = this.musicVolume;
    targetEl.play().catch(e => {
      console.warn('[china-adventure] Music play failed:', e);
    });
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
