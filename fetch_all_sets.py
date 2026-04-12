import os
import json
import urllib.request
import time
import shutil

sets_to_fetch = ['sos', 'soa', 'spg']
all_cards = []
headers = {'User-Agent': 'Antigravity/1.0', 'Accept': 'application/json'}

print('Fetching card data...')
for s in sets_to_fetch:
    url = f'https://api.scryfall.com/cards/search?q=set:{s}'
    while url:
        print(f'Fetching: {url}')
        req = urllib.request.Request(url, headers=headers)
        try:
            res = urllib.request.urlopen(req)
            page_data = json.loads(res.read())
            all_cards.extend(page_data['data'])
            url = page_data.get('next_page')
        except urllib.error.HTTPError as e:
            print(f'Error fetching {s}: {e}')
            break

BASE_DIR = os.path.join('data', 'sets', 'sos')
IMAGES_DIR = os.path.join(BASE_DIR, 'images')
os.makedirs(IMAGES_DIR, exist_ok=True)

json_dst = os.path.join(BASE_DIR, 'cards.json')
with open(json_dst, 'w', encoding='utf-8') as f:
    json.dump({'cards': all_cards}, f, indent=2, ensure_ascii=False)

print(f'Saved {len(all_cards)} total cards. Starting image downloads...')

def download_image(url, filepath):
    if os.path.exists(filepath):
        return False
    req = urllib.request.Request(url, headers=headers)
    for _ in range(3):
        try:
            with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
                shutil.copyfileobj(response, out_file)
            time.sleep(0.05)
            return True
        except Exception:
            time.sleep(0.5)
    return False

downloaded = 0
for i, card in enumerate(all_cards):
    if i % 50 == 0:
        print(f'[{i}/{len(all_cards)}] Checked...')
    
    safe_name = "".join(c for c in card.get('name', '') if c.isalnum() or c in (' ', '-', '_')).rstrip().replace(' ', '_').lower()
    
    if 'image_uris' in card and 'normal' in card['image_uris']:
        url = card['image_uris']['normal']
        filename = f"{card.get('set')}_{card.get('collector_number', i)}_{safe_name}.jpg"
        if download_image(url, os.path.join(IMAGES_DIR, filename)):
            downloaded += 1
    elif 'card_faces' in card:
        for face_idx, face in enumerate(card['card_faces']):
            if 'image_uris' in face and 'normal' in face['image_uris']:
                face_safe_name = "".join(c for c in face.get('name', '') if c.isalnum() or c in (' ', '-', '_')).rstrip().replace(' ', '_').lower()
                url = face['image_uris']['normal']
                filename = f"{card.get('set')}_{card.get('collector_number', i)}_{face_safe_name}_face_{face_idx+1}.jpg"
                if download_image(url, os.path.join(IMAGES_DIR, filename)):
                    downloaded += 1

print(f'Downloaded {downloaded} new images. Total cards: {len(all_cards)}')
