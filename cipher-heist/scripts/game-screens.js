/**
 * Cipher Heist - UI Screens
 *
 * Each screen is a stateless presentational React component that
 * receives game state + callbacks from <CipherHeist> in game-main.js.
 *
 * Screens:
 *   <LobbyScreen>         — pick mode/pack/grade/duration
 *   <VaultPickScreen>     — set your 3-digit code
 *   <HUDScreen>           — main play screen (question, opponents, bits)
 *   <ActionPicker>        — modal to pick which heist action to use
 *   <CrackScreen>         — choose target & enter guess
 *   <HotSeatHandoff>      — pass-the-iPad curtain
 *   <EndScreen>           — leaderboard + reward summary
 *   <VexBubble>           — small helper for mascot text
 */

const VEX_FACE = '🦝'; // Emoji fallback if Vex sprite fails to load

// Where Vex sprites live (absolute paths so they resolve from /cipher-heist/).
const VEX_SPRITES = {
  idle:     '/assets/sprites/cipher-heist/vex-idle_nobg.png',
  briefing: '/assets/sprites/cipher-heist/vex-briefing_nobg.png',
  cheer:    '/assets/sprites/cipher-heist/vex-cheer_nobg.png',
  sad:      '/assets/sprites/cipher-heist/vex-sad_nobg.png',
};

// Background images for full-screen panels.
const BG_IMAGES = {
  lobby: '/assets/backgrounds/cipher-heist/lobby.png',
  crack: '/assets/backgrounds/cipher-heist/vault-crack.png',
  end:   '/assets/backgrounds/cipher-heist/end.png',
};

// ============================================================
// Avatar — renders <img> for URL paths, text for emoji
// ============================================================

function resolveAvatarPath(src) {
  if (!src || typeof src !== 'string') return '';
  if (/^(https?:|data:)/i.test(src)) return src;
  let s = src.trim();
  if (s.startsWith('./')) s = s.slice(2);
  if (s.startsWith('assets/')) return '/' + s;
  if (s.startsWith('/')) return s;
  return s;
}

function isImageAvatar(src) {
  if (!src || typeof src !== 'string') return false;
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(src) || src.startsWith('http') || src.startsWith('/') || src.includes('/');
}

function Avatar({ src, name = '', size = 32, fallback = '🧑', className = '' }) {
  const [errored, setErrored] = useState(false);
  if (isImageAvatar(src) && !errored) {
    return (
      <img
        src={resolveAvatarPath(src)}
        alt={name || 'avatar'}
        width={size}
        height={size}
        className={`inline-block rounded-full object-cover bg-terminal-panel ${className}`}
        style={{ width: size, height: size }}
        onError={() => setErrored(true)}
      />
    );
  }
  return <span className={className} style={{ fontSize: Math.round(size * 0.85), lineHeight: 1 }}>{(isImageAvatar(src) ? fallback : src) || fallback}</span>;
}

// ============================================================
// UIIcon — polished PNG icon with emoji fallback
// ============================================================

function UIIcon({ src, fallback = '', size = 24, className = '', alt = '' }) {
  const [errored, setErrored] = useState(false);
  if (src && !errored) {
    return (
      <img
        src={src}
        alt={alt || fallback}
        width={size}
        height={size}
        className={`inline-block align-middle ${className}`}
        style={{ width: size, height: size, objectFit: 'contain' }}
        onError={() => setErrored(true)}
      />
    );
  }
  return <span className={`inline-block align-middle ${className}`} style={{ fontSize: Math.round(size * 0.9), lineHeight: 1 }}>{fallback}</span>;
}

// ============================================================
// VexBubble — small mascot speech component (uses real sprite)
// ============================================================

function VexBubble({ lineKey, fallbackText, compact = false, mood = 'idle' }) {
  const text = (window.CIPHER_CONFIG?.VEX_LINES?.[lineKey]?.text) || fallbackText || '';
  const sprite = VEX_SPRITES[mood] || VEX_SPRITES.idle;
  const [errored, setErrored] = useState(false);
  return (
    <div className={`flex items-start gap-2 ${compact ? 'text-sm' : ''}`}>
      <div className="flex-shrink-0">
        {!errored ? (
          <img
            src={sprite}
            alt="Vex"
            className={compact ? 'w-10 h-10' : 'w-14 h-14'}
            style={{ objectFit: 'contain' }}
            onError={() => setErrored(true)}
          />
        ) : (
          <div className={compact ? 'text-2xl' : 'text-3xl'}>{VEX_FACE}</div>
        )}
      </div>
      <div className="vex-bubble flex-1">{text}</div>
    </div>
  );
}

// ============================================================
// LobbyScreen
// ============================================================

