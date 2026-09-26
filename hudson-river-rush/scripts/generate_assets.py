#!/usr/bin/env python3
"""
Asset generation for "Hudson River Rush" (hudson-river-rush).

Runs:
  - 7 Gemini sprites (cartoon, top-down where the game needs it) with rembg transparency
  - 6 Gemini backgrounds (title + one per river leg)
  - 5 Lyria 3 music tracks
  - 9 ElevenLabs SFX clips
  - Cartesia voice lines for every question, fact, dock model answer, practice prompt,
    and narration line in scripts/game-data.js

Usage (from n-games root):
  python hudson-river-rush/scripts/generate_assets.py [--skip-sprites] [--skip-bg] \
         [--skip-music] [--skip-sfx] [--skip-voice] [--only KEY] [--force] [--dry-run]

Re-run safe: files that already exist are skipped unless --force is passed.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # .../n-games
GAME_DIR = ROOT / "hudson-river-rush"
SHARED_TOOLS = ROOT.parent / "_shared" / "tools"

SPRITES_DIR = ROOT / "assets" / "sprites" / "hudson-river-rush"
BG_DIR = ROOT / "assets" / "backgrounds" / "hudson-river-rush"
MUSIC_DIR = ROOT / "assets" / "audio" / "hudson-river-rush" / "music"
SFX_DIR = ROOT / "assets" / "audio" / "hudson-river-rush" / "sfx"
VOICE_DIR = ROOT / "assets" / "audio" / "hudson-river-rush" / "voice"

STYLE = "bright cartoon illustration, bold clean outlines, saturated friendly colors, kid-friendly adventure game art, no text, no words, no letters"
SPRITE_STYLE = (
    "cartoon game sprite, bold clean outlines, bright saturated colors, "
    "single subject centered on a plain white background, no shadow, no text, no frame"
)

SPRITES = [
    ("boat",      "top-down bird's-eye view of a small red and white tugboat seen directly from above, bow pointing straight up toward the top of the image, little captain's cabin in the middle, white wake foam at the back"),
    ("log",       "top-down view of a single floating brown tree log lying horizontally, bark texture, a little green moss, seen from directly above"),
    ("rock",      "top-down view of a grey river boulder with white water foam splashing around it, seen from directly above"),
    ("snowcloud", "a fluffy grey and white storm cloud with snowflakes falling from it, cute and slightly grumpy face"),
    ("ice",       "top-down view of a flat floating chunk of white and light blue ice, seen from directly above"),
    ("otis",      "a friendly cartoon river otter boat captain wearing a navy blue captain's hat and a small life vest, waving, big smile, full body"),
    ("trophy",    "a shiny golden trophy cup shaped like a waterfall with a lightning bolt on the front, sparkles"),
]

BACKGROUNDS = [
    ("bg_title",       "an adventure map-style scene of New York State: a winding blue river from a big city harbor with the Statue of Liberty, north through green valleys and pine-covered mountains, west along a canal past farms to a huge waterfall, a small red tugboat sailing on the river, sunny sky"),
    ("bg_harbor",      "New York Harbor on a sunny day, the Statue of Liberty, the New York City skyline, ferries and tugboats on sparkling water, seagulls"),
    ("bg_hudson",      "the Hudson River valley, wide river between tall green cliffs, old wooden sailing ships carrying cargo, small river town, autumn trees"),
    ("bg_adirondacks", "the Adirondack mountains, pine forests, a clear blue lake, a log cabin, maple trees with red leaves, hikers on a trail"),
    ("bg_canal",       "the Erie Canal with a canal boat, a stone lock, rolling farmland with black-and-white dairy cows and a red barn, a small city in the distance"),
    ("bg_niagara",     "Niagara Falls roaring with mist and a rainbow, Lake Erie beyond, snow clouds on the horizon, a hydroelectric power station with glowing lights"),
]

MUSIC = [
    # (filename, lyria-model, prompt)
    ("menu",    "lyria-3-pro-preview",  "cheerful adventure sea shanty for a kids game title screen, accordion, fiddle, light hand percussion, bouncy, welcoming, loopable, instrumental, medium tempo"),
    ("river",   "lyria-3-pro-preview",  "upbeat fast river racing music for a kids action game, driving drums, bright brass stabs, plucky strings, fun and energetic, not distracting, loopable, instrumental"),
    ("dock",    "lyria-3-clip-preview", "calm focused puzzle music, gentle marimba and acoustic guitar, soft water ambience, thoughtful, loopable, instrumental"),
    ("boss",    "lyria-3-clip-preview", "intense but kid-friendly boss music, roaring waterfall energy, pounding drums, heroic orchestra, rising tension, instrumental, fast tempo"),
    ("victory", "lyria-3-clip-preview", "triumphant short victory fanfare, brass and cymbals, celebratory, uplifting, instrumental"),
]

SFX = [
    # (filename, duration, prompt)
    ("steer",    0.4, "quick cartoon water whoosh swish, short"),
    ("correct",  0.6, "bright happy two-note chime with sparkle, positive game feedback"),
    ("wrong",    0.5, "soft cartoon wooden bonk with a small splash, gentle negative"),
    ("coin",     0.3, "small bright coin pickup ding, short"),
    ("splash",   0.6, "boat bumps into a floating log, thud and water splash"),
    ("horn",     1.2, "friendly tugboat horn toot, two short blasts"),
    ("boost",    0.8, "speed boost whoosh with rising pitch and water spray"),
    ("leg_done", 1.8, "short cheerful fanfare jingle, level complete, kids game"),
    ("snow",     0.6, "soft snowy poof with icy sparkle"),
]

VOICE_PRESET = "cheerful_female"
VOICE_SPEED = "0.9"


def load_content() -> dict:
    src = (GAME_DIR / "scripts" / "game-data.js").read_text(encoding="utf-8")
    start = src.index("{", src.index("window.HRR_CONTENT"))
    end = src.rindex("}")
    return json.loads(src[start:end + 1])


def voice_lines(content: dict) -> list[tuple[str, str]]:
    lines: list[tuple[str, str]] = []
    for q in content["questions"]:
        lines.append((f"q_{q['id']}", q["q"].replace("____", "blank")))
        if q.get("fact"):
            lines.append((f"fact_{q['id']}", q["fact"]))
    for item in content["items"]:
        lines.append((f"fact_{item['id']}", item["fact"]))
    for key, dock in content["docks"].items():
        lines.append((f"dockq_{key}", dock["prompt"]))
        lines.append((f"model_{key}", dock["model"]))
    practice = content["practice"]
    for v in practice["vocab"]:
        lines.append((f"def_{v['item']}", v["def"]))
    for f in practice["fill"]:
        text = f"{f['before']} blank {f['after']}".strip().rstrip(" .") + "."
        lines.append((f"fill_{f['item']}", text))
    for c in practice["critical"]:
        lines.append((f"cq_{c['item']}", c["q"]))
        lines.append((f"model_{c['item']}", c["model"]))
    for key, text in content["narration"].items():
        lines.append((f"n_{key}", text))
    return lines


def trim_transparent(path: Path, pad: int = 8, max_side: int = 360) -> None:
    """Crop empty margins (so the game sizes sprites by visible content) and cap resolution."""
    from PIL import Image
    img = Image.open(path).convert("RGBA")
    bbox = img.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
    if bbox:
        l, t, r, b = bbox
        img = img.crop((max(0, l - pad), max(0, t - pad), min(img.width, r + pad), min(img.height, b + pad)))
    img.thumbnail((max_side, max_side), Image.LANCZOS)
    img.save(path, optimize=True)


def run(cmd: list[str], label: str, dry: bool) -> int:
    if dry:
        print(f"[dry:{label}] {cmd[-1] if cmd else ''}")
        return 0
    print(f"\n[{label}]", flush=True)
    t0 = time.time()
    proc = subprocess.run(cmd, cwd=ROOT)
    print(f"[{label}] -> exit={proc.returncode} in {time.time() - t0:.1f}s", flush=True)
    return proc.returncode


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--skip-sprites", action="store_true")
    p.add_argument("--skip-bg", action="store_true")
    p.add_argument("--skip-music", action="store_true")
    p.add_argument("--skip-sfx", action="store_true")
    p.add_argument("--skip-voice", action="store_true")
    p.add_argument("--force", action="store_true")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--only", help="Only one asset key, e.g. boat, bg_harbor, music:river, sfx:coin, voice:q_h1")
    args = p.parse_args()

    for d in (SPRITES_DIR, BG_DIR, MUSIC_DIR, SFX_DIR, VOICE_DIR):
        d.mkdir(parents=True, exist_ok=True)

    py = sys.executable
    only = args.only
    counts = {"sprites": 0, "bg": 0, "music": 0, "sfx": 0, "voice": 0}
    failures: list[str] = []

    def want(key: str) -> bool:
        return not only or only == key

    def go(key: str, out: Path, cmd: list[str], bucket: str) -> None:
        if not want(key):
            return
        if out.exists() and not args.force:
            return
        counts[bucket] += 1
        if run(cmd, key, args.dry_run) != 0:
            failures.append(key)

    if not args.skip_sprites:
        for name, prompt in SPRITES:
            # generate_image.py --remove-bg writes <out> plus <out stem>_nobg.png
            rgba = SPRITES_DIR / f"{name}_rgba.png"
            raw = SPRITES_DIR / f"{name}.png"
            nobg = SPRITES_DIR / f"{name}_nobg.png"
            if rgba.exists() and not args.force:
                continue
            go(name, nobg, [py, str(SHARED_TOOLS / "image" / "generate_image.py"),
                            "-p", f"{prompt}, {SPRITE_STYLE}", "-t", "sprite", "-s", "cartoon",
                            "--remove-bg", "-o", str(raw)], "sprites")
            if nobg.exists() and not args.dry_run:
                nobg.replace(rgba)
                trim_transparent(rgba)

    if not args.skip_bg:
        for name, prompt in BACKGROUNDS:
            out = BG_DIR / f"{name}.png"
            go(name, out, [py, str(SHARED_TOOLS / "image" / "generate_image.py"),
                           "-p", f"{prompt}, {STYLE}", "-t", "background", "-s", "cartoon",
                           "-o", str(out)], "bg")

    if not args.skip_music:
        for name, model, prompt in MUSIC:
            out = MUSIC_DIR / f"{name}.mp3"
            go(f"music:{name}", out, [py, str(SHARED_TOOLS / "audio" / "generate_music_vertex.py"),
                                      "-p", prompt, "-o", str(out), "--model", model], "music")

    if not args.skip_sfx:
        for name, duration, prompt in SFX:
            out = SFX_DIR / f"{name}.mp3"
            go(f"sfx:{name}", out, [py, str(SHARED_TOOLS / "audio" / "generate_sfx.py"),
                                    "-p", prompt, "-d", str(duration), "-o", str(out)], "sfx")

    if not args.skip_voice:
        for name, text in voice_lines(load_content()):
            out = VOICE_DIR / f"{name}.mp3"
            go(f"voice:{name}", out, [py, str(SHARED_TOOLS / "audio" / "generate_voice.py"),
                                      "-v", VOICE_PRESET, "-s", VOICE_SPEED, "-o", str(out), "-t", text], "voice")
            if not args.dry_run:
                time.sleep(0.3)

    est = counts["sprites"] * 0.04 + counts["bg"] * 0.04 + counts["music"] * 0.10 + counts["sfx"] * 0.02 + counts["voice"] * 0.008
    print(f"\n[summary] to generate: {counts}  est. cost ~${est:.2f}")
    if failures:
        print(f"[summary] FAILED ({len(failures)}): {', '.join(failures)}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
