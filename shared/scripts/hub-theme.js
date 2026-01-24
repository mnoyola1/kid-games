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
  
  const themeIcons = {
    'fantasy': '✨',
    'gaming': '🎮',
    'rainbow': '🌈',
    'space': '🚀',
    'ocean': '🌊',
    'forest': '🌲'
  };
  
  const themeLabels = {
    'fantasy': 'Fantasy',
    'gaming': 'Gaming',
    'rainbow': 'Rainbow',
    'space': 'Space',
    'ocean': 'Ocean',
    'forest': 'Forest'
  };
  
  if (icon) icon.textContent = themeIcons[theme] || '✨';
  if (label) label.textContent = themeLabels[theme] || 'Theme';
  
  // Recreate stars with new theme colors
  if (typeof createStars === 'function') {
    createStars();
  }
}

function getAvailableThemes() {
  const profile = LuminaCore.getActiveProfile();
  if (!profile) return ['fantasy', 'gaming'];
  
  const available = ['fantasy', 'gaming']; // Base themes
  
  // Check purchased themes
  if (profile.inventory && profile.inventory.themes) {
    profile.inventory.themes.forEach(themeId => {
      const themeMap = {
        'theme_rainbow': 'rainbow',
        'theme_space': 'space',
        'theme_ocean': 'ocean',
        'theme_forest': 'forest'
      };
      if (themeMap[themeId]) {
        available.push(themeMap[themeId]);
      }
    });
  }
  
  return available;
}

function applyPurchasedTheme() {
  const profile = LuminaCore.getActiveProfile();
  if (!profile || !profile.inventory || !profile.inventory.themes) return;
  
  // Check if player has a purchased theme active
  const activeTheme = localStorage.getItem(THEME_KEY) || 'fantasy';
  const purchasedThemes = profile.inventory.themes.map(themeId => {
    const themeMap = {
      'theme_rainbow': 'rainbow',
      'theme_space': 'space',
      'theme_ocean': 'ocean',
      'theme_forest': 'forest'
    };
    return themeMap[themeId];
  }).filter(Boolean);
  
  // If current theme is a purchased one, make sure it's still available
  if (purchasedThemes.includes(activeTheme)) {
    setTheme(activeTheme);
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'fantasy' ? 'gaming' : 'fantasy';
  setTheme(newTheme);
}
