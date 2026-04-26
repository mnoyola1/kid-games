"""Regenerate the 8 lobby icons (3 mode + 5 pack) in a uniform gold-leaf
art-deco line-art style so they match the lobby-F-noir.png mockup.

Each icon is generated on a solid black background, then `rembg` strips
the background to give a true transparent PNG. We DON'T pass --remove-bg
to generate_image.py here because we want full control of the prompt:
generate_image.py would otherwise inject a "solid color background" hint
that conflicts with our explicit dark-vault staging cue.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed


REPO = Path(__file__).resolve().parent.parent
NOIR_DIR = REPO / "assets" / "sprites" / "cipher-heist" / "noir"
GENERATE_SCRIPT = REPO.parent / "_shared" / "tools" / "image" / "generate_image.py"


# Style block applied to every prompt. Forbids the "app icon" badge frame
# (cyan/blue circular border) Gemini defaults to.
STYLE = (
    "isolated subject ONLY on a pure solid white background, vintage gold "
    "engraving style, antique amber gold (#c9a04a) tone with darker "
    "engraved hatch shading, art-deco / Victorian filigree line-art, "
    "high contrast clean edges, single mark composition, NO circular "
    "badge, NO border ring, NO disc, NO frame, NO seal, NO app icon "
    "background, NO blue, NO cyan, NO teal, NO gradient backdrop, no "
    "text, no watermark"
)


ICONS: list[tuple[str, str]] = [
    # MODE
    ("icon-mode-solo",
     "single masked agent silhouette wearing fedora and trench coat, "
     "subtle filigree flourish behind shoulder"),
    ("icon-mode-hotseat",
     "two ornate art-deco chairs facing each other across a small round "
     "table, side perspective"),
    ("icon-mode-online",
     "ornate wireframe globe etched with latitude and longitude lines, "
     "small connection-node dots on its surface"),

    # SUBJECT PACK
    ("icon-pack-math",
     "ornate brass compass and protractor crossed over a small open "
     "ledger, mathematical numerals visible"),
    ("icon-pack-spell",
     "ornate quill pen dipped in an inkwell, single calligraphic "
     "flourish swirl beside it"),
    ("icon-pack-science",
     "vintage brass microscope with engraved barrel, ornate base"),
    ("icon-pack-word",
     "ornate leather-bound book lying open with a quill pen on its page"),
    ("icon-pack-geo",
     "ornate world globe on a brass stand, compass rose detail"),
]


def generate_one(name: str, subject: str) -> tuple[str, bool, str]:
    """Generate a single icon. Returns (name, success, message)."""
    out_path = NOIR_DIR / f"{name}.png"
    prompt = f"{subject}. {STYLE}"

    try:
        result = subprocess.run(
            [
                sys.executable,
                str(GENERATE_SCRIPT),
                "-p", prompt,
                # `feature` doesn't trigger the "app icon" badge reflex
                # `sprite` would also work; both produce 1:1 isolated subjects.
                "-t", "sprite",
                "--pro",  # Nano Banana 2 follows color/negative cues better
                "-o", str(out_path),
            ],
            check=True,
            capture_output=True,
            text=True,
            timeout=240,
        )
        return (name, True, "generated")
    except subprocess.TimeoutExpired:
        return (name, False, "timeout")
    except subprocess.CalledProcessError as e:
        tail = (e.stderr or e.stdout or "").splitlines()[-3:]
        return (name, False, f"failed: {' | '.join(tail)}")


def strip_bg_one(name: str) -> tuple[str, bool, str]:
    """Strip BG from a generated icon in-place."""
    p = NOIR_DIR / f"{name}.png"
    if not p.exists():
        return (name, False, "missing input")

    try:
        from rembg import new_session, remove
        from PIL import Image
    except ImportError as e:
        return (name, False, f"rembg missing: {e}")

    # Re-use a session per call (called serially after generation)
    return _strip(p)


_session = None


def _strip(p: Path) -> tuple[str, bool, str]:
    global _session
    from rembg import new_session, remove
    from PIL import Image

    if _session is None:
        _session = new_session("isnet-general-use")

    try:
        data = p.read_bytes()
        out = remove(data, session=_session)
        p.write_bytes(out)
        img = Image.open(p)
        if "A" not in img.getbands():
            return (p.stem, False, "no alpha")
        lo, hi = img.getchannel("A").getextrema()
        if lo == 255:
            return (p.stem, False, f"alpha fully opaque ({lo}-{hi})")
        return (p.stem, True, f"alpha {lo}-{hi}")
    except Exception as e:
        return (p.stem, False, f"strip failed: {e}")


def main() -> int:
    print(f"[*] Regenerating {len(ICONS)} lobby icons in {NOIR_DIR}")
    NOIR_DIR.mkdir(parents=True, exist_ok=True)

    # Phase 1: parallel generation (3-wide; Gemini quota allows it)
    print("[*] Phase 1: generating icons (parallel x3)...")
    gen_results: list[tuple[str, bool, str]] = []
    with ThreadPoolExecutor(max_workers=3) as ex:
        futures = {ex.submit(generate_one, n, s): n for n, s in ICONS}
        for fut in as_completed(futures):
            res = fut.result()
            name, ok, msg = res
            mark = "[OK]  " if ok else "[FAIL]"
            print(f"  {mark} gen   {name:<24} {msg}")
            gen_results.append(res)

    # Phase 2: strip backgrounds serially (rembg session is not thread safe
    # in our use, and is fast anyway).
    print("\n[*] Phase 2: stripping backgrounds...")
    strip_results: list[tuple[str, bool, str]] = []
    for name, ok, _ in gen_results:
        if not ok:
            strip_results.append((name, False, "skipped (gen failed)"))
            continue
        res = strip_bg_one(name)
        n, k, m = res
        mark = "[OK]  " if k else "[FAIL]"
        print(f"  {mark} strip {n:<24} {m}")
        strip_results.append(res)

    print("\n[*] Done.")
    failed = [n for n, ok, _ in gen_results + strip_results if not ok]
    if failed:
        print(f"    Failed: {sorted(set(failed))}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
