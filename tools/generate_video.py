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
    duration: int = 3,
    aspect_ratio: str = "1:1",
) -> str:
    """
    Generate a video using Google Gemini API.
    
    Args:
        prompt: Description of the video to generate
        output_path: Where to save the video
        duration: Video duration in seconds (3-8)
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
    enhanced_prompt = f"{prompt}, smooth loop animation, fantasy game art style, clean and polished"
    
    print(f"[Gemini Video] Generating video...")
    print(f"   Prompt: {prompt}")
    print(f"   Duration: {duration}s")
    print(f"   Aspect: {aspect_ratio}")
    
    try:
        # Generate video using Gemini Imagen 3
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=enhanced_prompt,
            config=types.GenerateContentConfig(
                response_modalities=['VIDEO'],
                video_config=types.VideoConfig(
                    duration=duration,
                    aspect_ratio=aspect_ratio,
                )
            )
        )
        
        # Save the video
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            
            # Extract video data
            if hasattr(candidate, 'content') and candidate.content.parts:
                for part in candidate.content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        video_data = part.inline_data.data
                        
                        # Create output directory if needed
                        output_dir = os.path.dirname(output_path)
                        if output_dir:
                            os.makedirs(output_dir, exist_ok=True)
                        
                        # Write video file
                        with open(output_path, 'wb') as f:
                            f.write(video_data)
                        
                        file_size = len(video_data) / 1024
                        print(f"[SUCCESS] Saved: {output_path} ({file_size:.1f} KB)")
                        return output_path
        
        print("[ERROR] No video data in response")
        return None
        
    except Exception as e:
        print(f"[ERROR] Generation failed: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description='Generate animated videos for game assets')
    parser.add_argument('-p', '--prompt', required=True, help='Video description')
    parser.add_argument('-o', '--output', required=True, help='Output path (e.g., assets/sprites/monster.mp4)')
    parser.add_argument('-d', '--duration', type=int, default=3, help='Duration in seconds (3-8)')
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
