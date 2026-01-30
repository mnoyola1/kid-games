"""
Deeper dialect analysis - considering Southern dialects.
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

def analyze_dialect_deeper(text):
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    response = client.chat.completions.create(
        model='gpt-4o',
        messages=[
            {
                'role': 'system', 
                'content': 'You are a Chinese linguistics expert specializing in ALL regional dialects across China - both Northern AND Southern. You have deep knowledge of Cantonese, Sichuanese, Hunanese, Fujianese (Min), Shanghainese (Wu), Hakka, Jiangxi, Guizhou, Yunnan, Guangxi dialects, and their distinctive markers when spoken in Mandarin.'
            },
            {
                'role': 'user', 
                'content': f'''Analyze this Chinese speech transcription. Previous analysis suggested Northeastern Mandarin, but I want you to specifically consider whether this could be a SOUTHERN dialect instead.

Chinese transcription:
{text}

Please analyze:

1. Could this be a SOUTHERN dialect? Consider:
   - Sichuan/Chongqing Mandarin (西南官话)
   - Cantonese-influenced Mandarin (粤语区普通话)
   - Hunanese Mandarin (湖南普通话)
   - Guizhou/Yunnan Mandarin
   - Jiangxi dialect influence
   - Wu dialect influence (Shanghai/Zhejiang area)
   - Any other Southern possibilities

2. Specific analysis of key phrases:
   - "哈个车你" - Could "哈" be Southern? What regions use this?
   - "多麻不" - Is this contraction Northern or could it be Southern?
   - The overall sentence structure and word order

3. Compare Northern vs Southern evidence:
   - What points to NORTHERN origin?
   - What points to SOUTHERN origin?

4. What would INCREASE confidence in identification?
   - What additional audio features would help?
   - What specific words/phrases would be definitive?
   - What questions could we ask about the speaker?

5. Revised assessment with percentage likelihood for top 3 dialect possibilities'''
            }
        ]
    )
    
    return response.choices[0].message.content

if __name__ == "__main__":
    chinese_text = '哦哦哦哦哦 哎刚回车你这边多麻不 哈个车你 等着找麻烦不得了啊 189'
    
    print("Deep dialect analysis (considering Southern dialects)...")
    print("=" * 60)
    
    result = analyze_dialect_deeper(chinese_text)
    
    # Save to file FIRST
    with open('dialect_analysis_v2.txt', 'w', encoding='utf-8') as f:
        f.write(f"Original Chinese:\n{chinese_text}\n\n")
        f.write("=" * 60 + "\n")
        f.write("Deep Dialect Analysis (Northern vs Southern):\n")
        f.write("=" * 60 + "\n\n")
        f.write(result)
    
    print("Saved to: dialect_analysis_v2.txt")
    print("=" * 60)
    
    # Try to print
    try:
        print(result)
    except UnicodeEncodeError:
        print(result.encode('ascii', errors='replace').decode('ascii'))
        print("\n(Some characters replaced - see saved file for full text)")