function LobbyScreen({ playerProfile, onStart, onReturnToHub }) {
  const [mode, setMode] = useState('solo'); // 'solo' | 'hotseat' | 'online'
  const [packId, setPackId] = useState('math');
  const [gradeTier, setGradeTier] = useState('tier3');
  const [durationSec, setDurationSec] = useState(300);
  const [hotseatPlayers, setHotseatPlayers] = useState([
    playerProfile?.name || 'Player 1',
    'Player 2',
  ]);
  const [onlineMode, setOnlineMode] = useState('host'); // 'host' | 'join'
  const [joinCode, setJoinCode] = useState('');

  const packs = Object.values(window.CIPHER_CONFIG.PACKS).filter(p => !p.stub);

  const start = () => {
    onStart({
      mode,
      packId,
      gradeTier,
      durationSec,
      hotseatPlayers: mode === 'hotseat' ? hotseatPlayers.filter(n => n.trim()) : null,
      online: mode === 'online' ? { mode: onlineMode, joinCode: joinCode.trim().toUpperCase() } : null,
    });
  };

  const updateHotseatPlayer = (idx, val) => {
    const next = hotseatPlayers.slice();
    next[idx] = val;
    setHotseatPlayers(next);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(11,16,32,0.85), rgba(11,16,32,0.95)), url(${BG_IMAGES.lobby})` }}>
      <div className="terminal-frame max-w-3xl w-full p-6 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-cipher-cyan font-mono text-xs tracking-widest mb-1">[ TERMINAL READY ]</div>
            <h1 className="font-display text-4xl md:text-5xl font-black bg-gradient-to-r from-cipher-cyan via-cipher-violet to-cipher-magenta bg-clip-text text-transparent">
              CIPHER HEIST
            </h1>
            <p className="text-terminal-text mt-2">Quiz-fueled multiplayer hacker heist.</p>
          </div>
          <UIIcon
            src="/assets/sprites/cipher-heist/lock-unlocked_nobg.png"
            fallback="🔓"
            size={72}
            alt="Cipher Heist logo"
          />
        </div>

        <div className="mb-6">
          <VexBubble lineKey="welcome" mood="briefing" />
        </div>

        {playerProfile && (
          <div className="mb-6 text-sm text-terminal-text">
            Logged in as <span className="font-bold text-cipher-cyan">{playerProfile.name}</span>
            {' • Level '}<span className="font-bold text-cipher-gold">{playerProfile.level}</span>
          </div>
        )}

        {/* Mode */}
        <Section title="Mode">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ModeCard active={mode === 'solo'} onClick={() => setMode('solo')}
              icon="🤖" label="Solo vs AI" desc="Take on Scout & Sage." />
            <ModeCard active={mode === 'hotseat'} onClick={() => setMode('hotseat')}
              icon="🪑" label="Local Hot-Seat" desc="Pass the iPad. Same device." />
            <ModeCard active={mode === 'online'} onClick={() => setMode('online')}
              icon="🌐" label="Online" desc="Room code, two devices." />
          </div>
        </Section>

        {mode === 'hotseat' && (
          <Section title="Players">
            <div className="space-y-2">
              {hotseatPlayers.map((name, idx) => (
                <input
                  key={idx}
                  className="w-full bg-terminal-panel border border-terminal-border rounded-lg px-3 py-2 text-terminal-text font-body"
                  placeholder={`Player ${idx + 1}`}
                  value={name}
                  onChange={e => updateHotseatPlayer(idx, e.target.value)}
                />
              ))}
              <div className="flex gap-2">
                {hotseatPlayers.length < 4 && (
                  <button className="btn-secondary text-sm"
                    onClick={() => setHotseatPlayers([...hotseatPlayers, `Player ${hotseatPlayers.length + 1}`])}>
                    + Add player
                  </button>
                )}
                {hotseatPlayers.length > 2 && (
                  <button className="btn-secondary text-sm"
                    onClick={() => setHotseatPlayers(hotseatPlayers.slice(0, -1))}>
                    − Remove last
                  </button>
                )}
              </div>
            </div>
          </Section>
        )}

        {mode === 'online' && (
          <Section title="Online Setup">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                className={`p-3 rounded-lg border text-left ${onlineMode === 'host'
                  ? 'border-cipher-cyan bg-cipher-cyan/10 text-cipher-cyan'
                  : 'border-terminal-border text-terminal-text'}`}
                onClick={() => setOnlineMode('host')}>
                <div className="font-bold">Host a room</div>
                <div className="text-xs opacity-80">Create a room code, share it.</div>
              </button>
              <button
                className={`p-3 rounded-lg border text-left ${onlineMode === 'join'
                  ? 'border-cipher-cyan bg-cipher-cyan/10 text-cipher-cyan'
                  : 'border-terminal-border text-terminal-text'}`}
                onClick={() => setOnlineMode('join')}>
                <div className="font-bold">Join with code</div>
                <div className="text-xs opacity-80">Enter a room code below.</div>
              </button>
            </div>
            {onlineMode === 'join' && (
              <input
                className="w-full bg-terminal-panel border border-terminal-border rounded-lg px-3 py-2 text-cipher-cyan font-mono text-2xl tracking-widest text-center"
                placeholder="ABCD"
                maxLength={4}
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4))}
              />
            )}
            <p className="text-xs text-terminal-dim mt-2">
              Online sessions are server-authoritative. Vault codes never leave the backend.
            </p>
          </Section>
        )}

        {/* Subject pack */}
        <Section title="Subject Pack">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {packs.map(p => (
              <button
                key={p.id}
                className={`p-3 rounded-lg border text-left transition ${packId === p.id
                  ? 'border-cipher-violet bg-cipher-violet/15 text-white'
                  : 'border-terminal-border text-terminal-text hover:border-cipher-violet/60'}`}
                onClick={() => setPackId(p.id)}>
                <div className="text-2xl">{p.icon}</div>
                <div className="font-bold mt-1">{p.name}</div>
                <div className="text-xs opacity-80">{p.description}</div>
              </button>
            ))}
          </div>
        </Section>

        {/* Grade tier */}
        <Section title="Grade level">
          <div className="grid grid-cols-2 gap-2">
            <PickerButton active={gradeTier === 'tier3'} onClick={() => setGradeTier('tier3')}
              label="Grade 3 (easier)" />
            <PickerButton active={gradeTier === 'tier5'} onClick={() => setGradeTier('tier5')}
              label="Grade 5 (harder)" />
          </div>
        </Section>

        {/* Duration */}
        <Section title="Round length">
          <div className="grid grid-cols-3 gap-2">
            {window.CIPHER_CONFIG.DURATIONS.map(d => (
              <PickerButton key={d.id} active={durationSec === d.seconds}
                onClick={() => setDurationSec(d.seconds)} label={d.label} />
            ))}
          </div>
        </Section>

        <div className="flex flex-col md:flex-row gap-3 mt-6">
          <button className="btn-primary flex-1" onClick={start}>
            ▶  Start Heist
          </button>
          {onReturnToHub && (
            <button className="btn-secondary" onClick={onReturnToHub}>🏠 Hub</button>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeCard({ active, onClick, icon, label, desc }) {
  return (
    <button
      className={`p-4 rounded-xl border text-left transition ${active
        ? 'border-cipher-cyan bg-cipher-cyan/10 terminal-glow'
        : 'border-terminal-border bg-terminal-panel/40 hover:border-cipher-cyan/50'}`}
      onClick={onClick}>
      <div className="text-3xl">{icon}</div>
      <div className={`font-bold mt-1 ${active ? 'text-cipher-cyan' : 'text-terminal-text'}`}>{label}</div>
      <div className="text-xs text-terminal-dim mt-1">{desc}</div>
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="font-display text-sm tracking-widest text-cipher-violet mb-2">{title.toUpperCase()}</h3>
      {children}
    </div>
  );
}

function PickerButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-3 rounded-lg border font-bold transition ${active
        ? 'border-cipher-violet bg-cipher-violet/20 text-white'
        : 'border-terminal-border text-terminal-text hover:border-cipher-violet/60'}`}>
      {label}
    </button>
  );
}

