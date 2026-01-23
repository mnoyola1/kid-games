#!/usr/bin/env python3
"""
Generate voice/speech using Cartesia API.
Great for game narration, character dialogue, and accessibility features.

Usage:
    python generate_voice.py --text "Great job! You got it right!" --voice cheerful_female --output assets/audio/game/voice/correct.mp3
    python generate_voice.py -t "Welcome to the adventure!" -v calm_male -o assets/audio/game/voice/intro.mp3
    python generate_voice.py -t "Level complete!" --voice-id abc123 -o assets/audio/game/voice/levelup.mp3
"""
import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import CARTESIA_API_KEY, VOICE_DEFAULTS, CARTESIA_VOICES

# Cartesia API endpoint
CARTESIA_TTS_URL = "https://api.cartesia.ai/tts/bytes"


def generate_voice(
    text: str,
    output_path: str,
    voice: str = None,
    voice_id: str = None,
    speed: float = 1.0,
    emotion: str = None,
) -> str:
    """
    Generate speech using Cartesia API.
    
    Args:
        text: Text to speak
        output_path: Where to save the audio file
        voice: Voice preset name (from CARTESIA_VOICES)
        voice_id: Direct Cartesia voice ID (overrides voice)
        speed: Speech speed multiplier (0.5-2.0)
        emotion: Emotion modifier (if supported by voice)
    
    Returns:
        Path to saved file
    """
    try:
        import requests
    except ImportError:
        print("Error: requests package not installed.")
        print("Run: pip install requests")
        sys.exit(1)
    
    if not CARTESIA_API_KEY:
        print("Error: CARTESIA_API_KEY not set in .env or environment")
        sys.exit(1)
    
    # Resolve voice ID
    if voice_id:
        resolved_voice_id = voice_id
    elif voice and voice in CARTESIA_VOICES:
        resolved_voice_id = CARTESIA_VOICES[voice]
    else:
        # Default to cheerful female for games
        resolved_voice_id = CARTESIA_VOICES.get("cheerful_female", list(CARTESIA_VOICES.values())[0] if CARTESIA_VOICES else None)
        if not resolved_voice_id:
            print("Error: No voice ID specified and no defaults configured")
            print(f"Available presets: {', '.join(CARTESIA_VOICES.keys())}")
            sys.exit(1)
    
    # Prepare request
    headers = {
        "X-API-Key": CARTESIA_API_KEY,
        "Cartesia-Version": "2024-06-10",
        "Content-Type": "application/json",
    }
    
    data = {
        "model_id": VOICE_DEFAULTS["model_id"],
        "transcript": text,
        "voice": {
            "mode": "id",
            "id": resolved_voice_id,
        },
        "output_format": {
            "container": "mp3",
            "bit_rate": 128000,
            "sample_rate": VOICE_DEFAULTS["sample_rate"],
        },
    }
    
    # Add speed if not default
    if speed != 1.0:
        data["voice"]["__experimental_controls"] = {
            "speed": "slow" if speed < 0.8 else "fast" if speed > 1.2 else "normal"
        }
    
    print(f"Generating voice: \"{text[:50]}{'...' if len(text) > 50 else ''}\"")
    print(f"  Voice: {voice or voice_id or 'default'}")
    print(f"  Speed: {speed}x")
    
    # Make request
    response = requests.post(CARTESIA_TTS_URL, headers=headers, json=data)
    
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


def list_voices():
    """List available voice presets."""
    print("Available voice presets:")
    for name, voice_id in CARTESIA_VOICES.items():
        print(f"  {name}: {voice_id}")
    print("\nYou can also use --voice-id to specify any Cartesia voice ID directly.")
    print("Browse voices at: https://play.cartesia.ai/")


def main():
    parser = argparse.ArgumentParser(
        description="Generate voice/speech using Cartesia API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Game feedback voices
  python generate_voice.py -t "Great job! You got it right!" -v cheerful_female -o assets/audio/shared/voice/correct.mp3
  python generate_voice.py -t "Oops! Try again!" -v cheerful_female -o assets/audio/shared/voice/wrong.mp3
  python generate_voice.py -t "Level complete! Amazing work!" -v excited_child -o assets/audio/game/voice/levelup.mp3

  # Narration
  python generate_voice.py -t "Welcome to the magical world of learning!" -v calm_male -o assets/audio/game/voice/intro.mp3

  # List available voice presets
  python generate_voice.py --list-voices

Voice presets: cheerful_female, calm_male, excited_child
Or use --voice-id for any Cartesia voice ID
        """
    )
    
    parser.add_argument("--text", "-t", help="Text to speak")
    parser.add_argument("--output", "-o", help="Output file path")
    parser.add_argument("--voice", "-v", choices=list(CARTESIA_VOICES.keys()), help="Voice preset")
    parser.add_argument("--voice-id", help="Direct Cartesia voice ID")
    parser.add_argument("--speed", "-s", type=float, default=1.0, help="Speech speed (0.5-2.0)")
    parser.add_argument("--list-voices", action="store_true", help="List available voice presets")
    
    args = parser.parse_args()
    
    if args.list_voices:
        list_voices()
        return
    
    if not args.text or not args.output:
        parser.error("--text and --output are required (unless using --list-voices)")
    
    generate_voice(
        text=args.text,
        output_path=args.output,
        voice=args.voice,
        voice_id=args.voice_id,
        speed=args.speed,
    )


if __name__ == "__main__":
    main()
