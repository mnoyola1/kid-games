// ==================== UI COMPONENTS ====================
const CONTENT = window.HRR_CONTENT;
const ITEM_BY_ID = Object.fromEntries(CONTENT.items.map(it => [it.id, it]));
const CRITICAL_BY_ITEM = Object.fromEntries(CONTENT.practice.critical.map(c => [c.item, c]));

const cx = (...c) => c.filter(Boolean).join(' ');

const afterBlank = (after) => (/^[.,!?]/.test(after) ? after : ` ${after}`);

function daysUntilTest() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((TEST_DATE - start) / 86400000);
}

function BigButton({ children, onClick, color = 'sky', className = '', disabled }) {
  const colors = {
    sky: 'from-sky-400 to-blue-600 shadow-blue-900/40',
    gold: 'from-amber-300 to-orange-500 shadow-orange-900/40 text-slate-900',
    green: 'from-emerald-400 to-green-600 shadow-green-900/40',
    slate: 'from-slate-500 to-slate-700 shadow-black/30',
    pink: 'from-pink-400 to-rose-600 shadow-rose-900/40',
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cx('hrr-btn bg-gradient-to-b text-white font-title font-semibold rounded-2xl px-6 py-3 text-xl shadow-lg', colors[color], disabled && 'opacity-40', className)}
    >
      {children}
    </button>
  );
}

function SpeakButton({ audio, voiceKey, text, className = '' }) {
  return (
    <button
      aria-label="Read it to me"
      onClick={(e) => { e.stopPropagation(); audio.say(voiceKey, text); }}
      className={cx('hrr-btn shrink-0 w-11 h-11 rounded-full bg-white/90 text-sky-700 text-xl shadow', className)}
    >
      🔊
    </button>
  );
}

function Backdrop({ bg, dim = 0.45, blur = false }) {
  return (
    <div className="fixed inset-0 -z-10 bg-sky-900">
      {bg && <img src={bg} alt="" className={cx('w-full h-full object-cover', blur && 'blur-sm scale-105')} />}
      <div className="absolute inset-0" style={{ background: `rgba(8, 47, 73, ${dim})` }} />
    </div>
  );
}

function OtisSays({ text, voiceKey, audio, speak = true, small = false }) {
  useEffect(() => {
    if (speak && text) audio.say(voiceKey, text);
  }, [text]);
  return (
    <div className="flex items-end gap-3">
      <img src={SPRITE_PATHS.otis} alt="Otis the otter" className={cx('hrr-float drop-shadow-xl shrink-0', small ? 'w-16' : 'w-28')} />
      <div className="hrr-pop relative bg-white text-slate-800 rounded-2xl rounded-bl-none px-4 py-3 font-game font-bold text-lg shadow-xl max-w-md">
        {text}
      </div>
    </div>
  );
}

function ReadyMeter({ pct, label = 'Test Ready' }) {
  const color = pct >= 80 ? 'from-emerald-400 to-green-500' : pct >= 50 ? 'from-amber-300 to-yellow-500' : 'from-orange-400 to-rose-500';
  return (
    <div className="w-full">
      <div className="flex justify-between text-white font-title text-lg mb-1">
        <span>📊 {label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-5 rounded-full bg-black/30 overflow-hidden border-2 border-white/40">
        <div className={cx('h-full bg-gradient-to-r transition-all duration-700', color)} style={{ width: `${Math.max(3, pct)}%` }} />
      </div>
    </div>
  );
}

function MiniMap({ current, cleared = [], bossBeaten, onPick, unlocked = () => true, size = 'md' }) {
  const legs = CONTENT.legs;
  return (
    <svg viewBox="-4 -4 108 104" className={cx('w-full', size === 'sm' ? 'max-w-[220px]' : 'max-w-[560px]')}>
      <polygon points={NY_OUTLINE} fill="#bbf7d0" stroke="#166534" strokeWidth="1.2" strokeLinejoin="round" />
      <polyline points={ROUTE_PATH} fill="none" stroke="#0284c7" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={ROUTE_PATH} fill="none" stroke="#e0f2fe" strokeWidth="0.8" strokeDasharray="2 2" />
      <text x="16" y="36" fontSize="3.6" fill="#0369a1" fontFamily="Fredoka" transform="rotate(-12 16 36)">Lake Ontario</text>
      <text x="0" y="74" fontSize="3.4" fill="#0369a1" fontFamily="Fredoka">Lake Erie</text>
      {legs.map((leg, i) => {
        const p = ROUTE_POINTS[leg.id];
        const done = cleared.includes(leg.id);
        const open = unlocked(i);
        const isCur = current === leg.id;
        return (
          <g key={leg.id} onClick={() => open && onPick && onPick(i)} style={{ cursor: open && onPick ? 'pointer' : 'default' }}>
            {isCur && <circle cx={p.x} cy={p.y} r="7" fill="#fde047" opacity="0.6" className="hrr-pulse-svg" />}
            <circle cx={p.x} cy={p.y} r="4.6" fill={done ? '#16a34a' : open ? '#f59e0b' : '#94a3b8'} stroke="#fff" strokeWidth="1.2" />
            <text x={p.x} y={p.y + 1.5} fontSize="4" textAnchor="middle" fill="#fff" fontFamily="Fredoka" fontWeight="700">{done ? '✓' : i + 1}</text>
            {size !== 'sm' && (
              <text x={p.lx} y={p.ly} fontSize="4" textAnchor={p.anchor} fill="#0f172a" fontFamily="Fredoka" fontWeight="600">{p.label}</text>
            )}
          </g>
        );
      })}
      {bossBeaten && <text x="9" y="44" fontSize="6" textAnchor="middle">🏆</text>}
    </svg>
  );
}

// ==================== TITLE ====================
function TitleScreen({ readiness, playerName, onRun, onPractice, onReady }) {
  const days = daysUntilTest();
  const dayText = days > 1 ? `Test in ${days} days` : days === 1 ? 'Test is TOMORROW!' : days === 0 ? 'Test day! You got this!' : 'Keep reviewing!';
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <Backdrop bg={BG_PATHS.title} dim={0.25} />
      <div className="text-center hrr-pop">
        <div className="font-title text-white text-6xl md:text-7xl font-bold hrr-title-shadow leading-none">Hudson River Rush</div>
        <div className="font-title text-amber-200 text-2xl mt-2 hrr-title-shadow">New York Social Studies · Chapter 1</div>
      </div>
      <div className="bg-slate-900/60 backdrop-blur rounded-3xl p-5 w-full max-w-md flex flex-col gap-4 shadow-2xl border border-white/20">
        {playerName && <div className="text-white/90 font-game font-bold text-center">Captain {playerName}</div>}
        <div className="text-center font-title text-xl text-amber-300">📅 {dayText}</div>
        <ReadyMeter pct={readiness} />
        <BigButton color="gold" onClick={onRun} className="text-2xl py-4">⛵ Set Sail</BigButton>
        <div className="grid grid-cols-2 gap-3">
          <BigButton color="sky" onClick={onPractice} className="text-lg">📝 Practice Test</BigButton>
          <BigButton color="green" onClick={onReady} className="text-lg">📊 Test Ready</BigButton>
        </div>
      </div>
      <div className="text-white/80 font-game text-sm text-center max-w-md">Tap a lane, swipe, or use ← → to steer through the right answer.</div>
    </div>
  );
}

