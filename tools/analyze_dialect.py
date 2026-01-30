"""
Analyze Chinese dialect using GPT-4o.
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

from openai import OpenAI

def analyze_dialect(text):
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    response = client.chat.completions.create(
        model='gpt-4o',
        messages=[
            {
                'role': 'system', 
                'content': 'You are a Chinese linguistics expert specializing in regional dialects across China, including Mandarin variants, Wu, Cantonese, Min, Hakka, and other regional speech patterns. You can identify dialect markers, regional vocabulary, and pronunciation patterns from transcribed speech.'
            },
            {
                'role': 'user', 
                'content': f'''Analyze this Chinese speech transcription and identify the specific dialect or regional variety:

Chinese transcription:
{text}

Please provide:
1. Most likely dialect/regional origin (be specific - e.g., Sichuan Mandarin, Beijing Mandarin, Northeastern Mandarin, etc.)
2. Key dialect markers/evidence that led to this conclusion
3. Specific words or phrases that indicate the region
4. Confidence level (high/medium/low) and alternative possibilities
5. Any other linguistic observations (age group, social context, etc.)'''
            }
        ]
    )
    
    return response.choices[0].message.content

if __name__ == "__main__":
    chinese_text = '哦哦哦哦哦 哎刚回车你这边多麻不 哈个车你 等着找麻烦不得了啊 189'
    
    print("Analyzing dialect with GPT-4o...")
    print("=" * 60)
    
    result = analyze_dialect(chinese_text)
    
    # Save to file FIRST
    with open('dialect_analysis.txt', 'w', encoding='utf-8') as f:
        f.write(f"Original Chinese:\n{chinese_text}\n\n")
        f.write("=" * 60 + "\n")
        f.write("Dialect Analysis:\n")
        f.write("=" * 60 + "\n\n")
        f.write(result)
    
    print("Saved to: dialect_analysis.txt")
    print("=" * 60)
    
    # Try to print
    try:
        print(result)
    except UnicodeEncodeError:
        print(result.encode('ascii', errors='replace').decode('ascii'))
        print("\n(Some characters replaced - see saved file for full text)")
