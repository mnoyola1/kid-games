# NOYOLA HUB - Project Reference Guide
## Complete Technical & Design Documentation
### Last Updated: January 22, 2026
### Architecture Fully Refactored: January 22, 2026

---

# QUICK START FOR NEW CHAT

**What is this?**
A unified game ecosystem called "Noyola Hub" that connects multiple educational games for my kids Emma (10, 5th grade) and Liam (8, 3rd grade). It provides shared profiles, XP/leveling, coins, achievements, leaderboards, and real-world rewards that parents can approve.

**Project Location:**
- **Local:** `C:\Users\mnoyo\OneDrive\Documents\Personal\AI\games\kid-games`
- **GitHub:** Repository deployed via Vercel
- **Live URL:** https://kid-games-one.vercel.app/

**Current Status:**
- ✅ Core module created (lumina-core.js)
- ✅ Hub UI redesigned and refactored (index.html - now modular)
- ✅ CSS/JS extracted into separate files for maintainability
- ✅ Asset consolidation complete (audio files moved to local assets)
- ✅ **All 4 games fully refactored and integrated!**
  - ✅ Spell Siege - Complete with LuminaCore integration
  - ✅ Canada Adventure - Complete with LuminaCore integration
  - ✅ Lumina Racer - Complete with LuminaCore integration
  - ✅ Word Forge - Complete with LuminaCore integration

---

# PART 1: PROJECT OVERVIEW

## The Vision

Create a "meta-game" layer that sits above individual educational games, making the learning experience feel like one connected adventure. Kids earn XP and coins across all games, level up their profiles, unlock achievements, and redeem points for real-world rewards (with parent approval).

## Target Players

| Player | Age | Grade | Profile Name | Class |
|--------|-----|-------|--------------|-------|
| Emma | 10 | 5th | The Sage | Strategic thinker |
| Liam | 8 | 3rd | The Scout | Action-oriented |

## Core Features

1. **Unified Profiles** - Each child has a persistent profile tracking all progress
2. **XP & Leveling** - Progressive XP system with 12 level titles
3. **Coins** - In-game currency earned through gameplay
4. **Reward Points** - Earned alongside XP, redeemable for real privileges
5. **Achievements** - 26+ achievements across general, game-specific, and secret categories
6. **Streaks** - Daily play tracking with streak bonuses
7. **Family Quests** - Collaborative goals where both kids contribute
8. **Leaderboard** - Friendly competition between siblings
9. **Parent Controls** - PIN-protected reward redemption

---

# PART 2: TECHNICAL ARCHITECTURE

## File Structure

