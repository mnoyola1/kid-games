#!/usr/bin/env python3
"""
Music Generation - MANUAL PROCESS

This project uses MANUAL music generation instead of API automation.

Recommended tools:
  - Lyria 2: https://aitestkitchen.withgoogle.com/tools/music-fx (FREE)
  - Suno Pro: https://suno.com ($8/month, commercial rights included)

Save music files to: assets/audio/[game-id]/music/

Example prompts that work well:
  - "educational game menu music, welcoming, magical, loopable, instrumental"
  - "adventure gameplay music, focused but fun, not distracting, instrumental"
  - "victory fanfare, achievement unlocked, triumphant, 10 seconds"
  - "game over music, encouraging to try again, hopeful, short"
  - "boss battle music, intense but kid-friendly, orchestral"
  - "puzzle thinking music, calm, focused, loopable"

Naming convention:
  - menu.wav / menu.mp3
  - gameplay.wav
  - victory.wav
  - gameover.wav
  - boss.wav

Why manual instead of API?
  - Suno has no official API (third-party wrappers are unreliable)
  - Mubert API costs $12-99/month for limited use
  - ElevenLabs Music API not publicly available yet
  - Manual generation with Lyria 2 is free and takes ~2 min per track
  - For 5 tracks per game, manual is faster than debugging API issues
"""

print(__doc__)
print("This is a placeholder. Use Lyria 2 or Suno Pro manually.")
print("See the docstring above for recommended prompts and workflow.")
