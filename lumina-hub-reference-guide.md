# LUMINA HUB - Project Reference Guide
## Complete Technical & Design Documentation
### Last Updated: January 21, 2025
### Architecture Refactored: January 21, 2025

---

# QUICK START FOR NEW CHAT

**What is this?**
A unified game ecosystem called "Lumina Hub" that connects multiple educational games for my kids Emma (10, 5th grade) and Liam (8, 3rd grade). It provides shared profiles, XP/leveling, coins, achievements, leaderboards, and real-world rewards that parents can approve.

**Project Location:**
- **Local:** `C:\Users\mnoyo\OneDrive\Documents\Personal\AI\games\kid-games`
- **GitHub:** Repository deployed via Vercel
- **Live URL:** https://kid-games-one.vercel.app/

**Current Status:**
- ✅ Core module created (lumina-core.js)
- ✅ Hub UI redesigned and refactored (index.html - now modular)
- ✅ CSS/JS extracted into separate files for maintainability
- ✅ Asset consolidation complete (audio files moved to local assets)
- ⏳ Game integration pending (need to wire up Canada Adventure as proof of concept)

---

# PART 1: PROJECT OVERVIEW

## The Vision

Create a "meta-game" layer that sits above individual educational games, making the learning experience feel like one connected adventure. Kids earn XP and coins across all games, level up their profiles, unlock achievements, and redeem points for real-world rewards (with parent approval).

## Target Players

| Player | Age | Grade | Profile Name | Class |
|--------|-----|-------|--------------|-------|
| Emma | 10 | 5th | The Sage | Strategic thinker |
| Liam | 8 | 3rd | The Warrior | Action-oriented |

## Core Features

1. **Unified Profiles** - Each child has a persistent profile tracking all progress
2. **XP & Leveling** - 100 XP per level, max level 50, with named titles
3. **Coins** - In-game currency earned through gameplay
4. **Reward Points** - Earned alongside XP, redeemable for real privileges
5. **Achievements** - 26 achievements across general, game-specific, and secret categories
6. **Streaks** - Daily play tracking with streak bonuses
7. **Family Quests** - Collaborative goals where both kids contribute
8. **Leaderboard** - Friendly competition between siblings
9. **Parent Controls** - PIN-protected reward redemption

---

# PART 2: TECHNICAL ARCHITECTURE

## File Structure

