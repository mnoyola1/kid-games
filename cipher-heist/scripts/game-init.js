/**
 * Cipher Heist - Initialization
 */

function initCipherHeist() {
  if (typeof CipherHeist === 'undefined') {
    setTimeout(initCipherHeist, 100);
    return;
  }

  try {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(CipherHeist));
    console.log('🔓 Cipher Heist initialized');
  } catch (error) {
    console.error('❌ Cipher Heist initialization error:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCipherHeist);
} else {
  initCipherHeist();
}
