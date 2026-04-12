import urllib.request
import json
headers = {'User-Agent': 'Antigravity/1.0', 'Accept': 'application/json'}
def print_card(kw):
    req = urllib.request.Request(f'https://api.scryfall.com/cards/search?q=set:sos+keyword:{kw}', headers=headers)
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read())['data'][:1]
        for c in data:
            print(f'{kw} -> {c.get("name")}: {c.get("oracle_text", "")}')
    except:
        pass
print_card('Opus')
print_card('Repartee')
print_card('Prepared')
print_card('Increment')
print_card('Infusion')
print_card('Paradigm')
