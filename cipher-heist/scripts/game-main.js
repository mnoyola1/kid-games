/**
 * Cipher Heist - Root component
 *
 * Routes between modes (solo / hotseat / online), drives the engine tick,
 * runs bot tick loops, and commits LuminaCore grants on game end.
 */

function CipherHeist() {
  const Engine = window.CipherEngine;
  const Bots = window.CipherBots;
  const Screens = window.CipherScreens;
  const Online = window.CipherOnline; // optional adapter, may not exist if no Supabase

  const [playerProfile, setPlayerProfile] = useState(null);
  const [phase, setPhase] = useState('lobby'); // 'lobby' | 'vault-pick' | 'handoff' | 'playing' | 'crack' | 'end' | 'online-lobby'
  const [mode, setMode] = useState('solo');
  const [engineState, setEngineState] = useState(null);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [hotseatPlayerIdx, setHotseatPlayerIdx] = useState(0);
  const [hotseatNames, setHotseatNames] = useState([]);
  const [pausedAt, setPausedAt] = useState(null); // ms timestamp when game was paused (handoff)
  const [pauseTotalMs, setPauseTotalMs] = useState(0);
  const [rewards, setRewards] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [onlineSession, setOnlineSession] = useState(null); // { code, players, status }

  const audioRef = useRef(null);
  const tickRef = useRef(null);
  const stateRef = useRef(null);

  // --- Init audio + profile ---
  useEffect(() => {
    if (typeof LuminaCore !== 'undefined') {
      try {
        const profile = LuminaCore.getActiveProfile();
        if (profile) {
          setPlayerProfile(profile);
          LuminaCore.recordGameStart(profile.id, 'cipherHeist');
        }
      } catch (e) { /* ignore */ }
    }
    const audio = new window.CipherAudio();
    audio.init();
    audioRef.current = audio;
    window.__cipherAudio = audio;
    return () => audio.stopMusic();
  }, []);

  // Keep ref in sync so the tick loop uses fresh state
  useEffect(() => { stateRef.current = engineState; }, [engineState]);

  // --- Tick loop ---
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'crack') return;
    tickRef.current = setInterval(() => {
      const cur = stateRef.current;
      if (!cur) return;
      const realNow = Date.now();
      // Effective "engine now" subtracts paused durations
      const now = realNow - pauseTotalMs;
      let next = Engine.chTick(cur, now);

      if (mode === 'solo') {
        // Bots take one decision per tick
        Object.keys(next.players).forEach(pid => {
          const p = next.players[pid];
          if (p.isBot) {
            const result = Bots.chBotTick(next, pid, now);
            if (result.did) {
              next = result.state;
              if (result.did === 'crack') {
                // SFX for bot cracks
                if (result.success) audioRef.current?.playSound('crackOpen');
                else audioRef.current?.playSound('crackFail');
              }
            }
          }
        });
      }

      if (next.status === 'ended') {
        finalizeGame(next);
        return;
      }
      setEngineState(next);
    }, 250);
    return () => clearInterval(tickRef.current);
  }, [phase, mode, pauseTotalMs]);

  // --- Music transitions ---
  useEffect(() => {
    if (!audioRef.current) return;
    if (phase === 'lobby' || phase === 'online-lobby' || phase === 'vault-pick') {
      audioRef.current.playMusic('lobby');
    } else if (phase === 'playing' || phase === 'crack' || phase === 'handoff') {
      const remainingMs = engineState ? Math.max(0, engineState.endsAt - engineState.now) : 999999;
      audioRef.current.playMusic(remainingMs < 30_000 ? 'final' : 'gameplay');
    } else if (phase === 'end') {
      const wonByMe = engineState && engineState.winner === playerProfile?.id;
      audioRef.current.playMusic(wonByMe ? 'victory' : 'defeat');
    }
  }, [phase, engineState?.endsAt, engineState?.winner, playerProfile?.id]);

  // ----------------------------------------------------
  // Lobby → start
  // ----------------------------------------------------

  const handleLobbyStart = (cfg) => {
    setMode(cfg.mode);

    if (cfg.mode === 'online') {
      startOnline(cfg);
      return;
    }

    if (cfg.mode === 'solo') {
      startSolo(cfg);
      return;
    }

    if (cfg.mode === 'hotseat') {
      startHotseat(cfg);
      return;
    }
  };

  // ----------------------------------------------------
  // SOLO MODE
  // ----------------------------------------------------

  const startSolo = (cfg) => {
    let s = Engine.chCreateSession({
      mode: 'solo',
      packId: cfg.packId,
      gradeTier: cfg.gradeTier,
      durationSec: cfg.durationSec,
      hostId: playerProfile?.id || 'you',
    });
    s = Engine.chAddPlayer(s, {
      id: playerProfile?.id || 'you',
      name: playerProfile?.name || 'You',
      avatar: playerProfile?.avatar || '🧑',
      isBot: false,
    });
    s = Engine.chAddPlayer(s, {
      id: 'bot-scout',
      name: 'Scout',
      avatar: '🦊',
      isBot: true,
      botType: 'scout',
    });
    s = Engine.chAddPlayer(s, {
      id: 'bot-sage',
      name: 'Sage',
      avatar: '🦉',
      isBot: true,
      botType: 'sage',
    });
    // Auto-set bot vaults
    s = Engine.chSetVaultCode(s, 'bot-scout', window.chGenerateVaultCode());
    s = Engine.chSetVaultCode(s, 'bot-sage', window.chGenerateVaultCode());

    setEngineState(s);
    setPauseTotalMs(0);
    setPausedAt(null);
    setPhase('vault-pick');
  };

  // ----------------------------------------------------
  // HOT-SEAT MODE
  // ----------------------------------------------------

  const startHotseat = (cfg) => {
    const names = cfg.hotseatPlayers || ['Player 1', 'Player 2'];
    let s = Engine.chCreateSession({
      mode: 'hotseat',
      packId: cfg.packId,
      gradeTier: cfg.gradeTier,
      durationSec: cfg.durationSec,
      hostId: 'p0',
    });
    names.forEach((name, idx) => {
      s = Engine.chAddPlayer(s, {
        id: `p${idx}`,
        name,
        avatar: ['🧑', '👧', '👦', '👩'][idx % 4],
        isBot: false,
      });
    });
    setHotseatNames(names);
    setHotseatPlayerIdx(0);
    setEngineState(s);
    setPauseTotalMs(0);
    setPausedAt(null);
    setPhase('vault-pick');
  };

  // ----------------------------------------------------
  // ONLINE MODE — host or join
  // ----------------------------------------------------

  const startOnline = async (cfg) => {
    if (!Online) {
      setStatusMsg('Online mode is not available in this build.');
      return;
    }
    try {
      let session;
      const me = {
        id: playerProfile?.id || `g_${Math.random().toString(36).slice(2, 8)}`,
        name: playerProfile?.name || 'Agent',
        avatar: playerProfile?.avatar || '🧑',
      };
      if (cfg.online.mode === 'host') {
        session = await Online.createSession({
          packId: cfg.packId,
          gradeTier: cfg.gradeTier,
          durationSec: cfg.durationSec,
          host: me,
        });
      } else {
        if (!cfg.online.joinCode || cfg.online.joinCode.length < 4) {
          setStatusMsg('Enter a 4-letter room code.');
          return;
        }
        session = await Online.joinSession({
          code: cfg.online.joinCode.toUpperCase(),
          player: me,
        });
      }
      if (!session?.code) {
        setStatusMsg(session?.error || 'Could not create/join the room.');
        return;
      }
      setOnlineSession({ ...session, playerId: me.id });
      window.__cipherViewerId = me.id;
      Online.subscribeAs(session.code, me.id, (msg) => {
        if (msg.kind === 'state' || msg.kind === 'started') {
          setEngineState(msg.state);
          if (msg.rawSession?.status === 'playing') {
            // Server transitioned to playing — only enter HUD if I have set my vault
            const myPlayer = msg.state?.players?.[me.id];
            if (myPlayer && myPlayer.vaultCode) setPhase('playing');
          }
        }
        if (msg.kind === 'ended') finalizeGame(msg.state);
        if (msg.kind === 'error') setStatusMsg(msg.error);
      });
      // First time online, prompt the user to lock their vault.
      setPhase('vault-pick');
    } catch (e) {
      console.error(e);
      setStatusMsg(e.message || 'Online setup failed.');
    }
  };

  const onlineLockVault = async (code) => {
    if (!onlineSession) return;
    const res = await Online.setVault({
      code: onlineSession.code,
      playerId: onlineSession.playerId || playerProfile?.id,
      vaultCode: code,
    });
    if (res?.error) { setStatusMsg(res.error); return false; }
    return true;
  };

  const onlineStartRound = async () => {
    if (!onlineSession) return;
    const res = await Online.startSession({ code: onlineSession.code });
    if (res?.error) setStatusMsg(res.error);
  };

  // ----------------------------------------------------
  // Vault pick handlers
  // ----------------------------------------------------

  const onVaultConfirm = (code) => {
    if (mode === 'solo') {
      const me = playerProfile?.id || 'you';
      let s = Engine.chSetVaultCode(engineState, me, code);
      // All bots already set, start the game
      s = Engine.chStartGame(s, Date.now());
      setEngineState(s);
      audioRef.current?.playSound('roundStart');
      audioRef.current?.playVex('welcome');
      setPhase('playing');
      return;
    }

    if (mode === 'hotseat') {
      const id = `p${hotseatPlayerIdx}`;
      let s = Engine.chSetVaultCode(engineState, id, code);
      const allSet = Engine.chAllVaultsSet(s);
      setEngineState(s);
      if (allSet) {
        // All vaults set — go to handoff for first player turn
        const startedAt = Date.now();
        s = Engine.chStartGame(s, startedAt);
        setEngineState(s);
        setHotseatPlayerIdx(0);
        setPhase('handoff');
        pauseGame();
      } else {
        setHotseatPlayerIdx(hotseatPlayerIdx + 1);
      }
      return;
    }

    if (mode === 'online') {
      onlineLockVault(code).then(ok => {
        if (ok) setPhase('online-lobby');
      });
      return;
    }
  };

  // ----------------------------------------------------
  // Hotseat helpers — pause/resume the game clock
  // ----------------------------------------------------

  const pauseGame = () => setPausedAt(Date.now());
  const resumeGame = () => {
    if (pausedAt !== null) {
      const elapsed = Date.now() - pausedAt;
      setPauseTotalMs(prev => prev + elapsed);
      setPausedAt(null);
    }
  };

  const hotseatActivePid = () => {
    if (!engineState) return null;
    return engineState.playerOrder[hotseatPlayerIdx % engineState.playerOrder.length];
  };

  const advanceHotseat = () => {
    const next = (hotseatPlayerIdx + 1) % engineState.playerOrder.length;
    setHotseatPlayerIdx(next);
    setPhase('handoff');
    pauseGame();
  };

  // ----------------------------------------------------
  // In-game action handlers
  // ----------------------------------------------------

  const selfId = (() => {
    if (mode === 'solo') return playerProfile?.id || 'you';
    if (mode === 'hotseat') return hotseatActivePid();
    if (mode === 'online') return onlineSession?.playerId || playerProfile?.id;
    return null;
  })();

  const handleAnswer = (idx, btnEl) => {
    if (!engineState || !selfId) return;
    if (mode === 'online') {
      Online.submitAnswer({ code: onlineSession.code, playerId: selfId, choice: idx });
      return;
    }
    const now = Date.now() - pauseTotalMs;
    const result = Engine.chSubmitAnswer(engineState, selfId, idx, now);
    if (!result.ok) return;

    if (result.correct) {
      audioRef.current?.playSound('correct');
      audioRef.current?.playSound('bitGain');
      audioRef.current?.playVex('correct');
      const center = window.CipherJuice.getCenter(btnEl);
      window.CipherJuice.spawnParticles({ x: center.x, y: center.y, color: '#4ade80', count: 12 });
      window.CipherJuice.floatText({ text: `+${result.bits} bits`, x: center.x, y: center.y, color: '#fbbf24' });
      window.CipherJuice.vibrate(20);
      audioRef.current?.playSound('actionUnlock');
    } else {
      audioRef.current?.playSound('wrong');
      audioRef.current?.playVex('wrong');
      window.CipherJuice.shakeAndFlashError(btnEl);
    }

    setEngineState(result.state);

    // Hot-seat: after answering, advance turn (pass-iPad)
    if (mode === 'hotseat') {
      // Allow the player to use their unlocked action first if they got it right
      // — when their action picker resolves, we advance. If wrong, advance now.
      if (!result.correct) {
        setTimeout(() => advanceHotseat(), 600);
      }
    }
  };

  const handleOpenActionPicker = () => setShowActionPicker(true);

  const handlePickAction = (actionId, opts = {}) => {
    setShowActionPicker(false);
    if (!engineState || !selfId) return;

    if (mode === 'online') {
      Online.heistAction({ code: onlineSession.code, playerId: selfId, actionId, ...opts });
      return;
    }

    if (actionId === 'crack') {
      // Engine flips player to crack-pending and deals a bonus question.
      const now = Date.now() - pauseTotalMs;
      const result = Engine.chApplyAction(engineState, selfId, 'crack', {}, now);
      setEngineState(result.state);
      // Stay on the HUD (the bonus question shows up there). After the bonus is answered correctly,
      // we'll automatically open the CrackScreen (handled in render switch).
      return;
    }

    const now = Date.now() - pauseTotalMs;
    const result = Engine.chApplyAction(engineState, selfId, actionId, opts, now);
    if (!result.ok) return;
    setEngineState(result.state);

    if (actionId === 'firewall') {
      audioRef.current?.playSound('firewall');
      audioRef.current?.playVex('firewall');
    } else if (actionId === 'surge') {
      audioRef.current?.playSound('bitGain');
      audioRef.current?.playVex('surge');
      window.CipherJuice.spawnConfetti(window.innerWidth / 2, 200);
    } else if (actionId === 'scan') {
      audioRef.current?.playSound('scan');
      audioRef.current?.playVex('scan');
      if (typeof result.digit === 'number') {
        const tgt = engineState.players[opts.targetId]?.name || 'target';
        setStatusMsg(`Scan: ${tgt}'s code contains the digit ${result.digit}.`);
        setTimeout(() => setStatusMsg(''), 4000);
      }
    }

    // Hot-seat: advance turn after action
    if (mode === 'hotseat') {
      setTimeout(() => advanceHotseat(), 700);
    }
  };

  const handleCrackGuess = (targetId, guess) => {
    if (mode === 'online') {
      Online.crackAttempt({ code: onlineSession.code, playerId: selfId, targetId, guess });
      return;
    }
    const now = Date.now() - pauseTotalMs;
    const result = Engine.chCrackAttempt(engineState, selfId, targetId, guess, now);
    if (!result.ok) {
      setStatusMsg(`Crack rejected: ${result.reason}`);
      setTimeout(() => setStatusMsg(''), 3000);
      return;
    }
    setEngineState(result.state);

    if (result.success) {
      audioRef.current?.playSound('crackOpen');
      audioRef.current?.playVex('crackSuccess');
      window.CipherJuice.spawnConfetti(window.innerWidth / 2, window.innerHeight / 2);
      window.CipherJuice.screenShake();
      setStatusMsg(`🔓 You cracked it! Stole ${result.stolen} bits.`);
      setTimeout(() => setStatusMsg(''), 4000);
    } else if (result.defended) {
      audioRef.current?.playSound('firewall');
      audioRef.current?.playVex('crackFail');
      setStatusMsg(`🛡️ Their firewall absorbed it.`);
      setTimeout(() => setStatusMsg(''), 3500);
    } else {
      audioRef.current?.playSound('crackFail');
      audioRef.current?.playVex('crackFail');
      window.CipherJuice.screenShake();
    }

    // Hot-seat: advance after crack attempt
    if (mode === 'hotseat') {
      setTimeout(() => advanceHotseat(), 800);
    }
  };

  // After a successful steal, target's vault is null — they need to reroll.
  // Detect this for the local player and route them to vault-pick.
  useEffect(() => {
    if (!engineState || phase !== 'playing') return;
    if (mode === 'online') return; // server handles this
    const me = engineState.players[selfId];
    if (me && me.vaultCode === null) {
      // Force vault re-pick (for solo) or surface a small modal
      if (mode === 'solo') {
        setPhase('vault-pick'); // re-pick mid-game
      }
    }
  }, [engineState?.now, selfId, phase, mode]);

  const handleVaultRepick = (code) => {
    let s = Engine.chSetVaultCode(engineState, selfId, code);
    setEngineState(s);
    setPhase('playing');
  };

  const handleLeaveGame = () => {
    if (window.confirm('Leave this round?')) {
      audioRef.current?.stopMusic();
      setEngineState(null);
      setPhase('lobby');
      if (mode === 'online' && Online && onlineSession) {
        Online.leave({ code: onlineSession.code, playerId: selfId });
      }
      setOnlineSession(null);
    }
  };

  const onReturnToHub = () => { window.location.href = '../index.html'; };

  // ----------------------------------------------------
  // Game-end finalization
  // ----------------------------------------------------

  const finalizeGame = (finalState) => {
    audioRef.current?.stopMusic();
    audioRef.current?.playSound('roundEnd');

    const me = playerProfile?.id || (mode === 'solo' ? 'you' : selfId);
    const rewardsByPid = {};
    Object.keys(finalState.players).forEach(pid => {
      rewardsByPid[pid] = Engine.chComputeRewards(finalState, pid);
    });
    setRewards(rewardsByPid);

    // Commit to LuminaCore for the human (skip for bots / online guests w/ no profile)
    if (typeof LuminaCore !== 'undefined' && playerProfile && me) {
      const myReward = rewardsByPid[me];
      const mePlayer = finalState.players[me];
      if (myReward && mePlayer) {
        LuminaCore.addXP(playerProfile.id, myReward.xp, 'cipherHeist');
        LuminaCore.addCoins(playerProfile.id, myReward.coins);
        LuminaCore.addRewardPoints(playerProfile.id, myReward.rewardPoints);

        const stats = {
          gamesPlayed: 1,
          score: mePlayer.bits,
          correct: mePlayer.stats.correct,
          wrong: mePlayer.stats.wrong,
          cracksSucceeded: mePlayer.stats.cracksSucceeded,
          cracksAttempted: mePlayer.stats.cracksAttempted,
          defended: mePlayer.stats.defended,
          fastCorrect: mePlayer.stats.fastCorrect || 0,
          usedScan: !!mePlayer.stats.usedScan,
          timesCracked: mePlayer.stats.bitsLost > 0 ? 1 : 0,
          place: myReward.placement,
          mode,
          packId: finalState.config.packId,
          tier: finalState.config.gradeTier,
        };
        try {
          LuminaCore.recordGameEnd(playerProfile.id, 'cipherHeist', stats);
        } catch (e) { /* ignore */ }
      }
    }

    setEngineState(finalState);
    setPhase('end');
  };

  const handlePlayAgain = () => {
    setEngineState(null);
    setRewards(null);
    setPauseTotalMs(0);
    setPhase('lobby');
  };

  // ----------------------------------------------------
  // Render
  // ----------------------------------------------------

  // Once a player gets a "crack-pending" state and they correctly answer the bonus,
  // their `bonusGate` is open and we route to CrackScreen automatically.
  useEffect(() => {
    if (!engineState || phase !== 'playing') return;
    if (mode === 'online') return;
    const me = engineState.players[selfId];
    if (!me) return;
    const gate = engineState.bonusGate[selfId];
    if (gate && !gate.used && !engineState.activeQuestions[selfId]) {
      setPhase('crack');
    }
  }, [engineState?.now, selfId, phase, mode]);

  // Render switch
  if (phase === 'lobby') {
    return (
      <Screens.LobbyScreen
        playerProfile={playerProfile}
        onStart={handleLobbyStart}
        onReturnToHub={onReturnToHub}
      />
    );
  }

  if (phase === 'online-lobby' && onlineSession) {
    const lobbyPlayers = engineState
      ? Object.values(engineState.players).map(p => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          vaultLocked: !!p.vaultCode,
        }))
      : [];
    return (
      <Screens.OnlineLobby
        roomCode={onlineSession.code}
        players={lobbyPlayers}
        isHost={onlineSession.isHost}
        onStart={onlineStartRound}
        onLeave={handleLeaveGame}
        status={statusMsg}
      />
    );
  }

  if (phase === 'vault-pick') {
    let pname = playerProfile?.name || 'You';
    if (mode === 'hotseat') pname = hotseatNames[hotseatPlayerIdx] || `Player ${hotseatPlayerIdx + 1}`;
    if (mode === 'solo' && engineState && engineState.status === 'playing') pname += ' — re-pick';
    return (
      <Screens.VaultPickScreen
        playerName={pname}
        hotseatHint={mode === 'hotseat'}
        onConfirm={engineState && engineState.status === 'playing' ? handleVaultRepick : onVaultConfirm}
        onCancel={engineState && engineState.status !== 'playing' ? () => setPhase('lobby') : null}
      />
    );
  }

  if (phase === 'handoff' && mode === 'hotseat') {
    const pid = hotseatActivePid();
    const name = engineState.players[pid]?.name || 'Next';
    return (
      <Screens.HotSeatHandoff
        nextPlayerName={name}
        onReady={() => { resumeGame(); setPhase('playing'); }}
      />
    );
  }

  if (phase === 'playing' && engineState) {
    return (
      <>
        <Screens.HUDScreen
          state={engineState}
          selfId={selfId}
          onAnswer={handleAnswer}
          onUseAction={handlePickAction}
          onOpenActionPicker={handleOpenActionPicker}
          onLeave={handleLeaveGame}
          onEndTurn={mode === 'hotseat' ? () => advanceHotseat() : null}
          hotseat={mode === 'hotseat'}
          audio={audioRef.current}
        />
        {showActionPicker && (
          <Screens.ActionPicker
            state={engineState}
            selfId={selfId}
            onPick={handlePickAction}
            onClose={() => setShowActionPicker(false)}
          />
        )}
        {statusMsg && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-terminal-panel border border-cipher-gold text-cipher-gold font-bold shadow-xl">
            {statusMsg}
          </div>
        )}
      </>
    );
  }

  if (phase === 'crack' && engineState) {
    return (
      <Screens.CrackScreen
        state={engineState}
        selfId={selfId}
        onGuess={(t, g) => { handleCrackGuess(t, g); setPhase('playing'); }}
        onCancel={() => {
          // Skip the crack — clear gate
          const s = JSON.parse(JSON.stringify(engineState));
          s.bonusGate[selfId] = null;
          setEngineState(s);
          setPhase('playing');
        }}
      />
    );
  }

  if (phase === 'end' && engineState) {
    return (
      <Screens.EndScreen
        state={engineState}
        selfId={selfId}
        rewardsByPlayer={rewards}
        onPlayAgain={handlePlayAgain}
        onReturnToHub={onReturnToHub}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-terminal-text">
      <div className="text-center">
        <div className="text-4xl mb-3">⚡</div>
        <div>Loading Cipher Heist…</div>
      </div>
    </div>
  );
}

window.CipherHeist = CipherHeist;
