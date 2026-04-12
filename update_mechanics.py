import json
import os

new_mechs = [
    ('Champion', 'Exile a permanent of the specified type you control when this enters, or sacrifice it.'),
    ('Connive', 'Draw a card, then discard a card. If you discarded a nonland card, put a +1/+1 counter on this creature.'),
    ('Convoke', 'Your creatures can help cast this spell. Each creature you tap pays for {1} or one mana of that creature\'s color.'),
    ('Council\'s dilemma', 'A voting mechanic where players vote and the spell has a cumulative effect for each vote.'),
    ('Cycling', 'Pay the cycling cost and discard this card to draw a card.'),
    ('Delirium', 'An ability word that cares if there are four or more card types among cards in your graveyard.'),
    ('Enchant', 'This aura targets a specific type of permanent or player.'),
    ('Enrage', 'Whenever this creature is dealt damage, trigger an effect.'),
    ('Equip', 'Pay the equip cost to attach this equipment to target creature you control.'),
    ('Evoke', 'You may cast this spell for its evoke cost. If you do, it\'s sacrificed when it enters the battlefield.'),
    ('Ferocious', 'An ability word that checks if you control a creature with power 4 or greater.'),
    ('Hexproof', 'This permanent cannot be the target of spells or abilities your opponents control.'),
    ('Imprint', 'Exile a card to imprint it. The permanent will refer to the exiled card for its effects.'),
    ('Improvise', 'Your artifacts can help cast this spell. Each artifact you tap after you\'re done activating mana abilities pays for {1}.'),
    ('Indestructible', 'Effects that say "destroy" don\'t destroy this permanent.'),
    ('Investigate', 'Create a Clue token. (It\'s an artifact with "{2}, Sacrifice this artifact: Draw a card.")'),
    ('Kicker', 'You may pay an additional cost as you cast this spell. If you do, the spell is kicked.'),
    ('Magecraft', 'Whenever you cast or copy an instant or sorcery spell, trigger an effect.'),
    ('Metalcraft', 'An ability word that gives a bonus if you control three or more artifacts.'),
    ('Morbid', 'An ability word that triggers if a creature died this turn.'),
    ('Morph', 'You may cast this card face down as a 2/2 creature for {3}. Turn it face up any time for its morph cost.'),
    ('Overload', 'You may cast this spell for its overload cost. If you do, change its text by replacing all instances of "target" with "each".'),
    ('Partner', 'You can have two commanders if both have partner.'),
    ('Role token', 'Aura tokens attached to creatures that grant stats or abilities. A creature can only have one Role controlled by the same player at a time.'),
    ('Scry', 'Look at the top cards of your library, then put any number of them on the bottom of your library and the rest on top in any order.'),
    ('Shroud', 'This permanent cannot be the target of spells or abilities.'),
    ('Split second', 'As long as this spell is on the stack, players can\'t cast spells or activate abilities that aren\'t mana abilities.'),
    ('Spree', 'Choose one or more additional costs as you cast this spell to gain its effects.'),
    ('Storm', 'When you cast this spell, copy it for each spell cast before it this turn. You may choose new targets for the copies.'),
    ('Suspend', 'Rather than cast this card from your hand, you may pay its suspend cost and exile it with N time counters on it. At the beginning of your upkeep, remove a time counter. When the last is removed, cast it without paying its mana cost.'),
    ('Vivid', 'A land cycle that enters tapped with charge counters, which can be removed to produce mana of any color.')
]

with open('data/mechanics.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

current = {m['name'] for m in data['mechanics']}

for name, desc in new_mechs:
    if name not in current:
        data['mechanics'].append({'name': name, 'description': desc, 'isNew': False})

with open('data/mechanics.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print('Updated mechanics.json')
