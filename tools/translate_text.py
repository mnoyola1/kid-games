"""
Translate text using OpenAI GPT-4 for more accurate translations.
"""
import os
import sys
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

def translate_chinese(text):
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    response = client.chat.completions.create(
        model='gpt-4o',
        messages=[
            {
                'role': 'system', 
                'content': 'You are an expert translator specializing in colloquial Mandarin Chinese, including regional dialects and informal speech. Provide accurate translations that capture the tone and meaning of casual conversation.'
            },
            {
                'role': 'user', 
                'content': f'''Please translate this Chinese audio transcription to English. This appears to be informal/colloquial speech, possibly with some dialect.

Chinese transcription:
{text}

Please provide:
1. A natural English translation
2. A literal/word-by-word breakdown  
3. Any notes about dialect, tone, or context clues'''
            }
        ]
    )
    
    return response.choices[0].message.content

if __name__ == "__main__":
    chinese_text = '哦哦哦哦哦 哎刚回车你这边多麻不 哈个车你 等着找麻烦不得了啊 189'
    
    print("Translating with GPT-4o...")
    print("=" * 60)
    
    result = translate_chinese(chinese_text)
    
    # Save to file FIRST
    with open('transcript_recording6_detailed.txt', 'w', encoding='utf-8') as f:
        f.write(f"Original Chinese:\n{chinese_text}\n\n")
        f.write("=" * 60 + "\n")
        f.write("GPT-4o Translation Analysis:\n")
        f.write("=" * 60 + "\n\n")
        f.write(result)
    
    print("Saved to: transcript_recording6_detailed.txt")
    print("=" * 60)
    
    # Try to print, handle encoding errors
    try:
        print(result)
    except UnicodeEncodeError:
        print(result.encode('ascii', errors='replace').decode('ascii'))
        print("\n(Some characters replaced - see saved file for full text)")
