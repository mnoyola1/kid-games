#!/usr/bin/env python3
"""
Generate sound effects using ElevenLabs API.

Usage:
    python generate_sfx.py --prompt "coin collect chime" --duration 0.5 --output assets/audio/game/sfx/coin.mp3
    python generate_sfx.py -p "explosion boom" -d 1.5 -o assets/audio/game/sfx/explosion.mp3
    python generate_sfx.py -p "footsteps on wood" -o assets/audio/game/sfx/footsteps.mp3
"""
import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import ELEVENLABS_API_KEY, SFX_DEFAULTS

# ElevenLabs Sound Effects API endpoint
ELEVENLABS_SFX_URL = "https://api.elevenlabs.io/v1/sound-generation"


def generate_sfx(
    prompt: str,
    output_path: str,
    duration: float = None,
    output_format: str = None,
) -> str:
    """
    Generate a sound effect using ElevenLabs API.
    
    Args:
        prompt: Description of the sound effect
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
    
    # Prepare request
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    
    data = {
        "text": prompt,
    }
    
    if duration is not None:
        if duration < 0.5 or duration > 22:
            print(f"Warning: Duration {duration}s outside valid range (0.5-22), using auto")
        else:
            data["duration_seconds"] = duration
    
    # Add output format to URL if specified
    url = ELEVENLABS_SFX_URL
    if output_format:
        url += f"?output_format={output_format}"
    
    print(f"Generating SFX: {prompt[:50]}...")
    print(f"  Duration: {duration or 'auto'}s")
    
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
    
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Generate sound effects using ElevenLabs API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Short UI sounds
  python generate_sfx.py -p "button click" -d 0.2 -o assets/audio/shared/sfx/click.mp3
  python generate_sfx.py -p "correct answer chime, positive" -d 0.5 -o assets/audio/shared/sfx/correct.mp3
  python generate_sfx.py -p "wrong answer buzz, gentle" -d 0.5 -o assets/audio/shared/sfx/wrong.mp3

  # Game effects
  python generate_sfx.py -p "coin collect, satisfying" -d 0.3 -o assets/audio/game/sfx/coin.mp3
  python generate_sfx.py -p "level up fanfare" -d 1.5 -o assets/audio/game/sfx/levelup.mp3
  python generate_sfx.py -p "explosion, cartoony" -d 1.0 -o assets/audio/game/sfx/explosion.mp3

  # Ambient/longer sounds
  python generate_sfx.py -p "footsteps walking on grass" -d 2.0 -o assets/audio/game/sfx/footsteps.mp3
  python generate_sfx.py -p "door creaking open slowly" -d 1.5 -o assets/audio/game/sfx/door.mp3

Duration: 0.5-22 seconds (omit for automatic)
        """
    )
    
    parser.add_argument("--prompt", "-p", required=True, help="Sound effect description")
    parser.add_argument("--output", "-o", required=True, help="Output file path")
    parser.add_argument("--duration", "-d", type=float, help="Duration in seconds (0.5-22)")
    parser.add_argument("--format", "-f", default="mp3_44100_128", help="Output format")
    
    args = parser.parse_args()
    
    generate_sfx(
        prompt=args.prompt,
        output_path=args.output,
        duration=args.duration,
        output_format=args.format,
    )


if __name__ == "__main__":
    main()
