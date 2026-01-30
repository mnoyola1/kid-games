"""
Analyze Chinese dialect from actual audio using Google Gemini.
Gemini supports m4a files directly.
"""
import os
from pathlib import Path

# Load env
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip())

import base64
from google import genai
from google.genai import types

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

def analyze_audio_dialect(audio_path):
    """Analyze dialect from actual audio using Gemini."""
    
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found")
    
    client = genai.Client(api_key=GOOGLE_API_KEY)
    
    audio_file = Path(audio_path)
    if not audio_file.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    
    print(f"Reading audio file: {audio_file.name}")
    print(f"File size: {audio_file.stat().st_size} bytes")
    
    # Read audio file and encode as base64
    with open(audio_file, 'rb') as f:
        audio_bytes = f.read()
    audio_data = base64.b64encode(audio_bytes).decode('utf-8')
    
    print("Analyzing audio for dialect features...")
    
    prompt = '''You are an expert Chinese linguist specializing in dialect identification.
Listen carefully to this audio and analyze the dialect/accent based on:
- Tonal patterns and pitch contours
- Pronunciation of specific consonants and vowels
- Rhythm, cadence, and speech flow
- Regional vocabulary and expressions
- Accent characteristics

Provide a detailed analysis:

1. **TRANSCRIPTION**: What is being said (in Chinese characters with pinyin)

2. **LANGUAGE/DIALECT IDENTIFICATION**: 
   - What specific dialect or regional accent is this?
   - Consider: Northern Mandarin, Northeastern, Sichuan/Southwestern, Wu (Shanghai), Cantonese, Min, Hakka, Hunanese, etc.

3. **AUDIO EVIDENCE** (IMPORTANT - base this on what you HEAR):
   - Specific pronunciation features you noticed
   - Tonal patterns (are tones standard or modified?)
   - Accent markers (retroflex sounds? final consonants? vowel shifts?)
   - Speech rhythm and intonation patterns

4. **CONFIDENCE LEVEL**: High/Medium/Low and explain why

5. **TRANSLATION**: English translation

6. **REGIONAL ORIGIN**: Most likely city/province, with alternatives

7. **COMPARISON**: If previous text-based analysis suggested Northeastern Mandarin, does the audio support or contradict this?'''
    
    # Determine mime type
    ext = audio_file.suffix.lower()
    mime_types = {
        '.m4a': 'audio/mp4',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
    }
    mime_type = mime_types.get(ext, 'audio/mp4')
    
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents=[
            {
                'role': 'user',
                'parts': [
                    {'text': prompt},
                    {'inline_data': {'mime_type': mime_type, 'data': audio_data}}
                ]
            }
        ]
    )
    
    return response.text

if __name__ == "__main__":
    import sys
    
    audio_file = sys.argv[1] if len(sys.argv) > 1 else "New Recording 6.m4a"
    
    print(f"Analyzing: {audio_file}")
    print("=" * 60)
    
    try:
        result = analyze_audio_dialect(audio_file)
        
        # Save to file FIRST
        output_file = f"dialect_audio_analysis_{Path(audio_file).stem}.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"Audio File: {audio_file}\n")
            f.write("=" * 60 + "\n")
            f.write("Gemini Audio Dialect Analysis:\n")
            f.write("=" * 60 + "\n\n")
            f.write(result)
        
        print(f"\nSaved to: {output_file}")
        print("=" * 60)
        
        # Try to print
        try:
            print(result)
        except UnicodeEncodeError:
            print(result.encode('ascii', errors='replace').decode('ascii'))
            print("\n(Some characters replaced - see saved file for full text)")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
