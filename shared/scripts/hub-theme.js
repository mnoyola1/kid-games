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
  const available = ['fantasy', 'gaming']; // Base themes
  if (!profile) return available;
  
  const themeMap = {
    'theme_rainbow': 'rainbow',
    'theme_space': 'space',
    'theme_ocean': 'ocean',
    'theme_forest': 'forest'
  };
  
  // Check owned themes via inventory and hasItem (defensive)
  LuminaCore.SHOP_ITEMS.filter(item => item.type === 'theme').forEach(item => {
    if (LuminaCore.hasItem(profile.id, item.id) && themeMap[item.id]) {
      if (!available.includes(themeMap[item.id])) {
        available.push(themeMap[item.id]);
      }
    }
  });
  
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
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'fantasy';
  const availableThemes = getAvailableThemes();
  const currentIndex = availableThemes.indexOf(currentTheme);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % availableThemes.length;
  setTheme(availableThemes[nextIndex]);
}
