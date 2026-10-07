// ==================== SPEED SIGNS ====================
// Timed arcade round: a story moment flies in, tap the matching signpost.
// Right answers add time and build a combo multiplier; misses cost time and show the right sign.

const SPEED_STAR_SCORES = [1200, 2400, 3800];

function comboMultiplier(combo) {
  return Math.min(3, 1 + Math.floor(combo / 3) * 0.5);
}

function SpeedSigns({ audio, mastery, onEnd, onBack }) {
  const [phase, setPhase] = useState('intro');
  const [count, setCount] = useState(3);
  const [timeLeft, setTimeLeft] = useState(SPEED_TUNING.duration);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [stats, setStats] = useState({ correct: 0, answered: 0, maxCombo: 0 });
  const [card, setCard] = useState(null);
  const [cardKey, setCardKey] = useState(0);
  const [reveal, setReveal] = useState(null);
  const deckRef = useRef([]);
  const shownAt = useRef(0);
  const lockRef = useRef(false);
  const stageRef = useRef(null);
  const endedRef = useRef(false);

  const drawCard = () => {
    if (!deckRef.current.length) deckRef.current = orderByNeed(STORIES.speed, mastery, c => `${c.answer}_spot`);
    const next = deckRef.current.shift();
    setCard(next);
    setCardKey(k => k + 1);
    shownAt.current = performance.now();
    lockRef.current = false;
  };

  useEffect(() => {
    if (phase !== 'count') return;
    if (count === 0) { setPhase('play'); drawCard(); return; }
    audio.sfx('tap', { rate: 1 + (3 - count) * 0.15 });
    const t = setTimeout(() => setCount(c => c - 1), 700);
    return () => clearTimeout(t);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== 'play') return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      setTimeLeft(t => Math.max(0, t - dt));
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'play' && timeLeft <= 0 && !endedRef.current) {
      endedRef.current = true;
      setPhase('over');
      audio.sfx('fanfare');
      onEnd({ score, ...stats });
    }
  }, [timeLeft, phase]);

  const pick = (id, e) => {
    if (phase !== 'play' || lockRef.current || !card) return;
    lockRef.current = true;
    const pos = Juice.fromEvent(e);
    const ok = id === card.answer;
    mastery.record(`${card.answer}_spot`, ok, 0.5);
    if (ok) {
      const fast = (performance.now() - shownAt.current) / 1000 < SPEED_TUNING.fastAnswer;
      const mult = comboMultiplier(combo + 1);
      const pts = Math.round(SPEED_TUNING.basePoints * mult) + (fast ? 50 : 0);
      setScore(s => s + pts);
      setCombo(c => c + 1);
      setStats(s => ({ correct: s.correct + 1, answered: s.answered + 1, maxCombo: Math.max(s.maxCombo, combo + 1) }));
      setTimeLeft(t => Math.min(SPEED_TUNING.duration, t + SPEED_TUNING.correctBonusTime));
      audio.sfx('correct', { rate: 1 + Math.min(combo, 10) * 0.04 });
      Juice.floatText(pos.x, pos.y, `+${pts}${fast ? ' ⚡' : ''}`);
      Juice.confetti(pos.x, pos.y, { count: 10 + Math.min(combo, 10) * 2, spread: 150 });
      setTimeout(() => { audio.sfx('whoosh', { volume: 0.5 }); drawCard(); }, 220);
    } else {
      setCombo(0);
      setStats(s => ({ ...s, answered: s.answered + 1 }));
      setTimeLeft(t => Math.max(0, t - SPEED_TUNING.wrongPenaltyTime));
      audio.sfx('wrong');
      Juice.floatText(pos.x, pos.y, `-${SPEED_TUNING.wrongPenaltyTime}s`, '#fca5a5');
      Juice.shake(stageRef.current);
      setReveal(card.answer);
      setTimeout(() => { setReveal(null); drawCard(); }, SPEED_TUNING.wrongPause * 1000);
    }
  };

  const start = () => {
    audio.stopVoice();
    endedRef.current = false;
    deckRef.current = [];
    setScore(0); setCombo(0); setStats({ correct: 0, answered: 0, maxCombo: 0 });
    setTimeLeft(SPEED_TUNING.duration);
    setCount(3);
    setPhase('count');
  };

  const stars = SPEED_STAR_SCORES.filter(s => score >= s).length;
  const timePct = Math.min(100, (timeLeft / SPEED_TUNING.duration) * 100);

  return (
    <div className="min-h-screen pb-6 flex flex-col">
      <Backdrop bg={BG_PATHS.speed} dim={0.4} />
      <TopBar title="Speed Signs" audio={audio} onBack={onBack}
        right={phase === 'play' && <div className="rounded-xl bg-black/40 text-amber-200 font-title px-3 py-2">⭐ {score}</div>} />

      {phase === 'intro' && (
        <div className="max-w-xl mx-auto px-4 mt-4 w-full">
          <SageSays audio={audio} voiceKey="n_speed_intro" text={CONTENT.narration.speed_intro} />
          <div className="bg-white/95 rounded-3xl shadow-xl p-5 mt-4 ps-rise">
            <div className="font-title text-xl text-stone-800 mb-2">How to play</div>
            <ul className="space-y-1 text-stone-700 font-semibold">
              <li>🚗 A story moment drives in. Tap the signpost that matches.</li>
              <li>⏱️ Right answers add {SPEED_TUNING.correctBonusTime} seconds. Misses cost {SPEED_TUNING.wrongPenaltyTime}.</li>
              <li>🔥 Every 3 in a row raises your multiplier (up to 3×).</li>
              <li>⚡ Answer within {SPEED_TUNING.fastAnswer} seconds for a speed bonus.</li>
            </ul>
            <div className="text-sm text-stone-500 font-bold mt-3">Best score: {mastery.data.speedBest || 0}</div>
            <BigButton color="green" className="mt-4 w-full" onClick={start}>Start engines! 🏁</BigButton>
          </div>
        </div>
      )}

      {phase === 'count' && (
        <div className="flex-1 flex items-center justify-center">
          <div key={count} className="font-title text-9xl text-amber-200 ps-title-shadow ps-pop">{count || 'GO!'}</div>
        </div>
      )}

      {phase === 'play' && card && (
        <div ref={stageRef} className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-4 bg-black/40 rounded-full overflow-hidden">
              <div className={cx('h-full rounded-full transition-[width] duration-100', timeLeft < 10 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-300 to-emerald-400')} style={{ width: `${timePct}%` }} />
            </div>
            <div className={cx('font-title text-2xl w-14 text-right', timeLeft < 10 ? 'text-rose-300' : 'text-amber-50')}>{Math.ceil(timeLeft)}s</div>
          </div>
          <div className="h-8 text-center">
            {combo >= 2 && <span key={combo} className="inline-block font-title text-xl text-orange-300 ps-title-shadow ps-pop">🔥 {combo} in a row · {comboMultiplier(combo)}×</span>}
          </div>
          <div className="relative flex-1 min-h-[220px] flex items-center justify-center">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-24 bg-stone-700/70 rounded-t-3xl">
              <div className="ps-road absolute inset-0" />
            </div>
            <div key={cardKey} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-5 ps-card-in">
              <div className="font-story text-xl sm:text-2xl text-stone-800 leading-snug text-center">{card.text}</div>
              {reveal && (
                <div className="mt-3 flex items-center gap-2 justify-center rounded-2xl bg-emerald-50 border border-emerald-300 p-2 ps-drop">
                  <SignpostSign id={reveal} size={36} />
                  <div className="text-left text-sm font-semibold text-emerald-900"><b>{SP_BY_ID[reveal].name}:</b> {SP_BY_ID[reveal].when}</div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3">
            <SignPicker onPick={pick} correctId={reveal} compact />
          </div>
        </div>
      )}

      {phase === 'over' && (
        <div className="max-w-md mx-auto px-4 mt-8 w-full">
          <div className="bg-white/95 rounded-3xl shadow-2xl p-6 text-center ps-pop">
            <div className="font-title text-3xl text-stone-800">Time's up!</div>
            <Stars n={stars} />
            <div className="font-title text-5xl text-amber-600 mt-2">{score}</div>
            <div className="text-stone-500 font-bold">{score >= (mastery.data.speedBest || 0) && score > 0 ? '🏆 New best!' : `Best: ${mastery.data.speedBest}`}</div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="rounded-2xl bg-emerald-50 p-2"><div className="font-title text-2xl text-emerald-700">{stats.correct}</div><div className="text-xs font-bold text-stone-500">correct</div></div>
              <div className="rounded-2xl bg-amber-50 p-2"><div className="font-title text-2xl text-amber-700">{stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0}%</div><div className="text-xs font-bold text-stone-500">accuracy</div></div>
              <div className="rounded-2xl bg-orange-50 p-2"><div className="font-title text-2xl text-orange-600">{stats.maxCombo}</div><div className="text-xs font-bold text-stone-500">best combo</div></div>
            </div>
            <div className="flex gap-3 justify-center mt-5">
              <BigButton color="paper" onClick={onBack}>Home</BigButton>
              <BigButton color="green" onClick={start}>Race again</BigButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
