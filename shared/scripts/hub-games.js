// ==================== GAME RENDERING ====================
function renderGames() {
  const profile = LuminaCore.getActiveProfile();
  const container = document.getElementById('gamesGrid');
  
  container.innerHTML = GAMES.map(game => {
    const gameStats = profile?.games?.[game.id] || { highScore: 0, sessionsPlayed: 0 };
    
    return `
      <a href="${game.active ? game.url : '#'}" class="game-card ${game.active ? '' : 'coming-soon'}">
        ${!game.active ? '<span class="coming-soon-badge">Coming Soon</span>' : ''}
        <div class="game-icon">${game.icon}</div>
        <h3 class="game-title">${game.name}</h3>
        <p class="game-subtitle">${game.subtitle}</p>
        <p class="game-description">${game.description}</p>
        <div class="game-features">
          ${game.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
        </div>
        ${profile && gameStats.sessionsPlayed > 0 ? `
          <div class="game-stats">
            <div class="game-stat">
              <div class="game-stat-value">${gameStats.sessionsPlayed}</div>
              <div class="game-stat-label">Plays</div>
            </div>
            <div class="game-stat">
              <div class="game-stat-value">${gameStats.highScore}</div>
              <div class="game-stat-label">Best</div>
            </div>
          </div>
        ` : ''}
        <div class="play-button">${game.active ? '▶️ Play Now' : 'Coming Soon'}</div>
      </a>
    `;
  }).join('');
}
