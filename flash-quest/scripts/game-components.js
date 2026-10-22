// ==================== SCREENS ====================

function MasteryBar({ value }) {
  return (
    <div className="h-2.5 rounded-full bg-white/15 overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500 transition-all duration-700" style={{ width: `${value}%` }} />
    </div>
  );
}

function DeckTile({ deck, store, onOpen, showKid }) {
  const style = subjectStyle(deck.subject);
  const test = testLabel(deck.testDate);
  const mastery = store.mastery(deck);
  return (
    <button className={`fq-deck bg-gradient-to-br ${style.color}`} onClick={() => onOpen(deck)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl">{style.icon}</span>
        {test && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${daysUntil(deck.testDate) <= 1 ? 'bg-amber-300 text-amber-950 fq-pulse' : 'bg-black/25 text-white'}`}>{test}</span>}
      </div>
      <div className="font-title text-xl leading-tight mt-2 text-left">{deck.name}</div>
      <div className="text-sm text-white/80 text-left mb-3">
        {deck.cards.length} cards{deck.subject ? ` · ${deck.subject}` : ''}{showKid && deck.kid ? ` · ${deck.kid[0].toUpperCase()}${deck.kid.slice(1)}` : ''}
      </div>
      <MasteryBar value={mastery} />
      <div className="text-xs text-white/80 text-left mt-1">{mastery}% mastered</div>
    </button>
  );
}

function HomeScreen({ player, schoolDecks, myDecks, store, loading, onOpen, onImport, onCreate, audio }) {
  const [muted, setMuted] = useState(audio.muted);
  const showKid = !player || !['emma', 'liam'].includes(player.id);
  return (
    <div className="min-h-screen px-4 py-6 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          {player ? <a href="../index.html" className="fq-btn fq-btn-ghost px-4 py-2 text-sm">🏠 Noyola Hub</a> : <span />}
          <button className="fq-btn fq-btn-ghost px-3 py-2 text-sm" onClick={() => setMuted(audio.toggleMute())}>{muted ? '🔇' : '🔊'}</button>
        </div>
        <div className="text-center mb-8">
          <div className="text-6xl fq-float inline-block">🃏</div>
          <h1 className="font-title text-5xl sm:text-6xl text-white fq-title-shadow">Flash Quest</h1>
          <p className="text-indigo-200 mt-2 text-lg">{player ? `Ready to study, ${player.name}?` : 'Flip, quiz, and match your way to test day.'}</p>
        </div>

        <section className="mb-8">
          <h2 className="font-title text-2xl text-amber-300 mb-3">📬 From school</h2>
          {schoolDecks.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {schoolDecks.map((d) => <DeckTile key={d.id} deck={d} store={store} onOpen={onOpen} showKid={showKid} />)}
            </div>
          ) : (
            <p className="text-indigo-200/80 italic">{loading ? 'Checking for new decks…' : 'New decks show up here when teachers post study guides.'}</p>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 className="font-title text-2xl text-amber-300">🗂️ My decks</h2>
            <div className="flex gap-2">
              <button className="fq-btn fq-btn-primary px-4 py-2" onClick={onCreate}>✍️ Make a deck</button>
              <button className="fq-btn fq-btn-ghost px-4 py-2" onClick={onImport}>📥 Import from Quizlet</button>
            </div>
          </div>
          {myDecks.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myDecks.map((d) => <DeckTile key={d.id} deck={d} store={store} onOpen={onOpen} />)}
            </div>
          ) : (
            <p className="text-indigo-200/80 italic">Make your own flashcards or bring in a Quizlet set.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function DeckScreen({ deck, store, reversed, setReversed, onPlay, onBack, onEdit, onDelete }) {
  const style = subjectStyle(deck.subject);
  const test = testLabel(deck.testDate);
  const best = store.data.best[deck.id];
  const canMatch = deck.cards.length >= 3;
  const modes = [
    { id: 'flip', icon: '🃏', name: 'Flip Cards', desc: 'Learn the cards. Sort them into Got it or Still learning.', color: 'from-sky-500 to-indigo-500' },
    { id: 'quiz', icon: '❓', name: 'Quiz', desc: 'Pick the right answer. Build a streak for bonus stars.', color: 'from-fuchsia-500 to-purple-600' },
    { id: 'match', icon: '⚡', name: 'Match', desc: best ? `Race the clock. Best: ${best}s` : 'Pair terms and definitions as fast as you can.', color: 'from-amber-400 to-orange-500', off: !canMatch },
  ];
  return (
    <div className="min-h-screen px-4 py-6 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <button className="fq-btn fq-btn-ghost px-4 py-2 text-sm mb-5" onClick={onBack}>← All decks</button>
        <div className={`rounded-3xl bg-gradient-to-br ${style.color} p-6 shadow-2xl mb-6`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-4xl mb-1">{style.icon}</div>
              <h1 className="font-title text-3xl sm:text-4xl leading-tight">{deck.name}</h1>
              <div className="text-white/85 mt-1">{deck.cards.length} cards{deck.subject ? ` · ${deck.subject}` : ''}</div>
            </div>
            {test && <span className="rounded-full bg-black/25 px-3 py-1.5 text-sm font-bold whitespace-nowrap">{test}</span>}
          </div>
          <div className="mt-4"><MasteryBar value={store.mastery(deck)} /></div>
          <div className="text-sm text-white/85 mt-1">{store.mastered(deck)} of {deck.cards.length} cards mastered</div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          {modes.map((m) => (
            <button key={m.id} className={`fq-mode bg-gradient-to-br ${m.color} ${m.off ? 'opacity-40 pointer-events-none' : ''}`} onClick={() => onPlay(m.id)}>
              <span className="text-4xl">{m.icon}</span>
              <span className="font-title text-2xl">{m.name}</span>
              <span className="text-sm text-white/85">{m.desc}</span>
            </button>
          ))}
        </div>

        <label className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 mb-6 cursor-pointer">
          <input type="checkbox" className="w-5 h-5 accent-amber-400" checked={reversed} onChange={(e) => setReversed(e.target.checked)} />
          <span className="font-semibold">Show the definition first (answer with the term)</span>
        </label>

        <details className="rounded-2xl bg-white/10 px-4 py-3">
          <summary className="cursor-pointer font-semibold">See all {deck.cards.length} cards</summary>
          <ul className="mt-3 divide-y divide-white/10">
            {deck.cards.map((c, i) => (
              <li key={i} className="py-2 grid sm:grid-cols-[1fr_2fr] gap-1 sm:gap-4">
                <span className="font-bold text-amber-200">{c.term}</span>
                <span className="text-indigo-100">{c.definition}</span>
              </li>
            ))}
          </ul>
        </details>

        {deck.mine && (
          <div className="flex gap-3 mt-6">
            <button className="fq-btn fq-btn-ghost px-4 py-2" onClick={onEdit}>✏️ Edit deck</button>
            <button className="fq-btn fq-btn-ghost px-4 py-2 text-rose-300" onClick={() => { if (confirm(`Delete "${deck.name}"?`)) onDelete(); }}>🗑️ Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ImportScreen({ onSave, onBack }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const cards = useMemo(() => parseCardText(text), [text]);
  return (
    <div className="min-h-screen px-4 py-6 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <button className="fq-btn fq-btn-ghost px-4 py-2 text-sm mb-5" onClick={onBack}>← Back</button>
        <h1 className="font-title text-4xl mb-2">📥 Import from Quizlet</h1>
        <ol className="text-indigo-200 mb-5 space-y-1 list-decimal list-inside">
          <li>Open your set on Quizlet and tap the <strong>⋯</strong> menu, then <strong>Export</strong>.</li>
          <li>Leave the settings on <strong>Tab</strong> and <strong>New line</strong>, then tap <strong>Copy text</strong>.</li>
          <li>Paste it below. Lists like <em>term - definition</em> work too.</li>
        </ol>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input className="fq-input" placeholder="Deck name (e.g. Science Ch 2)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="fq-input" placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <textarea className="fq-input w-full h-56 font-mono text-sm" placeholder={'photosynthesis\thow plants make food from sunlight\nchlorophyll\tthe green pigment in leaves'} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
          <span className="text-indigo-200">{cards.length ? `Found ${cards.length} cards` : 'Paste your cards above'}</span>
          <button className="fq-btn fq-btn-primary px-6 py-3" disabled={cards.length < 2} onClick={() => onSave({ id: uid(), name: name.trim() || 'Quizlet deck', subject: subject.trim(), cards, mine: true, source: 'quizlet' })}>
            Save deck
          </button>
        </div>
        {cards.length > 0 && (
          <ul className="mt-4 rounded-2xl bg-white/10 px-4 py-2 divide-y divide-white/10 max-h-72 overflow-auto">
            {cards.map((c, i) => (
              <li key={i} className="py-2 grid grid-cols-[1fr_2fr] gap-4"><span className="font-bold text-amber-200">{c.term}</span><span>{c.definition}</span></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EditorScreen({ deck, onSave, onBack }) {
  const [name, setName] = useState(deck ? deck.name : '');
  const [subject, setSubject] = useState(deck ? deck.subject || '' : '');
  const [testDate, setTestDate] = useState(deck ? deck.testDate || '' : '');
  const [rows, setRows] = useState(() => (deck ? deck.cards.map((c) => ({ ...c })) : [{ term: '', definition: '' }, { term: '', definition: '' }, { term: '', definition: '' }]));
  const lastTermRef = useRef(null);
  const edit = (i, field, value) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [field]: value } : row)));
  const filled = rows.filter((r) => r.term.trim() && r.definition.trim());

  const addRow = () => {
    setRows((r) => [...r, { term: '', definition: '' }]);
    setTimeout(() => lastTermRef.current && lastTermRef.current.focus(), 0);
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <button className="fq-btn fq-btn-ghost px-4 py-2 text-sm mb-5" onClick={onBack}>← Back</button>
        <h1 className="font-title text-4xl mb-4">{deck ? '✏️ Edit deck' : '✍️ Make a deck'}</h1>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <input className="fq-input sm:col-span-1" placeholder="Deck name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="fq-input" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <label className="fq-input flex items-center gap-2 text-indigo-200">
            <span className="text-sm whitespace-nowrap">Test day</span>
            <input type="date" className="bg-transparent text-white flex-1 min-w-0" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
          </label>
        </div>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[2rem_1fr_2fr_2.5rem] gap-2 items-center">
              <span className="text-indigo-300 text-right">{i + 1}</span>
              <input ref={i === rows.length - 1 ? lastTermRef : null} className="fq-input" placeholder="Term" value={row.term} onChange={(e) => edit(i, 'term', e.target.value)} />
              <input className="fq-input" placeholder="Definition" value={row.definition} onChange={(e) => edit(i, 'definition', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && i === rows.length - 1) addRow(); }} />
              <button className="fq-btn fq-btn-ghost py-2" onClick={() => setRows((r) => r.filter((_, j) => j !== i))} aria-label="Remove card">✕</button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
          <button className="fq-btn fq-btn-ghost px-4 py-2" onClick={addRow}>＋ Add card</button>
          <button
            className="fq-btn fq-btn-primary px-6 py-3"
            disabled={filled.length < 2}
            onClick={() => onSave({ ...(deck || {}), id: deck ? deck.id : uid(), name: name.trim() || 'My deck', subject: subject.trim(), testDate, cards: filled.map((r) => ({ term: r.term.trim(), definition: r.definition.trim() })), mine: true, source: deck ? deck.source : 'mine' })}
          >
            Save {filled.length} cards
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultsScreen({ result, rewards, deck, store, onAgain, onDeck }) {
  const pct = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const cheer = pct === 100 ? 'Perfect!' : pct >= 80 ? 'Awesome work!' : pct >= 50 ? 'Getting there!' : 'Keep practicing!';
  const modeName = { flip: 'Flip Cards', quiz: 'Quiz', match: 'Match' }[result.mode];
  return (
    <div className="min-h-screen px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl bg-white text-indigo-950 shadow-2xl p-8 text-center fq-pop">
        <div className="text-6xl mb-2">{pct === 100 ? '🏆' : pct >= 80 ? '🌟' : pct >= 50 ? '💪' : '📚'}</div>
        <h1 className="font-title text-4xl text-indigo-700">{cheer}</h1>
        <p className="text-indigo-500 font-semibold mb-5">{modeName} · {deck.name}</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-2xl bg-indigo-50 p-3">
            <div className="text-3xl font-bold">{result.correct}/{result.total}</div>
            <div className="text-xs uppercase tracking-wider text-indigo-400 font-bold">{result.mode === 'match' ? 'clean pairs' : 'first try'}</div>
          </div>
          <div className="rounded-2xl bg-indigo-50 p-3">
            <div className="text-3xl font-bold">{result.mode === 'match' ? `${result.seconds}s` : result.mode === 'quiz' ? `⭐${result.score}` : `🔥${result.maxCombo}`}</div>
            <div className="text-xs uppercase tracking-wider text-indigo-400 font-bold">{result.mode === 'match' ? (result.newBest ? 'new best!' : 'time') : result.mode === 'quiz' ? 'stars' : 'best streak'}</div>
          </div>
        </div>
        <div className="mb-2 text-left text-sm font-semibold text-indigo-500">Deck mastery</div>
        <div className="h-3 rounded-full bg-indigo-100 overflow-hidden mb-5">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${store.mastery(deck)}%` }} />
        </div>
        {rewards && <div className="mb-5 font-bold text-amber-600">+{rewards.xp} XP · +{rewards.coins} coins</div>}
        <div className="grid grid-cols-2 gap-3">
          <button className="fq-btn fq-btn-primary py-3" onClick={onAgain}>Play again</button>
          <button className="fq-btn py-3 bg-indigo-100 text-indigo-700" onClick={onDeck}>Back to deck</button>
        </div>
      </div>
    </div>
  );
}
