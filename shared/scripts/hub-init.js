// ==================== BACKGROUND ====================
function createStars() {
  const bg = document.getElementById('bgAnimation');
  const theme = document.documentElement.getAttribute('data-theme');
  
  // Clear existing stars
  bg.innerHTML = '';
  
  const starCount = 50;
  
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 3 + 's';
    star.style.width = (Math.random() * 3 + 2) + 'px';
    star.style.height = star.style.width;
    bg.appendChild(star);
  }
  
  // Only add floating shapes for fantasy theme
  if (theme === 'fantasy') {
    const shapes = ['🌟', '✨', '💫', '⭐'];
    for (let i = 0; i < 6; i++) {
      const shape = document.createElement('div');
      shape.className = 'floating-shape';
      shape.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      shape.style.left = Math.random() * 100 + '%';
      shape.style.top = Math.random() * 100 + '%';
      shape.style.fontSize = (Math.random() * 20 + 15) + 'px';
      shape.style.animationDelay = Math.random() * 10 + 's';
      bg.appendChild(shape);
    }
  }
}

// ==================== CLOUD STATUS ====================
function updateCloudStatus() {
  const statusEl = document.getElementById('cloudStatus');
  if (!statusEl) return;
  
  const cloudStatus = LuminaCore.getCloudStatus();
  
  if (!cloudStatus) {
    // Cloud not configured
    statusEl.textContent = '💾';
    statusEl.title = 'Local storage only (cloud sync not configured)';
    statusEl.style.opacity = '0.4';
  } else if (cloudStatus.online) {
    // Online and syncing
    statusEl.textContent = '☁️';
    statusEl.title = 'Cloud sync active' + (cloudStatus.lastSync ? ` (last sync: ${cloudStatus.lastSync.toLocaleTimeString()})` : '');
    statusEl.style.opacity = '1';
    statusEl.style.color = '#4ade80';
  } else {
    // Offline
    statusEl.textContent = '📴';
    statusEl.title = 'Offline - changes saved locally';
    statusEl.style.opacity = '0.7';
    statusEl.style.color = '#fbbf24';
  }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎮 Hub initializing...');
  
  // Initialize Lumina Core (with cloud sync)
  await LuminaCore.loadAsync();
  
  initTheme();
  createStars();
  renderGames();
  
  // Update cloud status indicator
  updateCloudStatus();
  
  // Check if profile is selected
  const activeProfile = LuminaCore.getActiveProfileKey();
  console.log('👤 Active profile:', activeProfile);
  
  if (!activeProfile) {
    console.log('📋 No profile selected, showing profile select modal');
    if (typeof window.showProfileSelect === 'function') {
      window.showProfileSelect();
    } else if (typeof showProfileSelect === 'function') {
      showProfileSelect();
    } else {
      console.error('showProfileSelect not available');
    }
  } else {
    console.log('✅ Profile selected, updating UI');
    updateUI();
  }
  
  // Subscribe to changes
  LuminaCore.subscribe(() => {
    updateUI();
    updateCloudStatus();
  });
  
  // Apply purchased theme on load
  if (typeof applyPurchasedTheme === 'function') {
    applyPurchasedTheme();
  }
  
  // Update cloud status periodically
  setInterval(updateCloudStatus, 30000);
  
  // Setup PIN input auto-advance
  if (typeof window.setupPinInputs === 'function') {
    window.setupPinInputs();
  } else if (typeof setupPinInputs === 'function') {
    setupPinInputs();
  }
  
  if (typeof window.setupProfilePinInputs === 'function') {
    window.setupProfilePinInputs();
  } else if (typeof setupProfilePinInputs === 'function') {
    setupProfilePinInputs();
  }
  
  console.log('✅ Hub initialization complete');
});
