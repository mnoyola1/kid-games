// ==================== STOP & JOT NOTEBOOK ====================
// Emma's real homework: notice signposts in her independent reading book and jot them down.
// She writes every note herself; the game only gives the signpost's question as a prompt.

function JotForm({ lastBook, audio, onSave, onCancel }) {
  const [book, setBook] = useState(lastBook || '');
  const [page, setPage] = useState('');
  const [type, setType] = useState(null);
  const [what, setWhat] = useState('');
  const [answer, setAnswer] = useState('');
  const sp = type && SP_BY_ID[type];
  const ready = book.trim() && type && what.trim().length >= 10 && answer.trim().length >= 10;
  const input = 'w-full rounded-xl border-2 border-stone-200 focus:border-amber-400 outline-none px-3 py-2 font-semibold text-stone-800 bg-white';

  return (
    <div className="bg-white/95 rounded-3xl shadow-2xl p-5 space-y-4 ps-pop">
      <div className="font-title text-2xl text-stone-800">New sticky note</div>
      <div className="grid grid-cols-[1fr_6rem] gap-2">
        <label className="text-sm font-bold text-stone-500">Book title<input className={input} value={book} onChange={e => setBook(e.target.value)} placeholder="My reading book" /></label>
        <label className="text-sm font-bold text-stone-500">Page<input className={input} value={page} onChange={e => setPage(e.target.value)} inputMode="numeric" placeholder="#" /></label>
      </div>
      <div>
        <div className="text-sm font-bold text-stone-500 mb-1">Which signpost did you notice?</div>
        <SignPicker onPick={(id) => { audio.sfx('tap'); setType(id); }} correctId={null} compact />
        {sp && <div className="mt-2 text-sm font-semibold text-stone-600 flex items-center gap-2"><SignpostSign id={sp.id} size={26} />{sp.name}: {sp.when}</div>}
      </div>
      <label className="block text-sm font-bold text-stone-500">What happened? (copy a short quote or describe it)
        <textarea className={cx(input, 'font-story')} rows={3} value={what} onChange={e => setWhat(e.target.value)} />
      </label>
      {sp && (
        <label className="block text-sm font-bold text-stone-500 ps-rise">Stop and ask: <span className="font-hand text-2xl text-stone-800">"{sp.ask}"</span>
          <textarea className={cx(input, 'font-hand text-xl')} rows={3} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="My answer, in my own words..." />
        </label>
      )}
      <div className="flex gap-3 justify-end">
        <BigButton color="paper" small onClick={onCancel}>Cancel</BigButton>
        <BigButton color="amber" small disabled={!ready} onClick={() => onSave({ book: book.trim(), page: page.trim(), type, what: what.trim(), answer: answer.trim() })}>Stick it! 📌</BigButton>
      </div>
      {!ready && <div className="text-xs font-semibold text-stone-400 text-right">Fill in the book, a signpost, and a sentence or two for each box.</div>}
    </div>
  );
}

function JotNote({ jot, big = false, onDelete }) {
  const sp = SP_BY_ID[jot.type];
  return (
    <div className={cx('ps-sticky rounded-sm relative', big ? 'p-6' : 'p-3')}>
      <div className="flex items-center gap-2">
        <SignpostSign id={sp.id} size={big ? 48 : 28} />
        <div className="min-w-0">
          <div className={cx('font-title font-semibold text-stone-800 leading-tight', big ? 'text-2xl' : 'text-sm')}>{sp.name}</div>
          <div className={cx('font-bold text-amber-900 truncate', big ? 'text-base' : 'text-xs')}>{jot.book}{jot.page ? `, p. ${jot.page}` : ''}</div>
        </div>
        {onDelete && <button onClick={onDelete} className="ml-auto text-amber-900/50 hover:text-rose-700 text-lg" aria-label="Delete note">✕</button>}
      </div>
      <div className={cx('font-story text-stone-800 mt-2', big ? 'text-xl' : 'text-sm')}>{jot.what}</div>
      <div className={cx('font-hand text-stone-600 mt-2 leading-tight', big ? 'text-3xl' : 'text-lg')}>{sp.ask}</div>
      <div className={cx('font-hand text-stone-900 leading-tight', big ? 'text-3xl' : 'text-xl')}>→ {jot.answer}</div>
    </div>
  );
}

function StopAndJot({ mastery, audio, onSave, onBack }) {
  const [mode, setMode] = useState('list');
  const [shareIdx, setShareIdx] = useState(0);
  const [, refresh] = useState(0);
  const jots = mastery.data.jots;

  return (
    <div className="min-h-screen pb-10">
      <Backdrop bg={BG_PATHS.notebook} dim={0.6} />
      <TopBar title="Stop & Jot Notebook" audio={audio} onBack={mode === 'list' ? onBack : () => setMode('list')} />
      <div className="max-w-2xl mx-auto px-4">
        {mode === 'list' && (
          <>
            <SageSays audio={audio} voiceKey="n_jot_intro" text={CONTENT.narration.jot_intro} small />
            <div className="flex flex-wrap gap-3 mt-4">
              <BigButton color="amber" onClick={() => { audio.stopVoice(); setMode('new'); }}>+ New sticky note</BigButton>
              {jots.length > 0 && <BigButton color="sky" onClick={() => { setShareIdx(0); setMode('share'); }}>🗣️ Share mode</BigButton>}
            </div>
            {jots.length === 0 && (
              <div className="bg-white/90 rounded-3xl p-5 mt-4 text-stone-700 font-semibold">
                No notes yet. While you read your book tonight, watch for any of the six signposts. When you spot one, come back and jot it down!
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {jots.map((j, k) => (
                <div key={j.id} className="ps-rise" style={{ transform: `rotate(${k % 2 ? 1 : -1}deg)`, animationDelay: `${k * 0.05}s` }}>
                  <JotNote jot={j} onDelete={() => { if (window.confirm('Delete this sticky note?')) { mastery.deleteJot(j.id); refresh(x => x + 1); } }} />
                </div>
              ))}
            </div>
          </>
        )}
        {mode === 'new' && (
          <JotForm lastBook={jots[0] && jots[0].book} audio={audio} onCancel={() => setMode('list')}
            onSave={(jot) => { audio.sfx('sticky'); onSave(jot); Juice.confetti(window.innerWidth / 2, window.innerHeight / 2, { count: 24 }); setMode('list'); }} />
        )}
        {mode === 'share' && jots[shareIdx] && (
          <div className="mt-4">
            <div key={shareIdx} className="ps-pop"><JotNote jot={jots[shareIdx]} big /></div>
            <div className="flex justify-between items-center mt-4">
              <BigButton color="paper" small disabled={shareIdx === 0} onClick={() => { audio.sfx('page'); setShareIdx(i => i - 1); }}>← Prev</BigButton>
              <div className="text-amber-50 font-title ps-title-shadow">{shareIdx + 1} / {jots.length}</div>
              <BigButton color="paper" small disabled={shareIdx >= jots.length - 1} onClick={() => { audio.sfx('page'); setShareIdx(i => i + 1); }}>Next →</BigButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
