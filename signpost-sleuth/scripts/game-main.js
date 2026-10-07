// ==================== MAIN APP ====================
const SCREEN_MUSIC = {
  title: 'menu', school: 'menu', cases: 'menu', ready: 'menu', jot: 'menu',
  story: 'story', speed: 'speed', quiz: 'quiz', drill: 'quiz',
  caseResult: 'victory', victory: 'victory',
};

function MenuTile({ icon, title, sub, color, onClick, glow, delay = 0 }) {
  return (
    <button onClick={onClick} style={{ animationDelay: `${delay}s` }}
      className={cx('ps-btn ps-rise relative text-left rounded-3xl p-4 shadow-xl border-b-4 bg-gradient-to-br', color, glow && 'ps-glow')}>
      {glow && <span className="absolute -top-2 -right-2 rounded-full bg-amber-300 text-amber-950 text-xs font-bold px-2 py-1 shadow">Next up!</span>}
      <div className="text-3xl">{icon}</div>
      <div className="font-title text-xl text-white leading-tight mt-1">{title}</div>
      <div className="text-sm font-semibold text-white/85">{sub}</div>
    </button>
  );
}

function TitleScreen({ mastery, player, audio, go }) {
  const d = mastery.data;
  const readiness = mastery.readiness(SKILLS);
  const casesDone = STORIES.cases.filter(c => d.cases[c.id]).length;
  const stars = STORIES.cases.reduce((n, c) => n + ((d.cases[c.id] && d.cases[c.id].stars) || 0), 0);
  const next = d.badges.length < SIGNPOSTS.length ? 'school' : casesDone < STORIES.cases.length ? 'cases' : 'quiz';
  const name = player ? player.name : 'Detective';
  const welcome = CONTENT.narration.welcome.replace('Detective Emma', `Detective ${name}`);

  return (
    <div className="min-h-screen pb-10">
      <Backdrop bg={BG_PATHS.title} dim={0.3} />
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between">
          {player ? <a href="../index.html" className="ps-btn rounded-xl bg-black/35 hover:bg-black/50 text-white px-3 py-2 font-title">🏠 Noyola Hub</a> : <span />}
          <TopBar audio={audio} />
        </div>
        <div className="text-center mt-2">
          <div className="flex justify-center gap-1 mb-1">
            {SIGNPOSTS.map((sp, k) => <SignpostSign key={sp.id} id={sp.id} size={40} className="ps-drop" style={{ animationDelay: `${k * 0.07}s` }} />)}
          </div>
          <h1 className="font-title text-5xl sm:text-6xl text-amber-100 ps-title-shadow">Signpost Sleuth</h1>
          <div className="font-title text-xl text-amber-200 ps-title-shadow">Notice & Note · Reading Detective</div>
        </div>
        <div className="mt-5"><SageSays audio={audio} voiceKey="n_welcome" text={welcome} /></div>
        <div className="mt-5 bg-black/35 rounded-2xl px-4 py-3">
          <ReadyMeter pct={readiness} />
          <div className="text-amber-100 text-sm font-bold mt-1">📅 {quizCountdownLabel()} (Friday 10/9)</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
          <MenuTile icon="🏫" title="Sign School" sub={`${d.badges.length}/6 badges`} color="from-amber-500 to-orange-600 border-orange-800" glow={next === 'school'} onClick={() => go('school')} />
          <MenuTile icon="🔎" title="Case Files" sub={`${casesDone}/4 stories · ${stars}⭐`} color="from-emerald-500 to-teal-700 border-teal-900" glow={next === 'cases'} onClick={() => go('cases')} delay={0.05} />
          <MenuTile icon="🏁" title="Speed Signs" sub={`Best: ${d.speedBest || 0}`} color="from-sky-500 to-indigo-600 border-indigo-900" onClick={() => go('speed')} delay={0.1} />
          <MenuTile icon="📝" title="Practice Quiz" sub={d.bestQuiz == null ? 'Like Friday\'s quiz' : `Best: ${d.bestQuiz}%`} color="from-violet-500 to-purple-700 border-purple-900" glow={next === 'quiz'} onClick={() => go('quiz')} delay={0.15} />
          <MenuTile icon="📊" title="Quiz Ready" sub="See weak spots" color="from-rose-500 to-pink-700 border-pink-900" onClick={() => go('ready')} delay={0.2} />
          <MenuTile icon="📌" title="Stop & Jot" sub={`${d.jots.length} notes · homework`} color="from-yellow-500 to-amber-600 border-amber-800" onClick={() => go('jot')} delay={0.25} />
        </div>
      </div>
    </div>
  );
}

