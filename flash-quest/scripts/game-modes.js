// ==================== PLAY MODES ====================
// Each mode plays one round of a deck and calls onDone({ mode, correct, total, maxCombo, seconds }).

function RoundHeader({ title, step, total, onQuit, extra }) {
  return (
    <div className="w-full max-w-2xl mx-auto flex items-center gap-3 mb-4">
      <button className="fq-btn fq-btn-ghost px-3 py-2 text-sm" onClick={onQuit} aria-label="Quit round">✕</button>
      <div className="flex-1">
        <div className="flex justify-between text-sm text-indigo-200 mb-1 font-semibold">
          <span>{title}</span>
          <span>{extra || `${Math.min(step, total)} / ${total}`}</span>
        </div>
        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-500" style={{ width: `${(Math.min(step, total) / total) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function ComboBadge({ combo }) {
  if (combo < 2) return null;
  return (
    <div key={combo} className="fq-pop absolute -top-4 right-2 z-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-sm font-bold text-white shadow-lg">
      🔥 {combo} in a row
    </div>
  );
}

// ---------- Flip: classic flashcards, sorted into "Got it" / "Still learning" ----------
function FlipMode({ deck, store, reversed, audio, onDone, onQuit }) {
  const [queue, setQueue] = useState(() => store.pickCards(deck, ROUND_SIZE.flip));
  const [total] = useState(queue.length);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [stats, setStats] = useState({ correct: 0, combo: 0, maxCombo: 0, retried: new Set() });
  const card = queue[0];

  const flip = () => { audio.play('flip'); setFlipped((f) => !f); };

  const answer = (gotIt) => {
    if (!card || !flipped) return;
    const firstTry = !stats.retried.has(card);
    store.mark(deck.id, card, gotIt);
    const combo = gotIt ? stats.combo + 1 : 0;
    audio.play(gotIt ? 'correct' : 'wrong', combo);
    const next = { ...stats, combo, maxCombo: Math.max(stats.maxCombo, combo), correct: stats.correct + (gotIt && firstTry ? 1 : 0) };
    let rest = queue.slice(1);
    if (!gotIt && firstTry) {
      next.retried = new Set(stats.retried).add(card);
      rest = [...rest.slice(0, 3), card, ...rest.slice(3)];
    } else {
      setDone((d) => d + 1);
    }
    setStats(next);
    setFlipped(false);
    if (!rest.length) {
      store.save();
      onDone({ mode: 'flip', correct: next.correct, total, maxCombo: next.maxCombo });
    } else {
      setQueue(rest);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
      if (e.key === 'ArrowLeft' || e.key === '1') answer(false);
      if (e.key === 'ArrowRight' || e.key === '2') answer(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!card) return null;
  const front = reversed ? card.definition : card.term;
  const back = reversed ? card.term : card.definition;
  return (
    <div className="min-h-screen px-4 py-6 flex flex-col">
      <RoundHeader title="🃏 Flip Cards" step={done} total={total} onQuit={onQuit} />
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative w-full max-w-xl">
          <ComboBadge combo={stats.combo} />
          <button className={`fq-card-flip w-full ${flipped ? 'is-flipped' : ''}`} onClick={flip} aria-label="Flip card">
            <div className="fq-card-inner">
              <div className="fq-card-face fq-card-front">
                <span className="fq-card-hint">{reversed ? 'Definition' : 'Term'}</span>
                <span className={`font-title ${front.length > 60 ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>{front}</span>
                <span className="fq-card-tap">Tap to flip</span>
              </div>
              <div className="fq-card-face fq-card-back">
                <span className="fq-card-hint">{reversed ? 'Term' : 'Definition'}</span>
                <span className={`font-game font-bold ${back.length > 80 ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>{back}</span>
              </div>
            </div>
          </button>
        </div>
        <div className={`grid grid-cols-2 gap-3 w-full max-w-xl transition-opacity ${flipped ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
          <button className="fq-btn bg-gradient-to-r from-rose-500 to-pink-500 py-4 text-lg" onClick={() => answer(false)}>😅 Still learning</button>
          <button className="fq-btn bg-gradient-to-r from-emerald-500 to-teal-500 py-4 text-lg" onClick={() => answer(true)}>✅ Got it</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Quiz: pick the right answer out of four; misses come back once at the end ----------
function QuizMode({ deck, store, reversed, audio, onDone, onQuit }) {
  const [queue, setQueue] = useState(() => store.pickCards(deck, ROUND_SIZE.quiz));
  const [total] = useState(queue.length);
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState(null);
  const [stats, setStats] = useState({ correct: 0, combo: 0, maxCombo: 0, score: 0, missed: [] });
  const statsRef = useRef(stats);
  const [secondChance, setSecondChance] = useState(false);
  const card = queue[pos];
  const choices = useMemo(() => (card ? choicesFor(card, deck, reversed) : []), [card, pos, secondChance]);
  const answer = card && (reversed ? card.term : card.definition);

  const choose = (option) => {
    if (picked) return;
    setPicked(option);
    const right = option === answer;
    if (!secondChance) store.mark(deck.id, card, right);
    const s = statsRef.current;
    const combo = right ? s.combo + 1 : 0;
    audio.play(right ? 'correct' : 'wrong', combo);
    statsRef.current = {
      ...s,
      combo,
      maxCombo: Math.max(s.maxCombo, combo),
      correct: s.correct + (right && !secondChance ? 1 : 0),
      score: s.score + (right ? Math.round(100 * (1 + Math.min(combo, 10) * 0.1)) : 0),
      missed: right || secondChance ? s.missed : [...s.missed, card],
    };
    setStats(statsRef.current);
    if (right) setTimeout(next, 750);
  };

  const next = () => {
    setPicked(null);
    if (pos + 1 < queue.length) return setPos(pos + 1);
    const s = statsRef.current;
    if (!secondChance && s.missed.length) {
      setSecondChance(true);
      setQueue(shuffle(s.missed));
      setPos(0);
      return;
    }
    store.save();
    onDone({ mode: 'quiz', correct: s.correct, total, maxCombo: s.maxCombo, score: s.score });
  };

  if (!card) return null;
  const prompt = reversed ? card.definition : card.term;
  return (
    <div className="min-h-screen px-4 py-6 flex flex-col">
      <RoundHeader
        title={secondChance ? '🔁 Second chance' : '❓ Quiz'}
        step={secondChance ? pos : pos + (picked ? 1 : 0)}
        total={secondChance ? queue.length : total}
        onQuit={onQuit}
        extra={`⭐ ${stats.score}`}
      />
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        <div className="relative w-full max-w-2xl rounded-3xl bg-white text-indigo-950 shadow-2xl px-6 py-8 text-center">
          <ComboBadge combo={stats.combo} />
          <div className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-2">{reversed ? 'Which term matches?' : 'Pick the right answer'}</div>
          <div className={`font-title ${prompt.length > 70 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-4xl'}`}>{prompt}</div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 w-full max-w-2xl">
          {choices.map((option) => {
            const state = !picked ? '' : option === answer ? 'fq-choice-right' : option === picked ? 'fq-choice-wrong' : 'opacity-50';
            return (
              <button key={option} className={`fq-choice ${state}`} onClick={() => choose(option)} disabled={!!picked}>
                {option}
              </button>
            );
          })}
        </div>
        {picked && picked !== answer && (
          <button className="fq-btn fq-btn-primary px-8 py-3 text-lg fq-pop" onClick={next}>Got it, next →</button>
        )}
      </div>
    </div>
  );
}

// ---------- Match: clear the board by pairing terms with definitions, against the clock ----------
function MatchMode({ deck, store, audio, onDone, onQuit }) {
  const [tiles] = useState(() => {
    const pairs = store.pickCards(deck, ROUND_SIZE.match);
    return shuffle(pairs.flatMap((c, i) => [
      { id: `t${i}`, pair: i, text: c.term, kind: 'term', card: c },
      { id: `d${i}`, pair: i, text: c.definition, kind: 'def', card: c },
    ]));
  });
  const [selected, setSelected] = useState(null);
  const [cleared, setCleared] = useState(new Set());
  const [wrong, setWrong] = useState([]);
  const [penalty, setPenalty] = useState(0);
  const [misses, setMisses] = useState(new Set());
  const startRef = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const pairs = tiles.length / 2;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);

  const seconds = (now - startRef.current) / 1000 + penalty;

  const tap = (tile) => {
    if (cleared.has(tile.pair) || wrong.length) return;
    if (!selected) { audio.play('tap'); return setSelected(tile); }
    if (selected.id === tile.id) return setSelected(null);
    if (selected.kind === tile.kind) { audio.play('tap'); return setSelected(tile); }
    if (selected.pair === tile.pair) {
      audio.play('match');
      const next = new Set(cleared).add(tile.pair);
      setCleared(next);
      setSelected(null);
      if (next.size === pairs) {
        const time = Math.round(((Date.now() - startRef.current) / 1000 + penalty) * 10) / 10;
        tiles.filter((t) => t.kind === 'term').forEach((t) => store.mark(deck.id, t.card, !misses.has(t.pair)));
        const best = store.data.best[deck.id];
        if (!best || time < best) store.data.best[deck.id] = time;
        store.save();
        setTimeout(() => onDone({ mode: 'match', correct: pairs - misses.size, total: pairs, maxCombo: 0, seconds: time, newBest: !best || time < best }), 450);
      }
    } else {
      audio.play('wrong');
      setWrong([selected.id, tile.id]);
      setMisses(new Set(misses).add(selected.pair).add(tile.pair));
      setPenalty((p) => p + 2);
      setTimeout(() => { setWrong([]); setSelected(null); }, 600);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 flex flex-col">
      <RoundHeader title="⚡ Match" step={cleared.size} total={pairs} onQuit={onQuit} extra={`⏱ ${seconds.toFixed(1)}s`} />
      <p className="text-center text-indigo-200 text-sm mb-3">Tap a term, then its definition. Wrong pairs add 2 seconds.</p>
      <div className="w-full max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 content-center">
        {tiles.map((tile) => {
          const gone = cleared.has(tile.pair);
          const isSel = selected && selected.id === tile.id;
          const isWrong = wrong.includes(tile.id);
          return (
            <button
              key={tile.id}
              onClick={() => tap(tile)}
              className={`fq-tile ${tile.kind === 'term' ? 'fq-tile-term' : 'fq-tile-def'} ${isSel ? 'fq-tile-selected' : ''} ${isWrong ? 'fq-shake' : ''} ${gone ? 'fq-tile-gone' : ''}`}
              disabled={gone}
            >
              <span className={tile.text.length > 60 ? 'text-sm' : tile.text.length > 30 ? 'text-base' : 'text-lg font-bold'}>{tile.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