```
C:\Users\mnoyo\OneDrive\Documents\Personal\AI\games\kid-games\
├── index.html                    # Main hub (192 lines - clean HTML only)
├── manifest.json                 # PWA manifest
├── README.md                     # Project documentation
├── lumina-hub-reference-guide.md # This file - complete reference
│
├── shared/                        # Shared resources
│   ├── lumina-core.js           # Core state management module
│   │
│   ├── styles/                   # Hub CSS (modular)
│   │   ├── hub-themes.css       # CSS variables (fantasy/gaming themes)
│   │   ├── hub-base.css         # Base styles (reset, body)
│   │   ├── hub-animations.css   # Animations & background effects
│   │   ├── hub-layout.css      # Layout & responsive styles
│   │   └── hub-components.css   # All component styles (cards, modals, etc.)
│   │
│   └── scripts/                  # Hub JavaScript (modular)
│       ├── hub-config.js        # Game registry (GAMES array) & state
│       ├── hub-theme.js         # Theme management functions
│       ├── hub-ui.js            # UI updates (leaderboard, rewards, quest)
│       ├── hub-games.js         # Game card rendering
│       ├── hub-modals.js        # Modal management (profile, rewards, PIN, toast)
│       └── hub-init.js          # Initialization & background stars
│
├── assets/                       # All game assets
│   ├── images/                   # Avatars, banners, icons
│   │   ├── Emma_Lumina.png
│   │   ├── Liam_Lumina.png
│   │   ├── Noyola_Games_Banner.png
│   │   └── Noyola_Hub_Banner.png
│   │
│   └── audio/                    # Game music & sound effects
│       └── spell-siege/
│           └── music/            # 7 WAV files
│               ├── Main Menu Theme.wav
│               ├── Gameplay - Early Waves 1-3.wav
│               ├── Gameplay - Mid Waves 4-7.wav
│               ├── Gameplay - Final Waves.wav
│               ├── Boss Encounter.wav
│               ├── Victory Fanfare.wav
│               └── Game Over.wav
│
└── [game-folders]/               # Individual games
    ├── spell-siege/             # Tower defense spelling game (REFACTORED)
    │   ├── index.html           # Main entry point (101 lines - clean HTML only)
    │   ├── styles/
    │   │   └── game-base.css    # Base styles & animations (106 lines)
    │   └── scripts/
    │       ├── game-config.js   # Constants, words, settings (63 lines)
    │       ├── game-audio.js    # AudioManager class (172 lines)
    │       ├── game-speech.js   # Speech synthesis (11 lines)
    │       ├── game-main.js     # Main SpellSiege component (896 lines)
    │       └── game-init.js     # Initialization (2 lines)
    │
    ├── canada-adventure/        # Canada geography RPG (REFACTORED)
    │   ├── index.html           # Main entry point (40 lines - clean HTML only)
    │   ├── styles/
    │   │   └── game-base.css    # Base styles & animations (37 lines)
    │   └── scripts/
    │       ├── game-data.js     # Questions, regions, monsters (77 lines)
    │       ├── game-sprites.js  # Pixel art sprite data (162 lines)
    │       ├── game-components.js # React components (119 lines)
    │       ├── game-main.js     # Main game logic (497 lines)
    │       └── game-init.js     # Initialization (4 lines)
    │
    ├── lumina-racer/
    │   └── index.html           # Racing game (monolithic)
    ├── word-forge/
    │   └── index.html           # Word crafting game (monolithic)
    └── shadows-in-the-halls/
        └── index.html           # Mystery adventure (monolithic)
```

## Architecture Overview

### Modular Design Principles

The hub has been refactored into a modular architecture for better maintainability and scalability:

1. **Separation of Concerns** - CSS, JS, and HTML are separated
2. **Single Responsibility** - Each file has a clear, focused purpose
3. **Easy to Extend** - Adding new games or features is straightforward
4. **Better Caching** - External files can be cached by browsers
5. **Team-Friendly** - Multiple developers can work on different files

### File Organization

#### CSS Files (`shared/styles/`)
- **hub-themes.css** - Theme system (fantasy/gaming CSS variables)
- **hub-base.css** - Foundation (reset, typography, body styles)
- **hub-animations.css** - All animations and keyframes
- **hub-layout.css** - Grid systems, containers, responsive breakpoints
- **hub-components.css** - All reusable components (cards, buttons, modals, etc.)

#### JavaScript Files (`shared/scripts/`)
- **hub-config.js** - Game registry and global state variables
- **hub-theme.js** - Theme switching and initialization
- **hub-ui.js** - UI update functions (leaderboard, rewards, family quest)
- **hub-games.js** - Game card rendering logic
- **hub-modals.js** - All modal interactions (profile, rewards, PIN, toast)
- **hub-init.js** - DOMContentLoaded initialization and background effects

### Loading Order

**CSS (in `<head>`):**
1. hub-themes.css (variables must load first)
2. hub-base.css (foundation)
3. hub-animations.css
4. hub-layout.css
5. hub-components.css (components depend on all above)

**JavaScript (before `</body>`):**
1. lumina-core.js (core API must load first)
2. hub-config.js (game data)
3. hub-theme.js (theme functions)
4. hub-ui.js (UI functions)
5. hub-games.js (game rendering)
6. hub-modals.js (modal functions)
7. hub-init.js (initialization - must load last)

### Adding a New Game

To add a new game to the hub:

1. **Create game folder** - `[game-name]/index.html`
2. **Update game registry** - Add entry to `GAMES` array in `shared/scripts/hub-config.js`:
   ```javascript
   {
     id: 'new-game',
     name: 'New Game',
     subtitle: 'Game Type',
     icon: '🎮',
     url: './new-game/index.html',
     description: 'Game description...',
     features: ['Feature 1', 'Feature 2'],
     active: true
   }
   ```
