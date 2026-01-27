/**
 * Word Hunt - Initialization
 */

// Initialize once everything is ready
function initWordHunt() {
  if (typeof WordHunt === 'undefined') {
    console.log('⏳ Waiting for WordHunt component...');
    setTimeout(initWordHunt, 100);
    return;
  }
  
  try {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(WordHunt));
    console.log('🔍 Word Hunt initialized');
  } catch (error) {
    console.error('❌ Word Hunt initialization error:', error);
  }
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWordHunt);
} else {
  initWordHunt();
}
