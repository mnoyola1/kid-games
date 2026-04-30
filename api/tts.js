// POST /api/tts
// Body: { text: string, voice?: 'keeper' | 'cheerful' | 'excited' }
// Returns: audio/mpeg MP3 bytes (Cartesia Sonic-2).
//
// Used by Spell Quest for runtime dictation of each word in "The Keeper's" voice.
// Responses include long-lived Cache-Control + a stable ETag keyed on (voice, text)
// so iPad Safari and the hub service-worker can reuse identical clips on replay.

import crypto from 'node:crypto';
import { readJsonBody, sendError, applyCors } from './_shared.js';

const CARTESIA_URL = 'https://api.cartesia.ai/tts/bytes';
const CARTESIA_VERSION = '2024-06-10';

// Default Keeper voice = Carl "Steady Storyteller" (warm, patient, teacher-librarian feel)
const KEEPER_VOICE_ID = 'ed82c17b-4704-4d34-be43-5d19065acdf1';
const CHEERFUL_FEMALE = 'a0e99841-438c-4a64-b679-ae501e7d6091';
const EXCITED_CHILD = '2ee87190-8f84-4925-97da-e52547f9462c';

function resolveVoiceId(preset) {
  const envOverride = process.env.CARTESIA_VOICE_ID;
  if (preset === 'cheerful') return CHEERFUL_FEMALE;
  if (preset === 'excited') return EXCITED_CHILD;
  return envOverride || KEEPER_VOICE_ID;
}

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { sendError(res, 405, 'Method not allowed'); return; }

  if (!process.env.CARTESIA_API_KEY) {
    sendError(res, 500, 'CARTESIA_API_KEY not configured');
    return;
  }

  let body;
  try { body = await readJsonBody(req); } catch { sendError(res, 400, 'Invalid JSON body'); return; }

  const text = (body?.text || '').toString().trim();
  const voice = (body?.voice || 'keeper').toString();

  if (!text) { sendError(res, 400, 'Missing "text"'); return; }
  if (text.length > 500) { sendError(res, 400, 'Text too long (max 500 chars)'); return; }

  const voiceId = resolveVoiceId(voice);

  // Bump this whenever the upstream request shape (model, language, speed, ...) changes,
  // so previously-cached MP3s on iPad / SW are not served as fresh.
  const RENDER_VERSION = 'v3-slowest-en';

  const etag = '"' + crypto.createHash('sha1').update(`${RENDER_VERSION}|${voiceId}|${text}`).digest('hex') + '"';
  if (req.headers['if-none-match'] === etag) {
    res.status(304).setHeader('ETag', etag).end();
    return;
  }

  try {
    const cartesiaRes = await fetch(CARTESIA_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.CARTESIA_API_KEY,
        'Cartesia-Version': CARTESIA_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'sonic-2',
        transcript: text,
        voice: { mode: 'id', id: voiceId },
        // Pin language to en and use the slowest dictation speed so words land
        // crisply for spelling practice. Combined with the client-side
        // "say it twice with a beat" pattern (see speakDictation in
        // game-tts.js), this matches the cadence a real teacher uses.
        language: 'en',
        speed: 'slowest',
        output_format: {
          container: 'mp3',
          bit_rate: 128000,
          sample_rate: 44100,
        },
      }),
    });

    if (!cartesiaRes.ok) {
      const detail = await cartesiaRes.text().catch(() => '');
      sendError(res, 502, 'Cartesia TTS failed', {
        upstreamStatus: cartesiaRes.status,
        upstreamBody: detail.slice(0, 300),
      });
      return;
    }

    const audio = Buffer.from(await cartesiaRes.arrayBuffer());
    res.status(200);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audio.length);
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(audio);
  } catch (err) {
    sendError(res, 500, 'TTS request failed', { detail: String(err?.message || err) });
  }
}