3. **Add assets** (if needed) - Place in `assets/audio/[game-name]/music/`
4. **Integrate LuminaCore** - Add script tag in game's `index.html`:
   ```html
   <script src="../shared/lumina-core.js"></script>
   ```

### Asset Path Conventions

- **From hub (`index.html`)**: `./assets/audio/spell-siege/music/`
- **From game folder**: `../assets/audio/spell-siege/music/`
- **Shared scripts**: `../shared/scripts/[filename].js`
- **Shared styles**: `../shared/styles/[filename].css`

### Game Refactoring Pattern

Individual games can follow the same modular pattern as the hub:

#### Canada Adventure Example

**Before:** 915 lines (monolithic)  
**After:** 936 lines across 7 files (92.5% reduction in index.html)

- `index.html`: 40 lines (clean HTML with external links)
- `styles/game-base.css`: 37 lines (base styles & animations)
- `scripts/game-data.js`: 77 lines (game data & configuration)
- `scripts/game-sprites.js`: 162 lines (pixel art sprite data)
- `scripts/game-components.js`: 119 lines (React components)
- `scripts/game-main.js`: 497 lines (main game logic)
- `scripts/game-init.js`: 4 lines (initialization)

#### Spell Siege Example

**Before:** 1,343 lines (monolithic)  
**After:** 1,351 lines across 6 files (92.5% reduction in index.html)

- `index.html`: 101 lines (clean HTML with external links + Tailwind config)
- `styles/game-base.css`: 106 lines (base styles & animations)
- `scripts/game-config.js`: 63 lines (constants, words, difficulty settings)
- `scripts/game-audio.js`: 172 lines (AudioManager class for music/SFX)
- `scripts/game-speech.js`: 11 lines (text-to-speech functions)
- `scripts/game-main.js`: 896 lines (main SpellSiege component)
- `scripts/game-init.js`: 2 lines (initialization)

**Benefits:**
- Clear separation of concerns
- Easy to find and edit specific functionality
- Better browser caching
- Reusable components across games
- Easier debugging and testing
- Consistent architecture across all games

## LuminaCore Module API

The core module (`shared/lumina-core.js`) provides:

### Profile Management
```javascript
LuminaCore.getActiveProfile()           // Returns current player's profile
LuminaCore.setActiveProfile(profileId)  // Switch between 'emma' or 'liam'
LuminaCore.getProfile(profileId)        // Get specific profile
LuminaCore.getAllProfiles()             // Get both profiles
```

### XP & Progression
```javascript
LuminaCore.addXP(amount, source)        // Add XP, auto-levels up
LuminaCore.getLevel(profileId)          // Calculate level from XP
LuminaCore.getLevelTitle(level)         // Get title like "Apprentice", "Knight", etc.
LuminaCore.getXPForNextLevel(profileId) // XP needed for next level
```

### Economy
```javascript
LuminaCore.addCoins(amount, source)     // Add coins
LuminaCore.spendCoins(amount)           // Spend coins (returns true/false)
LuminaCore.addRewardPoints(amount)      // Add reward points
```

### Achievements
```javascript
LuminaCore.awardAchievement(achievementId)  // Grant achievement + bonus XP
LuminaCore.hasAchievement(achievementId)    // Check if earned
LuminaCore.getAchievements(profileId)       // Get all earned achievements
```

### Game Stats
```javascript
LuminaCore.recordGameSession(gameId, stats) // Log a play session
// stats = { score, questionsCorrect, questionsTotal, customStats }

LuminaCore.getGameStats(gameId, profileId)  // Get stats for a game
```

### Rewards
```javascript
LuminaCore.getRewards()                     // Get reward catalog
LuminaCore.claimReward(rewardId, pin)       // Claim reward (requires PIN)
LuminaCore.verifyPin(pin)                   // Verify parent PIN
```

