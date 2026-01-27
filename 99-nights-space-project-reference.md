# 99 NIGHTS IN SPACE - Project Reference Document
## Web-Based Survival Horror Game for Noyola Hub
### Created: January 26, 2025 | Updated: January 27, 2025

---

# QUICK START FOR NEW CHAT

**What is this?**
A web-based 3D survival horror game inspired by "99 Nights in the Forest" (Roblox), but set in space. Part of the Noyola Hub game ecosystem for Emma (10) and Liam (8).

**Key Requirements:**
- 3D graphics similar to 99 Nights in the Forest (NOT pixel art)
- Single-player now, multiplayer support planned (family can play together)
- Deployable to web (integrated with Noyola Hub on Vercel)
- Built using Cursor + Claude workflow

**Project Status:** ✅ **PLAYABLE PROTOTYPE** - Core mechanics implemented

---

# CURRENT BUILD (v0.1.0)

## What's Working Now

| Feature | Status | Description |
|---------|--------|-------------|
| 3D Environment | ✅ | 3 connected rooms with sci-fi textures |
| Player Movement | ✅ | WASD controls, astronaut model |
| Camera | ✅ | Fixed 3rd-person, wall fading |
| LSG (Life Support) | ✅ | Fuel management, E to refuel |
| Power Cycles | ✅ | Day/Night (Lights On/Off), 99 cycles |
| The Phantom | ✅ | Alien enemy hunts during night |
| Resources | ✅ | Scrap, circuits, fuel cells |
| Pickups | ✅ | Floating collectibles auto-pickup |
| Chests | ✅ | Collision, E to open, loot drops |
| Audio | ✅ | Procedural ambient + SFX |
| HUD | ✅ | Full status display |
| Mobile | ✅ | Touch controls |

## How to Play
1. Navigate to `/99-nights-in-space/index.html`
2. Use WASD to move, mouse to look around
3. Collect resources (scrap, circuits, fuel cells)
4. Find chests (E to open) for loot
5. Stay near LSG during "Lights Off" phase
6. Refuel LSG with fuel cells (E when near with cells)
7. Survive 99 cycles!

---

# PART 1: SOURCE INSPIRATION

## 99 Nights in the Forest (Roblox Game)

### Core Mechanics
- **Survival gameplay**: Survive 99 days/nights
- **Base defense**: Maintain campfire (core survival mechanic)
- **Enemy threat**: "The Deer" - primary antagonist that hunts at night
- **Rescue mission**: Find and rescue 4 missing children
- **Combat**: Fight cultists and hostile creatures
- **Exploration**: Multiple biomes (forest, snow, volcano)
- **Multiplayer**: 1-5 players, difficulty scales with team size
- **Progression**: Classes, animal taming, base building

### Visual Style
- Full 3D with third-person camera
- Atmospheric lighting, fog, dynamic shadows
- Large explorable terrain
- Day/night cycle with dramatic lighting changes
- Horror atmosphere (spooky but not gory - kid-appropriate)

### Success Metrics
- Built in 3 months
- Reached 14M peak concurrent users
- Developer: Grandma's Favourite Games

---

# PART 2: SPACE TRANSLATION CONCEPT

## "99 Nights in Space" - Mechanic Mapping

| Forest Original | Space Equivalent | Notes |
|-----------------|------------------|-------|
| Campfire | Oxygen generator / Life support | Must keep powered or die |
| The Deer | Alien entity / Corrupted astronaut | Primary threat during "dark shifts" |
| Forest biome | Space station / Asteroid base | Starting area |
| Snow biome | Zero-G sector | Different movement mechanics |
| Volcano biome | Infested sector | High danger, high reward |
| Missing children | Missing crew members | 4 to rescue |
| Cultists | Space cultists / Corrupted survivors | Secondary enemies |
| Day/night | Shift rotations / Power cycles | "Light shift" vs "Dark shift" |
| Wood/resources | Scrap metal, power cells, oxygen canisters | Gathering loop |
| Animal taming | Robot companions? | Optional feature |

## Thematic Elements
- Isolation and claustrophobia of space
- Oxygen as constant pressure (replaces warmth/fire)
- Alien threat that hunts during power outages
- Mystery: What happened to the station? Where is the crew?
- Escape goal: Survive 99 shifts until rescue arrives

---

# PART 3: TECHNICAL STACK DECISION

## Recommended Stack

