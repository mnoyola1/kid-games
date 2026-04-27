// POST /api/grade-spelling
// Body: {
//   studentName?: string,
//   canvases: Array<{ word: string, imageBase64: string }>,  // up to 20
// }
// Returns: {
//   items: Array<{ word, transcribed, correct, note }>,
//   overall_feedback: string,
//   strengths: string[],
//   areas_to_improve: string[],
//   correct_count: number,
//   total_count: number,
//   score: number
// }
//
// Claude Sonnet 4.5 Vision reads each handwritten canvas and compares it to the
// expected word. Strict letter-for-letter equality; forgiving on messy penmanship.

import {
  readJsonBody, sendJson, sendError, applyCors,
  parseImagePayload, getAnthropicClient, extractJson, describeError,
  CLAUDE_MODEL, CLAUDE_MAX_TOKENS,
} from './_shared.js';

const MAX_WORDS = 25;
const MAX_TOTAL_MB = 12;

function buildPrompt(words, studentName) {
  const who = studentName ? `${studentName}` : 'the student';
  return [
    `You are grading a spelling test for ${who}.`,
    'Each numbered image shows a single handwritten word the student wrote while',
    'hearing the target word dictated. The target word is listed below each image.',
    '',
    'Grading rules:',
    '1. Read the handwriting with your vision capability. Do NOT assume the answer.',
    '2. Mark `correct: true` ONLY if the letters the student wrote spell the target',
    '   word exactly (case-insensitive). Missing, swapped, duplicated, or extra',
    '   letters = incorrect.',
    '3. Be forgiving on messy handwriting: look past shaky strokes, stray marks,',
    '   slanted letters, or sizing. If you are confident of the letters, trust them.',
    '4. If the canvas is blank or unreadable, set `correct: false`, put a short',
    '   human note in `note`, and set `transcribed` to "" (empty string).',
    '5. For each word, write ONE short encouraging sentence (<= 18 words) in `note`',
    '   that either celebrates the win or gently names the specific letter/pattern',
    '   that was missed. Never shame, never use negative labels.',
    '',
    'After grading every word, write a warm overall summary and 1-3 specific',
    'strengths plus 1-3 specific areas to practice.',
    '',
    'Target words in order:',
    ...words.map((w, i) => `  ${i + 1}. ${w}`),
    '',
    'Respond with ONLY a JSON object (no prose, no code fence) in this exact shape:',
    '{',
    '  "items": [',
    '    { "word": "string (the target word)", "transcribed": "string", "correct": true, "note": "string" }',
    '  ],',
    '  "overall_feedback": "string",',
    '  "strengths": ["..."],',
    '  "areas_to_improve": ["..."]',
    '}',
    'The `items` array must have exactly one entry per target word, in order.',
  ].join('\n');
}

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { sendError(res, 405, 'Method not allowed'); return; }

  let body;
  try { body = await readJsonBody(req); } catch { sendError(res, 400, 'Invalid JSON body'); return; }

  const canvases = Array.isArray(body?.canvases) ? body.canvases : [];
  if (canvases.length === 0) { sendError(res, 400, 'Missing "canvases"'); return; }
  if (canvases.length > MAX_WORDS) { sendError(res, 400, `Too many words (max ${MAX_WORDS})`); return; }

  const studentName = typeof body?.studentName === 'string' ? body.studentName.slice(0, 40) : '';

  // Build Claude content: one (image, label) pair per canvas.
  const content = [];
  const words = [];
  let totalBytes = 0;

  for (let i = 0; i < canvases.length; i++) {
    const entry = canvases[i];
    const target = typeof entry?.word === 'string' ? entry.word.trim() : '';
    if (!target) { sendError(res, 400, `Canvas ${i + 1} missing "word"`); return; }

    const { base64, mediaType } = parseImagePayload(entry?.imageBase64);
    if (!base64) { sendError(res, 400, `Canvas ${i + 1} missing "imageBase64"`); return; }

    totalBytes += Math.floor((base64.length * 3) / 4);
    if (totalBytes > MAX_TOTAL_MB * 1024 * 1024) {
      sendError(res, 413, `Combined image payload exceeds ${MAX_TOTAL_MB} MB`);
      return;
    }

    words.push(target);
    content.push({ type: 'text', text: `Image ${i + 1} — target word: "${target}"` });
    content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } });
  }

  content.push({ type: 'text', text: buildPrompt(words, studentName) });

  try {
    const claude = await getAnthropicClient();
    const message = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      messages: [{ role: 'user', content }],
    });

    const textPart = message.content.find((c) => c.type === 'text');
    const parsed = extractJson(textPart?.text || '');
    if (!parsed || !Array.isArray(parsed.items)) {
      sendError(res, 502, 'Claude did not return a valid grading JSON');
      return;
    }

    const itemsByWord = new Map();
    for (const it of parsed.items) {
      if (!it || typeof it.word !== 'string') continue;
      itemsByWord.set(it.word.trim().toLowerCase(), it);
    }

    // Align items to target order + enforce shape. If Claude missed an entry,
    // we still produce a placeholder so the UI always has length === words.length.
    const items = words.map((target) => {
      const found = itemsByWord.get(target.toLowerCase());
      const transcribed = typeof found?.transcribed === 'string' ? found.transcribed : '';
      const note = typeof found?.note === 'string' ? found.note : '';
      const correct = !!found?.correct
        && transcribed.trim().toLowerCase() === target.trim().toLowerCase();
      return { word: target, transcribed, correct, note };
    });

    const correctCount = items.filter((i) => i.correct).length;
    const totalCount = items.length;
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    sendJson(res, 200, {
      items,
      overall_feedback: typeof parsed.overall_feedback === 'string' ? parsed.overall_feedback : '',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
      areas_to_improve: Array.isArray(parsed.areas_to_improve) ? parsed.areas_to_improve.slice(0, 5) : [],
      correct_count: correctCount,
      total_count: totalCount,
      score,
    });
  } catch (err) {
    const detail = describeError(err);
    console.error('[grade-spelling] claude error', detail, err?.stack || '');
    sendError(res, 500, 'Grading failed', { detail });
  }
}
