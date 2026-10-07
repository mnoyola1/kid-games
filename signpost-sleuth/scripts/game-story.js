// ==================== CASE FILES (story reader) ====================
// Read a story paragraph by paragraph. Tap the sentence where a signpost appears to STOP,
// then name it, pick the anchor question, and choose the best sticky note.

const stopKey = (p, type) => `${p}_${type}`;
const caseMaxScore = (c) => c.paragraphs.reduce((n, p) => n + (p.stops || []).length, 0) *
  (CASE_SCORING.stop + CASE_SCORING.sign + CASE_SCORING.ask + CASE_SCORING.note);

function StopPanel({ caseId, p, stop, sentence, missed, audio, mastery, onScore, onDone }) {
  const sp = SP_BY_ID[stop.type];
  const [step, setStep] = useState('sign');
  const [wrongSigns, setWrongSigns] = useState([]);
  const [hintSign, setHintSign] = useState(null);
  const askChoices = useMemo(() => [sp.ask, ...shuffle(SIGNPOSTS.filter(o => o.id !== sp.id)).slice(0, 3).map(o => o.ask)], [stop]);
  const noteChoices = useMemo(() => [stop.note.a, ...stop.note.wrong], [stop]);
  const panelRef = useRef(null);

  useEffect(() => {
    if (missed) audio.say('n_missed', CONTENT.narration.missed);
  }, []);

  const pickSign = (id, e) => {
    const pos = Juice.fromEvent(e);
    if (id === stop.type) {
      const first = wrongSigns.length === 0;
      mastery.record(`${sp.id}_spot`, first && !missed);
      audio.sfx('stamp');
      Juice.confetti(pos.x, pos.y, { count: 16, spread: 170 });
      if (first && !missed) onScore(CASE_SCORING.sign, pos);
      setStep('why');
      audio.say(`why_${caseId}_${p}_${stop.type}`, stop.why);
    } else {
      setWrongSigns(w => [...w, id]);
      setHintSign(id);
      audio.sfx('wrong');
      Juice.shake(panelRef.current);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/45 p-2 sm:p-4">
      <div ref={panelRef} className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-4 sm:p-5 ps-pop">
        <div className={cx('rounded-2xl px-3 py-2 mb-3 font-story text-stone-800', missed ? 'bg-rose-50 border border-rose-200' : 'bg-amber-50 border border-amber-200')}>
          <div className={cx('text-xs font-bold uppercase tracking-wide mb-1', missed ? 'text-rose-600' : 'text-amber-700')}>
            {missed ? '🚗💨 You drove past a signpost!' : '🛑 You stopped here'}
          </div>
          <span data-stop-sentence>{sentence}</span>
        </div>

        {step === 'sign' && (
          <div>
            <div className="font-title text-xl text-stone-800 mb-2">Which signpost is this?</div>
            <SignPicker onPick={pickSign} disabledIds={wrongSigns} compact />
            {hintSign && (
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-amber-900 text-sm font-semibold ps-drop">
                💡 {SP_BY_ID[hintSign].name} is when: {SP_BY_ID[hintSign].when.toLowerCase()} Does that match this sentence?
                {wrongSigns.length >= 2 && <div className="mt-1">Clue words to look for: {sp.clues.join(' / ')}</div>}
              </div>
            )}
          </div>
        )}

        {step === 'why' && (
          <div className="ps-rise">
            <div className="flex items-center gap-3 mb-2">
              <SignpostSign id={sp.id} size={56} className="ps-stamp" />
              <div className="font-title text-2xl text-stone-800">{sp.name}!</div>
            </div>
            <div className="text-stone-700 font-semibold mb-3">{stop.why}
              <SpeakButton audio={audio} voiceKey={`why_${caseId}_${p}_${stop.type}`} text={stop.why} className="ml-2 !py-0.5" />
            </div>
            <BigButton color="green" onClick={() => { audio.sfx('tap'); setStep('ask'); }}>Next: what do I ask? →</BigButton>
          </div>
        )}

        {step === 'ask' && (
          <MCQuestion prompt={`You found a ${sp.name}. What should you stop and ask yourself?`} choices={askChoices} answer={sp.ask}
            hint={`A ${sp.name} is when ${sp.when.charAt(0).toLowerCase() + sp.when.slice(1)}`} audio={audio}
            onResult={(ok) => { mastery.record(`${sp.id}_ask`, ok); if (ok && !missed) onScore(CASE_SCORING.ask); setStep('note'); }} />
        )}

        {step === 'note' && (
          <MCQuestion prompt={`Sticky note time! "${sp.ask}" Pick the best answer.`} choices={noteChoices} answer={stop.note.a}
            hint={`The best answer connects to the story's big picture: ${sp.tellsShort.toLowerCase()}.`} audio={audio}
            onResult={(ok) => { mastery.record(`${sp.id}_tells`, ok); if (ok && !missed) onScore(CASE_SCORING.note); setStep('done'); }} />
        )}

        {step === 'done' && (
          <div className="text-center ps-rise">
            <div className="ps-sticky rounded-sm p-4 text-left mx-auto max-w-sm rotate-1">
              <div className="flex items-center gap-2 mb-1"><SignpostSign id={sp.id} size={34} /><span className="font-title font-semibold text-stone-800">{sp.name}</span></div>
              <div className="font-hand text-2xl text-stone-700 leading-tight">{sp.ask}</div>
              <div className="font-hand text-2xl text-stone-900 leading-tight mt-1">→ {stop.note.a}</div>
            </div>
            <BigButton color="amber" className="mt-4" onClick={(e) => { audio.sfx('sticky'); onDone({ type: sp.id, ask: sp.ask, answer: stop.note.a }); }}>Stick it! 📌</BigButton>
          </div>
        )}
      </div>
    </div>
  );
}

function StoryReader({ story, audio, mastery, onEnd, onQuit }) {
  const [shown, setShown] = useState(1);
  const [resolved, setResolved] = useState({});      // stopKey -> 'found' | 'missed'
  const [active, setActive] = useState(null);         // { p, stop, missed }
  const [queue, setQueue] = useState([]);              // missed stops waiting to be shown
  const [falseTaps, setFalseTaps] = useState({});
  const [echoes, setEchoes] = useState({});
  const [flash, setFlash] = useState(null);
  const [toast, setToast] = useState(null);
  const [score, setScore] = useState(0);
  const [notes, setNotes] = useState([]);
  const [finished, setFinished] = useState(false);
  const paraRefs = useRef([]);
  const toastTimer = useRef(null);

  const totalStops = useMemo(() => story.paragraphs.reduce((n, p) => n + (p.stops || []).length, 0), [story]);
  const foundTypes = Object.entries(resolved).filter(([, v]) => v === 'found').map(([k]) => k.split('_')[1]);
  const lastPara = shown - 1;
  const atEnd = shown >= story.paragraphs.length;

  useEffect(() => {
    const el = paraRefs.current[shown - 1];
    if (el && shown > 1) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [shown]);

  const showToast = (text, tone = 'info') => {
    clearTimeout(toastTimer.current);
    setToast({ text, tone });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const addScore = (n, pos) => {
    setScore(s => Math.max(0, s + n));
    const p = pos || { x: window.innerWidth / 2, y: window.innerHeight * 0.3 };
    Juice.floatText(p.x, p.y, n > 0 ? `+${n}` : `${n}`, n > 0 ? '#fde047' : '#fca5a5');
  };

  const tap = (pi, si, e) => {
    if (active || finished) return;
    const para = story.paragraphs[pi];
    const pos = { x: e.clientX, y: e.clientY };
    const hit = (para.stops || []).find(st => st.at === si || (st.alt || []).includes(si));
    if (hit) {
      const key = stopKey(pi, hit.type);
      if (resolved[key]) return;
      audio.sfx('stop');
      addScore(CASE_SCORING.stop, pos);
      Juice.confetti(pos.x, pos.y, { count: 18, spread: 180 });
      setActive({ p: pi, stop: hit, missed: false });
      return;
    }
    if ((para.early || []).includes(si)) {
      setEchoes(x => ({ ...x, [`${pi}_${si}`]: true }));
      audio.sfx('tap');
      showToast('👀 Good eye! That keeps coming up. If it shows up again and again, it\'s a signpost.', 'good');
      return;
    }
    const fk = `${pi}_${si}`;
    setFlash(fk);
    setTimeout(() => setFlash(f => (f === fk ? null : f)), 500);
    audio.sfx('wrong', { volume: 0.6 });
    showToast(CONTENT.narration.false_stop, 'bad');
    if (!falseTaps[fk]) {
      setFalseTaps(x => ({ ...x, [fk]: true }));
      addScore(CASE_SCORING.falseStop, pos);
    }
  };

  const unresolvedIn = (pi) => (story.paragraphs[pi].stops || []).filter(st => !resolved[stopKey(pi, st.type)]);

  const advance = () => {
    if (active) return;
    const missed = unresolvedIn(lastPara);
    if (missed.length) {
      audio.sfx('whoosh');
      setActive({ p: lastPara, stop: missed[0], missed: true });
      setQueue(missed.slice(1).map(st => ({ p: lastPara, stop: st, missed: true })));
      return;
    }
    if (atEnd) { finish(); return; }
    audio.sfx('page');
    setShown(n => n + 1);
  };

  const closeStop = (note) => {
    const key = stopKey(active.p, active.stop.type);
    const next = { ...resolved, [key]: active.missed ? 'missed' : 'found' };
    setResolved(next);
    setNotes(n => [...n, { ...note, missed: active.missed }]);
    if (queue.length) {
      setActive(queue[0]);
      setQueue(queue.slice(1));
      return;
    }
    const wasMissed = active.missed;
    setActive(null);
    if (wasMissed) {
      if (atEnd) finish(next);
      else { audio.sfx('page'); setShown(n => n + 1); }
    }
  };

  const finish = (res = resolved) => {
    setFinished(true);
    const found = Object.values(res).filter(v => v === 'found').length;
    const max = caseMaxScore(story);
    const pct = max ? score / max : 0;
    const stars = pct >= 0.85 ? 3 : pct >= 0.6 ? 2 : 1;
    onEnd({ caseId: story.id, score, max, stars, found, total: totalStops, notes, falseStops: Object.keys(falseTaps).length });
  };

  const sentenceClass = (pi, si) => {
    const para = story.paragraphs[pi];
    const hit = (para.stops || []).find(st => st.at === si || (st.alt || []).includes(si));
    if (hit && resolved[stopKey(pi, hit.type)] && hit.at === si) return resolved[stopKey(pi, hit.type)];
    if (echoes[`${pi}_${si}`]) return 'echo';
    if (flash === `${pi}_${si}`) return 'false';
    return '';
  };

  return (
    <div className="min-h-screen pb-36">
      <Backdrop bg={BG_PATHS[story.bg]} dim={0.35} />
      <TopBar title={story.title} audio={audio} onBack={onQuit}
        right={<div className="rounded-xl bg-black/35 text-amber-200 font-title px-3 py-2">⭐ {score}</div>} />
      <div className="max-w-2xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-center gap-1.5 mb-3 bg-black/30 rounded-2xl py-2">
          <span className="text-amber-50 text-sm font-bold mr-1">Found:</span>
          {SIGNPOSTS.map(sp => (
            <div key={sp.id} className={cx('transition-all duration-500', foundTypes.includes(sp.id) ? 'opacity-100 scale-100' : 'opacity-25 grayscale scale-90')}>
              <SignpostSign id={sp.id} size={30} />
            </div>
          ))}
          <span className="text-amber-50 text-sm font-bold ml-1">{Object.keys(resolved).length}/{totalStops}</span>
        </div>
        <div className="ps-paper rounded-3xl shadow-2xl px-4 py-5 sm:px-7 sm:py-6">
          {story.paragraphs.slice(0, shown).map((para, pi) => (
            <div key={pi} ref={el => { paraRefs.current[pi] = el; }} className={cx('relative mb-5 ps-rise', pi === lastPara && 'pr-1')}>
              <p className="font-story text-[1.15rem] sm:text-xl leading-[2rem] text-stone-800 indent-6">
                {para.s.map((sent, si) => (
                  <React.Fragment key={si}>
                    <span className={cx('ps-sentence', sentenceClass(pi, si))} onClick={(e) => tap(pi, si, e)}>{sent}</span>{' '}
                  </React.Fragment>
                ))}
              </p>
              <div className="flex justify-end -mt-1">
                <SpeakButton audio={audio} voiceKey={`p_${story.id}_${pi}`} text={para.s.join(' ')} className="!bg-stone-100 !text-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div className={cx('fixed left-1/2 -translate-x-1/2 bottom-28 z-30 max-w-md w-[92%] rounded-2xl px-4 py-3 shadow-xl font-semibold text-center ps-drop',
          toast.tone === 'bad' ? 'bg-rose-100 text-rose-900' : toast.tone === 'good' ? 'bg-emerald-100 text-emerald-900' : 'bg-white text-stone-800')}>{toast.text}</div>
      )}

      {!finished && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-gradient-to-t from-stone-900/90 to-transparent pt-6 pb-4 px-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="flex-1 text-amber-50 text-sm font-semibold leading-snug">
              Tap a sentence to <b>STOP</b> when you spot a signpost. Paragraph {shown} of {story.paragraphs.length}.
            </div>
            <BigButton color="green" onClick={advance}>{atEnd ? 'Finish case ✔' : 'Keep reading ▶'}</BigButton>
          </div>
        </div>
      )}

      {active && (
        <StopPanel key={stopKey(active.p, active.stop.type) + (active.missed ? 'm' : 'f')} caseId={story.id} p={active.p} stop={active.stop}
          sentence={story.paragraphs[active.p].s[active.stop.at]} missed={active.missed} audio={audio} mastery={mastery}
          onScore={addScore} onDone={closeStop} />
      )}
    </div>
  );
}

function CaseResult({ result, story, audio, onRetry, onCases, onNext }) {
  useEffect(() => {
    audio.sfx('fanfare');
    if (result.stars >= 2) setTimeout(() => Juice.confetti(window.innerWidth / 2, window.innerHeight / 3, { count: 44 }), 300);
  }, []);
  return (
    <div className="min-h-screen pb-10">
      <Backdrop bg={BG_PATHS[story.bg]} dim={0.55} />
      <div className="max-w-xl mx-auto px-4 pt-8">
        <div className="bg-white/95 rounded-3xl shadow-2xl p-6 text-center ps-pop">
          <div className="text-sm font-bold uppercase tracking-wider text-stone-500">Case closed</div>
          <div className="font-title text-3xl text-stone-800">{story.title}</div>
          <Stars n={result.stars} />
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="rounded-2xl bg-amber-50 p-2"><div className="font-title text-2xl text-amber-700">{result.score}</div><div className="text-xs font-bold text-stone-500">points</div></div>
            <div className="rounded-2xl bg-emerald-50 p-2"><div className="font-title text-2xl text-emerald-700">{result.found}/{result.total}</div><div className="text-xs font-bold text-stone-500">spotted</div></div>
            <div className="rounded-2xl bg-rose-50 p-2"><div className="font-title text-2xl text-rose-600">{result.falseStops}</div><div className="text-xs font-bold text-stone-500">false alarms</div></div>
          </div>
        </div>
        <div className="font-title text-xl text-amber-50 ps-title-shadow mt-6 mb-2">Your sticky notes</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {result.notes.map((n, k) => (
            <div key={k} className="ps-sticky rounded-sm p-3 ps-rise" style={{ transform: `rotate(${k % 2 ? 1.2 : -1.2}deg)`, animationDelay: `${k * 0.08}s` }}>
              <div className="flex items-center gap-2"><SignpostSign id={n.type} size={28} /><span className="font-title font-semibold text-stone-800 text-sm">{SP_BY_ID[n.type].name}</span>{n.missed && <span className="text-xs font-bold text-rose-700 ml-auto">missed</span>}</div>
              <div className="font-hand text-xl text-stone-700 leading-tight mt-1">{n.ask}</div>
              <div className="font-hand text-xl text-stone-900 leading-tight">→ {n.answer}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <BigButton color="paper" onClick={onRetry}>Read again</BigButton>
          <BigButton color="sky" onClick={onCases}>All cases</BigButton>
          {onNext && <BigButton color="green" onClick={onNext}>Next case →</BigButton>}
        </div>
      </div>
    </div>
  );
}

function CaseList({ mastery, audio, onPick, onBack }) {
  return (
    <div className="min-h-screen pb-10">
      <Backdrop bg={BG_PATHS.title} dim={0.5} />
      <TopBar title="Case Files" audio={audio} onBack={onBack} />
      <div className="max-w-2xl mx-auto px-4">
        <SageSays audio={audio} voiceKey="n_case_intro" text={CONTENT.narration.case_intro} small />
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          {STORIES.cases.map((c, k) => {
            const rec = mastery.data.cases[c.id];
            return (
              <button key={c.id} onClick={() => { audio.sfx('page'); onPick(k); }} style={{ animationDelay: `${k * 0.07}s` }}
                className="ps-btn ps-rise text-left rounded-3xl overflow-hidden shadow-xl bg-white">
                <div className="h-28 bg-stone-300 relative">
                  <img src={BG_PATHS[c.bg]} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <div className="absolute top-2 left-2 rounded-full bg-black/55 text-amber-100 text-xs font-bold px-2 py-1">Case #{k + 1}</div>
                  {rec && <div className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-sm">{'⭐'.repeat(rec.stars)}{'☆'.repeat(3 - rec.stars)}</div>}
                </div>
                <div className="p-3">
                  <div className="font-title text-xl text-stone-800">{c.title}</div>
                  <div className="text-sm text-stone-600 font-semibold">{c.blurb}</div>
                  {rec && <div className="text-xs font-bold text-stone-400 mt-1">Best: {rec.best} points</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
