# Master Image Generation Guide for Noyola Hub Games
## Professional-Quality Asset Creation with Google Gemini

---

## Overview

This master guide provides a complete system for generating professional-quality images, backgrounds, and graphics for all 8 games in the Noyola Hub ecosystem. Each game has its own detailed prompt document with specific instructions for creating cohesive, professional assets.

---

## Quick Reference: Game Prompt Documents

| Game | Document Location | Visual Style | Primary Colors |
|------|------------------|--------------|----------------|
| **Spell Siege** | `spell-siege/IMAGE_GENERATION_PROMPTS.md` | 16-bit pixel art, fantasy medieval | Purple, Gold, Blue |
| **Canada Adventure** | `canada-adventure/IMAGE_GENERATION_PROMPTS.md` | 16-bit pixel art, regional Canada themes | Red, White (flag), Regional variations |
| **Lumina Racer** | `lumina-racer/IMAGE_GENERATION_PROMPTS.md` | 16-bit pixel art, sci-fi fantasy blend | Neon Blues, Purples, Gold |
| **Word Forge** | `word-forge/IMAGE_GENERATION_PROMPTS.md` | 16-bit pixel art, medieval blacksmith | Orange (forge), Red (fire), Purple (magic) |
| **Math Quest** | `math-quest/IMAGE_GENERATION_PROMPTS.md` | 16-bit pixel art, educational RPG | Blue, Green, Purple (math magic) |
| **Pixel Quest** | `pixel-quest/IMAGE_GENERATION_PROMPTS.md` | 16-bit pixel art, classic platformer | World-specific palettes |
| **Rhythm Academy** | `rhythm-academy/IMAGE_GENERATION_PROMPTS.md` | 16-bit pixel art, music game | Red, Blue, Green, Yellow (lanes) |
| **Shadows in the Halls** | `shadows-in-the-halls/IMAGE_GENERATION_PROMPTS.md` | 16-bit pixel art, atmospheric survival | Dark blue, Purple-black, Cyan (UI) |

---

## How to Use Google Gemini for Image Generation

### Step 1: Access Gemini Image Generation

**Option A: Free via Google AI Studio**
1. Go to https://aistudio.google.com/
2. Sign in with Google account
3. Select "Generate image" mode
4. Free with daily limits

**Option B: API (Your Current Setup)**
```bash
cd C:\Users\mnoyo\OneDrive\Documents\Personal\AI\games\kid-games
python tools/generate_image.py -p "YOUR_PROMPT_HERE" -t sprite -s pixel-art -o assets/OUTPUT_PATH.png
```

**Option C: Gemini 2.0 Flash**
1. Go to https://gemini.google.com/
2. Ensure you're using "Gemini 2.0 Flash" model
3. Type or paste your prompt
4. Image generates in ~10-30 seconds

### Step 2: Using the Prompt Documents

1. **Open the game's prompt document** (e.g., `spell-siege/IMAGE_GENERATION_PROMPTS.md`)
2. **Find the asset type you need** (Character sprite, Background, UI element, etc.)
3. **Copy the complete prompt** (the text in the gray code block)
4. **Paste into Gemini** exactly as written
5. **Generate and evaluate** the result
6. **Iterate if needed** (see Iteration Tips below)

### Step 3: Post-Processing

After generating images, you may need to:

1. **Remove backgrounds** (for sprites):
   ```bash
   python tools/remove_bg.py -i assets/sprites/IMAGE.png -o assets/sprites/IMAGE_rgba.png
   ```

2. **Resize if needed**:
   - Use image editor (Photoshop, GIMP, Photopea.com)
   - Maintain aspect ratio
   - Use nearest-neighbor scaling for pixel art

3. **Optimize file size**:
   - PNG for sprites with transparency
   - JPG for large backgrounds
   - Keep sprites under 500KB each

---

## Asset Generation Workflow

### For a New Game or Complete Asset Refresh

**Phase 1: Character Sprites** (Start here - defines visual style)
1. Generate main player character
2. Generate character animations (idle, walk, action)
3. Generate NPCs or companions
4. Review all characters together for consistency

