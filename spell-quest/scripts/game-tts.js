// ==================== TTS (Cartesia Sonic-2 via /api/tts) ====================
// Plays a word in The Keeper's voice with consistent loudness:
//   1. Decode MP3 to AudioBuffer once per (voice, text).
//   2. Peak-normalize the buffer so every clip hits the same target level
//      regardless of how quiet/loud Cartesia mastered it.
//   3. Play through a graph: source -> Gain (boost) -> Compressor (even out)
//      -> destination. Caps loud peaks while bringing up quiet ones.
//
// This is what fixes the "some words come out fine, some are very low" issue:
// Cartesia masters each clip independently, so without normalization a soft
// phoneme like "wave" can be 10 dB quieter than a punchy one like "trick".

const blobCache = new Map();    // key -> blobUrl (fallback path)
const bufferCache = new Map();  // key -> normalized AudioBuffer

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

// Scan a buffer for absolute peak across all channels; scale every sample so the
// peak hits `targetPeak` (0..1). Returns the same buffer in place.
function normalizeBuffer(buffer, targetPeak = 0.97) {
  let peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const a = Math.abs(data[i]);
      if (a > peak) peak = a;
    }
  }
  if (peak === 0 || peak >= 0.999 * targetPeak) return buffer; // already loud enough
  const scale = targetPeak / peak;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) data[i] *= scale;
  }
  return buffer;
}

// Trim trailing silence/near-silence from the buffer. Cartesia leaves a soft
// breath / room-tone tail on each clip; our compressor + makeup gain amplifies
// that into an audible "gasp" before the music returns. We scan from the end
// for the last sample above `threshold` and copy everything up to that point
// (plus a small `tailMs` cushion of natural decay) into a new, shorter buffer.
function trimTrailingSilence(ctx, buffer, { threshold = 0.012, tailMs = 40 } = {}) {
  const sr = buffer.sampleRate;
  const ch0 = buffer.getChannelData(0);
  const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;
  let lastVoiceIdx = -1;
  for (let i = ch0.length - 1; i >= 0; i--) {
    const a = ch1 ? Math.max(Math.abs(ch0[i]), Math.abs(ch1[i])) : Math.abs(ch0[i]);
    if (a > threshold) { lastVoiceIdx = i; break; }
  }
  if (lastVoiceIdx < 0) return buffer; // entirely silent? leave it
  const tailSamples = Math.round((tailMs / 1000) * sr);
  const cutAt = Math.min(buffer.length, lastVoiceIdx + tailSamples);
  if (cutAt >= buffer.length - 256) return buffer; // nothing meaningful to trim
  const out = ctx.createBuffer(buffer.numberOfChannels, cutAt, sr);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    out.getChannelData(c).set(buffer.getChannelData(c).subarray(0, cutAt));
  }
  return out;
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
  blobCache.set(key, URL.createObjectURL(new Blob([ab], { type: 'audio/mpeg' })));
  return ab;
}

async function getDecodedBuffer(text, voice) {
  const key = voice + '|' + text;
  if (bufferCache.has(key)) return bufferCache.get(key);
  const ctx = getAudioCtx();
  if (!ctx) return null;
  const ab = await fetchTtsArrayBuffer(text, voice);
  const raw = await new Promise((resolve, reject) => {
    try {
      const p = ctx.decodeAudioData(ab.slice(0), resolve, reject);
      if (p && typeof p.then === 'function') p.then(resolve).catch(reject);
    } catch (e) { reject(e); }
  });
  normalizeBuffer(raw, 0.97);
  const trimmed = trimTrailingSilence(ctx, raw, { threshold: 0.012, tailMs: 40 });
  bufferCache.set(key, trimmed);
  return trimmed;
}

function prewarmTts(text, voice = 'keeper') {
  getDecodedBuffer(text, voice).catch(() => {
    fetchTtsArrayBuffer(text, voice).catch(() => {});
  });
}

// Shared compressor + post-makeup gain. The compressor evens out per-word
// loudness; the makeup gain after it pushes the average level higher
// without re-introducing peak clipping.
let _compressor = null;
let _makeupGain = null;
function getCompressorOutput(ctx) {
  if (_compressor && _compressor.context === ctx) return _compressor;
  const comp = ctx.createDynamicsCompressor();
  try { comp.threshold.setValueAtTime(-18, ctx.currentTime); } catch (e) {}
  try { comp.knee.setValueAtTime(10, ctx.currentTime); } catch (e) {}
  try { comp.ratio.setValueAtTime(8, ctx.currentTime); } catch (e) {}
  try { comp.attack.setValueAtTime(0.003, ctx.currentTime); } catch (e) {}
  // Slow release so the compressor doesn't pump the quiet tail of the clip
  // back up (which previously sounded like a "gasp" right before music returns).
  try { comp.release.setValueAtTime(0.45, ctx.currentTime); } catch (e) {}
  const makeup = ctx.createGain();
  makeup.gain.value = 1.6; // post-compression boost
  comp.connect(makeup).connect(ctx.destination);
  _compressor = comp;
  _makeupGain = makeup;
  return comp;
}

function playViaWebAudio(buffer, gainValue) {
  const ctx = getAudioCtx();
  if (!ctx) return null;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  // Per-clip fade-out on the last 70ms so the source doesn't end abruptly,
  // and any compressor release happens AFTER the listener stops hearing the clip.
  const dur = buffer.duration;
  const now = ctx.currentTime;
  const fadeMs = 70;
  try {
    gain.gain.setValueAtTime(gainValue, now);
    if (dur > fadeMs / 1000 + 0.01) {
      gain.gain.setValueAtTime(gainValue, now + dur - fadeMs / 1000);
      gain.gain.linearRampToValueAtTime(0, now + dur);
    }
  } catch (e) { gain.gain.value = gainValue; }
  const comp = getCompressorOutput(ctx);
  src.connect(gain).connect(comp);
  src.start(0);
  return src;
}

function playViaAudioElement(url, volume) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.addEventListener('ended', () => resolve());
    audio.addEventListener('error', () => reject(new Error('TTS audio error')));
    audio.play().catch((e) => reject(e));
  });
}

// `gain`: pre-compression amplification. With the compressor + makeup gain on
// the output, 4.0 is roughly +12 dB above the un-boosted clip. The compressor
// reins in the peaks so this stays clean.
function speakWord(text, { voice = 'keeper', gain = 4.0, duck = true } = {}) {
  return new Promise(async (resolve, reject) => {
    let ducked = false;
    const unduck = () => {
      if (ducked && window.sqAudio?.unduckMusic) {
        ducked = false;
        window.sqAudio.unduckMusic();
      }
    };
    try {
      const buffer = await getDecodedBuffer(text, voice).catch(() => null);
      if (duck && window.sqAudio?.duckMusic) { ducked = true; window.sqAudio.duckMusic(); }

      if (buffer) {
        const src = playViaWebAudio(buffer, gain);
        if (src) {
          src.onended = () => { unduck(); resolve(); };
          return;
        }
      }

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