```
C:\Users\mnoyo\OneDrive\Documents\Personal\AI\games\kid-games\
├── index.html                      # Main hub (192 lines - clean HTML only)
├── manifest.json                   # PWA manifest
├── README.md                       # Project documentation
├── noyola-hub-reference-guide.md   # This file - complete reference
│
├── shared/                          # Shared resources
│   ├── lumina-core.js              # Core state management module (848 lines)
│   │
│   ├── styles/                      # Hub CSS (modular)
│   │   ├── hub-themes.css          # CSS variables (fantasy/gaming themes)
│   │   ├── hub-base.css            # Base styles (reset, body)
│   │   ├── hub-animations.css      # Animations & background effects
│   │   ├── hub-layout.css          # Layout & responsive styles
│   │   └── hub-components.css      # All component styles (cards, modals, etc.)
│   │
│   └── scripts/                     # Hub JavaScript (modular)
│       ├── hub-config.js           # Game registry (GAMES array) & state
│       ├── hub-theme.js            # Theme management functions
│       ├── hub-ui.js               # UI updates (leaderboard, rewards, quest)
│       ├── hub-games.js            # Game card rendering
│       ├── hub-modals.js           # Modal management (profile, rewards, PIN, toast)
│       └── hub-init.js             # Initialization & background stars
│
├── assets/                          # All game assets
│   ├── Emma_Lumina.png
│   ├── Liam_Lumina.png
│   ├── Noyola_Games_Banner.png
│   ├── Noyola_Hub_Banner.png
│   │
│   └── audio/                       # Game music & sound effects
│       └── spell-siege/
│           └── music/               # 7 WAV files
│               ├── Main Menu Theme.wav
│               ├── Gameplay - Early Waves 1-3.wav
│               ├── Gameplay - Mid Waves 4-7.wav
│               ├── Gameplay - Final Waves.wav
│               ├── Boss Encounter.wav
│               ├── Victory Fanfare.wav
│               └── Game Over.wav
│
└── [game-folders]/                  # Individual games (ALL REFACTORED ✅)
    │
    ├── spell-siege/                # Tower defense spelling game ✅
    │   ├── index.html              # Entry point (101 lines)
    │   ├── styles/
    │   │   └── game-base.css       # Base styles & animations (106 lines)
    │   └── scripts/
    │       ├── game-config.js      # Constants, words, settings (63 lines)
    │       ├── game-audio.js       # AudioManager class (172 lines)
    │       ├── game-speech.js      # Speech synthesis (11 lines)
    │       ├── game-main.js        # Main SpellSiege component (896 lines)
    │       └── game-init.js        # Initialization (2 lines)
    │
    ├── canada-adventure/           # Canada geography RPG ✅
    │   ├── index.html              # Entry point (41 lines)
    │   ├── styles/
    │   │   └── game-base.css       # Base styles & animations (37 lines)
    │   └── scripts/
    │       ├── game-data.js        # Questions, regions, monsters (77 lines)
    │       ├── game-sprites.js     # Pixel art sprite data (162 lines)
    │       ├── game-components.js  # React components (119 lines)
    │       ├── game-main.js        # Main game logic (497 lines)
    │       └── game-init.js        # Initialization (4 lines)
    │
    ├── lumina-racer/               # Typing racing game ✅
    │   ├── index.html              # Entry point (~100 lines)
    │   ├── styles/
    │   │   └── game-base.css       # Base styles & animations (~115 lines)
    │   └── scripts/
    │       ├── game-config.js      # Tracks, characters, words (~125 lines)
    │       ├── game-speech.js      # Text-to-speech (~10 lines)
    │       ├── game-main.js        # Main LuminaRacer component (~640 lines)
    │       └── game-init.js        # Initialization (3 lines)
    │
    ├── word-forge/                 # Crafting & spelling game ✅
    │   ├── index.html              # Entry point (~120 lines)
    │   ├── styles/
    │   │   └── game-base.css       # Base styles & animations (~110 lines)
    │   └── scripts/
    │       ├── game-config.js      # Recipes, word lists (~55 lines)
    │       ├── game-audio.js       # Tone.js sound system (~52 lines)
    │       ├── game-components.js  # EmberParticles component (~43 lines)
    │       ├── game-main.js        # Main WordForge component (~616 lines)
    │       └── game-init.js        # Initialization (3 lines)
    │
    └── shadows-in-the-halls/       # Mystery adventure (not yet refactored)
        └── index.html              # Monolithic file
```

## Architecture Overview

### Modular Design Principles

The hub and all games have been refactored into a modular architecture for better maintainability and scalability:

1. **Separation of Concerns** - CSS, JS, and HTML are separated
2. **Single Responsibility** - Each file has a clear, focused purpose
3. **Easy to Extend** - Adding new games or features is straightforward
4. **Better Caching** - External files can be cached by browsers
5. **Team-Friendly** - Multiple developers can work on different files
6. **Consistent Architecture** - All games follow the same pattern

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

All games follow the same modular pattern:

#### Spell Siege

**Before:** 1,343 lines (monolithic)  
**After:** 1,351 lines across 6 files (92.5% reduction in index.html)

- `index.html`: 101 lines (clean HTML with external links + Tailwind config)
- `styles/game-base.css`: 106 lines (base styles & animations)
- `scripts/game-config.js`: 63 lines (constants, words, difficulty settings)
- `scripts/game-audio.js`: 172 lines (AudioManager class for music/SFX)
- `scripts/game-speech.js`: 11 lines (text-to-speech functions)
- `scripts/game-main.js`: 896 lines (main SpellSiege component)
- `scripts/game-init.js`: 2 lines (initialization)

#### Canada Adventure

**Before:** 915 lines (monolithic)  
**After:** 936 lines across 7 files (95.6% reduction in index.html)

- `index.html`: 41 lines (clean HTML with external links)
- `styles/game-base.css`: 37 lines (base styles & animations)
- `scripts/game-data.js`: 77 lines (game data & configuration)
- `scripts/game-sprites.js`: 162 lines (pixel art sprite data)
- `scripts/game-components.js`: 119 lines (React components)
- `scripts/game-main.js`: 497 lines (main game logic)
- `scripts/game-init.js`: 4 lines (initialization)

