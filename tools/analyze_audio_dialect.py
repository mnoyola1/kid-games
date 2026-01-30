"""
Analyze Chinese dialect from actual audio using GPT-4o audio capabilities.
"""
import os
import base64
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

from openai import OpenAI

def analyze_audio_dialect(audio_path):
    """Analyze dialect from actual audio using GPT-4o."""
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    audio_file = Path(audio_path)
    if not audio_file.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    
    print(f"Reading audio file: {audio_file.name}")
    print(f"File size: {audio_file.stat().st_size} bytes")
    
    # Read and encode audio
    with open(audio_file, 'rb') as f:
        audio_data = base64.standard_b64encode(f.read()).decode('utf-8')
    
    # Determine mime type
    ext = audio_file.suffix.lower()
    mime_types = {
        '.m4a': 'audio/mp4',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
    }
    mime_type = mime_types.get(ext, 'audio/mp4')
    
    print("Sending audio to GPT-4o for dialect analysis...")
    print("(Analyzing pronunciation, tone, accent, rhythm...)")
    
    response = client.chat.completions.create(
        model='gpt-4o-audio-preview',
        modalities=["text"],
        messages=[
            {
                'role': 'system',
                'content': '''You are an expert Chinese linguist specializing in dialect identification. 
You can identify Chinese dialects by listening to:
- Tonal patterns and pitch contours
- Pronunciation of specific consonants and vowels
- Rhythm, cadence, and speech flow
- Regional vocabulary and expressions
- Accent characteristics

You are familiar with ALL major Chinese dialect groups:
- Northern Mandarin (Beijing, Northeastern, Northwestern)
- Southwestern Mandarin (Sichuan, Chongqing, Yunnan, Guizhou)
- Wu dialects (Shanghai, Suzhou, Ningbo)
- Cantonese and Yue dialects
- Min dialects (Fujianese, Taiwanese)
- Hakka
- Gan (Jiangxi)
- Xiang (Hunanese)'''
            },
            {
                'role': 'user',
                'content': [
                    {
                        'type': 'text',
                        'text': '''Please listen carefully to this audio and analyze the dialect/accent. 

Provide:
1. TRANSCRIPTION: What is being said (in Chinese characters + pinyin)
2. LANGUAGE/DIALECT IDENTIFICATION: What specific dialect or regional accent is this?
3. AUDIO EVIDENCE: What specific pronunciation features, tones, or accent markers led you to this conclusion?
4. CONFIDENCE LEVEL: How confident are you (high/medium/low) and why?
5. TRANSLATION: English translation of what was said
6. REGIONAL ORIGIN: Most likely city/province the speaker is from'''
                    },
                    {
                        'type': 'input_audio',
                        'input_audio': {
                            'data': audio_data,
                            'format': 'mp4'
                        }
                    }
                ]
            }
        ]
    )
    
    return response.choices[0].message.content

if __name__ == "__main__":
    import sys
    
    # Default to New Recording 6.m4a
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
            f.write("GPT-4o Audio Dialect Analysis:\n")
            f.write("=" * 60 + "\n\n")
            f.write(result)
        
        print(f"Saved to: {output_file}")
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
