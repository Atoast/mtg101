import urllib.request
import urllib.parse
import json
import sys

headers = {'User-Agent': 'Antigravity/1.0', 'Accept': 'application/json'}
all_cards = []
url = "https://api.scryfall.com/cards/search?q=set:sos"
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
rarity_counts = {'common': 0, 'uncommon': 0, 'rare': 0, 'mythic': 0}

for c in all_cards:
    if 'keywords' in c:
        for kw in c['keywords']:
            keywords.add(kw)
    
    type_line = c.get('type_line', '')
    main_type = type_line.split('—')[0].strip()
    for t in ['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Planeswalker', 'Land', 'Battle']:
        if t in main_type:
            card_types[t] = card_types.get(t, 0) + 1
            
    rarity = c.get('rarity', 'common')
    rarity_counts[rarity] = rarity_counts.get(rarity, 0) + 1

print(f"Total cards found: {len(all_cards)}")
print("Rarity:", rarity_counts)
print("Types:", card_types)
print("Mechanics/Keywords:", ", ".join(sorted(keywords)))

# Let's find some multicolour uncommons (often signposts for limited)
print("\nMulticolor Uncommons (Limited Archetypes):")
for c in all_cards:
    if c.get('rarity') == 'uncommon' and len(c.get('colors', [])) > 1:
        print(f"- {c['name']} ({', '.join(c['colors'])}): {c.get('type_line')}")
