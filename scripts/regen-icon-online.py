"""Regenerate just icon-mode-online.png with a more solid gold-leaf
treatment so it reads at small sizes (56px) on the lobby card."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


REPO = Path(__file__).resolve().parent.parent
NOIR_DIR = REPO / "assets" / "sprites" / "cipher-heist" / "noir"
GENERATE_SCRIPT = REPO.parent / "_shared" / "tools" / "image" / "generate_image.py"

PROMPT = (
    "ornate gold-leaf engraved world globe, fully filled solid antique "
    "amber gold (#c9a04a) with darker engraved hatch shading, art-deco "
    "filigree corner flourishes around the equator, continents implied "
    "with subtle engraved detail (NOT a hollow wireframe), single mark "
    "composition, isolated subject ONLY on a pure solid white "
    "background, vintage engraving style, high contrast clean edges, "
    "NO circular badge, NO border ring, NO disc, NO frame, NO blue, "
    "NO cyan, NO teal, no text"
)


def main() -> int:
    out = NOIR_DIR / "icon-mode-online.png"
    print(f"[*] Regenerating {out.name}")
    try:
        subprocess.run(
            [
                sys.executable,
                str(GENERATE_SCRIPT),
                "-p", PROMPT,
                "-t", "sprite",
                "--pro",
                "-o", str(out),
            ],
            check=True,
            capture_output=True,
            text=True,
            timeout=240,
        )
        print(f"  [OK] generated {out.name}")
    except subprocess.CalledProcessError as e:
        tail = (e.stderr or e.stdout or "").splitlines()[-3:]
        print(f"  [FAIL] {' | '.join(tail)}")
        return 1

    try:
        from rembg import new_session, remove
        from PIL import Image
    except ImportError as e:
        print(f"[ERROR] rembg missing: {e}")
        return 1

    print(f"[*] Stripping background")
    session = new_session("isnet-general-use")
    data = out.read_bytes()
    stripped = remove(data, session=session)
    out.write_bytes(stripped)
    img = Image.open(out)
    if "A" not in img.getbands():
        print(f"  [FAIL] no alpha")
        return 1
    lo, hi = img.getchannel("A").getextrema()
    print(f"  [OK] alpha {lo}-{hi}, size {img.size}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
