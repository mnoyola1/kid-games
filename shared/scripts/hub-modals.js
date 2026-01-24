// ==================== PROFILE SELECTION ====================
let pendingProfileSelection = null;

function showProfileSelect() {
  const modal = document.getElementById('profileModal');
  const grid = document.getElementById('profileSelectGrid');
  const profiles = LuminaCore.getAllProfiles();
  const activeKey = LuminaCore.getActiveProfileKey();
  
  console.log('👥 Showing profile select. Profiles:', profiles);
  
  grid.innerHTML = Object.entries(profiles).map(([key, profile]) => {
    const needsPIN = key !== 'guest' && profile.pin;
    const lockIcon = needsPIN ? '🔒' : '';
    
    console.log(`Profile ${key} avatar:`, profile.avatar);
    
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

function showRewardHistoryModal() {
  const profile = LuminaCore.getActiveProfile();
  if (!profile) return;
  
  const modal = document.getElementById('rewardHistoryModal');
  const list = document.getElementById('rewardHistoryList');
  
  const claimedRewards = LuminaCore.getClaimedRewards(profile.id);
  const pendingRewards = LuminaCore.getPendingRewards().filter(r => r.playerId === profile.id);
  
  // Combine and sort by date (newest first)
  const allRewards = [...claimedRewards, ...pendingRewards].sort((a, b) => {
    const dateA = new Date(a.fulfilledAt || a.claimedAt);
    const dateB = new Date(b.fulfilledAt || b.claimedAt);
    return dateB - dateA;
  });
  
  if (allRewards.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
        <p style="font-size: 3rem; margin-bottom: 1rem;">📭</p>
        <p>No rewards claimed yet!</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Start earning reward points to claim your first reward.</p>
      </div>
    `;
  } else {
    list.innerHTML = allRewards.map(reward => {
      const rewardDef = LuminaCore.REWARDS_CATALOG.find(r => r.id === reward.rewardId);
      const icon = rewardDef ? rewardDef.icon : '🎁';
      const claimedDate = new Date(reward.claimedAt);
      const fulfilledDate = reward.fulfilledAt ? new Date(reward.fulfilledAt) : null;
      
      const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
      };
      
      return `
        <div class="reward-history-item">
          <div class="reward-history-info">
            <span class="reward-history-icon">${icon}</span>
            <div class="reward-history-details">
              <div class="reward-history-name">${reward.rewardName}</div>
              <div class="reward-history-dates">
                <div class="reward-history-date">
                  <span>📅 Claimed:</span>
                  <span>${formatDate(claimedDate)}</span>
                </div>
                ${fulfilledDate ? `
                  <div class="reward-history-date">
                    <span>✅ Fulfilled:</span>
                    <span>${formatDate(fulfilledDate)}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
          <div class="reward-history-status ${reward.status || 'pending'}">
            ${reward.status === 'fulfilled' ? '✅ Fulfilled' : 
              reward.status === 'expired' ? '⏰ Expired' : 
              '⏳ Pending'}
          </div>
        </div>
      `;
    }).join('');
  }
  
  modal.classList.add('active');
}

function closeRewardHistoryModal() {
  document.getElementById('rewardHistoryModal').classList.remove('active');
}

// ==================== SHOP ====================
let currentShopCategory = 'all';

function showShopModal() {
  const profile = LuminaCore.getActiveProfile();
  if (!profile) return;
  
  const modal = document.getElementById('shopModal');
  const grid = document.getElementById('shopGrid');
  
  document.getElementById('shopCoinsDisplay').textContent = profile.currentCoins;
  
  filterShopItems('all');
  
  modal.classList.add('active');
}

function closeShopModal() {
  document.getElementById('shopModal').classList.remove('active');
}

function filterShopItems(category) {
  currentShopCategory = category;
  const profile = LuminaCore.getActiveProfile();
  if (!profile) return;
  
  const grid = document.getElementById('shopGrid');
  const items = category === 'all' 
    ? LuminaCore.SHOP_ITEMS 
    : LuminaCore.SHOP_ITEMS.filter(item => item.category === category);
  
  grid.innerHTML = items.map(item => {
    const canAfford = profile.currentCoins >= item.cost;
    const isOwned = LuminaCore.hasItem(profile.id, item.id);
    const inventory = LuminaCore.getInventory(profile.id);
    
    // For consumables, show current count
    let ownedText = '';
    if (item.type === 'consumable' && inventory) {
      const powerupKey = item.id.replace('powerup_', '');
      const count = inventory.powerups[powerupKey] || 0;
      if (count > 0) {
        ownedText = ` (${count})`;
      }
    }
    
    return `
      <div class="shop-item ${canAfford && !isOwned ? 'affordable' : ''} ${isOwned ? 'owned' : ''}">
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-name">${item.name}${ownedText}</div>
        <div class="shop-item-description">${item.description}</div>
        <div class="shop-item-cost ${canAfford ? 'affordable' : 'unaffordable'}">
          💰 ${item.cost}
        </div>
        <button 
          class="shop-purchase-btn ${isOwned ? 'owned' : canAfford ? 'can-buy' : 'cannot-buy'}" 
          onclick="${isOwned ? '' : canAfford ? `purchaseShopItem('${item.id}')` : ''}"
          ${isOwned || !canAfford ? 'disabled' : ''}>
          ${isOwned ? '✓ Owned' : canAfford ? 'Buy' : `Need ${item.cost - profile.currentCoins} more`}
        </button>
      </div>
    `;
  }).join('');
  
  // Update active category button
  document.querySelectorAll('.shop-category-btn').forEach(btn => {
    const btnText = btn.textContent.trim().toLowerCase();
    const categoryText = category === 'all' ? 'all' : category.toLowerCase();
    if (btnText === categoryText || (category === 'all' && btnText === 'all')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function purchaseShopItem(itemId) {
  const profile = LuminaCore.getActiveProfile();
  if (!profile) {
    showToast('Please select a profile first', 'error');
    return;
  }
  
  const result = LuminaCore.purchaseItem(profile.id, itemId);
  
  if (result.success) {
    showToast(`Purchased ${result.item.name}!`, 'success');
    updateUI();
    renderShop();
    
    // If it's a theme, apply it immediately
    if (result.item.type === 'theme') {
      const themeMap = {
        'theme_rainbow': 'rainbow',
        'theme_space': 'space',
        'theme_ocean': 'ocean',
        'theme_forest': 'forest'
      };
      const theme = themeMap[itemId];
      if (theme && typeof setTheme === 'function') {
        setTheme(theme);
        showToast(`Theme applied!`, 'success');
      }
    }
  } else {
    showToast(result.error || 'Purchase failed', 'error');
  }
}
  const profile = LuminaCore.getActiveProfile();
  if (!profile) return;
  
  const result = LuminaCore.purchaseItem(profile.id, itemId);
  
  if (result.success) {
    showToast(`🎉 Purchased: ${result.item.name}!`, 'success');
    updateUI();
    // Refresh shop display
    filterShopItems(currentShopCategory);
    document.getElementById('shopCoinsDisplay').textContent = profile.currentCoins;
  } else {
    showToast(`❌ ${result.error}`, 'error');
  }
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
