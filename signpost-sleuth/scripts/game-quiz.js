// ==================== PRACTICE QUIZ + QUIZ READY ====================

function buildQuiz() {
  const names = SIGNPOSTS.map(sp => sp.id);
  return [
    { title: 'Part A: What does each signpost mean?', items: shuffle(SIGNPOSTS).map(sp => ({ kind: 'name', skill: `${sp.id}_def`, prompt: `When you're reading and... ${sp.when}`, answer: sp.id, options: names })) },
    { title: 'Part B: Match the question to the signpost', items: shuffle(SIGNPOSTS).map(sp => ({ kind: 'name', skill: `${sp.id}_ask`, prompt: `Stop and ask yourself: "${sp.ask}"`, answer: sp.id, options: names })) },
    { title: 'Part C: Read it. Which signpost is it?', items: shuffle(CONTENT.quiz.identify).map(q => ({ kind: 'name', skill: `${q.answer}_spot`, prompt: q.text, story: true, answer: q.answer, options: names })) },
    { title: 'Part D: What do signposts help you understand?', items: CONTENT.quiz.understand.map(q => ({ kind: 'mc', skill: q.item, prompt: q.q, answer: q.a, options: shuffle([q.a, ...q.wrong]) })) },
    { title: 'Part E: Short answer', items: [{ kind: 'written', skill: CONTENT.quiz.written.item, prompt: CONTENT.quiz.written.q }] },
  ];
}

