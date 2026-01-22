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

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Hub initializing...');
  
  // Initialize Lumina Core
  LuminaCore.load();
  
  initTheme();
  createStars();
  renderGames();
  
  // Check if profile is selected
  const activeProfile = LuminaCore.getActiveProfileKey();
  console.log('👤 Active profile:', activeProfile);
  
  if (!activeProfile) {
    console.log('📋 No profile selected, showing profile select modal');
    showProfileSelect();
  } else {
    console.log('✅ Profile selected, updating UI');
    updateUI();
  }
  
  // Subscribe to changes
  LuminaCore.subscribe(updateUI);
  
  // Setup PIN input auto-advance
  setupPinInputs();
  
  console.log('✅ Hub initialization complete');
});
