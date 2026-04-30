/**
 * Generate dictation voice samples for A/B-testing on the iPad.
 *
 * Calls Cartesia Sonic-2 directly with the same parameters our /api/tts uses
 * (language: en, speed: slow), for several candidate voices and several
 * spelling words. Writes MP3s under spell-quest/voice-samples/ so they ship
 * with the next deploy and are reachable from the voice-test page.
 *
 * Run:
 *   node test/generate-voice-samples.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'spell-quest', 'voice-samples');
fs.mkdirSync(OUT, { recursive: true });

// Read CARTESIA_API_KEY from .env
const envPath = path.join(ROOT, '.env');
const env = fs.readFileSync(envPath, 'utf8');
const m = env.match(/^CARTESIA_API_KEY=(.+)$/m);
if (!m) { console.error('CARTESIA_API_KEY not found in .env'); process.exit(1); }
const API_KEY = m[1].trim().replace(/^['"]|['"]$/g, '');

const VOICES = [
  { id: 'carl',  voiceId: 'ed82c17b-4704-4d34-be43-5d19065acdf1', label: 'Carl — Steady Storyteller (current)' },
  { id: 'bryce', voiceId: '2948c301-9211-4112-8f36-4c3fc836ef12', label: 'Bryce — Clear Explainer' },
  { id: 'kate',  voiceId: '489b647b-5662-408f-8c95-82e26ef8d29e', label: 'Kate — Practical Voice' },
  { id: 'elaine', voiceId: 'f0377496-2708-4cc9-b2f8-1b7fdb5e1a2a', label: 'Elaine — Confident Guide' },
  { id: 'diana',  voiceId: 'ea93f57f-7c71-4d79-aeaa-0a39b150f6ca', label: 'Diana — Gentle Mom' },
];

const WORDS = [
  'necessary',
  'mischievous',
  'definitely',
  'rhythm',
  'beneficial',
];

async function generate(voiceId, text) {
  const res = await fetch('https://api.cartesia.ai/tts/bytes', {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Cartesia-Version': '2024-06-10',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_id: 'sonic-2',
      transcript: text,
      voice: { mode: 'id', id: voiceId },
      language: 'en',
      speed: 'slow',
      output_format: { container: 'mp3', bit_rate: 128000, sample_rate: 44100 },
    }),
  });
  if (!res.ok) throw new Error(`Cartesia ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

(async () => {
  for (const w of WORDS) {
    for (const v of VOICES) {
      const fname = `${w}_${v.id}.mp3`;
      const fpath = path.join(OUT, fname);
      if (fs.existsSync(fpath)) {
        console.log('skip', fname);
        continue;
      }
      try {
        const audio = await generate(v.voiceId, w);
        fs.writeFileSync(fpath, audio);
        console.log('wrote', fname, '(' + audio.length + ' bytes)');
      } catch (err) {
        console.error('FAIL', fname, err.message);
      }
    }
  }
  console.log('\nDone. ' + WORDS.length + ' words x ' + VOICES.length + ' voices');
})();
