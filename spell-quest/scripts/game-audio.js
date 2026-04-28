// ==================== AUDIO MANAGER ====================
// Single instance that manages background music (crossfade), SFX pool, and
// pre-baked "Keeper" voice lines. All sounds are plain HTMLAudioElements so
// the service worker can precache them and iPad Safari plays them cleanly.

class SpellQuestAudio {
  constructor() {
    const { MUSIC, SFX, KEEPER_LINES } = window.SpellQuestConfig;

    this.musicTracks = {};
    this.currentMusic = null;
    this.musicVolume = 0.22; // background score sits well under voice on all devices
    this.musicEnabled = true;
    this.sfxEnabled = true;

    // Ducking: temporarily silence the background music while TTS / Keeper speaks,
    // so the dictated word is always clearly audible over the score. We literally
    // pause the music element (not just lower volume) — most reliable on iPad.
    this._duckCount = 0;
    this._duckAnim = null;
    this._wasMusicPlayingBeforeDuck = false;

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

    // Pre-baked Keeper voice. We keep an <audio> as fallback AND a decoded
    // AudioBuffer for the Web Audio gain-boosted path.
    Object.entries(KEEPER_LINES).forEach(([key, url]) => {
      const a = new Audio(url);
      a.preload = 'auto';
      a.volume = 1.0;
      this.keeperBuffers[key] = { url, audio: a, buffer: null, decoding: null };
    });
    this.voiceGain = 3.0; // amplification above 1.0 for Web Audio path
    this._ctx = null;

    // iOS Safari routes Web Audio through a quieter channel than <audio>, so
    // on iPad/iPhone we deliberately use the HTMLAudioElement fallback path
    // for voice lines (loud "media" channel, music paused). Detection mirrors
    // game-tts.js.
    this._isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  _getCtx() {
    if (this._ctx) return this._ctx;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      this._ctx = new Ctor();
    } catch (e) { this._ctx = null; }
    return this._ctx;
  }

  async _decodeKeeper(entry) {
    if (entry.buffer) return entry.buffer;
    if (entry.decoding) return entry.decoding;
    const ctx = this._getCtx();
    if (!ctx) return null;
    entry.decoding = (async () => {
      try {
        const res = await fetch(entry.url);
        const ab = await res.arrayBuffer();
        const raw = await new Promise((resolve, reject) => {
          try {
            const p = ctx.decodeAudioData(ab.slice(0), resolve, reject);
            if (p && typeof p.then === 'function') p.then(resolve).catch(reject);
          } catch (e) { reject(e); }
        });
        const trimmed = this._trimTail(ctx, raw);
        entry.buffer = trimmed;
        return trimmed;
      } catch (e) { return null; }
    })();
    return entry.decoding;
  }

  // Trim the trailing room-tone / breath off a decoded voice buffer so the
  // compressor / unduck doesn't gasp at the end.
  _trimTail(ctx, buffer, threshold = 0.012, tailMs = 60) {
    const ch0 = buffer.getChannelData(0);
    const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;
    let lastVoiceIdx = -1;
    for (let i = ch0.length - 1; i >= 0; i--) {
      const a = ch1 ? Math.max(Math.abs(ch0[i]), Math.abs(ch1[i])) : Math.abs(ch0[i]);
      if (a > threshold) { lastVoiceIdx = i; break; }
    }
    if (lastVoiceIdx < 0) return buffer;
    const tailSamples = Math.round((tailMs / 1000) * buffer.sampleRate);
    const cutAt = Math.min(buffer.length, lastVoiceIdx + tailSamples);
    if (cutAt >= buffer.length - 256) return buffer;
    const out = ctx.createBuffer(buffer.numberOfChannels, cutAt, buffer.sampleRate);
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      out.getChannelData(c).set(buffer.getChannelData(c).subarray(0, cutAt));
    }
    return out;
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

