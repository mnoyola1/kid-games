# 🏫 Shadows in the Halls - Phase 1 MVP

**Status:** ✅ Core Implementation Complete  
**Version:** 1.0.0 - Phase 1 MVP  
**Educational:** Math & Spelling Puzzles  
**Target Audience:** Emma (10, 5th grade) & Liam (8, 3rd grade)

---

## 🎮 What's Been Built

### ✅ Core Game Files
- **index.html** - Clean entry point with script loading order
- **game-config.js** - Puzzles, constants, enemy types, items
- **game-components.js** - HUD, modals, game over/victory screens
- **game-main.js** - Complete game logic with all systems
- **game-init.js** - React initialization
- **game-base.css** - Dark theme styling & animations

### ✅ Game Systems Implemented
1. **Player Movement** - WASD controls with walking/running
2. **Battery/Flashlight System** - Drains continuously, affects visibility
3. **5x5 Room Grid** - Procedurally spawned with items and enemies
4. **Door System** - Locked/unlocked, puzzle-gated doors
5. **Enemy Patrol AI** - Lurker enemies with patrol routes
6. **Collision Detection** - Player vs enemies, player vs items
7. **Math Puzzle System** - 20+ puzzles (grades 3-5)
8. **Word Puzzle System** - 10 unscramble puzzles
9. **Pattern Puzzles** - Sequence completion
10. **Win Condition** - Reach exit room to escape
11. **Lose Conditions** - Battery dies OR caught by shadow
12. **LuminaCore Integration** - Full XP, coins, achievements

### ✅ UI Components
- **Game HUD** - Battery meter, HP, inventory, stats
- **Puzzle Modal** - Interactive puzzle solving interface
- **Title Screen** - Start run with instructions
- **Game Over Screen** - Stats display with memory fragments
- **Victory Screen** - Rewards earned display
- **Pause Menu** - ESC key functionality

### ✅ Hub Integration
- **Registered** in `hub-config.js` with proper metadata
- **4 Achievements** added to `lumina-core.js`:
  - 🚪 First Escape (50 XP)
  - 🧩 Puzzle Master (100 XP)
  - 🗺️ Thorough Explorer (75 XP)
  - 🔋 Battery Master (50 XP)

---

## 📋 What Still Needs Assets

### Images (Need to Generate)
Run the commands in `ASSET_GENERATION_COMMANDS.md`:

**Priority Sprites:**
- `player.png` - Top-down kid with flashlight
- `shadow_lurker.png` - Purple shadow creature
- `shadow_chaser.png` - Fast red-eyed shadow
- `battery_icon.png` - Yellow battery
- `key_red.png`, `key_blue.png` - Colored keys
- `exit_sign.png` - Green exit sign

**Priority Backgrounds:**
- `hallway_dark.png` - Dark school hallway
- `classroom.png` - Nighttime classroom
- `safe_room.png` - Golden safe haven
- `menu_bg.png` - Title screen background

### Audio (Need to Generate)
**SFX:**
- footstep.mp3, door_unlock.mp3, battery_pickup.mp3
- puzzle_solve.mp3, shadow_growl.mp3
- flashlight_dying.mp3, caught.mp3

**Voice Lines:**
- battery_low.mp3 ("Battery low!")
- puzzle_correct.mp3 ("Correct!")
- escape_found.mp3 ("Exit found!")

**Music (Manual - See `music/PROMPTS.md`):**
- menu.wav, exploration.wav, chase.wav
- escape.wav, gameover.wav

---

## 🚀 How to Play

1. **Open** `shadows-in-the-halls/index.html` in browser
2. **Select Profile** - Emma, Liam, or Guest
3. **Start Run** - Click "Start Run" button
4. **Move** - WASD keys (Hold Shift to run)
5. **Explore** - Find batteries, avoid shadows
6. **Solve Puzzles** - Unlock doors with correct answers
7. **Escape** - Find the exit before battery dies!

---

## 🎯 Gameplay Loop

