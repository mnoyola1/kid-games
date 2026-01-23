/**
 * LUMINA CORE - Unified Game Ecosystem
 * Shared state management for Noyola Kids Games
 * 
 * Features:
 * - Player profiles (Emma & Liam)
 * - XP, Levels, Coins tracking
 * - Per-game statistics
 * - Real-world rewards system
 * - Achievements
 * - Streak tracking
 * - Family quests
 */

const LuminaCore = (function() {
  'use strict';
  
  const STORAGE_KEY = 'lumina_game_data';
  const VERSION = '1.1.1'; // Fixed guest avatar migration
  
  // ==================== CONSTANTS ====================
  
  const LEVEL_TITLES = [
    { level: 1, title: 'Apprentice', minXP: 0 },
    { level: 2, title: 'Seeker', minXP: 100 },
    { level: 3, title: 'Scholar', minXP: 300 },
    { level: 4, title: 'Adept', minXP: 600 },
    { level: 5, title: 'Keeper', minXP: 1000 },
    { level: 6, title: 'Guardian', minXP: 1500 },
    { level: 7, title: 'Champion', minXP: 2200 },
    { level: 8, title: 'Hero', minXP: 3000 },
    { level: 9, title: 'Legend', minXP: 4000 },
    { level: 10, title: 'Archmage', minXP: 5500 },
    { level: 11, title: 'Mythic', minXP: 7500 },
    { level: 12, title: 'Transcendent', minXP: 10000 },
  ];
  
  const REWARDS = [
    { id: 'game_15', name: '99 Nights (15 min)', points: 100, icon: '🎮', category: 'gaming' },
    { id: 'game_30', name: '99 Nights (30 min)', points: 200, icon: '🎮', category: 'gaming' },
    { id: 'game_60', name: '99 Nights (1 hour)', points: 350, icon: '🎮', category: 'gaming' },
    { id: 'movie_pick', name: 'Pick Movie Night', points: 250, icon: '🎬', category: 'family' },
    { id: 'dinner_pick', name: 'Pick Dinner', points: 300, icon: '🍕', category: 'family' },
    { id: 'stay_up_30', name: 'Stay Up 30 min Late', points: 350, icon: '🌙', category: 'privilege' },
    { id: 'treat', name: 'Special Treat', points: 150, icon: '🍦', category: 'treat' },
    { id: 'skip_chore', name: 'Skip One Chore', points: 400, icon: '✨', category: 'privilege' },
    { id: 'friend_playdate', name: 'Friend Playdate', points: 500, icon: '👫', category: 'social' },
  ];
  
  const ACHIEVEMENTS = [
    // General
    { id: 'first_game', name: 'First Steps', desc: 'Play your first game', icon: '👣', xpBonus: 10 },
    { id: 'streak_3', name: 'On Fire', desc: '3 day play streak', icon: '🔥', xpBonus: 25 },
    { id: 'streak_7', name: 'Dedicated', desc: '7 day play streak', icon: '⭐', xpBonus: 50 },
    { id: 'streak_14', name: 'Unstoppable', desc: '14 day play streak', icon: '💫', xpBonus: 100 },
    { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5', icon: '🌟', xpBonus: 50 },
    { id: 'level_10', name: 'Archmage', desc: 'Reach level 10', icon: '🧙', xpBonus: 100 },
    { id: 'coins_500', name: 'Coin Collector', desc: 'Earn 500 lifetime coins', icon: '🪙', xpBonus: 25 },
    { id: 'coins_2000', name: 'Treasure Hunter', desc: 'Earn 2000 lifetime coins', icon: '💰', xpBonus: 75 },
    
    // Spell Siege
    { id: 'ss_first_win', name: 'Castle Defender', desc: 'Win a game of Spell Siege', icon: '🏰', xpBonus: 15 },
    { id: 'ss_wave_10', name: 'Wave Master', desc: 'Reach wave 10 in Spell Siege', icon: '🌊', xpBonus: 30 },
    { id: 'ss_words_100', name: 'Spell Slinger', desc: 'Spell 100 words in Spell Siege', icon: '📝', xpBonus: 40 },
    { id: 'ss_perfect_wave', name: 'Flawless', desc: 'Complete a wave with no mistakes', icon: '💎', xpBonus: 20 },
    
    // Canada Adventure
    { id: 'ca_first_battle', name: 'Brave Explorer', desc: 'Win your first battle', icon: '⚔️', xpBonus: 15 },
    { id: 'ca_all_regions', name: 'True Canadian', desc: 'Unlock all 7 regions', icon: '🍁', xpBonus: 75 },
    { id: 'ca_combo_5', name: 'Combo King', desc: 'Get a 5x combo', icon: '🔥', xpBonus: 25 },
    { id: 'ca_questions_50', name: 'Knowledge Seeker', desc: 'Answer 50 questions correctly', icon: '📚', xpBonus: 35 },
    
    // Word Forge
    { id: 'wf_first_craft', name: 'Apprentice Smith', desc: 'Craft your first item', icon: '🔨', xpBonus: 15 },
    { id: 'wf_legendary', name: 'Master Forger', desc: 'Craft a legendary item', icon: '⚒️', xpBonus: 50 },
    { id: 'wf_collection_10', name: 'Collector', desc: 'Collect 10 different items', icon: '📦', xpBonus: 30 },
    
    // Lumina Racer
    { id: 'lr_first_race', name: 'Speed Demon', desc: 'Complete your first race', icon: '🏎️', xpBonus: 15 },
    { id: 'lr_win_5', name: 'Racing Champion', desc: 'Win 5 races', icon: '🏆', xpBonus: 40 },
    
    // Secret achievements
    { id: 'secret_night', name: 'Night Owl', desc: 'Play after 8 PM', icon: '🦉', xpBonus: 10, secret: true },
    { id: 'secret_weekend', name: 'Weekend Warrior', desc: 'Play on Saturday and Sunday', icon: '🎉', xpBonus: 15, secret: true },
  ];
  
  const GAMES = {
    spellSiege: { 
      id: 'spellSiege', 
      name: 'Spell Siege', 
      icon: '🏰',
      defaultStats: { highScore: 0, highWave: 0, gamesPlayed: 0, gamesWon: 0, wordsSpelled: 0, perfectWaves: 0 }
    },
    canadaAdventure: { 
      id: 'canadaAdventure', 
      name: 'Canada Adventure', 
      icon: '🍁',
      defaultStats: { highScore: 0, gamesPlayed: 0, questionsCorrect: 0, questionsTotal: 0, regionsUnlocked: 1, enemiesDefeated: 0, maxCombo: 0 }
    },
    wordForge: { 
      id: 'wordForge', 
      name: 'Word Forge', 
      icon: '⚒️',
      defaultStats: { highScore: 0, gamesPlayed: 0, itemsCrafted: 0, legendariesCrafted: 0, wordsSpelled: 0 }
    },
    luminaRacer: { 
      id: 'luminaRacer', 
      name: 'Lumina Racer', 
      icon: '🏎️',
      defaultStats: { bestTime: null, gamesPlayed: 0, racesWon: 0, wordsTyped: 0 }
    },
  };
  
  // ==================== DEFAULT DATA ====================
  
  function createDefaultProfile(name, role, avatar) {
    const gameStats = {};
    Object.keys(GAMES).forEach(key => {
      gameStats[key] = { ...GAMES[key].defaultStats };
    });
    
    return {
      name,
      role,
      avatar,
      totalXP: 0,
      level: 1,
      title: 'Apprentice',
      currentCoins: 0,
      lifetimeCoins: 0,
      rewardPoints: 0,
      lastPlayed: null,
      lastPlayedGame: null,
      streakDays: 0,
      streakLastDate: null,
      totalPlayTimeMinutes: 0,
      achievements: [],
      gameStats,
      createdAt: new Date().toISOString(),
    };
  }
  
  function getDefaultData() {
    return {
      version: VERSION,
      currentPlayer: null,
      profiles: {
        emma: { id: 'emma', pin: '1008', ...createDefaultProfile('Emma', 'The Sage', './assets/Emma_Lumina.png') },
        liam: { id: 'liam', pin: '0830', ...createDefaultProfile('Liam', 'The Scout', './assets/Liam_Lumina.png') },
        guest: { id: 'guest', pin: null, ...createDefaultProfile('Guest', 'The Visitor', './assets/guest-avatar.svg') },
      },
      familyQuest: {
        active: false,
        goal: 500,
        current: 0,
        reward: 'Pizza Night Pick',
        startDate: null,
        endDate: null,
        contributions: { emma: 0, liam: 0 },
      },
      claimedRewards: [],
      pendingRewards: [],
      settings: {
        showLeaderboard: true,
        soundEnabled: true,
        parentPIN: '1234',
      },
      lastUpdated: new Date().toISOString(),
    };
  }
  
  // ==================== STORAGE ====================
  
  let _data = null;
  
  function load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        _data = JSON.parse(stored);
        // Migration check
        if (_data.version !== VERSION) {
          _data = migrateData(_data);
        }
      } else {
        _data = getDefaultData();
        save();
      }
    } catch (e) {
      console.error('LuminaCore: Failed to load data', e);
      _data = getDefaultData();
    }
    return _data;
  }
  
  function save() {
    try {
      _data.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
      return true;
    } catch (e) {
      console.error('LuminaCore: Failed to save data', e);
      return false;
    }
  }
  
  function migrateData(oldData) {
    console.log('🔄 Migrating data from version', oldData.version, 'to', VERSION);
    
    // Merge old profiles if they exist
    if (oldData.profiles) {
      Object.keys(oldData.profiles).forEach(key => {
        const oldProfile = oldData.profiles[key];
        
        // Ensure profile has id field
        if (!oldProfile.id) {
          console.log('✅ Adding id field to profile:', key);
          oldProfile.id = key;
        }
        
        // Update guest profile avatar to SVG if it's still using emoji
        if (key === 'guest' && oldProfile.avatar === '👤') {
          console.log('✅ Updating guest avatar from emoji to SVG');
          oldProfile.avatar = './assets/guest-avatar.svg';
        }
        
        // Ensure profiles have PIN field (null for guest, default for others)
        if (!oldProfile.hasOwnProperty('pin')) {
          console.log('✅ Adding pin field to profile:', key);
          oldProfile.pin = key === 'guest' ? null : (key === 'emma' ? '1008' : key === 'liam' ? '0830' : null);
        }
        
        // Ensure all required fields exist
        if (!oldProfile.gameStats) oldProfile.gameStats = {};
        Object.keys(GAMES).forEach(gameKey => {
          if (!oldProfile.gameStats[gameKey]) {
            oldProfile.gameStats[gameKey] = { ...GAMES[gameKey].defaultStats };
          }
        });
      });
    }
    
    // Add guest profile if it doesn't exist
    if (!oldData.profiles.guest) {
      console.log('✅ Adding guest profile');
      oldData.profiles.guest = { id: 'guest', pin: null, ...createDefaultProfile('Guest', 'The Visitor', './assets/guest-avatar.svg') };
    }
    
    // Update version and preserve all data
    oldData.version = VERSION;
    console.log('✅ Migration complete');
    return oldData;
  }
  
  function getData() {
    if (!_data) load();
    return _data;
  }
  
  function resetAllData() {
    _data = getDefaultData();
    save();
    return _data;
  }
  
  // ==================== PLAYER MANAGEMENT ====================
  
  function setCurrentPlayer(playerId) {
    const data = getData();
    if (data.profiles[playerId]) {
      data.currentPlayer = playerId;
      save();
      notifySubscribers();
      return data.profiles[playerId];
    }
    return null;
  }
  
  function getCurrentPlayer() {
    const data = getData();
    if (data.currentPlayer && data.profiles[data.currentPlayer]) {
      return data.profiles[data.currentPlayer];
    }
    return null;
  }
  
  function getCurrentPlayerId() {
    return getData().currentPlayer;
  }
  
  function getPlayer(playerId) {
    return getData().profiles[playerId] || null;
  }
  
  function getAllPlayers() {
    return getData().profiles;
  }
  
  // ==================== XP & LEVELING ====================
  
  function calculateLevel(totalXP) {
    for (let i = LEVEL_TITLES.length - 1; i >= 0; i--) {
      if (totalXP >= LEVEL_TITLES[i].minXP) {
        return LEVEL_TITLES[i];
      }
    }
    return LEVEL_TITLES[0];
  }
  
  function getXPForNextLevel(currentLevel) {
    const nextLevelData = LEVEL_TITLES.find(l => l.level === currentLevel + 1);
    return nextLevelData ? nextLevelData.minXP : null;
  }
  
  function addXP(playerId, amount, source = 'game') {
    const data = getData();
    const player = data.profiles[playerId];
    if (!player) return null;
    
    const oldLevel = player.level;
    player.totalXP += amount;
    
    const levelInfo = calculateLevel(player.totalXP);
    player.level = levelInfo.level;
    player.title = levelInfo.title;
    
    const leveledUp = player.level > oldLevel;
    
    // Also add to family quest if active
    if (data.familyQuest.active) {
      data.familyQuest.current += amount;
      data.familyQuest.contributions[playerId] = (data.familyQuest.contributions[playerId] || 0) + amount;
    }
    
    save();
    
    // Check for level achievements
    if (player.level >= 5) checkAchievement(playerId, 'level_5');
    if (player.level >= 10) checkAchievement(playerId, 'level_10');
    
    return {
      newXP: player.totalXP,
      level: player.level,
      title: player.title,
      leveledUp,
      oldLevel,
    };
  }
  
  // ==================== COINS ====================
  
  function addCoins(playerId, amount) {
    const data = getData();
    const player = data.profiles[playerId];
    if (!player) return null;
    
    player.currentCoins += amount;
    player.lifetimeCoins += amount;
    save();
    
    // Check coin achievements
    if (player.lifetimeCoins >= 500) checkAchievement(playerId, 'coins_500');
    if (player.lifetimeCoins >= 2000) checkAchievement(playerId, 'coins_2000');
    
    return {
      currentCoins: player.currentCoins,
      lifetimeCoins: player.lifetimeCoins,
    };
  }
  
  function spendCoins(playerId, amount) {
    const data = getData();
    const player = data.profiles[playerId];
    if (!player || player.currentCoins < amount) return false;
    
    player.currentCoins -= amount;
    save();
    return true;
  }
  
  // ==================== REWARD POINTS ====================
  
  function addRewardPoints(playerId, amount) {
    const data = getData();
    const player = data.profiles[playerId];
    if (!player) return null;
    
    player.rewardPoints += amount;
    save();
    
    return player.rewardPoints;
  }
  
  function claimReward(playerId, rewardId, parentPIN) {
    const data = getData();
    const player = data.profiles[playerId];
    const reward = REWARDS.find(r => r.id === rewardId);
    
    if (!player || !reward) return { success: false, error: 'Invalid player or reward' };
    if (parentPIN !== data.settings.parentPIN) return { success: false, error: 'Invalid PIN' };
    if (player.rewardPoints < reward.points) return { success: false, error: 'Not enough points' };
    
    player.rewardPoints -= reward.points;
    
    const claimRecord = {
      playerId,
      rewardId,
      rewardName: reward.name,
      pointsSpent: reward.points,
      claimedAt: new Date().toISOString(),
      status: 'pending', // pending, fulfilled, expired
    };
    
    data.pendingRewards.push(claimRecord);
    save();
    
    return { success: true, reward: claimRecord, remainingPoints: player.rewardPoints };
  }
  
  function fulfillReward(rewardIndex) {
    const data = getData();
    if (data.pendingRewards[rewardIndex]) {
      const reward = data.pendingRewards.splice(rewardIndex, 1)[0];
      reward.status = 'fulfilled';
      reward.fulfilledAt = new Date().toISOString();
      data.claimedRewards.push(reward);
      save();
      return true;
    }
    return false;
  }
  
  function getAvailableRewards() {
    return REWARDS;
  }
  
  function getPendingRewards() {
    return getData().pendingRewards;
  }
  
  // ==================== STREAKS ====================
  
  function updateStreak(playerId) {
    const data = getData();
    const player = data.profiles[playerId];
    if (!player) return null;
    
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (player.streakLastDate === today) {
      // Already played today
      return { streakDays: player.streakDays, updated: false };
    }
    
    if (player.streakLastDate === yesterday) {
      // Continuing streak
      player.streakDays += 1;
    } else if (player.streakLastDate !== today) {
      // Streak broken or first day
      player.streakDays = 1;
    }
    
    player.streakLastDate = today;
    save();
    
    // Check streak achievements
    if (player.streakDays >= 3) checkAchievement(playerId, 'streak_3');
    if (player.streakDays >= 7) checkAchievement(playerId, 'streak_7');
    if (player.streakDays >= 14) checkAchievement(playerId, 'streak_14');
    
    return { streakDays: player.streakDays, updated: true };
  }
  
  // ==================== GAME STATS ====================
  
  function recordGameStart(playerId, gameId) {
    const data = getData();
    const player = data.profiles[playerId];
    if (!player || !GAMES[gameId]) return false;
    
    player.lastPlayed = new Date().toISOString();
    player.lastPlayedGame = gameId;
    
    // Update streak
    updateStreak(playerId);
    
    // First game achievement
    checkAchievement(playerId, 'first_game');
    
    // Secret achievements
    const hour = new Date().getHours();
    if (hour >= 20) checkAchievement(playerId, 'secret_night');
    
    const day = new Date().getDay();
    if (day === 0 || day === 6) {
      // Check if played both days this weekend
      const lastPlayedDate = new Date(player.lastPlayed);
      if ((day === 0 && lastPlayedDate.getDay() === 6) || (day === 6 && lastPlayedDate.getDay() === 0)) {
        checkAchievement(playerId, 'secret_weekend');
      }
    }
    
    save();
    return true;
  }
  
  function recordGameEnd(playerId, gameId, stats) {
    const data = getData();
    const player = data.profiles[playerId];
    if (!player || !GAMES[gameId]) return false;
    
    const gameStats = player.gameStats[gameId];
    if (!gameStats) return false;
    
    // Increment games played
    gameStats.gamesPlayed = (gameStats.gamesPlayed || 0) + 1;
    
    // Merge in provided stats
    Object.keys(stats).forEach(key => {
      if (key === 'highScore') {
        gameStats.highScore = Math.max(gameStats.highScore || 0, stats.highScore);
      } else if (key === 'highWave') {
        gameStats.highWave = Math.max(gameStats.highWave || 0, stats.highWave);
      } else if (key === 'bestTime') {
        if (!gameStats.bestTime || stats.bestTime < gameStats.bestTime) {
          gameStats.bestTime = stats.bestTime;
        }
      } else if (key === 'maxCombo') {
        gameStats.maxCombo = Math.max(gameStats.maxCombo || 0, stats.maxCombo);
      } else if (typeof stats[key] === 'number') {
        // Accumulate numeric stats
        gameStats[key] = (gameStats[key] || 0) + stats[key];
      } else {
        gameStats[key] = stats[key];
      }
    });
    
    save();
    
    // Check game-specific achievements
    checkGameAchievements(playerId, gameId, gameStats);
    
    return gameStats;
  }
  
  function getGameStats(playerId, gameId) {
    const player = getPlayer(playerId);
    if (!player || !player.gameStats[gameId]) return null;
    return player.gameStats[gameId];
  }
  
  // ==================== ACHIEVEMENTS ====================
  
  function checkAchievement(playerId, achievementId) {
    const data = getData();
    const player = data.profiles[playerId];
    if (!player) return false;
    
    if (player.achievements.includes(achievementId)) return false;
    
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return false;
    
    player.achievements.push(achievementId);
    
    // Award bonus XP
    if (achievement.xpBonus) {
      player.totalXP += achievement.xpBonus;
      const levelInfo = calculateLevel(player.totalXP);
      player.level = levelInfo.level;
      player.title = levelInfo.title;
    }
    
    save();
    
    return {
      achievement,
      newAchievements: player.achievements,
    };
  }
  
  function checkGameAchievements(playerId, gameId, stats) {
    switch (gameId) {
      case 'spellSiege':
        if (stats.gamesWon >= 1) checkAchievement(playerId, 'ss_first_win');
        if (stats.highWave >= 10) checkAchievement(playerId, 'ss_wave_10');
        if (stats.wordsSpelled >= 100) checkAchievement(playerId, 'ss_words_100');
        if (stats.perfectWaves >= 1) checkAchievement(playerId, 'ss_perfect_wave');
        break;
        
      case 'canadaAdventure':
        if (stats.enemiesDefeated >= 1) checkAchievement(playerId, 'ca_first_battle');
        if (stats.regionsUnlocked >= 7) checkAchievement(playerId, 'ca_all_regions');
        if (stats.maxCombo >= 5) checkAchievement(playerId, 'ca_combo_5');
        if (stats.questionsCorrect >= 50) checkAchievement(playerId, 'ca_questions_50');
        break;
        
      case 'wordForge':
        if (stats.itemsCrafted >= 1) checkAchievement(playerId, 'wf_first_craft');
        if (stats.legendariesCrafted >= 1) checkAchievement(playerId, 'wf_legendary');
        if (stats.itemsCrafted >= 10) checkAchievement(playerId, 'wf_collection_10');
        break;
        
      case 'luminaRacer':
        if (stats.gamesPlayed >= 1) checkAchievement(playerId, 'lr_first_race');
        if (stats.racesWon >= 5) checkAchievement(playerId, 'lr_win_5');
        break;
    }
  }
  
  function getAchievements(playerId) {
    const player = getPlayer(playerId);
    if (!player) return [];
    
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: player.achievements.includes(a.id),
      hidden: a.secret && !player.achievements.includes(a.id),
    }));
  }
  
  function hasAchievement(playerId, achievementId) {
    const player = getPlayer(playerId);
    if (!player) return false;
    return player.achievements.includes(achievementId);
  }
  
  function awardAchievement(playerId, achievementId) {
    return checkAchievement(playerId, achievementId);
  }
  
  function getAllAchievementDefinitions() {
    return ACHIEVEMENTS;
  }
  
  // ==================== FAMILY QUEST ====================
  
  function startFamilyQuest(goal, reward, durationDays = 7) {
    const data = getData();
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 86400000);
    
    data.familyQuest = {
      active: true,
      goal,
      current: 0,
      reward,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      contributions: { emma: 0, liam: 0 },
    };
    
    save();
    return data.familyQuest;
  }
  
  function getFamilyQuest() {
    return getData().familyQuest;
  }
  
  function completeFamilyQuest() {
    const data = getData();
    if (data.familyQuest.active && data.familyQuest.current >= data.familyQuest.goal) {
      const quest = { ...data.familyQuest };
      data.familyQuest.active = false;
      save();
      return quest;
    }
    return null;
  }
  
  // ==================== LEADERBOARD ====================
  
  function getLeaderboard(category = 'totalXP') {
    const data = getData();
    const players = Object.entries(data.profiles).map(([id, profile]) => ({
      id,
      name: profile.name,
      avatar: profile.avatar,
      role: profile.role,
      level: profile.level,
      title: profile.title,
      totalXP: profile.totalXP,
      lifetimeCoins: profile.lifetimeCoins,
      rewardPoints: profile.rewardPoints,
      achievementCount: profile.achievements.length,
      streakDays: profile.streakDays,
    }));
    
    return players.sort((a, b) => b[category] - a[category]);
  }
  
  // ==================== SETTINGS ====================
  
  function getSettings() {
    return getData().settings;
  }
  
  function updateSettings(newSettings) {
    const data = getData();
    data.settings = { ...data.settings, ...newSettings };
    save();
    return data.settings;
  }
  
  function verifyParentPIN(pin) {
    return getData().settings.parentPIN === pin;
  }
  
  function changeParentPIN(oldPIN, newPIN) {
    const data = getData();
    if (data.settings.parentPIN !== oldPIN) return false;
    data.settings.parentPIN = newPIN;
    save();
    return true;
  }
  
  // ==================== PROFILE PIN MANAGEMENT ====================
  
  function verifyProfilePIN(playerId, pin) {
    const profile = getPlayer(playerId);
    if (!profile) return false;
    // Guest profile has no PIN
    if (playerId === 'guest') return true;
    // Check if PIN matches
    return profile.pin === pin;
  }
  
  function changeProfilePIN(playerId, oldPIN, newPIN) {
    const data = getData();
    const profile = data.profiles[playerId];
    if (!profile) return { success: false, error: 'Profile not found' };
    if (playerId === 'guest') return { success: false, error: 'Guest profile cannot have a PIN' };
    if (profile.pin !== oldPIN) return { success: false, error: 'Incorrect current PIN' };
    
    profile.pin = newPIN;
    save();
    return { success: true };
  }
  
  // ==================== UTILITY ====================
  
  function getGameDefinitions() {
    return GAMES;
  }
  
  function getLevelTitles() {
    return LEVEL_TITLES;
  }
  
  function getLevelTitle(level) {
    const levelData = LEVEL_TITLES.find(l => l.level === level);
    return levelData ? levelData.title : 'Apprentice';
  }
  
  function getXPProgress() {
    const player = getCurrentPlayer();
    if (!player) return { current: 0, required: 100, percentage: 0 };
    
    const currentLevelData = LEVEL_TITLES.find(l => l.level === player.level);
    const nextLevelData = LEVEL_TITLES.find(l => l.level === player.level + 1);
    
    if (!nextLevelData) {
      // Max level reached
      return {
        current: player.totalXP - currentLevelData.minXP,
        required: player.totalXP - currentLevelData.minXP,
        percentage: 100
      };
    }
    
    const current = player.totalXP - currentLevelData.minXP;
    const required = nextLevelData.minXP - currentLevelData.minXP;
    const percentage = Math.floor((current / required) * 100);
    
    return { current, required, percentage };
  }
  
  function exportData() {
    return JSON.stringify(getData(), null, 2);
  }
  
  function importData(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      _data = imported;
      save();
      return true;
    } catch (e) {
      console.error('LuminaCore: Failed to import data', e);
      return false;
    }
  }
  
  // ==================== EVENT SYSTEM ====================
  
  let _subscribers = [];
  
  function subscribe(callback) {
    if (typeof callback === 'function') {
      _subscribers.push(callback);
    }
  }
  
  function unsubscribe(callback) {
    _subscribers = _subscribers.filter(cb => cb !== callback);
  }
  
  function notifySubscribers() {
    _subscribers.forEach(callback => {
      try {
        callback();
      } catch (e) {
        console.error('LuminaCore: Subscriber callback error', e);
      }
    });
  }
  
  // ==================== PUBLIC API ====================
  
  return {
    // Core
    load,
    save,
    getData,
    resetAllData,
    
    // Players
    setCurrentPlayer,
    getCurrentPlayer,
    getCurrentPlayerId,
    getPlayer,
    getAllPlayers,
    
    // Aliases for hub compatibility
    setActiveProfile: setCurrentPlayer,
    getActiveProfile: getCurrentPlayer,
    getActiveProfileKey: getCurrentPlayerId,
    getAllProfiles: getAllPlayers,
    
    // XP & Leveling
    addXP,
    calculateLevel,
    getXPForNextLevel,
    getLevelTitles,
    getLevelTitle,
    getXPProgress,
    
    // Coins
    addCoins,
    spendCoins,
    
    // Rewards
    addRewardPoints,
    claimReward,
    fulfillReward,
    getAvailableRewards,
    getPendingRewards,
    
    // Streaks
    updateStreak,
    
    // Game Stats
    recordGameStart,
    recordGameEnd,
    getGameStats,
    getGameDefinitions,
    
    // Achievements
    checkAchievement,
    hasAchievement,
    awardAchievement,
    getAchievements,
    getAllAchievementDefinitions,
    
    // Family Quest
    startFamilyQuest,
    getFamilyQuest,
    completeFamilyQuest,
    
    // Leaderboard
    getLeaderboard,
    
    // Settings
    getSettings,
    updateSettings,
    verifyParentPIN,
    changeParentPIN,
    
    // Profile PIN Management
    verifyProfilePIN,
    changeProfilePIN,
    
    // Utility
    exportData,
    importData,
    subscribe,
    unsubscribe,
    
    // Constants
    REWARDS,
    REWARDS_CATALOG: REWARDS, // Alias for hub compatibility
    ACHIEVEMENTS,
    GAMES,
    LEVEL_TITLES,
    VERSION,
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LuminaCore;
}
