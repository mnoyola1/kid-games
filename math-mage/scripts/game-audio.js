// ==================== MATH MAGE — AUDIO ====================
// Phase 1: pure Web-Audio-API generated tones for SFX (no asset deps yet) +
// Web Speech API for fact narration. Phase 3 will swap to generated MP3/WAV
// assets and Cartesia voice lines, behind the same window.MathMageAudio API.
//
// Why synth tones in Phase 1: we want Liam playing tomorrow morning. Generating
// real assets is a 30-min batch run; this lets the game ship now with audible
// feedback that already FEELS right (cyan rune-press blip, golden cast, dark
// fizzle on miss).

(function () {
  const { mmFactPhrase, mmQuestionPhrase } = window.MathMageConfig;

  let _ctx = null;
  function getCtx() {
    if (_ctx) return _ctx;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      _ctx = new Ctor();
    } catch (e) { _ctx = null; }
    return _ctx;
  }

  // iPad + many mobile browsers gate audio behind a user gesture. Resume the
  // AudioContext (used by synth SFX) AND retry any music track that was
  // requested before the first gesture (HTMLAudio is gated separately).
  // Called from game-main on the very first touchstart/mousedown/keydown.
  function unlock() {
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});

    // Retry any pending music. The element exists (we set src already);
    // we just need to call play() inside this gesture stack.
    if (_musicPending && _musicEl) {
      const el = _musicEl;
      el.play().then(() => {
        // Successfully started — fade up to the originally requested volume.
        fadeMusic(_musicPending.volume, 600);
        _musicPending = null;
      }).catch(() => { /* still gated, will retry next gesture */ });
    }
  }

  // ---- One-shot synth tone helper ----
  // type: 'sine'|'square'|'triangle'|'sawtooth'
  // env: { attack, decay, sustain, release } in seconds; sustainLevel 0..1
  // freq: number or [start, end] (linear glide)
  function tone({
    type = 'sine',
    freq = 440,
    duration = 0.15,
    volume = 0.18,
    attack = 0.005,
    release = 0.05,
  } = {}) {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    if (Array.isArray(freq)) {
      osc.frequency.setValueAtTime(freq[0], now);
      osc.frequency.linearRampToValueAtTime(freq[1], now + duration);
    } else {
      osc.frequency.setValueAtTime(freq, now);
    }
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.linearRampToValueAtTime(0, now + duration + release);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + release + 0.05);
  }

  // ---- SFX library (synthesized) ----
  const SFX = {
    // Rune key tap — short cyan blip.
    keyPress() {
      tone({ type: 'triangle', freq: 720, duration: 0.05, volume: 0.10 });
    },
    // Cast = correct answer. Layered: punchy thump + ascending sparkle.
    cast() {
      tone({ type: 'sine',     freq: [320, 720], duration: 0.18, volume: 0.18, attack: 0.005, release: 0.10 });
      setTimeout(() => tone({ type: 'triangle', freq: 1180, duration: 0.10, volume: 0.13 }), 70);
      setTimeout(() => tone({ type: 'triangle', freq: 1480, duration: 0.10, volume: 0.10 }), 140);
    },
    // Big cast = wave clear / boss kill.
    bigCast() {
      tone({ type: 'sine',     freq: [180, 480], duration: 0.30, volume: 0.22, release: 0.20 });
      setTimeout(() => tone({ type: 'triangle', freq: 880,  duration: 0.18, volume: 0.16 }), 80);
      setTimeout(() => tone({ type: 'triangle', freq: 1320, duration: 0.18, volume: 0.13 }), 200);
      setTimeout(() => tone({ type: 'sine',     freq: 1760, duration: 0.22, volume: 0.10 }), 320);
    },
    // Fizzle = wrong answer. Descending muddy tone.
    fizzle() {
      tone({ type: 'sawtooth', freq: [330, 130], duration: 0.30, volume: 0.10, release: 0.08 });
    },
    // Skip-count chime — used in the inter-wave visualization (climbing pitch).
    skipChime(step = 0) {
      const f = 440 * Math.pow(2, step / 12); // ascending semitones
      tone({ type: 'triangle', freq: f, duration: 0.14, volume: 0.13 });
    },
    // Wraith hit = lower thud + airy fade.
    wraithHit() {
      tone({ type: 'sawtooth', freq: 180, duration: 0.10, volume: 0.18, release: 0.06 });
      setTimeout(() => tone({ type: 'sine', freq: [880, 220], duration: 0.16, volume: 0.10 }), 30);
    },
    // HP tick = soft warning thump (loss of HP).
    hpLoss() {
      tone({ type: 'sine', freq: [160, 80], duration: 0.20, volume: 0.18 });
    },
    // Boss-incoming sting.
    bossSting() {
      tone({ type: 'sawtooth', freq: 110, duration: 0.40, volume: 0.18, release: 0.20 });
      setTimeout(() => tone({ type: 'sawtooth', freq: 165, duration: 0.40, volume: 0.16, release: 0.20 }), 100);
    },
    // Victory fanfare.
    victory() {
      const beats = [523, 659, 784, 1047]; // C E G C
      beats.forEach((f, i) => setTimeout(() => tone({ type: 'triangle', freq: f, duration: 0.18, volume: 0.18 }), i * 130));
    },
    // Game over — descending minor.
    gameover() {
      const beats = [440, 392, 349, 294]; // A G F D
      beats.forEach((f, i) => setTimeout(() => tone({ type: 'sine', freq: f, duration: 0.30, volume: 0.16 }), i * 220));
    },
  };

  // ---- Voice narration (Cartesia-first, Web-Speech fallback) ----
  //
  // Layered strategy, fast → slow → robotic:
  //
  //   1. PRE-BAKED  /assets/audio/math-mage/voice/q_AxB.mp3 etc.
  //      Generated once via tools/audio/generate_voice.py for whichever
  //      table the kid is focused on. Zero network latency, plays instantly.
  //      File naming matches both speakQuestion (q_) and speakFact (f_).
  //
  //   2. RUNTIME    POST /api/tts (Cartesia Sonic-2)
  //      For phrases we haven't pre-generated. ~600ms first call, then HTTP-
  //      cached forever (endpoint sets Cache-Control: immutable + ETag).
  //      Returns audio/mpeg bytes. Doesn't work against the local python
  //      http.server (no /api routes), so locally we skip straight to (3).
  //
  //   3. FALLBACK   window.speechSynthesis (browser TTS)
  //      Free, robotic, but always available. Used when (1) and (2) fail.
  //
  // Each speak* call cancels any prior in-flight narration so feedback
  // never queues up over itself.

  const VOICE_BASE = '../assets/audio/math-mage/voice/';
  // Match the runtime /api/tts preset to whichever voice the pre-baked
  // pack uses, so a single session never mixes voices (Carl on ×6 then
  // someone else on ×7 would be jarring). 'keeper' on the API maps to
  // the same Carl/Steady-Storyteller ID as 'calm_male' on the python
  // generator, so this stays consistent end-to-end.
  const TTS_VOICE_PRESET = 'keeper';

  // Single shared <audio> element for narration. Separate from the music
  // element so we can duck music while voice plays without awkward
  // src-swapping. Live-blob URLs from /api/tts get revoked when replaced.
  let _voiceEl = null;
  let _voiceBlobUrl = null;
  let _voiceFallbackTimer = null;
  // Per-pair cache of resolved URLs (pre-baked path or blob URL from API)
  // so a fact spoken multiple times in a session doesn't re-fetch.
  const _voiceCache = new Map();

  function ensureVoiceEl() {
    if (_voiceEl) return _voiceEl;
    const el = new Audio();
    el.preload = 'auto';
    el.volume = 1.0;
    // Duck music while narration plays so the spoken phrase is intelligible
    // over the ambient track. Restore on end / pause.
    el.addEventListener('play',  () => { if (_musicEl && _musicCurrent) fadeMusic(0.10, 200); });
    el.addEventListener('ended', () => { if (_musicEl && _musicCurrent) fadeMusic(_musicTargetVol, 400); });
    el.addEventListener('pause', () => { if (_musicEl && _musicCurrent) fadeMusic(_musicTargetVol, 400); });
    _voiceEl = el;
    return el;
  }

  function stopSpeech() {
    // Cancel both audio paths so a new call doesn't overlap.
    if (_voiceEl) { try { _voiceEl.pause(); _voiceEl.currentTime = 0; } catch (e) {} }
    if (_voiceFallbackTimer) { clearTimeout(_voiceFallbackTimer); _voiceFallbackTimer = null; }
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
  }

  function playUrl(url) {
    const el = ensureVoiceEl();
    el.src = url;
    el.currentTime = 0;
    return el.play();
  }

  // Web Speech fallback. Returns a Promise so the chain in speakPair() can
  // await it consistently.
  function webSpeechFallback(text, { rate = 0.95, pitch = 1.0, volume = 1.0 } = {}) {
    return new Promise((resolve) => {
      try {
        if (!window.speechSynthesis) return resolve(false);
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = rate;
        u.pitch = pitch;
        u.volume = volume;
        u.lang = 'en-US';
        u.onend = () => resolve(true);
        u.onerror = () => resolve(false);
        window.speechSynthesis.speak(u);
      } catch (e) { resolve(false); }
    });
  }

  // Try to fetch the pre-baked MP3 for this kind/(a,b). Returns the URL
  // string if it exists (HEAD 200), null otherwise.
  async function resolvePrebakedUrl(kind, a, b) {
    const key = `${kind}:${a}x${b}`;
    if (_voiceCache.has(key)) return _voiceCache.get(key);
    const url = `${VOICE_BASE}${kind}_${a}x${b}.mp3`;
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (r.ok) { _voiceCache.set(key, url); return url; }
    } catch (e) {}
    _voiceCache.set(key, null);
    return null;
  }

  // Try /api/tts. Returns blob URL on success, null on failure.
  // The Vercel endpoint serves audio/mpeg; we wrap in a Blob URL so the
  // <audio> element can play it. We don't keep more than one blob URL alive
  // at a time to avoid leaks (revoke previous on replacement).
  async function resolveRuntimeUrl(text) {
    const key = `tts:${text}`;
    if (_voiceCache.has(key)) return _voiceCache.get(key);
    try {
      const r = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: TTS_VOICE_PRESET }),
      });
      if (!r.ok) { _voiceCache.set(key, null); return null; }
      const blob = await r.blob();
      const blobUrl = URL.createObjectURL(blob);
      _voiceCache.set(key, blobUrl);
      return blobUrl;
    } catch (e) {
      _voiceCache.set(key, null);
      return null;
    }
  }

  // Internal: try playback chain for a known (a,b) pair.
  async function speakPair(kind, a, b, text, opts) {
    stopSpeech();

    // 1. Pre-baked
    const baked = await resolvePrebakedUrl(kind, a, b);
    if (baked) {
      try { await playUrl(baked); return; }
      catch (e) { /* fall through */ }
    }

    // 2. Runtime API (works in Vercel deploy, not on python http.server)
    const runtime = await resolveRuntimeUrl(text);
    if (runtime) {
      try { await playUrl(runtime); return; }
      catch (e) { /* fall through */ }
    }

    // 3. Web Speech fallback
    await webSpeechFallback(text, opts);
  }

  // Public entry — speak an arbitrary string. Uses runtime API + Web Speech
  // (no pre-bake lookup). Used for incidental phrases, not fact narration.
  function speak(text, opts) {
    stopSpeech();
    resolveRuntimeUrl(text).then((url) => {
      if (url) {
        playUrl(url).catch(() => webSpeechFallback(text, opts));
      } else {
        webSpeechFallback(text, opts);
      }
    });
  }

  // Full fact, including the answer. Use after a MISS or after lock-in
  // production — i.e., when the kid has either failed to retrieve OR has
  // just produced the answer themselves.
  function speakFact(a, b, opts) {
    speakPair('f', a, b, mmFactPhrase(a, b), opts);
  }

  // Question only ("six times seven"). Use on FIRST APPEARANCE so the kid
  // hears the question alongside reading it, but still has to retrieve the
  // answer themselves — that's the actual recall practice.
  function speakQuestion(a, b, opts) {
    speakPair('q', a, b, mmQuestionPhrase(a, b), opts);
  }

  // ==================== BACKGROUND MUSIC ====================
  // Generated MP3s live in /assets/audio/math-mage/music/. We loop one
  // track per screen (menu / arena / lock-in / victory) using a single
  // shared HTMLAudioElement that gracefully cross-fades between tracks.
  //
  // No ducking on Web Speech narration — speech is loud enough to cut
  // through ambient music at 0.35 volume, and the short utterances
  // ("six times seven") don't last long enough for ducking to feel right.

  // Math Mage's index.html lives at /math-mage/, so asset paths are one
  // level up. Tested against http://localhost:8765/math-mage/ (python
  // http.server) and Vercel — both resolve `../assets/...` correctly.
  const MUSIC_BASE = '../assets/audio/math-mage/music/';
  const MUSIC_TRACKS = {
    menu:    MUSIC_BASE + 'menu.mp3',
    arena:   MUSIC_BASE + 'main.mp3',     // generated as 'main' for math template
    lockin:  MUSIC_BASE + 'main.mp3',     // reuse main; quieter while writing
    victory: MUSIC_BASE + 'victory.mp3',
  };

  let _musicEl = null;
  let _musicCurrent = null;
  let _musicTargetVol = 0.35;
  let _musicEnabled = true;
  // Pending track that wanted to play but was blocked by the browser's
  // autoplay gate (no user gesture yet). On the very first user gesture
  // (touchstart/click/keydown), unlock() retries this track.
  let _musicPending = null;

  function ensureMusicEl() {
    if (_musicEl) return _musicEl;
    const el = new Audio();
    el.loop = true;
    el.preload = 'auto';
    el.volume = 0;
    _musicEl = el;
    return el;
  }

  function fadeMusic(targetVol, ms = 600) {
    const el = _musicEl;
    if (!el) return;
    const start = el.volume;
    const t0 = performance.now();
    function step() {
      const t = (performance.now() - t0) / ms;
      if (t >= 1) { el.volume = targetVol; return; }
      el.volume = start + (targetVol - start) * t;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function playMusic(name, { volume = 0.35 } = {}) {
    if (!_musicEnabled) return;
    const src = MUSIC_TRACKS[name];
    if (!src) return;
    const el = ensureMusicEl();
    _musicTargetVol = volume;
    if (_musicCurrent === name) {
      // Already playing this track — just nudge volume.
      fadeMusic(volume, 400);
      return;
    }
    // Cross-fade-ish: ramp down, swap src, ramp back up.
    const swap = () => {
      _musicCurrent = name;
      el.src = src;
      el.currentTime = 0;
      // Browser autoplay policies require a user gesture before
      // HTMLAudio.play() resolves. If we're called from a `useEffect` on
      // first mount (no gesture yet), play() rejects — we remember which
      // track was wanted and retry on the next gesture (see unlock).
      el.play().catch(() => { _musicPending = { name, volume }; });
      fadeMusic(volume, 800);
    };
    if (el.volume > 0.01) {
      const t0 = performance.now();
      const start = el.volume;
      const dur = 350;
      function down() {
        const t = (performance.now() - t0) / dur;
        if (t >= 1) { el.volume = 0; swap(); return; }
        el.volume = start * (1 - t);
        requestAnimationFrame(down);
      }
      requestAnimationFrame(down);
    } else {
      swap();
    }
  }

  function stopMusic({ ms = 500 } = {}) {
    const el = _musicEl;
    if (!el) return;
    const start = el.volume;
    const t0 = performance.now();
    _musicCurrent = null;
    function step() {
      const t = (performance.now() - t0) / ms;
      if (t >= 1) { el.volume = 0; el.pause(); return; }
      el.volume = start * (1 - t);
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function setMusicEnabled(enabled) {
    _musicEnabled = !!enabled;
    if (!_musicEnabled) stopMusic({ ms: 200 });
  }

  window.MathMageAudio = {
    unlock,
    sfx: SFX,
    speak,
    speakFact,
    speakQuestion,
    stopSpeech,
    playMusic,
    stopMusic,
    setMusicEnabled,
  };
})();
