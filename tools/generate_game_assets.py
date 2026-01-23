#!/usr/bin/env python3
"""
Batch generate assets for a new Noyola Hub educational game.

Usage:
    python generate_game_assets.py --game spelling --theme "wizard school" --id spell-wizard
    python generate_game_assets.py --game math --theme "space station" --id math-station --style pixel-art
    python generate_game_assets.py --game adventure --theme "underwater kingdom" --id ocean-quest --dry-run

This generates a standard set of assets appropriate for educational games in the Noyola Hub.
"""
import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Educational game templates for Noyola Hub
# Designed for Emma (10) and Liam (8)
GAME_TEMPLATES = {
    "spelling": {
        "description": "Spelling/vocabulary game (like Spell Siege, Word Forge)",
        "sprites": [
            {"prompt": "friendly player character, student wizard", "filename": "player.png"},
            {"prompt": "word enemy monster, cartoon style", "filename": "enemy_basic.png"},
            {"prompt": "boss enemy, larger word monster", "filename": "enemy_boss.png"},
            {"prompt": "correct answer sparkle effect", "filename": "effect_correct.png"},
            {"prompt": "letter tile, clean readable", "filename": "letter_tile.png"},
            {"prompt": "star collectible, achievement icon", "filename": "star.png"},
        ],
        "backgrounds": [
            {"prompt": "magical classroom, warm and inviting", "filename": "bg_main.png"},
            {"prompt": "game menu background, mystical", "filename": "bg_menu.png"},
        ],
        "music": [
            {"prompt": "educational game menu music, welcoming and magical", "filename": "music/menu.wav", "duration": 60},
            {"prompt": "learning gameplay music, focused but fun, not distracting", "filename": "music/gameplay.wav", "duration": 120},
            {"prompt": "victory celebration, achievement unlocked feel", "filename": "music/victory.wav", "duration": 10},
            {"prompt": "game over music, encouraging to try again", "filename": "music/gameover.wav", "duration": 8},
        ],
        "sfx": [
            {"prompt": "correct answer chime, positive rewarding", "filename": "sfx/correct.mp3", "duration": 0.5},
            {"prompt": "wrong answer sound, gentle not harsh", "filename": "sfx/wrong.mp3", "duration": 0.5},
            {"prompt": "letter typing click", "filename": "sfx/type.mp3", "duration": 0.2},
            {"prompt": "word complete whoosh, satisfying", "filename": "sfx/word_complete.mp3", "duration": 0.8},
            {"prompt": "level up fanfare", "filename": "sfx/levelup.mp3", "duration": 1.5},
            {"prompt": "coin collect", "filename": "sfx/coin.mp3", "duration": 0.3},
        ],
        "voice": [
            {"text": "Great job! You spelled it correctly!", "filename": "voice/correct.mp3"},
            {"text": "Oops! Try again!", "filename": "voice/wrong.mp3"},
            {"text": "Level complete! Amazing work!", "filename": "voice/levelup.mp3"},
        ],
    },
    "math": {
        "description": "Math/logic game",
        "sprites": [
            {"prompt": "student character, thinking pose", "filename": "player.png"},
            {"prompt": "number block, clean and readable", "filename": "number_block.png"},
            {"prompt": "math operator symbol, plus minus", "filename": "operator.png"},
            {"prompt": "checkmark success icon", "filename": "check.png"},
            {"prompt": "hint lightbulb icon", "filename": "hint.png"},
            {"prompt": "trophy achievement icon", "filename": "trophy.png"},
        ],
        "backgrounds": [
            {"prompt": "futuristic classroom, high-tech learning environment", "filename": "bg_main.png"},
            {"prompt": "space-themed math background, stars and equations", "filename": "bg_space.png"},
        ],
        "music": [
            {"prompt": "thinking music, calm focus, good for concentration", "filename": "music/main.wav", "duration": 120},
            {"prompt": "success celebration, short triumphant", "filename": "music/victory.wav", "duration": 8},
            {"prompt": "menu music, inviting educational game", "filename": "music/menu.wav", "duration": 60},
        ],
        "sfx": [
            {"prompt": "correct calculation ding", "filename": "sfx/correct.mp3", "duration": 0.5},
            {"prompt": "incorrect buzz, encouraging not harsh", "filename": "sfx/wrong.mp3", "duration": 0.5},
            {"prompt": "number click", "filename": "sfx/click.mp3", "duration": 0.2},
            {"prompt": "problem solved fanfare", "filename": "sfx/solved.mp3", "duration": 1.0},
            {"prompt": "streak bonus sound", "filename": "sfx/streak.mp3", "duration": 0.8},
        ],
        "voice": [
            {"text": "Correct! Great math skills!", "filename": "voice/correct.mp3"},
            {"text": "Not quite. Give it another try!", "filename": "voice/wrong.mp3"},
        ],
    },
    "geography": {
        "description": "Geography/exploration game (like Canada Adventure)",
        "sprites": [
            {"prompt": "explorer character, adventurous student", "filename": "player.png"},
            {"prompt": "map marker pin icon", "filename": "marker.png"},
            {"prompt": "compass icon", "filename": "compass.png"},
            {"prompt": "regional monster, friendly challenge", "filename": "monster.png"},
            {"prompt": "treasure chest, discovery reward", "filename": "chest.png"},
            {"prompt": "flag icon, country marker", "filename": "flag.png"},
        ],
        "backgrounds": [
            {"prompt": "world map background, stylized educational", "filename": "bg_map.png"},
            {"prompt": "adventure scene, exploration setting", "filename": "bg_adventure.png"},
            {"prompt": "victory podium, achievement display", "filename": "bg_victory.png"},
        ],
        "music": [
            {"prompt": "adventure exploration theme, discovering new places", "filename": "music/exploration.wav", "duration": 120},
            {"prompt": "discovery fanfare, found something new", "filename": "music/discovery.wav", "duration": 10},
            {"prompt": "battle music, quiz challenge", "filename": "music/challenge.wav", "duration": 60},
            {"prompt": "victory theme, journey complete", "filename": "music/victory.wav", "duration": 12},
        ],
        "sfx": [
            {"prompt": "map marker placed", "filename": "sfx/marker.mp3", "duration": 0.3},
            {"prompt": "correct location chime", "filename": "sfx/correct.mp3", "duration": 0.5},
            {"prompt": "wrong location buzz", "filename": "sfx/wrong.mp3", "duration": 0.5},
            {"prompt": "treasure found", "filename": "sfx/treasure.mp3", "duration": 1.0},
            {"prompt": "travel whoosh", "filename": "sfx/travel.mp3", "duration": 0.8},
        ],
        "voice": [
            {"text": "You found it! Great geography skills!", "filename": "voice/correct.mp3"},
            {"text": "That's not quite right. Check the map again!", "filename": "voice/wrong.mp3"},
        ],
    },
    "typing": {
        "description": "Typing/speed game (like Lumina Racer)",
        "sprites": [
            {"prompt": "racing character, fast and focused", "filename": "player.png"},
            {"prompt": "opponent racer character", "filename": "opponent.png"},
            {"prompt": "speed boost power-up", "filename": "boost.png"},
            {"prompt": "finish line flag", "filename": "finish.png"},
            {"prompt": "keyboard key icon", "filename": "key.png"},
        ],
        "backgrounds": [
            {"prompt": "racing track background, dynamic motion", "filename": "bg_track.png"},
            {"prompt": "finish line celebration", "filename": "bg_finish.png"},
            {"prompt": "character select screen", "filename": "bg_select.png"},
        ],
        "music": [
            {"prompt": "racing game music, high energy typing speed", "filename": "music/race.wav", "duration": 90},
            {"prompt": "menu music, ready to race", "filename": "music/menu.wav", "duration": 60},
            {"prompt": "victory lap music, winner celebration", "filename": "music/victory.wav", "duration": 12},
            {"prompt": "countdown music, race starting tension", "filename": "music/countdown.wav", "duration": 10},
        ],
        "sfx": [
            {"prompt": "key press click, typing", "filename": "sfx/keypress.mp3", "duration": 0.1},
            {"prompt": "speed boost whoosh", "filename": "sfx/boost.mp3", "duration": 0.5},
            {"prompt": "race start horn", "filename": "sfx/start.mp3", "duration": 1.0},
            {"prompt": "finish line crossing", "filename": "sfx/finish.mp3", "duration": 1.5},
            {"prompt": "word completed ding", "filename": "sfx/word.mp3", "duration": 0.3},
        ],
        "voice": [
            {"text": "Ready, set, type!", "filename": "voice/start.mp3"},
            {"text": "You win! Incredible typing speed!", "filename": "voice/win.mp3"},
        ],
    },
    "adventure": {
        "description": "Story-driven adventure (like Shadows in the Halls)",
        "sprites": [
            {"prompt": "hero character, brave student", "filename": "hero.png"},
            {"prompt": "companion character, helpful friend", "filename": "companion.png"},
            {"prompt": "mysterious NPC character", "filename": "npc.png"},
            {"prompt": "collectible item, glowing artifact", "filename": "artifact.png"},
            {"prompt": "clue item, mystery element", "filename": "clue.png"},
            {"prompt": "door or portal", "filename": "door.png"},
        ],
        "backgrounds": [
            {"prompt": "mysterious hallway, adventure setting", "filename": "bg_hallway.png"},
            {"prompt": "magical library, discovery room", "filename": "bg_library.png"},
            {"prompt": "secret chamber, reveal moment", "filename": "bg_secret.png"},
            {"prompt": "outdoor scene, exploration area", "filename": "bg_outdoor.png"},
        ],
        "music": [
            {"prompt": "mysterious exploration music, adventure discovery", "filename": "music/exploration.wav", "duration": 120},
            {"prompt": "tension music, suspenseful moment", "filename": "music/tension.wav", "duration": 60},
            {"prompt": "discovery theme, found something important", "filename": "music/discovery.wav", "duration": 15},
            {"prompt": "victory theme, adventure complete", "filename": "music/victory.wav", "duration": 20},
            {"prompt": "calm safe area music", "filename": "music/safe.wav", "duration": 90},
        ],
        "sfx": [
            {"prompt": "footsteps walking", "filename": "sfx/footsteps.mp3", "duration": 1.0},
            {"prompt": "door opening creak", "filename": "sfx/door.mp3", "duration": 1.0},
            {"prompt": "item pickup sparkle", "filename": "sfx/pickup.mp3", "duration": 0.5},
            {"prompt": "clue discovered chime", "filename": "sfx/clue.mp3", "duration": 0.8},
            {"prompt": "dialogue text appear", "filename": "sfx/text.mp3", "duration": 0.2},
            {"prompt": "mystery reveal sound", "filename": "sfx/reveal.mp3", "duration": 1.5},
        ],
        "voice": [
            {"text": "What could this be?", "filename": "voice/discovery.mp3"},
            {"text": "I found a clue!", "filename": "voice/clue.mp3"},
        ],
    },
}