```
1. Spawn in center safe room (2,2) with 100% battery
2. Explore rooms, collect batteries (+60% each)
3. Encounter locked doors → solve puzzles to unlock
4. Avoid shadow creatures patrolling rooms
5. Battery drains 1%/sec (2%/sec when running)
6. Find exit room at edge of map
7. Escape = Victory + Rewards!
8. Battery dies OR caught = Game Over
```

---

## 📊 Reward System

### Per Puzzle Solved
- **Easy** (Grade 3): 15 XP, 2 coins
- **Medium** (Grade 4): 25 XP, 3 coins
- **Hard** (Grade 5): 40 XP, 5 coins

### On Successful Escape
- **Base Bonus**: 100 XP
- **Puzzle Bonus**: +10 XP per puzzle solved
- **Coins**: 20 coins
- **Reward Points**: 10 points

### Memory Fragments (Meta Currency)
- Rooms Explored × 5
- Puzzles Solved × 10
- Escaped: +50 bonus

---

## 🎨 Visual Theme

**Color Palette:**
- Deep blacks (#0a0a0a) and dark grays (#1a1a1a)
- Pale blue moonlight (#5eb3d6) for safe areas
- Warm yellow (#f4d03f) for flashlight
- Purple/black (#4a148c) for shadows
- Red (#c62828) for danger/low battery
- Cyan (#00bcd4) for UI elements

**Atmosphere:**
- Kid-friendly horror (Little Nightmares meets Don't Starve)
- Atmospheric tension, not jump scares
- Top-down 2D view (classic Zelda style)

---

## 🐛 Known Limitations (Phase 1 MVP)

1. **No sprites** - Using emojis as placeholders
2. **No audio** - Music/SFX not implemented yet
3. **Simple enemy AI** - Patrol-only, no chase behavior
4. **Basic procedural gen** - Random placement, not optimized
5. **No touch controls** - Keyboard only (iPad needs virtual buttons)
6. **No meta-progression shop** - Planned for Phase 2

---

## 📝 Next Steps (Phase 2)

- [ ] Generate all sprite & background assets
- [ ] Add audio system with music & SFX
- [ ] Implement chaser enemy type
- [ ] Add touch controls for iPad
- [ ] Create meta-progression upgrade shop
- [ ] Add more room variety
- [ ] Improve procedural generation
- [ ] Add story notes/collectible lore
- [ ] Balance difficulty based on playtesting

---

## 🔧 For Developers

### File Structure
```
shadows-in-the-halls/
├── index.html (clean entry)
├── styles/
│   └── game-base.css (dark theme)
├── scripts/
│   ├── game-config.js (data)
│   ├── game-components.js (UI)
│   ├── game-main.js (logic)
│   └── game-init.js (init)
└── ASSET_GENERATION_COMMANDS.md
```

### Key Constants (game-config.js)
- `BATTERY_DRAIN_RATE = 1` (1%/sec = 100 seconds)
- `PLAYER_WALK_SPEED = 100` pixels/sec
- `GRID_SIZE = 5` (5×5 rooms)
- `LIGHT_RADIUS_NORMAL = 150` pixels

### LuminaCore Integration
```javascript
GAME_ID = 'shadows-in-the-halls'
recordGameStart(profileId, GAME_ID)
recordGameEnd(profileId, GAME_ID, stats)
addXP(), addCoins(), addRewardPoints()
checkAchievement()
```

---

## ✅ Definition of Done for Phase 1

- [x] Player can complete a full run
- [x] Movement system working (WASD + running)
- [x] Battery drains and affects gameplay
- [x] At least 20 math & 10 word puzzles
- [x] Enemy patrol AI implemented
- [x] Collision detection working
- [x] Win/lose conditions functional
- [x] LuminaCore integration complete
- [x] Registered in hub with achievements
- [x] Game over & victory screens
- [x] Pause functionality

**Ready for Asset Generation & Playtesting!** 🎉

---

## 📞 Support

For questions or issues:
- Check `SHADOWS_IN_THE_HALLS_CURSOR_BRIEF.md` for full spec
- Review `noyola-hub-reference-guide.md` for architecture
- See `ASSET_GENERATION_COMMANDS.md` for asset creation

**Game designed for Emma & Liam by Dad** ❤️
