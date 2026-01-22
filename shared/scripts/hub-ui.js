// ==================== UI UPDATES ====================
function updateUI() {
  const profile = LuminaCore.getActiveProfile();
  if (!profile) return;
  
  // Update player banner
  document.getElementById('playerAvatar').src = profile.avatar;
  document.getElementById('playerName').textContent = profile.name;
  document.getElementById('playerTitle').textContent = profile.title;
  document.getElementById('levelBadge').textContent = `Lv. ${profile.level}`;
  document.getElementById('levelTitle').textContent = LuminaCore.getLevelTitle(profile.level);
  
  // Update stats
  document.getElementById('coinsDisplay').textContent = profile.coins;
  document.getElementById('pointsDisplay').textContent = profile.rewardPoints;
  document.getElementById('streakDisplay').textContent = `${profile.streak.current}🔥`;
  
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
  
  container.innerHTML = leaderboard.map((player, index) => `
    <div class="leaderboard-item ${index === 0 ? 'leader' : ''}">
      <div class="leaderboard-rank ${index === 0 ? 'first' : 'second'}">
        ${index === 0 ? '👑' : '🥈'}
      </div>
      <img src="${player.avatar}" alt="${player.name}" class="leaderboard-avatar">
      <div class="leaderboard-info">
        <div class="leaderboard-name">${player.name}</div>
        <div class="leaderboard-xp">${player.totalXp} XP • ${player.achievements} 🏅</div>
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
    const percentage = Math.min((quest.current / quest.target) * 100, 100);
    document.getElementById('familyQuestFill').style.width = `${percentage}%`;
    document.getElementById('familyQuestText').textContent = `${quest.current} / ${quest.target} XP Together`;
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
