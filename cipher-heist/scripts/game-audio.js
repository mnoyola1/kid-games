/**
 * Cipher Heist - Audio Manager
 *
 * Layered audio: SFX (one-shots), music (looping), and Vex voice lines.
 * Falls back gracefully if asset files are missing — never throws.
 */

class CipherAudio {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.musicTrack = null;
    this.voice = null;
    this.sfxVolume = 0.6;
    this.musicVolume = 0.35;
    this.voiceVolume = 0.85;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    const sfxBase = '../assets/audio/cipher-heist/sfx/';
    const sharedSfx = '../assets/audio/shared/sfx/';

    const tryLoad = (key, paths) => {
      for (const path of paths) {
        try {
          const a = new Audio(path);
          a.volume = this.sfxVolume;
          this.sounds[key] = a;
          break;
        } catch (e) { /* ignore */ }
      }
    };

    tryLoad('keypadTick',  [sfxBase + 'keypad-tick.mp3', sharedSfx + 'click.mp3']);
    tryLoad('codeSubmit',  [sfxBase + 'code-submit.mp3', sharedSfx + 'click.mp3']);
    tryLoad('correct',     [sfxBase + 'correct.mp3',     sharedSfx + 'correct.mp3']);
    tryLoad('wrong',       [sfxBase + 'wrong.mp3',       sharedSfx + 'wrong.mp3']);
    tryLoad('crackOpen',   [sfxBase + 'crack-open.mp3']);
    tryLoad('crackFail',   [sfxBase + 'crack-fail.mp3',  sharedSfx + 'wrong.mp3']);
    tryLoad('firewall',    [sfxBase + 'firewall.mp3']);
    tryLoad('bitGain',     [sfxBase + 'bit-gain.mp3']);
    tryLoad('scan',        [sfxBase + 'scan.mp3']);
    tryLoad('actionUnlock',[sfxBase + 'action-unlock.mp3']);
    tryLoad('roundStart',  [sfxBase + 'round-start.mp3']);
    tryLoad('roundEnd',    [sfxBase + 'round-end.mp3']);
    tryLoad('alert',       [sfxBase + 'alert.mp3']);

    this.initialized = true;
  }

  setMuted(v) {
    this.muted = !!v;
    if (this.music) this.music.muted = this.muted;
    if (this.voice) this.voice.muted = this.muted;
    Object.values(this.sounds).forEach(s => { s.muted = this.muted; });
  }

  toggleMuted() { this.setMuted(!this.muted); return this.muted; }

  playSound(name) {
    if (this.muted) return;
    try {
      const s = this.sounds[name];
      if (!s) return;
      const clone = s.cloneNode();
      clone.volume = this.sfxVolume;
      clone.play().catch(() => {});
    } catch (e) { /* ignore */ }
  }

  playMusic(track) {
    if (this.musicTrack === track && this.music && !this.music.paused) return;
    try {
      if (this.music) {
        this.music.pause();
        this.music.currentTime = 0;
      }
      const candidates = [
        `../assets/audio/cipher-heist/music/${track}.mp3`,
        `../assets/audio/cipher-heist/music/${track}.wav`,
      ];
      const a = new Audio(candidates[0]);
      a.volume = this.musicVolume;
      a.loop = true;
      a.muted = this.muted;
      // Fallback if first candidate 404s
      a.addEventListener('error', () => {
        try {
          const b = new Audio(candidates[1]);
          b.volume = this.musicVolume;
          b.loop = true;
          b.muted = this.muted;
          b.play().catch(() => {});
          this.music = b;
          this.musicTrack = track;
        } catch (e) { /* ignore */ }
      });
      a.play().catch(() => {});
      this.music = a;
      this.musicTrack = track;
    } catch (e) { /* ignore */ }
  }

  stopMusic() {
    if (this.music) {
      try { this.music.pause(); this.music.currentTime = 0; } catch (e) { /* ignore */ }
    }
    this.music = null;
    this.musicTrack = null;
  }

  playVex(lineKey) {
    const cfg = window.CIPHER_CONFIG;
    if (!cfg || !cfg.VEX_LINES[lineKey]) return;
    if (this.muted) return;
    const file = cfg.VEX_LINES[lineKey].file;
    if (!file) return;
    try {
      if (this.voice) {
        this.voice.pause();
        this.voice.currentTime = 0;
      }
      const a = new Audio(`../assets/audio/cipher-heist/voice/${file}`);
      a.volume = this.voiceVolume;
      a.muted = this.muted;
      a.play().catch(() => {});
      this.voice = a;
    } catch (e) { /* ignore */ }
  }

  setSfxVolume(v) {
    this.sfxVolume = v;
    Object.values(this.sounds).forEach(s => { s.volume = v; });
  }
  setMusicVolume(v) {
    this.musicVolume = v;
    if (this.music) this.music.volume = v;
  }
  setVoiceVolume(v) {
    this.voiceVolume = v;
    if (this.voice) this.voice.volume = v;
  }
}

if (typeof window !== 'undefined') window.CipherAudio = CipherAudio;