| Component | Choice | Reasoning |
|-----------|--------|-----------|
| **3D Engine** | **Babylon.js** | Full game engine (not just renderer), built-in physics, collision detection, animation system, great documentation, Claude/Cursor knows it well |
| **Multiplayer** | **Colyseus** | Node.js game server, designed for real-time games, automatic state synchronization, matchmaking, free & open source |
| **Client Hosting** | Vercel | Already using for Noyola Hub, static files |
| **Server Hosting** | Railway or Render | Free tier sufficient for family use, easy Node.js deployment |
| **3D Assets** | Sketchfab, Quaternius, Mixamo | Free/cheap sci-fi assets available |

## Why Babylon.js Over Alternatives

| Engine | Verdict | Notes |
|--------|---------|-------|
| **Babylon.js** | ✅ RECOMMENDED | Full game engine, built-in physics, great docs, Microsoft-backed |
| Three.js | ❌ | Rendering library only - need to build game systems yourself |
| PlayCanvas | 🟡 Maybe | Cloud-based editor, good but less Claude familiarity |
| A-Frame | ❌ | VR-focused, too simple for this project |
| Phaser | ❌ | 2D only |

## Why Colyseus for Multiplayer

- Open source, MIT license
- Node.js based (JavaScript - same ecosystem)
- Built-in state synchronization (delta compression)
- Room-based architecture (perfect for family sessions)
- Authoritative server (prevents cheating)
- Well-documented, active community
- Free self-hosting, or Colyseus Cloud for managed hosting

---

# PART 4: ARCHITECTURE

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    NOYOLA HUB                           │
│  (Vercel - existing infrastructure)                     │
│                                                         │
│   index.html ─► Games Grid ─► 99 Nights in Space       │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │           99 NIGHTS IN SPACE CLIENT             │   │
│   │              (Babylon.js)                       │   │
│   │                                                 │   │
│   │  • 3D rendering & scene management             │   │
│   │  • Player input handling                       │   │
│   │  • Third-person camera                         │   │
│   │  • UI overlay (HUD, menus)                     │   │
│   │  • Audio system                                │   │
│   │  • Local prediction (smooth movement)          │   │
│   └─────────────────────────────────────────────────┘   │
│                         │                               │
│                         │ WebSocket (Colyseus SDK)      │
│                         ▼                               │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              COLYSEUS GAME SERVER                       │
│        (Railway/Render - $0-5/month)                    │
│                                                         │
│   • Authoritative game state                           │
│   • Player position synchronization                    │
│   • Enemy AI logic (server-side)                       │
│   • Oxygen/resource management                         │
│   • Day/night (shift) cycle                            │
│   • Room management (lobby, game sessions)             │
│   • Collision detection (server validation)            │
└─────────────────────────────────────────────────────────┘
```

## File Structure (Current Implementation)

```
kid-games/
├── index.html                      # Noyola Hub main page
├── service-worker.js               # Offline caching (includes 99 Nights assets)
│
├── shared/
│   ├── lumina-core.js              # Progression system (XP, coins)
│   └── scripts/
│       └── hub-config.js           # Game registration (99 Nights listed)
│
├── 99-nights-in-space/
│   ├── index.html                  # Game entry point with HUD
│   ├── styles/
│   │   └── game-base.css           # All game styling
│   └── scripts/
│       ├── game-config.js          # Constants: cycle times, resources, audio
│       ├── game-main.js            # Core game (1400+ lines):
│       │   │                       # - Babylon.js scene setup
│       │   │                       # - Player controller
│       │   │                       # - Environment creation
│       │   │                       # - LSG system
│       │   │                       # - Phantom AI
│       │   │                       # - Resource/pickup systems
│       │   │                       # - Chest interaction
│       │   │                       # - Audio (Web Audio API)
│       │   │                       # - Input handling
│       │   │                       # - HUD updates
│       └── game-init.js            # Entry point
│
├── assets/models/99-nights-in-space/
│   ├── kenney-space-kit/
│   │   └── Models/OBJ format/
│   │       ├── astronautA.obj      # Player model
│   │       ├── alien.obj           # Fallback enemy
│   │       └── (various props)
│   │
│   └── quaternius-sci-fi/megakit/Modular SciFi MegaKit[Standard]/glTF/
│       ├── Platforms/
│       │   ├── Platform_Metal.gltf # Floor tiles
│       │   └── *.png               # PBR textures
│       ├── Props/
│       │   ├── Prop_Chest.gltf     # Interactable chests
│       │   ├── Prop_AccessPoint.gltf # LSG model
│       │   └── *.png
│       ├── Aliens/
│       │   ├── Alien_Cyclop.gltf   # Phantom enemy
│       │   └── *.png
│       └── Walls/
│           ├── DoorFrame_01.gltf   # Door frames
│           ├── T_Trim_01_*.png     # Wall textures
│           └── T_Trim_02_*.png     # Floor textures

