#!/usr/bin/env python3
"""
Asset generation for "Beaker Blitz" (beaker-blitz).

Runs:
  - 6 Gemini sprites (cartoon) with rembg transparency
  - 6 Gemini backgrounds (title + one per lab stage + boss launch pad)
  - 5 Lyria 3 music tracks
  - 9 ElevenLabs SFX clips
  - ElevenLabs voice lines (premade "Jessica") for every question, fact, lab-bench prompt,
    practice sentence, and narration line in scripts/game-data.js

Usage (from n-games root):
  python beaker-blitz/scripts/generate_assets.py [--skip-sprites] [--skip-bg] \
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
GAME_DIR = ROOT / "beaker-blitz"
SHARED_TOOLS = ROOT.parent / "_shared" / "tools"

SPRITES_DIR = ROOT / "assets" / "sprites" / "beaker-blitz"
BG_DIR = ROOT / "assets" / "backgrounds" / "beaker-blitz"
MUSIC_DIR = ROOT / "assets" / "audio" / "beaker-blitz" / "music"
SFX_DIR = ROOT / "assets" / "audio" / "beaker-blitz" / "sfx"
VOICE_DIR = ROOT / "assets" / "audio" / "beaker-blitz" / "voice"

STYLE = "bright cartoon illustration, bold clean outlines, saturated friendly colors, kid-friendly science adventure game art, no text, no words, no letters"
SPRITE_STYLE = (
    "cartoon game sprite, bold clean outlines, bright saturated colors, "
    "single subject centered on a plain white background, no shadow, no text, no frame"
)

SPRITES = [
    ("bolt",   "a cute small round robot with stubby wheels, big friendly glowing eyes, holding a large empty glass beaker above its head with both arms, front view, teal and orange colors"),
    ("fizz",   "a friendly cartoon purple octopus scientist wearing safety goggles on its forehead and a tiny white lab coat, holding a bubbling test tube in one tentacle and waving with another, big smile, full body"),
    ("slime",  "a single falling drop of gooey bright green slime with a goofy grumpy face, glossy"),
    ("potion", "a small round glass potion flask filled with glowing red liquid with a white heart symbol on it, cork stopper, sparkles"),
    ("rocket", "a chunky cartoon rocket ship pointing straight up, red and white with a round window, fins, shaped a little like a science flask, no flame"),
    ("trophy", "a shiny golden trophy cup shaped like a bubbling science beaker with a star on the front, sparkles"),
]

BACKGROUNDS = [
    ("bg_title",      "a bright colorful kids science laboratory full of bubbling beakers, test tubes, a telescope, a globe, a plant experiment, and a rocket model, sunlight through big windows, fun and inviting"),
    ("bg_observe",    "an observation deck in a science lab with a big window looking out at a forest and pond, a telescope, a magnifying glass, binoculars, butterflies and birds outside, notebooks on a desk"),
    ("bg_hypothesis", "an idea lab with a blank chalkboard covered in doodle drawings of light bulbs and arrows, a globe, a model volcano, a model of the solar system hanging from the ceiling, sticky notes"),
    ("bg_experiment", "a science test chamber with rows of bubbling colorful beakers, flasks and test tubes, three potted plants under grow lights, measuring cups and a scale, safety goggles on hooks"),
    ("bg_truefalse",  "a fun science lab hallway with two big round doors, one glowing green with a check mark symbol and one glowing red with an X symbol, sparkling floor, lab equipment on shelves"),
    ("bg_boss",       "a rocket launch pad at a kids science center at dusk, a big red rocket on the pad, steam clouds, floodlights, stars appearing in the purple sky, excited crowd silhouettes far away"),
]

MUSIC = [
    # (filename, lyria-model, prompt)
    ("menu",    "lyria-3-pro-preview",  "playful curious science lab music for a kids game title screen, bubbly synths, pizzicato strings, marimba, light quirky percussion, welcoming, loopable, instrumental, medium tempo"),
    ("lab",     "lyria-3-pro-preview",  "upbeat energetic arcade action music for a kids science game, bouncy synth bass, bright bleeps and bloops, driving drums, fun and focused, not distracting, loopable, instrumental"),
    ("bench",   "lyria-3-clip-preview", "calm thoughtful puzzle music, soft music box and vibraphone, gentle bubbling lab ambience, curious, loopable, instrumental"),
    ("boss",    "lyria-3-clip-preview", "exciting rocket countdown boss music, kid-friendly, pounding drums, heroic synth brass, rising tension, space launch energy, instrumental, fast tempo"),
    ("victory", "lyria-3-clip-preview", "triumphant short victory fanfare with a rocket whoosh feel, brass and cymbals, celebratory, uplifting, instrumental"),
]

SFX = [
    # (filename, duration, prompt)
    ("correct",    0.6, "bright happy two-note chime with bubbly sparkle, positive game feedback"),
    ("wrong",      0.5, "soft cartoon glass clink and deflating bloop, gentle negative"),
    ("coin",       0.3, "small bright sparkly atom pickup ding, short"),
    ("splat",      0.5, "cartoon slime splat, gooey and funny"),
    ("pop",        0.4, "soap bubble pop, light and short"),
    ("heal",       0.6, "magic potion gulp with a rising sparkle"),
    ("launch",     2.5, "cartoon rocket launch, rumble then big whoosh into the sky"),
    ("stage_done", 1.8, "short cheerful science fanfare jingle, level complete, kids game"),
    ("start",      0.8, "friendly lab beep beep boop start signal"),
]

ELEVEN_VOICE_ID = "cgSgspJ2msm6clMCkdW9"  # ElevenLabs premade "Jessica"
ELEVEN_MODEL = "eleven_multilingual_v2"


def load_content() -> dict:
    src = (GAME_DIR / "scripts" / "game-data.js").read_text(encoding="utf-8")
    start = src.index("{", src.index("window.BB_CONTENT"))
    end = src.rindex("}")
    return json.loads(src[start:end + 1])


def question_speech(q: dict) -> str:
    text = q["q"].replace("____", "blank")
    return f"True or false? {text}" if q["stage"] == "truefalse" else text


def fill_speech(f: dict) -> str:
    return f"{f['before']} blank {f['after']}".strip().rstrip(" .") + "."


def voice_lines(content: dict) -> list[tuple[str, str]]:
    lines: list[tuple[str, str]] = []
    for q in content["questions"]:
        lines.append((f"q_{q['id']}", question_speech(q)))
        if q.get("fact"):
            lines.append((f"fact_{q['id']}", q["fact"]))
    for item in content["items"]:
        lines.append((f"fact_{item['id']}", item["fact"]))
    for key, bench in content["benches"].items():
        lines.append((f"bench_{key}", bench["prompt"]))
        lines.append((f"benchm_{key}", bench["model"]))
        for s in bench.get("sentences", []):
            lines.append((f"why_{s['item']}", s["why"]))
    for f in content["practice"]["fill"]:
        lines.append((f"fill_{f['item']}", fill_speech(f)))
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


def trim_letterbox(path: Path, thresh: int = 236) -> None:
    """Gemini sometimes pads wide scenes with white bands; crop rows/columns that are nearly all white."""
    from PIL import Image
    img = Image.open(path).convert("RGB")
    w, h = img.size
    px = img.load()

    def white_frac_row(y: int) -> float:
        return sum(1 for x in range(0, w, 4) if min(px[x, y]) >= thresh) / len(range(0, w, 4))

    def white_frac_col(x: int) -> float:
        return sum(1 for y in range(0, h, 4) if min(px[x, y]) >= thresh) / len(range(0, h, 4))

    top, bottom, left, right = 0, h, 0, w
    while top < h // 3 and white_frac_row(top) > 0.9:
        top += 1
    while bottom > h * 2 // 3 and white_frac_row(bottom - 1) > 0.9:
        bottom -= 1
    while left < w // 3 and white_frac_col(left) > 0.9:
        left += 1
    while right > w * 2 // 3 and white_frac_col(right - 1) > 0.9:
        right -= 1
    if (top, bottom, left, right) != (0, h, 0, w):
        img.crop((left, top, right, bottom)).save(path, optimize=True)
        print(f"  trimmed letterbox {path.name}: {w}x{h} -> {right - left}x{bottom - top}")


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
    p.add_argument("--only", help="Only one asset key, e.g. bolt, bg_observe, music:lab, sfx:coin, voice:q_o1")
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
            if out.exists() and not args.dry_run:
                trim_letterbox(out)

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
            go(f"voice:{name}", out, [py, str(SHARED_TOOLS / "audio" / "generate_voice_elevenlabs.py"),
                                      "-v", ELEVEN_VOICE_ID, "-m", ELEVEN_MODEL, "--stability", "0.45", "--style", "0.25",
                                      "-o", str(out), "-t", text], "voice")
            if not args.dry_run and want(f"voice:{name}"):
                time.sleep(0.3)

    est = counts["sprites"] * 0.04 + counts["bg"] * 0.04 + counts["music"] * 0.10 + counts["sfx"] * 0.02 + counts["voice"] * 0.03
    print(f"\n[summary] to generate: {counts}  est. cost ~${est:.2f}")
    if failures:
        print(f"[summary] FAILED ({len(failures)}): {', '.join(failures)}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
