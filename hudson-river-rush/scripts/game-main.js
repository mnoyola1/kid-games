// ==================== MAIN APP ====================
const SCREEN_MUSIC = {
  title: 'menu', map: 'menu', legIntro: 'menu', ready: 'menu',
  river: 'river', weak: 'river', boss: 'boss',
  dock: 'dock', practice: 'dock',
  legResult: 'victory', victory: 'victory',
};

function HudsonRiverRush() {
  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = new AudioManager();
  const audio = audioRef.current;

  const playerRef = useRef(null);
  const masteryRef = useRef(null);
  if (!masteryRef.current) {
    const player = LUMINA_ENABLED ? LuminaCore.getActiveProfile() : null;
    playerRef.current = player;
    masteryRef.current = new MasteryStore(player && player.id);
    if (player) {
      const saved = LuminaCore.getGameSave && LuminaCore.getGameSave(player.id, LUMINA_GAME_ID);
      if (saved && saved.state) masteryRef.current.mergeFrom(saved.state);
    }
  }
  const mastery = masteryRef.current;
  const player = playerRef.current;

  const [screen, setScreen] = useState('title');
  const [legIdx, setLegIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [runKey, setRunKey] = useState(0);
  const [, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  const leg = CONTENT.legs[legIdx];
  const readiness = mastery.readiness(CONTENT.items);

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
    if (screen === 'legResult' && result && !result.won) audio.playMusic('menu');
    else if (track) audio.playMusic(track);
  }, [screen]);

  const persist = () => {
    mastery.save();
    if (player && LuminaCore.setGameSave) LuminaCore.setGameSave(player.id, LUMINA_GAME_ID, mastery.data);
    refresh();
  };

  const reward = ({ xp = 0, coins = 0, points = 0, stats = {} }) => {
    if (!player) return;
    if (xp) LuminaCore.addXP(player.id, xp, LUMINA_GAME_ID);
    if (coins) LuminaCore.addCoins(player.id, coins, LUMINA_GAME_ID);
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

  const runReward = (res, extra = {}) => {
    reward({
      xp: (res.won ? REWARDS.legXp : 5) + res.correct * REWARDS.xpPerCorrect + (extra.xp || 0),
      coins: Math.round(res.coins / 2) + (res.won ? REWARDS.legCoins : 0),
      points: res.won ? (extra.points || 2) : 0,
      stats: {
        questionsCorrect: res.correct,
        questionsTotal: res.answered,
        maxCombo: res.maxCombo,
        legsCompleted: res.won && !extra.boss ? 1 : 0,
        bossWins: res.won && extra.boss ? 1 : 0,
      },
    });
  };

  // ---------- flow ----------
  const startLeg = (i) => {
    setLegIdx(i);
    setScreen('legIntro');
  };

  const onLegEnd = (res) => {
    setResult(res);
    if (res.won) mastery.clearLeg(leg.id);
    runReward(res);
    persist();
    setScreen('legResult');
  };

  const afterLegResult = () => {
    if (leg.dock === 'boss') setScreen('bossIntro');
    else setScreen('dock');
  };

  const afterDock = () => {
    persist();
    if (legIdx + 1 < CONTENT.legs.length) startLeg(legIdx + 1);
    else setScreen('map');
  };

  const onBossEnd = (res) => {
    setResult(res);
    if (res.won) mastery.data.bossBeaten = true;
    runReward(res, { boss: true, xp: res.won ? REWARDS.bossXp : 0, points: 5 });
    persist();
    setScreen(res.won ? 'victory' : 'bossResult');
  };

  const weakQuestions = () => {
    const weakItems = new Set(CONTENT.items.filter(it => mastery.level(it.id) < MASTERY_READY_LEVEL).map(it => it.id));
    let qs = CONTENT.questions.filter(q => weakItems.has(q.item));
    if (qs.length < 5) qs = qs.concat(shuffle(CONTENT.questions.filter(q => !weakItems.has(q.item))).slice(0, 5 - qs.length));
    return qs;
  };

  const onWeakEnd = (res) => {
    setResult(res);
    runReward(res);
    persist();
    setScreen('weakResult');
  };

  const onPracticeFinish = (graded, done) => {
    if (graded) {
      mastery.data.practiceRuns = (mastery.data.practiceRuns || 0) + 1;
      if (mastery.data.bestPractice == null || graded.pct > mastery.data.bestPractice) mastery.data.bestPractice = graded.pct;
      reward({
        xp: Math.round(graded.points * REWARDS.practiceXpPerPoint),
        coins: Math.round(graded.pct / 5),
        points: graded.pct >= 80 ? 4 : 2,
        stats: { highScore: graded.pct, practiceTests: 1 },
      });
      persist();
    }
    if (done) setScreen('ready');
  };

  const quitToMap = () => {
    audio.stopVoice();
    setScreen('map');
  };

  // ---------- render ----------
  switch (screen) {
    case 'title':
      return <TitleScreen readiness={readiness} playerName={player && player.name} onRun={() => setScreen('map')} onPractice={() => setScreen('practice')} onReady={() => setScreen('ready')} />;
    case 'map':
      return <MapScreen mastery={mastery} onPickLeg={startLeg} onBoss={() => setScreen('bossIntro')} onBack={() => setScreen('title')} />;
    case 'legIntro':
      return <LegIntro leg={leg} index={legIdx} audio={audio} onBack={() => setScreen('map')} onGo={() => { setRunKey(k => k + 1); setScreen('river'); }} />;
    case 'river':
      return (
        <RiverScreen key={runKey} title={leg.name} themeId={leg.id} goal={leg.goal} audio={audio} mastery={mastery}
          questions={CONTENT.questions.filter(q => q.leg === leg.id)} onEnd={onLegEnd} onQuit={quitToMap} />
      );
    case 'legResult':
      return (
        <LegResult result={result} leg={leg} onMap={() => setScreen('map')}
          nextLabel={leg.dock === 'boss' ? 'Niagara Showdown' : 'Dock Challenge'}
          onNext={afterLegResult} onRetry={() => { setRunKey(k => k + 1); setScreen('river'); }} />
      );
    case 'dock':
      return <DockScreen key={leg.id} dockKey={leg.dock} leg={leg} audio={audio} mastery={mastery} onDone={afterDock} />;
    case 'bossIntro':
      return <LegIntro boss leg={CONTENT.legs[CONTENT.legs.length - 1]} index={CONTENT.legs.length} audio={audio} onBack={() => setScreen('map')} onGo={() => { setRunKey(k => k + 1); setScreen('boss'); }} />;
    case 'boss':
      return <RiverScreen key={runKey} boss title="Niagara Showdown" themeId="niagara" goal={6} audio={audio} mastery={mastery} questions={CONTENT.questions} onEnd={onBossEnd} onQuit={quitToMap} />;
    case 'bossResult':
      return <LegResult boss result={result} leg={leg} nextLabel="" onMap={() => setScreen('map')} onRetry={() => { setRunKey(k => k + 1); setScreen('boss'); }} />;
    case 'victory':
      return <VictoryScreen audio={audio} readiness={readiness} onPractice={() => setScreen('practice')} onHome={() => setScreen('title')} />;
    case 'weak':
      return <RiverScreen key={runKey} title="Weak Spot Run" themeId="canal" goal={6} audio={audio} mastery={mastery} questions={weakQuestions()} onEnd={onWeakEnd} onQuit={() => setScreen('ready')} />;
    case 'weakResult':
      return <LegResult result={result} leg={CONTENT.legs[3]} nextLabel="Test Ready Check" onNext={() => setScreen('ready')} onMap={() => setScreen('map')} onRetry={() => { setRunKey(k => k + 1); setScreen('weak'); }} />;
    case 'practice':
      return <PracticeTest audio={audio} mastery={mastery} onFinish={onPracticeFinish} onBack={() => setScreen('title')} />;
    case 'ready':
      return <ReadyScreen mastery={mastery} audio={audio} onBack={() => setScreen('title')} onPractice={() => setScreen('practice')} onWeakRun={() => { setRunKey(k => k + 1); setScreen('weak'); }} />;
    default:
      return null;
  }
}