  // --- Ducking ---
  // Ref-counted: overlapping speech keeps the music paused until the last one ends.
  // Implemented as a quick volume fade-down + .pause() (and the reverse on unduck)
  // so the spoken word competes with absolutely nothing.
  _fadeMusicVolume(targetFactor, durationMs, onDone) {
    const cur = this.currentMusic && this.musicTracks[this.currentMusic];
    if (!cur) { if (onDone) onDone(); return; }
    if (this._duckAnim) cancelAnimationFrame(this._duckAnim);
    const startVol = cur.volume;
    const endVol = this.musicVolume * targetFactor;
    const startedAt = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - startedAt) / durationMs);
      cur.volume = startVol + (endVol - startVol) * t;
      if (t < 1) this._duckAnim = requestAnimationFrame(tick);
      else { this._duckAnim = null; if (onDone) onDone(); }
    };
    this._duckAnim = requestAnimationFrame(tick);
  }

  duckMusic() {
    this._duckCount++;
    if (this._duckCount !== 1) return;
    const cur = this.currentMusic && this.musicTracks[this.currentMusic];
    if (!cur) return;
    this._wasMusicPlayingBeforeDuck = !cur.paused;
    this._fadeMusicVolume(0, 120, () => {
      try { cur.pause(); } catch (e) {}
    });
  }

  unduckMusic() {
    this._duckCount = Math.max(0, this._duckCount - 1);
    if (this._duckCount !== 0) return;
    const cur = this.currentMusic && this.musicTracks[this.currentMusic];
    if (!cur) return;
    if (!this._wasMusicPlayingBeforeDuck || !this.musicEnabled) return;
    cur.volume = 0;
    cur.play().catch(() => {});
    this._fadeMusicVolume(1, 600);
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
  // Plays through Web Audio with a GainNode so the line sits clearly above the
  // background music (which we also duck during playback). Falls back to a
  // plain <audio> element if Web Audio isn't usable on this device.
  playKeeper(line) {
    const entry = this.keeperBuffers[line];
    if (!entry) return;
    this.duckMusic();
    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      this.unduckMusic();
    };

    if (this._isIOS) {
      this._playKeeperFallback(entry, restore);
      return;
    }

    const ctx = this._getCtx();
    if (ctx) {
      this._decodeKeeper(entry).then((buf) => {
        if (!buf) { this._playKeeperFallback(entry, restore); return; }
        try {
          if (ctx.state === 'suspended') ctx.resume().catch(() => {});
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const gain = ctx.createGain();
          // Per-clip fade-out so we don't trigger a compressor-tail "gasp" on stop.
          const dur = buf.duration;
          const now = ctx.currentTime;
          const fadeMs = 70;
          try {
            gain.gain.setValueAtTime(this.voiceGain, now);
            if (dur > fadeMs / 1000 + 0.01) {
              gain.gain.setValueAtTime(this.voiceGain, now + dur - fadeMs / 1000);
              gain.gain.linearRampToValueAtTime(0, now + dur);
            }
          } catch (e) { gain.gain.value = this.voiceGain; }
          src.connect(gain).connect(ctx.destination);
          src.onended = restore;
          src.start(0);
        } catch (e) { this._playKeeperFallback(entry, restore); }
      }).catch(() => this._playKeeperFallback(entry, restore));
    } else {
      this._playKeeperFallback(entry, restore);
    }
  }

  _playKeeperFallback(entry, onDone) {
    try {
      const a = entry.audio;
      a.currentTime = 0;
      const restore = () => {
        a.removeEventListener('ended', restore);
        a.removeEventListener('pause', restore);
        a.removeEventListener('error', restore);
        onDone();
      };
      a.addEventListener('ended', restore);
      a.addEventListener('pause', restore);
      a.addEventListener('error', restore);
      a.play().catch(() => restore());
    } catch (e) { onDone(); }
  }

  stopKeeper() {
    Object.values(this.keeperBuffers).forEach((entry) => {
      try { entry.audio.pause(); entry.audio.currentTime = 0; } catch (e) {}
    });
  }
}

window.sqAudio = new SpellQuestAudio();