**Phase 2: Enemy/Opponent Sprites**
1. Generate all enemy types from weakest to strongest
2. Generate boss characters
3. Create enemy animations
4. Ensure size hierarchy is clear

**Phase 3: Environments**
1. Generate all background images
2. Generate platform/tile sets (if applicable)
3. Generate decorative elements
4. Create parallax background layers if needed

**Phase 4: UI Elements**
1. Generate all icons (health, coins, power-ups)
2. Generate UI frames and containers
3. Generate feedback elements (correct/wrong)
4. Generate menu backgrounds

**Phase 5: Special Effects**
1. Generate particle effects
2. Generate impact/hit effects
3. Generate celebration/victory effects
4. Generate ambient atmospheric effects

**Estimated Time per Game**: 3-5 hours of generation + 2-3 hours of post-processing

---

## Best Practices for Professional Results

### Consistency is Key

1. **Use the same style descriptor** across all assets for a game
   - Example: Always use "16-bit pixel art" not mixing with "8-bit" or "32-bit"
   
2. **Maintain color palette** throughout
   - Copy exact hex codes from prompt documents
   - Keep primary colors consistent across all assets
   
3. **Keep lighting direction consistent**
   - If characters are lit from top-left, keep that for all sprites
   
4. **Match character proportions**
   - If hero is 64x64px, enemies should use similar base size
   - Boss characters can be 2-4x larger

### Iteration Tips

If the first generation isn't perfect:

1. **Add specificity to the prompt**:
   - ❌ "Create a dragon"
   - ✅ "Create a pixel art dragon with purple scales, glowing blue eyes, spread wings, and magical runes on body"

2. **Reference exact sizes**:
   - Always include: "Size: 128x128px" or similar

3. **Emphasize the transparent background**:
   - Add: "IMPORTANT: Transparent background, no background elements"

4. **Request multiple angles**:
   - "Show character from front view, side view, and 3/4 view"

5. **Generate variations**:
   - Create 3-5 versions and pick the best
   - Mix and match elements from different generations

### Quality Checklist

Before finalizing any asset:

- ✅ **Correct size/resolution** for intended use
- ✅ **Transparent background** (for sprites)
- ✅ **Consistent style** with other game assets
- ✅ **Clear silhouette** (recognizable at small size)
- ✅ **Appropriate color palette** matching game theme
- ✅ **Kid-friendly** appearance (age-appropriate)
- ✅ **Professional polish** (no rough edges or artifacts)

---

## Asset Size Guidelines

### Character Sprites
- **Player characters**: 64x64px to 128x128px
- **NPCs**: 64x64px to 128x128px
- **Small enemies**: 48x48px to 96x96px
- **Large enemies**: 128x128px to 192x192px
- **Boss characters**: 256x256px

### Background Images
- **Full screen backgrounds**: 1920x1080px (landscape)
- **Parallax layers**: 2400x1080px (wider for scrolling)
- **Mobile backgrounds**: 1080x1920px (portrait)

### UI Elements
- **Small icons**: 32x32px to 64x64px
- **Button backgrounds**: 256x64px to 512x128px
- **Health/progress bars**: 256x32px to 400x64px
- **Modal windows**: 800x600px

### Tilesets (Platformers)
- **Individual tiles**: 32x32px
- **Tileset sheets**: 512x512px (16x16 tiles)

---

## Cost Estimates

Using Google Gemini API:

| Asset Type | Approx. Cost | Quantity per Game | Total per Game |
|------------|--------------|-------------------|----------------|
| Character sprites | $0.04 each | 10-15 | $0.40-$0.60 |
| Enemy sprites | $0.04 each | 8-12 | $0.32-$0.48 |
| Backgrounds | $0.06 each | 5-8 | $0.30-$0.48 |
| UI elements | $0.02 each | 20-30 | $0.40-$0.60 |
| Effects | $0.03 each | 10-15 | $0.30-$0.45 |
| **TOTAL** | | | **$1.72-$2.61** |

**Note**: Free tier allows ~50 images per day. For all 8 games, budget $15-$20 total.

---

## Common Issues & Solutions