### Events
```javascript
LuminaCore.subscribe(callback)              // Listen for state changes
LuminaCore.unsubscribe(callback)            // Stop listening
```

## Data Structure (localStorage)

```javascript
{
  version: 1,
  profiles: {
    emma: {
      id: 'emma',
      name: 'Emma',
      title: 'The Sage',
      avatar: '🧙‍♀️',
      totalXP: 0,
      coins: 0,
      rewardPoints: 0,
      achievements: [],
      streak: { current: 0, best: 0, lastPlayed: null },
      gameStats: {},
      createdAt: timestamp,
      updatedAt: timestamp
    },
    liam: { /* similar structure */ }
  },
  activeProfile: 'emma',
  familyQuest: null,
  settings: {
    parentPin: '1234',
    soundEnabled: true,
    notificationsEnabled: true
  }
}
```

## Deployment & Data Storage

### Current Setup: localStorage + Vercel
- **Hosting:** Vercel (auto-deploys from GitHub)
- **Storage:** Browser localStorage (client-side)
- **Live URL:** https://kid-games-one.vercel.app/

**How localStorage works on Vercel:**
- Data persists on the device/browser where they play
- Survives page refreshes, closing browser, redeployments
- Each device maintains its own separate data
- No server costs, works offline

**Limitations:**
| Scenario | What Happens |
|----------|--------------|
| Play on iPad | ✅ Progress saved on iPad |
| Check on computer | ❌ Different device = fresh start |
| Clear browser data | ❌ Progress lost |
| New device | ❌ Need to start over |

**For primary use case** (kids on one iPad), localStorage is ideal - simple and reliable.

### Future Enhancement: Supabase/Firebase
Plan to add cloud sync for cross-device support and backup:
- **Supabase** or **Firebase** (free tier covers family use)
- Enables playing on any device with same progress
- Automatic backup (no data loss if browser cleared)
- Could add parent dashboard for monitoring progress