// ==================== ROUTE MAP ====================
function MapScreen({ mastery, onPickLeg, onBoss, onBack }) {
  const cleared = mastery.data.legsCleared || [];
  const unlocked = i => i === 0 || cleared.includes(CONTENT.legs[i - 1].id);
  const nextIdx = CONTENT.legs.findIndex((l, i) => unlocked(i) && !cleared.includes(l.id));
  return (
    <div className="min-h-screen flex flex-col items-center gap-4 p-4">
      <Backdrop bg={BG_PATHS.title} dim={0.55} blur />
      <div className="w-full max-w-4xl flex items-center justify-between">
        <BigButton color="slate" onClick={onBack} className="text-base px-4 py-2">← Back</BigButton>
        <div className="font-title text-white text-3xl hrr-title-shadow">Your Route Across New York</div>
        <div className="w-20" />
      </div>
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-4 items-center">
        <div className="bg-sky-200/90 rounded-3xl p-3 shadow-2xl">
          <MiniMap current={nextIdx >= 0 ? CONTENT.legs[nextIdx].id : null} cleared={cleared} bossBeaten={mastery.data.bossBeaten} unlocked={unlocked} onPick={onPickLeg} />
        </div>
        <div className="flex flex-col gap-2">
          {CONTENT.legs.map((leg, i) => {
            const open = unlocked(i);
            const done = cleared.includes(leg.id);
            return (
              <button
                key={leg.id}
                disabled={!open}
                onClick={() => onPickLeg(i)}
                className={cx('hrr-btn text-left rounded-2xl p-3 flex items-center gap-3 shadow-lg border-2', open ? 'bg-white/95 border-white' : 'bg-white/30 border-transparent', i === nextIdx && 'hrr-glow')}
              >
                <div className={cx('w-11 h-11 rounded-full flex items-center justify-center font-title text-xl text-white shrink-0', done ? 'bg-green-600' : open ? 'bg-amber-500' : 'bg-slate-400')}>{done ? '✓' : open ? i + 1 : '🔒'}</div>
                <div className="flex-1">
                  <div className="font-title text-lg text-slate-900 leading-tight">{leg.name}</div>
                  <div className="font-game text-sm text-slate-600">{leg.region}</div>
                </div>
              </button>
            );
          })}
          <button
            disabled={!cleared.includes('niagara')}
            onClick={onBoss}
            className={cx('hrr-btn text-left rounded-2xl p-3 flex items-center gap-3 shadow-lg border-2', cleared.includes('niagara') ? 'bg-gradient-to-r from-amber-200 to-yellow-100 border-amber-400' : 'bg-white/30 border-transparent')}
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-2xl bg-amber-500 shrink-0">{mastery.data.bossBeaten ? '🏆' : cleared.includes('niagara') ? '⚡' : '🔒'}</div>
            <div className="flex-1">
              <div className="font-title text-lg text-slate-900 leading-tight">Niagara Falls Showdown</div>
              <div className="font-game text-sm text-slate-600">Boss: review everything!</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== LEG INTRO ====================
function LegIntro({ leg, index, audio, onGo, onBack, boss }) {
  const bg = boss ? BG_PATHS.niagara : BG_PATHS[leg.id];
  const text = boss ? CONTENT.narration.boss : leg.intro;
  const key = boss ? 'n_boss' : `n_leg_${leg.id}`;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <Backdrop bg={bg} dim={0.3} />
      <div className="text-center hrr-pop">
        <div className="font-title text-amber-200 text-xl hrr-title-shadow">{boss ? 'Boss Stretch' : `Stretch ${index + 1} of ${CONTENT.legs.length}`}</div>
        <div className="font-title text-white text-5xl hrr-title-shadow">{boss ? 'Niagara Falls Showdown' : leg.name}</div>
        {!boss && <div className="font-game font-bold text-sky-100 text-xl hrr-title-shadow">Region: {leg.region}</div>}
      </div>
      <OtisSays text={text} voiceKey={key} audio={audio} />
      <div className="bg-slate-900/60 rounded-2xl px-5 py-3 text-white font-game font-bold text-center max-w-md">
        {boss ? 'Answer 6 questions to power up the falls. Mistakes cost a heart!' : `Steer through ${leg.goal} right answers to reach the dock.`}
      </div>
      <div className="flex gap-3">
        <BigButton color="slate" onClick={onBack}>Map</BigButton>
        <BigButton color="gold" onClick={onGo} className="text-2xl px-10">Go! 🚤</BigButton>
      </div>
    </div>
  );
}

// ==================== RIVER (canvas + HUD) ====================
function RiverScreen({ themeId, questions, goal, boss, audio, mastery, onEnd, onQuit, title }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const [stats, setStats] = useState({ hull: RIVER_TUNING.maxHull, coins: 0, correct: 0, combo: 0, goal });
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [paused, setPaused] = useState(false);
  const hurtRef = useRef(null);

  useEffect(() => {
    const eng = new RiverRun(canvasRef.current, {
      themeId, goal, boss, questions, audio, mastery,
      on: {
        stats: s => setStats(s),
        hit: () => {
          const el = hurtRef.current;
          if (!el) return;
          el.classList.remove('hrr-hurt');
          void el.offsetWidth;
          el.classList.add('hrr-hurt');
        },
        question: (q) => {
          setQuestion(q);
          setFeedback(null);
          audio.say(`q_${q.id}`, q.q.replace('____', 'blank'));
        },
        answer: ({ q, correct }) => {
          const factText = q.fact || ITEM_BY_ID[q.item].fact;
          const factKey = q.fact ? `fact_${q.id}` : `fact_${q.item}`;
          setQuestion(null);
          setFeedback({ correct, answer: q.a, fact: factText, id: Date.now() });
          setTimeout(() => audio.say(factKey, factText), correct ? 450 : 600);
        },
        end: result => setTimeout(() => onEndRef.current(result), 1100),
      },
    });
    engineRef.current = eng;
    eng.fit(wrapRef.current);
    eng.start();
    const onResize = () => eng.fit(wrapRef.current);
    window.addEventListener('resize', onResize);
    return () => {
      eng.destroy();
      window.removeEventListener('resize', onResize);
      audio.stopVoice();
    };
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(f => (f && f.id === feedback.id ? null : f)), feedback.correct ? 3200 : 4600);
    return () => clearTimeout(t);
  }, [feedback]);

  const togglePause = () => {
    const p = !paused;
    setPaused(p);
    engineRef.current && engineRef.current.setPaused(p);
  };

  const hearts = Array.from({ length: RIVER_TUNING.maxHull }, (_, i) => i < stats.hull);

  return (
    <div className="fixed inset-0 flex items-stretch justify-center overflow-hidden select-none">
      <Backdrop bg={boss ? BG_PATHS.niagara : BG_PATHS[themeId]} dim={0.5} />
      <aside className="hidden xl:flex flex-col items-center justify-center gap-4 w-60 shrink-0 p-4">
        <div className="bg-sky-200/90 rounded-2xl p-2 w-full shadow-xl">
          <MiniMap current={themeId} cleared={mastery.data.legsCleared} size="sm" />
        </div>
        <div className="font-title text-white text-2xl text-center hrr-title-shadow">{title}</div>
      </aside>
      <div ref={wrapRef} className="relative flex-1 min-w-0 max-w-[620px] flex items-center justify-center">
        <div ref={hurtRef} className="relative">
          <canvas ref={canvasRef} className="block rounded-2xl shadow-2xl touch-none" />

          <div className="absolute top-0 inset-x-0 p-2 flex flex-col gap-2 pointer-events-none">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1 bg-slate-900/60 rounded-full px-3 py-1">
                {hearts.map((on, i) => <span key={i} className={cx('text-2xl transition-all', on ? '' : 'grayscale opacity-30 scale-75')}>❤️</span>)}
              </div>
              <div className="flex-1 bg-slate-900/60 rounded-full h-7 overflow-hidden relative border border-white/30">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500" style={{ width: `${Math.min(100, (stats.correct / goal) * 100)}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-white font-title text-sm">{boss ? '⚡ Power' : '⚓ Dock'} {Math.min(stats.correct, goal)}/{goal}</div>
              </div>
              <div className="bg-slate-900/60 rounded-full px-3 py-1 text-amber-300 font-title text-xl">🪙 {stats.coins}</div>
              <button onClick={togglePause} className="pointer-events-auto hrr-btn w-10 h-10 rounded-full bg-slate-900/60 text-white text-xl">⏸</button>
            </div>
            {stats.combo > 1 && <div key={stats.combo} className="self-center hrr-pop font-title text-amber-300 text-2xl hrr-title-shadow">🔥 Combo x{stats.combo}</div>}
            {question && (
              <div key={question.id} className="hrr-drop pointer-events-auto bg-white/95 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 border-4 border-sky-600">
                <div className="flex-1 font-game font-bold text-slate-900 text-xl leading-snug">{question.q}</div>
                <SpeakButton audio={audio} voiceKey={`q_${question.id}`} text={question.q.replace('____', 'blank')} />
              </div>
            )}
            {feedback && (
              <div key={feedback.id} className={cx('hrr-pop rounded-2xl px-4 py-3 shadow-xl border-4 font-game font-bold text-lg leading-snug', feedback.correct ? 'bg-green-50 border-green-500 text-green-900' : 'bg-rose-50 border-rose-500 text-rose-900')}>
                {feedback.correct ? '✅ ' : <span>❌ The answer is <span className="underline">{feedback.answer}</span>. </span>}
                {feedback.fact}
              </div>
            )}
          </div>

          {paused && (
            <div className="absolute inset-0 bg-slate-900/70 rounded-2xl flex flex-col items-center justify-center gap-4">
              <div className="font-title text-white text-4xl">Paused</div>
              <BigButton color="green" onClick={togglePause}>▶ Keep Going</BigButton>
              <BigButton color="slate" onClick={() => audio.toggleMusic()}>🎵 Music On/Off</BigButton>
              <BigButton color="pink" onClick={onQuit}>Quit to Map</BigButton>
            </div>
          )}
        </div>
      </div>
      <aside className="hidden xl:block w-60 shrink-0" />
    </div>
  );
}