#### Lumina Racer

**Before:** 979 lines (monolithic)  
**After:** ~893 lines across 5 files (89.8% reduction in index.html)

- `index.html`: ~100 lines (clean HTML with external links + Tailwind config)
- `styles/game-base.css`: ~115 lines (base styles & animations)
- `scripts/game-config.js`: ~125 lines (tracks, characters, AI racers, words)
- `scripts/game-speech.js`: ~10 lines (text-to-speech functions)
- `scripts/game-main.js`: ~640 lines (main LuminaRacer component)
- `scripts/game-init.js`: 3 lines (initialization)

#### Word Forge

**Before:** 964 lines (monolithic)  
**After:** ~999 lines across 6 files (87.6% reduction in index.html)

- `index.html`: ~120 lines (clean HTML with external links + Tailwind config)
- `styles/game-base.css`: ~110 lines (base styles & animations)
- `scripts/game-config.js`: ~55 lines (recipes, word lists)
- `scripts/game-audio.js`: ~52 lines (Tone.js sound system)
- `scripts/game-components.js`: ~43 lines (EmberParticles component)
- `scripts/game-main.js`: ~616 lines (main WordForge component)
- `scripts/game-init.js`: 3 lines (initialization)

**Benefits:**
- Clear separation of concerns
- Easy to find and edit specific functionality
- Better browser caching
- Reusable components across games
- Easier debugging and testing
- Consistent architecture across all games
- UTF-8 emoji encoding properly handled

## LuminaCore Module API

The core module (`shared/lumina-core.js`) provides:

### Profile Management
```javascript
LuminaCore.getActiveProfile()           // Returns current player's profile
LuminaCore.setActiveProfile(profileId)  // Switch between 'emma' or 'liam'
LuminaCore.getProfile(profileId)        // Get specific profile
LuminaCore.getAllProfiles()             // Get both profiles
LuminaCore.getActiveProfileKey()        // Get current player ID
```

### XP & Progression
```javascript
LuminaCore.addXP(playerId, amount, source)      // Add XP, auto-levels up
LuminaCore.calculateLevel(totalXP)              // Calculate level from XP
LuminaCore.getLevelTitle(level)                 // Get title like "Apprentice", "Keeper", etc.
LuminaCore.getXPForNextLevel(currentLevel)      // XP needed for next level
LuminaCore.getXPProgress()                      // Get current XP progress for active player
```

### Economy
```javascript
LuminaCore.addCoins(playerId, amount)       // Add coins
LuminaCore.spendCoins(playerId, amount)     // Spend coins (returns true/false)
LuminaCore.addRewardPoints(playerId, amount) // Add reward points
```

### Achievements
```javascript
LuminaCore.awardAchievement(playerId, achievementId)  // Grant achievement + bonus XP
LuminaCore.hasAchievement(playerId, achievementId)    // Check if earned
LuminaCore.getAchievements(playerId)                  // Get all earned achievements
LuminaCore.checkAchievement(playerId, achievementId)  // Check and award if eligible
```

### Game Stats
```javascript
LuminaCore.recordGameStart(playerId, gameId)        // Log game start
LuminaCore.recordGameEnd(playerId, gameId, stats)   // Log game end with stats
// stats = { score, gamesWon, highWave, wordsSpelled, etc. }

LuminaCore.getGameStats(playerId, gameId)           // Get stats for a game
```

### Rewards
```javascript
LuminaCore.getAvailableRewards()            // Get reward catalog
LuminaCore.claimReward(playerId, rewardId, pin) // Claim reward (requires PIN)
LuminaCore.verifyParentPIN(pin)             // Verify parent PIN
LuminaCore.getPendingRewards()              // Get pending rewards
```

### Events
```javascript
LuminaCore.subscribe(callback)              // Listen for state changes
LuminaCore.unsubscribe(callback)            // Stop listening
```

### Streaks
```javascript
LuminaCore.updateStreak(playerId)           // Update daily play streak
```

### Family Quest
```javascript
LuminaCore.getFamilyQuest()                 // Get current family quest
LuminaCore.startFamilyQuest(goal, reward, days) // Start new quest
LuminaCore.completeFamilyQuest()            // Complete active quest
```

### Leaderboard
```javascript
LuminaCore.getLeaderboard(category)         // Get sorted leaderboard
// category: 'totalXP', 'lifetimeCoins', 'rewardPoints', etc.
```

