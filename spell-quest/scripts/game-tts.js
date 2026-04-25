// ==================== TTS (Cartesia Sonic-2 via /api/tts) ====================
// Plays a word in The Keeper's voice, with in-session caching so replays are free.
// The service worker also caches /api/tts responses, so across sessions we only pay once.
//
// Playback uses Web Audio API with a GainNode so we can amplify the dictated word
// ABOVE the natural <audio>-element ceiling of 1.0 — `<audio>.volume = 2` is
// silently ignored everywhere. We decode the MP3 once into an AudioBuffer and
// reuse it on every replay.

const blobCache = new Map();   // key -> blobUrl (kept for prewarm + fallback)
const bufferCache = new Map(); // key -> AudioBuffer

// Lazy-create a single AudioContext on the first user-gesture-triggered play.
let _ctx = null;
function getAudioCtx() {
  if (_ctx) return _ctx;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    _ctx = new Ctor();
  } catch (e) { _ctx = null; }
  return _ctx;
}

async function fetchTtsArrayBuffer(text, voice) {
  const key = voice + '|' + text;
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });
  if (!res.ok) throw new Error(`TTS failed (${res.status})`);
  const ab = await res.arrayBuffer();
  // Also stash a blob URL — used as a fallback playback path if Web Audio is unavailable.
  const blob = new Blob([ab], { type: 'audio/mpeg' });
  blobCache.set(key, URL.createObjectURL(blob));
  return ab;
}

async function getDecodedBuffer(text, voice) {
  const key = voice + '|' + text;
  if (bufferCache.has(key)) return bufferCache.get(key);
  const ctx = getAudioCtx();
  if (!ctx) return null;
  const ab = await fetchTtsArrayBuffer(text, voice);
  // decodeAudioData on iOS still wants the legacy callback form for full reliability.
  const buf = await new Promise((resolve, reject) => {
    try {
      const p = ctx.decodeAudioData(ab.slice(0), resolve, reject);
      if (p && typeof p.then === 'function') p.then(resolve).catch(reject);
    } catch (e) { reject(e); }
  });
  bufferCache.set(key, buf);
  return buf;
}

// Prewarm: fire-and-forget decode so playback is snappy on the next word.
function prewarmTts(text, voice = 'keeper') {
  getDecodedBuffer(text, voice).catch(() => {
    // If decode fails, at least keep a blob URL ready for the <audio> fallback.
    fetchTtsArrayBuffer(text, voice).catch(() => {});
  });
}

// Play through Web Audio with a GainNode (loudness boost above 1.0).
// `gain` 1.0 == no change, 1.6 == ~+4 dB, 2.0 == ~+6 dB, 2.5 == ~+8 dB.
// Above ~3.0 you'll start hearing clipping on louder phonemes.
function playViaWebAudio(buffer, gainValue) {
  const ctx = getAudioCtx();
  if (!ctx) return null;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = gainValue;
  src.connect(gain).connect(ctx.destination);
  src.start(0);
  return src;
}

// Fallback: plain <audio> at the requested volume (capped at 1.0).
function playViaAudioElement(url, volume) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.addEventListener('ended', () => resolve());
    audio.addEventListener('error', () => reject(new Error('TTS audio error')));
    audio.play().catch((e) => reject(e));
  });
}

// Play a word through The Keeper's voice. Returns a Promise that resolves when playback
// ends. While the audio plays we duck the background music so the dictated word is
// clearly audible. `gain` (default 1.8) lets the spoken word be louder than any
// other audio element in the game.
function speakWord(text, { voice = 'keeper', gain = 1.8, duck = true } = {}) {
  return new Promise(async (resolve, reject) => {
    let ducked = false;
    const unduck = () => {
      if (ducked && window.sqAudio?.unduckMusic) {
        ducked = false;
        window.sqAudio.unduckMusic();
      }
    };
    try {
      // Try Web Audio path first for the volume boost.
      const buffer = await getDecodedBuffer(text, voice).catch(() => null);
      if (duck && window.sqAudio?.duckMusic) { ducked = true; window.sqAudio.duckMusic(); }

      if (buffer) {
        const src = playViaWebAudio(buffer, gain);
        if (src) {
          src.onended = () => { unduck(); resolve(); };
          return;
        }
      }

      // Fallback: blob URL via <audio> element.
      const key = voice + '|' + text;
      let url = blobCache.get(key);
      if (!url) {
        const ab = await fetchTtsArrayBuffer(text, voice);
        url = URL.createObjectURL(new Blob([ab], { type: 'audio/mpeg' }));
      }
      await playViaAudioElement(url, 1.0);
      unduck();
      resolve();
    } catch (e) {
      unduck();
      reject(e);
    }
  });
}

window.SpellQuestTTS = { speakWord, prewarmTts };
