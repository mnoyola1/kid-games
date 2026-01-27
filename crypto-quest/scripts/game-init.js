/**
 * Crypto Quest - Initialization
 */

// Initialize once everything is ready
function initCryptoQuest() {
  if (typeof CryptoQuest === 'undefined') {
    console.log('⏳ Waiting for CryptoQuest component...');
    setTimeout(initCryptoQuest, 100);
    return;
  }
  
  try {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(CryptoQuest));
    console.log('🔐 Crypto Quest initialized');
  } catch (error) {
    console.error('❌ Crypto Quest initialization error:', error);
  }
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCryptoQuest);
} else {
  initCryptoQuest();
}
