// ==================== UI COMPONENTS ====================
const CONTENT = window.BB_CONTENT;
const ITEM_BY_ID = Object.fromEntries(CONTENT.items.map(it => [it.id, it]));
const FILL_BY_ITEM = Object.fromEntries(CONTENT.practice.fill.map(f => [f.item, f]));

const cx = (...c) => c.filter(Boolean).join(' ');

const afterBlank = (after) => (/^[.,!?]/.test(after) ? after : ` ${after}`);
const questionSpeech = (q) => {
  const text = q.q.replace('____', 'blank');
  return q.stage === 'truefalse' ? `True or false? ${text}` : text;
};
const fillSpeech = (f) => `${f.before} blank ${f.after}`.trim().replace(/[ .]+$/, '') + '.';

function daysUntilTest() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((TEST_DATE - start) / 86400000);
}

function BigButton({ children, onClick, color = 'teal', className = '', disabled }) {
  const colors = {
    teal: 'from-teal-400 to-cyan-600 shadow-cyan-900/40',
    gold: 'from-amber-300 to-orange-500 shadow-orange-900/40 text-slate-900',
    green: 'from-emerald-400 to-green-600 shadow-green-900/40',
    slate: 'from-slate-500 to-slate-700 shadow-black/30',
    pink: 'from-pink-400 to-rose-600 shadow-rose-900/40',
    purple: 'from-violet-400 to-purple-700 shadow-purple-900/40',
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cx('bb-btn bg-gradient-to-b text-white font-title font-semibold rounded-2xl px-6 py-3 text-xl shadow-lg', colors[color], disabled && 'opacity-40', className)}
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
      className={cx('bb-btn shrink-0 w-11 h-11 rounded-full bg-white/90 text-violet-700 text-xl shadow', className)}
    >
      🔊
    </button>
  );
}

function Backdrop({ bg, dim = 0.45 }) {
  return (
    <div className="fixed inset-0 -z-10 bg-indigo-950">
      {bg && <img src={bg} alt="" className="w-full h-full object-cover" />}
      <div className="absolute inset-0" style={{ background: `rgba(30, 27, 75, ${dim})` }} />
    </div>
  );
}