// ============================================================
// VaultPickScreen
// ============================================================

function VaultPickScreen({ playerName, onConfirm, onCancel, hotseatHint = false }) {
  const [code, setCode] = useState([]);
  const [audio] = useState(() => window.__cipherAudio || null);

  const tap = (digit) => {
    if (code.length >= 3) return;
    if (code.includes(digit)) return; // No repeats per spec
    audio?.playSound('keypadTick');
    if (window.CipherJuice) window.CipherJuice.vibrate(15);
    setCode([...code, digit]);
  };

  const back = () => {
    if (code.length === 0) return;
    audio?.playSound('keypadTick');
    setCode(code.slice(0, -1));
  };

  const confirm = () => {
    if (code.length !== 3) return;
    audio?.playSound('codeSubmit');
    if (window.CipherJuice) window.CipherJuice.vibrate([20, 30, 20]);
    onConfirm(code);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="terminal-frame max-w-md w-full p-6 md:p-8">
        <div className="text-center mb-4">
          <div className="text-cipher-cyan font-mono text-xs tracking-widest">[ VAULT REGISTRATION ]</div>
          <h2 className="font-display text-3xl font-black text-white mt-1">Set Your Code</h2>
          <p className="text-terminal-text mt-2">
            <span className="font-bold text-cipher-gold">{playerName || 'Agent'}</span>, choose 3 digits (1–9, no repeats).
          </p>
        </div>

        <div className="mb-5">
          <VexBubble lineKey="vaultTip" compact mood="briefing" />
        </div>

        {/* Display */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2].map(i => (
            <div key={i} className={`vault-dot ${code[i] ? 'filled' : ''}`}>
              {code[i] !== undefined ? code[i] : ''}
            </div>
          ))}
        </div>

        {/* Keypad 3x3 */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
            <button
              key={d}
              className={`keypad-btn ${code.includes(d) ? 'opacity-30' : ''}`}
              onClick={() => tap(d)}
              disabled={code.includes(d) || code.length >= 3}>
              {d}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button className="btn-secondary" onClick={back} disabled={code.length === 0}>
            ⌫ Backspace
          </button>
          <button className="btn-primary" onClick={confirm} disabled={code.length !== 3}>
            ✓ Lock In
          </button>
        </div>

        {hotseatHint && (
          <p className="text-xs text-terminal-dim text-center">
            Tip: hide the screen from the next player when you're done.
          </p>
        )}

        {onCancel && (
          <button className="btn-secondary w-full mt-2 text-sm" onClick={onCancel}>
            ← Back to lobby
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// HUDScreen — main play
// ============================================================

function HUDScreen({
  state,
  selfId,
  onAnswer,
  onUseAction,
  onOpenActionPicker,
  onOpenCrack,
  onLeave,
  onEndTurn,
  hotseat,
  audio,
}) {
  const player = state.players[selfId];
  const others = state.playerOrder.filter(pid => pid !== selfId).map(pid => state.players[pid]);
  const q = state.activeQuestions[selfId];
  const remainingMs = Math.max(0, state.endsAt - state.now);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const danger = remainingMs < 30_000;
  const finalMinute = remainingMs < 60_000 && remainingMs > 30_000;

  const [lockedChoice, setLockedChoice] = useState(null);
  const [answerFlash, setAnswerFlash] = useState(null); // {idx, status}

  useEffect(() => {
    setLockedChoice(null);
    setAnswerFlash(null);
  }, [q?.startedAt]);

  const handleAnswer = (idx, e) => {
    if (lockedChoice !== null) return;
    setLockedChoice(idx);
    const correct = q && idx === q.a;
    setAnswerFlash({ idx, status: correct ? 'correct' : 'wrong' });
    onAnswer(idx, e?.currentTarget);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">

        {/* Top HUD */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Avatar src={player.avatar} name={player.name} size={36} />
            <div>
              <div className="text-terminal-text text-sm">{player.name}</div>
              <div className="bits-counter flex items-center gap-1">
                <UIIcon src="/assets/sprites/cipher-heist/bit-surge_nobg.png" fallback="⚡" size={20} alt="bits" />
                {player.bits}
                <span className="text-sm text-terminal-dim font-body ml-1">bits</span>
              </div>
            </div>
            {player.firewalls > 0 && (
              <div className="px-3 py-1 rounded-full bg-cyan-700/30 border border-cipher-cyan text-cipher-cyan text-sm flex items-center gap-1">
                <UIIcon src="/assets/sprites/cipher-heist/firewall_nobg.png" fallback="🛡️" size={18} alt="firewall" />
                × {player.firewalls}
              </div>
            )}
          </div>

          <div className={`timer-pill ${danger ? 'danger' : ''}`}>
            ⏱ {window.chFormatTime(remainingSec)}
          </div>

          <div className="flex gap-2">
            {hotseat && onEndTurn && (
              <button className="btn-secondary text-sm py-1 px-3" onClick={onEndTurn}>
                ⏭ End Turn
              </button>
            )}
            <button className="btn-secondary text-sm py-1 px-3" onClick={() => audio?.toggleMuted()}>
              {audio?.muted ? '🔇' : '🔊'}
            </button>
            <button className="btn-secondary text-sm py-1 px-3" onClick={onLeave}>← Leave</button>
          </div>
        </div>

        {finalMinute && (
          <div className="vex-bubble mb-3 text-sm">
            <strong className="text-cipher-magenta">Vex:</strong> Sixty seconds. Make every guess count.
          </div>
        )}

        {/* Layout: question | opponents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Question column */}
          <div className="lg:col-span-2 space-y-4">
            {q ? (
              <div className="question-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-mono tracking-wider text-cipher-cyan">
                    {q.type === 'bonus' ? '🔥 BONUS QUESTION' : 'STANDARD QUERY'}
                  </div>
                  <div className="text-xs text-terminal-dim font-mono">
                    {q.type === 'bonus' ? '10s' : '15s'}
                  </div>
                </div>
                <div className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
                  {q.q}
                </div>
                <div className="space-y-2">
                  {q.choices.map((c, idx) => {
                    const flashCls = answerFlash && answerFlash.idx === idx
                      ? (answerFlash.status === 'correct' ? 'correct' : 'wrong')
                      : '';
                    const lockedCls = lockedChoice !== null && lockedChoice !== idx ? 'opacity-50' : '';
                    return (
                      <button
                        key={idx}
                        className={`answer-btn ${flashCls} ${lockedCls}`}
                        disabled={lockedChoice !== null}
                        onClick={(e) => handleAnswer(idx, e)}>
                        <span className="answer-letter">{['A', 'B', 'C', 'D'][idx]}</span>
                        <span className="flex-1">{c}</span>
                      </button>
                    );
                  })}
                </div>
                <QuestionTimer startedAt={q.startedAt} maxMs={q.type === 'bonus' ? 10000 : 15000} now={state.now} />
              </div>
            ) : (
              <div className="terminal-frame p-6 text-center text-terminal-text">
                <div className="text-2xl mb-2">…</div>
                <div>Loading next query…</div>
              </div>
            )}

            {/* Action callout */}
            {player.pendingAction === 'unlocked' && (
              <button
                onClick={onOpenActionPicker}
                className="w-full p-4 rounded-xl border-2 border-cipher-gold bg-gradient-to-r from-amber-500/15 to-yellow-500/15 pulse-glow text-left flex items-center gap-3">
                <UIIcon src="/assets/sprites/cipher-heist/bit-surge_nobg.png" fallback="⚡" size={36} alt="action" />
                <div>
                  <div className="font-display text-cipher-gold font-black tracking-wider">HEIST ACTION READY</div>
                  <div className="text-terminal-text text-sm mt-1">Tap to use your unlocked move.</div>
                </div>
              </button>
            )}

            {/* Crack history (vs each opponent) */}
            <CrackHistoryPanel state={state} selfId={selfId} />
          </div>

          {/* Opponents column */}
          <div className="space-y-2">
            <h3 className="font-display text-sm tracking-widest text-cipher-magenta mb-1">RIVALS</h3>
            <div className="opponent-card you">
              <div className="flex items-center gap-2">
                <Avatar src={player.avatar} name={player.name} size={28} />
                <div>
                  <div className="font-bold text-cipher-cyan">{player.name} (you)</div>
                  <div className="text-xs text-terminal-dim">
                    Code: {player.vaultCode ? '●●●' : '— pick again —'}
                  </div>
                </div>
              </div>
              <div className="bits-counter text-base flex items-center gap-1">
                <UIIcon src="/assets/sprites/cipher-heist/bit-surge_nobg.png" fallback="⚡" size={16} alt="bits" />
                {player.bits}
              </div>
            </div>
            {others.map(o => (
              <div key={o.id} className="opponent-card">
                <div className="flex items-center gap-2">
                  <Avatar src={o.avatar} name={o.name} size={28} />
                  <div>
                    <div className="font-bold text-white">{o.name}</div>
                    <div className="text-xs text-terminal-dim flex items-center gap-1">
                      {o.firewalls > 0 ? (
                        <span className="text-cipher-cyan flex items-center gap-1">
                          <UIIcon src="/assets/sprites/cipher-heist/firewall_nobg.png" fallback="🛡️" size={14} alt="firewall" />
                          ×{o.firewalls}
                        </span>
                      ) : 'no firewall'}
                    </div>
                  </div>
                </div>
                <div className="bits-counter text-base flex items-center gap-1">
                  <UIIcon src="/assets/sprites/cipher-heist/bit-surge_nobg.png" fallback="⚡" size={16} alt="bits" />
                  {o.bits}
                </div>
              </div>
            ))}
            <div className="text-xs text-terminal-dim mt-2">
              Tip: bits, firewalls and codes are private. Successful cracks are public.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionTimer({ startedAt, maxMs, now }) {
  const elapsed = Math.max(0, now - startedAt);
  const pct = Math.max(0, Math.min(100, 100 - (elapsed / maxMs) * 100));
  const danger = pct < 30;
  return (
    <div className="mt-3 h-1.5 bg-terminal-border rounded-full overflow-hidden">
      <div
        className={`h-full transition-all ${danger ? 'bg-cipher-danger' : 'bg-cipher-cyan'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function CrackHistoryPanel({ state, selfId }) {
  const history = state.crackHistory[selfId] || {};
  const targets = Object.keys(history).filter(t => history[t] && history[t].length > 0);
  if (!targets.length) return null;
  return (
    <div className="terminal-frame p-4">
      <h4 className="font-display text-sm tracking-widest text-cipher-violet mb-2">YOUR CRACK LOG</h4>
      <div className="space-y-3">
        {targets.map(tid => {
          const target = state.players[tid];
          const rows = history[tid];
          return (
            <div key={tid}>
              <div className="text-xs text-terminal-text mb-1">vs {target?.name || tid}</div>
              {rows.map((r, idx) => (
                <div key={idx} className="crack-row mb-1">
                  {r.guess.map((d, i) => (
                    <div key={i} className={`crack-cell ${r.feedback[i]}`}>{d}</div>
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// ActionPicker — modal
// ============================================================

function ActionPicker({ state, selfId, onPick, onClose }) {
  const player = state.players[selfId];
  const opponents = state.playerOrder.filter(pid => pid !== selfId).map(pid => state.players[pid]);

  // For 'scan' action we need a target — show a sub-step.
  const [pendingScan, setPendingScan] = useState(false);

  const pick = (id, opts) => {
    onPick(id, opts);
  };

  const ACTIONS = window.CIPHER_CONFIG.ACTIONS;

  return (
    <div className="cipher-modal" onClick={onClose}>
      <div className="cipher-modal-content terminal-frame p-6" onClick={e => e.stopPropagation()}>
        {!pendingScan ? (
          <>
            <h3 className="font-display text-2xl text-cipher-cyan font-black mb-1">CHOOSE YOUR MOVE</h3>
            <p className="text-terminal-text text-sm mb-4">You unlocked one heist action.</p>

            <div className="grid grid-cols-2 gap-3">
              {Object.values(ACTIONS).map(a => {
                const isCrack = a.id === 'crack';
                const isScan = a.id === 'scan';
                const noTargets = opponents.length === 0;
                const disabled = (isCrack || isScan) && noTargets;
                return (
                  <div
                    key={a.id}
                    className={`action-card ${disabled ? 'disabled' : ''}`}
                    onClick={() => {
                      if (disabled) return;
                      if (isScan) { setPendingScan(true); return; }
                      pick(a.id, {});
                    }}>
                    <div className="action-icon mb-1 flex justify-center">
                      <UIIcon src={a.iconImage} fallback={a.icon} size={48} alt={a.label} />
                    </div>
                    <div className="font-display font-bold text-white text-sm">{a.label}</div>
                    <div className="text-xs text-terminal-dim mt-1">{a.description}</div>
                  </div>
                );
              })}
            </div>

            <button className="btn-secondary w-full mt-4 text-sm" onClick={onClose}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <h3 className="font-display text-xl text-cipher-cyan font-black mb-3">SCAN — pick a target</h3>
            <div className="space-y-2">
              {opponents.map(o => (
                <button
                  key={o.id}
                  className="opponent-card targetable w-full"
                  onClick={() => pick('scan', { targetId: o.id })}>
                  <div className="flex items-center gap-2">
                    <Avatar src={o.avatar} name={o.name} size={28} />
                    <div>
                      <div className="font-bold text-white">{o.name}</div>
                      <div className="text-xs text-terminal-dim flex items-center gap-1">
                        <UIIcon src="/assets/sprites/cipher-heist/bit-surge_nobg.png" fallback="⚡" size={14} alt="bits" />
                        {o.bits} bits
                      </div>
                    </div>
                  </div>
                  <UIIcon src="/assets/sprites/cipher-heist/scope_nobg.png" fallback="🔍" size={28} alt="scan" className="text-cipher-magenta" />
                </button>
              ))}
            </div>
            <button className="btn-secondary w-full mt-4 text-sm" onClick={() => setPendingScan(false)}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CrackScreen — pick target + enter guess
// ============================================================

function CrackScreen({ state, selfId, onGuess, onCancel }) {
  const opponents = state.playerOrder.filter(pid => pid !== selfId).map(pid => state.players[pid]);
  const [targetId, setTargetId] = useState(opponents[0]?.id || null);
  const [guess, setGuess] = useState([]);
  const C = window.CIPHER_CONFIG.CRACK;
  const audio = window.__cipherAudio;

  const tap = (d) => {
    if (guess.length >= 3 || guess.includes(d)) return;
    audio?.playSound('keypadTick');
    setGuess([...guess, d]);
  };
  const back = () => {
    if (guess.length === 0) return;
    audio?.playSound('keypadTick');
    setGuess(guess.slice(0, -1));
  };
  const submit = () => {
    if (guess.length !== 3 || !targetId) return;
    audio?.playSound('codeSubmit');
    onGuess(targetId, guess);
    setGuess([]);
  };

  const target = state.players[targetId];
  const history = (state.crackHistory[selfId] && state.crackHistory[selfId][targetId]) || [];
  const usedAttempts = (state.crackAttemptsUsed[selfId] && state.crackAttemptsUsed[selfId][targetId]) || 0;
  const remaining = C.maxAttemptsPerSession - usedAttempts;
  const knownDigit = state.events
    .filter(e => e.kind === 'action_scan' && e.actor === selfId && e.target === targetId && typeof e.digit === 'number')
    .slice(-1)[0];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(11,16,32,0.86), rgba(11,16,32,0.94)), url(${BG_IMAGES.crack})` }}>
      <div className="terminal-frame max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-black text-cipher-magenta flex items-center gap-2">
            <UIIcon src="/assets/sprites/cipher-heist/vault_nobg.png" fallback="🔓" size={32} alt="vault" />
            CRACK A VAULT
          </h2>
          <button className="btn-secondary text-sm" onClick={onCancel}>← Skip</button>
        </div>

        <Section title="Target">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {opponents.map(o => (
              <button
                key={o.id}
                className={`opponent-card targetable ${targetId === o.id ? 'border-cipher-magenta' : ''}`}
                onClick={() => { setTargetId(o.id); setGuess([]); }}>
                <div className="flex items-center gap-2">
                  <Avatar src={o.avatar} name={o.name} size={28} />
                  <div>
                    <div className="font-bold text-white">{o.name}</div>
                    <div className="text-xs text-terminal-dim flex items-center gap-1">
                      <UIIcon src="/assets/sprites/cipher-heist/bit-surge_nobg.png" fallback="⚡" size={14} alt="bits" />
                      {o.bits}
                      {o.firewalls > 0 && (
                        <span className="text-cipher-cyan ml-1 flex items-center gap-1">
                          <UIIcon src="/assets/sprites/cipher-heist/firewall_nobg.png" fallback="🛡️" size={14} alt="firewall" />
                          ×{o.firewalls}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-terminal-dim">
                  {((state.crackAttemptsUsed[selfId] || {})[o.id] || 0)}/{C.maxAttemptsPerSession}
                </div>
              </button>
            ))}
          </div>
        </Section>

        {target && (
          <>
            {history.length > 0 && (
              <Section title={`History vs ${target.name}`}>
                <div className="space-y-1.5">
                  {history.map((r, idx) => (
                    <div key={idx} className="crack-row">
                      {r.guess.map((d, i) => (
                        <div key={i} className={`crack-cell ${r.feedback[i]}`}>{d}</div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-terminal-dim mt-2">
                  <span className="px-1.5 py-0.5 rounded bg-green-900 text-green-300 mr-1">●</span>right digit, right spot
                  <span className="px-1.5 py-0.5 rounded bg-yellow-900 text-yellow-200 ml-3 mr-1">●</span>right digit, wrong spot
                  <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 ml-3 mr-1">●</span>not in code
                </div>
              </Section>
            )}

            {knownDigit && (
              <div className="vex-bubble text-sm mb-3">
                <strong className="text-cipher-magenta">Scan intel:</strong> their code contains the digit
                <span className="font-mono font-bold text-cipher-gold mx-1">{knownDigit.digit}</span>
                (location unknown).
              </div>
            )}

            <Section title={`Your guess (${remaining} attempt${remaining === 1 ? '' : 's'} left)`}>
              <div className="flex justify-center gap-3 mb-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`vault-dot ${guess[i] ? 'filled' : ''}`}>
                    {guess[i] ?? ''}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                  <button
                    key={d}
                    className="keypad-btn"
                    onClick={() => tap(d)}
                    disabled={guess.includes(d) || guess.length >= 3 || remaining <= 0}>
                    {d}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-secondary" onClick={back} disabled={guess.length === 0}>⌫ Backspace</button>
                <button className="btn-primary flex items-center justify-center gap-2" onClick={submit} disabled={guess.length !== 3 || remaining <= 0}>
                  <UIIcon src="/assets/sprites/cipher-heist/lock-unlocked_nobg.png" fallback="🔓" size={20} alt="" />
                  Crack It
                </button>
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// HotSeatHandoff
// ============================================================

function HotSeatHandoff({ nextPlayerName, onReady }) {
  return (
    <div className="hotseat-curtain">
      <div className="text-center max-w-md w-full p-6">
        <div className="text-7xl mb-4">📲</div>
        <div className="text-cipher-cyan font-mono text-xs tracking-widest mb-2">[ PASS THE TERMINAL ]</div>
        <h2 className="font-display text-3xl md:text-4xl text-white font-black mb-2">
          {nextPlayerName}'s turn
        </h2>
        <p className="text-terminal-text mb-6">
          Hand the device over. The screen stays hidden until they tap below.
        </p>
        <button className="btn-primary text-xl px-8 py-4 w-full" onClick={onReady}>
          I'm {nextPlayerName} — Ready
        </button>
      </div>
    </div>
  );
}

// ============================================================
// EndScreen — leaderboard + reward summary
// ============================================================

function EndScreen({ state, selfId, rewardsByPlayer, onPlayAgain, onReturnToHub }) {
  const sorted = state.placements || [];
  const myReward = rewardsByPlayer && rewardsByPlayer[selfId];
  const won = state.winner === selfId;

  useEffect(() => {
    if (won && window.CipherJuice) {
      window.CipherJuice.spawnConfetti();
    }
  }, [won]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(11,16,32,0.85), rgba(11,16,32,0.95)), url(${BG_IMAGES.end})` }}>
      <div className="terminal-frame max-w-2xl w-full p-6">
        <div className="text-center mb-6">
          <div className="text-cipher-cyan font-mono text-xs tracking-widest mb-1">[ HEIST COMPLETE ]</div>
          <h2 className="font-display text-4xl md:text-5xl font-black bg-gradient-to-r from-cipher-cyan via-cipher-violet to-cipher-magenta bg-clip-text text-transparent">
            {won ? 'YOU RAN THE TERMINAL' : 'TIME UP'}
          </h2>
          <div className="mt-3">
            <VexBubble lineKey={won ? 'win' : 'lose'} compact mood={won ? 'cheer' : 'sad'} />
          </div>
        </div>

        <h3 className="font-display text-sm tracking-widest text-cipher-violet mb-2">FINAL STANDINGS</h3>
        <div className="space-y-2 mb-6">
          {sorted.map((row, idx) => {
            const player = state.players[row.pid];
            const trophy = ['🥇', '🥈', '🥉'][idx] || `#${idx + 1}`;
            const klass = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : '';
            return (
              <div key={row.pid} className={`podium-row ${klass}`}>
                <div className="text-3xl w-12 text-center">{trophy}</div>
                <Avatar src={player.avatar} name={player.name} size={40} />
                <div className="flex-1">
                  <div className="font-bold text-white">{player.name}{row.pid === selfId ? ' (you)' : ''}</div>
                  <div className="text-xs text-terminal-dim flex items-center gap-2 mt-0.5">
                    <span>{player.stats.correct}✓</span>
                    <span className="flex items-center gap-1">
                      {player.stats.cracksSucceeded}
                      <UIIcon src="/assets/sprites/cipher-heist/lock-unlocked_nobg.png" fallback="🔓" size={14} alt="cracks" />
                    </span>
                    <span className="flex items-center gap-1">
                      {player.stats.defended}
                      <UIIcon src="/assets/sprites/cipher-heist/firewall_nobg.png" fallback="🛡️" size={14} alt="defended" />
                    </span>
                  </div>
                </div>
                <div className="bits-counter text-xl flex items-center gap-1">
                  <UIIcon src="/assets/sprites/cipher-heist/bit-surge_nobg.png" fallback="⚡" size={20} alt="bits" />
                  {row.bits}
                </div>
              </div>
            );
          })}
        </div>

        {myReward && (
          <div className="terminal-frame p-4 mb-6">
            <h4 className="font-display text-sm tracking-widest text-cipher-gold mb-2">YOUR REWARDS</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-3xl">⭐</div>
                <div className="text-2xl font-bold text-cipher-gold">+{myReward.xp}</div>
                <div className="text-xs text-terminal-dim">XP</div>
              </div>
              <div>
                <div className="text-3xl">🪙</div>
                <div className="text-2xl font-bold text-cipher-gold">+{myReward.coins}</div>
                <div className="text-xs text-terminal-dim">coins</div>
              </div>
              <div>
                <div className="text-3xl">🎁</div>
                <div className="text-2xl font-bold text-cipher-magenta">+{myReward.rewardPoints}</div>
                <div className="text-xs text-terminal-dim">reward pts</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-2">
          <button className="btn-primary flex-1" onClick={onPlayAgain}>▶ Play Again</button>
          {onReturnToHub && (
            <button className="btn-secondary" onClick={onReturnToHub}>🏠 Hub</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Online lobby (waiting for players)
// ============================================================

function OnlineLobby({ roomCode, players, isHost, onStart, onLeave, status }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="terminal-frame max-w-md w-full p-6">
        <div className="text-cipher-cyan font-mono text-xs tracking-widest mb-1">[ ROOM ACTIVE ]</div>
        <h2 className="font-display text-2xl text-white font-black mb-1">Online Heist</h2>
        <p className="text-terminal-text text-sm mb-4">
          Share this code with players. They join from the lobby.
        </p>
        <div className="text-center mb-5">
          <div className="font-mono text-5xl font-black tracking-widest text-cipher-cyan py-3">
            {roomCode}
          </div>
        </div>

        <h3 className="font-display text-sm tracking-widest text-cipher-violet mb-2">PLAYERS</h3>
        <div className="space-y-1.5 mb-4">
          {players.length === 0 && <div className="text-terminal-dim">Waiting for players…</div>}
          {players.map(p => (
            <div key={p.id} className="opponent-card">
              <div className="flex items-center gap-2">
                <Avatar src={p.avatar} name={p.name} size={28} />
                <div className="font-bold text-white">{p.name}</div>
              </div>
              <div className={`text-xs font-mono ${p.vaultLocked ? 'text-cipher-success' : 'text-terminal-dim'}`}>
                {p.vaultLocked ? '✓ READY' : '…'}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-terminal-dim mb-3">
          {status || ''}
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          {isHost && (
            <button className="btn-primary flex-1"
              onClick={onStart}
              disabled={players.length < 2 || !players.every(p => p.vaultLocked)}>
              Start Round
            </button>
          )}
          <button className="btn-secondary" onClick={onLeave}>Leave</button>
        </div>
      </div>
    </div>
  );
}

// Export all screens to global scope
if (typeof window !== 'undefined') {
  window.CipherScreens = {
    LobbyScreen,
    VaultPickScreen,
    HUDScreen,
    ActionPicker,
    CrackScreen,
    HotSeatHandoff,
    EndScreen,
    OnlineLobby,
    VexBubble,
  };
}
