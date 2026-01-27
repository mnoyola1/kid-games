# 99 NIGHTS IN SPACE
## Complete Game Design Specification
### Version 2.1 | January 2025
### For Cursor AI Development

---

# QUICK REFERENCE

**Game Type:** Survival Crafting with Light Horror Elements (Web-based)
**Inspiration:** 99 Nights in the Forest (Roblox) - translated to space setting
**Target Platform:** Web (Babylon.js), integrated with Noyola Hub
**Players:** 1 (single-player prototype), future: 1-4 cooperative multiplayer
**Target Audience:** Family-friendly (Emma 10, Liam 8) - Coraline-level spooky
**Core Loop:** Day (explore/gather) → Night (defend base from enemies)
**Win Condition:** Survive 99 cycles, rescue 4 missing crew members

---

# IMPLEMENTATION STATUS (v0.1.0)

## Currently Implemented ✅
- **3D Engine**: Babylon.js with glTF model loading
- **Camera**: ArcRotateCamera with fixed zoom (6 units), wall fading system
- **Player**: Third-person astronaut (Kenney astronautA.obj) with WASD movement
- **Environment**: 3 connected rooms with corridors, textured walls/floors (Quaternius PBR)
- **LSG System**: Fuel management, refueling with E key, glowing indicator
- **Power Cycles**: Lights On/Off phases, 99-cycle progression
- **The Phantom**: Alien enemy (Quaternius Alien_Cyclop.gltf) hunts during Lights Off
- **Resources**: Scrap, circuits, fuel cells with pickup system
- **Chests**: Interactable chests with collision, opening animation, loot drops
- **Audio**: Procedural Web Audio API (ambient hum, SFX for pickups/refuel/damage)
- **HUD**: Cycle counter, fuel meter, health, resources, phase timer, status messages
- **Interaction System**: Unified E key for chests and LSG refueling
- **Mobile Support**: Touch controls with d-pad and action buttons

## In Progress 🟡
- Additional rooms and sectors
- More enemy types
- Full crafting system

## Planned 📋
- Multiplayer (Colyseus)
- Crew rescue missions
- Classes and progression
- Save/load system

---

# PART 1: CORE CONCEPT

## Setting Translation

| Forest Original | Space Equivalent |
|-----------------|------------------|
| Haunted Forest | Abandoned Space Station Complex |
| Campfire | Life Support Generator (LSG) |
| The Deer (Wendigo) | The Phantom (Corrupted Astronaut Entity) |
| Trees/Wood | Metal Scrap / Hull Plating |
| Stone/Ore | Minerals / Circuit Components |
| Bunnies | Space Hoppers (small alien creatures) |
| Wolves | Void Hounds (medium predators) |
| Bears | Cargo Beasts (large predators) |
| Cultists | Corrupted Crew / Station Cultists |
| Day/Night | Power Cycle (Lights On / Lights Off) |
| Forest Biomes | Station Sectors |
| Missing Children | Missing Crew Members (4 total) |

## Narrative Setup

The UNS Odyssey space station went dark 3 months ago. All 247 crew members vanished. You're part of the rescue team sent to investigate - but your shuttle crashed during docking. Now stranded in the station's wreckage, you must survive 99 power cycles until the next rescue window.

Something stalks the dark corridors. The station's emergency lights flicker on and off in 99 cycles. During "Lights On" you can explore safely. During "Lights Off," The Phantom hunts.

Four crew members survived and are hiding somewhere in the station. Find them, and you might just make it out alive.

---

# PART 2: CORE MECHANICS

## 2.1 Life Support Generator (LSG) - Central Mechanic

The LSG replaces the campfire as the core survival element.

