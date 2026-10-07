#!/usr/bin/env python3
"""
Asset generation for "Signpost Sleuth" (signpost-sleuth).

Runs:
  - 3 Gemini sprites (Sage the owl detective, Sage cheering, trophy) with rembg transparency
  - 8 Gemini backgrounds (title, one per case story, speed round, quiz)
  - 5 Lyria 3 music tracks
  - 9 ElevenLabs SFX clips
  - ElevenLabs voice lines for narration, every signpost card, every story paragraph,
    every signpost explanation, and the quiz model answer (from game-data.js + game-stories.js)

Usage (from n-games root):
  python signpost-sleuth/scripts/generate_assets.py [--skip-sprites] [--skip-bg] \
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
GAME_DIR = ROOT / "signpost-sleuth"
SHARED_TOOLS = ROOT.parent / "_shared" / "tools"

SPRITES_DIR = ROOT / "assets" / "sprites" / "signpost-sleuth"
BG_DIR = ROOT / "assets" / "backgrounds" / "signpost-sleuth"
MUSIC_DIR = ROOT / "assets" / "audio" / "signpost-sleuth" / "music"
SFX_DIR = ROOT / "assets" / "audio" / "signpost-sleuth" / "sfx"
VOICE_DIR = ROOT / "assets" / "audio" / "signpost-sleuth" / "voice"

STYLE = ("cozy storybook illustration, soft painterly textures, warm golden light, rich but gentle colors, "
         "inviting kids book art for a middle-school reader, no text, no words, no letters")
SPRITE_STYLE = (
    "storybook cartoon character, soft painterly shading, clean outlines, warm colors, "
    "single subject centered on a plain white background, no shadow, no text, no frame"
)

SPRITES = [
    ("sage",       "a friendly young barn owl detective with round reading glasses, a cozy plaid scarf and a small detective cap, holding a yellow sticky note and a pencil, curious smile, full body"),
    ("sage_cheer", "the same friendly barn owl detective with round reading glasses, plaid scarf and detective cap, wings raised in celebration, holding a magnifying glass, big happy smile, full body"),
    ("trophy",     "a shiny golden trophy shaped like a wooden road signpost with arrows, sitting on an open storybook, sparkles"),
]

BACKGROUNDS = [
    ("bg_title",      "a magical winding road made of open book pages stretching through rolling hills toward a cozy library town at sunset, colorful road signs along the path, fireflies, a small owl flying overhead"),
    ("bg_band",       "an empty middle school band room in afternoon sunlight, rows of chairs and music stands, a flute resting on a chair, instrument cases, warm and calm"),
    ("bg_lighthouse", "full-bleed scene filling the entire image edge to edge, no border, no frame, no wall: an old white and red lighthouse on a rocky coast at dusk, a small weathered house beside it, a fishing boat on calm water, soft pink and purple sky"),
    ("bg_school",     "a cozy middle school library with tall windows, a table by the window with a green sketchbook on it, bookshelves, autumn trees outside, soft sunlight"),
    ("bg_pond",       "a peaceful pond in a meadow on a late summer afternoon, cattails, lily pads, frogs, ducks, dappled sunlight through trees"),
    ("bg_speed",      "a colorful storybook highway at twilight curving into the distance, lots of friendly road signs and signposts lining the road, glowing street lamps, rolling hills, sense of speed"),
    ("bg_quiz",       "a tidy student desk seen from above with an open notebook, yellow sticky notes, pencils, a reading book and a cup of cocoa, warm lamp light"),
    ("bg_notebook",   "a cork bulletin board covered in colorful sticky notes, pushpins, a library card and a bookmark, warm and inviting, plenty of empty space"),
]

MUSIC = [
    # (filename, lyria-model, prompt)
    ("menu",    "lyria-3-pro-preview",  "cozy jazzy detective theme for a kids reading game, light brushed drums, walking upright bass, playful clarinet and piano, curious and warm, loopable, instrumental, medium tempo"),
    ("story",   "lyria-3-pro-preview",  "calm lofi reading music, soft piano, gentle vinyl crackle, warm pads, relaxed and focused, not distracting, loopable, instrumental, slow tempo"),
    ("speed",   "lyria-3-clip-preview", "upbeat fast road trip music for a kids arcade game, driving drums, funky bass, bright synth stabs, exciting and fun, loopable, instrumental"),
    ("quiz",    "lyria-3-clip-preview", "quiet thoughtful study music, soft marimba and piano, gentle and steady, helps concentration, loopable, instrumental"),
    ("victory", "lyria-3-clip-preview", "short triumphant jazzy victory fanfare, brass and piano, celebratory and uplifting, instrumental"),
]

SFX = [
    # (filename, duration, prompt)
    ("tap",     0.3, "soft paper tap click, short, gentle UI sound"),
    ("stop",    0.9, "cartoon car brakes screech to a quick stop, playful, short"),
    ("correct", 0.6, "bright happy two-note chime with sparkle, positive game feedback"),
    ("wrong",   0.5, "soft cartoon wooden bonk, gentle negative feedback"),
    ("stamp",   0.5, "rubber stamp thunk on paper, satisfying"),
    ("page",    0.6, "book page turning, crisp paper flip"),
    ("sticky",  0.5, "sticky note peeled and pressed onto paper"),
    ("whoosh",  0.5, "quick whoosh of a car passing by"),
    ("fanfare", 1.8, "short cheerful fanfare jingle, level complete, kids game"),
]

ELEVEN_VOICE_ID = "cgSgspJ2msm6clMCkdW9"  # ElevenLabs premade "Jessica"
ELEVEN_MODEL = "eleven_multilingual_v2"


def load_js_json(name: str, var: str) -> dict:
    src = (GAME_DIR / "scripts" / name).read_text(encoding="utf-8")
    start = src.index("{", src.index(var))
    end = src.rindex("}")
    return json.loads(src[start:end + 1])


def voice_lines(content: dict, stories: dict) -> list[tuple[str, str]]:
    lines: list[tuple[str, str]] = []
    for key, text in content["narration"].items():
        lines.append((f"n_{key}", text))
    lines.append(("n_good_readers", content["goodReaders"]["why"]))
    for sp in content["signposts"]:
        lines.append((f"card_{sp['id']}", f"{sp['name']}. When you're reading and... {sp['when']}"))
        lines.append((f"ask_{sp['id']}", f"Stop and ask yourself: {sp['ask']}"))
        lines.append((f"tells_{sp['id']}", sp["tells"]))
        lines.append((f"ex_{sp['id']}", sp["example"]))
    for case in stories["cases"]:
        for i, para in enumerate(case["paragraphs"]):
            lines.append((f"p_{case['id']}_{i}", " ".join(para["s"])))
            for stop in para.get("stops", []):
                lines.append((f"why_{case['id']}_{i}_{stop['type']}", stop["why"]))
    lines.append(("model_why", content["quiz"]["written"]["model"]))
    return lines


def trim_transparent(path: Path, pad: int = 8, max_side: int = 512) -> None:
    """Crop empty margins and cap resolution."""
    from PIL import Image
    img = Image.open(path).convert("RGBA")
    bbox = img.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
    if bbox:
        l, t, r, b = bbox
        img = img.crop((max(0, l - pad), max(0, t - pad), min(img.width, r + pad), min(img.height, b + pad)))
    img.thumbnail((max_side, max_side), Image.LANCZOS)
    img.save(path, optimize=True)


def shrink_background(path: Path, max_side: int = 1600) -> None:
    """Backgrounds sit behind text; save as reasonably sized JPEG-quality PNG to keep the iPad fast."""
    from PIL import Image
    img = Image.open(path).convert("RGB")
    img.thumbnail((max_side, max_side), Image.LANCZOS)
    img.save(path.with_suffix(".jpg"), quality=84, optimize=True)


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
    p.add_argument("--only", help="Only one asset key, e.g. sage, bg_band, music:story, sfx:stamp, voice:n_welcome")
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
                            "-p", f"{prompt}, {SPRITE_STYLE}", "-t", "sprite", "-s", "painterly",
                            "--remove-bg", "-o", str(raw)], "sprites")
            if nobg.exists() and not args.dry_run:
                nobg.replace(rgba)
                trim_transparent(rgba)

    if not args.skip_bg:
        for name, prompt in BACKGROUNDS:
            out = BG_DIR / f"{name}.png"
            if (BG_DIR / f"{name}.jpg").exists() and not args.force:
                continue
            go(name, out, [py, str(SHARED_TOOLS / "image" / "generate_image.py"),
                           "-p", f"{prompt}, {STYLE}", "-t", "background", "-s", "painterly",
                           "-o", str(out)], "bg")
            if out.exists() and not args.dry_run:
                shrink_background(out)
                out.unlink()

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
        content = load_js_json("game-data.js", "window.PS_CONTENT")
        stories = load_js_json("game-stories.js", "window.PS_STORIES")
        for name, text in voice_lines(content, stories):
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
