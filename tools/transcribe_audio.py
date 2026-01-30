"""
Audio transcription and language identification tool.
Uses Google Gemini API to transcribe audio files and identify languages.

Usage:
  python tools/transcribe_audio.py --input "path/to/audio.m4a"
  python tools/transcribe_audio.py --input "audio.m4a" --output "transcript.txt"
"""
import argparse
import base64
from google import genai
from pathlib import Path
from config import GOOGLE_API_KEY

def transcribe_audio(audio_path, output_path=None):
    """
    Transcribe audio file and identify the language.
    
    Args:
        audio_path: Path to audio file (supports m4a, mp3, wav, etc.)
        output_path: Optional path to save transcript
    
    Returns:
        Dictionary with language and transcript
    """
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in .env file")
    
    # Configure Gemini API
    client = genai.Client(api_key=GOOGLE_API_KEY)
    
    # Check audio file exists
    audio_file = Path(audio_path)
    if not audio_file.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    
    print(f"Reading audio file: {audio_file.name}")
    
    # Read audio file and encode as base64
    with open(audio_file, 'rb') as f:
        audio_bytes = f.read()
    
    audio_data = base64.b64encode(audio_bytes).decode('utf-8')
    print(f"Audio file loaded ({len(audio_bytes)} bytes)")
    
    # Generate transcription with language identification
    prompt = """Please analyze this audio file and provide:
1. The language being spoken (name of the language)
2. A full transcription of what is being said
3. An English translation (if not already in English)

Format your response as:
Language: [language name]

Transcription:
[full transcription in original language]

English Translation:
[translation if needed, or state "Already in English"]
"""
    
    print("Analyzing audio and generating transcription...")
    
    # Determine mime type from file extension
    ext = audio_file.suffix.lower()
    mime_types = {
        '.m4a': 'audio/mp4',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.aac': 'audio/aac',
        '.ogg': 'audio/ogg',
    }
    mime_type = mime_types.get(ext, 'audio/mpeg')
    
    # Create parts for multimodal input
    parts = [
        {'text': prompt},
        {'inline_data': {'mime_type': mime_type, 'data': audio_data}}
    ]
    
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents=parts
    )
    
    # Get response text
    response_text = response.text if hasattr(response, 'text') else str(response)
    
    result = {
        'full_response': response_text,
        'audio_file': str(audio_file),
    }
    
    # Parse response to extract components
    lines = response_text.strip().split('\n')
    for i, line in enumerate(lines):
        if line.startswith('Language:'):
            result['language'] = line.replace('Language:', '').strip()
        elif 'Transcription:' in line:
            # Get everything after "Transcription:" until "English Translation:"
            transcription_lines = []
            for j in range(i+1, len(lines)):
                if 'English Translation:' in lines[j]:
                    break
                transcription_lines.append(lines[j])
            result['transcription'] = '\n'.join(transcription_lines).strip()
        elif 'English Translation:' in line:
            # Get everything after "English Translation:"
            translation_lines = []
            for j in range(i+1, len(lines)):
                translation_lines.append(lines[j])
            result['translation'] = '\n'.join(translation_lines).strip()
    
    # Print results
    print("\n" + "="*60)
    print("TRANSCRIPTION RESULTS")
    print("="*60)
    print(response_text)
    print("="*60)
    
    # Save to file if requested
    if output_path:
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(response_text)
        print(f"\nTranscript saved to: {output_file}")
    
    return result

def main():
    parser = argparse.ArgumentParser(
        description='Transcribe audio files and identify language using Google Gemini'
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
    
    args = parser.parse_args()
    
    try:
        result = transcribe_audio(args.input, args.output)
        return 0
    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())
