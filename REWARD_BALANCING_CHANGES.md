# Reward System Balancing - January 23, 2026

## Problem
Kids were earning XP and reward points too quickly:
- Could reach 500 reward points (playdate tier) in one day
- Going up 2 levels in a single game session
- Quicker games like Lumina Racer awarded same rewards as longer games

## Solution
Reduced XP and reward point earnings across all games to create healthier progression.

---

## Changes Made

### 1. Lumina Racer (Quick Game - 5-10 min)
**Before:**
- 10 XP per word completed
- 100 XP for winning
- Reward points = XP / 10
- **Total per win:** ~200-300 XP, 20-30 reward points

**After:**
- 3 XP per word completed (70% reduction)
- 30 XP for winning (70% reduction)
- Placement bonuses: 15 XP (2nd), 8 XP (3rd)
- Combo bonus: 10 XP (5+ combo)
- Reward points = XP / 20 (50% reduction)
- **Total per win:** ~60-80 XP, 3-4 reward points

### 2. Shadows in the Halls (Long Game - 20-30 min)
**Before:**
- Puzzle rewards: Based on difficulty (unchanged - using PUZZLE_REWARDS config)
- Escape bonus: 100 + (puzzles × 10) XP
- Reward points per puzzle: XP / 10
- Reward points for escape: 10

**After:**
- Puzzle rewards: Unchanged (respects difficulty system)
- Escape bonus: 40 + (puzzles × 5) XP (60% reduction)
- Reward points per puzzle: XP / 20 (50% reduction)
- Reward points for escape: 4 (60% reduction)

### 3. Documentation Updates
Updated `noyola-hub-reference-guide.md` with:
- Reward balancing guidelines for future games
- XP recommendations by game length
- Target progression rates
- Recommended formulas

---

## Expected Progression (New System)

### Daily Play (3-5 games/day)
- **Quick games (Lumina Racer):**
  - 3 games: ~180-240 XP, 9-12 reward points
  - 5 games: ~300-400 XP, 15-20 reward points

- **Long games (Shadows):**
  - 1 escape with 5 puzzles: ~65 XP, ~4 reward points
  - 2 escapes: ~130 XP, ~8 reward points

### Weekly Progression
- **Regular play (5 days × 4 games):**
  - ~600-800 XP (level 4-5 in first week)
  - ~60-80 reward points per week

- **Active play (7 days × 5 games):**
  - ~1000-1400 XP (level 5-6 in first week)
  - ~100-140 reward points per week

### Time to Rewards
| Reward | Cost | Time Required |
|--------|------|---------------|
| 15 min Gaming | 100 pts | ~1 week regular play |
| Special Treat | 150 pts | ~1.5 weeks regular play |
| 30 min Gaming | 200 pts | ~2 weeks regular play |
| Movie Pick | 250 pts | ~2.5 weeks regular play |
| Dinner Pick | 300 pts | ~3 weeks regular play |
| Stay Up Late | 350 pts | ~3.5 weeks regular play |
| Skip Chore | 400 pts | ~4 weeks regular play |
| **Friend Playdate** | **500 pts** | **~4-5 weeks regular play** |

### Time to Levels
| Level | Title | XP Required | Time Required |
|-------|-------|-------------|---------------|
| 2 | Seeker | 100 | ~2-3 days |
| 3 | Scholar | 300 | ~5-7 days |
| 4 | Adept | 600 | ~2 weeks |
| 5 | Keeper | 1000 | ~3 weeks |
| 6 | Guardian | 1500 | ~4 weeks |
| 7 | Champion | 2200 | ~6 weeks |
| 10 | Archmage | 5500 | ~3-4 months |
| 12 | Transcendent | 10000 | ~6-8 months |

---

## Games Not Yet Balanced

The following games have LuminaCore integration but don't award XP yet:
- **Spell Siege** - Ready for integration
- **Canada Adventure** - Partial integration
- **Word Forge** - Partial integration

When these games are integrated, follow the guidelines in `noyola-hub-reference-guide.md`:
- Use `xpEarned / 20` for reward points
- Award 50-100 XP for medium-length games
- Scale XP by performance and game duration

---

## Testing Recommendations

1. **Play Lumina Racer 3-5 times** - Should earn 9-20 reward points
2. **Play Shadows once (escape)** - Should earn 4-8 reward points
3. **Track daily totals** - Should be 50-100 points per day with regular play
4. **Monitor weekly progress** - Should reach ~500 points in 4-5 weeks

## Notes

- Coin rewards unchanged (cosmetic currency)
- Level thresholds unchanged (already well-balanced)
- Achievement XP bonuses unchanged (special one-time rewards)
- Family quest contributions still based on XP earned
