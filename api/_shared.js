// Shared helpers for Spell Quest API routes (Node.js on Vercel).
// Kept dependency-free where possible; only the Anthropic SDK is imported lazily.

export const CLAUDE_MODEL = 'claude-sonnet-4-5';
export const CLAUDE_MAX_TOKENS = 4000;

export function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(body));
}

export function sendError(res, status, message, extra = {}) {
  console.error('[spell-quest api]', status, message, extra);
  sendJson(res, status, { error: message, ...extra });
}

// Pull a human-friendly message out of an Anthropic SDK error or generic Error.
export function describeError(err) {
  if (!err) return 'Unknown error';
  // Anthropic SDK errors have .status / .error.error.message
  const status = err.status || err.statusCode;
  const inner = err.error?.error?.message || err.error?.message || err.message || String(err);
  return status ? `${status}: ${inner}` : inner;
}

// Vercel Node functions receive req.body pre-parsed when Content-Type is JSON,
// but Safari sometimes posts as text/plain with a JSON string. Handle both.
export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { /* fall through */ }
  }
  // Stream fallback
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// Sniff the image format from the first few decoded bytes so we always tell
// Claude the right media_type, regardless of what the client claimed.
function sniffMediaType(base64, fallback = 'image/png') {
  try {
    // Decode just enough to read the magic header.
    const head = Buffer.from(base64.slice(0, 32), 'base64');
    if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image/jpeg';
    if (head.length >= 8 &&
        head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return 'image/png';
    if (head.length >= 12 &&
        head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
        head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50) return 'image/webp';
    if (head.length >= 6 && head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) return 'image/gif';
  } catch { /* fall through */ }
  return fallback;
}

// Strip "data:image/png;base64,..." prefix if present, then sniff magic bytes
// so the returned mediaType always matches what's actually inside `base64`.
// Returns { base64, mediaType }.
export function parseImagePayload(input, fallbackMedia = 'image/png') {
  if (!input || typeof input !== 'string') {
    return { base64: '', mediaType: fallbackMedia };
  }
  const match = input.match(/^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,(.+)$/i);
  let base64 = input;
  let claimed = fallbackMedia;
  if (match) {
    claimed = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
    base64 = match[2];
  }
  // Strip whitespace/newlines that some clients introduce.
  base64 = base64.replace(/\s+/g, '');
  const sniffed = sniffMediaType(base64, claimed);
  return { base64, mediaType: sniffed };
}

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  // Dynamic import keeps cold-start slim when multiple functions share this module.
  return import('@anthropic-ai/sdk').then(({ default: Anthropic }) => new Anthropic({ apiKey }));
}

// Extract the first JSON object found in a text blob (Claude sometimes wraps JSON in prose).
export function extractJson(text) {
  if (!text) return null;
  const fenceMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* fall through */ }
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(text.slice(firstBrace, lastBrace + 1)); } catch { /* fall through */ }
  }
  return null;
}

export function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
