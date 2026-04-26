"""One-off: strip backgrounds from the noir icon set.

The noir icons were saved as JPEGs with opaque dark backgrounds. We need
true transparent PNGs so they sit naturally on the lobby cards.
"""
from __future__ import annotations

import sys
from pathlib import Path


ICONS = [
    "icon-mode-solo",
    "icon-mode-hotseat",
    "icon-mode-online",
    "icon-pack-math",
    "icon-pack-spell",
    "icon-pack-science",
    "icon-pack-word",
    "icon-pack-geo",
    "icon-vault",
    "icon-firewall",
    "icon-scope",
    "icon-bit-surge",
    "icon-lock-locked",
    "icon-lock-unlocked",
]

NOIR_DIR = Path(__file__).resolve().parent.parent / "assets" / "sprites" / "cipher-heist" / "noir"


def main() -> int:
    try:
        from rembg import new_session, remove
        from PIL import Image
    except ImportError as e:
        print(f"[ERROR] Missing dep: {e}. Install with: py -m pip install rembg pillow onnxruntime")
        return 1

    print(f"[*] Loading rembg session (isnet-general-use)...")
    session = new_session("isnet-general-use")
    print(f"[*] Session ready. Processing {len(ICONS)} icons in {NOIR_DIR}")

    failures: list[str] = []
    for name in ICONS:
        in_path = NOIR_DIR / f"{name}.png"
        out_path = NOIR_DIR / f"{name}.png"  # overwrite

        if not in_path.exists():
            print(f"  [SKIP] {name} — not found")
            failures.append(name)
            continue

        try:
            data = in_path.read_bytes()
            out = remove(data, session=session)
            out_path.write_bytes(out)

            img = Image.open(out_path)
            if "A" not in img.getbands():
                print(f"  [WARN] {name} — no alpha channel after rembg")
                failures.append(name)
                continue
            lo, hi = img.getchannel("A").getextrema()
            if lo == 255:
                print(f"  [WARN] {name} — alpha fully opaque after rembg (alpha range: {lo}-{hi})")
                failures.append(name)
                continue
            print(f"  [OK]   {name} ({img.size[0]}x{img.size[1]}, alpha {lo}-{hi})")
        except Exception as e:
            print(f"  [FAIL] {name} — {e}")
            failures.append(name)

    print(f"\n[*] Done. {len(ICONS) - len(failures)}/{len(ICONS)} succeeded.")
    if failures:
        print(f"    Failed: {', '.join(failures)}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
