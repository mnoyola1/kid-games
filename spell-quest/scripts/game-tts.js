// ==================== TTS (Cartesia Sonic-2 via /api/tts) ====================
// Plays a word in The Keeper's voice, with in-session caching so replays are free.
// The service worker also caches /api/tts responses, so across sessions we only pay once.

const ttsCache = new Map(); // text -> blobUrl

async function fetchTtsBlobUrl(text, voice = 'keeper') {
  const key = voice + '|' + text;
  if (ttsCache.has(key)) return ttsCache.get(key);

  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });
  if (!res.ok) throw new Error(`TTS failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  ttsCache.set(key, url);
  return url;
}

// Prewarm: fire-and-forget TTS for the next word so playback is snappy.
function prewarmTts(text, voice) {
  fetchTtsBlobUrl(text, voice).catch(() => {});
}

// Play a word through The Keeper's voice. Returns a Promise that resolves when playback ends
// (or rejects if the request/audio fails).
function speakWord(text, { voice = 'keeper', volume = 1.0 } = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      const url = await fetchTtsBlobUrl(text, voice);
      const audio = new Audio(url);
      audio.volume = volume;
      audio.addEventListener('ended', () => resolve());
      audio.addEventListener('error', () => reject(new Error('TTS audio error')));
      audio.play().catch((e) => reject(e));
    } catch (e) { reject(e); }
  });
}

window.SpellQuestTTS = { speakWord, prewarmTts };