function WrittenAnswer({ value, onChange }) {
  const [listening, setListening] = useState(false);
  const stopRef = useRef(null);
  const base = useRef('');
  const toggle = () => {
    if (listening) { stopRef.current && stopRef.current(); setListening(false); return; }
    base.current = value ? value + ' ' : '';
    setListening(true);
    stopRef.current = SpeechInput.start((fin, interim) => onChange(base.current + fin + (interim ? ' ' + interim : '')), () => setListening(false));
  };
  return (
    <div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5} placeholder="Write 2-3 sentences in your own words..."
        className="w-full rounded-2xl border-2 border-stone-200 focus:border-amber-400 outline-none p-3 font-story text-lg text-stone-800 ps-paper" />
      {SpeechInput.supported() && (
        <button onClick={toggle} className={cx('ps-btn mt-2 rounded-full px-4 py-2 font-semibold text-sm', listening ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-700')}>
          {listening ? '⏹ Stop talking' : '🎤 Say it instead'}
        </button>
      )}
    </div>
  );
}

function PracticeQuiz({ audio, mastery, onFinish, onBack }) {
  const sections = useMemo(buildQuiz, []);
  const flat = useMemo(() => sections.flatMap((s, si) => s.items.map((it, ii) => ({ ...it, si, ii }))), [sections]);
  const [idx, setIdx] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [graded, setGraded] = useState(null);
  const item = flat[idx];

  useEffect(() => { if (idx === -1) audio.say('n_quiz_intro', CONTENT.narration.quiz_intro); }, []);

  const choose = (val) => {
    audio.sfx('tap');
    setAnswers(a => ({ ...a, [idx]: val }));
    setTimeout(() => setIdx(i => i + 1), 180);
  };

  const grade = () => {
    let points = 0, total = 0;
    const perSection = sections.map(() => ({ got: 0, of: 0 }));
    const misses = [];
    let written = null;
    flat.forEach((it, k) => {
      const ans = answers[k];
      if (it.kind === 'written') {
        const checks = checkWritten(ans || '', CONTENT.quiz.written.checks);
        const got = checks.filter(c => c.ok).length;
        points += got; total += checks.length;
        perSection[it.si].got += got; perSection[it.si].of += checks.length;
        mastery.record(it.skill, got === checks.length);
        written = { text: ans || '', checks };
        return;
      }
      const ok = ans === it.answer;
      total += 1; perSection[it.si].of += 1;
      if (ok) { points += 1; perSection[it.si].got += 1; } else misses.push({ it, ans });
      mastery.record(it.skill, ok);
    });
    const pct = Math.round((points / total) * 100);
    const result = { points, total, pct, perSection, misses, written };
    setGraded(result);
    audio.sfx('fanfare');
    if (pct >= 80) setTimeout(() => Juice.confetti(window.innerWidth / 2, window.innerHeight / 3, { count: 50 }), 300);
    onFinish(result);
  };

  if (graded) return <QuizResults graded={graded} sections={sections} audio={audio} onBack={onBack} />;

  return (
    <div className="min-h-screen pb-10">
      <Backdrop bg={BG_PATHS.quiz} dim={0.45} />
      <TopBar title="Practice Quiz" audio={audio} onBack={onBack} />
      <div className="max-w-xl mx-auto px-4">
        {idx === -1 && (
          <div className="ps-paper rounded-3xl shadow-2xl p-6 ps-pop">
            <div className="font-title text-3xl text-stone-800">Notice & Note Quiz</div>
            <div className="text-stone-600 font-semibold mt-1">{quizCountdownLabel()} · {flat.length} questions · about 10 minutes</div>
            <ul className="mt-4 space-y-1 text-stone-700 font-semibold">
              {sections.map(s => <li key={s.title}>📄 {s.title} ({s.items.length})</li>)}
            </ul>
            <div className="text-sm text-stone-500 mt-3">No hints and no answers until the end, just like the real quiz.</div>
            <BigButton color="green" className="mt-5 w-full" onClick={() => { audio.stopVoice(); setIdx(0); }}>Start quiz ✏️</BigButton>
          </div>
        )}
        {item && (
          <div key={idx} className="bg-white/95 rounded-3xl shadow-2xl p-5 ps-rise">
            <div className="flex justify-between text-xs font-bold text-stone-500 mb-1">
              <span>{sections[item.si].title}</span><span>{idx + 1} / {flat.length}</span>
            </div>
            <div className="h-2 bg-stone-200 rounded-full mb-4"><div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(idx / flat.length) * 100}%` }} /></div>
            <div className={cx('text-stone-800 mb-4', item.story ? 'font-story text-xl leading-relaxed' : 'font-title text-xl')}>{item.prompt}</div>
            {item.kind === 'name' && (
              <div className="grid grid-cols-2 gap-2">
                {item.options.map(id => (
                  <button key={id} onClick={() => choose(id)}
                    className={cx('ps-btn rounded-2xl border-2 px-3 py-3 font-title font-semibold text-stone-800', answers[idx] === id ? 'border-amber-500 bg-amber-50' : 'border-stone-200 bg-stone-50 hover:border-amber-400')}>
                    {SP_BY_ID[id].name}
                  </button>
                ))}
              </div>
            )}
            {item.kind === 'mc' && (
              <div className="grid gap-2">
                {item.options.map(o => (
                  <button key={o} onClick={() => choose(o)}
                    className={cx('ps-btn text-left rounded-2xl border-2 px-4 py-3 font-semibold text-stone-800', answers[idx] === o ? 'border-amber-500 bg-amber-50' : 'border-stone-200 bg-stone-50 hover:border-amber-400')}>{o}</button>
                ))}
              </div>
            )}
            {item.kind === 'written' && (
              <>
                <WrittenAnswer value={answers[idx] || ''} onChange={(v) => setAnswers(a => ({ ...a, [idx]: v }))} />
                <BigButton color="green" className="mt-4 w-full" disabled={!(answers[idx] || '').trim()} onClick={grade}>Turn it in ✔</BigButton>
              </>
            )}
            {idx > 0 && <button onClick={() => setIdx(i => i - 1)} className="mt-4 text-sm font-bold text-stone-500">← Previous question</button>}
          </div>
        )}
      </div>
    </div>
  );
}

function QuizResults({ graded, sections, audio, onBack }) {
  const w = graded.written;
  return (
    <div className="min-h-screen pb-10">
      <Backdrop bg={BG_PATHS.quiz} dim={0.5} />
      <TopBar title="Quiz Results" audio={audio} onBack={onBack} />
      <div className="max-w-xl mx-auto px-4 space-y-4">
        <div className="bg-white/95 rounded-3xl shadow-2xl p-6 text-center ps-pop">
          <div className={cx('font-title text-6xl', graded.pct >= 80 ? 'text-emerald-600' : graded.pct >= 60 ? 'text-amber-600' : 'text-rose-600')}>{graded.pct}%</div>
          <div className="text-stone-600 font-bold">{graded.points} of {graded.total} points</div>
          <div className="mt-3 space-y-1 text-left">
            {sections.map((s, k) => (
              <div key={s.title} className="flex justify-between text-sm font-semibold text-stone-700"><span>{s.title}</span><span>{graded.perSection[k].got}/{graded.perSection[k].of}</span></div>
            ))}
          </div>
        </div>
        {graded.misses.length > 0 && (
          <div className="bg-white/95 rounded-3xl shadow-xl p-5">
            <div className="font-title text-xl text-stone-800 mb-2">Fix these before Friday</div>
            <div className="space-y-3">
              {graded.misses.map(({ it, ans }, k) => (
                <div key={k} className="rounded-2xl bg-stone-50 border border-stone-200 p-3">
                  <div className={cx('text-stone-800', it.story ? 'font-story' : 'font-semibold')}>{it.prompt}</div>
                  {ans && <div className="text-sm text-rose-600 font-bold mt-1">You said: {it.kind === 'name' ? SP_BY_ID[ans].name : ans}</div>}
                  <div className="text-sm text-emerald-700 font-bold mt-1 flex items-center gap-2">
                    {it.kind === 'name' && <SignpostSign id={it.answer} size={26} />}
                    Answer: {it.kind === 'name' ? SP_BY_ID[it.answer].name : it.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {w && (
          <div className="bg-white/95 rounded-3xl shadow-xl p-5">
            <div className="font-title text-xl text-stone-800 mb-2">Your short answer</div>
            <div className="font-story text-stone-800 rounded-2xl ps-paper p-3">{w.text}</div>
            <div className="mt-3 space-y-1">
              {w.checks.map(c => <div key={c.label} className={cx('font-semibold text-sm', c.ok ? 'text-emerald-700' : 'text-rose-600')}>{c.ok ? '✅' : '⬜'} {c.label}</div>)}
            </div>
            <div className="mt-3 rounded-2xl bg-sky-50 border border-sky-200 p-3">
              <div className="flex items-center justify-between"><div className="text-sm font-bold text-sky-700">One strong answer could say:</div>
                <SpeakButton audio={audio} voiceKey="model_why" text={CONTENT.quiz.written.model} /></div>
              <div className="text-stone-800 mt-1">{CONTENT.quiz.written.model}</div>
              <div className="text-xs font-bold text-sky-700 mt-2">Compare it to yours, then say it again in your own words.</div>
            </div>
          </div>
        )}
        <div className="flex justify-center"><BigButton color="green" onClick={onBack}>Done</BigButton></div>
      </div>
    </div>
  );
}

const LEVEL_DOT = ['bg-stone-300', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-600'];

function ReadyScreen({ mastery, audio, onBack, onDrill, onQuiz }) {
  const pct = mastery.readiness(SKILLS);
  return (
    <div className="min-h-screen pb-10">
      <Backdrop bg={BG_PATHS.quiz} dim={0.5} />
      <TopBar title="Quiz Ready Check" audio={audio} onBack={onBack} />
      <div className="max-w-xl mx-auto px-4 space-y-4">
        <div className="bg-white/95 rounded-3xl shadow-xl p-5 ps-pop">
          <ReadyMeter pct={pct} dark />
          <div className="flex justify-between text-sm font-bold text-stone-500 mt-2">
            <span>📅 {quizCountdownLabel()}</span>
            <span>Best practice quiz: {mastery.data.bestQuiz == null ? 'not yet' : `${mastery.data.bestQuiz}%`}</span>
          </div>
        </div>
        <div className="bg-white/95 rounded-3xl shadow-xl p-4">
          <div className="grid grid-cols-[1fr_repeat(4,3.6rem)] gap-y-2 items-center text-xs font-bold text-stone-500">
            <div />
            {SKILL_FACETS.map(f => <div key={f.key} className="text-center leading-tight">{f.label}</div>)}
            {SIGNPOSTS.map(sp => (
              <React.Fragment key={sp.id}>
                <div className="flex items-center gap-2 text-sm text-stone-800 font-title font-semibold"><SignpostSign id={sp.id} size={28} />{sp.name}</div>
                {SKILL_FACETS.map(f => {
                  const lv = Math.min(4, Math.floor(mastery.level(`${sp.id}_${f.key}`)));
                  return <div key={f.key} className="flex justify-center"><div className={cx('w-5 h-5 rounded-full', LEVEL_DOT[lv])} title={`Level ${lv}`} /></div>;
                })}
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm font-title font-semibold text-stone-800">
            <span>🛑 Why stop, notice & note?</span>
            <div className={cx('w-5 h-5 rounded-full ml-auto mr-3', LEVEL_DOT[Math.min(4, Math.floor(mastery.level('why')))])} />
          </div>
          <div className="text-xs text-stone-500 font-semibold mt-3">Gray = not practiced yet, red/yellow = still learning, green = quiz ready.</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <BigButton color="rose" onClick={onDrill}>🎯 Weak Spot Drill</BigButton>
          <BigButton color="violet" onClick={onQuiz}>📝 Practice Quiz</BigButton>
        </div>
      </div>
    </div>
  );
}

function buildDrill(mastery, n = 8) {
  const weakest = orderByNeed(SKILLS, mastery, s => s.id).slice(0, n);
  const nameChoices = (id) => shuffle([id, ...shuffle(SIGNPOSTS.filter(o => o.id !== id)).slice(0, 3).map(o => o.id)]).map(x => SP_BY_ID[x].name);
  return weakest.map(s => {
    if (s.facet === 'why') {
      const u = CONTENT.quiz.understand.find(q => q.item === 'why');
      return { skill: 'why', prompt: u.q, answer: u.a, choices: [u.a, ...u.wrong], hint: 'Good readers do three things when they see a signpost.' };
    }
    const sp = SP_BY_ID[s.sp];
    if (s.facet === 'def') return { skill: s.id, prompt: `Which signpost is this? When you're reading and... ${sp.when}`, answer: sp.name, choices: nameChoices(sp.id), hint: `Clue words: ${sp.clues.join(' / ')}` };
    if (s.facet === 'ask') return { skill: s.id, prompt: `Which signpost goes with this question? "${sp.ask}"`, answer: sp.name, choices: nameChoices(sp.id), hint: sp.example };
    if (s.facet === 'spot') {
      const card = shuffle(STORIES.speed.filter(c => c.answer === sp.id))[0];
      return { skill: s.id, prompt: card.text, answer: sp.name, choices: nameChoices(sp.id), hint: `Which signpost is about a moment when ${sp.when.charAt(0).toLowerCase() + sp.when.slice(1)}` };
    }
    return { skill: s.id, prompt: `What does a ${sp.name} help you figure out?`, answer: sp.tellsShort, choices: [sp.tellsShort, ...shuffle(CONTENT.school.tellsDistractors).slice(0, 2)], hint: 'Think theme, conflict, and what happens next.' };
  });
}

function WeakDrill({ mastery, audio, onEnd, onBack }) {
  const qs = useMemo(() => buildDrill(mastery), []);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const q = qs[i];
  const onResult = (ok) => {
    mastery.record(q.skill, ok);
    const r = right + (ok ? 1 : 0);
    setRight(r);
    if (i + 1 < qs.length) setI(i + 1);
    else onEnd({ correct: r, answered: qs.length });
  };
  return (
    <div className="min-h-screen pb-10">
      <Backdrop bg={BG_PATHS.quiz} dim={0.5} />
      <TopBar title={`Weak Spot Drill · ${i + 1}/${qs.length}`} audio={audio} onBack={onBack} />
      <div className="max-w-xl mx-auto px-4">
        <MCQuestion key={i} prompt={q.prompt} choices={q.choices} answer={q.answer} hint={q.hint} audio={audio} onResult={onResult} />
      </div>
    </div>
  );
}