### Issue: Background isn't transparent
**Solution**: 
- Add "IMPORTANT: Completely transparent background" to prompt
- Use remove_bg.py tool after generation
- Manually remove in image editor

### Issue: Style inconsistency between assets
**Solution**:
- Copy exact style description between prompts
- Generate all related assets in same session
- Create style guide document with reference images

### Issue: Wrong size/resolution
**Solution**:
- Always specify exact dimensions in prompt
- Resize with nearest-neighbor algorithm for pixel art
- Use bilinear/bicubic for painted backgrounds

### Issue: Colors don't match game palette
**Solution**:
- Specify exact hex color codes in prompt
- Post-process with color adjustment
- Use color picker to match existing assets

### Issue: Asset looks unprofessional
**Solution**:
- Add "professional quality, game asset, polished" to prompt
- Generate multiple variations and choose best
- Consider hiring artist for key assets if needed

---

## Integration with Existing Tools

Your project already has asset generation tools set up:

### Current Tool Setup
```
tools/
├── generate_image.py       # Google Gemini image generation ✅
├── generate_sfx.py         # ElevenLabs sound effects ✅
├── generate_voice.py       # Cartesia voice synthesis ✅
├── generate_game_assets.py # Batch asset generator ✅
└── remove_bg.py            # Background removal ✅
```

### Batch Generation Example
```bash
# Generate all assets for a game at once
python tools/generate_game_assets.py \
  --game spelling \
  --theme "magical castle" \
  --id spell-siege \
  --style pixel-art

# This will create:
# - Character sprites
# - Enemy sprites  
# - UI elements
# - Effects
# Based on the game type and theme
```

---

## Testing Your Assets

Before considering assets "final":

1. **In-Game Testing**:
   - Import assets into game
   - Test at actual game resolution
   - Check animations loop smoothly
   - Verify readability at game speed

2. **Multi-Device Testing**:
   - Test on iPad (primary device)
   - Check on desktop browser
   - Verify mobile phone display

3. **Accessibility Check**:
   - Color-blind mode testing
   - Check contrast ratios
   - Ensure text is readable

4. **Performance Check**:
   - File sizes reasonable
   - Loading time acceptable
   - No frame rate drops

---

## Asset Organization

Keep your generated assets organized:

```
assets/
├── sprites/
│   ├── [game-name]/
│   │   ├── characters/
│   │   ├── enemies/
│   │   └── objects/
├── backgrounds/
│   └── [game-name]/
│       ├── main-menu.png
│       ├── level-1.png
│       └── victory.png
├── ui/
│   └── [game-name]/
│       ├── icons/
│       └── frames/
└── effects/
    └── [game-name]/
        ├── particles/
        └── impacts/
```

**Naming Convention**:
- Use lowercase with hyphens
- Be descriptive: `player-run-frame-1.png`
- Include state: `button-hover.png`, `button-pressed.png`
- Version if iterating: `dragon-v1.png`, `dragon-v2.png`

---

## Professional Polish Tips

### Make Sprites Pop
1. **Add subtle outlines**: Dark outline (1-2px) makes sprites readable
2. **Use anti-aliasing sparingly**: Only on curves for pixel art
3. **Add highlights**: Small bright spots suggest lighting
4. **Include shadows**: Ground shadows anchor sprites

### Make Backgrounds Engaging
1. **Use layers**: Foreground, mid-ground, background
2. **Add atmosphere**: Particles, mist, lighting rays
3. **Maintain focus**: Keep backgrounds slightly less saturated
4. **Tell a story**: Each scene should convey setting and mood

### Make UI Intuitive
1. **High contrast**: UI must be readable over gameplay
2. **Consistent iconography**: Similar functions use similar symbols
3. **Clear states**: Hover, pressed, disabled, active
4. **Responsive feedback**: Visual response to every interaction

---

## Game-Specific Notes

### Spell Siege
- **Priority**: Enemy sprites define difficulty progression
- **Critical**: Castle should look worth defending
- **Style note**: Keep fantasy elements kid-friendly, not dark

