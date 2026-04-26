/**
 * Cipher Heist — Online adapter
 *
 * Thin transport layer that wraps:
 *   - REST calls to /api/cipher-heist/* (server-authoritative mutations)
 *   - Supabase Realtime channel subscription (public state broadcasts)
 *
 * It projects the server's public DB state into the same shape the local
 * engine produces, so the existing UI components (HUDScreen, CrackScreen,
 * EndScreen) keep working unchanged.
 *
 * Vault codes never travel back to the client (per spec section 6). For the
 * UI's own player slot we render `[●●●]` using a placeholder array; the
 * server-side state alone determines who has a locked vault.
 */

(function (global) {
  const C = global.CIPHER_CONFIG;
  if (!C) {
    console.error('CipherOnline: CIPHER_CONFIG missing');
    return;
  }

  const HAS_VAULT_PLACEHOLDER = [0, 0, 0];

  // ----- API URL resolution -----
  // When served from Vercel (production / vercel dev), /api/cipher-heist/* is
  // mounted at the same origin. For pure-static local previews we fall back
  // to the same origin too — it just won't work without an API host.
  function apiUrl(name) {
    return `/api/cipher-heist/${name}`;
  }

  async function postJson(name, body) {
    try {
      const res = await fetch(apiUrl(name), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      });
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }
      if (!res.ok) {
        return { error: data.error || `HTTP ${res.status}`, status: res.status, ...data };
      }
      return data;
    } catch (err) {
      return { error: err.message || 'network error' };
    }
  }

  // ----- Supabase client (lazy) -----
  let _supabase = null;
  function getSupabase() {
    if (_supabase) return _supabase;
    const cfg = global.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey) return null;
    if (!global.supabase || typeof global.supabase.createClient !== 'function') return null;
    _supabase = global.supabase.createClient(cfg.url, cfg.anonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
    return _supabase;
  }

  // ----- DB → engine-state projector -----
  function dbStateToEngineState({ session, players, crackHistory, viewerId }) {
    if (!session) return null;
    const startedAt = session.started_at ? new Date(session.started_at).getTime() : null;
    const endsAt = session.ends_at ? new Date(session.ends_at).getTime() : null;
    const status = session.status === 'lobby'
      ? 'lobby'
      : session.status === 'ended' ? 'ended' : 'playing';

    const playersOut = {};
    const playerOrder = [];
    const activeQuestions = {};
    const bonusGate = {};
    const crackHistoryOut = {};
    const crackAttemptsUsed = {};

    (players || []).forEach(p => {
      const isMe = p.profile_id === viewerId;
      playersOut[p.profile_id] = {
        id: p.profile_id,
        name: p.name,
        avatar: p.avatar,
        isBot: !!p.is_bot,
        botType: p.bot_type,
        // Vault code never travels — show as locked if has_vault
        vaultCode: p.has_vault ? HAS_VAULT_PLACEHOLDER : null,
        bits: p.bits || 0,
        firewalls: p.firewalls || 0,
        pendingAction: p.pending_action,
        pendingActionType: p.pending_action_type,
        lastCorrectAt: null,
        stats: {
          correct: (p.stats || {}).questions_correct || 0,
          wrong: ((p.stats || {}).questions_seen || 0) - ((p.stats || {}).questions_correct || 0),
          bonusCorrect: 0,
          bonusWrong: 0,
          actionsUsed: 0,
          cracksAttempted: 0,
          cracksSucceeded: (p.stats || {}).cracks_success || 0,
          defended: (p.stats || {}).firewalls_used || 0,
          bitsStolen: (p.stats || {}).bits_stolen || 0,
          bitsLost: 0,
        },
        online: !!p.online,
      };
      playerOrder.push(p.profile_id);

      // Only the viewer sees their own active question
      activeQuestions[p.profile_id] = isMe ? (p.active_question || null) : null;

      // Bonus gate is also private to the viewer
      bonusGate[p.profile_id] = (isMe && p.bonus_gate_used === false)
        ? { acquiredAt: p.bonus_gate_at ? new Date(p.bonus_gate_at).getTime() : Date.now(), used: false }
        : null;

      crackHistoryOut[p.profile_id] = {};
      crackAttemptsUsed[p.profile_id] = {};
    });

    (crackHistory || []).forEach(h => {
      crackHistoryOut[h.attacker_id] = crackHistoryOut[h.attacker_id] || {};
      crackHistoryOut[h.attacker_id][h.target_id] = crackHistoryOut[h.attacker_id][h.target_id] || [];
      crackHistoryOut[h.attacker_id][h.target_id].push({
        guess: null, // never echoed
        feedback: h.feedback,
        at: new Date(h.created_at).getTime(),
      });
      crackAttemptsUsed[h.attacker_id] = crackAttemptsUsed[h.attacker_id] || {};
      crackAttemptsUsed[h.attacker_id][h.target_id] =
        (crackAttemptsUsed[h.attacker_id][h.target_id] || 0) + 1;
    });

    // Compute placements (used by EndScreen + chComputeRewards)
    const placements = Object.values(playersOut)
      .sort((a, b) => (b.bits || 0) - (a.bits || 0))
      .map((p, i) => ({ pid: p.id, place: i + 1, bits: p.bits }));

    return {
      status,
      config: {
        mode: 'online',
        packId: session.pack_id,
        gradeTier: session.grade_tier,
        durationSec: session.duration_sec,
        hostId: session.host_id,
      },
      now: Date.now(),
      startedAt,
      endsAt,
      players: playersOut,
      playerOrder,
      activeQuestions,
      crackHistory: crackHistoryOut,
      crackAttemptsUsed,
      lastCrackAt: {},
      hotseatTurnIndex: 0,
      events: [],
      winner: session.winner_id || null,
      bonusGate,
      placements,
    };
  }

  // ----- Subscriptions -----
  // We keep one channel per session; on any DB change we re-fetch authoritative
  // state via /state and emit it to the registered listener.
  const subscriptions = {}; // code -> { channel, viewerId, listener }

  async function refreshState(code, viewerId) {
    const data = await postJson('state', { code, viewerId });
    if (data?.error) return { error: data.error };
    return {
      session: data.session,
      players: data.players,
      crackHistory: data.crackHistory,
      engineState: dbStateToEngineState({ ...data, viewerId }),
    };
  }

  function subscribe(code, viewerId, listener) {
    unsubscribe(code);
    const sb = getSupabase();
    const fire = async (kind = 'state') => {
      const r = await refreshState(code, viewerId);
      if (r.error) { listener({ kind: 'error', error: r.error }); return; }
      listener({
        kind,
        state: r.engineState,
        rawSession: r.session,
        players: r.players,
        crackHistory: r.crackHistory,
      });
      if (r.session?.status === 'playing' && kind === 'state') listener({ kind: 'started', state: r.engineState });
      if (r.session?.status === 'ended') listener({ kind: 'ended', state: r.engineState });
    };

    let channel = null;
    if (sb && typeof sb.channel === 'function') {
      channel = sb.channel(`cipher-heist-${code}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cipher_heist_sessions', filter: `code=eq.${code}` }, () => fire())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cipher_heist_players' }, () => fire())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cipher_heist_events' }, () => fire())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cipher_heist_crack_history' }, () => fire())
        .subscribe();
    } else {
      // Fallback: poll every 2s
      const intervalId = setInterval(fire, 2000);
      channel = { _interval: intervalId, unsubscribe() { clearInterval(intervalId); } };
    }

    subscriptions[code] = { channel, viewerId, listener };
    fire('state'); // initial state
  }

  function unsubscribe(code) {
    const sub = subscriptions[code];
    if (!sub) return;
    try {
      if (sub.channel?._interval) clearInterval(sub.channel._interval);
      else if (sub.channel?.unsubscribe) sub.channel.unsubscribe();
      else if (_supabase && sub.channel) _supabase.removeChannel(sub.channel);
    } catch (e) { /* ignore */ }
    delete subscriptions[code];
  }

  // ----- Public API -----
  async function createSession({ packId, gradeTier, durationSec, host }) {
    const r = await postJson('create-session', { packId, gradeTier, durationSec, host });
    if (r.error) throw new Error(r.error);
    return { code: r.code, playerId: host.id, isHost: true };
  }

  async function joinSession({ code, player }) {
    const r = await postJson('join-session', { code, player });
    if (r.error) throw new Error(r.error);
    return { code, playerId: player.id, isHost: r.isHost, players: r.players };
  }

  async function setVault({ code, playerId, vaultCode }) {
    return postJson('set-vault', { code, playerId, vaultCode });
  }

  async function startSession({ code }) {
    return postJson('start-session', { code });
  }

  async function submitAnswer({ code, playerId, choice }) {
    return postJson('submit-answer', { code, playerId, choiceIdx: choice });
  }

  async function heistAction({ code, playerId, actionId, targetId }) {
    return postJson('heist-action', { code, playerId, action: actionId, targetId });
  }

  async function crackAttempt({ code, playerId, targetId, guess }) {
    return postJson('crack-attempt', { code, attackerId: playerId, targetId, guess });
  }

  async function endSession({ code }) {
    return postJson('end-session', { code });
  }

  function leave({ code }) {
    unsubscribe(code);
  }

  global.CipherOnline = {
    createSession,
    joinSession,
    setVault,
    startSession,
    submitAnswer,
    heistAction,
    crackAttempt,
    endSession,
    subscribe: (code, listener) => {
      // Backwards-compatible: try to derive viewer id from a profile if provided
      // (game-main.js passes the ID via state internally; we expose
      // subscribeAs() for explicit viewer ID).
      const viewerId = global.__cipherViewerId || null;
      return subscribe(code, viewerId, listener);
    },
    subscribeAs: (code, viewerId, listener) => subscribe(code, viewerId, listener),
    unsubscribe,
    leave,
  };
})(typeof window !== 'undefined' ? window : globalThis);
