"""
Analyze multilingual audio - identify all languages and translate each.
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

def analyze_multilingual(audio_path):
    """Analyze multilingual audio using OpenAI GPT-4o."""
    from openai import OpenAI
    
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    audio_file = Path(audio_path)
    print(f"Reading audio: {audio_file.name} ({audio_file.stat().st_size} bytes)")
    
    with open(audio_file, 'rb') as f:
        audio_data = base64.standard_b64encode(f.read()).decode('utf-8')
    
    print("Analyzing multilingual audio with GPT-4o...")
    
    response = client.chat.completions.create(
        model='gpt-4o-audio-preview',
        modalities=["text"],
        messages=[
            {
                'role': 'system',
                'content': '''You are an expert multilingual transcriber and translator. 
You can identify and transcribe multiple languages in the same audio, including:
- English, Spanish, French, German, Italian, Portuguese
- Chinese (Mandarin, Cantonese), Japanese, Korean
- Arabic, Hindi, Russian, and many others

When multiple languages are spoken, identify each language segment separately.'''
            },
            {
                'role': 'user',
                'content': [
                    {
                        'type': 'text',
                        'text': '''This audio contains MULTIPLE LANGUAGES. Please analyze it carefully.

Provide:

1. **LANGUAGES DETECTED**: List all languages spoken in this audio

2. **FULL TRANSCRIPTION BY SPEAKER/SEGMENT**:
   For each segment of speech, provide:
   - Speaker identifier (Speaker 1, Speaker 2, etc.)
   - Language being spoken
   - Original transcription (in native script if applicable)
   - Romanization/Pinyin (if non-Latin script)
   - English translation

3. **TIMELINE** (approximate):
   - Note when each language segment occurs

4. **DIALECT/ACCENT NOTES**:
   - For each non-English language, identify the dialect or regional accent if possible

5. **CONTEXT**:
   - What seems to be happening in this conversation?

Please be thorough and identify ALL languages spoken, not just the primary one.'''
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
    
    audio_file = sys.argv[1] if len(sys.argv) > 1 else "New Recording 9.m4a"
    
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
        result = analyze_multilingual(mp3_path)
        
        # Save to file FIRST
        output_file = f"multilingual_analysis_{input_path.stem}.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"Audio File: {audio_file}\n")
            f.write("=" * 60 + "\n")
            f.write("Multilingual Audio Analysis:\n")
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
