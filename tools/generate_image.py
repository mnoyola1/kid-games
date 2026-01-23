#!/usr/bin/env python3
"""
Generate game images using Google Gemini API (Nano Banana).

Usage:
    python generate_image.py --prompt "golden coin spinning" --type sprite --style pixel-art --output assets/sprites/coin.png
    python generate_image.py -p "magical forest background" -t background -s painterly -o assets/backgrounds/forest.png
    python generate_image.py -p "Game Over text" -t ui --quality -o assets/ui/gameover.png
"""
from __future__ import annotations  # Python 3.7 compatibility
import argparse
import os
import sys
from pathlib import Path
from typing import List

# Add parent directory for config import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import GOOGLE_API_KEY, IMAGE_DEFAULTS

# Style modifiers for consistent game art
STYLE_MODIFIERS = {
    "pixel-art": "pixel art style, retro game aesthetic, crisp pixels, limited color palette, no anti-aliasing",
    "8-bit": "8-bit retro game style, very limited color palette, chunky pixels, NES era aesthetic",
    "16-bit": "16-bit game style, SNES era aesthetic, more colors than 8-bit, detailed pixel art",
    "painterly": "digital painting style, soft brushstrokes, rich colors, fantasy game aesthetic",
    "realistic": "realistic digital art, detailed textures, photorealistic lighting",
    "cartoon": "cartoon style, bold outlines, vibrant colors, fun and friendly",
    "flat": "flat design, minimal shading, solid colors, modern clean aesthetic",
    "anime": "anime style, cel shaded, expressive, Japanese game aesthetic",
}

# Asset type modifiers
TYPE_MODIFIERS = {
    "sprite": "game sprite, centered composition, clean edges, suitable for game engine",
    "background": "game background, wide composition, atmospheric, parallax-friendly layers",
    "ui": "UI element, clean design, high contrast, readable at small sizes",
    "icon": "game icon, simple recognizable shape, works at 64x64 pixels",
    "tileset": "seamless tile, repeatable pattern, consistent lighting",
}


def generate_image(
    prompt: str,
    output_path: str,
    style: str = None,
    asset_type: str = "sprite",
    quality: bool = False,
    size: str = None,
) -> List[str]:
    """
    Generate an image using Google Gemini API.
    
    Args:
        prompt: Description of the image to generate
        output_path: Where to save the image
        style: Art style (pixel-art, painterly, etc.)
        asset_type: Type of asset (sprite, background, ui)
        quality: Use higher quality model (better for text)
        size: Image size (default based on type)
    
    Returns:
        List of saved file paths
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
    
    # Build enhanced prompt
    enhanced_parts = []
    
    if style and style in STYLE_MODIFIERS:
        enhanced_parts.append(STYLE_MODIFIERS[style])
    
    if asset_type and asset_type in TYPE_MODIFIERS:
        enhanced_parts.append(TYPE_MODIFIERS[asset_type])
    
    enhanced_parts.append(prompt)
    
    # Add common game asset qualities
    if asset_type == "sprite":
        enhanced_parts.append("transparent background where appropriate")
    elif asset_type == "background":
        enhanced_parts.append("no UI elements, immersive scene")
    
    enhanced_prompt = ", ".join(enhanced_parts)
    
    # Select model
    model_name = IMAGE_DEFAULTS["model_quality"] if quality else IMAGE_DEFAULTS["model"]
    
    print(f"Generating: {prompt[:50]}...")
    print(f"  Style: {style or 'default'}")
    print(f"  Type: {asset_type}")
    print(f"  Model: {model_name}")
    
    # Initialize client
    client = genai.Client(api_key=GOOGLE_API_KEY)
    
    # Generate image
    response = client.models.generate_content(
        model=model_name,
        contents=enhanced_prompt,
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"]
        )
    )
    
    # Process response and save images
    output_dir = Path(output_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)
    
    saved_paths = []
    image_count = 0
    
    for part in response.candidates[0].content.parts:
        if hasattr(part, 'inline_data') and part.inline_data:
            image_count += 1
            
            # Determine output filename
            if image_count == 1:
                save_path = Path(output_path)
            else:
                base = Path(output_path)
                save_path = base.parent / f"{base.stem}_{image_count}{base.suffix}"
            
            # Save the image
            image = part.inline_data
            with open(save_path, 'wb') as f:
                f.write(image.data)
            
            print(f"  Saved: {save_path}")
            saved_paths.append(str(save_path))
    
    if not saved_paths:
        print("  Warning: No images in response")
        # Check for text response
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'text') and part.text:
                print(f"  Model response: {part.text[:200]}")
    
    return saved_paths


def main():
    parser = argparse.ArgumentParser(
        description="Generate game images using Google Gemini API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Pixel art sprite
  python generate_image.py -p "golden spinning coin" -t sprite -s pixel-art -o assets/sprites/coin.png

  # Painterly background
  python generate_image.py -p "magical forest with glowing mushrooms" -t background -s painterly -o assets/backgrounds/forest.png

  # UI element with text (use --quality for better text rendering)
  python generate_image.py -p "Play Again button, green" -t ui --quality -o assets/ui/play_again.png

Styles: pixel-art, 8-bit, 16-bit, painterly, realistic, cartoon, flat, anime
Types: sprite, background, ui, icon, tileset
        """
    )
    
    parser.add_argument("--prompt", "-p", required=True, help="Image description")
    parser.add_argument("--output", "-o", required=True, help="Output file path")
    parser.add_argument("--style", "-s", choices=list(STYLE_MODIFIERS.keys()), help="Art style")
    parser.add_argument("--type", "-t", dest="asset_type", choices=list(TYPE_MODIFIERS.keys()), default="sprite", help="Asset type")
    parser.add_argument("--quality", "-q", action="store_true", help="Use higher quality model (better for text)")
    parser.add_argument("--size", help="Image size (e.g., 1024x1024)")
    
    args = parser.parse_args()
    
    paths = generate_image(
        prompt=args.prompt,
        output_path=args.output,
        style=args.style,
        asset_type=args.asset_type,
        quality=args.quality,
        size=args.size,
    )
    
    if paths:
        print(f"\nGenerated {len(paths)} image(s)")
    else:
        print("\nNo images generated")
        sys.exit(1)


if __name__ == "__main__":
    main()
