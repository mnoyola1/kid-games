// ==================== UI UPDATES ====================
function updateUI() {
  const profile = LuminaCore.getActiveProfile();
  if (!profile) return;
  
  console.log('🎨 Updating UI for profile:', profile.name, 'Avatar:', profile.avatar);
  
  // Update player banner
  document.getElementById('playerAvatar').src = profile.avatar;
  document.getElementById('playerName').textContent = profile.name;
  document.getElementById('playerTitle').textContent = profile.title;
  document.getElementById('levelBadge').textContent = `Lv. ${profile.level}`;
  document.getElementById('levelTitle').textContent = LuminaCore.getLevelTitle(profile.level);
  
  // Update stats
  document.getElementById('coinsDisplay').textContent = profile.currentCoins;
  document.getElementById('pointsDisplay').textContent = profile.rewardPoints;
  document.getElementById('streakDisplay').textContent = `${profile.streakDays}🔥`;
  
  // Update XP bar
  const xpProgress = LuminaCore.getXPProgress();
  document.getElementById('xpText').textContent = `${xpProgress.current} / ${xpProgress.required} XP`;
  document.getElementById('xpFill').style.width = `${xpProgress.percentage}%`;
  
  // Update leaderboard
  renderLeaderboard();
  
  // Update family quest
  renderFamilyQuest();
  
  // Update rewards preview
  renderRewardsPreview();
  
  // Update games with stats
  renderGames();
  
  // Update daily challenges
  renderDailyChallenges();
  
  // Update usage metrics (if parent profile)
  renderUsageMetrics();
}

let currentLeaderboardFilter = 'all';

function renderLeaderboard() {
  const leaderboard = LuminaCore.getLeaderboard();
  const container = document.getElementById('leaderboardContent');
  
  // Add filter buttons
  const filterHTML = `
    <div class="leaderboard-filters" style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
      <button class="filter-btn ${currentLeaderboardFilter === 'all' ? 'active' : ''}" data-filter="all" onclick="filterLeaderboard('all')">All</button>
      <button class="filter-btn ${currentLeaderboardFilter === 'xp' ? 'active' : ''}" data-filter="xp" onclick="filterLeaderboard('xp')">By XP</button>
      <button class="filter-btn ${currentLeaderboardFilter === 'achievements' ? 'active' : ''}" data-filter="achievements" onclick="filterLeaderboard('achievements')">By Achievements</button>
      <button class="filter-btn ${currentLeaderboardFilter === 'coins' ? 'active' : ''}" data-filter="coins" onclick="filterLeaderboard('coins')">By Coins</button>
      <button class="filter-btn ${currentLeaderboardFilter === 'streak' ? 'active' : ''}" data-filter="streak" onclick="filterLeaderboard('streak')">By Streak</button>
    </div>
  `;
  
  container.innerHTML = filterHTML + leaderboard.map((player, index) => `
    <div class="leaderboard-item ${index === 0 ? 'leader' : ''}" data-xp="${player.totalXP}" data-achievements="${player.achievementCount}" data-coins="${player.currentCoins}" data-streak="${player.streakDays}">
      <div class="leaderboard-rank ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}">
        ${index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
      </div>
      <img src="${player.avatar}" alt="${player.name}" class="leaderboard-avatar">
      <div class="leaderboard-info">
        <div class="leaderboard-name">${player.name}</div>
        <div class="leaderboard-xp">${player.totalXP} XP • ${player.achievementCount} 🏅 • ${player.currentCoins} 💰 • ${player.streakDays}🔥</div>
      </div>
      <div class="leaderboard-level">Lv.${player.level}</div>
    </div>
  `).join('');
}

