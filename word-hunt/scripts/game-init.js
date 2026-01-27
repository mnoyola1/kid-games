/**
 * Word Hunt - Initialization
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(WordHunt));
  
  console.log('🔍 Word Hunt initialized');
});
