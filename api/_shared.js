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

// Strip "data:image/png;base64,..." prefix if present. Returns { base64, mediaType }.
export function parseImagePayload(input, fallbackMedia = 'image/png') {
  if (!input || typeof input !== 'string') {
    return { base64: '', mediaType: fallbackMedia };
  }
  const match = input.match(/^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,(.+)$/i);
  if (match) {
    const mt = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
    return { base64: match[2], mediaType: mt };
  }
  return { base64: input, mediaType: fallbackMedia };
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
