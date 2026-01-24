#!/usr/bin/env python3
"""
Generate music tracks using ElevenLabs API.

Usage:
    python generate_music.py --prompt "educational game menu music, welcoming, magical, loopable, instrumental" --duration 20 --output assets/audio/game/music/menu.mp3
    python generate_music.py -p "adventure gameplay music, focused but fun, not distracting, instrumental" -d 22 -o assets/audio/game/music/gameplay.mp3
    python generate_music.py -p "victory fanfare, achievement unlocked, triumphant" -d 5 -o assets/audio/game/music/victory.mp3
"""
import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import ELEVENLABS_API_KEY, MUSIC_DEFAULTS

# ElevenLabs Sound Generation API endpoint (same as SFX, but used for music)
ELEVENLABS_MUSIC_URL = "https://api.elevenlabs.io/v1/sound-generation"


def generate_music(
    prompt: str,
    output_path: str,
    duration: float = None,
    output_format: str = None,
) -> str:
    """
    Generate a music track using ElevenLabs API.
    
    Args:
        prompt: Description of the music track (should include "instrumental" for game music)
        output_path: Where to save the audio file
        duration: Duration in seconds (0.5-22, or None for auto)
        output_format: Audio format (mp3_44100_128, pcm_48000, etc.)
    
    Returns:
        Path to saved file
    """
    try:
        import requests
    except ImportError:
        print("Error: requests package not installed.")
        print("Run: pip install requests")
        sys.exit(1)
    
    if not ELEVENLABS_API_KEY:
        print("Error: ELEVENLABS_API_KEY not set in .env or environment")
        sys.exit(1)
    
    # Use default duration from config if not specified
    if duration is None:
        duration = MUSIC_DEFAULTS.get("duration_seconds", 20)
    
    # Ensure duration is within valid range (0.5-22 seconds)
    if duration < 0.5 or duration > 22:
        print(f"Warning: Duration {duration}s outside valid range (0.5-22), clamping to valid range")
        duration = max(0.5, min(22, duration))
    
    # Prepare request
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    
    data = {
        "text": prompt,
        "duration_seconds": duration,
    }
    
    # Add output format to URL if specified
    url = ELEVENLABS_MUSIC_URL
    if output_format:
        url += f"?output_format={output_format}"
    elif MUSIC_DEFAULTS.get("output_format"):
        url += f"?output_format={MUSIC_DEFAULTS['output_format']}"
    
    print(f"Generating music: {prompt[:60]}...")
    print(f"  Duration: {duration}s")
    print(f"  Output: {output_path}")
    
    # Make request
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code != 200:
        print(f"  Error: API returned {response.status_code}")
        try:
            error_detail = response.json()
            print(f"  Detail: {error_detail}")
        except:
            print(f"  Response: {response.text[:200]}")
        sys.exit(1)
    
    # Save audio
    output_dir = Path(output_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'wb') as f:
        f.write(response.content)
    
    file_size = len(response.content) / 1024
    print(f"  Saved: {output_path} ({file_size:.1f} KB)")
    print(f"  Note: For longer loops, you may need to concatenate multiple files or use audio editing software")
    
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Generate music tracks using ElevenLabs API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Menu/background music (longer loops)
  python generate_music.py -p "educational game menu music, welcoming, magical, loopable, instrumental" -d 20 -o assets/audio/shared/music/menu.mp3
  python generate_music.py -p "adventure gameplay music, focused but fun, not distracting, instrumental" -d 22 -o assets/audio/game/music/gameplay.mp3
  python generate_music.py -p "puzzle thinking music, calm, focused, loopable, instrumental" -d 18 -o assets/audio/game/music/puzzle.mp3

  # Short tracks
  python generate_music.py -p "victory fanfare, achievement unlocked, triumphant, instrumental" -d 5 -o assets/audio/shared/music/victory.mp3
  python generate_music.py -p "game over music, encouraging to try again, hopeful, short, instrumental" -d 3 -o assets/audio/shared/music/gameover.mp3
  python generate_music.py -p "level up fanfare, celebratory, instrumental" -d 2 -o assets/audio/shared/music/levelup.mp3

  # Themed music
  python generate_music.py -p "boss battle music, intense but kid-friendly, orchestral, instrumental" -d 15 -o assets/audio/game/music/boss.mp3
  python generate_music.py -p "fantasy adventure music, epic but playful, instrumental" -d 20 -o assets/audio/game/music/adventure.mp3
  python generate_music.py -p "space exploration music, mysterious but fun, electronic, instrumental" -d 18 -o assets/audio/game/music/space.mp3

Duration: 0.5-22 seconds (ElevenLabs limit)
For longer loops: Generate multiple segments and concatenate, or loop in-game

Tip: Always include "instrumental" in prompts for game music (no vocals)
        """
    )
    
    parser.add_argument("--prompt", "-p", required=True, help="Music description (include 'instrumental' for game music)")
    parser.add_argument("--output", "-o", required=True, help="Output file path")
    parser.add_argument("--duration", "-d", type=float, help="Duration in seconds (0.5-22, default: 20)")
    parser.add_argument("--format", "-f", help="Output format (default: mp3_44100_128)")
    
    args = parser.parse_args()
    
    generate_music(
        prompt=args.prompt,
        output_path=args.output,
        duration=args.duration,
        output_format=args.format,
    )


if __name__ == "__main__":
    main()
