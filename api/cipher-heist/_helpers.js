// Shared helpers for Cipher Heist serverless API.
//
// Implements the spec section 6 anti-exploit guarantees:
//   - vault codes never leave the DB row
//   - all bits / firewall mutations validated against fresh DB reads
//   - rate limit (1 crack/15s) and 3-attempts-per-target enforced server-side
//   - bonus-question gate consumed atomically before crack-attempt accepted

import { createClient } from '@supabase/supabase-js';

export function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(body));
}

export function sendError(res, status, message, extra = {}) {
  console.error('[cipher-heist api]', status, message, extra);
  sendJson(res, status, { error: message, ...extra });
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { /* fall through */ }
  }
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

let _admin = null;
export function getAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase admin env not configured (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)');
  }
  _admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return _admin;
}

// --------------------------------------------------------
// Game-config snapshot (server-side mirror)
//
// We mirror just enough of game-config.js here for the server to validate
// answers and pick questions. If you change scoring or pack content, update
// both files together. (Future enhancement: extract a shared package.)
// --------------------------------------------------------

export const SERVER_CONFIG = {
  bits: {
    fast: 30, medium: 20, slow: 10, surge: 20, stealRatio: 0.3,
    answerSpeedFastMs: 5000, answerSpeedMediumMs: 10000,
    answerTimeoutMs: 15000, bonusTimeoutMs: 10000,
    crackRateLimitMs: 15000,
  },
  crack: { codeLength: 3, digitMin: 1, digitMax: 9, maxAttemptsPerSession: 3 },
};

export function scoreSpeed(elapsedMs) {
  const B = SERVER_CONFIG.bits;
  if (elapsedMs < B.answerSpeedFastMs) return { tier: 'fast', bits: B.fast };
  if (elapsedMs < B.answerSpeedMediumMs) return { tier: 'medium', bits: B.medium };
  return { tier: 'slow', bits: B.slow };
}

export function validateVaultCode(code) {
  if (!Array.isArray(code) || code.length !== 3) return false;
  for (const d of code) if (typeof d !== 'number' || d < 1 || d > 9) return false;
  return new Set(code).size === code.length;
}

export function crackFeedback(guess, target) {
  const result = ['miss', 'miss', 'miss'];
  const used = [false, false, false];
  for (let i = 0; i < 3; i++) {
    if (guess[i] === target[i]) { result[i] = 'exact'; used[i] = true; }
  }
  for (let i = 0; i < 3; i++) {
    if (result[i] === 'exact') continue;
    for (let j = 0; j < 3; j++) {
      if (!used[j] && guess[i] === target[j]) { result[i] = 'partial'; used[j] = true; break; }
    }
  }
  return result;
}

export function generateRoomCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude I/O for legibility
  let out = '';
  for (let i = 0; i < 4; i++) out += letters[Math.floor(Math.random() * letters.length)];
  return out;
}

// --------------------------------------------------------
// Question packs (server-side; smaller mirror — enough to dispatch).
// In production this would be sourced from the same data file shared with
// the client. For now, we accept question payloads only by id from the
// client-known packs and just generate fresh randomized questions on demand
// using a server-side mini library.
// --------------------------------------------------------

