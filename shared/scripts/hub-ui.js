// ==================== UI UPDATES ====================
function updateUI() {
  const profile = LuminaCore.getActiveProfile();
  if (!profile) return;
  
  // Update player banner
  const playerAvatar = document.getElementById('playerAvatar');
  
  // Handle guest profile emoji avatar
  if (profile.id === 'guest') {
    playerAvatar.style.fontSize = '48px';
    playerAvatar.style.display = 'flex';
    playerAvatar.style.alignItems = 'center';
    playerAvatar.style.justifyContent = 'center';
    playerAvatar.style.background = 'var(--bg-secondary)';
    playerAvatar.alt = profile.avatar;
    playerAvatar.textContent = profile.avatar;
    playerAvatar.removeAttribute('src');
  } else {
    playerAvatar.style.fontSize = '';
    playerAvatar.style.display = '';
    playerAvatar.style.alignItems = '';
    playerAvatar.style.justifyContent = '';
    playerAvatar.style.background = '';
    playerAvatar.textContent = '';
    playerAvatar.src = profile.avatar;
  }
  
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
}

function renderLeaderboard() {
  const leaderboard = LuminaCore.getLeaderboard();
  const container = document.getElementById('leaderboardContent');
  
  container.innerHTML = leaderboard.map((player, index) => {
    const avatarHtml = player.id === 'guest'
      ? `<div class="leaderboard-avatar" style="font-size: 24px; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary);">${player.avatar}</div>`
      : `<img src="${player.avatar}" alt="${player.name}" class="leaderboard-avatar">`;
    
    return `
      <div class="leaderboard-item ${index === 0 ? 'leader' : ''}">
        <div class="leaderboard-rank ${index === 0 ? 'first' : 'second'}">
          ${index === 0 ? '👑' : '🥈'}
        </div>
        ${avatarHtml}
        <div class="leaderboard-info">
          <div class="leaderboard-name">${player.name}</div>
          <div class="leaderboard-xp">${player.totalXP} XP • ${player.achievementCount} 🏅</div>
        </div>
        <div class="leaderboard-level">Lv.${player.level}</div>
      </div>
    `;
  }).join('');
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