function filterLeaderboard(filter) {
  currentLeaderboardFilter = filter;
  
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === filter) {
      btn.classList.add('active');
    }
  });
  
  // Sort leaderboard based on filter
  let leaderboard = LuminaCore.getLeaderboard();
  
  switch (filter) {
    case 'xp':
      leaderboard.sort((a, b) => b.totalXP - a.totalXP);
      break;
    case 'achievements':
      leaderboard.sort((a, b) => b.achievementCount - a.achievementCount);
      break;
    case 'coins':
      leaderboard.sort((a, b) => b.currentCoins - a.currentCoins);
      break;
    case 'streak':
      leaderboard.sort((a, b) => b.streakDays - a.streakDays);
      break;
    default:
      // Default sorting (already sorted by XP)
      break;
  }
  
  // Re-render
  const container = document.getElementById('leaderboardContent');
  const filterHTML = container.querySelector('.leaderboard-filters')?.outerHTML || '';
  
  container.innerHTML = filterHTML + leaderboard.map((player, index) => `
    <div class="leaderboard-item ${index === 0 ? 'leader' : ''}">
      <div class="leaderboard-rank ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}">
        ${index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
      </div>
      <img src="${player.avatar}" alt="${player.name}" class="leaderboard-avatar">
      <div class="leaderboard-info">
        <div class="leaderboard-name">${player.name}</div>
        <div class="leaderboard-xp">${player.totalXP} XP • ${player.achievementCount} 🏅 • ${player.currentCoins} 💰 • ${player.streakDays}🔥</div>
      </div>
      <div class="leaderboard-level">Lv.${player.level}</div>
    </div>
  `).join('');
}

function renderFamilyQuest() {
  const quest = LuminaCore.getFamilyQuest();
  const container = document.getElementById('familyQuest');
  
  if (quest.active) {
    container.style.display = 'block';
    document.getElementById('familyQuestReward').textContent = quest.reward;
    const percentage = Math.min((quest.current / quest.goal) * 100, 100);
    document.getElementById('familyQuestFill').style.width = `${percentage}%`;
    document.getElementById('familyQuestText').textContent = `${quest.current} / ${quest.goal} XP Together`;
  } else {
    container.style.display = 'none';
  }
}

function renderRewardsPreview() {
  const profile = LuminaCore.getActiveProfile();
  if (!profile) return;
  
  const rewards = LuminaCore.REWARDS_CATALOG.slice(0, 3);
  const container = document.getElementById('rewardsPreview');
  
  container.innerHTML = rewards.map(reward => {
    const canAfford = profile.rewardPoints >= reward.points;
    return `
      <div class="reward-item">
        <div class="reward-info">
          <span class="reward-icon">${reward.icon}</span>
          <span class="reward-name">${reward.name}</span>
        </div>
        <span class="reward-cost ${canAfford ? '' : 'unavailable'}">${reward.points} pts</span>
      </div>
    `;
  }).join('');
}

function renderDailyChallenges() {
  const profile = LuminaCore.getActiveProfile();
  if (!profile) return;

  const dailyChallenges = LuminaCore.getDailyChallenges(profile.id);
  const container = document.getElementById('dailyChallengesContent');
  const dateDisplay = document.getElementById('dailyChallengesDate');

  if (!container) return;

  if (dailyChallenges.challenges.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-400">No challenges today!</p>';
    if (dateDisplay) dateDisplay.textContent = '';
    return;
  }

  if (dateDisplay) {
    dateDisplay.textContent = `(${new Date(dailyChallenges.lastGeneratedDate).toLocaleDateString()})`;
  }

  container.innerHTML = dailyChallenges.challenges.map(challenge => `
    <div class="daily-challenge-item ${challenge.completed ? 'completed' : ''}">
      <div class="challenge-info">
        <span class="challenge-name">${challenge.name}</span>
        <span class="challenge-progress">${challenge.completed ? '✅' : `${challenge.current}/${challenge.target}`}</span>
      </div>
      <div class="challenge-rewards">
        ${challenge.reward.xp} XP • ${challenge.reward.coins} 💰
      </div>
      <div class="challenge-progress-bar">
        <div class="challenge-progress-fill" style="width: ${Math.min((challenge.current / challenge.target) * 100, 100)}%;"></div>
      </div>
      ${!challenge.completed ? `<button class="claim-challenge-btn" onclick="claimDailyChallenge('${challenge.id}')">Claim</button>` : ''}
    </div>
  `).join('');
}

function claimDailyChallenge(challengeId) {
  const profile = LuminaCore.getActiveProfile();
  if (!profile) return;
  const result = LuminaCore.completeDailyChallenge(profile.id, challengeId);
  if (result.success) {
    if (typeof showToast === 'function') {
      showToast(`Challenge "${result.challenge.name}" completed! +${result.xp} XP, +${result.coins} Coins!`, 'success');
    }
    updateUI();
  } else {
    if (typeof showToast === 'function') {
      showToast(result.error, 'error');
    }
  }
}