## Data Structure (localStorage)

```javascript
{
  version: "1.0.0",
  currentPlayer: "emma",
  profiles: {
    emma: {
      name: "Emma",
      role: "The Sage",
      avatar: "./assets/Emma_Lumina.png",
      totalXP: 0,
      level: 1,
      title: "Apprentice",
      currentCoins: 0,
      lifetimeCoins: 0,
      rewardPoints: 0,
      lastPlayed: null,
      lastPlayedGame: null,
      streakDays: 0,
      streakLastDate: null,
      totalPlayTimeMinutes: 0,
      achievements: [],
      gameStats: {
        spellSiege: { highScore: 0, highWave: 0, gamesPlayed: 0, ... },
        canadaAdventure: { highScore: 0, gamesPlayed: 0, ... },
        luminaRacer: { bestTime: null, gamesPlayed: 0, ... },
        wordForge: { highScore: 0, itemsCrafted: 0, ... }
      },
      createdAt: "2026-01-22T..."
    },
    liam: { /* similar structure */ }
  },
  familyQuest: {
    active: false,
    goal: 500,
    current: 0,
    reward: "Pizza Night Pick",
    startDate: null,
    endDate: null,
    contributions: { emma: 0, liam: 0 }
  },
  claimedRewards: [],
  pendingRewards: [],
  settings: {
    showLeaderboard: true,
    soundEnabled: true,
    parentPIN: "1234"
  },
  lastUpdated: "2026-01-22T..."
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

---

# PART 3: LEVEL SYSTEM

## XP Requirements
- **Progressive System:** Each level requires more XP than the last
- **Max Level:** 12 (Transcendent)
- **Level Titles:** 12 unique titles from Apprentice to Transcendent

## Level Titles

| Level | Title | Min XP Required |
|-------|-------|-----------------|
| 1 | Apprentice | 0 |
| 2 | Seeker | 100 |
| 3 | Scholar | 300 |
| 4 | Adept | 600 |
| 5 | Keeper | 1,000 |
| 6 | Guardian | 1,500 |
| 7 | Champion | 2,200 |
| 8 | Hero | 3,000 |
| 9 | Legend | 4,000 |
| 10 | Archmage | 5,500 |
| 11 | Mythic | 7,500 |
| 12 | Transcendent | 10,000 |

---

# PART 4: REWARDS SYSTEM

## Reward Catalog

| ID | Name | Cost | Icon | Category |
|----|------|------|------|----------|
| game_15 | 99 Nights (15 min) | 100 pts | 🎮 | gaming |
| game_30 | 99 Nights (30 min) | 200 pts | 🎮 | gaming |
| game_60 | 99 Nights (1 hour) | 350 pts | 🎮 | gaming |
| movie_pick | Pick Movie Night | 250 pts | 🎬 | family |
| dinner_pick | Pick Dinner | 300 pts | 🍕 | family |
| stay_up_30 | Stay Up 30 min Late | 350 pts | 🌙 | privilege |
| treat | Special Treat | 150 pts | 🍦 | treat |
| skip_chore | Skip One Chore | 400 pts | ✨ | privilege |
| friend_playdate | Friend Playdate | 500 pts | 👫 | social |

## Parent PIN
- Default PIN: `1234`
- Required for: reward claims, profile resets, data operations
- Can be changed via `LuminaCore.changeParentPIN(oldPIN, newPIN)`

---

# PART 5: ACHIEVEMENTS

## General Achievements

| ID | Name | Description | XP Bonus |
|----|------|-------------|----------|
| first_game | First Steps | Play your first game | 10 |
| streak_3 | On Fire | 3 day play streak | 25 |
| streak_7 | Dedicated | 7 day play streak | 50 |
| streak_14 | Unstoppable | 14 day play streak | 100 |
| level_5 | Rising Star | Reach level 5 | 50 |
| level_10 | Archmage | Reach level 10 | 100 |
| coins_500 | Coin Collector | Earn 500 lifetime coins | 25 |
| coins_2000 | Treasure Hunter | Earn 2000 lifetime coins | 75 |

## Game-Specific Achievements

### Spell Siege
| ID | Name | Description | XP Bonus |
|----|------|-------------|----------|
| ss_first_win | Castle Defender | Win a game of Spell Siege | 15 |
| ss_wave_10 | Wave Master | Reach wave 10 | 30 |
| ss_words_100 | Spell Slinger | Spell 100 words | 40 |
| ss_perfect_wave | Flawless | Complete a wave with no mistakes | 20 |

### Canada Adventure
| ID | Name | Description | XP Bonus |
|----|------|-------------|----------|
| ca_first_battle | Brave Explorer | Win your first battle | 15 |
| ca_all_regions | True Canadian | Unlock all 7 regions | 75 |
| ca_combo_5 | Combo King | Get a 5x combo | 25 |
| ca_questions_50 | Knowledge Seeker | Answer 50 questions correctly | 35 |

### Word Forge
| ID | Name | Description | XP Bonus |
|----|------|-------------|----------|
| wf_first_craft | Apprentice Smith | Craft your first item | 15 |
| wf_legendary | Master Forger | Craft a legendary item | 50 |
| wf_collection_10 | Collector | Collect 10 different items | 30 |

### Lumina Racer
| ID | Name | Description | XP Bonus |
|----|------|-------------|----------|
| lr_first_race | Speed Demon | Complete your first race | 15 |
| lr_win_5 | Racing Champion | Win 5 races | 40 |

## Secret Achievements

| ID | Name | Description | XP Bonus |
|----|------|-------------|----------|
| secret_night | Night Owl | Play after 8 PM | 10 |
| secret_weekend | Weekend Warrior | Play on Saturday and Sunday | 15 |

---

# PART 6: GAME INTEGRATION GUIDE

## How to Connect a Game to LuminaCore

### Step 1: Add Script Tag
```html
<script src="../shared/lumina-core.js"></script>
```

### Step 2: Get Player on Game Start
```javascript
const [playerProfile, setPlayerProfile] = useState(null);
const [playerName, setPlayerName] = useState('');

