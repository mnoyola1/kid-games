// ==================== MAIN APP ====================
// School decks come from Google Classroom (shared/study-sets.js); "My decks" are made here or imported
// from Quizlet and saved with the player's profile, so they follow them to other devices.

function schoolDecksFor(player, sets) {
  const kid = player && ['emma', 'liam'].includes(player.id) ? player.id : null;
  return sets
    .filter((s) => s.data && Array.isArray(s.data.cards) && s.data.cards.length && (!kid || s.kid === kid))
    .map((s) => ({ id: s.id, name: s.name, subject: s.subject, testDate: s.test_date, kid: s.kid, cards: s.data.cards, source: 'classroom' }))
    .sort((a, b) => {
      const da = daysUntil(a.testDate), db = daysUntil(b.testDate);
      const ua = da !== null && da >= 0 ? da : 999, ub = db !== null && db >= 0 ? db : 999;
      return ua - ub;
    });
}

function FlashQuest() {
  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = new AudioManager();
  const audio = audioRef.current;

  const playerRef = useRef(null);
  const storeRef = useRef(null);
  if (!storeRef.current) {
    playerRef.current = LUMINA_ENABLED ? LuminaCore.getActiveProfile() : null;
    storeRef.current = new DeckStore(playerRef.current);
  }
  const player = playerRef.current;
  const store = storeRef.current;

  const [screen, setScreen] = useState('home');
  const [schoolDecks, setSchoolDecks] = useState(() => schoolDecksFor(player, window.StudySets ? StudySets.cached({ kind: 'deck' }) : []));
  const [loading, setLoading] = useState(true);
  const [deckId, setDeckId] = useState(null);
  const [mode, setMode] = useState('flip');
  const [reversed, setReversed] = useState(false);
  const [result, setResult] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [roundKey, setRoundKey] = useState(0);
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const myDecks = store.data.decks;
  const deck = [...schoolDecks, ...myDecks].find((d) => d.id === deckId);

  useEffect(() => {
    if (player) LuminaCore.recordGameStart(player.id, LUMINA_GAME_ID);
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    if (window.StudySets) {
      StudySets.load({ kind: 'deck' }).then((sets) => {
        setSchoolDecks(schoolDecksFor(player, sets));
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  const open = (d) => { audio.play('tap'); setDeckId(d.id); setScreen('deck'); };

  const play = (m) => { setMode(m); setRoundKey((k) => k + 1); setScreen('play'); };

  const finish = (res) => {
    const xp = res.correct * REWARDS.xpPerCorrect + (res.mode === 'match' ? REWARDS.matchXp : REWARDS.roundXp);
    const coins = res.correct * REWARDS.coinsPerCorrect + (res.correct === res.total ? 5 : 0);
    if (player) {
      LuminaCore.addXP(player.id, xp, LUMINA_GAME_ID);
      LuminaCore.addCoins(player.id, coins, LUMINA_GAME_ID);
      LuminaCore.addRewardPoints(player.id, Math.floor(xp * 0.1));
      LuminaCore.recordGameEnd(player.id, LUMINA_GAME_ID, {
        highScore: res.score || 0,
        questionsCorrect: res.correct,
        questionsTotal: res.total,
        maxCombo: res.maxCombo,
        matchWins: res.mode === 'match' ? 1 : 0,
        cardsMastered: [...schoolDecks, ...myDecks].reduce((n, d) => n + store.mastered(d), 0),
      });
      if (LuminaCore.checkDailyChallengeProgress) {
        LuminaCore.checkDailyChallengeProgress(player.id, LUMINA_GAME_ID, { questionsCorrect: res.correct, questionsTotal: res.total });
      }
      if (LuminaCore.checkCrossGameAchievements) LuminaCore.checkCrossGameAchievements(player.id);
    }
    audio.play('win');
    setRewards(player ? { xp, coins } : null);
    setResult(res);
    setScreen('results');
  };

  const saveDeck = (d) => {
    const isNew = !myDecks.some((x) => x.id === d.id);
    store.saveDeck(d);
    if (isNew && player) LuminaCore.recordGameEnd(player.id, LUMINA_GAME_ID, { decksMade: 1 });
    audio.play('correct');
    setDeckId(d.id);
    setScreen('deck');
  };

  if (screen === 'import') return <ImportScreen onSave={saveDeck} onBack={() => setScreen('home')} />;
  if (screen === 'create') return <EditorScreen onSave={saveDeck} onBack={() => setScreen('home')} />;
  if (!deck || screen === 'home') {
    return (
      <HomeScreen
        player={player} schoolDecks={schoolDecks} myDecks={myDecks} store={store} loading={loading} audio={audio}
        onOpen={open} onImport={() => setScreen('import')} onCreate={() => setScreen('create')}
      />
    );
  }
  if (screen === 'edit') return <EditorScreen deck={deck} onSave={saveDeck} onBack={() => setScreen('deck')} />;
  if (screen === 'play') {
    const Mode = { flip: FlipMode, quiz: QuizMode, match: MatchMode }[mode];
    return <Mode key={roundKey} deck={deck} store={store} reversed={reversed} audio={audio} onDone={finish} onQuit={() => { store.save(); setScreen('deck'); }} />;
  }
  if (screen === 'results') {
    return <ResultsScreen result={result} rewards={rewards} deck={deck} store={store} onAgain={() => play(mode)} onDeck={() => { refresh(); setScreen('deck'); }} />;
  }
  return (
    <DeckScreen
      deck={deck} store={store} reversed={reversed} setReversed={setReversed}
      onPlay={play} onBack={() => setScreen('home')} onEdit={() => setScreen('edit')}
      onDelete={() => { store.deleteDeck(deck.id); setScreen('home'); }}
    />
  );
}
