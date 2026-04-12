import os
import json
import urllib.request
import time
import shutil

SET_CODE = "sos"
BASE_DIR = os.path.join("data", "sets", SET_CODE)
IMAGES_DIR = os.path.join(BASE_DIR, "images")

os.makedirs(IMAGES_DIR, exist_ok=True)

# move json file
json_src = f"{SET_CODE}_cards.json"
json_dst = os.path.join(BASE_DIR, "cards.json")

if os.path.exists(json_src) and not os.path.exists(json_dst):
    shutil.copy(json_src, json_dst)
    
if not os.path.exists(json_dst):
    print(f"Error: Could not find {json_src} or {json_dst}")
    exit(1)

with open(json_dst, "r", encoding="utf-8") as f:
    data = json.load(f)
    cards = data.get("cards", [])

print(f"Loaded {len(cards)} cards. Storing in {BASE_DIR}")
print(f"Starting image downloads to {IMAGES_DIR}...")

headers = {'User-Agent': 'Antigravity/1.0', 'Accept': '*/*'}

def download_image(url, filepath):
    if os.path.exists(filepath):
        return
    req = urllib.request.Request(url, headers=headers)
    max_retries = 3
    for _ in range(max_retries):
        try:
            with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
                shutil.copyfileobj(response, out_file)
            time.sleep(0.1) # Scryfall rate limit: 50-100ms per request is polite
            return
        except Exception as e:
            time.sleep(1)
    print(f"Failed to download {url}")

for i, card in enumerate(cards):
    if i % 25 == 0:
        print(f"[{i+1}/{len(cards)}] Processing...")
        
    safe_name = "".join(c for c in card['name'] if c.isalnum() or c in (' ', '-', '_')).rstrip()
    safe_name = safe_name.replace(" ", "_").lower()
    
    if 'image_uris' in card and 'normal' in card['image_uris']:
        # Single faced
        url = card['image_uris']['normal']
        filename = f"{card['collector_number']}_{safe_name}.jpg"
        download_image(url, os.path.join(IMAGES_DIR, filename))
    elif 'card_faces' in card:
        # Double faced
        for face_idx, face in enumerate(card['card_faces']):
            if 'image_uris' in face and 'normal' in face['image_uris']:
                face_safe_name = "".join(c for c in face['name'] if c.isalnum() or c in (' ', '-', '_')).rstrip().replace(" ", "_").lower()
                url = face['image_uris']['normal']
                filename = f"{card['collector_number']}_{face_safe_name}_face_{face_idx+1}.jpg"
                download_image(url, os.path.join(IMAGES_DIR, filename))

print("All downloads complete!")