useEffect(() => {
  if (typeof LuminaCore !== 'undefined') {
    const profile = LuminaCore.getActiveProfile();
    if (profile) {
      setPlayerProfile(profile);
      setPlayerName(profile.name);
      console.log('🎮 Game: Playing as', profile.name);
      LuminaCore.recordGameStart(profile.id, 'gameId');
    }
  }
}, []);
```

### Step 3: Award XP/Coins on Game Events
```javascript
if (playerProfile) {
  const xpEarned = 50;
  const coinsEarned = 25;
  const rewardPointsEarned = 5;
  
  LuminaCore.addXP(playerProfile.id, xpEarned, 'gameId');
  LuminaCore.addCoins(playerProfile.id, coinsEarned, 'gameId');
  LuminaCore.addRewardPoints(playerProfile.id, rewardPointsEarned);
}
```

### Step 4: Record Session on Game End
```javascript
LuminaCore.recordGameEnd(playerProfile.id, 'gameId', {
  score: totalScore,
  gamesWon: won ? 1 : 0,
  // Add any custom stats specific to your game
  customStat1: value1,
  customStat2: value2
});
```

### Step 5: Award Achievements
```javascript
// Check and award achievements
LuminaCore.checkAchievement(playerProfile.id, 'game_first_win');
if (level >= 10) {
  LuminaCore.checkAchievement(playerProfile.id, 'game_level_10');
}
```

### Step 6: Add "Return to Noyola Hub" Button
```javascript
{playerProfile && (
  <a
    href="../index.html"
    className="text-purple-400 hover:text-purple-300"
  >
    🏠 Return to Noyola Hub
  </a>
)}
```

---

# PART 7: HUB UI DESIGN

## Visual Theme
- **Primary Colors:** Purple gradients (#667eea → #764ba2)
- **Accent:** Gold/amber (#fbbf24, #f59e0b)
- **Background:** Dark purple (#1a1a2e, #16213e)
- **Fonts:** Fredoka (display), Quicksand (body)
- **Two Themes:** Fantasy (default) and Gaming

## Layout
```
┌──────────────────────────────────────────────────────────┐
│  🎮 NOYOLA HUB                        [Theme Toggle] 👤  │
├──────────────────────────────────────────────────────────┤
│  [Avatar] Player Name  Lv.X  [XP Bar]  💰 🏆 🔥         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────┐  ┌─────────────────────────┐  │
│  │    GAMES GRID        │  │    LEADERBOARD         │  │
│  │                      │  ├─────────────────────────┤  │
│  │  [Spell Siege]       │  │    FAMILY QUEST        │  │
│  │  [Canada Adventure]  │  ├─────────────────────────┤  │
│  │  [Lumina Racer]      │  │    REWARDS PREVIEW     │  │
│  │  [Word Forge]        │  └─────────────────────────┘  │
│  │  [+ More Coming]     │                               │
│  └──────────────────────┘                               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Modals
1. **Profile Selection** - Choose Emma or Liam on first load
2. **Rewards Modal** - Full reward catalog with claim buttons
3. **PIN Entry** - 4-digit parent approval for rewards
4. **Toast Notifications** - Success/error messages

