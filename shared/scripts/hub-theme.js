// ==================== THEME MANAGEMENT ====================
const THEME_KEY = 'lumina-hub-theme';

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'fantasy';
  setTheme(savedTheme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  
  if (theme === 'fantasy') {
    icon.textContent = '✨';
    label.textContent = 'Fantasy';
  } else {
    icon.textContent = '🎮';
    label.textContent = 'Gaming';
  }
  
  // Recreate stars with new theme colors
  if (typeof createStars === 'function') {
    createStars();
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'fantasy' ? 'gaming' : 'fantasy';
  setTheme(newTheme);
}
