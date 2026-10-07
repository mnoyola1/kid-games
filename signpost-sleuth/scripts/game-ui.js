// ==================== SHARED UI ====================
const CONTENT = window.PS_CONTENT;
const STORIES = window.PS_STORIES;
const SIGNPOSTS = CONTENT.signposts;
const SP_BY_ID = Object.fromEntries(SIGNPOSTS.map(sp => [sp.id, sp]));
const SKILLS = buildSkillList(SIGNPOSTS);

const cx = (...c) => c.filter(Boolean).join(' ');

function daysUntilQuiz() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((QUIZ_DATE - today) / 864e5);
}

function quizCountdownLabel() {
  const d = daysUntilQuiz();
  if (d > 1) return `Quiz in ${d} days`;
  if (d === 1) return 'Quiz tomorrow!';
  if (d === 0) return 'Quiz day!';
  return 'Keep your skills sharp';
}

// ---------- juice (DOM-based, works over any screen) ----------
const Juice = {
  floatText(x, y, text, color = '#fde047') {
    const el = document.createElement('div');
    el.className = 'ps-floattext';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  },
  confetti(x, y, { count = 26, colors = ['#fde047', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#f43f5e'], spread = 260 } = {}) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'ps-confetti';
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
      const dist = spread * (0.4 + Math.random() * 0.6);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.background = colors[i % colors.length];
      el.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      el.style.setProperty('--dy', `${Math.sin(angle) * dist + 160}px`);
      el.style.setProperty('--rot', `${(Math.random() - 0.5) * 720}deg`);
      el.style.setProperty('--life', `${0.8 + Math.random() * 0.6}s`);
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1500);
    }
  },
  fromEvent(e) {
    const r = e && e.currentTarget && e.currentTarget.getBoundingClientRect ? e.currentTarget.getBoundingClientRect() : null;
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 3 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  },
  shake(el) {
    if (!el) return;
    el.classList.remove('ps-shake');
    void el.offsetWidth;
    el.classList.add('ps-shake');
  },
};

// ---------- basic pieces ----------
const BUTTON_COLORS = {
  amber: 'bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 border-amber-700',
  green: 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white border-emerald-800',
  sky: 'bg-gradient-to-b from-sky-400 to-sky-600 text-white border-sky-800',
  violet: 'bg-gradient-to-b from-violet-400 to-violet-600 text-white border-violet-800',
  rose: 'bg-gradient-to-b from-rose-400 to-rose-600 text-white border-rose-800',
  paper: 'bg-gradient-to-b from-stone-50 to-stone-200 text-stone-800 border-stone-400',
  dark: 'bg-gradient-to-b from-stone-600 to-stone-800 text-white border-stone-900',
};

function BigButton({ children, onClick, color = 'amber', className = '', disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cx('ps-btn font-title font-semibold rounded-2xl border-b-4 shadow-lg disabled:opacity-40',
        small ? 'px-4 py-2 text-base' : 'px-6 py-3 text-lg', BUTTON_COLORS[color], className)}>
      {children}
    </button>
  );
}

function SpeakButton({ audio, voiceKey, text, className = '', label }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); audio.say(voiceKey, text, { force: true }); }}
      className={cx('ps-btn rounded-full bg-white/90 hover:bg-white text-stone-700 shadow px-3 py-1.5 text-sm font-semibold inline-flex items-center gap-1', className)}
      aria-label="Read aloud">
      <span>🔊</span>{label && <span>{label}</span>}
    </button>
  );
}

function Backdrop({ bg, dim = 0.45 }) {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-b from-amber-900 via-stone-800 to-stone-900">
      {bg && <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
      <div className="absolute inset-0" style={{ background: `rgba(30, 20, 10, ${dim})` }} />
    </div>
  );
}

function SageImg({ cheer = false, className = '' }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <div className={cx('text-6xl select-none', className)}>🦉</div>;
  return <img src={cheer ? SPRITE_PATHS.sageCheer : SPRITE_PATHS.sage} alt="Sage the owl" draggable="false"
    className={cx('select-none object-contain', className)} onError={() => setBroken(true)} />;
}

