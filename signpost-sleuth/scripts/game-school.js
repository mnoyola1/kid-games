// ==================== SIGN SCHOOL ====================
// Learn each signpost from a lesson card, then pass a 4-question badge check.

function buildBadgeChecks(sp) {
  const others = shuffle(SIGNPOSTS.filter(o => o.id !== sp.id));
  const pickCard = (type) => shuffle(STORIES.speed.filter(c => c.answer === type))[0].text;
  return [
    {
      skill: `${sp.id}_def`,
      prompt: `When does a ${sp.name} signpost show up? When you're reading and...`,
      answer: sp.when,
      choices: [sp.when, others[0].when, others[1].when],
      hint: `Clue words: ${sp.clues.join(' / ')}`,
    },
    {
      skill: `${sp.id}_ask`,
      prompt: `You spotted a ${sp.name}! What should you stop and ask yourself?`,
      answer: sp.ask,
      choices: [sp.ask, ...others.slice(0, 3).map(o => o.ask)],
      hint: `Think about what just happened: ${sp.when.charAt(0).toLowerCase() + sp.when.slice(1)}`,
    },
    {
      skill: `${sp.id}_tells`,
      prompt: `What does a ${sp.name} help you figure out?`,
      answer: sp.tellsShort,
      choices: [sp.tellsShort, ...shuffle(CONTENT.school.tellsDistractors).slice(0, 2)],
      hint: 'Signposts point to the big parts of a story: the theme, the conflict, and what might happen next.',
    },
    {
      skill: `${sp.id}_spot`,
      prompt: `Which one of these is a ${sp.name}?`,
      answer: pickCard(sp.id),
      choices: null,
      hint: `Look for the moment when ${sp.when.charAt(0).toLowerCase() + sp.when.slice(1)}`,
      others: [pickCard(others[0].id), pickCard(others[1].id)],
    },
  ].map(c => (c.choices ? c : { ...c, choices: [c.answer, ...c.others] }));
}

function LessonCard({ sp, audio }) {
  useEffect(() => { audio.say(`card_${sp.id}`, `${sp.name}. When you're reading and... ${sp.when}`); }, [sp.id]);
  return (
    <div className="ps-paper rounded-3xl shadow-2xl p-5 sm:p-6 ps-pop">
      <div className="flex items-center gap-4 mb-4">
        <SignpostSign id={sp.id} size={72} className="shrink-0" />
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500">Signpost</div>
          <div className="font-title text-3xl text-stone-800 leading-tight">{sp.name}</div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="rounded-2xl bg-white/80 p-3 border border-stone-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-stone-500">👀 When you're reading and...</div>
            <SpeakButton audio={audio} voiceKey={`card_${sp.id}`} text={`${sp.name}. When you're reading and... ${sp.when}`} />
          </div>
          <div className="font-story text-lg text-stone-800 mt-1">{sp.when}</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {sp.clues.map(c => <span key={c} className="text-xs font-bold rounded-full px-2 py-1 bg-amber-100 text-amber-900">{c}</span>)}
          </div>
        </div>
        <div className="ps-sticky rounded-sm p-3 -rotate-1">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-amber-900">🛑 Stop and ask yourself:</div>
            <SpeakButton audio={audio} voiceKey={`ask_${sp.id}`} text={`Stop and ask yourself: ${sp.ask}`} />
          </div>
          <div className="font-hand text-3xl text-stone-800 leading-tight mt-1">"{sp.ask}"</div>
        </div>
        <div className="rounded-2xl bg-white/80 p-3 border border-stone-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-stone-500">🔎 What it tells you</div>
            <SpeakButton audio={audio} voiceKey={`tells_${sp.id}`} text={sp.tells} />
          </div>
          <div className="text-stone-800 font-semibold mt-1">{sp.tells}</div>
        </div>
        <div className="rounded-2xl bg-sky-50 p-3 border border-sky-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-sky-700">🎬 Example</div>
            <SpeakButton audio={audio} voiceKey={`ex_${sp.id}`} text={sp.example} />
          </div>
          <div className="text-stone-800 mt-1">{sp.example}</div>
        </div>
      </div>
    </div>
  );
}

function BadgeCheck({ sp, audio, mastery, onDone }) {
  const checks = useMemo(() => buildBadgeChecks(sp), [sp.id]);
  const [i, setI] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const c = checks[i];

  const onResult = (ok) => {
    mastery.record(c.skill, ok);
    const n = firstTry + (ok ? 1 : 0);
    setFirstTry(n);
    if (i + 1 < checks.length) setI(i + 1);
    else onDone(n, checks.length);
  };

  return (
    <div>
      <div className="flex justify-center gap-2 mb-3">
        {checks.map((_, k) => <div key={k} className={cx('h-2.5 w-10 rounded-full', k < i ? 'bg-emerald-400' : k === i ? 'bg-amber-300' : 'bg-white/30')} />)}
      </div>
      <MCQuestion key={`${sp.id}-${i}`} prompt={c.prompt} choices={c.choices} answer={c.answer} hint={c.hint} audio={audio} onResult={onResult}
        header={<div className="flex items-center gap-2 mb-2"><SignpostSign id={sp.id} size={34} /><span className="text-sm font-bold text-stone-500">Badge check {i + 1} of {checks.length}</span></div>} />
    </div>
  );
}

const BADGE_PASS = 3;