### LSG Functions
- **Primary:** Keeps The Phantom at bay (won't enter lit areas)
- **Respawn Point:** Players respawn at LSG when killed
- **Healing Station:** Standing near LSG slowly regenerates health
- **Cooking/Processing:** Process raw materials and food
- **Safe Zone:** Only guaranteed safe area during Lights Off

### LSG Fuel Types
| Fuel | Duration | Source |
|------|----------|--------|
| Emergency Cells | 30 seconds | Starting supply, common chests |
| Standard Cells | 2 minutes | Crafting, structures |
| High-Capacity Cells | 5 minutes | Deep exploration, rare chests |
| Fusion Cores | 15 minutes | Boss rewards, legendary chests |

### LSG Upgrade Levels
| Level | Cost | Benefits |
|-------|------|----------|
| 1 | Starting | Basic function, small light radius |
| 2 | 20 scrap + 10 circuits | +25% light radius, unlocks Sector 2 |
| 3 | 40 scrap + 20 circuits + 5 alloy | +50% light radius, auto-fuel loader, unlocks Sector 3 |
| 4 | 80 scrap + 40 circuits + 15 alloy | +75% light radius, healing boost, unlocks Sector 4 |
| 5 | 150 scrap + 80 circuits + 30 alloy + 10 plasma | +100% radius, shield generator, unlocks Sector 5 |
| 6 | 300 scrap + 150 circuits + 60 alloy + 25 plasma | Maximum radius, auto-defense turret, unlocks all sectors |

**CRITICAL:** If LSG runs out of fuel → The Phantom immediately spawns and hunts all players

---

## 2.2 Power Cycle System (Day/Night)

### Cycle Structure
- **Lights On (Day):** 3-5 minutes real-time - Safe exploration period
- **Lights Off (Night):** 2-3 minutes real-time - Danger period, enemies active
- Total cycle: ~5-8 minutes
- 99 cycles to survive = approximately 8-13 hours total gameplay

### Cycle Progression
| Cycles | Difficulty | New Threats |
|--------|------------|-------------|
| 1-10 | Tutorial | The Phantom docile (Cycle 1 only), basic enemies |
| 11-25 | Early | The Phantom hunts, Void Hounds appear |
| 26-50 | Mid | Cargo Beasts, Corrupted Crew raids |
| 51-75 | Late | Station Anomalies, advanced enemies |
| 76-99 | Endgame | All threats maximum, environmental hazards |

### Cycle 1 Special Rules
- The Phantom spawns but does NOT attack
- Only stares at players from darkness
- Perfect time to explore freely and gather resources
- Sets up dread for future cycles

---

## 2.3 Resource Gathering

### Primary Resources

**Scrap Metal** (replaces Wood)
- Source: Dismantle furniture, break panels, salvage debris
- Tool: Plasma Cutter (basic) → Industrial Cutter → Heavy Cutter
- Uses: Construction, basic crafting, fuel

**Circuit Components** (replaces Stone/Ore)
- Source: Terminal salvage, control panels, mining deposits
- Tool: Multi-tool (basic) → Circuit Extractor → Advanced Extractor
- Uses: Electronics, upgrades, advanced crafting

**Alloy Plates** (mid-tier material)
- Source: Hull sections, heavy machinery, cargo containers
- Tool: Heavy Cutter required
- Uses: Armor, walls, advanced structures

**Plasma Crystals** (rare material)
- Source: Deep sectors, boss drops, legendary chests
- Uses: High-tier weapons, LSG upgrades, special items

### Food Resources

| Food | Source | Hunger Restored | Special |
|------|--------|-----------------|---------|
| Nutrient Paste | Dispensers, common chests | 20% | Always safe |
| Space Hopper Meat (raw) | Hunt Space Hoppers | 30% | -5 HP if raw |
| Space Hopper Meat (cooked) | Process at LSG | 40% | Safe |
| Void Hound Meat | Hunt Void Hounds | 50% | Requires cooking |
| Cargo Beast Meat | Hunt Cargo Beasts | 70% | Requires cooking |
| Hydroponic Vegetables | Grow in base | 25% | Renewable |
| Emergency Rations | Rare chests | 100% | Full restore |

**Food does NOT spoil** - stockpile freely

### Special Materials

| Material | Source | Use |
|----------|--------|-----|
| Void Hound Pelt | Hunting | Armor crafting, trading |
| Space Hopper Foot | Hunting | Medical supplies, trading |
| Corrupted Gems | Cultist enemies | Special crafting, trading |
| Station Tokens | Structures, chests | Shop purchases |
| Phantom Residue | Near Phantom encounters | Rare crafting ingredient |

---

## 2.4 Crafting System

### Workbench Levels

**Level 1 - Basic Workbench** (Starting)
- Basic Plasma Cutter
- Emergency Bed
- Barricade (temporary)
- Bandages (2 Space Hopper Foot + 2 Void Hound Pelt)

**Level 2 - Standard Workbench** (10 scrap + 5 circuits)
- Improved Tools
- Proper Bed (respawn point)
- Metal Barriers
- Flashlight
- Basic Armor

**Level 3 - Advanced Workbench** (25 scrap + 15 circuits + 5 alloy)
- Heavy Tools
- Automated Defenses
- Medium Armor
- Ranged Weapons (Stun Pistol)

**Level 4 - Engineering Station** (50 scrap + 30 circuits + 15 alloy + 5 plasma)
- Elite Tools
- Advanced Turrets
- Heavy Armor
- Advanced Weapons (Plasma Rifle)

**Level 5 - Master Fabricator** (100 scrap + 60 circuits + 30 alloy + 15 plasma)
- Legendary recipes
- Shield generators
- Specialized equipment

### Key Recipes

**Medical**
- Bandage: 2 Space Hopper Foot + 2 Void Hound Pelt (crafted at Anvil equivalent)
- Medkit: 5 Bandages + 10 circuits
- Auto-Injector: 1 Medkit + 20 circuits + 5 plasma

**Tools**
- Plasma Cutter Mk2: 15 scrap + 10 circuits
- Circuit Extractor: 20 scrap + 15 circuits
- Heavy Cutter: 30 scrap + 20 circuits + 10 alloy

**Weapons**
- Stun Baton: 10 scrap + 5 circuits
- Stun Pistol: 25 scrap + 15 circuits
- Plasma Rifle: 40 scrap + 30 circuits + 10 alloy
- Laser Cannon: 80 scrap + 50 circuits + 25 alloy + 10 plasma

**Defense**
- Metal Barrier: 10 scrap
- Reinforced Wall: 25 scrap + 5 alloy
- Auto-Turret: 50 scrap + 30 circuits + 15 alloy
- Shield Projector: 100 scrap + 60 circuits + 30 alloy + 20 plasma

---

## 2.5 Exploration & Structures

### Station Sectors (Biomes)

**Sector 1: Docking Bay** (Starting Area)
- Difficulty: Easy
- Resources: Basic scrap, emergency supplies
- Enemies: Space Hoppers only
- Structures: Crashed shuttles, cargo containers, small storage
- LSG Level Required: 1

**Sector 2: Crew Quarters**
- Difficulty: Easy-Medium
- Resources: Food, circuits, personal items
- Enemies: Space Hoppers, occasional Void Hound
- Structures: Dormitories, mess halls, recreation areas, bathrooms
- LSG Level Required: 2

**Sector 3: Engineering**
- Difficulty: Medium
- Resources: High-quality scrap, alloy, tools
- Enemies: Void Hounds, Corrupted Crew
- Structures: Workshops, generator rooms, maintenance tunnels
- LSG Level Required: 3

**Sector 4: Research Labs**
- Difficulty: Medium-Hard
- Resources: Circuits, plasma crystals, rare materials
- Enemies: All types, anomalies
- Structures: Laboratories, containment cells, observation decks
- LSG Level Required: 4

**Sector 5: Command Deck**
- Difficulty: Hard
- Resources: High-tier everything, legendary items
- Enemies: All types + Station Cultists
- Structures: Bridge, captain's quarters, armory
- LSG Level Required: 5

**Sector 6: The Dark Zone** (Endgame)
- Difficulty: Extreme
- Resources: Plasma crystals, legendary gear
- Enemies: Maximum threat, The Phantom more aggressive
- Structures: Cultist Stronghold, hidden areas
- LSG Level Required: 6

### Structure Types & Loot

**Small Storage Room**
- Loot: Common Chest, basic supplies
- Frequency: Very common

**Crew Cabin**
- Loot: Common/Good Chest, personal items, food
- Frequency: Common

**Maintenance Closet**
- Loot: Tools, fuel cells, scrap
- Frequency: Common

**Medical Bay**
- Loot: Good/Iron Chest, medical supplies
- Frequency: Uncommon

**Armory**
- Loot: Iron/Legendary Chest, weapons, armor
- Frequency: Rare

**Engineering Hub**
- Loot: Legendary Chest, advanced materials
- Frequency: Rare

**Captain's Cache**
- Loot: Gold Chest, high-tier gear
- Frequency: Very Rare

**Cultist Stronghold** (Major Location)
- Loot: Ruby Chest + Diamond Chest
- Enemies: Heavy Corrupted Crew presence
- Cooldown: 20 minutes between runs
- LSG Level Required: 5+

---

## 2.6 Chest System

### Chest Tiers (Ascending Rarity)

| Tier | Name | Appearance | Location | Loot Quality |
|------|------|------------|----------|--------------|
| 1 | Common Container | Basic metal box | Everywhere | Basic supplies |
| 2 | Good Container | Reinforced box | Sectors 2+ | Decent gear |
| 3 | Secure Locker | Metal-framed | Sectors 3+ | Good gear |
| 4 | Legendary Cache | Gold-trimmed | Sectors 4+ | Rare items |
| 5 | Captain's Chest | Dark with gold | Sectors 5+ | Elite gear |
| 6 | Ruby Vault | Black with red | Stronghold only | Best in slot |
| 7 | Diamond Safe | Glowing blue | Stronghold reward | Always 5 diamonds |

### Special Chests

**Frozen Chest** (Cold Sector variant)
- Must break ice with cutter first
- Contains cold-themed gear

**Plasma Chest** (Hot Sector variant)
- Must cool down before opening
- Contains energy weapons/items

**Alien Artifact Chest**
- Reward from Mothership event
- Contains unique alien tech

**Obsidian Chest** (Craftable)
- Recipe: 10 meteor shards + 5 gold circuits + 3 plasma ingots
- Guaranteed high-tier loot

### Ruby Vault Special Rule
- First player to open gets Ruby-tier loot
- Subsequent opens downgrade to Captain's Chest quality
- Resets after cooldown

---

# PART 3: ENEMIES & COMBAT

## 3.1 The Phantom (Primary Threat)

### Description
A corrupted astronaut entity - once human, now a twisted silhouette in a damaged spacesuit. Helmet cracked, revealing only darkness within. Moves with unnatural fluidity, sometimes phasing through solid objects.

### Behavior by Cycle

**Cycle 1:** Docile
- Spawns in darkness but does not attack
- Stares at players from corridors
- Establishes dread, teaches players to fear darkness

**Cycles 2-10:** Learning
- Begins hunting during Lights Off
- Slow movement speed
- Easily avoided with flashlight stun
- Loses interest quickly

**Cycles 11-25:** Hunting
- Normal movement speed
- More persistent tracking
- Flashlight stun duration reduced
- Can hear player footsteps

**Cycles 26-50:** Aggressive
- Fast movement
- Tracks through multiple rooms
- Minimal flashlight effectiveness
- Can detect sprinting from far away

**Cycles 51-99:** Relentless
- Maximum speed
- Near-perfect tracking
- Flashlight only delays, doesn't stun
- Only safe in well-lit areas near LSG

### The Phantom's Rules
- **INVINCIBLE** - Cannot be killed, only avoided
- Cannot enter areas lit by LSG
- Spawns IMMEDIATELY if LSG runs out of fuel
- Struggles with obstacles, tight spaces, spiral stairs
- Cannot climb ladders
- Safe zones: Near LSG, inside sealed rooms, elevated platforms

### Counter-Strategies
- Flashlight: Brief stun (effectiveness decreases over cycles)
- Sealed doors: Won't path through closed airlocks
- Vertical movement: Use ladders, elevated walkways
- Distraction: Thrown objects create noise
- Light sources: Flares, emergency lights create temporary safe zones

---

## 3.2 Wildlife

### Space Hoppers (Basic Prey)
- HP: 15
- Damage: 0 (flee on sight)
- Drops: Space Hopper Meat, Space Hopper Foot (rare)
- Behavior: Passive, runs when approached
- Notes: Primary early food source

### Void Hounds (Medium Predator)
- HP: 50
- Damage: 15 per bite
- Drops: Void Hound Meat, Void Hound Pelt
- Behavior: Aggressive when player approaches, hunts in small packs
- Notes: Dangerous early game, manageable with weapons

### Cargo Beasts (Large Predator)
- HP: 150
- Damage: 35 per attack
- Drops: Cargo Beast Meat, Heavy Pelt, rare materials
- Behavior: Territorial, charges when threatened
- Notes: Mini-boss level threat, avoid early game
- Location: Cargo bays, engineering sector

### Polar Beasts (Cold Sector Only)
- HP: 200
- Damage: 40 per attack
- Drops: Frost Pelt, Ice Crystals
- Behavior: Guards caves in pairs
- Location: Cold storage, cryo-sector

---

## 3.3 Corrupted Crew (Humanoid Enemies)

### Basic Corrupted
- HP: 40
- Damage: 10 (melee)
- Drops: Station Tokens, basic materials
- Behavior: Patrol, attack on sight

### Corrupted Engineer
- HP: 60
- Damage: 15 (tool attacks)
- Drops: Tools, circuits, tokens
- Special: Can repair damaged barriers

### Corrupted Security
- HP: 80
- Damage: 20 (stun baton) or 25 (ranged)
- Drops: Weapons, armor pieces, tokens
- Special: Ranged attacks, more aggressive

### Cult Leader
- HP: 150
- Damage: 30 (energy attacks)
- Drops: Corrupted Gems, rare crafting materials
- Behavior: Commands other corrupted, summons reinforcements
- Location: Cultist Stronghold boss

### Corrupted Crew Raids
- Occur every 10-15 cycles starting at Cycle 20
- 5-15 enemies attack base
- Intensity scales with player count and cycle number
- Must defend LSG
- Rewards: Heavy loot drops, gems, tokens

---

## 3.4 Special Enemies

### The Owl (Introduced Cycle 6)
**Space Equivalent: The Watcher**
- Flying surveillance drone corrupted by station anomaly
- Warning: Red icon appears before charge attack
- HP: 30 (can be destroyed)
- Damage: 20 (dive attack)
- Counter: Dodge when warning appears, shoot with ranged

### The Ram (Volcanic/Hot Sector)
**Space Equivalent: The Charger**
- Malfunctioning cargo loader robot
- Warning: Snorting/engine rev sound, then charges
- HP: 100
- Damage: 40 (charge), 15 (melee)
- Counter: Sidestep charge, attack from behind

### Tree Watchers (Late Game)
**Space Equivalent: Station Anomalies**
- Glitched areas of space-time
- Appear as visual distortions
- HP: N/A (environmental hazard)
- Damage: 25/second in anomaly zone
- Counter: Avoid distorted areas, use stabilizers

### Ancient Horrors (Endgame)
**Space Equivalent: Void Entities**
- Creatures from beyond normal space
- Extremely dangerous, appear Cycles 75+
- HP: 300
- Damage: 50
- Counter: Heavy weapons, group coordination

---

## 3.5 Combat System

### Melee Weapons
| Weapon | Damage | Speed | Durability | Source |
|--------|--------|-------|------------|--------|
| Plasma Cutter (tool) | 10 | Fast | 50 uses | Starting |
| Stun Baton | 20 | Fast | 100 uses | Craft Lvl 2 |
| Heavy Wrench | 30 | Medium | 150 uses | Craft Lvl 3 |
| Plasma Blade | 45 | Fast | 200 uses | Craft Lvl 4 |
| Void Katana | 60 | Very Fast | 300 uses | Legendary chest |

### Ranged Weapons
| Weapon | Damage | Fire Rate | Ammo | Source |
|--------|--------|-----------|------|--------|
| Stun Pistol | 15 | Medium | Energy cells | Craft Lvl 3 |
| Plasma Rifle | 25 | Medium | Plasma rounds | Craft Lvl 4 |
| Tactical Shotgun | 40 (spread) | Slow | Shell packs | Gold Chest |
| Laser Cannon | 60 | Slow | Heavy cells | Craft Lvl 5 |
| Void Rifle | 80 | Medium | Void crystals | Ruby Chest |

### Armor
| Armor | Defense | Special | Source |
|-------|---------|---------|--------|
| Emergency Suit | 10% | Starting gear | Default |
| Padded Suit | 20% | Noise reduction | Craft Lvl 2 |
| Security Armor | 35% | Balanced | Craft Lvl 3 |
| Heavy Plating | 50% | Slow movement | Craft Lvl 4 |
| Thorn Armor | 40% | Damage reflect | Legendary |
| Void Armor | 60% | Phantom resistance | Ruby Chest |

---

# PART 4: BASE BUILDING & DEFENSE

## 4.1 Defensive Structures

### Barriers (Tier 1)
- **Barricade:** 5 scrap - Temporary, breaks easily
- **Metal Barrier:** 15 scrap - Standard wall section
- **Reinforced Wall:** 30 scrap + 10 alloy - Strong wall

### Doors
- **Basic Airlock:** 20 scrap - Slows enemies
- **Reinforced Airlock:** 40 scrap + 15 alloy - Requires enemy to break
- **Blast Door:** 80 scrap + 30 alloy + 10 plasma - Very resistant

### Automated Defenses
- **Motion Sensor:** 15 circuits - Alerts when enemies near
- **Auto-Turret:** 50 scrap + 30 circuits - Shoots enemies automatically
- **Plasma Turret:** 80 scrap + 50 circuits + 20 plasma - Heavy damage
- **Shield Generator:** 100 scrap + 60 circuits + 40 plasma - Area protection

### Traps
- **Stun Plate:** 10 scrap + 10 circuits - Stuns enemies briefly
- **Plasma Mine:** 20 scrap + 15 circuits - Explodes on contact
- **Gravity Trap:** 30 scrap + 25 circuits - Slows enemies in area

## 4.2 Base Layout Strategy

**Recommended Setup:**
```
[Outer Wall - Reinforced barriers with turrets]
    |
[Kill Zone - Traps, open area for turret fire]
    |
[Inner Wall - Blast doors, emergency supplies]
    |
[Core - LSG, beds, storage, crafting stations]
```

**Key Principles:**
- LSG must be protected at center
- Multiple layers slow enemies
- Beds MUST be inside defensive perimeter
- Storage boxes near LSG for emergency resupply
- Overlapping turret coverage

## 4.3 Utility Structures

- **Bed:** 20 scrap + 10 circuits - Sets respawn point (MUST be in base)
- **Storage Locker:** 15 scrap - 20 slot storage
- **Auto-Fuel Loader:** 40 scrap + 25 circuits - Auto-feeds LSG
- **Hydroponic Bay:** 50 scrap + 30 circuits - Grows food
- **Medical Station:** 60 scrap + 40 circuits - Faster healing

---

# PART 5: CREW RESCUE SYSTEM

## 5.1 Missing Crew Members

Four crew members survived and are hiding in the station. Rescuing them provides major bonuses and is required for the true ending.

### Crew Member 1: "Junior Engineer"
- Location: Sector 2 (Crew Quarters)
- Guardian: Pack of Void Hounds
- Recommended Gear: Spear/Stun Baton, basic armor
- Rescue Reward: 5 cycle skip, +25% crafting speed

### Crew Member 2: "Medical Officer"
- Location: Sector 3 (Engineering)
- Guardian: Cargo Beast
- Recommended Gear: Ranged weapon, decent armor
- Rescue Reward: 10 cycle skip, free Medkit crafting

### Crew Member 3: "Security Chief"
- Location: Sector 4 (Research Labs)
- Guardian: Multiple Cargo Beasts
- Recommended Gear: Plasma Rifle, heavy armor
- Rescue Reward: 15 cycle skip, +50% weapon damage

### Crew Member 4: "Captain"
- Location: Sector 5 (Command Deck)
- Guardian: Cult Leader + Corrupted crew
- Recommended Gear: Best available weapons/armor
- Rescue Reward: 20 cycle skip, unlocks true ending ritual

### Rescue Mechanics
- Approach crew member, interact to begin escort
- Must return crew member safely to LSG
- If crew member dies during escort, they respawn after 5 cycles
- Crew members have HP bar, can take damage
- Move slower while escorting

---

## 5.2 True Ending

After all 4 crew members rescued:

1. New location unlocks: **The Beacon Room**
2. Ritual event becomes available
3. All crew members participate in activating emergency beacon
4. Must defend beacon for 5 minutes during activation
5. Final wave of enemies attacks
6. Victory: Rescue shuttle arrives, escape the station

**Good Ending Requirements:**
- All 4 crew rescued
- Beacon defended successfully
- Survive until midnight of Cycle 99

**Bad Ending:**
- Fail to rescue all crew, OR
- Beacon destroyed, OR
- All players die on Cycle 99

---

# PART 6: MULTIPLAYER SYSTEMS

## 6.1 Scaling

Difficulty scales based on **initial player count** at game start:

| Players | Enemy HP | Enemy Spawns | Loot Quality | Raid Size |
|---------|----------|--------------|--------------|-----------|
| 1 | 100% | Normal | Standard | 5-8 enemies |
| 2 | 150% | +25% | +10% better | 8-12 enemies |
| 3 | 200% | +50% | +20% better | 12-18 enemies |
| 4 | 250% | +75% | +30% better | 15-25 enemies |

**CRITICAL:** Scaling does NOT adjust if players leave
- If 4 players start and 3 leave, remaining player faces 4-player difficulty
- Only play with committed team members

## 6.2 Shared Systems

- **Resources:** Shared pool for base building
- **LSG:** Single shared generator (must coordinate fuel)
- **Chests:** First player to open gets primary loot, others get secondary
- **Crew Rescue:** Any player can escort, bonus shared

## 6.3 Revive System

- Downed players enter "Critical" state (30 seconds)
- Other players can revive with Medkit
- If not revived, respawn at bed/LSG
- Respawn penalty: Lose some carried resources

## 6.4 Roles (Optional Coordination)

**Scout:** Focus on exploration, finding chests/crew
**Gatherer:** Resource collection, keeping LSG fueled
**Builder:** Base construction and maintenance
**Defender:** Combat focus, protecting base during raids

---

# PART 7: CLASSES (Future Feature)

Classes are purchased with Diamonds (earned in-game or via LuminaCore integration)

### Medic
- Enhanced healing item effectiveness (+50%)
- Can craft medical supplies without workbench
- Revive speed +100%
- Starting bonus: 5 Bandages

### Engineer
- Crafting speed +50%
- Repair structures at 50% cost
- Turrets deal +25% damage
- Starting bonus: Advanced Multi-tool

### Scout
- Movement speed +20%
- Footstep noise -50%
- Can see chests on minimap
- Starting bonus: Upgraded Flashlight

### Scavenger
- Inventory slots: 25 (vs base 12)
- +25% loot from chests
- Can break down items for materials
- Starting bonus: 10 of each basic resource

### Commander (Unlocked after first win)
- Tamed creatures deal +50% damage
- Can command up to 3 tamed Void Hounds
- Raid warning +30 seconds early
- Starting bonus: Taming Device

---

# PART 8: PSYCHOLOGICAL ELEMENTS

## 8.1 Fear System

Fear level increases during:
- Lights Off periods
- Near The Phantom
- Low health
- Low LSG fuel
- In dark areas without flashlight

### Fear Effects
| Fear Level | Effects |
|------------|---------|
| 0-25% | Normal |
| 26-50% | Slight visual distortion at edges |
| 51-75% | Auditory hallucinations (footsteps, whispers) |
| 76-100% | Heavy distortion, phantom movement in periphery |

### Fear Reduction
- Standing near LSG
- Being with other players
- Using Light items (flares, flashlight)
- Consuming certain items (Calm Pills)

---

# PART 9: TECHNICAL SPECIFICATIONS

## 9.1 Current Tech Stack (Implemented)

| Component | Technology | Status | Notes |
|-----------|------------|--------|-------|
| 3D Engine | Babylon.js 7.x | ✅ Implemented | CDN-loaded, with glTF loader |
| Audio | Web Audio API | ✅ Implemented | Procedural audio, no external files |
| Multiplayer | Colyseus | 📋 Planned | Node.js real-time game server |
| Client Host | Vercel | ✅ Ready | Via Noyola Hub deployment |
| Server Host | Railway/Render | 📋 Planned | For multiplayer |
| 3D Assets | Kenney + Quaternius | ✅ Integrated | Space Kit + Sci-Fi Megakit |

## 9.2 Asset Packs Used

| Pack | Source | Models Used |
|------|--------|-------------|
| Kenney Space Kit | kenney.nl | astronautA.obj (player), alien.obj (fallback) |
| Quaternius Modular Sci-Fi Megakit | quaternius.com | Platform_Metal.gltf (floors), DoorFrame_01.gltf, Prop_Chest.gltf, Prop_AccessPoint.gltf (LSG), Alien_Cyclop.gltf (phantom), PBR textures for walls/floors |

## 9.3 Performance Targets

- 60 FPS on mid-range hardware
- Mobile/tablet compatible (iPad, iPhone)
- Works in Safari, Chrome, Firefox, Edge
- Responsive touch controls for mobile

## 9.4 Current File Structure (Implemented)

```
kid-games/
├── 99-nights-in-space/
│   ├── index.html              # Game entry point with HUD
│   ├── styles/
│   │   └── game-base.css       # Game styling, HUD, interaction prompts
│   └── scripts/
│       ├── game-config.js      # Game constants and configuration
│       ├── game-main.js        # Core game logic (all systems)
│       └── game-init.js        # Initialization entry point
│
├── assets/models/99-nights-in-space/
│   ├── kenney-space-kit/
│   │   └── Models/OBJ format/  # Kenney .obj models
│   └── quaternius-sci-fi/
│       └── megakit/Modular SciFi MegaKit[Standard]/
│           └── glTF/           # Quaternius .gltf models + textures
│               ├── Platforms/
│               ├── Props/
│               ├── Aliens/
│               └── Walls/
│
├── shared/
│   ├── lumina-core.js          # Progression system (XP, coins)
│   └── scripts/hub-config.js   # Game registration
│
└── service-worker.js           # Offline caching support
```

## 9.5 Key Technical Decisions

### Camera System
- **ArcRotateCamera** with fixed radius (6 units) for consistent 3rd-person view
- Disabled zoom controls to maintain game feel like 99 Nights in the Forest
- Wall fading via raycasting when walls block camera-to-player line of sight

### Model Loading
- glTF models loaded via `BABYLON.SceneLoader.ImportMeshAsync`
- Textures copied to glTF subfolders (Babylon rejects parent-directory paths)
- Collision handled by invisible primitive meshes, visuals by glTF models

### Interaction System
- Unified 'E' key for all interactions (chests, LSG refueling)
- Proximity-based detection (2.5 unit radius)
- Visual prompt with pulsing animation when interactable nearby
- Touch support via dedicated button for mobile

---

# PART 10: LUMINACORE INTEGRATION

## 10.1 XP Awards

| Action | XP |
|--------|-----|
| Survive 1 cycle | 10 |
| Survive 10 cycles | 150 |
| Survive 50 cycles | 500 |
| Complete game (99 cycles) | 2000 |
| Rescue crew member | 200 each |
| Defeat raid | 100 |
| Open legendary+ chest | 50 |

## 10.2 Coin Awards

| Action | Coins |
|--------|-------|
| Per cycle survived | 5 |
| Rescue crew member | 100 |
| Complete game | 500 |
| True ending | 1000 |

## 10.3 Achievements

| ID | Name | Description | XP Bonus |
|----|------|-------------|----------|
| sn_first_cycle | First Night | Survive your first Lights Off | 20 |
| sn_ten_cycles | Getting Started | Survive 10 cycles | 50 |
| sn_fifty_cycles | Veteran | Survive 50 cycles | 150 |
| sn_complete | Survivor | Complete all 99 cycles | 500 |
| sn_true_ending | Hero | Achieve the true ending | 750 |
| sn_first_rescue | First Rescue | Rescue your first crew member | 100 |
| sn_all_rescue | Full Crew | Rescue all 4 crew members | 300 |
| sn_no_damage_cycle | Untouchable | Survive a Lights Off without taking damage | 75 |
| sn_raid_defender | Raid Boss | Survive a Corrupted Crew raid | 100 |
| sn_phantom_stare | Staring Contest | Survive being stared at by The Phantom (Cycle 1) | 25 |

---

# PART 11: DEVELOPMENT PHASES

## Phase 1: Single Player Core ✅ COMPLETE
- [x] Babylon.js scene setup with glTF loader
- [x] Third-person player controller (WASD + camera rotation)
- [x] Multi-room environment with corridors
- [x] LSG system with fuel management
- [x] Power cycle (Lights On/Off) with 99 cycles
- [x] The Phantom basic AI (spawn during night, hunt player)
- [x] Basic resource gathering (scrap, circuits, fuel cells)
- [x] Interactable chests with loot system
- [x] Death/game over system
- [x] Full HUD (fuel, health, cycle counter, resources, status)
- [x] Procedural audio (ambient + SFX)
- [x] Mobile touch controls
- [x] Camera wall fading system

## Phase 2: Expand Single Player (In Progress)
- [x] Multiple rooms connected by corridors
- [x] Three resource types (scrap, circuits, fuel)
- [x] Chest interaction with opening animation
- [ ] Full crafting system with workbench
- [ ] Additional enemy types (Void Hounds, Cargo Beasts)
- [ ] Corrupted Crew enemies
- [ ] Chest tiers (common → legendary)
- [ ] First crew member rescue mission
- [ ] Base building basics (barriers, turrets)
- [ ] Flashlight mechanic
- [ ] Fear system

## Phase 3: Multiplayer (Planned)
- [ ] Colyseus server setup
- [ ] Player synchronization
- [ ] Lobby/matchmaking
- [ ] Shared game state
- [ ] Scaling system (1-4 players)
- [ ] Revive mechanics
- [ ] Server deployment (Railway/Render)

## Phase 4: Polish & Complete (Planned)
- [ ] All 4 crew rescues
- [ ] True ending sequence
- [ ] Raid system
- [ ] Classes (optional)
- [ ] LuminaCore integration (XP, coins, achievements)
- [ ] Save/load system
- [ ] Balance tuning
- [ ] Performance optimization

---

# PART 12: VISUAL STYLE GUIDE

## Atmosphere
- Sci-fi horror but FAMILY FRIENDLY (Coraline level)
- Dark corridors with emergency lighting
- Flickering lights, steam, debris
- Clean areas contrast with corrupted zones
- The Phantom should be creepy, not gory

## Color Palette
- **Safe Areas:** Warm white/yellow lights, blue accent
- **Danger Areas:** Red emergency lights, green corruption
- **The Phantom:** Pure black silhouette with faint blue glow
- **Corruption:** Green/purple energy effects

## UI Style
- Sci-fi holographic aesthetic
- Clean, readable fonts
- Color-coded warnings (yellow caution, red danger)
- Minimal HUD during exploration, expanded during combat

---

# APPENDIX A: QUICK REFERENCE TABLES

## Cycle Survival Checklist

**Before Each Lights Off:**
- [ ] LSG fuel > 2 minutes
- [ ] Doors closed/locked
- [ ] Turrets loaded
- [ ] Escape route planned
- [ ] Flashlight charged

## Resource Priority by Phase

**Cycles 1-10:**
1. Scrap (LSG upgrades)
2. Food (survival)
3. Circuits (crafting)

**Cycles 11-25:**
1. Circuits (weapons/turrets)
2. Alloy (armor/walls)
3. Fuel (stockpile)

**Cycles 26+:**
1. Plasma (endgame gear)
2. Defense materials
3. Medical supplies

---

# APPENDIX B: BALANCE NOTES

## Intended Session Length
- Quick session (Cycles 1-25): ~2 hours
- Medium session (Cycles 1-50): ~5 hours
- Full run (Cycles 1-99): ~10-13 hours
- Can save/resume at any cycle

## Difficulty Curve
- Cycles 1-5: Tutorial, learn mechanics
- Cycles 6-15: First real challenges
- Cycles 16-30: Comfortable if prepared
- Cycles 31-50: Requires strategy
- Cycles 51-75: Demanding
- Cycles 76-99: Expert level

---

# END OF SPECIFICATION

**Document Version:** 2.1
**Last Updated:** January 27, 2025
**Based On:** 99 Nights in the Forest (Roblox) by Grandma's Favourite Games
**Adapted For:** Noyola Hub / Web Platform
**Current Build:** v0.1.0 (Single-player prototype with core mechanics)

*This document serves as the complete reference for developing 99 Nights in Space using Cursor AI and Claude.*