function FizzSays({ text, voiceKey, audio, speak = true, small = false }) {
  useEffect(() => {
    if (speak && text) audio.say(voiceKey, text);
  }, [text]);
  return (
    <div className="flex items-end gap-3">
      <img src={SPRITE_PATHS.fizz} alt="Doctor Fizz" className={cx('bb-float drop-shadow-xl shrink-0', small ? 'w-16' : 'w-28')} />
      <div className="bb-pop relative bg-white text-slate-800 rounded-2xl rounded-bl-none px-4 py-3 font-game font-bold text-lg shadow-xl max-w-md">
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

// ==================== TITLE ====================
function TitleScreen({ readiness, playerName, onPlay, onPractice, onReady }) {
  const days = daysUntilTest();
  const dayText = days > 1 ? `Test in ${days} days` : days === 1 ? 'Test is TOMORROW!' : days === 0 ? 'Test day! You got this!' : 'Keep reviewing!';
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <Backdrop bg={BG_PATHS.title} dim={0.45} />
      <div className="text-center bb-pop">
        <div className="font-title text-white text-6xl md:text-7xl font-bold bb-title-shadow leading-none">Beaker Blitz</div>
        <div className="font-title text-amber-200 text-2xl mt-2 bb-title-shadow">Science Chapter 1 · How Scientists Work</div>
      </div>
      <div className="flex items-end gap-4">
        <img src={SPRITE_PATHS.bolt} alt="Bolt the robot" className="w-28 bb-float drop-shadow-2xl" />
        <img src={SPRITE_PATHS.fizz} alt="Doctor Fizz" className="w-28 bb-float drop-shadow-2xl" style={{ animationDelay: '0.6s' }} />
      </div>
      <div className="bg-slate-900/60 rounded-3xl p-5 w-full max-w-md flex flex-col gap-4 shadow-2xl border border-white/20">
        {playerName && <div className="text-white/90 font-game font-bold text-center">Scientist {playerName}</div>}
        <div className="text-center font-title text-xl text-amber-300">📅 {dayText}</div>
        <ReadyMeter pct={readiness} />
        <BigButton color="gold" onClick={onPlay} className="text-2xl py-4">🧪 Enter the Lab</BigButton>
        <div className="grid grid-cols-2 gap-3">
          <BigButton color="purple" onClick={onPractice} className="text-lg">📝 Practice Test</BigButton>
          <BigButton color="green" onClick={onReady} className="text-lg">📊 Test Ready</BigButton>
        </div>
      </div>
      <div className="text-white/80 font-game text-sm text-center max-w-md">Drag Bolt (or use ← →) to catch the bubble with the right answer. Dodge the slime!</div>
    </div>
  );
}

// ==================== LAB MAP ====================
function MapScreen({ mastery, onPickStage, onBoss, onBack }) {
  const cleared = mastery.data.stagesCleared || [];
  const stages = CONTENT.stages;
  const unlocked = i => i === 0 || cleared.includes(stages[i - 1].id);
  const nextIdx = stages.findIndex((s, i) => unlocked(i) && !cleared.includes(s.id));
  const bossOpen = cleared.includes(stages[stages.length - 1].id);
  const readiness = mastery.readiness(CONTENT.items);
  return (
    <div className="min-h-screen flex flex-col items-center gap-4 p-4">
      <Backdrop bg={BG_PATHS.title} dim={0.6} />
      <div className="w-full max-w-4xl flex items-center justify-between">
        <BigButton color="slate" onClick={onBack} className="text-base px-4 py-2">← Back</BigButton>
        <div className="font-title text-white text-3xl bb-title-shadow">The Science Lab</div>
        <div className="w-20" />
      </div>
      <div className="w-full max-w-4xl grid md:grid-cols-[1fr_1.4fr] gap-4 items-center">
        <div className="bg-slate-900/60 rounded-3xl p-4 flex flex-col gap-4 items-center">
          <img src={SPRITE_PATHS.fizz} alt="Doctor Fizz" className="w-32 bb-float drop-shadow-2xl" />
          <ReadyMeter pct={readiness} />
          <div className="text-white/80 font-game text-sm text-center">Clear each lab room in order. Each one ends with a Lab Bench challenge.</div>
        </div>
        <div className="flex flex-col gap-2">
          {stages.map((st, i) => {
            const open = unlocked(i);
            const done = cleared.includes(st.id);
            return (
              <button
                key={st.id}
                disabled={!open}
                onClick={() => onPickStage(i)}
                className={cx('bb-btn text-left rounded-2xl p-3 flex items-center gap-3 shadow-lg border-2', open ? 'bg-white/95 border-white' : 'bg-white/30 border-transparent', i === nextIdx && 'bb-glow')}
              >
                <div className={cx('w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0', done ? 'bg-green-600' : open ? 'bg-amber-400' : 'bg-slate-400')}>{done ? '✅' : open ? st.icon : '🔒'}</div>
                <div className="flex-1">
                  <div className="font-title text-lg text-slate-900 leading-tight">{i + 1}. {st.name}</div>
                  <div className="font-game text-sm text-slate-600">{st.focus}</div>
                </div>
              </button>
            );
          })}
          <button
            disabled={!bossOpen}
            onClick={onBoss}
            className={cx('bb-btn text-left rounded-2xl p-3 flex items-center gap-3 shadow-lg border-2', bossOpen ? 'bg-gradient-to-r from-amber-200 to-yellow-100 border-amber-400' : 'bg-white/30 border-transparent', bossOpen && !mastery.data.bossBeaten && 'bb-glow')}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-amber-500 shrink-0">{mastery.data.bossBeaten ? '🏆' : bossOpen ? '🚀' : '🔒'}</div>
            <div className="flex-1">
              <div className="font-title text-lg text-slate-900 leading-tight">The Big Experiment</div>
              <div className="font-game text-sm text-slate-600">Boss: everything mixed. Fuel the rocket!</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== STAGE INTRO ====================
function StageIntro({ stage, index, audio, onGo, onBack, boss }) {
  const bg = boss ? BG_PATHS.boss : BG_PATHS[stage.id];
  const text = boss ? CONTENT.narration.boss : stage.intro;
  const key = boss ? 'n_boss' : `n_stage_${stage.id}`;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <Backdrop bg={bg} dim={0.35} />
      <div className="text-center bb-pop">
        <div className="font-title text-amber-200 text-xl bb-title-shadow">{boss ? 'Boss Stage' : `Lab Room ${index + 1} of ${CONTENT.stages.length}`}</div>
        <div className="font-title text-white text-5xl bb-title-shadow">{boss ? '🚀 The Big Experiment' : `${stage.icon} ${stage.name}`}</div>
        {!boss && <div className="font-game font-bold text-cyan-100 text-xl bb-title-shadow">{stage.focus}</div>}
      </div>
      <FizzSays text={text} voiceKey={key} audio={audio} />
      <div className="bg-slate-900/60 rounded-2xl px-5 py-3 text-white font-game font-bold text-center max-w-md">
        {boss ? 'Catch 8 right answers to fuel the rocket. Wrong answers cost a heart!' : `Catch ${stage.goal} right answers to fill your beaker.`}
        <div className="text-white/70 text-sm mt-1">Ready early? Tap ⏬ Drop to make the bubbles fall faster.</div>
      </div>
      <div className="flex gap-3">
        <BigButton color="slate" onClick={onBack}>Lab Map</BigButton>
        <BigButton color="gold" onClick={onGo} className="text-2xl px-10">Go! 🧪</BigButton>
      </div>
    </div>
  );
}

// ==================== LAB (canvas + HUD) ====================
function LabScreen({ stageId, questions, goal, boss, audio, mastery, onEnd, onQuit, title }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const [stats, setStats] = useState({ hearts: LAB_TUNING.maxHearts, coins: 0, correct: 0, combo: 0, goal, dropping: false });
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [paused, setPaused] = useState(false);
  const hurtRef = useRef(null);

  useEffect(() => {
    const eng = new LabRun(canvasRef.current, {
      stageId, goal, boss, questions, audio, mastery,
      on: {
        stats: s => setStats(s),
        hit: () => {
          const el = hurtRef.current;
          if (!el) return;
          el.classList.remove('bb-hurt');
          void el.offsetWidth;
          el.classList.add('bb-hurt');
        },
        question: (q) => {
          setQuestion(q);
          setFeedback(null);
          audio.say(`q_${q.id}`, questionSpeech(q));
        },
        answer: ({ q, correct, missed }) => {
          const factText = q.fact || ITEM_BY_ID[q.item].fact;
          const factKey = q.fact ? `fact_${q.id}` : `fact_${q.item}`;
          setQuestion(null);
          setFeedback({ correct, missed, answer: q.a, fact: factText, id: Date.now() });
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
    const t = setTimeout(() => setFeedback(f => (f && f.id === feedback.id ? null : f)), feedback.correct ? 3400 : 5000);
    return () => clearTimeout(t);
  }, [feedback]);

  const togglePause = () => {
    const p = !paused;
    setPaused(p);
    engineRef.current && engineRef.current.setPaused(p);
  };

  const hearts = Array.from({ length: LAB_TUNING.maxHearts }, (_, i) => i < stats.hearts);
  const pct = Math.min(100, (stats.correct / goal) * 100);

  return (
    <div className="fixed inset-0 flex items-stretch justify-center overflow-hidden select-none">
      <Backdrop bg={boss ? BG_PATHS.boss : BG_PATHS[stageId]} dim={0.55} />
      <aside className="hidden xl:flex flex-col items-center justify-center gap-4 w-60 shrink-0 p-4">
        <img src={boss ? SPRITE_PATHS.rocket : SPRITE_PATHS.fizz} alt="" className="w-36 bb-float drop-shadow-2xl" />
        <div className="font-title text-white text-2xl text-center bb-title-shadow">{title}</div>
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
                <div className={cx('h-full bg-gradient-to-r transition-all duration-500', boss ? 'from-orange-400 to-amber-300' : 'from-cyan-400 to-emerald-400')} style={{ width: `${pct}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-white font-title text-sm">{boss ? '🚀 Fuel' : '🧪 Beaker'} {Math.min(stats.correct, goal)}/{goal}</div>
              </div>
              <div className="bg-slate-900/60 rounded-full px-3 py-1 text-amber-300 font-title text-xl">⚛️ {stats.coins}</div>
              <button onClick={togglePause} className="pointer-events-auto bb-btn w-10 h-10 rounded-full bg-slate-900/60 text-white text-xl">⏸</button>
            </div>
            {stats.combo > 1 && <div key={stats.combo} className="self-center bb-pop font-title text-amber-300 text-2xl bb-title-shadow">🔥 Combo x{stats.combo}</div>}
            {question && (
              <div key={question.id} className="bb-drop pointer-events-auto bg-white/95 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 border-4 border-violet-500">
                <div className="flex-1 font-game font-bold text-slate-900 text-xl leading-snug">
                  {question.stage === 'truefalse' && <div className="font-title text-violet-700 text-base">True or False?</div>}
                  {question.q}
                </div>
                <SpeakButton audio={audio} voiceKey={`q_${question.id}`} text={questionSpeech(question)} />
              </div>
            )}
            {feedback && (
              <div key={feedback.id} className={cx('bb-pop rounded-2xl px-4 py-3 shadow-xl border-4 font-game font-bold text-lg leading-snug', feedback.correct ? 'bg-green-50 border-green-500 text-green-900' : 'bg-rose-50 border-rose-500 text-rose-900')}>
                {feedback.correct ? '✅ ' : <span>❌ {feedback.missed ? 'Missed it! ' : ''}The answer is <span className="underline">{feedback.answer}</span>. </span>}
                {feedback.fact}
              </div>
            )}
          </div>

          {stats.dropping && (
            <button onClick={() => engineRef.current && engineRef.current.drop()} className="bb-btn bb-pop absolute bottom-3 right-3 rounded-2xl px-4 py-2 bg-amber-400 text-slate-900 font-title text-lg shadow-xl border-2 border-white">
              ⏬ Drop
            </button>
          )}

          {paused && (
            <div className="absolute inset-0 bg-slate-900/70 rounded-2xl flex flex-col items-center justify-center gap-4">
              <div className="font-title text-white text-4xl">Paused</div>
              <BigButton color="green" onClick={togglePause}>▶ Keep Going</BigButton>
              <BigButton color="slate" onClick={() => audio.toggleMusic()}>🎵 Music On/Off</BigButton>
              <BigButton color="pink" onClick={onQuit}>Quit to Lab Map</BigButton>
            </div>
          )}
        </div>
      </div>
      <aside className="hidden xl:block w-60 shrink-0" />
    </div>
  );
}

// ==================== LAB BENCH CHALLENGES ====================
function BenchSort({ bench, audio, onComplete }) {
  const [queue, setQueue] = useState(() => shuffle(bench.cards));
  const [placed, setPlaced] = useState(() => Object.fromEntries(bench.bins.map(b => [b, []])));
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
      if (!rest.length) setTimeout(() => onComplete({ [bench.items[0]]: mistakes.current === 0, [bench.items[1]]: mistakes.current === 0 }), 600);
    } else {
      mistakes.current += 1;
      audio.sfx('wrong');
      setWrongBin(bin + Date.now());
      setHint(bin === 'Infer' ? 'That one is just using your senses. Try again!' : bin === 'Observe' ? 'That one draws a conclusion. Try again!' : `Not ${bin}. Try again!`);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl items-center">
      <div className="text-white font-title text-lg">{queue.length} left</div>
      {card && (
        <div key={card.text} className="bb-drop bg-white rounded-2xl px-6 py-5 shadow-2xl border-4 border-amber-400 font-game font-bold text-2xl text-slate-900 text-center min-h-[96px] flex items-center justify-center w-full">
          {card.text}
        </div>
      )}
      {hint && <div className="text-rose-100 font-game font-bold">{hint}</div>}
      <div className="grid grid-cols-2 gap-3 w-full">
        {bench.bins.map(bin => (
          <button
            key={bin}
            onClick={() => drop(bin)}
            className={cx('bb-btn rounded-3xl p-3 bg-gradient-to-b from-cyan-500/90 to-indigo-800/90 border-4 border-cyan-200 text-white shadow-xl min-h-[170px] flex flex-col', wrongBin && wrongBin.startsWith(bin) && 'bb-shake')}
          >
            <div className="font-title text-2xl">{bin === 'Observe' ? '👀 Observe' : bin === 'Infer' ? '🧠 Infer' : bin}</div>
            <div className="font-game text-xs text-cyan-100">{bin === 'Observe' ? 'use your senses' : bin === 'Infer' ? 'draw a conclusion' : ''}</div>
            <div className="flex flex-col gap-1 mt-2">
              {placed[bin].map(t => <div key={t} className="bb-pop bg-white/90 text-slate-800 rounded-lg px-2 py-1 text-xs font-game font-bold">{t}</div>)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function BenchOrder({ bench, audio, onComplete }) {
  const [done, setDone] = useState([]);
  const [tiles] = useState(() => {
    let t = shuffle(bench.steps);
    while (t.every((s, i) => s === bench.steps[i])) t = shuffle(bench.steps);
    return t;
  });
  const [shake, setShake] = useState(null);
  const mistakes = useRef(0);

  const pick = (step) => {
    const want = bench.steps[done.length];
    if (step === want) {
      const nd = [...done, step];
      setDone(nd);
      audio.sfx('correct', { rate: 1 + nd.length * 0.08 });
      if (nd.length === bench.steps.length) setTimeout(() => onComplete({ [bench.items[0]]: mistakes.current === 0 }), 600);
    } else {
      mistakes.current += 1;
      audio.sfx('wrong');
      setShake(step + Date.now());
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        {bench.steps.map((s, i) => (
          <div key={s} className={cx('rounded-2xl p-3 text-center border-4 min-h-[86px] flex flex-col justify-center', done[i] ? 'bg-green-100 border-green-500 bb-pop' : i === done.length ? 'bg-white border-amber-400 bb-glow' : 'bg-white/60 border-white/50')}>
            <div className="font-title text-sm text-slate-500">STEP {i + 1}</div>
            <div className="font-title text-lg text-slate-900 leading-tight">{done[i] || '?'}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map(t => {
          const used = done.includes(t);
          return (
            <button key={t} disabled={used} onClick={() => pick(t)}
              className={cx('bb-btn rounded-2xl py-4 px-2 font-title text-xl shadow border-2', used ? 'bg-white/30 text-white/40 border-transparent' : 'bg-white text-violet-900 border-violet-300', shake && shake.startsWith(t) && 'bb-shake')}>
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BenchMatch({ bench, audio, onComplete }) {
  const [order] = useState(() => shuffle(bench.items));
  const [idx, setIdx] = useState(0);
  const [found, setFound] = useState([]);
  const [shake, setShake] = useState(null);
  const firstTry = useRef({});
  const missedHere = useRef(false);
  const words = useMemo(() => shuffle(bench.items), []);
  const item = order[idx];
  const f = FILL_BY_ITEM[item];

  useEffect(() => {
    if (f) audio.say(`fill_${item}`, fillSpeech(f));
    missedHere.current = false;
  }, [idx]);

  const pick = (w) => {
    if (w === item) {
      firstTry.current[item] = !missedHere.current;
      audio.sfx('correct', { rate: 1 + idx * 0.04 });
      const nf = [...found, item];
      setFound(nf);
      if (idx + 1 >= order.length) setTimeout(() => onComplete(firstTry.current), 500);
      else setTimeout(() => setIdx(idx + 1), 350);
    } else {
      missedHere.current = true;
      audio.sfx('wrong');
      setShake(w + Date.now());
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl">
      <div className="text-white font-title text-lg text-center">{found.length} / {order.length} matched</div>
      {f && (
        <div key={item} className="bb-drop bg-white rounded-2xl px-5 py-4 shadow-2xl border-4 border-amber-400 flex items-start gap-3">
          <div className="flex-1 font-game font-bold text-xl text-slate-900 leading-relaxed">
            {f.before} <span className="inline-block min-w-[110px] border-b-4 border-violet-500 text-center text-violet-700">{found.includes(item) ? f.show : '?'}</span>{afterBlank(f.after)}
          </div>
          <SpeakButton audio={audio} voiceKey={`fill_${item}`} text={fillSpeech(f)} />
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {words.map(w => {
          const used = found.includes(w);
          return (
            <button key={w} disabled={used} onClick={() => pick(w)}
              className={cx('bb-btn rounded-2xl py-3 px-2 font-title text-lg shadow border-2', used ? 'bg-green-500/40 text-white/70 border-transparent' : 'bg-white text-violet-900 border-violet-300', shake && shake.startsWith(w) && 'bb-shake')}>
              {used ? '✓ ' : ''}{ITEM_BY_ID[w].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BenchTrick({ bench, audio, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(null);
  const firstTry = useRef({});
  const missedHere = useRef(false);
  const s = bench.sentences[idx];
  const tokens = s.text.split(' ');
  const clean = t => t.toLowerCase().replace(/[^a-z]/g, '');

  useEffect(() => {
    missedHere.current = false;
    setSolved(false);
    audio.say(`q_${CONTENT.questions.find(q => q.item === s.item && q.q === s.text).id}`, s.text);
  }, [idx]);

  const pick = (tok, i) => {
    if (solved) return;
    if (s.trick.includes(clean(tok))) {
      firstTry.current[s.item] = !missedHere.current;
      setSolved(true);
      audio.sfx('correct');
      setTimeout(() => audio.say(`why_${s.item}`, s.why), 350);
    } else {
      missedHere.current = true;
      audio.sfx('wrong');
      setShake(`${i}-${Date.now()}`);
    }
  };

  const next = () => {
    audio.stopVoice();
    if (idx + 1 >= bench.sentences.length) onComplete(firstTry.current);
    else setIdx(idx + 1);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl">
      <div className="text-white font-title text-lg text-center">Sentence {idx + 1} of {bench.sentences.length} · <span className="text-rose-200">FALSE</span></div>
      <div key={idx} className="bb-drop bg-white rounded-3xl p-5 shadow-2xl border-4 border-rose-400 flex flex-wrap gap-2 justify-center">
        {tokens.map((tok, i) => {
          const isTrick = s.trick.includes(clean(tok));
          return (
            <button key={i} onClick={() => pick(tok, i)}
              className={cx('bb-btn rounded-xl px-3 py-2 font-game font-bold text-2xl border-2',
                solved && isTrick ? 'bg-rose-500 text-white border-rose-700 bb-pop' : 'bg-violet-50 text-slate-900 border-violet-200',
                shake && shake.startsWith(`${i}-`) && 'bb-shake')}>
              {tok}
            </button>
          );
        })}
      </div>
      {solved && (
        <div className="bb-pop bg-green-50 border-4 border-green-500 rounded-2xl p-4 flex items-center gap-3">
          <div className="flex-1 font-game font-bold text-lg text-green-900">✅ {s.why}</div>
          <BigButton color="green" onClick={next}>{idx + 1 < bench.sentences.length ? 'Next ➜' : 'Done ✔'}</BigButton>
        </div>
      )}
    </div>
  );
}

function RememberCard({ benchKey, bench, audio, onDone }) {
  useEffect(() => {
    const t = setTimeout(() => audio.say(`benchm_${benchKey}`, bench.model), 400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="bb-pop w-full max-w-2xl bg-white/95 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="font-title text-2xl text-violet-800 flex-1">🧠 Remember for the test:</div>
        <SpeakButton audio={audio} voiceKey={`benchm_${benchKey}`} text={bench.model} />
      </div>
      <div className="font-game font-bold text-xl text-slate-800 leading-relaxed bg-violet-50 rounded-2xl p-4 border-2 border-violet-200">
        {bench.model}
      </div>
      <BigButton color="green" onClick={onDone} className="text-2xl">Continue ➜</BigButton>
    </div>
  );
}

function BenchScreen({ benchKey, stage, audio, mastery, onDone }) {
  const bench = CONTENT.benches[benchKey];
  const [phase, setPhase] = useState('play');

  useEffect(() => {
    const t = setTimeout(() => audio.say(`bench_${benchKey}`, bench.prompt), 500);
    return () => clearTimeout(t);
  }, []);

  // results: { itemId: firstTryCorrect }
  const complete = (results) => {
    Object.entries(results).forEach(([item, clean]) => mastery.record(item, clean, clean ? 2 : 1));
    audio.sfx('stage_done', { volume: 0.7 });
    setPhase('remember');
  };

  const Challenge = { sort: BenchSort, order: BenchOrder, match: BenchMatch, trick: BenchTrick }[bench.type];
  return (
    <div className="min-h-screen flex flex-col items-center gap-5 p-5">
      <Backdrop bg={BG_PATHS[stage.id]} dim={0.6} />
      <div className="text-center">
        <div className="font-title text-amber-200 text-lg bb-title-shadow">🔬 Lab Bench Challenge</div>
        <div className="font-title text-white text-4xl bb-title-shadow">{bench.title}</div>
      </div>
      <div className="bg-slate-900/60 rounded-2xl px-4 py-3 flex items-center gap-3 max-w-2xl w-full">
        <div className="flex-1 text-white font-game font-bold text-lg">{bench.prompt}</div>
        <SpeakButton audio={audio} voiceKey={`bench_${benchKey}`} text={bench.prompt} />
      </div>
      {phase === 'play' ? <Challenge bench={bench} audio={audio} onComplete={complete} /> : <RememberCard benchKey={benchKey} bench={bench} audio={audio} onDone={onDone} />}
    </div>
  );
}

// ==================== RESULTS ====================
function Stars({ n }) {
  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2].map(i => (
        <span key={i} className={cx('text-5xl bb-star', i < n ? '' : 'grayscale opacity-30')} style={{ animationDelay: `${i * 0.2}s` }}>⭐</span>
      ))}
    </div>
  );
}

function StageResult({ result, stage, boss, onNext, onRetry, onMap, nextLabel }) {
  const accuracy = result.answered ? Math.round((result.correct / result.answered) * 100) : 0;
  const stars = !result.won ? 0 : 1 + (result.hearts >= 2 ? 1 : 0) + (accuracy >= 85 ? 1 : 0);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6">
      <Backdrop bg={boss ? BG_PATHS.boss : BG_PATHS[stage.id]} dim={0.5} />
      <div className="bb-pop bg-white/95 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-center">
        <div className="font-title text-4xl text-violet-800">{result.won ? (boss ? 'Rocket Launched!' : 'Beaker Full!') : 'Experiment Fizzled!'}</div>
        {result.won ? <Stars n={stars} /> : <div className="text-6xl">🧪💨</div>}
        <div className="grid grid-cols-3 gap-2 font-game font-bold text-slate-700">
          <div className="bg-violet-50 rounded-xl p-2"><div className="text-2xl text-violet-700">{result.correct}</div>right</div>
          <div className="bg-violet-50 rounded-xl p-2"><div className="text-2xl text-violet-700">{accuracy}%</div>accuracy</div>
          <div className="bg-violet-50 rounded-xl p-2"><div className="text-2xl text-amber-600">{result.coins}</div>atoms</div>
        </div>
        {!result.won && <div className="font-game font-bold text-slate-600">Scientists repeat their tests! The questions you missed will come back so you can get them next time.</div>}
        <div className="flex flex-col gap-2">
          {result.won && nextLabel ? <BigButton color="gold" onClick={onNext} className="text-2xl">{nextLabel} ➜</BigButton> : <BigButton color="gold" onClick={onRetry} className="text-2xl">Try Again 🔁</BigButton>}
          <BigButton color="slate" onClick={onMap}>Lab Map</BigButton>
        </div>
      </div>
    </div>
  );
}

function VictoryScreen({ audio, readiness, onPractice, onHome }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6">
      <Backdrop bg={BG_PATHS.boss} dim={0.25} />
      <img src={SPRITE_PATHS.trophy} alt="Trophy" className="w-44 bb-trophy drop-shadow-2xl" />
      <div className="font-title text-white text-5xl text-center bb-title-shadow">Master Scientist!</div>
      <FizzSays text={CONTENT.narration.victory} voiceKey="n_victory" audio={audio} />
      <div className="bg-slate-900/60 rounded-2xl p-4 w-full max-w-md flex flex-col gap-2">
        <ReadyMeter pct={readiness} />
        {readiness < 80 && <div className="text-amber-200 font-game font-bold text-sm text-center">Get the meter to 80% with the Practice Test and Weak Spot Runs!</div>}
      </div>
      <div className="flex gap-3">
        <BigButton color="purple" onClick={onPractice}>📝 Practice Test</BigButton>
        <BigButton color="gold" onClick={onHome}>Home</BigButton>
      </div>
    </div>
  );
}

// ==================== TEST READY ====================
function ReadyScreen({ mastery, audio, onBack, onWeakRun, onPractice }) {
  const groups = [
    { title: 'Vocabulary', kind: 'vocab' },
    { title: 'True or False', kind: 'tf' },
  ];
  const pct = mastery.readiness(CONTENT.items);
  const weak = CONTENT.items.filter(it => mastery.level(it.id) < MASTERY_READY_LEVEL);
  return (
    <div className="min-h-screen flex flex-col items-center gap-4 p-4">
      <Backdrop bg={BG_PATHS.title} dim={0.65} />
      <div className="w-full max-w-3xl flex items-center justify-between">
        <BigButton color="slate" onClick={onBack} className="text-base px-4 py-2">← Back</BigButton>
        <div className="font-title text-white text-3xl bb-title-shadow">Test Ready Check</div>
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
          <BigButton color="purple" onClick={onPractice} className="text-lg">📝 Practice Test</BigButton>
        </div>
      </div>
      <div className="w-full max-w-3xl grid md:grid-cols-2 gap-3">
        {groups.map(g => (
          <div key={g.kind} className="bg-white/95 rounded-2xl p-3 shadow-xl">
            <div className="font-title text-xl text-violet-800 mb-2">{g.title}</div>
            <div className="flex flex-col gap-2">
              {CONTENT.items.filter(it => it.kind === g.kind).map(it => {
                const lvl = mastery.level(it.id);
                const rec = mastery.data.items[it.id];
                return (
                  <button key={it.id} onClick={() => audio.say(`fact_${it.id}`, it.fact)} className="text-left bb-btn rounded-xl p-2 bg-slate-50 border border-slate-200">
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
  const [fillAns, setFillAns] = useState({});
  const [hints, setHints] = useState({});
  const [tfAns, setTfAns] = useState({});
  const inputRef = useRef(null);
  const fills = useMemo(() => shuffle(P.fill), []);

  useEffect(() => () => audio.stopVoice(), []);
  useEffect(() => {
    if (section === 'intro') audio.say('n_practice_intro', CONTENT.narration.practice_intro);
    if (section === 'fill' && inputRef.current) inputRef.current.focus();
  }, [section, idx]);

  const advance = (list, nextSection) => {
    audio.stopVoice();
    if (idx + 1 < list.length) setIdx(idx + 1);
    else { setIdx(0); setSection(nextSection); }
  };

  const header = (label, n, total) => (
    <div className="w-full max-w-2xl flex items-center justify-between">
      <BigButton color="slate" onClick={onBack} className="text-base px-4 py-2">✕ Quit</BigButton>
      <div className="font-title text-white text-2xl bb-title-shadow">{label}</div>
      <div className="font-title text-amber-200 text-xl">{n}/{total}</div>
    </div>
  );

  if (section === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6">
        <Backdrop bg={BG_PATHS.hypothesis} dim={0.6} />
        <div className="font-title text-white text-5xl bb-title-shadow">Practice Test</div>
        <FizzSays text={CONTENT.narration.practice_intro} voiceKey="n_practice_intro" audio={audio} speak={false} />
        <div className="bg-white/95 rounded-2xl p-4 font-game font-bold text-slate-700 max-w-md">
          <div>Part 1: Vocabulary, fill in the blank ({P.fill.length})</div>
          <div>Part 2: True or False ({P.tf.length})</div>
          <div className="text-sm text-slate-500 mt-2">Spelling counts on the real test, so type each word carefully. You'll see your score and what to review at the end.</div>
        </div>
        <div className="flex gap-3">
          <BigButton color="slate" onClick={onBack}>Back</BigButton>
          <BigButton color="gold" onClick={() => setSection('fill')} className="text-2xl">Start ✏️</BigButton>
        </div>
      </div>
    );
  }

  if (section === 'fill') {
    const f = fills[idx];
    const submit = (e) => { e && e.preventDefault(); advance(fills, 'tf'); };
    return (
      <div className="min-h-screen flex flex-col items-center gap-5 p-5">
        <Backdrop bg={BG_PATHS.hypothesis} dim={0.65} />
        {header('Part 1 · Vocabulary', idx + 1, fills.length)}
        <form key={idx} onSubmit={submit} className="bb-drop w-full max-w-2xl bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 font-game font-bold text-2xl text-slate-900 leading-relaxed">
              {f.before}{' '}
              <input
                ref={inputRef}
                value={fillAns[f.item] || ''}
                onChange={e => setFillAns(a => ({ ...a, [f.item]: e.target.value }))}
                autoCapitalize="off" autoCorrect="off" spellCheck="false"
                className="inline-block w-56 border-b-4 border-violet-500 bg-violet-50 rounded-t-lg px-2 py-1 text-violet-900 focus:outline-none focus:bg-amber-50"
                placeholder="type here"
              />{afterBlank(f.after)}
            </div>
            <SpeakButton audio={audio} voiceKey={`fill_${f.item}`} text={fillSpeech(f)} />
          </div>
          {hints[f.item] && <div className="font-game font-bold text-amber-700">💡 It starts with “{f.show[0]}” and has {f.show.length} letters.</div>}
          <div className="flex gap-2 justify-between">
            <BigButton color="slate" onClick={(e) => { e.preventDefault(); setHints(h => ({ ...h, [f.item]: true })); }} className="text-base">💡 Hint</BigButton>
            <BigButton color="gold" onClick={submit} className="text-xl">Next ➜</BigButton>
          </div>
        </form>
      </div>
    );
  }

  if (section === 'tf') {
    const t = P.tf[idx];
    const q = CONTENT.questions.find(x => x.item === t.item && x.q === t.text);
    const choose = (val) => {
      setTfAns(a => ({ ...a, [t.item]: val }));
      audio.sfx('pop', { volume: 0.5 });
      setTimeout(() => advance(P.tf, 'results'), 250);
    };
    return (
      <div className="min-h-screen flex flex-col items-center gap-5 p-5">
        <Backdrop bg={BG_PATHS.truefalse} dim={0.65} />
        {header('Part 2 · True or False', idx + 1, P.tf.length)}
        <div key={idx} className="bb-drop w-full max-w-2xl bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <div className="flex-1 font-game font-bold text-2xl text-slate-900 leading-relaxed">{t.text}</div>
            {q && <SpeakButton audio={audio} voiceKey={`q_${q.id}`} text={`True or false? ${t.text}`} />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => choose(true)} className={cx('bb-btn rounded-2xl py-5 font-title text-3xl border-4 shadow', tfAns[t.item] === true ? 'bg-green-600 text-white border-green-800' : 'bg-green-50 text-green-800 border-green-300')}>✔ True</button>
            <button onClick={() => choose(false)} className={cx('bb-btn rounded-2xl py-5 font-title text-3xl border-4 shadow', tfAns[t.item] === false ? 'bg-rose-600 text-white border-rose-800' : 'bg-rose-50 text-rose-800 border-rose-300')}>✘ False</button>
          </div>
          <div className="font-game text-sm text-slate-500 text-center">Tip: look for one word that could make it false, like ONLY or NOT.</div>
        </div>
      </div>
    );
  }

  return <PracticeResults fillAns={fillAns} hints={hints} tfAns={tfAns} audio={audio} mastery={mastery} onFinish={onFinish} />;
}

function PracticeResults({ fillAns, hints, tfAns, audio, mastery, onFinish }) {
  const P = CONTENT.practice;
  const graded = useMemo(() => {
    const fill = P.fill.map(f => {
      const res = checkFill(fillAns[f.item], f.answers);
      return { ...f, got: fillAns[f.item] || '—', res, ok: res === 'exact', close: res === 'close', hinted: !!hints[f.item] };
    });
    const tf = P.tf.map(t => ({ ...t, got: tfAns[t.item], ok: tfAns[t.item] === t.answer }));
    // A spelling slip earns half credit: the paper test may mark it wrong.
    const points = fill.reduce((a, f) => a + (f.ok ? 1 : f.close ? 0.5 : 0), 0) + tf.filter(t => t.ok).length;
    const total = fill.length + tf.length;
    return { fill, tf, points, total, pct: Math.round((points / total) * 100) };
  }, []);

  useEffect(() => {
    graded.fill.forEach(f => mastery.record(f.item, (f.ok || f.close) && !f.hinted, f.ok && !f.hinted ? 1 : 0));
    graded.tf.forEach(t => mastery.record(t.item, t.ok));
    onFinish(graded);
    audio.sfx(graded.pct >= 70 ? 'stage_done' : 'correct');
  }, []);

  const grade = graded.pct >= 90 ? '🌟 Amazing!' : graded.pct >= 75 ? '👍 Great work!' : graded.pct >= 50 ? '💪 Getting there!' : '📚 Keep practicing!';
  const tfWord = v => (v === true ? 'True' : v === false ? 'False' : '—');
  return (
    <div className="min-h-screen flex flex-col items-center gap-4 p-5">
      <Backdrop bg={BG_PATHS.hypothesis} dim={0.65} />
      <div className="bb-pop bg-white/95 rounded-3xl p-5 w-full max-w-2xl shadow-2xl text-center">
        <div className="font-title text-5xl text-violet-800">{graded.pct}%</div>
        <div className="font-title text-2xl text-slate-700">{grade}</div>
        <div className="font-game font-bold text-slate-500">{graded.points} of {graded.total} points</div>
      </div>

      <div className="w-full max-w-2xl bg-white/95 rounded-3xl p-4 shadow-xl">
        <div className="font-title text-xl text-violet-800 mb-2">Vocabulary</div>
        {graded.fill.map(f => (
          <div key={f.item} className={cx('font-game font-bold rounded-lg px-3 py-1 mb-1', f.ok ? 'text-green-800' : f.close ? 'bg-amber-50 text-amber-900' : 'bg-rose-50 text-rose-800')}>
            {f.ok ? '✅' : f.close ? '✏️' : '❌'} {f.before} <u>{f.show}</u>{afterBlank(f.after)}
            {f.close && <span className="font-normal"> (almost! you wrote “{f.got}”. Check the spelling)</span>}
            {!f.ok && !f.close && <span className="font-normal"> (you wrote “{f.got}”)</span>}
          </div>
        ))}
        <div className="font-title text-xl text-violet-800 mt-3 mb-2">True or False</div>
        {graded.tf.map(t => (
          <div key={t.item} className={cx('font-game font-bold rounded-lg px-3 py-1 mb-1', t.ok ? 'text-green-800' : 'bg-rose-50 text-rose-800')}>
            {t.ok ? '✅' : '❌'} {t.text} <b>{t.answer ? 'TRUE' : 'FALSE'}</b>
            {!t.ok && <span className="font-normal"> (you picked {tfWord(t.got)}). {ITEM_BY_ID[t.item].fact}</span>}
          </div>
        ))}
      </div>
      <BigButton color="gold" onClick={() => onFinish(null, true)} className="text-2xl mb-6">Done</BigButton>
    </div>
  );
}