function SageSays({ text, voiceKey, audio, speak = true, cheer = false, small = false }) {
  useEffect(() => { if (speak && audio) audio.say(voiceKey, text); }, [voiceKey, text]);
  return (
    <div className="flex items-end gap-3 ps-rise">
      <SageImg cheer={cheer} className={small ? 'w-16 h-16' : 'w-24 h-24 ps-float'} />
      <div className={cx('relative bg-white rounded-2xl shadow-lg text-stone-800 font-semibold', small ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base')}>
        <div className="absolute -left-2 bottom-4 w-4 h-4 bg-white rotate-45" />
        <span className="relative">{text}</span>
        {audio && <SpeakButton audio={audio} voiceKey={voiceKey} text={text} className="ml-2 align-middle !px-2 !py-0.5" />}
      </div>
    </div>
  );
}

function ReadyMeter({ pct, label = 'Quiz Ready', dark = false }) {
  const color = pct >= 80 ? 'from-emerald-400 to-emerald-500' : pct >= 50 ? 'from-amber-300 to-amber-500' : 'from-rose-400 to-orange-400';
  return (
    <div className="w-full">
      <div className={cx('flex justify-between text-sm font-bold mb-1', dark ? 'text-stone-700' : 'text-amber-50')}>
        <span>📝 {label}</span><span>{pct}%</span>
      </div>
      <div className={cx('h-4 rounded-full overflow-hidden', dark ? 'bg-stone-200' : 'bg-black/30')}>
        <div className={cx('h-full rounded-full bg-gradient-to-r transition-all duration-700', color)} style={{ width: `${Math.max(3, pct)}%` }} />
      </div>
    </div>
  );
}

function Stars({ n, size = 'text-4xl' }) {
  return (
    <div className={cx('flex gap-1 justify-center', size)}>
      {[0, 1, 2].map(i => (
        <span key={i} className={i < n ? 'ps-star' : 'opacity-25 grayscale'} style={{ animationDelay: `${0.15 + i * 0.2}s` }}>⭐</span>
      ))}
    </div>
  );
}

function TopBar({ title, onBack, audio, right }) {
  const [, force] = useState(0);
  return (
    <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
      {onBack && <button onClick={() => { audio && audio.stopVoice(); onBack(); }} className="ps-btn rounded-xl bg-black/35 hover:bg-black/50 text-white px-3 py-2 font-title">← Back</button>}
      <div className="flex-1 text-center font-title text-xl sm:text-2xl text-amber-50 ps-title-shadow truncate">{title}</div>
      {right}
      {audio && (
        <>
          <button onClick={() => { audio.toggleVoice(); force(x => x + 1); }} title="Auto read-aloud"
            className="ps-btn rounded-xl bg-black/35 hover:bg-black/50 text-white w-10 h-10">{audio.voiceEnabled ? '🗣️' : '🤐'}</button>
          <button onClick={() => { audio.toggleMusic(); force(x => x + 1); }} title="Music"
            className="ps-btn rounded-xl bg-black/35 hover:bg-black/50 text-white w-10 h-10">{audio.musicEnabled ? '🎵' : '🔇'}</button>
        </>
      )}
    </div>
  );
}

// Six signpost buttons. disabledIds = already-tried wrong answers.
function SignPicker({ onPick, disabledIds = [], correctId = null, compact = false }) {
  return (
    <div className={cx('grid gap-2', compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3')}>
      {SIGNPOSTS.map(sp => {
        const off = disabledIds.includes(sp.id);
        const right = correctId === sp.id;
        return (
          <button key={sp.id} disabled={off || (correctId && !right)} onClick={(e) => onPick(sp.id, e)}
            className={cx('ps-btn flex items-center gap-2 rounded-2xl border-2 bg-white/95 px-2 py-2 text-left shadow disabled:opacity-35',
              right ? 'border-emerald-500 ring-4 ring-emerald-300' : 'border-stone-200 hover:border-amber-400')}>
            <SignpostSign id={sp.id} size={compact ? 38 : 44} />
            <span className={cx('font-title font-semibold text-stone-800 leading-tight', compact ? 'text-sm' : 'text-base')}>{sp.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// Generic multiple-choice card with a hint after the first miss.
// onResult(correctFirstTry) fires once the right answer is chosen.
function MCQuestion({ prompt, choices, answer, hint, audio, onResult, header }) {
  const [tried, setTried] = useState([]);
  const [done, setDone] = useState(false);
  const order = useMemo(() => shuffle(choices), [prompt]);
  const cardRef = useRef(null);

  const pick = (c, e) => {
    if (done || tried.includes(c)) return;
    if (c === answer) {
      setDone(true);
      audio && audio.sfx('correct');
      const p = Juice.fromEvent(e);
      Juice.confetti(p.x, p.y, { count: 14, spread: 160 });
      setTimeout(() => onResult(tried.length === 0), 650);
    } else {
      setTried(t => [...t, c]);
      audio && audio.sfx('wrong');
      Juice.shake(cardRef.current);
    }
  };

  return (
    <div ref={cardRef} className="bg-white/95 rounded-3xl shadow-xl p-4 sm:p-5 ps-pop">
      {header}
      <div className="font-title text-lg sm:text-xl text-stone-800 mb-3">{prompt}</div>
      <div className="grid gap-2">
        {order.map(c => (
          <button key={c} onClick={(e) => pick(c, e)} disabled={tried.includes(c)}
            className={cx('ps-btn text-left rounded-2xl border-2 px-4 py-3 font-semibold',
              done && c === answer ? 'bg-emerald-100 border-emerald-500 text-emerald-900' :
                tried.includes(c) ? 'bg-rose-50 border-rose-200 text-rose-400 line-through' :
                  'bg-stone-50 border-stone-200 hover:border-amber-400 text-stone-800')}>
            {c}
          </button>
        ))}
      </div>
      {tried.length > 0 && !done && hint && (
        <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-amber-900 text-sm font-semibold ps-drop">💡 {hint}</div>
      )}
    </div>
  );
}