**Migration path:**
1. Keep localStorage as offline fallback
2. Add Supabase/Firebase as sync layer
3. On load: merge cloud + local, prefer newer timestamps
4. On save: write to both localStorage and cloud
```

---

# PART 3: LEVEL SYSTEM

## XP Requirements
- **Formula:** Level = floor(totalXP / 100) + 1
- **Max Level:** 50
- **XP per level:** 100

## Level Titles

| Levels | Title |
|--------|-------|
| 1-4 | Apprentice |
| 5-9 | Seeker |
| 10-14 | Adept |
| 15-19 | Scholar |
| 20-24 | Knight |
| 25-29 | Guardian |
| 30-34 | Champion |
| 35-39 | Master |
| 40-44 | Sage |
| 45-49 | Legend |
| 50 | Keeper of Light |

---

# PART 4: REWARDS SYSTEM

## Reward Catalog

| ID | Name | Cost | Description |
|----|------|------|-------------|
| 99_nights_15 | 99 Nights 15min | 100 pts | 15 minutes of 99 Nights gaming |
| 99_nights_30 | 99 Nights 30min | 200 pts | 30 minutes of 99 Nights gaming |
| 99_nights_60 | 99 Nights 1hr | 400 pts | 1 hour of 99 Nights gaming |
| movie_pick | Pick Movie | 250 pts | Choose the family movie |
| dinner_pick | Pick Dinner | 300 pts | Choose what's for dinner |
| stay_up_late | Stay Up 30min | 350 pts | Stay up 30 minutes past bedtime |
| special_treat | Special Treat | 150 pts | Pick a special treat/snack |
| screen_time | Bonus Screen 30min | 175 pts | 30 minutes extra screen time |
| game_credit | $5 Game Credit | 500 pts | $5 toward a game purchase |

## Parent PIN
- Default PIN: `1234`
- Required for: reward claims, profile resets, data operations

---

# PART 5: ACHIEVEMENTS

## General Achievements

| ID | Name | Description | XP Bonus |
|----|------|-------------|----------|
| first_steps | First Steps | Complete your first game session | 10 |
| level_5 | Rising Star | Reach level 5 | 25 |
| level_10 | Shining Bright | Reach level 10 | 50 |
| level_20 | Legendary | Reach level 20 | 100 |
| streak_3 | Getting Started | 3-day play streak | 15 |
| streak_7 | Week Warrior | 7-day play streak | 35 |
| streak_14 | Dedicated | 14-day play streak | 75 |
| streak_30 | Unstoppable | 30-day play streak | 150 |

## Game-Specific Achievements

### Spell Siege
| ID | Name | Description | XP Bonus |
|----|------|-------------|----------|
| ss_first_win | Spell Defender | Win your first Spell Siege game | 20 |
| ss_wave_10 | Wave Master | Reach wave 10 in Spell Siege | 40 |
| ss_perfect | Perfect Speller | Complete a wave with no mistakes | 30 |

### Canada Adventure
| ID | Name | Description | XP Bonus |
|----|------|-------------|----------|
| ca_first_victory | Northern Explorer | Win your first Canada battle | 20 |
| ca_all_regions | Coast to Coast | Unlock all regions | 75 |
| ca_combo_5 | Combo Champion | Get a 5x combo | 35 |

### Word Forge
| ID | Name | Description | XP Bonus |
|----|------|-------------|----------|
| wf_first_craft | First Creation | Craft your first word | 15 |
| wf_legendary | Master Wordsmith | Craft a legendary word | 50 |

### Lumina Racer
| ID | Name | Description | XP Bonus |
|----|------|-------------|----------|
| lr_first_race | Speed Seeker | Complete your first race | 15 |
| lr_first_place | Victory Lap | Win first place | 40 |

## Secret Achievements

| ID | Name | Description | XP Bonus |
|----|------|-------------|----------|
| secret_night_owl | Night Owl | Play after 8 PM | 25 |
| secret_early_bird | Early Bird | Play before 8 AM | 25 |

---

# PART 6: GAME INTEGRATION GUIDE

## How to Connect a Game to LuminaCore

### Step 1: Add Script Tag
```html
<script src="../shared/lumina-core.js"></script>
```

### Step 2: Get Player on Game Start
```javascript
document.addEventListener('DOMContentLoaded', () => {
  const profile = LuminaCore.getActiveProfile();
  if (profile) {
    playerName = profile.name;
  }
});
```

### Step 3: Award XP/Coins on Victory
```javascript
function onBattleVictory(reward) {
  LuminaCore.addXP(reward.xp, 'canada-adventure');
  LuminaCore.addCoins(reward.coins, 'canada-adventure');
}
```

### Step 4: Record Session on Game End
```javascript
function onGameEnd() {
  LuminaCore.recordGameSession('canada-adventure', {
    score: totalScore,
    questionsCorrect: correctAnswers,
    questionsTotal: totalQuestions,
    customStats: {
      regionsExplored: unlockedRegions.length,
      bossesDefeated: bossCount
    }
  });
}
```

### Step 5: Award Achievements
```javascript
// First victory
if (!LuminaCore.hasAchievement('ca_first_victory')) {
  LuminaCore.awardAchievement('ca_first_victory');
}

// All regions unlocked
if (unlockedRegions.length === 7) {
  LuminaCore.awardAchievement('ca_all_regions');
}

// 5x combo
if (combo >= 5 && !LuminaCore.hasAchievement('ca_combo_5')) {
  LuminaCore.awardAchievement('ca_combo_5');
}
```

---

# PART 7: HUB UI DESIGN

## Visual Theme
- **Primary Colors:** Purple gradients (#667eea → #764ba2)
- **Accent:** Gold/amber (#fbbf24, #f59e0b)
- **Background:** Dark purple (#1a1a2e, #16213e)
- **Fonts:** Fredoka (display), Quicksand (body)

## Layout
```
┌─────────────────────────────────────────────────┐
│  [Avatar] Player Name  Lv.X  [XP Bar]  💰 🏆 🔥  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────┐  ┌───────────────────────┐ │
│  │   GAMES GRID    │  │    LEADERBOARD       │ │
│  │                 │  ├───────────────────────┤ │
│  │  [Game] [Game]  │  │    FAMILY QUEST      │ │
│  │  [Game] [Game]  │  ├───────────────────────┤ │
│  │  [Game] [Game]  │  │    REWARDS PREVIEW   │ │
│  └─────────────────┘  └───────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Modals
1. **Profile Selection** - Choose Emma or Liam on first load
2. **Rewards Modal** - Full reward catalog with claim buttons
3. **PIN Entry** - 4-digit parent approval

