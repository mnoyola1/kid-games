// POST /api/extract-words
// Body: { imageBase64: string (data URL or raw base64), grade?: 3 | 5 }
// Returns: { suggestedName: string, words: Array<{ word: string, sentence?: string }> }
//
// Claude Sonnet 4.5 Vision reads a photo of a spelling list (worksheet, planner,
// whiteboard, etc.) and returns clean vocabulary words the kid needs to practice.
// Anything that isn't a target word (headers, dates, page numbers, teacher notes)
// is ignored.

import {
  readJsonBody, sendJson, sendError, applyCors,
  parseImagePayload, getAnthropicClient, extractJson,
  CLAUDE_MODEL, CLAUDE_MAX_TOKENS,
} from './_shared.js';

const MAX_IMAGE_MB = 5;

function buildPrompt(grade) {
  const gradeLabel = grade ? ` (grade ${grade})` : '';
  return [
    `You are helping a parent set up a spelling practice session${gradeLabel}.`,
    'The attached image is a photograph of a printed or handwritten spelling list.',
    '',
    'Extract every spelling/vocabulary word the student is expected to study.',
    'Rules:',
    '1. Return only real English words intended for spelling practice — skip headers ',
    '   ("Week 4", "Spelling List"), dates, names, page numbers, and teacher notes.',
    '2. Lowercase every word unless it is a proper noun that should stay capitalized.',
    '3. Deduplicate. Cap the list at 40 words.',
    '4. If the image includes an example sentence for a word, capture it in `sentence`.',
    '5. Propose a short friendly `suggestedName` for the list (e.g. "Week 4 Prefixes").',
    '',
    'Respond with ONLY a JSON object in exactly this shape (no prose, no code fence):',
    '{',
    '  "suggestedName": "string",',
    '  "words": [ { "word": "string", "sentence": "string (optional)" } ]',
    '}',
  ].join('\n');
}

function sanitizeWords(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const cleaned = [];
  for (const entry of raw) {
    const rawWord = typeof entry === 'string' ? entry : entry?.word;
    if (!rawWord || typeof rawWord !== 'string') continue;
    const word = rawWord.trim().replace(/\s+/g, ' ');
    if (!word || word.length > 40) continue;
    if (!/^[A-Za-z][A-Za-z'-]{0,}$/.test(word)) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const out = { word };
    const sentence = typeof entry?.sentence === 'string' ? entry.sentence.trim() : '';
    if (sentence && sentence.length <= 200) out.sentence = sentence;
    cleaned.push(out);
    if (cleaned.length >= 40) break;
  }
  return cleaned;
}

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { sendError(res, 405, 'Method not allowed'); return; }

  let body;
  try { body = await readJsonBody(req); } catch { sendError(res, 400, 'Invalid JSON body'); return; }

  const { base64, mediaType } = parseImagePayload(body?.imageBase64);
  if (!base64) { sendError(res, 400, 'Missing "imageBase64"'); return; }

  const approxBytes = Math.floor((base64.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_MB * 1024 * 1024) {
    sendError(res, 413, `Image too large (> ${MAX_IMAGE_MB} MB). Please use a smaller photo.`);
    return;
  }

  const grade = Number.isFinite(body?.grade) ? Number(body.grade) : undefined;

  try {
    const claude = await getAnthropicClient();
    const message = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: buildPrompt(grade) },
          ],
        },
      ],
    });

    const textPart = message.content.find((c) => c.type === 'text');
    const parsed = extractJson(textPart?.text || '');
    if (!parsed) { sendError(res, 502, 'Claude did not return JSON'); return; }

    const words = sanitizeWords(parsed.words);
    if (words.length === 0) {
      sendError(res, 422, 'No spelling words detected. Try a clearer, better-lit photo.');
      return;
    }

    const suggestedName = typeof parsed.suggestedName === 'string'
      ? parsed.suggestedName.trim().slice(0, 60)
      : 'Spelling List';

    sendJson(res, 200, { suggestedName: suggestedName || 'Spelling List', words });
  } catch (err) {
    sendError(res, 500, 'Word extraction failed', { detail: String(err?.message || err) });
  }
}
