"""
Audio transcription and language identification using OpenAI Whisper API.

Usage:
  python tools/transcribe_audio_whisper.py --input "path/to/audio.m4a"
  python tools/transcribe_audio_whisper.py --input "audio.m4a" --output "transcript.txt"
  
  # With OpenAI API key
  python tools/transcribe_audio_whisper.py --input "audio.m4a" --api-key "your-key"
"""
import argparse
import os
from pathlib import Path
from config import load_env

# Load environment variables from .env file
load_env()

def transcribe_with_openai(audio_path, api_key, output_path=None):
    """Transcribe using OpenAI Whisper API"""
    try:
        import openai
    except ImportError:
        print("Installing openai library...")
        import subprocess
        subprocess.check_call(["pip", "install", "openai"])
        import openai
    
    client = openai.OpenAI(api_key=api_key)
    
    audio_file = Path(audio_path)
    if not audio_file.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    
    print(f"Reading audio file: {audio_file.name}")
    print(f"File size: {audio_file.stat().st_size} bytes")
    
    # Transcribe with language detection
    print("\nTranscribing with Whisper API...")
    with open(audio_file, 'rb') as f:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="verbose_json"
        )
    
    # Get language name
    language_code = transcript.language
    language_names = {
        'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
        'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
        'ko': 'Korean', 'zh': 'Chinese', 'ar': 'Arabic', 'hi': 'Hindi',
        'nl': 'Dutch', 'pl': 'Polish', 'tr': 'Turkish', 'sv': 'Swedish',
        'da': 'Danish', 'no': 'Norwegian', 'fi': 'Finnish'
    }
    language_name = language_names.get(language_code, language_code.upper())
    
    # Format results
    result_text = f"""Language: {language_name} ({language_code})

Transcription:
{transcript.text}
"""
    
    # Add translation if not English
    if language_code != 'en':
        print("\nTranslating to English...")
        with open(audio_file, 'rb') as f:
            translation = client.audio.translations.create(
                model="whisper-1",
                file=f
            )
        result_text += f"""
English Translation:
{translation.text}
"""
    else:
        result_text += "\nEnglish Translation:\nAlready in English"
    
    # Save to file FIRST (before printing, to ensure it's saved even if printing fails)
    if output_path:
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(result_text)
        print(f"\nTranscript saved to: {output_file}")
    
    # Print results (handle Unicode for Windows console)
    print("\n" + "="*60)
    print("TRANSCRIPTION RESULTS")
    print("="*60)
    try:
        print(result_text)
    except UnicodeEncodeError:
        # Fallback for Windows console - replace non-ASCII chars
        safe_text = result_text.encode('ascii', errors='replace').decode('ascii')
        print(safe_text)
        print("\n(Note: Some non-ASCII characters were replaced with '?' for display)")
        print("See the saved file for full Unicode text.")
    print("="*60)
    
    return {
        'language': language_name,
        'language_code': language_code,
        'transcription': transcript.text,
        'full_response': result_text
    }

def transcribe_local():
    """Try local transcription using speech_recognition library"""
    try:
        import speech_recognition as sr
    except ImportError:
        print("Installing speech_recognition library...")
        import subprocess
        subprocess.check_call(["pip", "install", "SpeechRecognition", "pydub"])
        import speech_recognition as sr
    
    print("\nUsing local speech recognition (Google Speech Recognition API - free)")
    print("Note: This requires internet connection and may not work for all audio formats\n")
    
    recognizer = sr.Recognizer()
    
    # This is a basic implementation - may need audio conversion
    raise NotImplementedError("Local transcription requires audio conversion. Please use OpenAI Whisper API instead.")

def main():
    parser = argparse.ArgumentParser(
        description='Transcribe audio files and identify language using OpenAI Whisper'
    )
    parser.add_argument(
        '--input', '-i',
        required=True,
        help='Path to audio file (m4a, mp3, wav, etc.)'
    )
    parser.add_argument(
        '--output', '-o',
        help='Optional: Path to save transcript text file'
    )
    parser.add_argument(
        '--api-key',
        help='OpenAI API key (or set OPENAI_API_KEY environment variable)'
    )
    
    args = parser.parse_args()
    
    try:
        # Get API key from args or environment
        api_key = args.api_key or os.getenv('OPENAI_API_KEY')
        
        if not api_key:
            print("\nNo OpenAI API key found!")
            print("\nOptions:")
            print("1. Pass API key: --api-key YOUR_KEY")
            print("2. Set environment variable: OPENAI_API_KEY")
            print("3. Add to .env file: OPENAI_API_KEY=your-key")
            print("\nGet API key from: https://platform.openai.com/api-keys")
            return 1
        
        result = transcribe_with_openai(args.input, api_key, args.output)
        return 0
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())
