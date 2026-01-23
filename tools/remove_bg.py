#!/usr/bin/env python3
"""
Remove image backgrounds locally using rembg and save a true transparent PNG (RGBA).

IMPORTANT (Windows / Python):
- rembg depends on onnxruntime, which often lags the newest Python versions.
- If you're on Python 3.14, install Python 3.13 and run this script with: py -3.13 ...

Setup:
  py -3.13 -m pip install --user -r tools/requirements-rembg.txt

Usage:
  py -3.13 tools/remove_bg.py -i path/to/input.png -o path/to/output.png --verify

Tips:
- Best results come from generating with a SOLID, high-contrast background (pure green/magenta).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def _verify_alpha(output_path: Path) -> None:
    from PIL import Image

    img = Image.open(output_path)
    has_alpha = ("A" in img.getbands())
    print(f"Verify: mode={img.mode}, bands={img.getbands()}, size={img.size}")
    if not has_alpha:
        raise SystemExit("❌ Output has no alpha channel (not RGBA).")

    alpha = img.getchannel("A")
    lo, hi = alpha.getextrema()
    print(f"Verify: alpha extrema = ({lo}, {hi})")
    if lo == 255 and hi == 255:
        raise SystemExit("❌ Output alpha is fully opaque (no transparency detected).")

    print("OK: Output has real transparency (alpha channel present and not fully opaque).")


def main() -> None:
    if sys.version_info >= (3, 14):
        print("WARN: You're running Python 3.14+; rembg/onnxruntime wheels likely won't install.")
        print("      Install Python 3.13 and run with: py -3.13 tools/remove_bg.py ...")
        # Don't hard-exit; user might have a working setup, but warn loudly.

    parser = argparse.ArgumentParser(description="Remove background using rembg and save RGBA PNG.")
    parser.add_argument("--input", "-i", required=True, help="Input image path (png/jpg/webp).")
    parser.add_argument("--output", "-o", required=True, help="Output PNG path.")
    parser.add_argument("--verify", action="store_true", help="Verify output has real transparency.")
    parser.add_argument("--model", default="u2net", help="rembg model name (default: u2net).")
    args = parser.parse_args()

    in_path = Path(args.input)
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        from rembg import new_session, remove
    except ImportError:
        raise SystemExit(
            "rembg is not installed.\n"
            "Install with:\n"
            "  py -3.13 -m pip install --user -r tools/requirements-rembg.txt"
        )

    data = in_path.read_bytes()
    session = new_session(args.model)
    out = remove(data, session=session)
    out_path.write_bytes(out)
    print(f"OK: Wrote transparent PNG: {out_path}")

    if args.verify:
        _verify_alpha(out_path)


if __name__ == "__main__":
    main()