└── (future: server/ for Colyseus multiplayer)
```

---

# PART 5: DEVELOPMENT PHASES

## Phase 1: Single Player Prototype ✅ COMPLETE
**Goal:** Prove core gameplay works before adding multiplayer complexity

### Deliverables
- [x] 3D space station with multiple rooms
- [x] Third-person player movement (WASD + mouse look)
- [x] LSG fuel system (depletes over time, refill with E key)
- [x] Power cycle (Lights On/Off phases with timer)
- [x] The Phantom enemy with hunt AI during night
- [x] Death/game over state
- [x] Full HUD (fuel, health, cycle, resources, status)
- [x] Interactable chests with collision and loot
- [x] Resource pickups (scrap, circuits, fuel cells)
- [x] Procedural audio (ambient + SFX)
- [x] Mobile touch controls
- [x] Camera wall fading system

### Technical Achievements
- Babylon.js with glTF model loading
- ArcRotateCamera with fixed zoom
- Raycasting for wall occlusion
- Web Audio API for procedural sound
- Unified interaction system (E key)

---

## Phase 2: Expand Single Player (In Progress)
**Goal:** Make it feel like a real game

### Completed
- [x] Multiple connected rooms with corridors
- [x] Three resource types with different uses
- [x] Chest interaction with opening animation
- [x] PBR textured environment (Quaternius)

### Remaining
- [ ] Full crafting system with workbench
- [ ] Crew member rescue mission
- [ ] Additional enemy types (Void Hounds, etc.)
- [ ] Flashlight mechanic
- [ ] Fear system with visual effects
- [ ] More sectors to explore

### Technical Focus
- Crafting UI and recipes
- NPC escort mechanics
- Enemy variety and spawning

---

## Phase 3: Add Multiplayer (Planned)
**Goal:** Family can play together

### Deliverables
- [ ] Colyseus server setup and deployment
- [ ] Player synchronization (positions, actions)
- [ ] Lobby system (create/join room)
- [ ] Shared game state (LSG, enemies, resources)
- [ ] Player scaling (1-4 players)
- [ ] Revive mechanics

### Technical Focus
- Colyseus integration
- State synchronization
- Server deployment (Railway/Render)

---

## Phase 4: Polish & Features (Planned)
**Goal:** Feature parity with inspiration, unique identity

### Deliverables
- [ ] All 4 crew member rescues
- [ ] True ending sequence
- [ ] Classes and progression
- [ ] LuminaCore integration (XP, coins, achievements)
- [ ] Save/load system
- [ ] Full 99-cycle playthrough

### Technical Focus
- Content expansion
- Balance tuning
- Performance optimization

---

# PART 6: COMPLEXITY ASSESSMENT

## Comparison to Existing Projects

| Project | Complexity | Time to Build | Notes |
|---------|------------|---------------|-------|
| Canada Adventure (original) | Low | Days | Single-file React game |
| Canada Adventure (pixel) | Low-Medium | Days | Added pixel art sprites |
| Spell Siege | Medium | Week | Tower defense mechanics |
| Lumina Racer | Medium | Week | Racing game |
| **99 Nights in Space** | **High** | **Months** | Full 3D, multiplayer, AI |
| Shadows in the Halls | High | Months | Similar scope |

## Reality Check (Updated with Progress)

| Factor | Assessment |
|--------|------------|
| Is this feasible? | ✅ **PROVEN** - Playable prototype exists |
| Complexity vs current work | 🟡 Manageable with modular approach |
| Time to playable prototype | ✅ **DONE** - Core mechanics working |
| Time to "finished" game | 2-4 months remaining |
| Can Cursor + Claude help? | ✅ **PROVEN** - Built entire prototype |
| Will it match 99 Nights exactly? | 🟡 Getting closer with each iteration |
| Multiplayer adds complexity | 🔴 Still significant - future phase |

## Skills Learned During Development

- ✅ Babylon.js scene setup and rendering
- ✅ glTF/OBJ model loading and texturing
- ✅ ArcRotateCamera configuration
- ✅ Raycasting for visibility checks
- ✅ Web Audio API for procedural sound
- ✅ Touch control implementation
- ✅ Game state management
- ✅ Two-floor system (collision vs visual)
- 📋 WebSocket/Colyseus (planned)
- 📋 Authoritative server architecture (planned)

## IMPORTANT: Two-Floor Architecture

**This game uses TWO separate floor layers:**

| Floor Type | Technology | Y Position | Purpose |
|------------|-----------|------------|---------|
| Collision Floor | `CreateGround` | Y=0 | Invisible, handles physics |
| Visual Floor | `Platform_Metal.gltf` | Y=0.05+ | What player sees |

**Key Points:**
- The visual glTF floor tiles have thickness - their TOP SURFACE is around Y=0.4
- Player positioning (`GROUND_Y` constant) must be based on the VISUAL floor, not collision floor
- `GROUND_Y = 2.5` positions the player correctly on the visual floor
- If player appears to sink or float, adjust `GROUND_Y` - do NOT change based on collision floor

**Why This Matters:**
- Previous debugging spent significant time because player was positioned relative to collision floor (Y=0) instead of visual floor (Y=0.4+)
- Always reference the visual floor when adjusting player/NPC heights

---

# PART 7: RESOURCE LINKS

## Documentation
- **Babylon.js**: https://doc.babylonjs.com/
- **Babylon.js Playground**: https://playground.babylonjs.com/
- **Colyseus**: https://docs.colyseus.io/
- **Colyseus Examples**: https://github.com/colyseus/colyseus-examples

## Tutorials
- Babylon.js Getting Started: https://doc.babylonjs.com/journey/theFirstStep
- Babylon.js Game Tutorial: https://doc.babylonjs.com/guidedLearning/createAGame
- Colyseus + PlayCanvas Tutorial: https://developer.playcanvas.com/tutorials/real-time-multiplayer-colyseus/

## Free 3D Assets
- **Quaternius** (free low-poly): https://quaternius.com/
- **Kenney** (free game assets): https://kenney.nl/assets
- **Sketchfab** (free section): https://sketchfab.com/features/free-3d-models
- **Mixamo** (free characters + animations): https://www.mixamo.com/

## Hosting
- **Vercel** (client): https://vercel.com/
- **Railway** (server): https://railway.app/
- **Render** (server alternative): https://render.com/

---

# PART 8: NEXT STEPS

## Recommended Next Features (Priority Order)

1. **Crafting System** - Workbench UI, basic recipes for tools/barriers
2. **Flashlight Mechanic** - Limited battery, crucial during Lights Off
3. **More Enemy Types** - Void Hounds (pack hunters), Cargo Beasts (tanky)
4. **First Crew Rescue** - NPC escort mission in Sector 2
5. **Save/Load System** - Persist progress between sessions
6. **Additional Sectors** - Engineering, Research Labs

## Technical Debt to Address

1. Split `game-main.js` into separate system modules (it's 1400+ lines)
2. Add proper loading screen with progress bar
3. Implement pause menu with settings
4. Add minimap for navigation

## Questions for Future Development

1. Should multiplayer be authoritative server or P2P?
2. Add procedural level generation or hand-crafted maps?
3. Implement inventory UI or keep simple auto-collection?

---

# PART 9: INTEGRATION WITH NOYOLA HUB

## LuminaCore Connection Points

Once the game is playable, integrate with existing progression:

```javascript
// On game milestones
LuminaCore.addXP(100, 'space-nights');        // Survived a shift
LuminaCore.addXP(500, 'space-nights');        // Rescued crew member
LuminaCore.addCoins(50, 'space-nights');      // Per shift survived

