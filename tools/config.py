"""
Configuration for AI asset generation tools.
Configured for Noyola Hub project structure.

API keys are loaded from .env file or environment variables.
"""
import os
from pathlib import Path

# Load .env file if it exists
def load_env():
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ.setdefault(key.strip(), value.strip())

load_env()

# API Keys - loaded from .env or environment variables
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
CARTESIA_API_KEY = os.getenv("CARTESIA_API_KEY")
SUNO_API_KEY = os.getenv("SUNO_API_KEY")  # From third-party provider like sunoapi.org

# Default output directories (matches Noyola Hub structure)
DEFAULT_SPRITE_DIR = "assets/sprites"
DEFAULT_BACKGROUND_DIR = "assets/backgrounds"
DEFAULT_MUSIC_DIR = "assets/audio"      # Music goes in assets/audio/[game-id]/music/
DEFAULT_SFX_DIR = "assets/audio"        # SFX goes in assets/audio/[game-id]/sfx/
DEFAULT_VOICE_DIR = "assets/audio"      # Voice goes in assets/audio/[game-id]/voice/

# Image generation defaults (Google Gemini / Nano Banana)
IMAGE_DEFAULTS = {
    # Gemini 2.5 Flash with image generation - good balance of speed/cost (~$0.04/image)
    "model": "gemini-2.0-flash-exp",
    # For better quality and text rendering
    "model_quality": "imagen-3.0-generate-002",
    "size": "1024x1024",
    "game_sprite_size": "512x512",
    "pixel_art_size": "256x256",
}

# Music generation defaults (ElevenLabs)
MUSIC_DEFAULTS = {
    "duration_seconds": 20,      # Max 22 seconds (ElevenLabs limit), good for loops
    "output_format": "mp3_44100_128",  # Standard MP3 format
    "instrumental": True,        # No vocals for game music (hint for prompts)
}

# Sound effects defaults (ElevenLabs)
SFX_DEFAULTS = {
    "duration_seconds": 1,
    "output_format": "mp3_44100_128",
}

# Voice synthesis defaults (Cartesia)
VOICE_DEFAULTS = {
    "model_id": "sonic-2",  # Cartesia's latest model
    "output_format": "mp3",
    "sample_rate": 44100,
}

# Cartesia voice presets (add more as needed)
CARTESIA_VOICES = {
    "cheerful_female": "a0e99841-438c-4a64-b679-ae501e7d6091",  # Friendly, encouraging
    "calm_male": "ee7ea9f8-c0c1-498c-9f62-dc2571f99444",        # Narrator style
    "excited_child": "2ee87190-8f84-4925-97da-e52547f9462c",    # Young, energetic
    # You can add more voice IDs from Cartesia's library
}

# Noyola Hub game types for batch generation
NOYOLA_GAME_TYPES = {
    "spelling": {
        "description": "Spelling/vocabulary educational game",
        "suggested_style": "pixel-art",
        "music_style": "chiptune",
    },
    "geography": {
        "description": "Geography/exploration educational game", 
        "suggested_style": "painterly",
        "music_style": "orchestral",
    },
    "typing": {
        "description": "Typing/speed educational game",
        "suggested_style": "cartoon",
        "music_style": "electronic",
    },
    "math": {
        "description": "Math/logic educational game",
        "suggested_style": "flat",
        "music_style": "lofi",
    },
    "adventure": {
        "description": "Story-driven adventure game",
        "suggested_style": "painterly",
        "music_style": "fantasy",
    },
}
