"""Regenerate icon-pack-word (kill the blue tint) + create icon-hub
(noir-themed back-to-hub button)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed


REPO = Path(__file__).resolve().parent.parent
NOIR_DIR = REPO / "assets" / "sprites" / "cipher-heist" / "noir"
GENERATE_SCRIPT = REPO.parent / "_shared" / "tools" / "image" / "generate_image.py"

STYLE = (
    "isolated subject ONLY on a pure solid white background, vintage gold "
    "engraving style, antique amber gold (#c9a04a) tone with darker "
    "engraved hatch shading, art-deco / Victorian filigree line-art, "
    "high contrast clean edges, single mark composition, NO circular "
    "badge, NO border ring, NO disc, NO frame, NO seal, NO blue, "
    "NO cyan, NO teal, NO purple, NO gradient backdrop, no text, no "
    "watermark"
)


ICONS = [
    ("icon-pack-word",
     "ornate leather-bound dictionary book lying open with elegant calligraphy "
     "lowercase letters visible on the pages, single quill pen resting on top, "
     "all in solid antique gold tones (NOT blue, NOT teal)"),
    ("icon-hub",
     "ornate art-deco vault door with detailed gold filigree borders, central "
     "wheel handle with brass spokes radiating outward, slightly ajar showing "
     "warm light spilling out, reads as a 'return home' or 'exit through the "
     "vault' icon"),
]


def generate_one(name: str, subject: str) -> tuple[str, bool, str]:
    out_path = NOIR_DIR / f"{name}.png"
    prompt = f"{subject}. {STYLE}"
    try:
        subprocess.run(
            [
                sys.executable, str(GENERATE_SCRIPT),
                "-p", prompt, "-t", "sprite", "--pro",
                "-o", str(out_path),
            ],
            check=True, capture_output=True, text=True, timeout=240,
        )
        return (name, True, "generated")
    except subprocess.CalledProcessError as e:
        tail = (e.stderr or e.stdout or "").splitlines()[-3:]
        return (name, False, f"failed: {' | '.join(tail)}")
    except subprocess.TimeoutExpired:
        return (name, False, "timeout")


def main() -> int:
    print(f"[*] Generating {len(ICONS)} icons (parallel)...")
    with ThreadPoolExecutor(max_workers=2) as ex:
        futures = {ex.submit(generate_one, n, s): n for n, s in ICONS}
        for fut in as_completed(futures):
            name, ok, msg = fut.result()
            mark = "[OK]  " if ok else "[FAIL]"
            print(f"  {mark} gen   {name:<24} {msg}")

    print("\n[*] Stripping backgrounds...")
    try:
        from rembg import new_session, remove
        from PIL import Image
    except ImportError as e:
        print(f"[ERROR] rembg missing: {e}")
        return 1

    session = new_session("isnet-general-use")
    for name, _ in ICONS:
        p = NOIR_DIR / f"{name}.png"
        if not p.exists():
            print(f"  [SKIP] {name}")
            continue
        data = p.read_bytes()
        out = remove(data, session=session)
        p.write_bytes(out)
        img = Image.open(p)
        lo, hi = img.getchannel("A").getextrema() if "A" in img.getbands() else (255, 255)
        print(f"  [OK]   strip {name:<24} alpha {lo}-{hi}")

    print("[*] Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
