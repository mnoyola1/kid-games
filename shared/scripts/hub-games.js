// ==================== GAME RENDERING ====================
function renderGames() {
  console.log('🎮 renderGames() called');
  console.log('📊 GAMES array:', GAMES);
  
  const profile = LuminaCore.getActiveProfile();
  const container = document.getElementById('gamesGrid');
  
  if (!container) {
    console.error('❌ gamesGrid container not found!');
    return;
  }
  
  if (!GAMES || GAMES.length === 0) {
    console.error('❌ GAMES array is empty or undefined!');
    container.innerHTML = '<p style="color: white; text-align: center;">No games available</p>';
    return;
  }
  
  console.log('✅ Rendering', GAMES.length, 'games');
  
  container.innerHTML = GAMES.map(game => {
    const gameStats = profile?.gameStats?.[game.id] || { highScore: 0, gamesPlayed: 0 };
    
    // Get game tags (show only first tag, similar to Coming Soon badge)
    const tags = game.tags || [];
    const tagLabels = {
      'popular': '🔥 Popular',
      'new': '✨ New',
      'trending': '📈 Trending',
      'favorite': '⭐ Favorite'
    };
    
    // Show first tag only, positioned like Coming Soon badge
    const firstTag = tags.length > 0 ? tags[0] : null;
    
    return `
      <a href="${game.active ? game.url : '#'}" class="game-card ${game.active ? '' : 'coming-soon'}">
        ${!game.active ? '<span class="coming-soon-badge">Coming Soon</span>' : ''}
        ${firstTag ? `<span class="game-tag-badge ${firstTag}">${tagLabels[firstTag] || firstTag}</span>` : ''}
        <div class="game-icon">${game.icon}</div>
        <h3 class="game-title">${game.name}</h3>
        <p class="game-subtitle">${game.subtitle}</p>
        <p class="game-description">${game.description}</p>
        <div class="game-features">
          ${game.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
        </div>
        ${profile && gameStats.gamesPlayed > 0 ? `
          <div class="game-stats">
            <div class="game-stat">
              <div class="game-stat-value">${gameStats.gamesPlayed}</div>
              <div class="game-stat-label">Plays</div>
            </div>
            <div class="game-stat">
              <div class="game-stat-value">${gameStats.highScore || 0}</div>
              <div class="game-stat-label">Best</div>
            </div>
          </div>
        ` : ''}
        <div class="play-button">${game.active ? '▶️ Play Now' : 'Coming Soon'}</div>
      </a>
    `;
  }).join('');
  
  console.log('✅ Games rendered successfully');
}
