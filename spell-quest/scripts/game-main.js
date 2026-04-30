// ==================== SPELL QUEST — MAIN APP ====================
// Screens: menu → list picker → (upload | pick list) → test → grading → results
//          → (if misses) practice (3x each) → retest → results2
//
// Everything talks to LuminaCore for XP/coins/achievements/streaks. If no
// profile is selected we fall back to a "Guest" scribe.
//
// Assets & config live in window.SpellQuestConfig.
// Audio:  window.sqAudio
// TTS:    window.SpellQuestTTS
// API:    window.SpellQuestAPI
// Canvas: window.WritingCanvas

const CFG = window.SpellQuestConfig;
const A   = window.sqAudio;

// ---------- Small helpers ----------
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function formatTime(s) {
  const m = Math.floor(s / 60), r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function useInterval(callback, delay) {
  const savedCb = useRef(callback);
  useEffect(() => { savedCb.current = callback; }, [callback]);
  useEffect(() => {
    if (delay == null) return;
    const id = setInterval(() => savedCb.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// ---------- Toast / floating XP ----------
function FloatingXP({ toasts }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="sq-float-xp text-2xl sm:text-3xl"
          style={{ left: `${t.x}%`, top: `${t.y}%` }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ---------- Keeper avatar + bubble ----------
function KeeperSay({ text, compact = false }) {
  return (
    <div className={`flex items-end gap-3 ${compact ? '' : 'mb-4'}`}>
      <img
        src={CFG.ASSETS.keeper}
        alt="The Keeper"
        className={compact ? 'w-12 h-12 rounded-full object-cover border border-rune-gold/60' : 'w-20 h-20 rounded-full object-cover border-2 border-rune-gold/70 shadow-lg'}
        style={{ filter: 'drop-shadow(0 0 12px rgba(255,215,132,.5))' }}
      />
      <div className="sq-keeper-bubble flex-1">{text}</div>
    </div>
  );
}

// ---------- Rune row HUD ----------
function RuneRow({ total, statuses }) {
  const runes = [];
  for (let i = 0; i < total; i++) {
    const s = statuses[i];
    runes.push(
      <div
        key={i}
        className={`sq-rune-slot ${s === 'correct' ? 'filled' : ''} ${s === 'miss' ? 'miss' : ''}`}
        title={s === 'correct' ? 'Inscribed' : s === 'miss' ? 'Faded' : 'Awaiting'}
      />
    );
  }
  return (
    <div className="flex flex-wrap gap-2 justify-center items-center">
      {runes}
    </div>
  );
}

// =====================================================================
// MENU
// =====================================================================
function MenuScreen({ onStart, onHowItWorks }) {
  useEffect(() => {
    A.playMusic('menu');
  }, []);

  return (
    <div className="relative min-h-screen sq-bg-menu sq-vignette flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 sq-bg-dark opacity-60"></div>
      <div className="sq-candle" style={{ top: '18%', left: '15%', width: 180, height: 180, background: 'radial-gradient(circle, rgba(255,215,132,0.6), transparent 70%)' }} />
      <div className="sq-candle" style={{ top: '25%', right: '10%', width: 220, height: 220, background: 'radial-gradient(circle, rgba(255,165,90,0.5), transparent 70%)', animationDelay: '1.1s' }} />

      <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-xl w-full animate-slide-up">
        <img src={CFG.ASSETS.logo} alt="Spell Quest" className="w-[min(80vw,520px)] drop-shadow-2xl" />
        <p className="sq-subtitle text-sm sm:text-base opacity-90">A trial of quill &amp; rune</p>

        <div className="flex flex-col gap-3 w-full max-w-sm mt-4">
          <button className="sq-btn sq-btn-primary" onClick={onStart}>Begin the Trial</button>
          <button className="sq-btn sq-btn-ghost" onClick={onHowItWorks}>How the Trial Works</button>
          <a href="../index.html" className="sq-btn sq-btn-ghost text-center no-underline">← Return to the Hub</a>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// HOW IT WORKS
// =====================================================================
function HowScreen({ onBack }) {
  return (
    <div className="relative min-h-screen sq-bg-dark p-6 flex items-center justify-center">
      <div className="sq-parchment max-w-2xl w-full p-8 sm:p-10 animate-slide-up">
        <h1 className="sq-title text-3xl sm:text-4xl mb-4" style={{ color: '#3a1d08' }}>The Trial of the Keeper</h1>
        <ol className="sq-serif text-lg sm:text-xl space-y-3 mb-6" style={{ color: '#2a1408' }}>
          <li><strong>1.</strong> The Keeper speaks each word aloud.</li>
          <li><strong>2.</strong> You inscribe it on the parchment with your quill (finger on iPad).</li>
          <li><strong>3.</strong> When all 20 runes are drawn, the Keeper reads your scroll and grades each word.</li>
          <li><strong>4.</strong> Any missed word becomes a practice rune — write it <em>three times</em> to set the ink.</li>
          <li><strong>5.</strong> Face the retest. Earn the <strong>Flawless Scribe</strong> seal.</li>
        </ol>
        <button className="sq-btn sq-btn-primary w-full" onClick={onBack}>I am ready</button>
      </div>
    </div>
  );
}

// =====================================================================
// LIST PICKER
// =====================================================================
function ListPickerScreen({ onPick, onUpload, onTypeManually, onBack }) {
  const [lists, setLists] = useState(() => {
    const saved = CFG.loadLists();
    return saved.length ? saved : CFG.DEFAULT_LISTS.map((l) => ({ ...l, id: l.id })); // show starters but don't persist
  });

  useEffect(() => { A.playMusic('menu'); }, []);

  function deleteList(id) {
    const saved = CFG.loadLists();
    const next = saved.filter((l) => l.id !== id);
    CFG.saveLists(next);
    const combined = next.length ? next : CFG.DEFAULT_LISTS;
    setLists(combined);
  }

  return (
    <div className="relative min-h-screen sq-bg-dark p-6 flex items-center justify-center">
      <div className="sq-parchment max-w-3xl w-full p-6 sm:p-10 animate-slide-up">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h1 className="sq-title text-2xl sm:text-3xl" style={{ color: '#3a1d08' }}>Choose thy list</h1>
          <button className="sq-btn sq-btn-ghost text-sm" onClick={onBack}>← Menu</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <button className="sq-btn sq-btn-primary text-left" onClick={onUpload}>
            📸 Upload photo of list
          </button>
          <button className="sq-btn sq-btn-ghost text-left" onClick={onTypeManually}>
            ✍️ Type a new list
          </button>
        </div>

        <div className="space-y-2">
          <div className="sq-subtitle text-xs sm:text-sm" style={{ color: '#6b3c12' }}>Saved lists</div>
          {lists.length === 0 && (
            <div className="opacity-70 sq-serif italic">No lists yet. Upload a photo or type one in to begin.</div>
          )}
          {lists.map((list) => (
            <div
              key={list.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border"
              style={{ background: 'rgba(255,240,200,0.5)', borderColor: 'rgba(120,84,40,0.35)' }}
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold sq-serif text-lg truncate" style={{ color: '#2a1408' }}>{list.name}</div>
                <div className="text-sm opacity-70" style={{ color: '#4d2a10' }}>
                  {list.words.length} words{list.grade ? ` • grade ${list.grade}` : ''}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="sq-btn sq-btn-primary text-sm" onClick={() => onPick(list)}>Begin</button>
                {!list.id.startsWith('starter-') && (
                  <button
                    className="sq-btn sq-btn-ghost text-sm"
                    style={{ color: '#6b1d1d' }}
                    onClick={() => { if (confirm(`Delete list "${list.name}"?`)) deleteList(list.id); }}
                    title="Delete"
                  >🗑️</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// UPLOAD / MANUAL ENTRY
// =====================================================================
function UploadScreen({ onSaved, onBack }) {
  const [stage, setStage] = useState('idle'); // idle | extracting | review | error
  const [preview, setPreview] = useState('');
  const [extracted, setExtracted] = useState(null); // { suggestedName, words }
  const [listName, setListName] = useState('');
  const [grade, setGrade] = useState(5);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setStage('extracting');
    setError('');
    try {
      const dataUrl = await window.SpellQuestAPI.fileToResizedDataUrl(file, 1600);
      setPreview(dataUrl);
      const result = await window.SpellQuestAPI.extractWords(dataUrl, grade);
      setExtracted(result);
      setListName(result.suggestedName || 'Spelling List');
      setStage('review');
      A.playSfx('pageTurn', { volume: 0.5 });
    } catch (e) {
      setError(e.message || 'Unable to read the list. Try a clearer photo.');
      setStage('error');
    }
  }

  function toggleWord(i) {
    setExtracted((ex) => ({
      ...ex,
      words: ex.words.map((w, idx) => idx === i ? { ...w, _off: !w._off } : w),
    }));
  }

  function editWord(i, next) {
    setExtracted((ex) => ({
      ...ex,
      words: ex.words.map((w, idx) => idx === i ? { ...w, word: next } : w),
    }));
  }

  function save() {
    if (!extracted) return;
    const words = extracted.words.filter((w) => !w._off && w.word.trim());
    if (!words.length) { setError('Pick at least one word.'); return; }
    const newList = {
      id: CFG.uid(),
      name: listName.trim() || 'Spelling List',
      grade,
      createdAt: Date.now(),
      words: words.slice(0, CFG.MAX_WORDS_PER_TEST).map(({ word, sentence }) => ({ word: word.trim(), sentence })),
    };
    const saved = CFG.loadLists();
    CFG.saveLists([newList, ...saved].slice(0, 40));
    if (window.LuminaCore) {
      try {
        const pid = window.LuminaCore.getCurrentPlayerId?.();
        if (pid) window.LuminaCore.awardAchievement?.(pid, 'sq_photo_upload');
      } catch (e) {}
    }
    A.playSfx('stamp');
    onSaved(newList);
  }

  return (
    <div className="relative min-h-screen sq-bg-dark p-6 flex items-center justify-center">
      <div className="sq-parchment max-w-2xl w-full p-6 sm:p-8 animate-slide-up">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h1 className="sq-title text-2xl sm:text-3xl" style={{ color: '#3a1d08' }}>Scroll of words</h1>
          <button className="sq-btn sq-btn-ghost text-sm" onClick={onBack}>← Back</button>
        </div>

        {stage === 'idle' && (
          <div className="space-y-4 sq-serif" style={{ color: '#2a1408' }}>
            <p className="text-lg">Take a photograph of the spelling list. The Keeper will copy the words into a scroll you can edit.</p>

            <div className="flex items-center gap-3 flex-wrap">
              <label className="sq-subtitle text-sm" style={{ color: '#6b3c12' }}>Grade</label>
              <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border"
                style={{ background: 'rgba(255,240,200,0.6)', borderColor: 'rgba(120,84,40,0.4)', color: '#2a1408' }}>
                {[1,2,3,4,5,6,7,8].map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button className="sq-btn sq-btn-primary w-full" onClick={() => fileRef.current?.click()}>
              📸 Take / choose photo
            </button>
          </div>
        )}

        {stage === 'extracting' && (
          <div className="text-center py-8 sq-serif">
            <div className="text-xl mb-2" style={{ color: '#2a1408' }}>The Keeper studies your scroll…</div>
            <div className="sq-progress-track max-w-xs mx-auto">
              <div className="sq-progress-fill" style={{ width: '60%' }}></div>
            </div>
            {preview && <img src={preview} alt="" className="max-h-56 mx-auto mt-4 rounded-lg opacity-70" />}
          </div>
        )}

        {stage === 'error' && (
          <div className="text-center py-6 sq-serif" style={{ color: '#2a1408' }}>
            <div className="mb-3 text-lg">⚠️ {error}</div>
            <button className="sq-btn sq-btn-primary" onClick={() => setStage('idle')}>Try again</button>
          </div>
        )}

        {stage === 'review' && extracted && (
          <div className="space-y-4 sq-serif" style={{ color: '#2a1408' }}>
            <div>
              <label className="sq-subtitle text-sm block mb-1" style={{ color: '#6b3c12' }}>List name</label>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-lg"
                style={{ background: 'rgba(255,240,200,0.6)', borderColor: 'rgba(120,84,40,0.4)' }}
              />
            </div>

            <div>
              <div className="sq-subtitle text-sm mb-2" style={{ color: '#6b3c12' }}>
                Words ({extracted.words.filter((w) => !w._off).length} selected)
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {extracted.words.map((w, i) => (
                  <div key={i} className={`p-2 rounded-lg border flex items-center gap-2 ${w._off ? 'opacity-40' : ''}`}
                       style={{ background: 'rgba(255,240,200,0.5)', borderColor: 'rgba(120,84,40,0.3)' }}>
                    <input
                      type="checkbox"
                      checked={!w._off}
                      onChange={() => toggleWord(i)}
                      className="w-5 h-5 accent-yellow-700"
                    />
                    <input
                      type="text"
                      value={w.word}
                      onChange={(e) => editWord(i, e.target.value)}
                      className="flex-1 min-w-0 bg-transparent outline-none font-semibold"
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="text-red-900">⚠️ {error}</div>}

            <div className="flex gap-2">
              <button className="sq-btn sq-btn-ghost flex-1" onClick={() => setStage('idle')}>↺ Retake photo</button>
              <button className="sq-btn sq-btn-primary flex-1" onClick={save}>Save list</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Manual list entry ----------
function ManualListScreen({ onSaved, onBack }) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(5);
  const [text, setText] = useState('');

  function save() {
    const words = text
      .split(/[\n,;]+/)
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)
      .filter((w) => /^[a-z][a-z'-]{0,}$/i.test(w));
    const unique = Array.from(new Set(words)).slice(0, CFG.MAX_WORDS_PER_TEST);
    if (!unique.length) { alert('Type at least one word.'); return; }
    const list = {
      id: CFG.uid(),
      name: name.trim() || 'My List',
      grade,
      createdAt: Date.now(),
      words: unique.map((word) => ({ word })),
    };
    const saved = CFG.loadLists();
    CFG.saveLists([list, ...saved].slice(0, 40));
    onSaved(list);
  }

  return (
    <div className="relative min-h-screen sq-bg-dark p-6 flex items-center justify-center">
      <div className="sq-parchment max-w-xl w-full p-6 sm:p-8 animate-slide-up">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h1 className="sq-title text-2xl sm:text-3xl" style={{ color: '#3a1d08' }}>Type thy list</h1>
          <button className="sq-btn sq-btn-ghost text-sm" onClick={onBack}>← Back</button>
        </div>
        <div className="space-y-3 sq-serif" style={{ color: '#2a1408' }}>
          <div>
            <label className="sq-subtitle text-sm block mb-1" style={{ color: '#6b3c12' }}>List name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Week 7 words"
              className="w-full px-3 py-2 rounded-lg border text-lg"
              style={{ background: 'rgba(255,240,200,0.6)', borderColor: 'rgba(120,84,40,0.4)' }}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="sq-subtitle text-sm" style={{ color: '#6b3c12' }}>Grade</label>
            <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border"
              style={{ background: 'rgba(255,240,200,0.6)', borderColor: 'rgba(120,84,40,0.4)', color: '#2a1408' }}>
              {[1,2,3,4,5,6,7,8].map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
          <div>
            <label className="sq-subtitle text-sm block mb-1" style={{ color: '#6b3c12' }}>Words (one per line or comma-separated)</label>
            <textarea
              rows={8} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="because&#10;friend&#10;believe"
              className="w-full px-3 py-2 rounded-lg border font-mono"
              style={{ background: 'rgba(255,240,200,0.6)', borderColor: 'rgba(120,84,40,0.4)' }}
            />
          </div>
          <button className="sq-btn sq-btn-primary w-full" onClick={save}>Save list</button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// TEST SCREEN
// =====================================================================
function TestScreen({ list, isRetest, onComplete, onExit }) {
  const words = list.words;
  const [idx, setIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(CFG.SECONDS_PER_WORD);
  const [replaysLeft, setReplaysLeft] = useState(CFG.MAX_TTS_REPLAYS);
  const [submissions, setSubmissions] = useState([]); // array of { word, dataUrl }
  const [streak, setStreak] = useState(0); // local visual streak for juice
  const canvasRef = useRef(null);
  const firstAutoplayRef = useRef(true);

  const current = words[idx];
  const total = words.length;

  // Music + intro
  useEffect(() => {
    A.playMusic('gameplay');
    if (isRetest) A.playKeeper('retestIntro');
    else A.playKeeper('intro');
  }, [isRetest]);

  // Auto-speak on word change
  useEffect(() => {
    setSecondsLeft(CFG.SECONDS_PER_WORD);
    setReplaysLeft(CFG.MAX_TTS_REPLAYS);
    canvasRef.current?.clear();

    const delay = firstAutoplayRef.current ? 1800 : 500;
    firstAutoplayRef.current = false;

    const t = setTimeout(() => {
      window.SpellQuestTTS.speakDictation(current.word).catch(() => {});
      // Prewarm next word in its dictation form so we don't pay the
      // re-encode latency on transition.
      if (idx + 1 < total) window.SpellQuestTTS.prewarmDictation(words[idx + 1].word);
    }, delay);
    return () => clearTimeout(t);
  }, [idx]);

  // Countdown tick
  useInterval(() => {
    setSecondsLeft((s) => Math.max(0, s - 1));
  }, 1000);

  function replayAudio() {
    if (replaysLeft <= 0) return;
    setReplaysLeft((r) => r - 1);
    window.SpellQuestTTS.speakDictation(current.word).catch(() => {});
  }

  function readSentence() {
    if (!current.sentence) return;
    window.SpellQuestTTS.speakWord(current.sentence).catch(() => {});
  }

  function handleStroke() {
    A.playSfx('quill', { volume: 0.5, rate: 0.9 + Math.random() * 0.25 });
  }

  function next() {
    const dataUrl = canvasRef.current?.getDataUrl() || '';
    const submission = { word: current.word, dataUrl };
    const nextSubs = [...submissions, submission];
    setSubmissions(nextSubs);
    A.playSfx('pageTurn', { volume: 0.7 });
    setStreak((s) => s + 1);
    if (idx + 1 >= total) {
      onComplete(nextSubs);
    } else {
      setIdx(idx + 1);
    }
  }

  const pct = Math.round(((idx + 1) / total) * 100);

  return (
    <div className="relative min-h-screen sq-bg-main sq-vignette flex flex-col p-4 sm:p-6">
      <div className="absolute inset-0" style={{ background: 'rgba(10,6,22,.55)' }}></div>

      <div className="relative z-10 flex flex-col gap-4 max-w-3xl mx-auto w-full">
        {/* HUD */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button className="sq-btn sq-btn-ghost text-sm" onClick={onExit}>← Quit</button>
          <div className="sq-subtitle text-sm sm:text-base">
            Rune {idx + 1} of {total}{isRetest ? ' · Retest' : ''}
          </div>
          <div className="sq-subtitle text-sm sm:text-base" style={{ color: secondsLeft <= 3 ? '#ff8a6b' : undefined }}>
            ⏳ {secondsLeft}s
          </div>
        </div>

        <div className="sq-progress-track">
          <div className="sq-progress-fill" style={{ width: `${pct}%` }}></div>
        </div>

        <div className="flex justify-center">
          <RuneRow
            total={total}
            statuses={Array.from({ length: total }, (_, i) => i < idx ? 'correct' : null)}
          />
        </div>

        {/* Handwriting area with frame */}
        <div className="relative">
          <div className="absolute inset-0 -m-4 pointer-events-none"
               style={{
                 backgroundImage: `url(${CFG.ASSETS.grimoire})`,
                 backgroundSize: '100% 100%',
                 backgroundRepeat: 'no-repeat',
                 opacity: 0.85,
                 filter: 'drop-shadow(0 20px 40px rgba(0,0,0,.6))',
               }}
          />
          <div className="relative p-5 sm:p-7">
            <div className="flex items-center justify-center gap-3 mb-3 flex-wrap">
              <button
                className="sq-btn sq-btn-primary"
                onClick={replayAudio}
                disabled={replaysLeft <= 0}
                title={`Replays left: ${replaysLeft}`}
              >
                🔊 Hear the word {replaysLeft < CFG.MAX_TTS_REPLAYS ? `(${replaysLeft} left)` : ''}
              </button>
              {current.sentence && (
                <button className="sq-btn sq-btn-ghost" onClick={readSentence}>
                  💬 Use it in a sentence
                </button>
              )}
            </div>

            <WritingCanvas
              ref={canvasRef}
              heightClass="h-[260px] sm:h-[320px]"
              onStroke={handleStroke}
            />

            <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
              <button className="sq-btn sq-btn-ghost text-sm" onClick={() => canvasRef.current?.clear()}>
                ✖ Clear
              </button>
              <button
                className="sq-btn sq-btn-primary"
                onClick={next}
              >
                {idx + 1 === total ? 'Submit scroll →' : 'Next word →'}
              </button>
            </div>
          </div>
        </div>

        <p className="sq-keeper-bubble self-center text-sm sm:text-base text-center opacity-90">
          Listen carefully, then inscribe. No going back — a real scribe trusts the quill.
        </p>
      </div>
    </div>
  );
}

// =====================================================================
// GRADING SCREEN (loading)
// =====================================================================
function GradingScreen({ submissions, studentName, onGraded, onError }) {
  const [attempted, setAttempted] = useState(false);
  useEffect(() => {
    if (attempted) return;
    setAttempted(true);
    A.playMusic('grading');
    A.playKeeper('grading');
    window.SpellQuestAPI.gradeSpelling(submissions, { studentName })
      .then(onGraded)
      .catch((e) => onError(e.message || 'Grading failed.'));
  }, [attempted, submissions, studentName]);

  return (
    <div className="relative min-h-screen sq-bg-dark flex items-center justify-center p-6">
      <div className="sq-candle" style={{ top: '10%', left: '50%', width: 300, height: 300, transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(255,215,132,0.45), transparent 70%)' }} />
      <div className="sq-parchment max-w-xl w-full p-8 sm:p-10 text-center relative z-10 animate-slide-up">
        <img src={CFG.ASSETS.keeper} alt="The Keeper"
             className="w-28 h-28 mx-auto rounded-full object-cover border-2 border-rune-gold/70 mb-4 animate-glow-pulse"
             style={{ filter: 'drop-shadow(0 0 20px rgba(255,215,132,0.8))' }} />
        <h2 className="sq-title text-2xl sm:text-3xl mb-3" style={{ color: '#3a1d08' }}>
          The Keeper reads your scroll…
        </h2>
        <div className="sq-serif text-lg mb-5" style={{ color: '#2a1408' }}>
          Weighing each rune with candlelight and care.
        </div>
        <div className="sq-progress-track max-w-xs mx-auto">
          <div className="sq-progress-fill" style={{ width: '70%' }}></div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// RESULTS SCREEN
// =====================================================================
function ResultsScreen({ grading, list, isRetest, onPractice, onRetest, onDone }) {
  const perfect = grading.correct_count === grading.total_count && grading.total_count > 0;
  const misses = grading.items.filter((it) => !it.correct);
  const [showStamp, setShowStamp] = useState(false);

  useEffect(() => {
    A.playMusic(perfect ? 'victory' : 'gameplay');
    A.playSfx('scroll');
    if (perfect) {
      A.playKeeper('perfect');
      setTimeout(() => { A.playSfx('stamp', { volume: 0.9 }); setShowStamp(true); }, 1200);
    } else if (grading.correct_count / grading.total_count >= 0.8) {
      A.playKeeper('goodJob');
    } else {
      A.playKeeper('tryAgain');
    }
    // Speak the actual score for flavor
    setTimeout(() => {
      window.SpellQuestTTS.speakWord(
        `You inscribed ${grading.correct_count} of ${grading.total_count} runes.`
      ).catch(() => {});
    }, 2500);
  }, []);

  return (
    <div className="relative min-h-screen sq-bg-dark p-5 sm:p-8 flex items-start justify-center">
      {showStamp && <div className="sq-stamp" />}
      <div className="sq-parchment max-w-3xl w-full p-5 sm:p-8 relative animate-scroll-unfurl" style={{ transformOrigin: 'top center' }}>
        <div className="text-center mb-4">
          <div className="sq-subtitle text-xs sm:text-sm mb-1" style={{ color: '#6b3c12' }}>{list.name}{isRetest ? ' — retest' : ''}</div>
          <h1 className="sq-title text-4xl sm:text-5xl" style={{ color: '#3a1d08' }}>
            {grading.correct_count} / {grading.total_count}
          </h1>
          <div className="sq-scribe text-2xl sm:text-3xl mt-1">{perfect ? 'Flawless Scribe' : `Score: ${grading.score}%`}</div>
        </div>

        {grading.overall_feedback && (
          <KeeperSay text={grading.overall_feedback} />
        )}

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          {(grading.strengths || []).length > 0 && (
            <div className="p-3 rounded-lg" style={{ background: 'rgba(255,240,200,0.6)', border: '1px solid rgba(120,84,40,0.3)' }}>
              <div className="sq-subtitle text-xs mb-1" style={{ color: '#4d2a10' }}>Strengths</div>
              <ul className="sq-serif text-base list-disc pl-5 space-y-1" style={{ color: '#2a1408' }}>
                {grading.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {(grading.areas_to_improve || []).length > 0 && (
            <div className="p-3 rounded-lg" style={{ background: 'rgba(255,240,200,0.6)', border: '1px solid rgba(120,84,40,0.3)' }}>
              <div className="sq-subtitle text-xs mb-1" style={{ color: '#4d2a10' }}>Runes to practice</div>
              <ul className="sq-serif text-base list-disc pl-5 space-y-1" style={{ color: '#2a1408' }}>
                {grading.areas_to_improve.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-2 mb-5">
          {grading.items.map((it, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg animate-slide-up"
              style={{
                animationDelay: `${80 + i * 70}ms`,
                animationFillMode: 'both',
                background: it.correct ? 'rgba(220, 245, 170, 0.45)' : 'rgba(255, 200, 180, 0.45)',
                border: `1px solid ${it.correct ? 'rgba(80, 120, 40, 0.4)' : 'rgba(160, 40, 30, 0.4)'}`,
                color: '#2a1408',
              }}
            >
              <div className="text-2xl shrink-0">{it.correct ? '✓' : '✗'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="sq-serif font-bold text-lg">{it.word}</span>
                  {!it.correct && it.transcribed && (
                    <span className="sq-scribe text-xl opacity-80">you wrote: {it.transcribed}</span>
                  )}
                </div>
                {it.note && <div className="sq-serif opacity-80 text-sm mt-0.5">{it.note}</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {!perfect && !isRetest && (
            <button className="sq-btn sq-btn-primary flex-1" onClick={() => onPractice(misses)}>
              ✒️ Practice the misses
            </button>
          )}
          {!perfect && isRetest && (
            <button className="sq-btn sq-btn-primary flex-1" onClick={() => onPractice(misses)}>
              ✒️ Practice again
            </button>
          )}
          <button className="sq-btn sq-btn-ghost flex-1" onClick={onDone}>
            ← Return to menu
          </button>
          <a className="sq-btn sq-btn-ghost flex-1 text-center no-underline" href="../index.html">
            🏰 Noyola Hub
          </a>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// PRACTICE SCREEN (write each miss 3 times)
// =====================================================================
function PracticeScreen({ words, onDone, onSkipToRetest }) {
  const [wordIdx, setWordIdx] = useState(0);
  const [row, setRow] = useState(0); // 0,1,2
  const canvasRef = useRef(null);
  const current = words[wordIdx];

  useEffect(() => {
    A.playMusic('gameplay');
    A.playKeeper('practiceIntro');
  }, []);

  useEffect(() => {
    canvasRef.current?.clear();
    window.SpellQuestTTS.speakDictation(current.word).catch(() => {});
  }, [wordIdx]);

  function nextRow() {
    A.playSfx('runeInscribe', { volume: 0.6 });
    if (row + 1 >= 3) {
      A.playSfx('pageTurn');
      if (wordIdx + 1 >= words.length) {
        onDone();
      } else {
        setRow(0);
        setWordIdx(wordIdx + 1);
      }
    } else {
      canvasRef.current?.clear();
      setRow(row + 1);
    }
  }

  return (
    <div className="relative min-h-screen sq-bg-main sq-vignette p-4 sm:p-6 flex flex-col items-center">
      <div className="absolute inset-0" style={{ background: 'rgba(10,6,22,.6)' }}></div>
      <div className="relative z-10 max-w-3xl w-full flex flex-col gap-4 animate-slide-up">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button className="sq-btn sq-btn-ghost text-sm" onClick={onSkipToRetest}>Skip practice →</button>
          <div className="sq-subtitle">Practice — {wordIdx + 1} of {words.length}</div>
          <div className="sq-subtitle">Row {row + 1} of 3</div>
        </div>

        <KeeperSay compact text={
          <span>
            The word is <span className="sq-scribe text-2xl" style={{ color: '#ffe2a6' }}>{current.word}</span>.
            Inscribe it carefully — three times, with care. The ink remembers.
          </span>
        } />

        <div className="sq-parchment p-4 sm:p-6">
          <div className="text-center mb-3">
            <div className="sq-subtitle text-xs" style={{ color: '#6b3c12' }}>Target word</div>
            <div className="sq-scribe text-5xl sm:text-6xl" style={{ color: '#3a1d08' }}>{current.word}</div>
          </div>

          <WritingCanvas
            ref={canvasRef}
            heightClass="h-[200px] sm:h-[240px]"
            onStroke={() => A.playSfx('quill', { volume: 0.5, rate: 0.9 + Math.random() * 0.3 })}
          />

          <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
            <button className="sq-btn sq-btn-ghost text-sm" onClick={() => canvasRef.current?.clear()}>✖ Clear</button>
            <div className="flex gap-2">
              <button className="sq-btn sq-btn-ghost text-sm" onClick={() => window.SpellQuestTTS.speakDictation(current.word).catch(()=>{})}>🔊 Hear again</button>
              <button className="sq-btn sq-btn-primary" onClick={nextRow}>
                {row + 1 === 3 && wordIdx + 1 === words.length ? 'To retest →' : 'Rune etched ✓'}
              </button>
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-3">
            {[0,1,2].map((r) => (
              <div key={r} className={`sq-rune-slot ${r < row ? 'filled' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// ROOT
// =====================================================================
function SpellQuest() {
  const [screen, setScreen] = useState('menu'); // menu | how | listPicker | upload | manual | test | grading | results | practice | retest | results2
  const [list, setList] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [grading, setGrading] = useState(null);
  const [retestMisses, setRetestMisses] = useState(null);
  const [firstRunMisses, setFirstRunMisses] = useState(0);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);

  function toast(text, { x = 50, y = 40 } = {}) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, x, y }]);
    setTimeout(() => setToasts((t) => t.filter((tt) => tt.id !== id)), 1300);
  }

  // Get the active Lumina profile (or null)
  const getProfile = () => {
    try { return window.LuminaCore?.getCurrentPlayer?.() || null; } catch { return null; }
  };
  const getPid = () => {
    try { return window.LuminaCore?.getCurrentPlayerId?.() || null; } catch { return null; }
  };

  // Award rewards on test completion
  function recordCompletion(g, isRetest) {
    const pid = getPid();
    const rewards = CFG.computeRewards(g.correct_count, g.total_count, isRetest);
    try {
      if (pid && window.LuminaCore) {
        window.LuminaCore.recordGameEnd?.(pid, 'spellQuest', {
          gamesPlayed: 1,
          wordsCorrect: g.correct_count,
          wordsAttempted: g.total_count,
          perfectTests: rewards.perfect ? 1 : 0,
          retests: isRetest ? 1 : 0,
        });
        window.LuminaCore.addXP?.(pid, rewards.xp, 'spellQuest');
        window.LuminaCore.addCoins?.(pid, rewards.coins);
        window.LuminaCore.addRewardPoints?.(pid, rewards.rewardPoints);
        window.LuminaCore.updateStreak?.(pid);
        window.LuminaCore.awardAchievement?.(pid, 'sq_first_test');
        if (rewards.perfect) window.LuminaCore.awardAchievement?.(pid, 'sq_perfect_20');
        if (isRetest && rewards.perfect && firstRunMisses >= 3) {
          window.LuminaCore.awardAchievement?.(pid, 'sq_comeback');
        }
        if (g.correct_count >= 10) {
          window.LuminaCore.awardAchievement?.(pid, 'sq_streak_10');
        }
        window.LuminaCore.checkDailyChallengeProgress?.(pid, 'spellQuest', { gamesPlayed: 1 });
      }
    } catch (e) { /* no-op */ }
    toast(`+${rewards.xp} XP`, { x: 50, y: 25 });
    toast(`+${rewards.coins} 🪙`, { x: 50, y: 32 });
    if (rewards.perfect) A.playSfx('levelup', { volume: 0.7 });
    return rewards;
  }

  // Transitions
  const profile = getProfile();
  const studentName = profile?.name || 'Scribe';

  return (
    <div className="relative">
      <FloatingXP toasts={toasts} />

      {screen === 'menu' && (
        <MenuScreen
          onStart={() => setScreen('listPicker')}
          onHowItWorks={() => setScreen('how')}
        />
      )}

      {screen === 'how' && <HowScreen onBack={() => setScreen('menu')} />}

      {screen === 'listPicker' && (
        <ListPickerScreen
          onPick={(l) => { setList(l); setSubmissions([]); setGrading(null); setFirstRunMisses(0); setScreen('test'); }}
          onUpload={() => setScreen('upload')}
          onTypeManually={() => setScreen('manual')}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'upload' && (
        <UploadScreen
          onSaved={(l) => { setList(l); setSubmissions([]); setGrading(null); setFirstRunMisses(0); setScreen('test'); }}
          onBack={() => setScreen('listPicker')}
        />
      )}

      {screen === 'manual' && (
        <ManualListScreen
          onSaved={(l) => { setList(l); setSubmissions([]); setGrading(null); setFirstRunMisses(0); setScreen('test'); }}
          onBack={() => setScreen('listPicker')}
        />
      )}

      {screen === 'test' && list && (
        <TestScreen
          list={list}
          isRetest={false}
          onComplete={(subs) => { setSubmissions(subs); setScreen('grading'); }}
          onExit={() => setScreen('menu')}
        />
      )}

      {screen === 'grading' && (
        <GradingScreen
          submissions={submissions}
          studentName={studentName}
          onGraded={(g) => {
            setGrading(g);
            const misses = g.items.filter((i) => !i.correct).length;
            setFirstRunMisses(misses);
            recordCompletion(g, false);
            setScreen('results');
          }}
          onError={(msg) => { setError(msg); setScreen('menu'); alert(msg); }}
        />
      )}

      {screen === 'results' && grading && list && (
        <ResultsScreen
          grading={grading}
          list={list}
          isRetest={false}
          onPractice={(misses) => {
            setRetestMisses(misses.map((m) => ({ word: m.word })));
            setScreen('practice');
          }}
          onDone={() => setScreen('menu')}
        />
      )}

      {screen === 'practice' && retestMisses && (
        <PracticeScreen
          words={retestMisses}
          onDone={() => setScreen('retest')}
          onSkipToRetest={() => setScreen('retest')}
        />
      )}

      {screen === 'retest' && retestMisses && (
        <TestScreen
          list={{ name: `${list.name} — misses only`, words: retestMisses, id: list.id + '_retest' }}
          isRetest={true}
          onComplete={(subs) => { setSubmissions(subs); setScreen('grading2'); }}
          onExit={() => setScreen('menu')}
        />
      )}

      {screen === 'grading2' && (
        <GradingScreen
          submissions={submissions}
          studentName={studentName}
          onGraded={(g) => {
            setGrading(g);
            recordCompletion(g, true);
            setScreen('results2');
          }}
          onError={(msg) => { setError(msg); setScreen('menu'); alert(msg); }}
        />
      )}

      {screen === 'results2' && grading && list && (
        <ResultsScreen
          grading={grading}
          list={{ ...list, name: `${list.name} — retest` }}
          isRetest={true}
          onPractice={(misses) => {
            setRetestMisses(misses.map((m) => ({ word: m.word })));
            setScreen('practice');
          }}
          onDone={() => setScreen('menu')}
        />
      )}
    </div>
  );
}

window.SpellQuest = SpellQuest;