// ==================== DOCK CHALLENGES ====================
function highlightModel(text, item) {
  const crit = CRITICAL_BY_ITEM[item];
  if (!crit) return text;
  const terms = ['Western Hemisphere', 'North America', 'United States', 'Northeast', 'renewable', 'lumber', 'plant young trees', 'replace', 'day to day', 'pattern of weather', 'many years', 'Trees', 'Farmland', 'Water', 'maple syrup', 'hiking', 'houses and furniture', 'milk', 'electricity', 'trade'];
  const re = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i} className="bg-amber-200 rounded px-0.5">{part}</mark> : part));
}

function ModelAnswer({ dockKey, dock, audio, mastery, onDone }) {
  const [listening, setListening] = useState(false);
  const [spoken, setSpoken] = useState('');
  const [result, setResult] = useState(null);
  const stopRef = useRef(null);
  const crit = CRITICAL_BY_ITEM[dock.item];

  useEffect(() => {
    const t = setTimeout(() => audio.say(`model_${dockKey}`, dock.model), 400);
    return () => { clearTimeout(t); stopRef.current && stopRef.current(); };
  }, []);

  const toggleListen = () => {
    if (listening) { stopRef.current && stopRef.current(); return; }
    audio.stopVoice();
    setSpoken('');
    setResult(null);
    setListening(true);
    stopRef.current = SpeechInput.start(
      (final, interim) => setSpoken(`${final} ${interim}`.trim()),
      (final) => {
        setListening(false);
        if (final && crit) {
          const r = checkCritical(final, crit.checks);
          setResult(r);
          if (r.every(x => x.ok)) {
            mastery.record(dock.item, true);
            audio.sfx('correct');
          }
        }
      }
    );
  };

  return (
    <div className="hrr-pop w-full max-w-2xl bg-white/95 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="font-title text-2xl text-sky-800 flex-1">📝 On the test, you could write:</div>
        <SpeakButton audio={audio} voiceKey={`model_${dockKey}`} text={dock.model} />
      </div>
      <div className="font-game font-bold text-lg text-slate-800 leading-relaxed bg-sky-50 rounded-2xl p-4 border-2 border-sky-200">
        {highlightModel(dock.model, dock.item)}
      </div>
      {SpeechInput.supported() && crit && (
        <div className="flex flex-col gap-2">
          <BigButton color={listening ? 'pink' : 'sky'} onClick={toggleListen} className="text-lg">
            {listening ? '⏹ Done talking' : '🎤 Say it in your own words'}
          </BigButton>
          {spoken && <div className="font-game text-slate-700 italic bg-slate-100 rounded-xl p-3">“{spoken}”</div>}
          {result && (
            <div className="grid gap-1">
              {result.map(r => (
                <div key={r.label} className={cx('font-game font-bold rounded-lg px-3 py-1', r.ok ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900')}>
                  {r.ok ? '✅' : '➕ Add:'} {r.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <BigButton color="green" onClick={onDone} className="text-2xl">Continue ➜</BigButton>
    </div>
  );
}

function DockSlots({ dock, audio, onComplete }) {
  const [filled, setFilled] = useState(dock.slots.map(() => null));
  const [tiles] = useState(() => shuffle(dock.tiles));
  const [shakeTile, setShakeTile] = useState(null);
  const mistakes = useRef(0);
  const next = filled.findIndex(f => f === null);

  const pick = (tile) => {
    if (next < 0) return;
    if (tile === dock.slots[next].answer) {
      const nf = filled.slice();
      nf[next] = tile;
      setFilled(nf);
      audio.sfx('correct', { rate: 1 + next * 0.08 });
      if (nf.every(Boolean)) setTimeout(() => onComplete(mistakes.current), 600);
    } else {
      mistakes.current += 1;
      setShakeTile(tile + Date.now());
      audio.sfx('wrong');
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {dock.slots.map((s, i) => (
          <div key={s.label} className={cx('rounded-2xl p-3 text-center border-4 min-h-[92px] flex flex-col justify-center', filled[i] ? 'bg-green-100 border-green-500 hrr-pop' : i === next ? 'bg-white border-amber-400 hrr-glow' : 'bg-white/70 border-white/60')}>
            <div className="font-title text-sm text-slate-500 uppercase">{s.label}</div>
            <div className="font-title text-lg text-slate-900">{filled[i] || '?'}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map(t => {
          const used = filled.includes(t);
          return (
            <button
              key={t}
              disabled={used}
              onClick={() => pick(t)}
              className={cx('hrr-btn rounded-2xl py-3 px-2 font-title text-lg shadow border-2', used ? 'bg-white/30 text-white/40 border-transparent' : 'bg-white text-sky-900 border-sky-300', shakeTile && shakeTile.startsWith(t) && 'hrr-shake')}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DockSort({ dock, audio, onComplete }) {
  const [queue, setQueue] = useState(() => shuffle(dock.cards));
  const [placed, setPlaced] = useState(() => Object.fromEntries(dock.bins.map(b => [b, []])));
  const [wrongBin, setWrongBin] = useState(null);
  const [hint, setHint] = useState(null);
  const mistakes = useRef(0);
  const card = queue[0];

  const drop = (bin) => {
    if (!card) return;
    if (bin === card.bin) {
      audio.sfx('correct', { rate: 1 + Object.values(placed).flat().length * 0.04 });
      setPlaced(p => ({ ...p, [bin]: [...p[bin], card.text] }));
      const rest = queue.slice(1);
      setQueue(rest);
      setHint(null);
      if (!rest.length) setTimeout(() => onComplete(mistakes.current), 600);
    } else {
      mistakes.current += 1;
      audio.sfx('wrong');
      setWrongBin(bin + Date.now());
      setHint(`Not ${bin}. Try again!`);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl items-center">
      <div className="text-white font-title text-lg">{queue.length} left</div>
      {card && (
        <div key={card.text} className="hrr-drop bg-white rounded-2xl px-6 py-5 shadow-2xl border-4 border-amber-400 font-game font-bold text-2xl text-slate-900 text-center min-h-[96px] flex items-center justify-center w-full">
          {card.text}
        </div>
      )}
      {hint && <div className="text-rose-100 font-game font-bold">{hint}</div>}
      <div className={cx('grid gap-3 w-full', dock.bins.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
        {dock.bins.map(bin => (
          <button
            key={bin}
            onClick={() => drop(bin)}
            className={cx('hrr-btn rounded-2xl p-3 bg-gradient-to-b from-amber-700 to-amber-900 border-4 border-amber-500 text-white shadow-xl min-h-[150px] flex flex-col', wrongBin && wrongBin.startsWith(bin) && 'hrr-shake')}
          >
            <div className="font-title text-2xl">{bin}</div>
            <div className="flex flex-col gap-1 mt-2">
              {placed[bin].map(t => <div key={t} className="hrr-pop bg-white/90 text-slate-800 rounded-lg px-2 py-1 text-xs font-game font-bold">{t}</div>)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DockSteps({ dock, audio, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [shake, setShake] = useState(null);
  const mistakes = useRef(0);
  const s = dock.steps[step];
  const choices = useMemo(() => s ? shuffle([s.a, ...s.wrong]) : [], [step]);

  const pick = (c) => {
    if (c === s.a) {
      audio.sfx('correct', { rate: 1 + step * 0.1 });
      const na = [...answers, c];
      setAnswers(na);
      if (step + 1 >= dock.steps.length) setTimeout(() => onComplete(mistakes.current), 500);
      else setStep(step + 1);
    } else {
      mistakes.current += 1;
      audio.sfx('wrong');
      setShake(c + Date.now());
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl">
      {answers.length > 0 && (
        <div className="bg-green-50 border-4 border-green-500 rounded-2xl p-3 font-game font-bold text-green-900 text-lg">
          {answers.map((a, i) => <div key={i} className="hrr-pop">✅ {dock.steps[i].q} <span className="underline">{a}</span></div>)}
        </div>
      )}
      {s && (
        <div key={step} className="hrr-drop flex flex-col gap-3">
          <div className="font-title text-white text-3xl text-center hrr-title-shadow">{s.q}</div>
          {choices.map(c => (
            <button key={c} onClick={() => pick(c)} className={cx('hrr-btn bg-white rounded-2xl py-4 px-4 font-title text-xl text-sky-900 shadow-lg border-2 border-sky-300', shake && shake.startsWith(c) && 'hrr-shake')}>
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DockScreen({ dockKey, leg, audio, mastery, onDone }) {
  const dock = CONTENT.docks[dockKey];
  const [phase, setPhase] = useState('play');

  useEffect(() => {
    const t = setTimeout(() => audio.say(`dockq_${dockKey}`, dock.prompt), 500);
    return () => clearTimeout(t);
  }, []);

  const complete = (mistakes) => {
    mastery.record(dock.item, mistakes === 0, mistakes === 0 ? 2 : 1);
    audio.sfx('leg_done', { volume: 0.7 });
    setPhase('model');
  };

  const Challenge = { slots: DockSlots, sort: DockSort, steps: DockSteps }[dock.type];
  return (
    <div className="min-h-screen flex flex-col items-center gap-5 p-5">
      <Backdrop bg={BG_PATHS[leg.id]} dim={0.55} />
      <div className="text-center">
        <div className="font-title text-amber-200 text-lg hrr-title-shadow">⚓ Dock Challenge · Big Test Question</div>
        <div className="font-title text-white text-4xl hrr-title-shadow">{dock.title}</div>
      </div>
      <div className="bg-slate-900/60 rounded-2xl px-4 py-3 flex items-center gap-3 max-w-2xl w-full">
        <div className="flex-1 text-white font-game font-bold text-lg">{dock.prompt}</div>
        <SpeakButton audio={audio} voiceKey={`dockq_${dockKey}`} text={dock.prompt} />
      </div>
      {phase === 'play' ? <Challenge dock={dock} audio={audio} onComplete={complete} /> : <ModelAnswer dockKey={dockKey} dock={dock} audio={audio} mastery={mastery} onDone={onDone} />}
    </div>
  );
}

// ==================== RESULTS ====================
function Stars({ n }) {
  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2].map(i => (
        <span key={i} className={cx('text-5xl hrr-star', i < n ? '' : 'grayscale opacity-30')} style={{ animationDelay: `${i * 0.2}s` }}>⭐</span>
      ))}
    </div>
  );
}

function LegResult({ result, leg, boss, onNext, onRetry, onMap, nextLabel }) {
  const accuracy = result.answered ? Math.round((result.correct / result.answered) * 100) : 0;
  const stars = !result.won ? 0 : 1 + (result.hull >= 2 ? 1 : 0) + (accuracy >= 85 ? 1 : 0);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6">
      <Backdrop bg={boss ? BG_PATHS.niagara : BG_PATHS[leg.id]} dim={0.5} />
      <div className="hrr-pop bg-white/95 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-center">
        <div className="font-title text-4xl text-sky-800">{result.won ? (boss ? 'Falls Powered Up!' : 'Docked!') : 'Boat Needs Repairs!'}</div>
        {result.won ? <Stars n={stars} /> : <div className="text-6xl">🛠️</div>}
        <div className="grid grid-cols-3 gap-2 font-game font-bold text-slate-700">
          <div className="bg-sky-50 rounded-xl p-2"><div className="text-2xl text-sky-700">{result.correct}</div>right</div>
          <div className="bg-sky-50 rounded-xl p-2"><div className="text-2xl text-sky-700">{accuracy}%</div>accuracy</div>
          <div className="bg-sky-50 rounded-xl p-2"><div className="text-2xl text-amber-600">{result.coins}</div>coins</div>
        </div>
        {!result.won && <div className="font-game font-bold text-slate-600">Every try helps you learn. The questions you missed will come back so you can get them next time!</div>}
        <div className="flex flex-col gap-2">
          {result.won ? <BigButton color="gold" onClick={onNext} className="text-2xl">{nextLabel} ➜</BigButton> : <BigButton color="gold" onClick={onRetry} className="text-2xl">Try Again 🔁</BigButton>}
          <BigButton color="slate" onClick={onMap}>Route Map</BigButton>
        </div>
      </div>
    </div>
  );
}

function VictoryScreen({ audio, readiness, onPractice, onHome }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6">
      <Backdrop bg={BG_PATHS.niagara} dim={0.25} />
      <img src={SPRITE_PATHS.trophy} alt="Trophy" className="w-44 hrr-trophy drop-shadow-2xl" />
      <div className="font-title text-white text-5xl text-center hrr-title-shadow">Niagara Navigator!</div>
      <OtisSays text={CONTENT.narration.victory} voiceKey="n_victory" audio={audio} />
      <div className="bg-slate-900/60 rounded-2xl p-4 w-full max-w-md flex flex-col gap-2">
        <ReadyMeter pct={readiness} />
        {readiness < 80 && <div className="text-amber-200 font-game font-bold text-sm text-center">Get the meter to 80% with the Practice Test and Weak Spot Runs!</div>}
      </div>
      <div className="flex gap-3">
        <BigButton color="sky" onClick={onPractice}>📝 Practice Test</BigButton>
        <BigButton color="gold" onClick={onHome}>Home</BigButton>
      </div>
    </div>
  );
}

// ==================== TEST READY ====================
function ReadyScreen({ mastery, audio, onBack, onWeakRun, onPractice }) {
  const groups = [
    { title: 'Vocabulary', kind: 'vocab' },
    { title: 'Key Concepts', kind: 'fact' },
    { title: 'Critical Thinking', kind: 'critical' },
  ];
  const pct = mastery.readiness(CONTENT.items);
  const weak = CONTENT.items.filter(it => mastery.level(it.id) < MASTERY_READY_LEVEL);
  return (
    <div className="min-h-screen flex flex-col items-center gap-4 p-4">
      <Backdrop bg={BG_PATHS.title} dim={0.6} blur />
      <div className="w-full max-w-3xl flex items-center justify-between">
        <BigButton color="slate" onClick={onBack} className="text-base px-4 py-2">← Back</BigButton>
        <div className="font-title text-white text-3xl hrr-title-shadow">Test Ready Check</div>
        <div className="w-20" />
      </div>
      <div className="w-full max-w-3xl bg-slate-900/60 rounded-2xl p-4 flex flex-col gap-3">
        <ReadyMeter pct={pct} />
        <div className="text-white/80 font-game text-sm">
          Each item fills up as you answer it right. Green bars mean you've got it.
          {mastery.data.bestPractice != null && <span> Best practice test: <b className="text-amber-300">{mastery.data.bestPractice}%</b>.</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <BigButton color="gold" disabled={!weak.length} onClick={onWeakRun} className="text-lg">🎯 Weak Spot Run ({weak.length})</BigButton>
          <BigButton color="sky" onClick={onPractice} className="text-lg">📝 Practice Test</BigButton>
        </div>
      </div>
      <div className="w-full max-w-3xl grid md:grid-cols-3 gap-3">
        {groups.map(g => (
          <div key={g.kind} className="bg-white/95 rounded-2xl p-3 shadow-xl">
            <div className="font-title text-xl text-sky-800 mb-2">{g.title}</div>
            <div className="flex flex-col gap-2">
              {CONTENT.items.filter(it => it.kind === g.kind).map(it => {
                const lvl = mastery.level(it.id);
                const rec = mastery.data.items[it.id];
                return (
                  <button key={it.id} onClick={() => audio.say(`fact_${it.id}`, it.fact)} className="text-left hrr-btn rounded-xl p-2 bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-game font-bold text-slate-800 text-sm leading-tight">{it.label}</div>
                      <div className="flex gap-0.5 shrink-0">
                        {[0, 1, 2, 3].map(i => <div key={i} className={cx('w-2.5 h-4 rounded-sm', i < lvl ? (lvl >= MASTERY_READY_LEVEL ? 'bg-green-500' : 'bg-amber-400') : 'bg-slate-300')} />)}
                      </div>
                    </div>
                    {rec && rec.wrong > 0 && <div className="text-xs text-rose-600 font-game font-bold">missed {rec.wrong}×</div>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="text-white/70 font-game text-sm">Tap any item to hear it.</div>
    </div>
  );
}

// ==================== PRACTICE TEST ====================
function PracticeTest({ audio, mastery, onFinish, onBack }) {
  const P = CONTENT.practice;
  const [section, setSection] = useState('intro');
  const [idx, setIdx] = useState(0);
  const [vocabAns, setVocabAns] = useState({});
  const [fillAns, setFillAns] = useState({});
  const [hints, setHints] = useState({});
  const [critAns, setCritAns] = useState({});
  const [listening, setListening] = useState(false);
  const stopRef = useRef(null);
  const inputRef = useRef(null);
  const words = useMemo(() => shuffle(P.vocab.map(v => v.word)), []);

  useEffect(() => () => { stopRef.current && stopRef.current(); audio.stopVoice(); }, []);
  useEffect(() => {
    if (section === 'intro') audio.say('n_practice_intro', CONTENT.narration.practice_intro);
    if (section === 'fill' && inputRef.current) inputRef.current.focus();
  }, [section, idx]);

  const advance = (list, nextSection) => {
    stopRef.current && stopRef.current();
    audio.stopVoice();
    if (idx + 1 < list.length) setIdx(idx + 1);
    else { setIdx(0); setSection(nextSection); }
  };

  const toggleMic = (item) => {
    if (listening) { stopRef.current && stopRef.current(); return; }
    audio.stopVoice();
    const base = (critAns[item] || '').trim();
    setListening(true);
    stopRef.current = SpeechInput.start(
      (final, interim) => setCritAns(a => ({ ...a, [item]: `${base} ${final} ${interim}`.trim() })),
      () => setListening(false)
    );
  };

  const header = (label, n, total) => (
    <div className="w-full max-w-2xl flex items-center justify-between">
      <BigButton color="slate" onClick={onBack} className="text-base px-4 py-2">✕ Quit</BigButton>
      <div className="font-title text-white text-2xl hrr-title-shadow">{label}</div>
      <div className="font-title text-amber-200 text-xl">{n}/{total}</div>
    </div>
  );

  if (section === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6">
        <Backdrop bg={BG_PATHS.hudson} dim={0.6} blur />
        <div className="font-title text-white text-5xl hrr-title-shadow">Practice Test</div>
        <OtisSays text={CONTENT.narration.practice_intro} voiceKey="n_practice_intro" audio={audio} speak={false} />
        <div className="bg-white/95 rounded-2xl p-4 font-game font-bold text-slate-700 max-w-md">
          <div>Part 1: Vocabulary (5)</div>
          <div>Part 2: Fill in the blank (11)</div>
          <div>Part 3: Critical thinking (4): type or 🎤 say your answer</div>
          <div className="text-sm text-slate-500 mt-2">You'll see your score and what to review at the end.</div>
        </div>
        <div className="flex gap-3">
          <BigButton color="slate" onClick={onBack}>Back</BigButton>
          <BigButton color="gold" onClick={() => setSection('vocab')} className="text-2xl">Start ✏️</BigButton>
        </div>
      </div>
    );
  }

  if (section === 'vocab') {
    const v = P.vocab[idx];
    return (
      <div className="min-h-screen flex flex-col items-center gap-5 p-5">
        <Backdrop bg={BG_PATHS.hudson} dim={0.65} blur />
        {header('Part 1 · Vocabulary', idx + 1, P.vocab.length)}
        <div key={idx} className="hrr-drop w-full max-w-2xl bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 font-game font-bold text-2xl text-slate-900">“{v.def}”</div>
            <SpeakButton audio={audio} voiceKey={`def_${v.item}`} text={v.def} />
          </div>
          <div className="font-title text-slate-500">Which vocabulary word matches?</div>
          <div className="grid grid-cols-2 gap-2">
            {words.map(w => (
              <button key={w} onClick={() => { setVocabAns(a => ({ ...a, [v.item]: w })); audio.sfx('steer', { volume: 0.4 }); setTimeout(() => advance(P.vocab, 'fill'), 250); }}
                className={cx('hrr-btn rounded-2xl py-3 font-title text-xl border-2 shadow', vocabAns[v.item] === w ? 'bg-sky-600 text-white border-sky-700' : 'bg-sky-50 text-sky-900 border-sky-200')}>
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (section === 'fill') {
    const f = P.fill[idx];
    const spoken = `${f.before} blank ${f.after}`;
    const submit = (e) => { e && e.preventDefault(); advance(P.fill, 'critical'); };
    return (
      <div className="min-h-screen flex flex-col items-center gap-5 p-5">
        <Backdrop bg={BG_PATHS.hudson} dim={0.65} blur />
        {header('Part 2 · Fill in the Blank', idx + 1, P.fill.length)}
        <form key={idx} onSubmit={submit} className="hrr-drop w-full max-w-2xl bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 font-game font-bold text-2xl text-slate-900 leading-relaxed">
              {f.before}{' '}
              <input
                ref={inputRef}
                value={fillAns[f.item] || ''}
                onChange={e => setFillAns(a => ({ ...a, [f.item]: e.target.value }))}
                autoCapitalize="off" autoCorrect="off" spellCheck="false"
                className="inline-block w-56 border-b-4 border-sky-500 bg-sky-50 rounded-t-lg px-2 py-1 text-sky-900 focus:outline-none focus:bg-amber-50"
                placeholder="type here"
              />{afterBlank(f.after)}
            </div>
            <SpeakButton audio={audio} voiceKey={`fill_${f.item}`} text={spoken} />
          </div>
          {hints[f.item] && <div className="font-game font-bold text-amber-700">💡 It starts with “{f.show[0]}” and has {f.show.replace(/[^a-zA-Z]/g, '').length} letters.</div>}
          <div className="flex gap-2 justify-between">
            <BigButton color="slate" onClick={(e) => { e.preventDefault(); setHints(h => ({ ...h, [f.item]: true })); }} className="text-base">💡 Hint</BigButton>
            <BigButton color="gold" onClick={submit} className="text-xl">Next ➜</BigButton>
          </div>
        </form>
      </div>
    );
  }

  if (section === 'critical') {
    const c = P.critical[idx];
    return (
      <div className="min-h-screen flex flex-col items-center gap-5 p-5">
        <Backdrop bg={BG_PATHS.hudson} dim={0.65} blur />
        {header('Part 3 · Critical Thinking', idx + 1, P.critical.length)}
        <div key={idx} className="hrr-drop w-full max-w-2xl bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 font-game font-bold text-2xl text-slate-900">{c.q}</div>
            <SpeakButton audio={audio} voiceKey={`cq_${c.item}`} text={c.q} />
          </div>
          <textarea
            value={critAns[c.item] || ''}
            onChange={e => setCritAns(a => ({ ...a, [c.item]: e.target.value }))}
            rows={5}
            className="w-full rounded-2xl border-4 border-sky-200 focus:border-sky-500 focus:outline-none p-3 font-game font-bold text-lg text-slate-800"
            placeholder="Write your answer in complete sentences..."
          />
          <div className="flex gap-2 justify-between flex-wrap">
            {SpeechInput.supported() && (
              <BigButton color={listening ? 'pink' : 'sky'} onClick={() => toggleMic(c.item)} className="text-lg">{listening ? '⏹ Stop' : '🎤 Say it'}</BigButton>
            )}
            <BigButton color="gold" onClick={() => advance(P.critical, 'results')} className="text-xl ml-auto">{idx + 1 < P.critical.length ? 'Next ➜' : 'Finish ✔'}</BigButton>
          </div>
        </div>
      </div>
    );
  }

  return <PracticeResults vocabAns={vocabAns} fillAns={fillAns} hints={hints} critAns={critAns} audio={audio} mastery={mastery} onFinish={onFinish} />;
}

function PracticeResults({ vocabAns, fillAns, hints, critAns, audio, mastery, onFinish }) {
  const P = CONTENT.practice;
  const graded = useMemo(() => {
    const vocab = P.vocab.map(v => ({ ...v, got: vocabAns[v.item] || '—', ok: vocabAns[v.item] === v.word }));
    const fill = P.fill.map(f => {
      const res = checkFill(fillAns[f.item], f.answers);
      return { ...f, got: fillAns[f.item] || '—', res, ok: res !== 'wrong', hinted: !!hints[f.item] };
    });
    const critical = P.critical.map(c => {
      const checks = checkCritical(critAns[c.item], c.checks);
      return { ...c, got: critAns[c.item] || '', checks, points: checks.filter(x => x.ok).length };
    });
    const points = vocab.filter(v => v.ok).length + fill.filter(f => f.ok).length + critical.reduce((a, c) => a + c.points, 0);
    const total = vocab.length + fill.length + critical.reduce((a, c) => a + c.checks.length, 0);
    return { vocab, fill, critical, points, total, pct: Math.round((points / total) * 100) };
  }, []);

  useEffect(() => {
    graded.vocab.forEach(v => mastery.record(v.item, v.ok));
    graded.fill.forEach(f => mastery.record(f.item, f.ok && !f.hinted, f.ok && !f.hinted ? 1 : 0));
    graded.critical.forEach(c => {
      if (c.points === c.checks.length) mastery.record(c.item, true);
      else if (c.points < c.checks.length / 2) mastery.record(c.item, false);
    });
    onFinish(graded);
    audio.sfx(graded.pct >= 70 ? 'leg_done' : 'correct');
  }, []);

  const grade = graded.pct >= 90 ? '🌟 Amazing!' : graded.pct >= 75 ? '👍 Great work!' : graded.pct >= 50 ? '💪 Getting there!' : '📚 Keep practicing!';
  return (
    <div className="min-h-screen flex flex-col items-center gap-4 p-5">
      <Backdrop bg={BG_PATHS.hudson} dim={0.65} blur />
      <div className="hrr-pop bg-white/95 rounded-3xl p-5 w-full max-w-2xl shadow-2xl text-center">
        <div className="font-title text-5xl text-sky-800">{graded.pct}%</div>
        <div className="font-title text-2xl text-slate-700">{grade}</div>
        <div className="font-game font-bold text-slate-500">{graded.points} of {graded.total} points</div>
      </div>

      <div className="w-full max-w-2xl bg-white/95 rounded-3xl p-4 shadow-xl">
        <div className="font-title text-xl text-sky-800 mb-2">Vocabulary</div>
        {graded.vocab.map(v => (
          <div key={v.item} className={cx('font-game font-bold rounded-lg px-3 py-1 mb-1', v.ok ? 'text-green-800' : 'bg-rose-50 text-rose-800')}>
            {v.ok ? '✅' : '❌'} {v.word}{!v.ok && <span className="font-normal"> (you picked {v.got}): {v.def}</span>}
          </div>
        ))}
        <div className="font-title text-xl text-sky-800 mt-3 mb-2">Fill in the Blank</div>
        {graded.fill.map(f => (
          <div key={f.item} className={cx('font-game font-bold rounded-lg px-3 py-1 mb-1', f.ok ? 'text-green-800' : 'bg-rose-50 text-rose-800')}>
            {f.ok ? '✅' : '❌'} {f.before} <u>{f.show}</u>{afterBlank(f.after)}
            {f.res === 'close' && <span className="text-amber-700"> (check your spelling: you wrote “{f.got}”)</span>}
            {!f.ok && <span className="font-normal"> (you wrote “{f.got}”)</span>}
          </div>
        ))}
        <div className="font-title text-xl text-sky-800 mt-3 mb-2">Critical Thinking</div>
        {graded.critical.map(c => (
          <div key={c.item} className="rounded-2xl border-2 border-slate-200 p-3 mb-2">
            <div className="font-game font-bold text-slate-900">{c.q}</div>
            {c.got && <div className="font-game italic text-slate-600 my-1">“{c.got}”</div>}
            <div className="grid gap-1 my-2">
              {c.checks.map(ch => (
                <div key={ch.label} className={cx('font-game font-bold text-sm rounded px-2 py-0.5', ch.ok ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900')}>{ch.ok ? '✅' : '➕ Missing:'} {ch.label}</div>
              ))}
            </div>
            <div className="flex items-start gap-2 bg-sky-50 rounded-xl p-2">
              <div className="flex-1 font-game text-slate-700 text-sm"><b>Model answer:</b> {c.model}</div>
              <SpeakButton audio={audio} voiceKey={`model_${c.item}`} text={c.model} className="w-9 h-9 text-base" />
            </div>
          </div>
        ))}
        <div className="font-game text-xs text-slate-500 mt-2">Critical thinking is checked for key ideas only. A grown-up can read it over for full sentences.</div>
      </div>
      <BigButton color="gold" onClick={() => onFinish(null, true)} className="text-2xl mb-6">Done</BigButton>
    </div>
  );
}
