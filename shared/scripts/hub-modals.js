// ==================== PROFILE SELECTION ====================
let pendingProfileSelection = null;

function showProfileSelect() {
  const modal = document.getElementById('profileModal');
  const grid = document.getElementById('profileSelectGrid');
  const profiles = LuminaCore.getAllProfiles();
  const activeKey = LuminaCore.getActiveProfileKey();
  
  grid.innerHTML = Object.entries(profiles).map(([key, profile]) => {
    const needsPIN = key !== 'guest' && profile.pin;
    const lockIcon = needsPIN ? '🔒' : '';
    
    return `
      <div class="profile-select-card ${key} ${key === activeKey ? 'selected' : ''}" onclick="selectProfile('${key}')">
        <img src="${profile.avatar}" alt="${profile.name}" class="profile-select-avatar">
        <div class="profile-select-name">${profile.name} ${lockIcon}</div>
        <div class="profile-select-title">${profile.title}</div>
        <div class="profile-select-level">Level ${profile.level} • ${profile.totalXP} XP</div>
      </div>
    `;
  }).join('');
  
  modal.classList.add('active');
}

function selectProfile(key) {
  const profile = LuminaCore.getPlayer(key);
  
  // Guest profile or profile without PIN - no verification needed
  if (key === 'guest' || !profile.pin) {
    LuminaCore.setActiveProfile(key);
    document.getElementById('profileModal').classList.remove('active');
    updateUI();
    showToast(`Welcome back, ${profile.name}!`, 'success');
    return;
  }
  
  // Profile has PIN - show PIN verification
  pendingProfileSelection = key;
  document.getElementById('profileModal').classList.remove('active');
  showProfilePinModal();
}

// ==================== PROFILE PIN MODAL ====================
function showProfilePinModal() {
  const modal = document.getElementById('profilePinModal');
  const profile = LuminaCore.getPlayer(pendingProfileSelection);
  document.getElementById('profilePinTitle').textContent = `Enter PIN for ${profile.name}`;
  modal.classList.add('active');
  document.getElementById('profilePin1').focus();
  document.getElementById('profilePinError').style.display = 'none';
  // Clear inputs
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`profilePin${i}`).value = '';
  }
}

function closeProfilePinModal() {
  document.getElementById('profilePinModal').classList.remove('active');
  pendingProfileSelection = null;
  showProfileSelect(); // Go back to profile selection
}

function setupProfilePinInputs() {
  for (let i = 1; i <= 4; i++) {
    const input = document.getElementById(`profilePin${i}`);
    if (!input) continue;
    
    input.addEventListener('input', (e) => {
      if (e.target.value.length === 1 && i < 4) {
        document.getElementById(`profilePin${i + 1}`).focus();
      }
      // Auto-submit when all filled
      if (i === 4 && e.target.value.length === 1) {
        submitProfilePin();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target.value === '' && i > 1) {
        document.getElementById(`profilePin${i - 1}`).focus();
      }
    });
  }
}

function submitProfilePin() {
  const pin = [1, 2, 3, 4].map(i => document.getElementById(`profilePin${i}`).value).join('');
  
  if (pin.length !== 4) return;
  
  if (LuminaCore.verifyProfilePIN(pendingProfileSelection, pin)) {
    const profile = LuminaCore.getPlayer(pendingProfileSelection);
    LuminaCore.setActiveProfile(pendingProfileSelection);
    document.getElementById('profilePinModal').classList.remove('active');
    pendingProfileSelection = null;
    updateUI();
    showToast(`Welcome back, ${profile.name}!`, 'success');
  } else {
    document.getElementById('profilePinError').style.display = 'block';
    // Clear and refocus
    for (let i = 1; i <= 4; i++) {
      document.getElementById(`profilePin${i}`).value = '';
    }
    document.getElementById('profilePin1').focus();
  }
}

// ==================== REWARDS ====================
function showRewardsModal() {
  const profile = LuminaCore.getActiveProfile();
  if (!profile) return;
  
  const modal = document.getElementById('rewardsModal');
  const grid = document.getElementById('rewardsGrid');
  
  document.getElementById('modalPointsDisplay').textContent = profile.rewardPoints;
  
  grid.innerHTML = LuminaCore.REWARDS_CATALOG.map(reward => {
    const canAfford = profile.rewardPoints >= reward.points;
    return `
      <div class="reward-card ${canAfford ? 'affordable' : ''}">
        <div class="reward-card-info">
          <span class="reward-card-icon">${reward.icon}</span>
          <div>
            <div class="reward-card-name">${reward.name}</div>
            <div class="reward-card-cost">${reward.points} points</div>
          </div>
        </div>
        <button class="claim-btn ${canAfford ? 'can-claim' : 'cannot-claim'}" 
                onclick="${canAfford ? `claimReward('${reward.id}')` : ''}"
                ${canAfford ? '' : 'disabled'}>
          ${canAfford ? 'Claim' : 'Need ' + (reward.points - profile.rewardPoints)}
        </button>
      </div>
    `;
  }).join('');
  
  modal.classList.add('active');
}

function closeRewardsModal() {
  document.getElementById('rewardsModal').classList.remove('active');
}

function claimReward(rewardId) {
  pendingRewardId = rewardId;
  closeRewardsModal();
  showPinModal();
}

// ==================== PIN MODAL ====================
function showPinModal() {
  document.getElementById('pinModal').classList.add('active');
  document.getElementById('pin1').focus();
  document.getElementById('pinError').style.display = 'none';
  // Clear inputs
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`pin${i}`).value = '';
  }
}

function closePinModal() {
  document.getElementById('pinModal').classList.remove('active');
  pendingRewardId = null;
}

function setupPinInputs() {
  for (let i = 1; i <= 4; i++) {
    const input = document.getElementById(`pin${i}`);
    input.addEventListener('input', (e) => {
      if (e.target.value.length === 1 && i < 4) {
        document.getElementById(`pin${i + 1}`).focus();
      }
      // Auto-submit when all filled
      if (i === 4 && e.target.value.length === 1) {
        submitPin();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target.value === '' && i > 1) {
        document.getElementById(`pin${i - 1}`).focus();
      }
    });
  }
}

function submitPin() {
  const pin = [1, 2, 3, 4].map(i => document.getElementById(`pin${i}`).value).join('');
  
  if (pin.length !== 4) return;
  
  if (pendingRewardId) {
    const profile = LuminaCore.getActiveProfile();
    const result = LuminaCore.claimReward(profile.id, pendingRewardId, pin);
    if (result.success) {
      closePinModal();
      showToast(`🎉 Claimed: ${result.reward.rewardName}!`, 'success');
      updateUI();
    } else {
      document.getElementById('pinError').style.display = 'block';
      // Clear and refocus
      for (let i = 1; i <= 4; i++) {
        document.getElementById(`pin${i}`).value = '';
      }
      document.getElementById('pin1').focus();
    }
  }
}

// ==================== TOAST ====================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