---

# PART 8: GAMES CATALOG

## Fully Integrated Games ✅

| Game | ID | Description | Status |
|------|----|-------------|--------|
| Spell Siege | spell-siege | Tower defense spelling game | ✅ Fully Refactored |
| Canada Adventure | canada-adventure | Geography RPG for Canada | ✅ Fully Refactored |
| Lumina Racer | lumina-racer | Typing racing game | ✅ Fully Refactored |
| Word Forge | word-forge | Blacksmith word crafting | ✅ Fully Refactored |

## Coming Soon

| Game | ID | Description |
|------|----|-------------|
| Shadows in the Halls | shadows-halls | Mystery survival adventure |
| World of Lumina | world-lumina | Full Lumina RPG (main story) |

---

# PART 9: RECENT UPDATES & CHANGES

## January 22, 2026 - Major Refactoring Complete ✅

### Hub Updates
- ✅ Renamed "Lumina Hub" to "Noyola Hub" throughout project
- ✅ Fixed property name mismatches in `hub-ui.js`:
  - `profile.coins` → `profile.currentCoins`
  - `profile.streak.current` → `profile.streakDays`
  - `player.totalXp` → `player.totalXP`
  - `player.achievements` → `player.achievementCount`
  - `quest.target` → `quest.goal`

### Game Refactoring
All 4 main games fully refactored with:
- ✅ Modular architecture (CSS/JS separation)
- ✅ LuminaCore integration (XP, coins, achievements)
- ✅ Proper UTF-8 emoji encoding
- ✅ "Return to Noyola Hub" buttons
- ✅ Consistent file structure across all games

### Known Issues Resolved
- ✅ Emoji corruption in PowerShell (resolved by using write tool with UTF-8 encoding)
- ✅ Property name mismatches between hub-ui.js and lumina-core.js
- ✅ Music playback in Spell Siege (fixed track key names)
- ✅ AudioManager scope in React components

---

# PART 10: TROUBLESHOOTING & BEST PRACTICES

## Emoji Encoding Issues

**Problem:** Emojis appear corrupted when extracted using PowerShell  
**Solution:** Always use the `write` tool with explicit UTF-8 encoding, never rely on PowerShell file operations for files with emojis

**Best Practice:**
```javascript
// When extracting JS files with emojis:
// 1. Use the write tool directly
// 2. Copy emoji characters from a known-good source
// 3. Verify emojis in the browser, not PowerShell terminal
```

## Common Integration Issues

1. **"LuminaCore is not defined"**
   - Ensure `<script src="../shared/lumina-core.js"></script>` loads BEFORE game scripts
   
2. **Profile not loading**
   - Check `LuminaCore.getActiveProfile()` returns a valid profile
   - Use conditional rendering: `{playerProfile && ...}`

3. **XP/Coins not updating**
   - Verify `playerProfile.id` is being passed to all LuminaCore methods
   - Check browser console for errors

4. **Property access errors**
   - Always verify property names match the actual data structure
   - Use browser DevTools to inspect `localStorage.getItem('lumina_game_data')`

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
- Deployed on Vercel (static site, no server functions)
- localStorage for persistence (Supabase/Firebase planned for future)
- iPad Safari compatible (primary device)
- Works offline once loaded (localStorage is client-side)
- GitHub → Vercel auto-deploy pipeline

---

# END OF REFERENCE GUIDE

**Deployment Workflow:**
1. Make changes locally in `C:\Users\mnoyo\OneDrive\Documents\Personal\AI\games\kid-games`
2. Commit: `git add .` → `git commit -m "message"`
3. Push: `git push origin main`
4. Vercel auto-deploys to https://kid-games-one.vercel.app/

**Quick Commands:**
```bash
cd "C:\Users\mnoyo\OneDrive\Documents\Personal\AI\games\kid-games"
git status
git add .
git commit -m "Your message"
git push origin main
```

*To continue this project in a new chat, share this file (noyola-hub-reference-guide.md) along with lumina-core.js and index.html.*
