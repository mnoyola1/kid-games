#!/usr/bin/env python3
"""
One-off asset generation for "Dragon Scrolls of China" (china-adventure).

Runs:
  - 8 Gemini sprites (painterly + isolated bg) then rembg transparency
  - 7 Gemini region/menu backgrounds (16:9 painterly ink-wash)
  - 4 Lyria 3 music tracks (Pro for menu/exploration, Clip for battle/victory)
  - 7 ElevenLabs SFX clips
  - 2 Cartesia voice lines (wise-elder style)

Usage (from n-games root):
  python china-adventure/scripts/generate_assets.py [--skip-sprites] [--skip-bg] \
         [--skip-music] [--skip-sfx] [--skip-voice] [--only KEY]

Re-run safe: files that already exist are skipped unless --force is passed.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # .../n-games
GAME_DIR = ROOT / "china-adventure"
SHARED_TOOLS = ROOT.parent / "_shared" / "tools"

SPRITES_DIR = ROOT / "assets" / "sprites" / "china-adventure"
BG_DIR = ROOT / "assets" / "backgrounds" / "china-adventure"
MUSIC_DIR = ROOT / "assets" / "audio" / "china-adventure" / "music"
SFX_DIR = ROOT / "assets" / "audio" / "china-adventure" / "sfx"
VOICE_DIR = ROOT / "assets" / "audio" / "china-adventure" / "voice"

for d in (SPRITES_DIR, BG_DIR, MUSIC_DIR, SFX_DIR, VOICE_DIR):
    d.mkdir(parents=True, exist_ok=True)

STYLE = "painterly, traditional Chinese ink-wash brush painting, muted rice-paper palette, imperial red and gold accents, jade green, soft edges"
SPRITE_STYLE = (
    "traditional Chinese ink-wash painting style, painterly brushwork, "
    "imperial red and gold accents, jade green, soft edges, "
    "single subject centered on a plain white background, "
    "no shadow, no text, no frame"
)

SPRITES = [
    ("hero",               "a young Chinese scholar hero child in a red and gold robe holding a bamboo scroll, brave and curious expression, facing forward, full body"),
    ("lanternWisp",        "a single red-and-gold Chinese paper lantern floating in the air with wispy smoke trails, glowing warmly, no string, full shape"),
    ("lionDancer",         "a fierce Chinese lion-dance guardian head mask, big eyes, red and gold mane, front view, full mask"),
    ("mongolChieftain",    "a stern Mongol chieftain warrior on horseback, fur cloak, feathered headpiece, silhouette style, full body"),
    ("pandaSage",          "a wise old giant panda sage meditating cross-legged on a small bamboo mat, eyes closed, thin white beard, full body"),
    ("caravanDjinn",       "a swirling desert sand spirit wearing flowing silk robes, turban, wisps of sand forming a lower body, full figure"),
    ("himalayanDragon",    "a coiled blue Chinese dragon of the Himalayas, long serpent body, white snow mist around it, gold whiskers, full body"),
    ("imperialPhoenix",    "a golden and red imperial phoenix bird with long sweeping tail feathers, wings spread, front view, full body"),
]

BACKGROUNDS = [
    ("bg_menu",          "a stylized map of ancient China with mountains, rivers, the Great Wall, and a large golden dragon circling above, dawn colors"),
    ("bg_beijing",       "Forbidden City rooftops at dawn, red lanterns hanging, cherry blossoms in the foreground"),
    ("bg_greatwall",     "the Great Wall of China snaking across misty green-and-grey mountains at sunrise"),
    ("bg_sichuan",       "terraced rice paddies in a bamboo forest, a misty river valley, distant pandas"),
    ("bg_silkroad",      "a desert caravan on the Silk Road, camels, sand dunes, a distant oasis, warm sunset sky"),
    ("bg_tibet",         "a Himalayan monastery on a snowy cliff, colorful prayer flags, white peaks and clouds"),
    ("bg_forbiddencity", "ornate golden throne room of the Forbidden City, imperial columns, red silk banners, warm torchlight"),
    ("bg_moderncity",    "modern Shanghai skyline at night with pagoda-style skyscrapers and neon lights, a soft mist of tradition meeting tomorrow"),
]

MUSIC = [
    # (filename, lyria-model, duration_hint, prompt, negative)
    ("menu",        "lyria-3-pro-preview",  "peaceful traditional Chinese erhu and guzheng, zen pentatonic, ancient palace courtyard, gentle wind chimes, loopable instrumental, slow tempo"),
    ("exploration", "lyria-3-pro-preview",  "journey through ancient China, pipa and bamboo dizi flute, light hand drum, adventurous, reflective, cinematic orchestral strings, medium tempo"),
    ("battle",      "lyria-3-clip-preview", "taiko drums and large gong, intense Chinese battle score, dragon dance, guzheng flurries, escalating tension, fast tempo, instrumental"),
    ("victory",     "lyria-3-clip-preview", "triumphant Chinese imperial fanfare, gongs, horns, celebratory, short uplifting, instrumental"),
]

SFX = [
    # (filename, duration, prompt)
    ("gong_hit",    0.6, "soft Chinese gong strike, resonant, mid range"),
    ("correct",     0.5, "bright Chinese wind-chime bell, positive short"),
    ("wrong",       0.4, "gentle low gong thud, soft negative"),
    ("coin",        0.3, "small metallic coin ring, pleasant, short"),
    ("levelup",     1.5, "ascending Chinese bamboo flute flourish, triumphant, uplifting"),
    ("victory",     1.2, "triumphant gong and drum roll with subtle fanfare"),
    ("attack_hit",  0.4, "sharp Chinese martial-arts hit, thump with whoosh"),
]

VOICE = [
    # (filename, style, text)
    ("encourage",  "wise_elder", "Well done, young dragon scout. The scrolls smile upon you."),
    ("try_again",  "wise_elder", "Consult the scrolls once more, little one. Wisdom takes time."),
]


def run(cmd: list[str], label: str) -> int:
    print(f"\n[{label}] $ {' '.join(str(c) for c in cmd)}")
    t0 = time.time()
    proc = subprocess.run(cmd, cwd=ROOT)
    dt = time.time() - t0
    print(f"[{label}] -> exit={proc.returncode} in {dt:.1f}s")
    return proc.returncode


def gen_sprite(name: str, prompt: str, force: bool) -> None:
    rgba = SPRITES_DIR / f"{name}_rgba.png"
    if rgba.exists() and not force:
        print(f"[sprite:{name}] already exists, skipping")
        return
    run([
        sys.executable, str(SHARED_TOOLS / "image" / "generate_image.py"),
        "-p", f"{prompt}, {SPRITE_STYLE}",
        "-t", "sprite",
        "-s", "painterly",
        "--remove-bg",
        "-o", str(rgba),
    ], f"sprite:{name}")


def gen_background(name: str, prompt: str, force: bool) -> None:
    out = BG_DIR / f"{name}.png"
    if out.exists() and not force:
        print(f"[bg:{name}] already exists, skipping")
        return
    run([
        sys.executable, str(SHARED_TOOLS / "image" / "generate_image.py"),
        "-p", f"{prompt}, {STYLE}",
        "-t", "background",
        "-s", "painterly",
        "-o", str(out),
    ], f"bg:{name}")


def gen_music(name: str, model: str, prompt: str, force: bool) -> None:
    out = MUSIC_DIR / f"{name}.mp3"
    out_wav = MUSIC_DIR / f"{name}.wav"
    if (out.exists() or out_wav.exists()) and not force:
        print(f"[music:{name}] already exists, skipping")
        return
    run([
        sys.executable, str(SHARED_TOOLS / "audio" / "generate_music_vertex.py"),
        "-p", prompt,
        "-o", str(out),
        "--model", model,
    ], f"music:{name}")


def gen_sfx(name: str, duration: float, prompt: str, force: bool) -> None:
    out = SFX_DIR / f"{name}.mp3"
    if out.exists() and not force:
        print(f"[sfx:{name}] already exists, skipping")
        return
    run([
        sys.executable, str(SHARED_TOOLS / "audio" / "generate_sfx.py"),
        "-p", prompt,
        "-d", str(duration),
        "-o", str(out),
    ], f"sfx:{name}")


VOICE_PRESET = {
    "wise_elder": "calm_male",
    "kid_friendly": "cheerful_female",
}


def gen_voice(name: str, style: str, text: str, force: bool) -> None:
    out = VOICE_DIR / f"{name}.mp3"
    if out.exists() and not force:
        print(f"[voice:{name}] already exists, skipping")
        return
    preset = VOICE_PRESET.get(style, "calm_male")
    run([
        sys.executable, str(SHARED_TOOLS / "audio" / "generate_voice.py"),
        "-t", text,
        "-v", preset,
        "-s", "0.85",
        "-o", str(out),
    ], f"voice:{name}")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--skip-sprites", action="store_true")
    p.add_argument("--skip-bg", action="store_true")
    p.add_argument("--skip-music", action="store_true")
    p.add_argument("--skip-sfx", action="store_true")
    p.add_argument("--skip-voice", action="store_true")
    p.add_argument("--force", action="store_true")
    p.add_argument("--only", help="Only generate a specific asset by key (e.g. hero, bg_beijing, music:menu)")
    args = p.parse_args()

    only = args.only

    if not args.skip_sprites:
        for name, prompt in SPRITES:
            if only and only != name:
                continue
            gen_sprite(name, prompt, args.force)

    if not args.skip_bg:
        for name, prompt in BACKGROUNDS:
            if only and only != name:
                continue
            gen_background(name, prompt, args.force)

    if not args.skip_music:
        for name, model, prompt in MUSIC:
            if only and only != f"music:{name}":
                continue
            gen_music(name, model, prompt, args.force)

    if not args.skip_sfx:
        for name, duration, prompt in SFX:
            if only and only != f"sfx:{name}":
                continue
            gen_sfx(name, duration, prompt, args.force)

    if not args.skip_voice:
        for name, style, text in VOICE:
            if only and only != f"voice:{name}":
                continue
            gen_voice(name, style, text, args.force)

    print("\n[done] asset generation complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