---

# PART 8: GAMES CATALOG

## Currently Available

| Game | ID | Description | Status |
|------|----|-------------|--------|
| Spell Siege | spell-siege | Tower defense spelling game | ✅ Ready |
| Canada Adventure | canada-adventure | Geography RPG for Canada test | ⏳ Needs integration |
| Lumina Racer | lumina-racer | Racing game with trivia | ✅ Ready |
| Word Forge | word-forge | Word crafting/vocabulary | ✅ Ready |

## Coming Soon

| Game | ID | Description |
|------|----|-------------|
| Shadows in the Halls | shadows-halls | Mystery adventure |
| World of Lumina | world-lumina | Full Lumina RPG (main story) |

---

# PART 9: IMMEDIATE NEXT STEPS

## To Complete Option A (Current Sprint)

1. **Integrate Canada Adventure**
   - Add LuminaCore script tag
   - Use profile name for player
   - Award XP/coins on battle victory
   - Record sessions on game end
   - Trigger achievements (first_victory, all_regions, combo_5)

2. **Test Full Flow**
   - Select profile → Play game → Earn XP → Level up → Earn points → Claim reward

3. **Deploy**
   - Push to GitHub → Auto-deploys to Vercel
   - Test on iPad via https://kid-games-one.vercel.app/

## Future Enhancements (Option B & C)

- **Supabase/Firebase integration** for cross-device sync and backup
- Photo-to-game content pipeline
- Lumina story integration (10-month arc)
- More achievements and secret achievements
- Cosmetic shop for coins
- Family Quest creation UI
- Parent dashboard (view progress, manage rewards)
- Data export/import as backup option

---

# PART 10: RELATED PROJECT FILES

## In This Project
- `canada-adventure.jsx` - Original React prototype
- `canada-adventure-pixel.jsx` - Pixel art version
- `lumina-project-handoff.md` - Full Lumina story bible

## Concept Art Available
- Emma character sheet
- Liam character sheet
- Aurora (spirit fox guide)
- Step (dad character)
- Terra (mom character)
- The Sanctuary (hub world)
- The Fog Frontier
- The Archives (Language Arts region)
- The Calculation Fields (Math region)
- Battle scene mockup
- Trophy Room scene
- Game icons (coin, heart, shield, star, scroll, fox)

---

# APPENDIX: KEY CONTEXT

## Family Details
- Dad: Mario (building this for kids)
- Mom: Adriana
- Emma: 10, 5th grade, strategic thinker
- Liam: 8, 3rd grade, action-oriented

## Design Philosophy
- Learning disguised as gameplay
- Real rewards for real effort
- Sibling-friendly (competition + collaboration)
- Parent oversight without friction
- Works on iPad (primary device)

## Technical Constraints
- Deployed on Vercel (static site, no server functions needed yet)
- localStorage for persistence (Supabase/Firebase planned for future)
- iPad Safari compatible (primary device)
- Works offline once loaded (localStorage is client-side)
- GitHub → Vercel auto-deploy pipeline

---

# END OF REFERENCE GUIDE

**Deployment Workflow:**
1. Make changes locally in `C:\Users\mnoyo\OneDrive\Documents\Personal\AI\games\kid-games`
2. Push to GitHub
3. Vercel auto-deploys to https://kid-games-one.vercel.app/

*To continue this project in a new chat, share this file along with the lumina-core.js and index.html files from the kid-games folder.*
