import os
import re

search_dir = r"d:\AI-Projects\studybuddy-ai\studybuddy-ai"

def replace_func(match):
    word = match.group(0)
    if word == "Learnixio": return "ZenithStudy"
    if word == "learnixio": return "zenithstudy"
    if word == "LEARNIXIO": return "ZENITHSTUDY"
    if word[0].islower(): return "zenithstudy"
    return "ZenithStudy"

ignored_dirs = {".git", "node_modules", ".next"}
ignored_files = {"package-lock.json"}

for root, dirs, files in os.walk(search_dir):
    dirs[:] = [d for d in dirs if d not in ignored_dirs]
    for file in files:
        if file in ignored_files:
            continue
            
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.sql', '.html', '.css', '.txt')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = re.sub(r"(?i)learnixio", replace_func, content)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {filepath}")
            except Exception as e:
                print(f"Error processing {filepath}: {e}")

print("Done")
