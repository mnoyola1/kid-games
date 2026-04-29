// ==================== TTS (Cartesia Sonic-2 via /api/tts) ====================
// Plays a word in The Keeper's voice with consistent loudness across devices.
//
// Two paths, BOTH operating on the same processed AudioBuffer (decode →
// peak-normalize → RMS-normalize → trim trailing silence):
//
//   • Desktop / Android: source -> GainNode (4×) -> shared compressor + makeup
//     gain -> destination. Web Audio amplifies above 1.0 cleanly.
//   • iOS / iPad: re-encode the processed buffer to a WAV blob, play via
//     HTMLAudioElement at volume 1.0. iPad's `<audio>` is on the loud "media"
//     channel (much louder than Web Audio at the same hardware volume), so
//     baking the loudness into the WAV samples + playing through `<audio>` is
//     how we get consistent loudness on iPad. Web Audio gain > 1.0 doesn't
//     route through this channel, so we have to pre-amplify via samples.
//
// This fixes both:
//   1. "Some words come out fine, some are very low" — variable Cartesia
//      mastering, normalized away by peak + RMS pass.
//   2. "Voice is low on iPad even when it's loud on desktop" — Web Audio's
//      quiet channel; routed through `<audio>` with pre-amplified samples.

const blobCache    = new Map();  // key -> mp3 blob URL (last-resort fallback)
const wavCache     = new Map();  // key -> wav blob URL (iOS playback path)
const bufferCache  = new Map();  // key -> normalized AudioBuffer

// iOS Safari routes Web Audio output through a noticeably quieter channel than
// HTMLAudioElement, even with a GainNode at 4x. On iPad/iPhone we therefore
// play voice through a plain <audio> element (the music has already been
// paused while the word plays, so loudness, not separation, is what matters).
const IS_IOS =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

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

// Compute peak (max abs sample) across all channels.
function bufferPeak(buffer) {
  let peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const a = Math.abs(data[i]);
      if (a > peak) peak = a;
    }
  }
  return peak;
}

// Compute RMS over voice-active samples (above noise floor).
function bufferVoiceRms(buffer, noiseFloor = 0.01) {
  let sumSq = 0; let n = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const a = Math.abs(data[i]);
      if (a > noiseFloor) { sumSq += a * a; n++; }
    }
  }
  if (n === 0) return 0;
  return Math.sqrt(sumSq / n);
}

// Apply uniform gain to every sample, in place.
function scaleBuffer(buffer, scale) {
  if (scale === 1) return buffer;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) data[i] *= scale;
  }
  return buffer;
}

// Loudness-normalize: lift every clip to a target RMS so quiet-mastered clips
// (e.g. "wave") are perceptually as loud as punchy ones (e.g. "trick"), then
// hard-cap so peaks don't blow past `peakLimit`. RMS is what the ear hears as
// loudness; peak alone isn't enough — two clips peaking at 0.97 can differ by
// 10 dB perceptually if their RMS differs.
function loudnessNormalizeBuffer(buffer, { targetRms = 0.22, peakLimit = 0.985 } = {}) {
  const rms  = bufferVoiceRms(buffer);
  const peak = bufferPeak(buffer);
  if (peak === 0 || rms === 0) return buffer;
  let scale = targetRms / rms;
  if (peak * scale > peakLimit) scale = peakLimit / peak;
  return scaleBuffer(buffer, scale);
}

// Encode an AudioBuffer to a WAV blob (16-bit PCM, interleaved). We use this
// to push processed (normalized + amplified) audio through HTMLAudioElement
// on iOS, since `<audio>.volume` is hard-capped at 1.0 — pre-amplifying the
// samples is the only way to get above iPad's "raw MP3 at full hardware
// volume" loudness.
function audioBufferToWavBlob(buffer) {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const len = buffer.length;
  const bytesPerSample = 2;
  const dataSize = len * numCh * bytesPerSample;
  const ab = new ArrayBuffer(44 + dataSize);
  const v = new DataView(ab);
  let p = 0;
  const writeStr = (s) => { for (let i = 0; i < s.length; i++) v.setUint8(p++, s.charCodeAt(i)); };
  const u32 = (n) => { v.setUint32(p, n, true); p += 4; };
  const u16 = (n) => { v.setUint16(p, n, true); p += 2; };
  writeStr('RIFF'); u32(36 + dataSize); writeStr('WAVE');
  writeStr('fmt '); u32(16); u16(1); u16(numCh); u32(sr);
  u32(sr * numCh * bytesPerSample); u16(numCh * bytesPerSample); u16(16);
  writeStr('data'); u32(dataSize);
  const channels = [];
  for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      v.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      p += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
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
  // Two-stage loudness pipeline (peak → RMS) so clips are both consistent
  // and audibly loud.
  loudnessNormalizeBuffer(raw, { targetRms: 0.22, peakLimit: 0.985 });
  const trimmed = trimTrailingSilence(ctx, raw, { threshold: 0.012, tailMs: 40 });
  bufferCache.set(key, trimmed);
  return trimmed;
}

// Get (or build + cache) the WAV blob URL for the iOS playback path.
async function getWavUrl(text, voice) {
  const key = voice + '|' + text;
  const cached = wavCache.get(key);
  if (cached) return cached;
  const buffer = await getDecodedBuffer(text, voice);
  if (!buffer) return null;
  const url = URL.createObjectURL(audioBufferToWavBlob(buffer));
  wavCache.set(key, url);
  return url;
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
// reins in the peaks so this stays clean. Ignored on iOS (see IS_IOS above).
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
      // iOS path: peak + RMS-normalized WAV played through HTMLAudioElement
      // on iPad's loud "media" channel. Pre-amplifying the samples is
      // necessary because `<audio>.volume` is hard-capped at 1.0 and Web
      // Audio's GainNode > 1.0 doesn't go through this channel on iPad.
      if (IS_IOS) {
        let url = await getWavUrl(text, voice).catch(() => null);
        // If decode/encode failed (e.g. AudioContext blocked), fall back to
        // raw MP3 — at least the loud channel routing still helps.
        if (!url) {
          const key = voice + '|' + text;
          url = blobCache.get(key);
          if (!url) {
            const ab = await fetchTtsArrayBuffer(text, voice);
            url = URL.createObjectURL(new Blob([ab], { type: 'audio/mpeg' }));
          }
        }
        if (duck && window.sqAudio?.duckMusic) { ducked = true; window.sqAudio.duckMusic(); }
        await playViaAudioElement(url, 1.0);
        unduck();
        resolve();
        return;
      }

      // Desktop / Android: Web Audio path with gain + compressor.
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
