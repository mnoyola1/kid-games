#!/usr/bin/env python3
"""
Generate music using Google Vertex AI Lyria 2 model.

Usage:
    python tools/generate_music_vertex.py --prompt "uplifting orchestral music" --output assets/audio/test.wav
    python tools/generate_music_vertex.py --prompt "calm piano melody" --negative "drums, fast tempo" --output menu.wav
"""
import argparse
import base64
import json
import os
import subprocess
import sys
from pathlib import Path

def get_access_token():
    """Get access token from gcloud CLI."""
    # Try common gcloud paths on Windows
    gcloud_paths = [
        "gcloud",  # If in PATH
        r"C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
        r"C:\Users\mnoyo\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
    ]
    
    for gcloud_cmd in gcloud_paths:
        try:
            result = subprocess.run(
                [gcloud_cmd, "auth", "print-access-token"],
                capture_output=True,
                text=True,
                check=True,
                shell=True if gcloud_cmd == "gcloud" else False
            )
            return result.stdout.strip()
        except (subprocess.CalledProcessError, FileNotFoundError):
            continue
    
    print("Error: Could not find gcloud command")
    print("Make sure you're authenticated with: gcloud auth login")
    sys.exit(1)

def generate_music(
    prompt: str,
    output_path: str,
    negative_prompt: str = None,
    seed: int = None,
    sample_count: int = 1,
    project_id: str = "gen-lang-client-0790630511",
    location: str = "us-central1"
) -> str:
    """
    Generate music using Lyria 2 model.
    
    Args:
        prompt: Text description of the music to generate (US English)
        output_path: Path to save the WAV file
        negative_prompt: Optional description of what to exclude
        seed: Optional seed for reproducible output (cannot use with sample_count > 1)
        sample_count: Number of samples to generate (cannot use with seed)
        project_id: Google Cloud project ID
        location: Region for Vertex AI (e.g., us-central1)
    
    Returns:
        Path to the generated audio file(s)
    """
    import requests
    
    # Validate parameters
    if seed is not None and sample_count > 1:
        print("Warning: Cannot use both seed and sample_count > 1. Using seed, ignoring sample_count.")
        sample_count = None
    
    # Get access token
    access_token = get_access_token()
    
    # Prepare request
    url = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/publishers/google/models/lyria-002:predict"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Build instance
    instance = {
        "prompt": prompt
    }
    
    if negative_prompt:
        instance["negative_prompt"] = negative_prompt
    
    if seed is not None:
        instance["seed"] = seed
    
    # Build parameters
    parameters = {}
    if sample_count and seed is None:
        parameters["sample_count"] = sample_count
    
    # Build request body
    data = {
        "instances": [instance],
        "parameters": parameters
    }
    
    print(f"[Lyria 2] Generating music...")
    print(f"   Prompt: {prompt}")
    if negative_prompt:
        print(f"   Negative: {negative_prompt}")
    if seed:
        print(f"   Seed: {seed}")
    if sample_count and seed is None:
        print(f"   Samples: {sample_count}")
    
    # Send request
    try:
        response = requests.post(url, headers=headers, json=data, timeout=60)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Error calling Lyria API: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response: {e.response.text}")
        sys.exit(1)
    
    # Parse response
    result = response.json()
    
    if "error" in result:
        print(f"[ERROR] API Error: {result['error']}")
        sys.exit(1)
    
    predictions = result.get("predictions", [])
    
    if not predictions:
        print("[ERROR] No predictions in response")
        sys.exit(1)
    
    # Save audio file(s)
    output_dir = Path(output_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)
    
    saved_files = []
    
    for i, prediction in enumerate(predictions):
        # Try both possible keys for audio content
        audio_content = prediction.get("audioContent") or prediction.get("bytesBase64Encoded")
        if not audio_content:
            print(f"[WARNING] No audio content in prediction {i+1}")
            print(f"[DEBUG] Available keys: {list(prediction.keys())}")
            continue
        
        # Decode base64 audio
        audio_bytes = base64.b64decode(audio_content)
        
        # Determine output filename
        if len(predictions) == 1:
            file_path = output_path
        else:
            # Multiple samples: add suffix
            base = Path(output_path)
            file_path = base.parent / f"{base.stem}_{i+1}{base.suffix}"
        
        # Save audio file
        with open(file_path, "wb") as f:
            f.write(audio_bytes)
        
        # Get file size
        size_kb = len(audio_bytes) / 1024
        
        print(f"[SUCCESS] Saved: {file_path} ({size_kb:.1f} KB)")
        saved_files.append(str(file_path))
    
    # Print summary
    print(f"\n[COMPLETE] Generated {len(saved_files)} audio clip(s)")
    print(f"[INFO] Format: 48kHz stereo WAV, ~30 seconds each")
    print(f"[COST] Estimated: ${len(saved_files) * 0.06:.2f}")
    
    return saved_files[0] if len(saved_files) == 1 else saved_files

def main():
    parser = argparse.ArgumentParser(
        description="Generate music using Google Vertex AI Lyria 2",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Simple generation
  python generate_music_vertex.py -p "uplifting orchestral music" -o assets/audio/shared/music/menu.wav
  
  # With negative prompt
  python generate_music_vertex.py -p "calm piano melody" -n "drums, fast tempo" -o assets/audio/game/calm.wav
  
  # With seed for reproducibility
  python generate_music_vertex.py -p "epic battle music" --seed 12345 -o assets/audio/game/battle.wav
  
  # Generate multiple variations
  python generate_music_vertex.py -p "cheerful kids music" --samples 3 -o assets/audio/game/happy.wav

Notes:
  - Generates 30-second instrumental music clips
  - Output format: 48kHz stereo WAV
  - Cost: ~$0.06 per 30-second clip
  - Prompt language: US English only
        """
    )
    
    parser.add_argument(
        "--prompt", "-p",
        required=True,
        help="Text description of the music to generate (US English)"
    )
    
    parser.add_argument(
        "--output", "-o",
        required=True,
        help="Output path for the WAV file"
    )
    
    parser.add_argument(
        "--negative", "-n",
        help="Optional: description of what to exclude from the music"
    )
    
    parser.add_argument(
        "--seed",
        type=int,
        help="Optional: seed for reproducible output (cannot use with --samples)"
    )
    
    parser.add_argument(
        "--samples",
        type=int,
        default=1,
        help="Number of variations to generate (cannot use with --seed)"
    )
    
    parser.add_argument(
        "--project",
        default="gen-lang-client-0790630511",
        help="Google Cloud project ID (default: %(default)s)"
    )
    
    parser.add_argument(
        "--location",
        default="us-central1",
        help="Vertex AI region (default: %(default)s)"
    )
    
    args = parser.parse_args()
    
    # Generate music
    try:
        generate_music(
            prompt=args.prompt,
            output_path=args.output,
            negative_prompt=args.negative,
            seed=args.seed,
            sample_count=args.samples,
            project_id=args.project,
            location=args.location
        )
    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
