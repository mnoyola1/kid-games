"""
Full audio dialect analysis:
1. Convert m4a to mp3 using moviepy
2. Analyze with OpenAI GPT-4o audio preview
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

def convert_to_mp3(input_path, output_path=None):
    """Convert audio file to mp3 using moviepy."""
    from moviepy import AudioFileClip
    
    input_file = Path(input_path)
    if output_path is None:
        output_path = input_file.with_suffix('.mp3')
    
    print(f"Converting {input_file.name} to MP3...")
    
    audio = AudioFileClip(str(input_file))
    audio.write_audiofile(str(output_path), logger=None)
    audio.close()
    
    print(f"Converted to: {output_path}")
    return output_path

def analyze_with_openai(audio_path):
    """Analyze audio dialect using OpenAI GPT-4o audio preview."""
    from openai import OpenAI
    
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    audio_file = Path(audio_path)
    print(f"Reading audio: {audio_file.name} ({audio_file.stat().st_size} bytes)")
    
    # Read and encode audio
    with open(audio_file, 'rb') as f:
        audio_data = base64.standard_b64encode(f.read()).decode('utf-8')
    
    print("Sending to GPT-4o for dialect analysis...")
    
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

You are deeply familiar with ALL major Chinese dialect groups:
- Northern Mandarin (Beijing, Northeastern/Dongbei, Northwestern)
- Southwestern Mandarin (Sichuan, Chongqing, Yunnan, Guizhou, Hubei)
- Wu dialects (Shanghai, Suzhou, Ningbo, Wenzhou)
- Cantonese and Yue dialects (Guangzhou, Hong Kong)
- Min dialects (Fujianese, Hokkien, Taiwanese, Teochew)
- Hakka
- Gan (Jiangxi)
- Xiang (Hunanese)

Pay close attention to the ACTUAL SOUNDS - the tones, the accent, the pronunciation.'''
            },
            {
                'role': 'user',
                'content': [
                    {
                        'type': 'text',
                        'text': '''Listen carefully to this audio and provide a detailed dialect analysis.

IMPORTANT: Base your analysis on what you ACTUALLY HEAR in the audio - the pronunciation, tones, accent, rhythm.

Provide:

1. **TRANSCRIPTION**: What is being said (Chinese characters + pinyin)

2. **DIALECT IDENTIFICATION**: What specific dialect/regional accent is this?
   - Be specific (e.g., "Sichuan Mandarin" not just "Southern")
   - Consider all possibilities including Southwestern Mandarin (Sichuan, Chongqing, Yunnan, Guizhou)

3. **AUDIO EVIDENCE** (Critical - what you HEAR):
   - Tonal patterns: Are the tones standard Mandarin or modified? (Sichuan often merges tones 2 and 3)
   - Retroflex sounds: Are "zh, ch, sh, r" pronounced clearly or as "z, c, s"?
   - Final consonants: Any nasal finals (-n, -ng) merged?
   - Vowel shifts: Any characteristic vowel changes?
   - Rhythm and intonation: Fast? Slow? Rising patterns?

4. **CONFIDENCE LEVEL**: High/Medium/Low with explanation

5. **ENGLISH TRANSLATION**: What is being said

6. **REGIONAL ORIGIN**: Most likely province/city

7. **NORTHERN vs SOUTHERN**: Previous text analysis suggested Northeastern Mandarin. Based on what you HEAR, is this Northern or Southern? What evidence?'''
                    },
                    {
                        'type': 'input_audio',
                        'input_audio': {
                            'data': audio_data,
                            'format': 'mp3'
                        }
                    }
                ]
            }
        ]
    )
    
    return response.choices[0].message.content

if __name__ == "__main__":
    import sys
    
    audio_file = sys.argv[1] if len(sys.argv) > 1 else "New Recording 6.m4a"
    
    print(f"Analyzing: {audio_file}")
    print("=" * 60)
    
    try:
        input_path = Path(audio_file)
        
        # Convert to mp3 if needed
        if input_path.suffix.lower() == '.m4a':
            mp3_path = convert_to_mp3(audio_file)
        else:
            mp3_path = input_path
        
        # Analyze
        result = analyze_with_openai(mp3_path)
        
        # Save to file FIRST
        output_file = f"dialect_audio_analysis_{input_path.stem}.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"Audio File: {audio_file}\n")
            f.write("=" * 60 + "\n")
            f.write("GPT-4o Audio Dialect Analysis:\n")
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
