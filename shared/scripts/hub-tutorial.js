// ==================== TUTORIAL SYSTEM ====================

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to Noyola Hub! 🎮',
    content: `
      <p>This is your gaming hub where you can play educational games, earn XP, collect coins, and unlock achievements!</p>
      <p><strong>Your Profile:</strong> Click your avatar at the top to switch between profiles (Emma, Liam, or Guest).</p>
    `,
    highlight: 'playerBanner'
  },
  {
    title: 'Choose Your Adventure 🎯',
    content: `
      <p>Select any game from the grid to start playing!</p>
      <p>Each game teaches different skills:</p>
      <ul>
        <li>🎵 <strong>Rhythm Academy</strong> - Music & rhythm learning</li>
        <li>🎮 <strong>Pixel Quest</strong> - Platforming & problem solving</li>
        <li>⚔️ <strong>Math Quest</strong> - Math battles & RPG</li>
        <li>🏰 <strong>Spell Siege</strong> - Spelling & typing</li>
        <li>And more!</li>
      </ul>
    `,
    highlight: 'gamesGrid'
  },
  {
    title: 'Earn Rewards! 🏆',
    content: `
      <p>As you play games, you'll earn:</p>
      <ul>
        <li><strong>⭐ XP</strong> - Level up and unlock new titles</li>
        <li><strong>💰 Coins</strong> - Spend in the shop for power-ups and cosmetics</li>
        <li><strong>🏅 Achievements</strong> - Unlock special badges</li>
        <li><strong>🔥 Streaks</strong> - Play daily to build your streak!</li>
      </ul>
      <p>Click the <strong>Shop</strong> button to see what you can buy!</p>
    `,
    highlight: 'rewardsPreview'
  },
  {
    title: 'Daily Challenges 📅',
    content: `
      <p>Check the <strong>Daily Challenges</strong> panel every day for new goals!</p>
      <p>Complete challenges to earn bonus XP and coins.</p>
      <p>Challenges reset every day at midnight.</p>
    `,
    highlight: 'dailyChallengesContent'
  },
  {
    title: 'Leaderboard 🏆',
    content: `
      <p>See how you rank against other players!</p>
      <p>Filter by XP, achievements, coins, or streak to see different rankings.</p>
      <p>Work together on <strong>Family Quests</strong> to unlock special rewards!</p>
    `,
    highlight: 'leaderboardPanel'
  },
  {
    title: 'Ready to Play! 🚀',
    content: `
      <p>You're all set! Start playing games and have fun learning!</p>
      <p><strong>Tip:</strong> Play different games each day to complete daily challenges faster!</p>
      <p>Good luck and have fun! 🎉</p>
    `,
    highlight: null
  }
];

let currentTutorialStep = 0;
let tutorialCompleted = false;

function checkTutorialStatus() {
  const data = LuminaCore.getData();
  const profile = LuminaCore.getActiveProfile();
  
  if (!profile) return;
  
  // Check if tutorial was completed
  const tutorialKey = `tutorial_completed_${profile.id}`;
  tutorialCompleted = data.settings[tutorialKey] || false;
  
  // Show tutorial if not completed
  if (!tutorialCompleted) {
    setTimeout(() => {
      showTutorial();
    }, 1000); // Wait 1 second after page load
  }
}

function showTutorial() {
  const modal = document.getElementById('tutorialModal');
  if (!modal) return;
  
  modal.style.display = 'flex';
  currentTutorialStep = 0;
  renderTutorialStep();
}

function closeTutorial() {
  const modal = document.getElementById('tutorialModal');
  if (modal) {
    modal.style.display = 'none';
  }
  
  // Mark tutorial as completed
  const profile = LuminaCore.getActiveProfile();
  if (profile) {
    const data = LuminaCore.getData();
    const tutorialKey = `tutorial_completed_${profile.id}`;
    data.settings[tutorialKey] = true;
    LuminaCore.updateSettings(data.settings);
    tutorialCompleted = true;
  }
}

function nextTutorialStep() {
  currentTutorialStep++;
  
  if (currentTutorialStep >= TUTORIAL_STEPS.length) {
    closeTutorial();
    return;
  }
  
  renderTutorialStep();
}

function renderTutorialStep() {
  const step = TUTORIAL_STEPS[currentTutorialStep];
  const content = document.getElementById('tutorialContent');
  const nextBtn = document.querySelector('#tutorialModal .btn-primary');
  
  if (!content) return;
  
  content.innerHTML = `
    <h3>${step.title}</h3>
    ${step.content}
    <div style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
      Step ${currentTutorialStep + 1} of ${TUTORIAL_STEPS.length}
    </div>
  `;
  
  if (nextBtn) {
    if (currentTutorialStep === TUTORIAL_STEPS.length - 1) {
      nextBtn.textContent = 'Finish';
    } else {
      nextBtn.textContent = 'Next →';
    }
  }
  
  // Highlight element if specified
  if (step.highlight) {
    const element = document.getElementById(step.highlight);
    if (element) {
      element.style.transition = 'all 0.3s ease';
      element.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.8)';
      element.style.transform = 'scale(1.02)';
      
      // Scroll to element
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Remove highlight after tutorial closes
      setTimeout(() => {
        if (document.getElementById('tutorialModal').style.display === 'none') {
          element.style.boxShadow = '';
          element.style.transform = '';
        }
      }, 500);
    }
  }
}

// Auto-show tutorial on first visit
if (typeof LuminaCore !== 'undefined') {
  // Wait for LuminaCore to load
  setTimeout(() => {
    checkTutorialStatus();
  }, 500);
}