export const SERVER_PACKS = {
  math: {
    tier3: {
      regular: [
        { q: '5 + 7', choices: ['10','11','12','13'], a: 2 },
        { q: '3 × 4', choices: ['7','9','12','15'], a: 2 },
        { q: '8 ÷ 2', choices: ['2','3','4','6'], a: 1 },
        { q: '7 + 8', choices: ['13','14','15','16'], a: 2 },
        { q: '5 × 5', choices: ['20','22','24','25'], a: 3 },
        { q: '12 - 5', choices: ['6','7','8','9'], a: 1 },
        { q: '4 × 6', choices: ['18','22','24','26'], a: 2 },
        { q: '16 ÷ 4', choices: ['3','4','5','6'], a: 1 },
        { q: '9 + 6', choices: ['13','14','15','16'], a: 2 },
        { q: '6 × 2', choices: ['10','11','12','13'], a: 2 },
      ],
      bonus: [
        { q: '(3 × 4) + 7', choices: ['17','19','21','23'], a: 1 },
        { q: '20 - (6 + 5)', choices: ['7','8','9','10'], a: 2 },
        { q: '15 ÷ 3 × 2', choices: ['8','10','12','15'], a: 1 },
        { q: '(8 + 4) ÷ 2', choices: ['4','5','6','8'], a: 2 },
      ],
    },
    tier5: {
      regular: [
        { q: '12 × 7', choices: ['72','78','84','94'], a: 2 },
        { q: '144 ÷ 12', choices: ['10','11','12','14'], a: 2 },
        { q: '0.5 × 24', choices: ['10','11','12','14'], a: 2 },
        { q: '(15 × 4) + 8', choices: ['62','64','68','72'], a: 2 },
        { q: '8 × 7 - 6', choices: ['46','48','50','52'], a: 2 },
        { q: '5/8 + 1/8', choices: ['5/8','6/8','6/16','7/8'], a: 1 },
        { q: 'Square of 9', choices: ['72','79','81','99'], a: 2 },
        { q: '3/4 of 16', choices: ['8','10','12','14'], a: 2 },
      ],
      bonus: [
        { q: '2 × (8 + 4) - 5', choices: ['17','18','19','20'], a: 2 },
        { q: '100 - (6 × 7)', choices: ['56','57','58','59'], a: 2 },
        { q: '(48 ÷ 6) + (3 × 5)', choices: ['21','22','23','24'], a: 2 },
        { q: 'Volume of 3×4×5 box', choices: ['12','20','32','60'], a: 3 },
      ],
    },
  },
  // (Other packs follow the same shape; for brevity the server fallback
  // covers math fully. Other packs are accepted by id but fall back to
  // the math pool if the requested pack tier is empty server-side.)
  spelling: { tier3: { regular: [], bonus: [] }, tier5: { regular: [], bonus: [] } },
  science:  { tier3: { regular: [], bonus: [] }, tier5: { regular: [], bonus: [] } },
  vocab:    { tier3: { regular: [], bonus: [] }, tier5: { regular: [], bonus: [] } },
  geography:{ tier3: { regular: [], bonus: [] }, tier5: { regular: [], bonus: [] } },
};

export function pickQuestion(packId, tier, type = 'regular') {
  const p = SERVER_PACKS[packId] || SERVER_PACKS.math;
  const t = (p && p[tier]) || SERVER_PACKS.math[tier];
  const pool = (t && t[type]) || (SERVER_PACKS.math[tier] && SERVER_PACKS.math[tier][type]) || [];
  if (!pool.length) {
    return SERVER_PACKS.math.tier3.regular[0];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// --------------------------------------------------------
// DB helpers
// --------------------------------------------------------

export async function loadSession(admin, code) {
  const { data, error } = await admin
    .from('cipher_heist_sessions')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function loadPlayers(admin, sessionId) {
  const { data, error } = await admin
    .from('cipher_heist_players')
    .select('*')
    .eq('session_id', sessionId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function loadCrackHistory(admin, sessionId) {
  const { data, error } = await admin
    .from('cipher_heist_crack_history')
    .select('*')
    .eq('session_id', sessionId);
  if (error) throw error;
  return data || [];
}

export async function logEvent(admin, sessionId, kind, actorId = null, targetId = null, payload = {}) {
  const { error } = await admin.from('cipher_heist_events').insert({
    session_id: sessionId,
    kind,
    actor_id: actorId,
    target_id: targetId,
    payload,
  });
  if (error) console.error('[cipher-heist] log_event failed', kind, error.message);
}

// --------------------------------------------------------
// Public-state projection (strips secrets)
// --------------------------------------------------------

export function projectPlayer(p, viewerId) {
  const safe = {
    profile_id: p.profile_id,
    name: p.name,
    avatar: p.avatar,
    is_bot: p.is_bot,
    bot_type: p.bot_type,
    bits: p.bits,
    firewalls: p.firewalls,
    pending_action: p.pending_action,
    online: p.online,
    stats: p.stats || {},
    has_vault: Array.isArray(p.vault_code) && p.vault_code.length === 3,
  };
  if (viewerId && viewerId === p.profile_id) {
    // Viewer is allowed to see their own active question and bonus gate state
    safe.active_question = p.active_question || null;
    safe.bonus_gate_used = p.bonus_gate_used;
  }
  // Vault codes are never projected, even to the viewer (UI shows ●●●)
  return safe;
}

export function projectSession(session) {
  if (!session) return null;
  return {
    id: session.id,
    code: session.code,
    host_id: session.host_id,
    status: session.status,
    pack_id: session.pack_id,
    grade_tier: session.grade_tier,
    duration_sec: session.duration_sec,
    started_at: session.started_at,
    ends_at: session.ends_at,
    ended_at: session.ended_at,
    winner_id: session.winner_id,
  };
}

export function methodGuard(req, res, methods = ['POST']) {
  if (req.method === 'OPTIONS') {
    applyCors(res);
    res.status(204).end();
    return false;
  }
  applyCors(res);
  if (!methods.includes(req.method)) {
    sendError(res, 405, `Method ${req.method} not allowed`);
    return false;
  }
  return true;
}
