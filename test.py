import urllib.request
import urllib.parse
import json
import sys
from datetime import datetime

headers = {'User-Agent': 'Antigravity/1.0', 'Accept': 'application/json'}

req = urllib.request.Request('https://api.scryfall.com/sets', headers=headers)
try:
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())['data']
except Exception as e:
    print(f"Failed to fetch sets: {e}")
    sys.exit(1)

# Filter for recent expansions/core sets
recent_sets = []
for s in data:
    if s['set_type'] in ('core', 'expansion'):
        try:
            rel_date = datetime.strptime(s.get('released_at', '1970-01-01'), '%Y-%m-%d')
            recent_sets.append({
                'name': s['name'],
                'code': s['code'],
                'released_at': s['released_at'],
                'date': rel_date
            })
        except:
            pass

recent_sets.sort(key=lambda x: x['date'], reverse=True)
print("Latest Sets:")
for s in recent_sets[:5]:
    print(f"- {s['name']} ({s['code']}) released {s['released_at']}")

latest_set = recent_sets[0]
print(f"\nTargeting set: {latest_set['name']} ({latest_set['code']})")

all_cards = []
url = f"https://api.scryfall.com/cards/search?q=set:{latest_set['code']}"
while url:
    req = urllib.request.Request(url, headers=headers)
    try:
        res = urllib.request.urlopen(req)
        page_data = json.loads(res.read())
        all_cards.extend(page_data['data'])
        url = page_data.get('next_page')
    except urllib.error.HTTPError as e:
        print(f"Error fetching cards: {e}")
        break

keywords = set()
card_types = {}
for c in all_cards:
    if 'keywords' in c:
        for kw in c['keywords']:
            keywords.add(kw)

print(f"\nTotal cards found: {len(all_cards)}")
print("Mechanics/Keywords:", ", ".join(sorted(keywords)))
