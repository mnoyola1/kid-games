// POST /api/grade-math
// Body: {
//   problem: { a: number, b: number, op?: '×' (default) },  // expected = a * b
//   imageBase64: string,                                    // single canvas data URL
//   studentName?: string,
// }
// Returns: {
//   transcribed: string,    // what the kid wrote (digits only, post-cleanup)
//   correct: boolean,
//   note: string,           // short encouragement (≤ 18 words)
// }
//
// Why a separate endpoint instead of reusing /api/grade-spelling: Math Mage
// only sends ONE canvas at a time (the lock-in moment), the answer is always
// a small integer (0–144 for tables 0..12), and we want a fast turnaround
// (~1s feels right for the kid). Smaller payload + smaller token budget +
// dedicated prompt → faster, cheaper, more focused than the multi-canvas
// spelling grader.

import {
  readJsonBody, sendJson, sendError, applyCors,
  parseImagePayload, getAnthropicClient, extractJson, describeError,
  CLAUDE_MODEL,
} from './_shared.js';

// Math grading is a tiny extraction task — keep tokens small.
const MAX_TOKENS = 300;

function buildPrompt({ a, b, expected, studentName }) {
  const who = studentName ? studentName : 'the student';
  return [
    `You are checking ${who}'s answer to a multiplication question.`,
    `The question is: ${a} × ${b} = ?  (correct answer: ${expected})`,
    '',
    'The image shows the kid\'s handwritten answer (1 to 3 digits).',
    '',
    'Rules:',
    '1. Read the digits with your vision capability. Do NOT assume the answer.',
    '2. Be FORGIVING on messy handwriting (shaky strokes, slanted digits, sizing).',
    '3. Mark `correct: true` ONLY if the digits the kid wrote spell the number',
    `   ${expected} exactly. Missing, swapped, or extra digits → incorrect.`,
    '4. Common kid mistakes to read carefully (do NOT auto-correct):',
    '   - Reversed digits (e.g. wrote "21" when answer is "12") → incorrect',
    '   - "0" vs "6" — read the loop carefully',
    '   - "1" vs "7" — read the top stroke',
    '5. If the canvas is blank or unreadable, set `correct: false`,',
    '   `transcribed: ""`, and a brief friendly note.',
    '6. Write ONE short encouraging sentence (≤ 18 words) in `note`. If correct,',
    '   celebrate briefly. If wrong, name what they wrote and gently nudge.',
    '   Never shame, never use negative labels.',
    '',
    'Respond with ONLY a JSON object (no prose, no code fence) in this shape:',
    '{ "transcribed": "string", "correct": true, "note": "string" }',
  ].join('\n');
}

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { sendError(res, 405, 'Method not allowed'); return; }

  let body;
  try { body = await readJsonBody(req); }
  catch { sendError(res, 400, 'Invalid JSON body'); return; }

  const problem = body?.problem || {};
  const a = Number(problem.a);
  const b = Number(problem.b);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    sendError(res, 400, 'Missing or invalid "problem.a" / "problem.b"');
    return;
  }
  const expected = a * b;
  const studentName = typeof body?.studentName === 'string' ? body.studentName.slice(0, 40) : '';

  const { base64, mediaType } = parseImagePayload(body?.imageBase64);
  if (!base64) { sendError(res, 400, 'Missing "imageBase64"'); return; }

  // Single-canvas budget: 4 MB is plenty for a 600px PNG.
  const sizeBytes = Math.floor((base64.length * 3) / 4);
  if (sizeBytes > 4 * 1024 * 1024) {
    sendError(res, 413, 'Image payload exceeds 4 MB');
    return;
  }

  const content = [
    { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
    { type: 'text', text: buildPrompt({ a, b, expected, studentName }) },
  ];

  try {
    const claude = await getAnthropicClient();
    const message = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content }],
    });

    const textPart = message.content.find((c) => c.type === 'text');
    const parsed = extractJson(textPart?.text || '');
    if (!parsed) {
      sendError(res, 502, 'Claude did not return valid grading JSON');
      return;
    }

    const transcribedRaw = typeof parsed.transcribed === 'string' ? parsed.transcribed : '';
    // Strip everything that's not a digit, keep the leading digits only.
    const transcribed = transcribedRaw.replace(/[^\d]/g, '').replace(/^0+(\d)/, '$1');
    const note = typeof parsed.note === 'string' ? parsed.note : '';
    // Trust Claude's correct flag, but cross-check with our own digit compare
    // — if the digits don't match `expected`, force correct=false. This guards
    // against the rare case where Claude reads "12" as the digits but flags
    // it correct for "21" anyway.
    const transcribedNum = transcribed === '' ? null : Number(transcribed);
    const claudeSaysCorrect = !!parsed.correct;
    const correct = claudeSaysCorrect
      && transcribedNum != null
      && transcribedNum === expected;

    sendJson(res, 200, {
      transcribed,
      correct,
      note,
      expected, // echo back so client doesn't need to recompute
    });
  } catch (err) {
    const detail = describeError(err);
    console.error('[grade-math] claude error', detail, err?.stack || '');
    sendError(res, 500, 'Grading failed', { detail });
  }
}