### Canada Adventure
- **Priority**: Regional accuracy for educational value
- **Critical**: Each region must be visually distinct
- **Style note**: Celebrate Canadian culture respectfully

### Lumina Racer
- **Priority**: Speed effects and motion blur are essential
- **Critical**: Track environments must suggest speed
- **Style note**: Balance futuristic tech with magical elements

### Word Forge
- **Priority**: Crafted items must show quality progression
- **Critical**: Forge atmosphere (fire, embers, heat)
- **Style note**: Rarity tiers must be instantly recognizable

### Math Quest
- **Priority**: Math symbols integrated naturally into fantasy
- **Critical**: Enemy design shows progressive difficulty
- **Style note**: Educational without being boring

### Pixel Quest
- **Priority**: Platform tiles must tile seamlessly
- **Critical**: Clear collision boundaries
- **Style note**: Classic platformer nostalgia with modern polish

### Rhythm Academy
- **Priority**: Note lanes must be instantly readable
- **Critical**: High contrast between notes and background
- **Style note**: Music theme in every visual element

### Shadows in the Halls
- **Priority**: Lighting effects create atmosphere
- **Critical**: Spooky but not traumatizing for kids
- **Style note**: "Scooby-Doo scary" not "horror movie scary"

---

## Next Steps

### Immediate Actions
1. ✅ Read this master guide
2. ✅ Review individual game prompt documents
3. 📝 Choose which game to start with
4. 🎨 Generate first batch of assets (characters)
5. 🔄 Iterate based on results
6. 🎮 Integrate into game
7. 🧪 Test in actual gameplay
8. 🔁 Repeat for next asset category

### Long-term Asset Management
- **Version control**: Commit assets to git with descriptions
- **Asset registry**: Track what's been generated and what's needed
- **Style guide**: Create visual reference document per game
- **Backup originals**: Keep high-res originals before optimization

---

## Additional Resources

### Gemini Documentation
- [Google AI Studio](https://aistudio.google.com/)
- [Imagen 3 Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview)

### Pixel Art Resources
- [Lospec Palette List](https://lospec.com/palette-list) - Color palettes
- [Piskel](https://www.piskelapp.com/) - Free online pixel art editor
- [Aseprite](https://www.aseprite.org/) - Professional pixel art tool

### Design Inspiration
- [OpenGameArt.org](https://opengameart.org/) - Reference (don't copy!)
- [itch.io game assets](https://itch.io/game-assets) - Style examples

### Testing & Optimization
- [TinyPNG](https://tinypng.com/) - Image compression
- [Photopea](https://www.photopea.com/) - Free online Photoshop alternative
- [Remove.bg](https://www.remove.bg/) - Online background removal

---

## Support & Questions

If you encounter issues or need clarification:

1. **Check the game-specific prompt document** - Most details are there
2. **Review the "Common Issues" section** above
3. **Experiment with prompt variations** - Small changes can improve results
4. **Generate multiple versions** - Pick the best one
5. **Post-process when needed** - Not every asset is perfect first time

---

## Success Metrics

Your assets are ready when:

✅ **Visually cohesive** - All assets for a game look like they belong together  
✅ **Age-appropriate** - Safe and appealing for kids (8-10 years old)  
✅ **Educationally supportive** - Enhance learning without distraction  
✅ **Performance optimized** - Fast loading, smooth gameplay  
✅ **Professionally polished** - Parents and kids both impressed  
✅ **Cross-device compatible** - Works on iPad, desktop, mobile  

---

## Final Notes

**Remember**: Perfect is the enemy of good. Start with functional assets, integrate them into your games, then iterate based on actual gameplay experience. Your kids' feedback will be the best guide for what works and what needs improvement.

**Budget your time**: Generating assets is fun but can be endless. Set a "good enough" bar and move forward. You can always come back to enhance assets later after gameplay testing.

**Have fun with it**: These games are for your kids. Let their interests and feedback guide your asset choices. If Emma loves dragons, make sure there are cool dragons. If Liam likes fast action, emphasize dynamic motion effects.

**Good luck!** 🎨🎮✨

---

*Last Updated: January 24, 2026*  
*Part of the Noyola Hub Game Ecosystem*
