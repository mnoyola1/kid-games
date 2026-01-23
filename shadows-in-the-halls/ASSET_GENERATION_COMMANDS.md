# Asset Generation Commands for Shadows in the Halls

Run these commands to generate all game assets:

## Sprite Assets

```bash
# Player
python tools/generate_image.py -p "top-down pixel art character sprite, elementary school kid with backpack and flashlight, simple, cute but slightly scared expression, 64x64 pixels" -t sprite -s pixel-art -o assets/sprites/shadows-in-the-halls/player.png

# Enemies
python tools/generate_image.py -p "shadow creature lurker, dark purple and black silhouette, humanoid shape, glowing eyes, ethereal, not too scary for kids, pixel art, 48x48" -t sprite -s pixel-art -o assets/sprites/shadows-in-the-halls/shadow_lurker.png

python tools/generate_image.py -p "shadow chaser creature, fast moving shadow, elongated form, glowing red eyes, pixel art, 48x48" -t sprite -s pixel-art -o assets/sprites/shadows-in-the-halls/shadow_chaser.png

# Items
python tools/generate_image.py -p "battery icon, yellow and black AA battery, pixel art, 32x32" -t sprite -s pixel-art -o assets/sprites/shadows-in-the-halls/battery_icon.png

python tools/generate_image.py -p "red key icon, old school key, pixel art, 32x32" -t sprite -s pixel-art -o assets/sprites/shadows-in-the-halls/key_red.png

python tools/generate_image.py -p "blue key icon, old school key, pixel art, 32x32" -t sprite -s pixel-art -o assets/sprites/shadows-in-the-halls/key_blue.png

python tools/generate_image.py -p "exit sign glowing green, emergency exit, pixel art, 64x32" -t sprite -s pixel-art -o assets/sprites/shadows-in-the-halls/exit_sign.png
```

## Background Assets

```bash
# Hallway
python tools/generate_image.py -p "dark school hallway at night, lockers on sides, moonlight through windows, eerie blue lighting, empty, top-down view, pixel art style, 800x600" -t background -s pixel-art -o assets/backgrounds/shadows-in-the-halls/hallway_dark.png

# Classroom
python tools/generate_image.py -p "dark classroom at night, desks in rows, chalkboard, shadows, mysterious, top-down pixel art, 800x600" -t background -s pixel-art -o assets/backgrounds/shadows-in-the-halls/classroom.png

# Safe Room
python tools/generate_image.py -p "safe room in school, soft golden glow, symbol on door, welcoming, warm lighting, contrasts with dark hallways, pixel art, 800x600" -t background -s pixel-art -o assets/backgrounds/shadows-in-the-halls/safe_room.png

# Menu
python tools/generate_image.py -p "shadows in the halls title screen background, dark infinite school hallways fading into fog, eerie but kid-friendly, mysterious, atmospheric, 1200x800" -t background -s painterly -o assets/backgrounds/shadows-in-the-halls/menu_bg.png
```

## Sound Effects

```bash
# Navigation
python tools/generate_sfx.py -p "footstep on tile floor" -d 0.3 -o assets/audio/shadows-in-the-halls/sfx/footstep.mp3

python tools/generate_sfx.py -p "heavy door unlocking with key" -d 1.5 -o assets/audio/shadows-in-the-halls/sfx/door_unlock.mp3

# Items
python tools/generate_sfx.py -p "battery pickup sound, electronic positive" -d 0.5 -o assets/audio/shadows-in-the-halls/sfx/battery_pickup.mp3

python tools/generate_sfx.py -p "puzzle solved chime, success, bright" -d 1.0 -o assets/audio/shadows-in-the-halls/sfx/puzzle_solve.mp3

# Enemies
python tools/generate_sfx.py -p "shadow creature low growl, scary but not too scary for kids" -d 2.0 -o assets/audio/shadows-in-the-halls/sfx/shadow_growl.mp3

# UI/Warning
python tools/generate_sfx.py -p "flashlight battery dying beep, urgent warning" -d 0.5 -o assets/audio/shadows-in-the-halls/sfx/flashlight_dying.mp3

python tools/generate_sfx.py -p "caught by shadow, dark swoosh, game over sound" -d 1.5 -o assets/audio/shadows-in-the-halls/sfx/caught.mp3
```

## Voice Lines

```bash
python tools/generate_voice.py -t "Battery low!" --voice excited_child -o assets/audio/shadows-in-the-halls/voice/battery_low.mp3

python tools/generate_voice.py -t "Correct!" --voice cheerful_female -o assets/audio/shadows-in-the-halls/voice/puzzle_correct.mp3

python tools/generate_voice.py -t "Exit found!" --voice cheerful_female -o assets/audio/shadows-in-the-halls/voice/escape_found.mp3
```

## Music

Music tracks should be generated manually using Lyria 2 or Suno Pro.
See `assets/audio/shadows-in-the-halls/music/PROMPTS.md` for detailed prompts.
