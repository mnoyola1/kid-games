#!/usr/bin/env python3
"""
Generate animated videos using Google Gemini API.

Usage:
    python generate_video.py --prompt "slime monster bouncing animation" --output assets/sprites/word-forge/slime_animated.mp4
"""
from __future__ import annotations
import argparse
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import GOOGLE_API_KEY

def generate_video(
    prompt: str,
    output_path: str,
    duration: int = 4,
    aspect_ratio: str = "1:1",
) -> str:
    """
    Generate a video using Veo 3.1 API.
    
    Args:
        prompt: Description of the video to generate
        output_path: Where to save the video
        duration: Video duration in seconds (4, 6, or 8)
        aspect_ratio: Aspect ratio (1:1, 16:9, 9:16)
    
    Returns:
        Saved file path
    """
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        print("Error: google-genai package not installed.")
        print("Run: pip install google-genai")
        sys.exit(1)
    
    if not GOOGLE_API_KEY:
        print("Error: GOOGLE_API_KEY not set in .env or environment")
        sys.exit(1)
    
    # Initialize client
    client = genai.Client(api_key=GOOGLE_API_KEY)
    
    # Build enhanced prompt for game animations
    enhanced_prompt = f"{prompt}, seamless loop animation, fantasy game art, smooth movement, transparent background if possible"
    
    print(f"[Veo 3.1] Generating video...")
    print(f"   Prompt: {prompt}")
    print(f"   Duration: {duration}s")
    print(f"   Aspect: {aspect_ratio}")
    print(f"   Model: veo-3.1-generate-preview")
    
    try:
        # Generate video using Veo 3.1
        operation = client.models.generate_videos(
            model='veo-3.1-generate-preview',
            prompt=enhanced_prompt,
            config=types.GenerateVideosConfig(
                aspect_ratio=aspect_ratio,
                duration_seconds=str(duration),
                resolution="720p",
            )
        )
        
        print("[Veo 3.1] Video generation started, polling for completion...")
        
        # Poll the operation status until the video is ready
        poll_count = 0
        while not operation.done:
            poll_count += 1
            print(f"   Waiting... (poll {poll_count})")
            time.sleep(10)
            operation = client.operations.get(operation)
        
        print(f"[Veo 3.1] Generation complete after {poll_count * 10} seconds")
        
        # Download the generated video
        if operation.response and operation.response.generated_videos:
            generated_video = operation.response.generated_videos[0]
            
            # Create output directory if needed
            output_dir = os.path.dirname(output_path)
            if output_dir:
                os.makedirs(output_dir, exist_ok=True)
            
            # Download and save the video
            client.files.download(file=generated_video.video)
            generated_video.video.save(output_path)
            
            # Get file size
            file_size = os.path.getsize(output_path) / (1024 * 1024)  # MB
            print(f"[SUCCESS] Saved: {output_path} ({file_size:.2f} MB)")
            return output_path
        
        print("[ERROR] No video data in response")
        return None
        
    except Exception as e:
        print(f"[ERROR] Generation failed: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    parser = argparse.ArgumentParser(description='Generate animated videos for game assets using Veo 3.1')
    parser.add_argument('-p', '--prompt', required=True, help='Video description')
    parser.add_argument('-o', '--output', required=True, help='Output path (e.g., assets/sprites/monster.mp4)')
    parser.add_argument('-d', '--duration', type=int, default=4, choices=[4, 6, 8], help='Duration in seconds (4, 6, or 8)')
    parser.add_argument('-a', '--aspect', default='1:1', choices=['1:1', '16:9', '9:16'], help='Aspect ratio')
    
    args = parser.parse_args()
    
    result = generate_video(
        prompt=args.prompt,
        output_path=args.output,
        duration=args.duration,
        aspect_ratio=args.aspect,
    )
    
    if result:
        print(f"\n[COMPLETE] Generated video")
    else:
        print(f"\n[FAILED] Could not generate video")
        sys.exit(1)


if __name__ == '__main__':
    main()
