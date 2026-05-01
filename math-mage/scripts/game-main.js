// ==================== MATH MAGE — MAIN ====================
// Action-arcade multiplication game. Phase 1 MVP — keypad-only, no
// handwriting lock-in yet (that's Phase 2). Web Speech narrates each
// "first-seen" fact so the kid hears the canonical phrasing alongside
// seeing the equation. Mastery tracking + spaced-repetition selector
// run end-to-end and persist per profile.
//
// Screen flow:
//   menu → target picker → arena → (wave cleared interstitial) → ...
//                                → boss wave → victory | game over
//   menu → mastery board (read-only)
//
// Globals (all on window): MathMageConfig, MathMageMastery,
//   MathMageAudio, MathMageJuice, LuminaCore.

const MMC = window.MathMageConfig;
const MMM = window.MathMageMastery;
const MMA = window.MathMageAudio;
const MMJ = window.MathMageJuice;

// ---------- Tiny helpers ----------
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadStoredTarget(profileId) {
  try {
    const raw = localStorage.getItem(MMC.MM_LS_TARGET_TABLE + ':' + (profileId || 'guest'));
    const n = raw == null ? null : Number(raw);
    if (Number.isInteger(n) && MMC.MM_TARGET_TABLES.includes(n)) return n;
  } catch (e) {}
  return null;
}

function saveStoredTarget(profileId, target) {
  try {
    localStorage.setItem(MMC.MM_LS_TARGET_TABLE + ':' + (profileId || 'guest'), String(target));
  } catch (e) {}
}

