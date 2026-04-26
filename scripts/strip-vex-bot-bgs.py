"""One-off: strip backgrounds from Vex + bot sprites.

These were saved as JPEGs with green backgrounds. We need true transparent
PNGs. Writes the result to the *same path* (the file is already named
.png even though it's actually JPEG bytes inside).
"""
from __future__ import annotations

import sys
from pathlib import Path


SPRITES = [
    "vex-idle",
    "vex-briefing",
    "vex-cheer",
    "vex-sad",
    "vex-idle_nobg",
    "vex-briefing_nobg",
    "vex-cheer_nobg",
    "vex-sad_nobg",
    "scout-bot",
    "scout-bot_nobg",
    "sage-bot",
    "sage-bot_nobg",
]

NOIR_DIR = Path(__file__).resolve().parent.parent / "assets" / "sprites" / "cipher-heist" / "noir"


def main() -> int:
    try:
        from rembg import new_session, remove
        from PIL import Image
    except ImportError as e:
        print(f"[ERROR] {e}")
        return 1

    print("[*] Loading rembg session (isnet-general-use)...")
    session = new_session("isnet-general-use")
    print(f"[*] Processing {len(SPRITES)} sprites in {NOIR_DIR}")

    failures: list[str] = []
    for name in SPRITES:
        p = NOIR_DIR / f"{name}.png"
        if not p.exists():
            print(f"  [SKIP] {name} — not found")
            failures.append(name)
            continue

        try:
            data = p.read_bytes()
            out = remove(data, session=session)
            p.write_bytes(out)
            img = Image.open(p)
            if "A" not in img.getbands():
                print(f"  [WARN] {name} — no alpha after rembg")
                failures.append(name)
                continue
            lo, hi = img.getchannel("A").getextrema()
            if lo == 255:
                print(f"  [WARN] {name} — alpha fully opaque ({lo}-{hi})")
                failures.append(name)
                continue
            print(f"  [OK]   {name} ({img.size[0]}x{img.size[1]}, alpha {lo}-{hi})")
        except Exception as e:
            print(f"  [FAIL] {name} — {e}")
            failures.append(name)

    print(f"\n[*] Done. {len(SPRITES) - len(failures)}/{len(SPRITES)} succeeded.")
    if failures:
        print(f"    Failed/skipped: {failures}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