function BadgeEarned({ sp, score, total, isNew, passed, audio, onNext, onAgain, onRetry }) {
  useEffect(() => {
    if (!passed) { audio.sfx('page'); return; }
    audio.sfx('stamp');
    setTimeout(() => audio.sfx('fanfare'), 250);
    Juice.confetti(window.innerWidth / 2, window.innerHeight / 3, { count: 40 });
  }, []);
  return (
    <div className="text-center bg-white/95 rounded-3xl shadow-2xl p-6 ps-pop">
      <div className="relative inline-block">
        <SignpostSign id={sp.id} size={120} className={passed ? 'ps-stamp' : 'opacity-40 grayscale'} />
      </div>
      <div className="font-title text-3xl text-stone-800 mt-2">{!passed ? 'Almost there!' : isNew ? 'Badge earned!' : 'Badge check passed!'}</div>
      <div className="text-stone-600 font-semibold mt-1">{sp.name}: {score} of {total} on the first try</div>
      {passed ? <Stars n={score >= total ? 3 : 2} /> : (
        <div className="text-stone-600 mt-2">Get {BADGE_PASS} of {total} on the first try to earn the badge. Read the card again, then try another check.</div>
      )}
      <div className="flex flex-wrap gap-3 justify-center mt-5">
        <BigButton color="paper" onClick={onAgain}>Review card</BigButton>
        {passed ? <BigButton color="green" onClick={onNext}>Next signpost →</BigButton> : <BigButton color="green" onClick={onRetry}>Try again</BigButton>}
      </div>
    </div>
  );
}

function SignSchool({ audio, mastery, onBadge, onBack }) {
  const [spId, setSpId] = useState(null);
  const [phase, setPhase] = useState('list');
  const [result, setResult] = useState(null);
  const [checkRun, setCheckRun] = useState(0);
  const sp = spId && SP_BY_ID[spId];
  const badges = mastery.data.badges;

  const open = (id) => { audio.sfx('page'); setSpId(id); setPhase('card'); };
  const nextSp = () => {
    const idx = SIGNPOSTS.findIndex(s => s.id === spId);
    const next = SIGNPOSTS.slice(idx + 1).concat(SIGNPOSTS.slice(0, idx + 1)).find(s => !mastery.data.badges.includes(s.id));
    if (next) open(next.id); else { setPhase('list'); setSpId(null); }
  };

  return (
    <div className="min-h-screen pb-10">
      <Backdrop bg={BG_PATHS.quiz} dim={0.5} />
      <TopBar title="Sign School" audio={audio} onBack={phase === 'list' ? onBack : () => { setPhase('list'); setSpId(null); }} />
      <div className="max-w-2xl mx-auto px-4">
        {phase === 'list' && (
          <>
            <SageSays audio={audio} voiceKey="n_school_intro" text={CONTENT.narration.school_intro} small />
            <div className="ps-paper rounded-3xl shadow-xl p-4 mt-4 ps-rise">
              <div className="font-title text-xl text-stone-800 mb-1">Good readers...</div>
              <div className="flex gap-2 mb-2">
                {CONTENT.goodReaders.steps.map((s, k) => (
                  <div key={s} className={cx('flex-1 text-center rounded-xl py-2 font-title text-xl text-white', ['bg-red-500', 'bg-amber-500', 'bg-emerald-500'][k])}>{s}</div>
                ))}
              </div>
              <div className="text-stone-700 text-sm font-semibold">{CONTENT.goodReaders.why}
                <SpeakButton audio={audio} voiceKey="n_good_readers" text={CONTENT.goodReaders.why} className="ml-2 !py-0.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {SIGNPOSTS.map((s, k) => {
                const has = badges.includes(s.id);
                return (
                  <button key={s.id} onClick={() => open(s.id)} style={{ animationDelay: `${k * 0.05}s` }}
                    className={cx('ps-btn ps-rise relative rounded-3xl p-3 shadow-lg text-center border-4', has ? 'bg-white border-emerald-400' : 'bg-white/90 border-transparent')}>
                    <SignpostSign id={s.id} size={64} className="mx-auto" />
                    <div className="font-title font-semibold text-stone-800 mt-1 leading-tight">{s.name}</div>
                    <div className="text-xs font-bold mt-1 text-stone-500">{has ? '✅ Badge earned' : 'Learn it →'}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}
        {phase === 'card' && sp && (
          <>
            <LessonCard sp={sp} audio={audio} />
            <div className="flex justify-center mt-4">
              <BigButton color="green" onClick={() => { audio.stopVoice(); audio.sfx('tap'); setPhase('check'); }}>I'm ready: badge check →</BigButton>
            </div>
          </>
        )}
        {phase === 'check' && sp && (
          <BadgeCheck key={checkRun} sp={sp} audio={audio} mastery={mastery} onDone={(score, total) => {
            const passed = score >= BADGE_PASS;
            const isNew = onBadge(sp.id, score, total, passed);
            setResult({ score, total, isNew, passed });
            setPhase('earned');
          }} />
        )}
        {phase === 'earned' && sp && result && (
          <BadgeEarned sp={sp} {...result} audio={audio} onNext={nextSp} onAgain={() => setPhase('card')}
            onRetry={() => { setCheckRun(r => r + 1); setPhase('check'); }} />
        )}
      </div>
    </div>
  );
}
