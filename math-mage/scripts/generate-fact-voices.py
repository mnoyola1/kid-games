#!/usr/bin/env python3
"""
Pre-generate Cartesia voice clips for the Math Mage fact pack.

For each table this script generates two clips per ordered fact pair:
  • q_AxB.mp3  — "{a in words} times {b in words}"          (first-appearance prompt)
  • f_AxB.mp3  — "{a in words} times {b in words} is N"    (post-miss / lock-in confirmation)

Output dir:  C:/Dev/n-solutions/n-games/assets/audio/math-mage/voice/

Why pre-generate (vs runtime /api/tts):
  • Zero network latency on first encounter — the kid hears the prompt
    instantly, not after a 600-800ms Cartesia roundtrip.
  • Works against the local python http.server (which can't run /api/* fns).
  • Cost: 26 ordered pairs × 2 phrasings = 52 clips × ~$0.01 = ~$0.52
    per table. Cheap enough to do for whichever table is being focused on
    that week.

Usage (PowerShell):
  python C:/Dev/n-solutions/n-games/math-mage/scripts/generate-fact-voices.py --table 6
  python ...generate-fact-voices.py --table 6 --voice calm_male
  python ...generate-fact-voices.py --tables 0 1 2 3 4 5 6 7 8 9 10 11 12  # all
"""
import argparse
import os
import sys
import time
from pathlib import Path

# Make the shared tools importable.
SHARED_TOOLS = Path("C:/Dev/n-solutions/_shared/tools")
if str(SHARED_TOOLS) not in sys.path:
    sys.path.insert(0, str(SHARED_TOOLS))

from audio.generate_voice import generate_voice  # noqa: E402

# 0-12 word names. Beyond 12 we let Cartesia speak the digit form;
# Sonic-2 already converts "42" → "forty-two" idiomatically.
NUMBER_NAMES = [
    "zero", "one", "two", "three", "four", "five", "six",
    "seven", "eight", "nine", "ten", "eleven", "twelve",
]


def num_name(n: int) -> str:
    if 0 <= n <= 12:
        return NUMBER_NAMES[n]
    return str(n)


def question_phrase(a: int, b: int) -> str:
    return f"{num_name(a)} times {num_name(b)}"


def fact_phrase(a: int, b: int) -> str:
    return f"{num_name(a)} times {num_name(b)} is {a * b}"


def ordered_pairs_for_table(target: int):
    """Match mmFactsForTable in game-config.js — both (a,target) and (target,b)."""
    pairs = []
    for n in range(0, 13):
        pairs.append((n, target))
    for n in range(0, 13):
        pairs.append((target, n))
    return pairs


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--table", type=int, help="Single target table to generate (e.g. 6)")
    parser.add_argument("--tables", type=int, nargs="+", help="Multiple target tables")
    parser.add_argument("--voice", default="calm_male",
                        choices=["cheerful_female", "calm_male", "wise_elder", "excited_child"],
                        help="Cartesia voice preset (default: calm_male — wizard-storyteller)")
    parser.add_argument("--speed", type=float, default=0.95,
                        help="Speech speed (default 0.95, slightly slower for kid clarity)")
    parser.add_argument("--out-dir", default="C:/Dev/n-solutions/n-games/assets/audio/math-mage/voice",
                        help="Output directory (must end in /voice/)")
    parser.add_argument("--overwrite", action="store_true", help="Re-generate files that already exist")
    parser.add_argument("--dry-run", action="store_true", help="Print plan, no API calls")
    args = parser.parse_args()

    if args.table is None and not args.tables:
        parser.error("Pass --table 6 or --tables 0 1 2 ...")
    targets = args.tables if args.tables else [args.table]

    out_root = Path(args.out_dir)
    out_root.mkdir(parents=True, exist_ok=True)

    # Build the work list, skipping already-generated files unless --overwrite.
    jobs = []
    for target in targets:
        for (a, b) in ordered_pairs_for_table(target):
            for kind, text_fn in (("q", question_phrase), ("f", fact_phrase)):
                fname = f"{kind}_{a}x{b}.mp3"
                fpath = out_root / fname
                if fpath.exists() and not args.overwrite:
                    continue
                jobs.append((fpath, text_fn(a, b)))

    # Deduplicate jobs by output path — same ordered pair appears once
    # per target table when --tables overlap (e.g. (6,7) shows up as part
    # of both ×6 and ×7).
    seen = set()
    unique_jobs = []
    for path, text in jobs:
        if path in seen:
            continue
        seen.add(path)
        unique_jobs.append((path, text))

    print(f"Tables:    {targets}")
    print(f"Voice:     {args.voice}")
    print(f"Speed:     {args.speed}")
    print(f"Out dir:   {out_root}")
    print(f"Jobs:      {len(unique_jobs)} clips (~${len(unique_jobs)*0.01:.2f})")
    print(f"Skipped:   {len(jobs) - len(unique_jobs)} duplicate(s)")

    if args.dry_run:
        print("\nDRY RUN — first 8 jobs:")
        for path, text in unique_jobs[:8]:
            print(f"  {path.name:<14}  \"{text}\"")
        return

    print()
    failed = 0
    for i, (path, text) in enumerate(unique_jobs, 1):
        try:
            print(f"[{i}/{len(unique_jobs)}] {path.name:<14} ", end="", flush=True)
            generate_voice(text=text, output_path=str(path), voice=args.voice, speed=args.speed)
            # Small jitter between calls to stay under any rate-limit
            # the per-account Cartesia plan may impose.
            time.sleep(0.4)
        except SystemExit:
            failed += 1
            print(f"  [FAILED]")
            # Don't kill the batch on a single failure.
        except Exception as e:
            failed += 1
            print(f"  [ERROR] {e}")

    print(f"\nDone. {len(unique_jobs) - failed} ok, {failed} failed.")


if __name__ == "__main__":
    main()
