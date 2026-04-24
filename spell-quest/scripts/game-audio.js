// ==================== AUDIO MANAGER ====================
// Single instance that manages background music (crossfade), SFX pool, and
// pre-baked "Keeper" voice lines. All sounds are plain HTMLAudioElements so
// the service worker can precache them and iPad Safari plays them cleanly.

class SpellQuestAudio {
  constructor() {
    const { MUSIC, SFX, KEEPER_LINES } = window.SpellQuestConfig;

    this.musicTracks = {};
    this.currentMusic = null;
    this.musicVolume = 0.35;
    this.musicEnabled = true;
    this.sfxEnabled = true;

    this.sfxBuffers = {};
    this.keeperBuffers = {};

    // Preload music (looped for ambient, one-shot for stingers).
    const loopable = { menu: true, gameplay: true, grading: true };
    Object.entries(MUSIC).forEach(([key, url]) => {
      const a = new Audio(url);
      a.preload = 'auto';
      a.loop = !!loopable[key];
      a.volume = 0;
      this.musicTracks[key] = a;
    });

    // SFX - keep a pool per sound so overlapping triggers don't cut each other.
    Object.entries(SFX).forEach(([key, url]) => {
      this.sfxBuffers[key] = { url, pool: [], idx: 0 };
    });

    // Pre-baked Keeper voice - one Audio per line (not overlapping).
    Object.entries(KEEPER_LINES).forEach(([key, url]) => {
      const a = new Audio(url);
      a.preload = 'auto';
      a.volume = 0.9;
      this.keeperBuffers[key] = a;
    });
  }

  // --- Music ---
  playMusic(track, { fade = 900 } = {}) {
    if (!this.musicEnabled) return;
    if (this.currentMusic === track) return;

    const prev = this.currentMusic && this.musicTracks[this.currentMusic];
    const next = this.musicTracks[track];
    if (!next) return;

    // Fade in/out
    const startedAt = performance.now();
    const prevStartVol = prev ? prev.volume : 0;
    const targetVol = this.musicVolume;
    next.currentTime = 0;
    next.volume = 0;
    next.play().catch(() => {});

    const tick = () => {
      const t = Math.min(1, (performance.now() - startedAt) / fade);
      next.volume = targetVol * t;
      if (prev) prev.volume = prevStartVol * (1 - t);
      if (t < 1) requestAnimationFrame(tick);
      else if (prev) { prev.pause(); prev.currentTime = 0; }
    };
    requestAnimationFrame(tick);

    this.currentMusic = track;
  }

  stopMusic({ fade = 600 } = {}) {
    const cur = this.currentMusic && this.musicTracks[this.currentMusic];
    if (!cur) return;
    const startVol = cur.volume;
    const startedAt = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - startedAt) / fade);
      cur.volume = startVol * (1 - t);
      if (t < 1) requestAnimationFrame(tick);
      else { cur.pause(); cur.currentTime = 0; }
    };
    requestAnimationFrame(tick);
    this.currentMusic = null;
  }

  setMusicEnabled(on) {
    this.musicEnabled = !!on;
    if (!on && this.currentMusic) this.musicTracks[this.currentMusic].pause();
    else if (on && this.currentMusic) this.musicTracks[this.currentMusic].play().catch(() => {});
  }

  // --- SFX ---
  playSfx(key, { volume = 0.7, rate = 1 } = {}) {
    if (!this.sfxEnabled) return;
    const entry = this.sfxBuffers[key];
    if (!entry) return;
    // Pool of 4 per SFX.
    if (entry.pool.length < 4) {
      const a = new Audio(entry.url);
      a.preload = 'auto';
      entry.pool.push(a);
    }
    const audio = entry.pool[entry.idx % entry.pool.length];
    entry.idx++;
    try {
      audio.currentTime = 0;
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.playbackRate = rate;
      audio.play().catch(() => {});
    } catch (e) {}
  }

  setSfxEnabled(on) { this.sfxEnabled = !!on; }

  // --- Keeper (pre-baked voice lines) ---
  playKeeper(line) {
    const a = this.keeperBuffers[line];
    if (!a) return;
    try { a.currentTime = 0; a.play().catch(() => {}); } catch (e) {}
  }

  stopKeeper() {
    Object.values(this.keeperBuffers).forEach((a) => { try { a.pause(); a.currentTime = 0; } catch (e) {} });
  }
}

window.sqAudio = new SpellQuestAudio();