def apply_theme(items: list[dict], theme: str, style: str = None) -> list[dict]:
    """Apply a theme to asset prompts."""
    themed = []
    for item in items:
        new_item = item.copy()
        if "prompt" in new_item:
            new_item["prompt"] = f"{theme}, {item['prompt']}"
        if style:
            new_item["style"] = style
        themed.append(new_item)
    return themed


def main():
    parser = argparse.ArgumentParser(
        description="Generate assets for a new Noyola Hub educational game",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Spelling game with wizard theme
  python generate_game_assets.py --game spelling --theme "wizard school magic" --id spell-wizard --style pixel-art

  # Math game with space theme  
  python generate_game_assets.py --game math --theme "space station futuristic" --id math-space --style flat

  # Geography game
  python generate_game_assets.py --game geography --theme "world explorer adventure" --id world-quest --style painterly

  # Preview without generating
  python generate_game_assets.py --game adventure --theme "haunted school mystery" --id mystery-halls --dry-run

Game types: spelling, math, geography, typing, adventure
Styles: pixel-art, 8-bit, 16-bit, painterly, realistic, cartoon, flat, anime

Assets are saved to: assets/audio/[game-id]/ and assets/sprites/, assets/backgrounds/
        """,
    )
    parser.add_argument("--game", "-g", required=True, choices=GAME_TEMPLATES.keys(), help="Game type")
    parser.add_argument("--theme", "-t", required=True, help="Visual theme (e.g., 'wizard school', 'space station')")
    parser.add_argument("--id", required=True, help="Game ID for folder naming (e.g., 'spell-wizard')")
    parser.add_argument("--style", "-s", choices=["pixel-art", "8-bit", "16-bit", "painterly", "realistic", "cartoon", "flat", "anime"])
    parser.add_argument("--skip-images", action="store_true", help="Skip image generation")
    parser.add_argument("--skip-music", action="store_true", help="Skip music generation")
    parser.add_argument("--skip-sfx", action="store_true", help="Skip sound effect generation")
    parser.add_argument("--skip-voice", action="store_true", help="Skip voice generation")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated without doing it")
    
    args = parser.parse_args()
    
    template = GAME_TEMPLATES[args.game]
    game_id = args.id
    
    print(f"=== Generating assets for Noyola Hub game: {game_id} ===")
    print(f"Type: {args.game} - {template['description']}")
    print(f"Theme: {args.theme}")
    print(f"Style: {args.style or 'default'}")
    print()
    
    # Prepare all assets with theme applied
    sprites = apply_theme(template.get("sprites", []), args.theme, args.style)
    backgrounds = apply_theme(template.get("backgrounds", []), args.theme, args.style)
    music = template.get("music", [])
    sfx = template.get("sfx", [])
    voice = template.get("voice", [])
    
    # Update music/sfx/voice paths to include game ID
    for item in music:
        item["filename"] = f"{game_id}/{item['filename']}"
        item["prompt"] = f"{args.theme}, {item['prompt']}"
    for item in sfx:
        item["filename"] = f"{game_id}/{item['filename']}"
    for item in voice:
        item["filename"] = f"{game_id}/{item['filename']}"
    
    if args.dry_run:
        print("DRY RUN - Would generate:")
        print(f"\nSprites ({len(sprites)}) → assets/sprites/")
        for s in sprites:
            print(f"  - {s['filename']}: {s['prompt'][:60]}...")
        print(f"\nBackgrounds ({len(backgrounds)}) → assets/backgrounds/")
        for b in backgrounds:
            print(f"  - {b['filename']}: {b['prompt'][:60]}...")
        print(f"\nMusic ({len(music)}) → assets/audio/{game_id}/music/")
        for m in music:
            print(f"  - {m['filename'].split('/')[-1]}: {m['prompt'][:50]}... ({m.get('duration', 60)}s)")
        print(f"\nSound Effects ({len(sfx)}) → assets/audio/{game_id}/sfx/")
        for s in sfx:
            print(f"  - {s['filename'].split('/')[-1]}: {s['prompt'][:50]}... ({s.get('duration', 'auto')}s)")
        print(f"\nVoice Lines ({len(voice)}) → assets/audio/{game_id}/voice/")
        for v in voice:
            print(f"  - {v['filename'].split('/')[-1]}: \"{v['text'][:40]}...\"")
        
        print(f"\n--- Estimated Cost ---")
        image_count = len(sprites) + len(backgrounds)
        print(f"Images (Gemini): ~${image_count * 0.04:.2f} ({image_count} × $0.04)")
        print(f"Music (Suno):    ~${len(music) * 0.03:.2f} ({len(music)} × $0.03)")
        print(f"SFX (11Labs):    ~${len(sfx) * 0.02:.2f} ({len(sfx)} × $0.02)")
        print(f"Voice (Cartesia):~${len(voice) * 0.01:.2f} ({len(voice)} × $0.01)")
        print(f"Total:           ~${image_count * 0.04 + len(music) * 0.03 + len(sfx) * 0.02 + len(voice) * 0.01:.2f}")
        return
    
    from generate_image import generate_image
    from generate_sfx import generate_sfx
    from generate_voice import generate_voice
    import time
    
    generated = {"sprites": [], "backgrounds": [], "music": [], "sfx": [], "voice": []}
    
    # Generate sprites
    if not args.skip_images and sprites:
        print(f"\n--- Generating {len(sprites)} sprites ---")
        for item in sprites:
            output = f"assets/sprites/{item['filename']}"
            try:
                path = generate_image(
                    prompt=item["prompt"],
                    output_path=output,
                    style=item.get("style"),
                    asset_type="sprite",
                )
                generated["sprites"].extend(path if isinstance(path, list) else [path])
                time.sleep(1)
            except Exception as e:
                print(f"  Error: {e}")
    
    # Generate backgrounds
    if not args.skip_images and backgrounds:
        print(f"\n--- Generating {len(backgrounds)} backgrounds ---")
        for item in backgrounds:
            output = f"assets/backgrounds/{item['filename']}"
            try:
                path = generate_image(
                    prompt=item["prompt"],
                    output_path=output,
                    style=item.get("style"),
                    asset_type="background",
                )
                generated["backgrounds"].extend(path if isinstance(path, list) else [path])
                time.sleep(1)
            except Exception as e:
                print(f"  Error: {e}")
    
    # Generate music (requires Suno API key)
    if not args.skip_music and music:
        print(f"\n--- Music generation requires SUNO_API_KEY ---")
        print(f"  Skipping {len(music)} tracks. Use Lyria 2 manually or add SUNO_API_KEY to .env")
    
    # Generate SFX
    if not args.skip_sfx and sfx:
        print(f"\n--- Generating {len(sfx)} sound effects ---")
        for item in sfx:
            output = f"assets/audio/{item['filename']}"
            try:
                path = generate_sfx(
                    prompt=item["prompt"],
                    output_path=output,
                    duration=item.get("duration"),
                )
                generated["sfx"].append(path)
                time.sleep(1)
            except Exception as e:
                print(f"  Error: {e}")
    
    # Generate voice
    if not args.skip_voice and voice:
        print(f"\n--- Generating {len(voice)} voice lines ---")
        for item in voice:
            output = f"assets/audio/{item['filename']}"
            try:
                path = generate_voice(
                    text=item["text"],
                    output_path=output,
                    voice="cheerful_female",
                )
                generated["voice"].append(path)
                time.sleep(1)
            except Exception as e:
                print(f"  Error: {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print(f"GENERATION COMPLETE FOR: {game_id}")
    print("=" * 50)
    print(f"Sprites:     {len(generated['sprites'])}")
    print(f"Backgrounds: {len(generated['backgrounds'])}")
    print(f"Music:       {len(generated['music'])} (manual via Lyria 2)")
    print(f"SFX:         {len(generated['sfx'])}")
    print(f"Voice:       {len(generated['voice'])}")
    print(f"\nAssets saved to:")
    print(f"  - assets/sprites/")
    print(f"  - assets/backgrounds/")
    print(f"  - assets/audio/{game_id}/")


if __name__ == "__main__":
    main()
