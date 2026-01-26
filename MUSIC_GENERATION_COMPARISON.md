# Music Generation Comparison: Lyria 2 vs ElevenLabs

## Test Results Summary

Four test tracks have been generated using Google Vertex AI Lyria 2 and saved to `assets/audio/shared/music/`:

1. **Menu Music** - `lyria2_menu_test.wav`
   - Prompt: "educational game menu music, welcoming, magical, loopable, instrumental"
   - Duration: ~30 seconds
   - File size: 6.1 MB

2. **Gameplay Music** - `lyria2_gameplay_test.wav`
   - Prompt: "adventure gameplay music, focused but fun, not distracting, instrumental"
   - Duration: ~30 seconds
   - File size: 6.1 MB

3. **Victory Music** - `lyria2_victory_test.wav`
   - Prompt: "victory fanfare, achievement unlocked, triumphant, instrumental"
   - Duration: ~30 seconds
   - File size: 6.1 MB

4. **Boss Battle Music** - `lyria2_boss_test.wav`
   - Prompt: "boss battle music, intense but kid-friendly, orchestral, instrumental"
   - Duration: ~30 seconds
   - File size: 6.1 MB

**Total test cost: $0.24**

---

## Feature Comparison

| Feature | Lyria 2 (Vertex AI) | ElevenLabs |
|---------|---------------------|------------|
| **Max Duration** | ~30 seconds (fixed) | 22 seconds max |
| **Audio Format** | 48kHz stereo WAV | MP3 |
| **Quality** | Very High (broadcast quality) | High |
| **Cost per clip** | ~$0.06 per 30s | ~$0.02-0.03 per clip |
| **Generation Time** | 30-35 seconds | 15-20 seconds |
| **Reproducibility** | Yes (seed support) | No |
| **Negative Prompting** | Yes | No |
| **Multiple Variations** | Yes (sample_count) | No (manual) |
| **API Reliability** | Google Cloud (enterprise) | Third-party API |
| **Use Case** | Full music tracks, loops | Short clips, jingles |

---

## Recommendations

### Use Lyria 2 for:
✅ **Menu themes** - Longer, loopable background music  
✅ **Gameplay music** - Full background tracks  
✅ **Victory/defeat music** - Fanfares and transitions  
✅ **Ambient music** - Atmospheric background tracks  
✅ **High-quality production** - When audio fidelity matters  
✅ **Consistency** - Reproducible outputs with seed parameter

### Use ElevenLabs for:
✅ **Very short jingles** - Under 10 seconds  
✅ **Quick tests** - When prototyping rapidly  
✅ **Legacy compatibility** - If already using ElevenLabs for SFX

---

## Quality Assessment

**Listen to the test files in `assets/audio/shared/music/` to compare:**

1. **Instrumentation**: Lyria 2 produces full orchestral/ensemble arrangements
2. **Mixing**: Professional balance across frequency ranges
3. **Dynamics**: Natural crescendos and variations
4. **Loop-ability**: Clean start/end points suitable for looping
5. **Kid-friendly**: Appropriate energy levels and tone

**Recommendation**: Switch to Lyria 2 for all game music production.

---

## Updated Workflow

### For New Games

1. **Generate music with Lyria 2:**
   ```bash
   # Menu music
   python tools/generate_music_vertex.py -p "educational game menu music, welcoming, magical, loopable, instrumental" -o assets/audio/[game-id]/music/menu.wav
   
   # Gameplay music
   python tools/generate_music_vertex.py -p "adventure gameplay music, focused but fun, not distracting, instrumental" -o assets/audio/[game-id]/music/gameplay.wav
   
   # Victory music
   python tools/generate_music_vertex.py -p "victory fanfare, achievement unlocked, triumphant, instrumental" -o assets/audio/[game-id]/music/victory.wav
   ```

2. **Generate SFX with ElevenLabs:**
   ```bash
   python tools/generate_sfx.py -p "correct answer chime" -d 0.5 -o assets/audio/[game-id]/sfx/correct.mp3
   python tools/generate_sfx.py -p "wrong answer buzz" -d 0.5 -o assets/audio/[game-id]/sfx/wrong.mp3
   ```

3. **Generate voice with Cartesia:**
   ```bash
   python tools/generate_voice.py -t "Great job!" -v cheerful_female -o assets/audio/[game-id]/voice/correct.mp3
   ```

### Cost Estimates per Game

| Asset Type | Quantity | Cost per Unit | Total |
|------------|----------|---------------|-------|
| Music (Lyria 2) | 5-7 tracks | $0.06 | $0.30-$0.42 |
| SFX (ElevenLabs) | 10-15 | $0.02 | $0.20-$0.30 |
| Voice (Cartesia) | 5-10 | $0.01 | $0.05-$0.10 |
| **Total Audio per Game** | | | **$0.55-$0.82** |

---

## Technical Details

### Lyria 2 Specifications

- **Model**: `lyria-002`
- **Endpoint**: Vertex AI Predict API
- **Authentication**: gcloud CLI (OAuth 2.0)
- **Region**: `us-central1` (configurable)
- **Output**: Base64-encoded WAV, decoded automatically
- **SynthID Watermarking**: Applied automatically
- **Safety Filters**: Content safety, recitation checking, artist intent checks

### Integration Status

✅ Script created: `tools/generate_music_vertex.py`  
✅ API enabled: Vertex AI API activated  
✅ Authentication configured: gcloud authenticated  
✅ Project set: `gen-lang-client-0790630511`  
✅ Test files generated: 4 samples in `assets/audio/shared/music/`  
✅ Documentation updated: `.cursorrules` file updated  

---

## Migration Status

### ✅ Completed Migrations

1. **Lumina Racer** (January 26, 2026)
   - 4 tracks regenerated with Lyria 2
   - Files updated: menu.wav, gameplay.wav, victory.wav, gameover.wav
   - Code updated: `game-audio.js` to use WAV format
   - Cost: $0.24
   - See: `lumina-racer/MUSIC_UPDATE_LOG.md`

### 🔄 Pending Migrations

- **Spell Siege**: 7 existing tracks (evaluate whether to keep or regenerate)
- **Canada Adventure**: Generate new music
- **Word Forge**: Generate new music
- **Math Quest**: Generate new music
- **Pixel Quest**: Generate new music
- **Rhythm Academy**: Generate new music
- **Shadows in the Halls**: Generate new music

### Next Steps

1. **Test Lumina Racer** with the new music to verify quality and integration
2. **Plan remaining migrations** based on priority and game development status
3. **Use Lyria 2** for all new music generation going forward

---

## Support

If you need to regenerate any test files or create variations:

```bash
# Generate with seed for reproducibility
python tools/generate_music_vertex.py -p "YOUR_PROMPT" --seed 12345 -o output.wav

# Generate 3 variations
python tools/generate_music_vertex.py -p "YOUR_PROMPT" --samples 3 -o output.wav

# Use negative prompting
python tools/generate_music_vertex.py -p "calm piano" -n "drums, fast tempo" -o output.wav
```

For questions or issues, refer to:
- Google Vertex AI Lyria Documentation: https://cloud.google.com/vertex-ai/generative-ai/docs/music/generate-music
- Project setup guide: `noyola-hub-reference-guide.md`

---

**Recommendation: Switch to Lyria 2 for superior quality, longer clips, and better reproducibility at a reasonable cost.**