function VictoryScreen({ audio, mastery, onQuiz, onHome }) {
  useEffect(() => {
    audio.say('n_victory', CONTENT.narration.victory);
    const t = [0, 500, 1000].map(ms => setTimeout(() => Juice.confetti(window.innerWidth * (0.3 + Math.random() * 0.4), window.innerHeight / 3, { count: 40 }), ms));
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Backdrop bg={BG_PATHS.title} dim={0.45} />
      <div className="text-center max-w-md">
        <img src={SPRITE_PATHS.trophy} alt="" className="w-44 h-44 object-contain mx-auto ps-trophy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <div className="font-title text-5xl text-amber-100 ps-title-shadow mt-2">Case Closed!</div>
        <div className="text-amber-50 font-semibold mt-2">You solved all four stories and found every kind of signpost.</div>
        <div className="mt-4"><ReadyMeter pct={mastery.readiness(SKILLS)} /></div>
        <div className="flex gap-3 justify-center mt-6">
          <BigButton color="paper" onClick={onHome}>Home</BigButton>
          <BigButton color="violet" onClick={onQuiz}>Take the practice quiz</BigButton>
        </div>
      </div>
    </div>
  );
}

function SignpostSleuth() {
  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = new AudioManager();
  const audio = audioRef.current;

  const playerRef = useRef(null);
  const masteryRef = useRef(null);
  if (!masteryRef.current) {
    const player = LUMINA_ENABLED ? LuminaCore.getActiveProfile() : null;
    playerRef.current = player;
    masteryRef.current = new MasteryStore(player && player.id);
    if (player && LuminaCore.getGameSave) {
      const saved = LuminaCore.getGameSave(player.id, LUMINA_GAME_ID);
      if (saved && saved.state) masteryRef.current.mergeFrom(saved.state);
    }
  }
  const mastery = masteryRef.current;
  const player = playerRef.current;

  const [screen, setScreen] = useState('title');
  const [caseIdx, setCaseIdx] = useState(0);
  const [caseResult, setCaseResult] = useState(null);
  const [runKey, setRunKey] = useState(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (player) LuminaCore.recordGameStart(player.id, LUMINA_GAME_ID);
    const unlock = () => {
      audio.unlock();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    const track = SCREEN_MUSIC[screen];
    if (track) audio.playMusic(track);
    window.scrollTo(0, 0);
  }, [screen]);

  const persist = () => {
    mastery.save();
    if (player && LuminaCore.setGameSave) LuminaCore.setGameSave(player.id, LUMINA_GAME_ID, mastery.data);
    setTick(t => t + 1);
  };

  const reward = ({ xp = 0, coins = 0, points = 0, stats = {} }) => {
    if (!player) return;
    if (xp) LuminaCore.addXP(player.id, Math.round(xp), LUMINA_GAME_ID);
    if (coins) LuminaCore.addCoins(player.id, Math.round(coins), LUMINA_GAME_ID);
    if (points) LuminaCore.addRewardPoints(player.id, points);
    LuminaCore.recordGameEnd(player.id, LUMINA_GAME_ID, stats);
    if (LuminaCore.checkDailyChallengeProgress) {
      LuminaCore.checkDailyChallengeProgress(player.id, LUMINA_GAME_ID, {
        questionsCorrect: stats.questionsCorrect || 0,
        questionsTotal: stats.questionsTotal || 0,
      });
    }
    if (LuminaCore.checkCrossGameAchievements) LuminaCore.checkCrossGameAchievements(player.id);
  };

  const go = (s) => { audio.sfx('tap'); audio.stopVoice(); setRunKey(k => k + 1); setScreen(s); };
  const home = () => { persist(); setScreen('title'); };

  const onBadge = (spId, score, total, passed) => {
    const isNew = passed && mastery.addBadge(spId);
    reward({
      xp: isNew ? REWARDS.badgeXp : score * 2, coins: isNew ? 10 : score, points: isNew ? 1 : 0,
      stats: { badges: isNew ? 1 : 0, questionsCorrect: score, questionsTotal: total },
    });
    persist();
    return isNew;
  };

  const onCaseEnd = (res) => {
    const first = mastery.saveCase(res.caseId, res.score, res.stars);
    reward({
      xp: REWARDS.caseXp + res.score / REWARDS.casePointsPerXp,
      coins: res.score / 25,
      points: res.stars >= 2 ? 3 : 1,
      stats: { casesSolved: first ? 1 : 0, questionsCorrect: res.found, questionsTotal: res.total },
    });
    persist();
    setCaseResult(res);
    const allDone = STORIES.cases.every(c => mastery.data.cases[c.id]);
    if (allDone && !mastery.data.victorySeen) {
      mastery.data.victorySeen = true;
      persist();
      setScreen('victory');
    } else {
      setScreen('caseResult');
    }
  };

  const onSpeedEnd = (res) => {
    mastery.data.speedBest = Math.max(mastery.data.speedBest || 0, res.score);
    reward({
      xp: 5 + res.score / REWARDS.speedPointsPerXp, coins: res.score / 100, points: res.score >= SPEED_STAR_SCORES[1] ? 2 : 1,
      stats: { maxCombo: res.maxCombo, speedRuns: 1, questionsCorrect: res.correct, questionsTotal: res.answered },
    });
    persist();
  };

  const onQuizFinish = (graded) => {
    mastery.data.quizRuns = (mastery.data.quizRuns || 0) + 1;
    if (mastery.data.bestQuiz == null || graded.pct > mastery.data.bestQuiz) mastery.data.bestQuiz = graded.pct;
    reward({
      xp: graded.pct * REWARDS.quizXpPerPct, coins: graded.pct / 5, points: graded.pct >= 80 ? 4 : 2,
      stats: { highScore: graded.pct, practiceQuizzes: 1 },
    });
    persist();
  };

  const onJotSave = (jot) => {
    const todayCount = mastery.addJot(jot);
    const earns = todayCount <= REWARDS.jotDailyLimit;
    reward({ xp: earns ? REWARDS.jotXp : 0, coins: earns ? 5 : 0, points: earns ? 1 : 0, stats: { jots: 1 } });
    persist();
  };

  const onDrillEnd = (res) => {
    reward({ xp: res.correct * 3, coins: res.correct, stats: { questionsCorrect: res.correct, questionsTotal: res.answered } });
    persist();
    setScreen('ready');
  };

  const story = STORIES.cases[caseIdx];

  switch (screen) {
    case 'title':
      return <TitleScreen mastery={mastery} player={player} audio={audio} go={go} />;
    case 'school':
      return <SignSchool audio={audio} mastery={mastery} onBadge={onBadge} onBack={home} />;
    case 'cases':
      return <CaseList mastery={mastery} audio={audio} onBack={home} onPick={(k) => { audio.stopVoice(); setCaseIdx(k); setRunKey(r => r + 1); setScreen('story'); }} />;
    case 'story':
      return <StoryReader key={runKey} story={story} audio={audio} mastery={mastery} onEnd={onCaseEnd} onQuit={() => { persist(); setScreen('cases'); }} />;
    case 'caseResult':
      return (
        <CaseResult result={caseResult} story={story} audio={audio}
          onRetry={() => { setRunKey(r => r + 1); setScreen('story'); }}
          onCases={() => setScreen('cases')}
          onNext={caseIdx + 1 < STORIES.cases.length ? () => { setCaseIdx(caseIdx + 1); setRunKey(r => r + 1); setScreen('story'); } : null} />
      );
    case 'victory':
      return <VictoryScreen audio={audio} mastery={mastery} onHome={home} onQuiz={() => go('quiz')} />;
    case 'speed':
      return <SpeedSigns key={runKey} audio={audio} mastery={mastery} onEnd={onSpeedEnd} onBack={home} />;
    case 'quiz':
      return <PracticeQuiz key={runKey} audio={audio} mastery={mastery} onFinish={onQuizFinish} onBack={home} />;
    case 'ready':
      return <ReadyScreen mastery={mastery} audio={audio} onBack={home} onDrill={() => go('drill')} onQuiz={() => go('quiz')} />;
    case 'drill':
      return <WeakDrill key={runKey} mastery={mastery} audio={audio} onEnd={onDrillEnd} onBack={() => setScreen('ready')} />;
    case 'jot':
      return <StopAndJot mastery={mastery} audio={audio} onSave={onJotSave} onBack={home} />;
    default:
      return null;
  }
}