// =====================================================================
// MENU
// =====================================================================
function MenuScreen({ profile, target, onChangeTarget, onStart, onShowBoard }) {
  const name = profile ? profile.name : 'Mage';

  // Loop the menu music. Cross-fade is handled inside playMusic so it's
  // safe to call this on every menu mount without choppy restarts.
  useEffect(() => { MMA.playMusic('menu', { volume: 0.30 }); }, []);

  return (
    <div className="relative min-h-screen mm-bg-dark mm-bg-menu-img mm-vignette flex flex-col items-center justify-center p-6">
      <div className="relative z-10 flex flex-col items-center text-center gap-4 max-w-xl w-full mm-slide-up">
        <img
          src="../assets/sprites/math-mage/mage_hero.png?v=2"
          alt=""
          className="mm-mage-hero"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <h1 className="mm-title text-4xl sm:text-5xl">Math Mage</h1>
        <p className="mm-subtitle text-xs sm:text-sm opacity-90">Mastery of the Multiplier's Tower</p>

        <div className="mm-problem-card w-full max-w-md mt-2 px-5 py-4">
          <div className="mm-subtitle text-[0.7rem] mb-2 opacity-80">Apprentice</div>
          <div className="mm-cinzel text-2xl text-[#fff3d0]">{name}</div>
          <div className="mt-3 mm-serif text-sm opacity-80">
            This week's spell: <span className="mm-cinzel text-[#b9f0ff] text-lg">×{target}</span>
          </div>
        </div>

        <TargetPicker target={target} onChange={onChangeTarget} />

        <div className="flex flex-col gap-3 w-full max-w-sm mt-2">
          <button className="mm-btn mm-btn-primary" onClick={onStart}>Enter the Tower</button>
          <button className="mm-btn mm-btn-ghost" onClick={onShowBoard}>Mastery Board</button>
          <a href="../index.html" className="mm-btn mm-btn-ghost text-center no-underline">← Return to the Hub</a>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// TARGET PICKER (which table to focus on)
// =====================================================================
function TargetPicker({ target, onChange }) {
  return (
    <div className="w-full max-w-md">
      <div className="mm-subtitle text-[0.7rem] mb-2 opacity-80">Choose your spell</div>
      <div className="grid grid-cols-7 gap-1.5">
        {MMC.MM_TARGET_TABLES.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`mm-cell ${n === target ? 'gold target' : 'seen'}`}
            style={{ width: '100%', height: 44 }}
          >
            ×{n}
          </button>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// MASTERY BOARD (read-only summary screen)
// =====================================================================
function MasteryBoardScreen({ profile, target, onBack, onPickTable }) {
  const profileId = profile ? profile.id : 'guest';
  const targetSnap = MMM.targetTableSnapshot(profileId, target);
  const allSnap = MMM.snapshot(profileId);

  const goldCount = allSnap.filter((f) => f.level === 'gold').length;
  const totalFacts = allSnap.length;

  return (
    <div className="relative min-h-screen mm-bg-dark p-5 sm:p-8">
      <div className="max-w-3xl mx-auto mm-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h1 className="mm-title text-2xl sm:text-3xl">Mastery Board</h1>
          <button className="mm-btn mm-btn-ghost" onClick={onBack}>← Back</button>
        </div>

        <div className="mm-problem-card mb-5 p-4">
          <div className="mm-subtitle text-[0.7rem] mb-1 opacity-80">Current spell</div>
          <div className="mm-cinzel text-2xl text-[#b9f0ff]">×{target}</div>
          <div className="mt-3 grid grid-cols-13 sm:grid-cols-13" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))', display: 'grid', gap: '4px' }}>
            {targetSnap.map((cell) => (
              <div
                key={cell.b}
                className={`mm-cell ${cell.level} target`}
                title={`${target} × ${cell.b} = ${target * cell.b} (${cell.correct}/${cell.attempts})`}
              >
                ×{cell.b}
              </div>
            ))}
          </div>
        </div>

        <div className="mm-problem-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="mm-subtitle text-[0.7rem] opacity-80">All tables</div>
              <div className="mm-cinzel text-lg text-[#fff3d0]">{goldCount} / {totalFacts} facts at gold</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="mx-auto" style={{ borderCollapse: 'separate', borderSpacing: 4 }}>
              <thead>
                <tr>
                  <th></th>
                  {MMC.MM_TARGET_TABLES.map((n) => (
                    <th key={n} className="mm-subtitle text-[0.65rem] opacity-70 px-1">{n}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MMC.MM_TARGET_TABLES.map((a) => (
                  <tr key={a}>
                    <th
                      className="mm-subtitle text-[0.65rem] opacity-70 pr-2 cursor-pointer hover:opacity-100"
                      onClick={() => onPickTable(a)}
                    >×{a}</th>
                    {MMC.MM_TARGET_TABLES.map((b) => {
                      // Mastery is order-independent; only show cell when a <= b
                      // for compact triangular grid (the other half is the same).
                      if (b < a) return <td key={b} style={{ visibility: 'hidden' }}><div className="mm-cell untested"></div></td>;
                      const rec = allSnap.find((f) => f.a === a && f.b === b) || { level: 'untested' };
                      return (
                        <td key={b}>
                          <div
                            className={`mm-cell ${rec.level} ${a === target || b === target ? 'target' : ''}`}
                            title={`${a} × ${b} = ${a * b}`}
                          >{a * b}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// LOCK-IN SCREEN — handwriting moment for new/missed facts
// =====================================================================
//
// Pedagogical purpose: when a fact gets flagged (kid missed it in arena),
// pause the action and have them PRODUCE the answer by writing it. Writing
// engages motor + visual + linguistic memory simultaneously and creates ~3x
// stronger memory traces than tapping a multiple-choice button. Claude
// Vision (server-side) reads the digits and grades.
//
// Flow:
//   1. Fact prompt + canvas
//   2. Kid writes answer
//   3. "Cast Rune" → grade via /api/grade-math (~1s)
//   4. Result: skip-count animation + voice fact, then "Continue"
//   5. Back to arena; that same fact is queued to appear next
//      (so the kid immediately attempts retrieval after production)
//
// `onComplete(success)` is called when the kid hits Continue. The arena
// then re-spawns the same fact for an immediate retrieval test.

function LockInScreen({ profile, problem, onComplete, onSkip }) {
  // Duck the arena music while the kid concentrates on the canvas.
  useEffect(() => {
    MMA.playMusic('arena', { volume: 0.16 });
    return () => MMA.playMusic('arena', { volume: 0.28 });
  }, []);
  // Re-anchor the fact when the lock-in screen first appears. The kid heard
  // it briefly during the arena miss; speaking it again here primes the
  // motor production they're about to do (writing the answer) — encoding
  // works best when auditory + visual + motor channels overlap.
  useEffect(() => {
    const id = setTimeout(() => MMA.speakFact(problem.a, problem.b, { rate: 0.92 }), 250);
    return () => clearTimeout(id);
  }, [problem]);
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('writing'); // writing | grading | result | done
  const [result, setResult] = useState(null); // { transcribed, correct, note }
  const [error, setError] = useState(null);
  const [skipStep, setSkipStep] = useState(0);

  // Skip-count animation playback (after a successful grade).
  useEffect(() => {
    if (phase !== 'result' || !result?.correct) return;
    const seq = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => problem.a * n).filter((v, i) => i <= problem.b);
    let cancelled = false;
    function step(i) {
      if (cancelled) return;
      if (i > problem.b) return;
      setSkipStep(i + 1);
      MMA.sfx.skipChime(i);
      setTimeout(() => step(i + 1), 220);
    }
    step(0);
    return () => { cancelled = true; };
  }, [phase, result, problem]);

  // Speak the full fact when entering the result phase, regardless of
  // correct/incorrect — this is the encoding moment.
  useEffect(() => {
    if (phase === 'result') {
      MMA.speakFact(problem.a, problem.b, { rate: 0.92 });
    }
  }, [phase, problem]);

  async function castRune() {
    if (!canvasRef.current || canvasRef.current.isEmpty()) return;
    setPhase('grading');
    setError(null);
    try {
      const dataUrl = canvasRef.current.getDataUrl();
      const body = await window.MathMageAPI.gradeMath({
        problem: { a: problem.a, b: problem.b },
        imageDataUrl: dataUrl,
        studentName: profile?.name,
      });
      setResult(body);
      setPhase('result');
      if (body.correct) {
        MMA.sfx.cast();
      } else {
        MMA.sfx.fizzle();
      }
    } catch (e) {
      setError(e?.message || 'Grading failed');
      setPhase('writing');
    }
  }

  function tryAgain() {
    if (canvasRef.current) canvasRef.current.clear();
    setResult(null);
    setError(null);
    setSkipStep(0);
    setPhase('writing');
  }

  return (
    <div className="relative min-h-screen mm-lockin-bg flex flex-col items-center justify-start px-4 py-6 sm:py-10">
      <div className="max-w-xl w-full mm-pop">
        <div className="text-center mb-3">
          <div className="mm-subtitle text-[0.7rem] opacity-90">Lock-in Spell</div>
          <div className="mm-cinzel text-sm text-[#b9f0ff] tracking-widest opacity-80 mt-1">
            inscribe the answer
          </div>
        </div>

        <div className="mm-lockin-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="mm-lockin-prompt">
              {problem.a} <span className="opacity-70">×</span> {problem.b}
              <span className="opacity-70"> = </span>
              <span className="opacity-50">?</span>
            </div>
          </div>

          {/* Dot-array representation. Shows the kid that 6×7 IS literally 7
              groups of 6 dots — concrete-visual scaffold, not just an abstract
              equation. We cap at b ≤ 12 so the grid stays readable on iPad. */}
          {phase === 'writing' && problem.a > 0 && problem.b > 0 && problem.b <= 12 && (
            <div
              className="mm-array-grid mb-4"
              style={{ gridTemplateColumns: `repeat(${problem.a}, minmax(0, 1fr))` }}
              aria-hidden="true"
            >
              {Array.from({ length: problem.a * problem.b }).map((_, i) => (
                <div key={i} className="mm-array-dot" />
              ))}
            </div>
          )}

          {phase === 'writing' && (
            <>
              <MathMageWritingCanvas
                ref={canvasRef}
                heightClass="h-[220px] sm:h-[260px]"
              />
              {error && (
                <div className="mt-3 text-center mm-cinzel text-sm text-[#7a1f27]">
                  {error}
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  className="mm-btn mm-btn-ghost"
                  onClick={() => canvasRef.current?.clear()}
                >Clear</button>
                <button
                  className="mm-btn mm-btn-primary"
                  onClick={castRune}
                >Cast Rune</button>
              </div>
              <div className="mt-3 text-center">
                <button
                  className="mm-cinzel text-xs uppercase tracking-widest opacity-60 hover:opacity-90"
                  onClick={onSkip}
                >Skip lock-in</button>
              </div>
            </>
          )}

          {phase === 'grading' && (
            <div className="py-12 text-center mm-cinzel text-lg">
              Reading the rune…
            </div>
          )}

          {phase === 'result' && result && (
            <>
              <div className="text-center mb-3">
                {result.correct ? (
                  <div>
                    <div className="text-5xl mb-2">✨</div>
                    <div className="mm-cinzel text-xl">Spell locked in!</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-5xl mb-2 opacity-70">🌫️</div>
                    <div className="mm-cinzel text-lg">
                      You wrote <span className="font-bold">{result.transcribed || '—'}</span>.
                      The answer is <span className="font-bold text-[#7a1f27]">{problem.a * problem.b}</span>.
                    </div>
                  </div>
                )}
                {result.note && (
                  <div className="mt-2 mm-serif italic text-base opacity-80">
                    {result.note}
                  </div>
                )}
              </div>

              {/* Skip-count cascade */}
              <div className="mm-skip-strip my-5">
                {Array.from({ length: skipStep }).map((_, i) => (
                  <div key={i} className="mm-skip-num" style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', padding: '0.3rem 0.7rem' }}>
                    {problem.a * i}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!result.correct && (
                  <button className="mm-btn mm-btn-ghost" onClick={tryAgain}>Try Again</button>
                )}
                <button
                  className={`mm-btn mm-btn-primary ${result.correct ? 'col-span-2' : ''}`}
                  onClick={() => onComplete(result.correct)}
                >Continue</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// SKIP-COUNT INTERSTITIAL (between waves)
// =====================================================================
function SkipCountInterstitial({ target, onDone }) {
  const [step, setStep] = useState(0);
  const seq = useMemo(() => MMC.mmSkipCount(target), [target]);

  useEffect(() => {
    let cancelled = false;
    function next(i) {
      if (cancelled) return;
      if (i >= seq.length) {
        setTimeout(() => { if (!cancelled) onDone(); }, 700);
        return;
      }
      setStep(i + 1);
      MMA.sfx.skipChime(i);
      setTimeout(() => next(i + 1), 220);
    }
    next(0);
    return () => { cancelled = true; };
  }, [seq, onDone]);

  return (
    <div className="relative min-h-screen mm-bg-arena flex flex-col items-center justify-center p-6">
      <div className="text-center mb-4 mm-slide-up">
        <div className="mm-subtitle text-xs sm:text-sm opacity-80">Skip-count Spellsong</div>
        <div className="mm-cinzel text-xl text-[#b9f0ff] mt-1">×{target}</div>
      </div>
      <div className="mm-skip-strip max-w-3xl">
        {seq.slice(0, step).map((n, i) => (
          <div key={i} className="mm-skip-num">{n}</div>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// VICTORY / GAME OVER
// =====================================================================
function VictoryScreen({ stats, target, onAgain, onMenu }) {
  useEffect(() => { MMA.playMusic('victory', { volume: 0.32 }); }, []);
  return (
    <div className="relative min-h-screen mm-bg-dark mm-vignette flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full mm-pop text-center">
        <div className="text-7xl mb-3">✨</div>
        <h1 className="mm-title text-4xl sm:text-5xl mb-2">Mastered!</h1>
        <p className="mm-subtitle text-xs opacity-90 mb-6">×{target} spell of the day</p>

        <div className="mm-problem-card text-left p-5 mb-5">
          <div className="grid grid-cols-2 gap-2 mm-cinzel">
            <div className="opacity-80">Correct</div>
            <div className="text-right text-[#b9f0ff]">{stats.correct} / {stats.total}</div>
            <div className="opacity-80">Best Combo</div>
            <div className="text-right text-[#ffd784]">{stats.comboBest}</div>
            <div className="opacity-80">HP Remaining</div>
            <div className="text-right">{'❤'.repeat(stats.hpRemaining)}</div>
            <div className="opacity-80">XP Earned</div>
            <div className="text-right text-[#ffd784]">+{stats.xp}</div>
            <div className="opacity-80">Coins</div>
            <div className="text-right text-[#ffd784]">+{stats.coins}</div>
            <div className="opacity-80">Reward Points</div>
            <div className="text-right text-[#ffd784]">+{stats.rewardPoints}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button className="mm-btn mm-btn-primary" onClick={onAgain}>Cast Again</button>
          <button className="mm-btn mm-btn-ghost" onClick={onMenu}>← Back to Tower</button>
        </div>
      </div>
    </div>
  );
}

function GameOverScreen({ stats, target, onAgain, onMenu }) {
  useEffect(() => { MMA.stopMusic({ ms: 1000 }); }, []);
  return (
    <div className="relative min-h-screen mm-bg-dark mm-vignette flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full mm-pop text-center">
        <div className="text-7xl mb-3 opacity-80">🌫️</div>
        <h1 className="mm-title text-4xl mb-2">The Wraiths Prevailed</h1>
        <p className="mm-subtitle text-xs opacity-90 mb-6">but the runes you cast are remembered</p>

        <div className="mm-problem-card text-left p-5 mb-5">
          <div className="grid grid-cols-2 gap-2 mm-cinzel">
            <div className="opacity-80">Correct</div>
            <div className="text-right text-[#b9f0ff]">{stats.correct} / {stats.total}</div>
            <div className="opacity-80">Wave Reached</div>
            <div className="text-right">{stats.waveReached}</div>
            <div className="opacity-80">XP Earned</div>
            <div className="text-right text-[#ffd784]">+{stats.xp}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button className="mm-btn mm-btn-primary" onClick={onAgain}>Try Again</button>
          <button className="mm-btn mm-btn-ghost" onClick={onMenu}>← Back to Tower</button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// ARENA — the gameplay screen
// =====================================================================
//
// State machine within Arena:
//   spawning → answering → resolving → (wave-end) → spawning ...
//                                    → (game-over | victory)
//
// Mastery is recorded on every CAST (correct or wrong). Spaced-repetition
// pickNext is called after each problem resolves, with `lastKey` and
// (optionally) `forceMissedKey` to surface a recently-missed fact again.

function ArenaScreen({ profile, target, onVictory, onGameOver }) {
  const profileId = profile ? profile.id : 'guest';

  // Switch to arena music as soon as we mount.
  useEffect(() => { MMA.playMusic('arena', { volume: 0.28 }); }, []);

  // Pool: ordered pairs for the target table (so 6×7 AND 7×6 both surface).
  const pool = useMemo(() => MMC.mmFactsForTable(target), [target]);

  // Boss-wave problem queue (set when entering boss wave).
  const bossQueueRef = useRef([]);

  const [waveIdx, setWaveIdx] = useState(0);
  const [problemsLeft, setProblemsLeft] = useState(MMC.MM_WAVES[0].problems);
  const [hp, setHp] = useState(MMC.MM_STARTING_HP);

  const [problem, setProblem] = useState(null); // { a, b, answer, key }
  const [typed, setTyped] = useState('');
  const [seenInSession, setSeenInSession] = useState(() => new Set());
  const [missCountInSession, setMissCountInSession] = useState({}); // key -> count
  const [forceMissedKey, setForceMissedKey] = useState(null);
  const lastKeyRef = useRef(null);
  const problemStartRef = useRef(0);

  // Lock-in: facts the kid has missed in arena get flagged here. The next
  // time spawnNext picks one of these, we route through LockInScreen FIRST
  // (kid writes the answer with handwriting → Claude grades), then surface
  // the same fact in arena for an immediate retrieval test. This pattern
  // (test→feedback→production→test) is the strongest known encoding loop.
  const lockInQueueRef = useRef(new Set());
  const [lockInProblem, setLockInProblem] = useState(null);

  // Session-wide tallies (for recap + mastery + achievements).
  // - fastCorrect: correct answers given in under 2 s (Speed Mage)
  // - lockInsCompleted: successful handwriting lock-ins (Lock-in Scholar)
  const [stats, setStats] = useState({
    correct: 0, total: 0, comboBest: 0, hpRemaining: MMC.MM_STARTING_HP,
    fastCorrect: 0, lockInsCompleted: 0,
  });
  const [combo, setCombo] = useState(0);
  const [wraithHit, setWraithHit] = useState(false);

  // For interstitial state ("between waves").
  const [interstitial, setInterstitial] = useState(false);

  const arenaRef = useRef(null);

  const wave = MMC.MM_WAVES[waveIdx];

  // ---- Spawn next problem ----
  const spawnNext = useCallback(() => {
    let next = null;
    if (wave && wave.isBoss) {
      // Boss queue is pre-shuffled; pop next.
      const q = bossQueueRef.current;
      if (q.length === 0) return null;
      next = q.shift();
    } else {
      next = MMM.pickNext({
        profileId,
        pool,
        lastKey: lastKeyRef.current,
        forceMissedKey,
      });
    }
    if (!next) return null;
    const key = MMM.factKey(next.a, next.b);

    // Lock-in interception: the kid missed this fact recently, route through
    // handwriting BEFORE letting it appear in arena.
    if (!wave.isBoss && lockInQueueRef.current.has(key)) {
      setLockInProblem({ ...next, key });
      setProblem(null);
      setTyped('');
      setForceMissedKey(null);
      return next;
    }

    setProblem({ ...next, key });
    setTyped('');
    setForceMissedKey(null);
    problemStartRef.current = performance.now();

    // Web Speech narration on first appearance of this fact in the session.
    // Speak only the QUESTION ("six times seven") — NOT the answer. Hearing
    // the answer right before tapping it short-circuits recall (recognition,
    // not retrieval). The full fact is voiced after a miss, or in the
    // handwriting lock-in moment (Phase 2) once the kid has produced it.
    setSeenInSession((prev) => {
      if (prev.has(key)) return prev;
      MMA.speakQuestion(next.a, next.b, { rate: 0.92 });
      const next2 = new Set(prev);
      next2.add(key);
      return next2;
    });

    return next;
  }, [pool, profileId, wave, forceMissedKey]);

  // Stable ref to spawnNext so the wave-setup effect can call it without
  // depending on the closure (spawnNext changes whenever forceMissedKey
  // flips, which would otherwise re-fire the effect mid-session).
  const spawnNextRef = useRef(spawnNext);
  useEffect(() => { spawnNextRef.current = spawnNext; }, [spawnNext]);

  // When entering a wave (including initial mount): reset problemsLeft +
  // build boss queue if needed + spawn first problem.
  useEffect(() => {
    setProblemsLeft(wave.problems);
    if (wave.isBoss) {
      const queue = [];
      for (let n = MMC.MM_FACT_MIN; n <= MMC.MM_FACT_MAX; n++) {
        queue.push({ a: target, b: n, answer: target * n });
      }
      bossQueueRef.current = shuffleInPlace(queue);
      MMA.sfx.bossSting();
    }
    const id = setTimeout(() => { spawnNextRef.current?.(); }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveIdx, target]);

  // ---- Submit answer ----
  const submit = useCallback((overrideTyped) => {
    if (!problem) return;
    const value = overrideTyped != null ? overrideTyped : typed;
    if (value === '' || value == null) return;
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    // Clear typed immediately so a double-tap on Cast can't double-submit
    // before spawnNext refreshes the problem.
    setTyped('');
    const correct = num === problem.answer;
    const ms = performance.now() - problemStartRef.current;

    MMM.recordAttempt({ profileId, a: problem.a, b: problem.b, correct, ms });

    // Compute next-stats snapshot synchronously so we can pass it to the
    // delayed wave-end / game-end handlers without relying on closure-stale
    // React state.
    const newCombo = correct ? combo + 1 : 0;
    const isFast = correct && ms < 2000;
    const nextStats = {
      ...stats,
      correct: stats.correct + (correct ? 1 : 0),
      total: stats.total + 1,
      comboBest: Math.max(stats.comboBest, newCombo),
      fastCorrect: stats.fastCorrect + (isFast ? 1 : 0),
    };

    if (correct) {
      // Juice: cyan flash, sparks, sound, +XP toast.
      MMA.sfx.cast();
      MMJ.shake(arenaRef.current, { soft: true });
      const rect = arenaRef.current?.getBoundingClientRect();
      if (rect) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        MMJ.sparkBurst(arenaRef.current, { clientX: cx, clientY: cy, count: 14, radius: 90 });
        MMJ.floatingText(arenaRef.current, { clientX: cx, clientY: cy - 80, text: `+${ms < 2000 ? 5 : 3} XP`, kind: ms < 2000 ? 'great' : 'good' });
      }
      setWraithHit(true);
      setTimeout(() => setWraithHit(false), 280);

      setCombo(newCombo);
      setStats(nextStats);
    } else {
      // Wrong: gentle voice cue, fizzle, hard shake, lose 1 HP.
      MMA.sfx.fizzle();
      MMA.sfx.hpLoss();
      MMJ.shake(arenaRef.current, { soft: false });
      MMJ.flash(arenaRef.current, { kind: 'bad' });
      const rect = arenaRef.current?.getBoundingClientRect();
      if (rect) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        MMJ.floatingText(arenaRef.current, { clientX: cx, clientY: cy - 80, text: `${problem.a} × ${problem.b} = ${problem.answer}`, kind: 'bad' });
      }
      // Speak the correct phrasing so the kid hears it right away.
      MMA.speakFact(problem.a, problem.b, { rate: 0.92 });

      setCombo(0);
      setStats(nextStats);

      // Force this fact to come back next round, bump miss counter, and
      // flag for handwriting lock-in. Lock-in won't fire on boss waves
      // (rapid-fire) but will on regular waves — see spawnNext.
      const k = problem.key;
      setMissCountInSession((m) => ({ ...m, [k]: (m[k] || 0) + 1 }));
      setForceMissedKey(k);
      if (!wave.isBoss) lockInQueueRef.current.add(k);

      const nextHp = hp - 1;
      setHp(nextHp);
      lastKeyRef.current = problem.key;

      if (nextHp <= 0) {
        // Game over. Skip advancing — finishGameOver swaps the screen.
        finishGameOver(nextStats);
        return;
      }

      // Otherwise advance like normal.
      setProblemsLeft((n) => {
        const next = n - 1;
        if (next <= 0) setTimeout(() => endWave(nextStats), 480);
        else           setTimeout(() => spawnNext(), 380);
        return next;
      });
      return;
    }

    // CORRECT path advance.
    lastKeyRef.current = problem.key;
    setProblemsLeft((n) => {
      const next = n - 1;
      if (next <= 0) setTimeout(() => endWave(nextStats), 480);
      else           setTimeout(() => spawnNext(), 380);
      return next;
    });
  }, [problem, typed, profileId, combo, stats, hp, spawnNext]);

  // ---- End of wave ----
  // `snapshotStats` is the post-submit stats snapshot computed in the submit
  // handler — using it (instead of `stats` from closure) avoids a stale-state
  // miscount when this fires inside a setTimeout.
  function endWave(snapshotStats) {
    if (waveIdx + 1 >= MMC.MM_WAVES.length) {
      finishVictory(snapshotStats);
      return;
    }
    MMA.sfx.bigCast();
    MMJ.flash(arenaRef.current, { kind: 'good' });
    setProblem(null);
    setInterstitial(true);
  }

  function continueAfterInterstitial() {
    setInterstitial(false);
    setWaveIdx((i) => i + 1);
  }

  // ---- Game end ----
  function finishVictory(snapshotStats) {
    MMA.sfx.victory();
    const rewards = MMC.mmComputeRewards({
      correct: snapshotStats.correct,
      total: snapshotStats.total,
      comboBest: snapshotStats.comboBest,
      hpRemaining: hp,
      bossCleared: true,
    });
    const finalStats = {
      ...snapshotStats, hpRemaining: hp, ...rewards, bossCleared: true,
      target, waveReached: MMC.MM_WAVES.length,
    };
    awardLuminaCore(finalStats);
    onVictory(finalStats);
  }

  function finishGameOver(snapshotStats) {
    MMA.sfx.gameover();
    const rewards = MMC.mmComputeRewards({
      correct: snapshotStats.correct,
      total: snapshotStats.total,
      comboBest: snapshotStats.comboBest,
      hpRemaining: 0,
      bossCleared: false,
    });
    const finalStats = {
      ...snapshotStats, hpRemaining: 0, ...rewards, bossCleared: false,
      target, waveReached: waveIdx + 1,
    };
    awardLuminaCore(finalStats);
    onGameOver(finalStats);
  }

  function awardLuminaCore(finalStats) {
    if (!profile || typeof window.LuminaCore === 'undefined') return;
    try {
      // Compute the post-session target-table snapshot to detect a fully-gold
      // target. The mastery snapshot is updated synchronously by recordAttempt
      // during play, so it's already current here.
      const tableSnap = MMM.targetTableSnapshot(profile.id, finalStats.target);
      const targetTableAllGold = tableSnap.length > 0
        && tableSnap.every((row) => row.level === 'gold');

      window.LuminaCore.addXP(profile.id, finalStats.xp, MMC.MM_GAME_ID);
      window.LuminaCore.addCoins(profile.id, finalStats.coins, MMC.MM_GAME_ID);
      window.LuminaCore.addRewardPoints(profile.id, finalStats.rewardPoints);
      // Pass the full game-stats payload so checkGameAchievements (case
      // 'math-mage' in lumina-core.js) can evaluate every Math Mage
      // achievement. The recordGameEnd call also bumps generic counters
      // (gamesWon, score) used by hub-wide lifetime achievements.
      window.LuminaCore.recordGameEnd(profile.id, MMC.MM_GAME_ID, {
        score: finalStats.correct,
        gamesWon: finalStats.bossCleared ? 1 : 0,
        target: finalStats.target,
        correct: finalStats.correct,
        attempted: finalStats.total,
        comboBest: finalStats.comboBest,
        fastCorrect: finalStats.fastCorrect || 0,
        lockInsCompleted: finalStats.lockInsCompleted || 0,
        bossCleared: !!finalStats.bossCleared,
        waveReached: finalStats.waveReached,
        targetTableAllGold,
      });
    } catch (e) { /* ignore */ }
  }

  // ---- Keypad handlers ----
  const onDigit = (d) => {
    MMA.sfx.keyPress();
    setTyped((t) => {
      // Cap at 4 digits (no fact answer exceeds 144).
      if (t.length >= 4) return t;
      return (t + String(d)).replace(/^0+(\d)/, '$1');
    });
  };
  const onClear = () => {
    MMA.sfx.keyPress();
    setTyped('');
  };
  const onCast = () => { submit(); };

  // Hardware keyboard support (desktop dev / parent assist).
  useEffect(() => {
    function onKey(e) {
      if (interstitial || !problem) return;
      if (e.key >= '0' && e.key <= '9') { onDigit(e.key); }
      else if (e.key === 'Backspace' || e.key === 'Delete') { setTyped((t) => t.slice(0, -1)); }
      else if (e.key === 'Escape') { onClear(); }
      else if (e.key === 'Enter') { onCast(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [interstitial, problem, typed]);

  // ---- Lock-in handlers ----
  // After a successful lock-in (kid wrote the answer + grade returned correct),
  // we surface the SAME fact again in arena for an immediate retrieval test.
  // After a skipped / wrong lock-in (kid bailed), we just move on to whatever
  // the spaced-repetition picker chooses — no penalty, no forced retest.
  function onLockInComplete(success) {
    if (lockInProblem) {
      lockInQueueRef.current.delete(lockInProblem.key);
      if (success) {
        // Force this fact back to arena for a fluency check.
        setForceMissedKey(lockInProblem.key);
        // Bypass no-repeat filter so the same fact can appear immediately.
        lastKeyRef.current = null;
        // Reset miss count — kid just produced it correctly.
        const k = lockInProblem.key;
        setMissCountInSession((m) => ({ ...m, [k]: 0 }));
        // Increment lock-in counter for the Lock-in Scholar achievement.
        setStats((s) => ({ ...s, lockInsCompleted: (s.lockInsCompleted || 0) + 1 }));
      }
    }
    setLockInProblem(null);
    setTimeout(() => spawnNextRef.current?.(), 200);
  }

  function onLockInSkip() {
    if (lockInProblem) {
      lockInQueueRef.current.delete(lockInProblem.key);
    }
    setLockInProblem(null);
    setTimeout(() => spawnNextRef.current?.(), 200);
  }

  if (lockInProblem) {
    return (
      <LockInScreen
        profile={profile}
        problem={lockInProblem}
        onComplete={onLockInComplete}
        onSkip={onLockInSkip}
      />
    );
  }

  if (interstitial) {
    return <SkipCountInterstitial target={target} onDone={continueAfterInterstitial} />;
  }

  return (
    <div ref={arenaRef} className="relative min-h-screen mm-bg-arena mm-bg-arena-img overflow-hidden">
      {/* HUD */}
      <div className="absolute top-3 left-0 right-0 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="mm-wave-banner text-xs sm:text-sm">{wave.label}</div>
          <div className="mm-cinzel text-xs opacity-70">{wave.problems - problemsLeft + 1} / {wave.problems}</div>
        </div>
        <div className="mm-hp-track">
          {Array.from({ length: MMC.MM_STARTING_HP }).map((_, i) => (
            <div key={i} className={`mm-hp-pip ${i >= hp ? 'mm-hp-lost' : ''}`} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="mm-cinzel text-xs opacity-70">Combo</div>
          <div className="mm-cinzel text-xl text-[#ffd784] min-w-[2ch] text-right">{combo}</div>
        </div>
      </div>

      {/* Spell circle + wraith + problem */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="mm-spell-circle relative flex items-center justify-center mb-8">
          <div className="mm-circle-spin"></div>
          <img
            src="../assets/sprites/math-mage/spell_circle.png?v=2"
            alt=""
            className="mm-circle-art"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          {/* Wraith hovers just inside the spell circle's top arc.
              Keeping it INSIDE (negative offset minimal) avoids overlapping
              the HUD HP pips, especially on shorter viewports / iPad. */}
          <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-[1]">
            <div className={`mm-wraith ${wave.isBoss ? 'mm-boss' : ''} ${wraithHit ? 'mm-wraith-hit' : ''}`}>
              <img
                src={wave.isBoss
                  ? '../assets/sprites/math-mage/wraith_boss.png?v=2'
                  : '../assets/sprites/math-mage/wraith_basic.png?v=2'}
                alt=""
                onError={(e) => {
                  // Fallback to emoji if sprite missing.
                  const span = document.createElement('span');
                  span.textContent = wave.isBoss ? '👁️‍🗨️' : '👻';
                  e.currentTarget.replaceWith(span);
                }}
              />
            </div>
          </div>
          <div className="mm-problem-card mm-pop text-center px-6 py-5 sm:px-10 sm:py-7" key={problem ? problem.key + ':' + problemsLeft : 'empty'}>
            {problem ? (
              <>
                <div className="mm-problem">
                  {problem.a} <span className="opacity-70">×</span> {problem.b}
                </div>
                <div className="mt-2 mm-cinzel text-2xl sm:text-3xl text-[#b9f0ff] tracking-widest min-h-[1.6em]">
                  {typed === '' ? <span className="opacity-30">_</span> : typed}
                </div>
              </>
            ) : (
              <div className="mm-cinzel text-xl opacity-70">…</div>
            )}
          </div>
        </div>

        {/* Keypad */}
        <div className="mm-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button key={d} className="mm-key" onClick={() => onDigit(d)}>{d}</button>
          ))}
          <button className="mm-key mm-key-clear mm-key-action" onClick={onClear}>Clear</button>
          <button className="mm-key" onClick={() => onDigit(0)}>0</button>
          <button className="mm-key mm-key-cast mm-key-action" onClick={onCast}>Cast ✨</button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// TOP-LEVEL APP
// =====================================================================
function MathMage() {
  const [profile, setProfile] = useState(null);
  const [screen, setScreen] = useState('menu'); // menu | board | arena | victory | gameover
  const [target, setTarget] = useState(6);
  const [resultStats, setResultStats] = useState(null);
  const [arenaKey, setArenaKey] = useState(0); // bump to remount Arena for "play again"

  // Load profile from LuminaCore on mount; default target by profile.
  useEffect(() => {
    let p = null;
    try { p = window.LuminaCore?.getActiveProfile?.() || null; } catch (e) {}
    setProfile(p);
    const stored = loadStoredTarget(p?.id);
    const initial = stored != null ? stored : MMC.mmDefaultTargetTable(p);
    setTarget(initial);
    if (p && window.LuminaCore?.recordGameStart) {
      try { window.LuminaCore.recordGameStart(p.id, MMC.MM_GAME_ID); } catch (e) {}
    }
    // Unlock audio on the very first user gesture (touchstart anywhere).
    const onFirstGesture = () => {
      MMA.unlock();
      window.removeEventListener('touchstart', onFirstGesture);
      window.removeEventListener('mousedown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
    window.addEventListener('touchstart', onFirstGesture, { passive: true });
    window.addEventListener('mousedown', onFirstGesture);
    window.addEventListener('keydown', onFirstGesture);
    return () => {
      window.removeEventListener('touchstart', onFirstGesture);
      window.removeEventListener('mousedown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
  }, []);

  const onChangeTarget = useCallback((n) => {
    setTarget(n);
    saveStoredTarget(profile?.id, n);
  }, [profile]);

  const startArena = () => {
    setResultStats(null);
    setArenaKey((k) => k + 1);
    setScreen('arena');
  };

  if (screen === 'arena') {
    return (
      <ArenaScreen
        key={arenaKey}
        profile={profile}
        target={target}
        onVictory={(stats) => { setResultStats(stats); setScreen('victory'); }}
        onGameOver={(stats) => { setResultStats(stats); setScreen('gameover'); }}
      />
    );
  }
  if (screen === 'board') {
    return (
      <MasteryBoardScreen
        profile={profile}
        target={target}
        onBack={() => setScreen('menu')}
        onPickTable={(n) => { onChangeTarget(n); setScreen('menu'); }}
      />
    );
  }
  if (screen === 'victory' && resultStats) {
    return (
      <VictoryScreen
        stats={resultStats}
        target={target}
        onAgain={startArena}
        onMenu={() => setScreen('menu')}
      />
    );
  }
  if (screen === 'gameover' && resultStats) {
    return (
      <GameOverScreen
        stats={resultStats}
        target={target}
        onAgain={startArena}
        onMenu={() => setScreen('menu')}
      />
    );
  }

  return (
    <MenuScreen
      profile={profile}
      target={target}
      onChangeTarget={onChangeTarget}
      onStart={startArena}
      onShowBoard={() => setScreen('board')}
    />
  );
}