// Achievements
LuminaCore.awardAchievement('sn_first_shift');    // Survive first shift
LuminaCore.awardAchievement('sn_first_rescue');   // Rescue first crew
LuminaCore.awardAchievement('sn_all_crew');       // Rescue all 4 crew
LuminaCore.awardAchievement('sn_night_99');       // Complete the game!

// Session tracking
LuminaCore.recordGameSession('space-nights', {
  shiftsCompleted: 15,
  crewRescued: 2,
  playersInSession: 3
});
```

---

# APPENDIX: ALTERNATIVE APPROACHES CONSIDERED

## Option A: Roblox Development (Rejected)
- **Pro**: Same platform as 99 Nights, established audience
- **Con**: Different tech stack (Lua), can't integrate with Noyola Hub, learning curve
- **Verdict**: User wants web-based, Hub integration

## Option B: 2D Top-Down Version (Simpler Alternative)
- **Pro**: Much faster to build, Phaser.js, existing skills transfer
- **Con**: Doesn't match 99 Nights visual style, less immersive
- **Verdict**: User specifically wants 3D like the original

## Option C: Unity/Unreal WebGL Export
- **Pro**: Professional game engines, more tutorials
- **Con**: Heavy downloads, slower iteration, overkill for scope
- **Verdict**: Babylon.js is lighter and web-native

---

# END OF REFERENCE DOCUMENT

**To continue this project:**
1. Start a new chat
2. Reference this document and `99-nights-in-space-game-design-spec.md`
3. The game is playable at `/99-nights-in-space/index.html`
4. Main code is in `/99-nights-in-space/scripts/game-main.js`

**Current Build:** v0.1.0 - Playable single-player prototype
**Last Updated:** January 27, 2025
