/**
 * simulator.js
 * Generates structured MTG Prerelease Sealed Pools based on SOS Play Booster rules.
 */

// We assume allCards array exists globally from app.js
let simUidCounter = 0;

// Per-college state: each entry stores { pool: [], deck: Set }
const collegeState = {};
function getCollegeState(collegeId) {
    if (!collegeState[collegeId]) {
        collegeState[collegeId] = { pool: [], deck: new Set() };
    }
    return collegeState[collegeId];
}

// Active references (always point to the current college's state)
let simulatedPool = [];
let simMainDeck = new Set();

function generatePrereleasePool(collegeId) {
    const clg = COLLEGES[collegeId];
    simulatedPool = [];
    
    // Categorize library
    const sosCards = allCards.filter(c => c.set === 'sos');
    const soaCards = allCards.filter(c => c.set === 'soa');
    const spgCards = allCards.filter(c => c.set === 'spg');

    const commons = sosCards.filter(c => c.rarity === 'common');
    const uncommons = sosCards.filter(c => c.rarity === 'uncommon');
    const raresAndMythics = sosCards.filter(c => c.rarity === 'rare' || c.rarity === 'mythic');

    // Helper: is card legal in college
    const isLegalInCollege = (c) => {
        const iden = c.color_identity || [];
        if (iden.length === 0) return true;
        return iden.every(color => clg.colors.includes(color));
    };

    // Stateful pools to simulate collation and prevent excessive duplicates
    let draftPools = {
        commons: [...commons],
        uncommons: [...uncommons],
        raresAndMythics: [...raresAndMythics],
        seededCommons: [...commons.filter(isLegalInCollege)],
        seededUncommons: [...uncommons.filter(isLegalInCollege)],
        seededRares: [...raresAndMythics.filter(isLegalInCollege)],
        soaCards: [...soaCards],
        spgCards: [...spgCards]
    };

    // Helper to draw 1 card with depletion
    const drawOne = (poolName, originalArray) => {
        if (draftPools[poolName].length === 0) draftPools[poolName] = [...originalArray]; // Refill if empty
        const idx = Math.floor(Math.random() * draftPools[poolName].length);
        return draftPools[poolName].splice(idx, 1)[0];
    };

    const drawN = (poolName, originalArray, n) => {
        let res = [];
        for (let i = 0; i < n; i++) res.push(drawOne(poolName, originalArray));
        return res;
    };

    const tagOrigin = (cardsPool, originName) => cardsPool.map(c => ({ ...c, _origin: originName, _uid: simUidCounter++ }));

    // 1. Generate 1x College Seeded Pack
    simulatedPool.push(...tagOrigin(drawN('seededCommons', commons.filter(isLegalInCollege), 8), 'seeded'));
    simulatedPool.push(...tagOrigin(drawN('seededUncommons', uncommons.filter(isLegalInCollege), 3), 'seeded'));
    
    // Guaranteed rare/mythic for college
    simulatedPool.push(...tagOrigin([drawOne('seededRares', raresAndMythics.filter(isLegalInCollege))], 'seeded'));

    // Guaranteed foil promo for college
    simulatedPool.push(...tagOrigin([drawOne('seededRares', raresAndMythics.filter(isLegalInCollege))], 'seeded'));

    // 2. Generate 5x Play Boosters
    for (let p = 0; p < 5; p++) {
        // Standard slot breakdown:
        // 6 Commons
        // 3 Uncommons
        // 1 Rare or Mythic
        // 1 Special Guest (spg) OR Secret Archives (soa) OR Common/Uncommon
        // 1 Foil Wildcard (any rarity)
        // 1 Land (we skip basic lands for the visual pool if we don't have them, or just use another common)

        simulatedPool.push(...tagOrigin(drawN('commons', commons, 7), 'play')); // Using 7 commons to replace the land slot
        simulatedPool.push(...tagOrigin(drawN('uncommons', uncommons, 3), 'play'));
        simulatedPool.push(...tagOrigin([drawOne('raresAndMythics', raresAndMythics)], 'play'));

        // Special Slot (15% SOA, 5% SPG, 80% Common)
        const roll = Math.random();
        if (roll < 0.05 && spgCards.length > 0) {
            simulatedPool.push(...tagOrigin([drawOne('spgCards', spgCards)], 'play'));
        } else if (roll < 0.20 && soaCards.length > 0) {
            simulatedPool.push(...tagOrigin([drawOne('soaCards', soaCards)], 'play'));
        } else {
            simulatedPool.push(...tagOrigin([drawOne('commons', commons)], 'play'));
        }

        // Foil Wildcard (any rarity, 10% rare/mythic, 25% uncommon, 65% common)
        const foilRoll = Math.random();
        if (foilRoll < 0.10) {
            simulatedPool.push(...tagOrigin([drawOne('raresAndMythics', raresAndMythics)], 'play'));
        } else if (foilRoll < 0.35) {
            simulatedPool.push(...tagOrigin([drawOne('uncommons', uncommons)], 'play'));
        } else {
            simulatedPool.push(...tagOrigin([drawOne('commons', commons)], 'play'));
        }
    }

    return simulatedPool;
}

// Rendering Logic for Simulator Tab
const btnGeneratePool = document.getElementById('btn-generate-pool');
const simGroupsContainer = document.getElementById('sim-groups-container');
const simGroupBy = document.getElementById('sim-group-by');
const simOriginFilter = document.getElementById('sim-origin-filter');
const simColorFilter = document.getElementById('sim-color-filter');
const simCollegeBtns = document.querySelectorAll('#view-simulator .college-btn');
let activeSimCollege = 'silverquill';

simCollegeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        simCollegeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Save current state back before switching
        getCollegeState(activeSimCollege).pool = simulatedPool;
        getCollegeState(activeSimCollege).deck = simMainDeck;

        activeSimCollege = btn.dataset.college;

        // Restore state for the new college
        const state = getCollegeState(activeSimCollege);
        simulatedPool = state.pool;
        simMainDeck = state.deck;

        if (simulatedPool.length > 0) {
            // College already has a generated pool — restore it
            renderSimulatorPool(simulatedPool);
        } else {
            // Fresh college — show empty prompt
            simGroupsContainer.innerHTML = `<div style="text-align:center; padding: 4rem; color:var(--text-muted); font-size:1.2rem;">
                Click "Generate Sealed Pool" to crack 6 new packs for ${COLLEGES[activeSimCollege].name}!
            </div>`;
            const deckSidebar = document.getElementById('sim-deck-sidebar');
            if (deckSidebar) deckSidebar.classList.add('hidden');
        }
    });
});

btnGeneratePool.addEventListener('click', () => {
    if (!allCards || allCards.length === 0) return;
    // Generate a fresh pool for this college, clearing its existing deck
    simMainDeck = new Set();
    const pool = generatePrereleasePool(activeSimCollege);
    simulatedPool = pool;
    // Persist immediately
    getCollegeState(activeSimCollege).pool = simulatedPool;
    getCollegeState(activeSimCollege).deck = simMainDeck;
    renderSimulatorPool(simulatedPool);
});

function copyDeckToArena() {
    if (simMainDeck.size === 0) {
        alert('Your deck is empty! Add some cards first.');
        return;
    }

    const deckCards = simulatedPool.filter(c => simMainDeck.has(c._uid));
    const sideboardCards = simulatedPool.filter(c => !simMainDeck.has(c._uid));

    const formatLine = (c) => {
        const set = (c.set || 'sos').toUpperCase();
        const num = c.collector_number || '0';
        return `1 ${c.name} (${set}) ${num}`;
    };

    const deckLines = deckCards.map(formatLine).join('\n');
    const sideLines = sideboardCards.map(formatLine).join('\n');
    const output = `${deckLines}\n\nSideboard\n${sideLines}`;

    navigator.clipboard.writeText(output).then(() => {
        const btn = document.getElementById('btn-copy-arena');
        const orig = btn.textContent;
        btn.textContent = '✅ Copied!';
        btn.style.background = 'rgba(34,197,94,0.3)';
        setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 2000);
    }).catch(() => {
        alert('Could not copy to clipboard automatically. Please try again.');
    });
}


simGroupBy.addEventListener('change', () => {
    if (simulatedPool.length > 0) {
        renderSimulatorPool(simulatedPool);
    }
});

simOriginFilter.addEventListener('change', () => {
    if (simulatedPool.length > 0) {
        renderSimulatorPool(simulatedPool);
    }
});

simColorFilter.addEventListener('change', () => {
    if (simulatedPool.length > 0) {
        renderSimulatorPool(simulatedPool);
    }
});

document.getElementById('btn-copy-arena').addEventListener('click', copyDeckToArena);

function renderSimulatorPool(pool) {
    const clg = COLLEGES[activeSimCollege];
    const groupBy = simGroupBy.value;
    const originFilter = simOriginFilter.value;
    const colorFilter = simColorFilter.value;
    const groups = {};

    let viewPool = pool;
    if (originFilter === 'seeded') viewPool = pool.filter(c => c._origin === 'seeded');
    else if (originFilter === 'play') viewPool = pool.filter(c => c._origin === 'play');
    else if (originFilter === 'deck') viewPool = pool.filter(c => simMainDeck.has(c._uid));
    else if (originFilter === 'sideboard') viewPool = pool.filter(c => !simMainDeck.has(c._uid));

    if (colorFilter === 'on-color') {
        const isLegal = (c) => {
            const iden = c.color_identity || [];
            if (iden.length === 0) return true;
            return iden.every(color => clg.colors.includes(color));
        };
        viewPool = viewPool.filter(isLegal);
    }

    viewPool.forEach(card => {
        let keys = [];
        if (groupBy === 'mana') {
            keys.push(card.cmc !== undefined ? `Mana Value ${Math.min(card.cmc, 7)}${card.cmc >= 7 ? '+' : ''}` : 'Lands/0');
        } else if (groupBy === 'rarity') {
            const r = card.rarity || 'common';
            keys.push(r.charAt(0).toUpperCase() + r.slice(1));
        } else if (groupBy === 'type') {
            const t = card.type_line || '';
            if (t.includes('Creature')) keys.push('Creatures');
            else if (t.includes('Instant')) keys.push('Instants');
            else if (t.includes('Sorcery')) keys.push('Sorceries');
            else if (t.includes('Artifact')) keys.push('Artifacts');
            else if (t.includes('Enchantment')) keys.push('Enchantments');
            else if (t.includes('Planeswalker')) keys.push('Planeswalkers');
            else if (t.includes('Land')) keys.push('Lands');
            else keys.push('Other');
        } else if (groupBy === 'keyword') {
            if (card.keywords && card.keywords.length > 0) {
                card.keywords.forEach(kw => keys.push(kw));
            } else {
                keys.push('No Keywords');
            }
        }

        keys.forEach(k => {
            if (!groups[k]) groups[k] = [];
            groups[k].push(card);
        });
    });

    let sortedKeys = Object.keys(groups);
    if (groupBy === 'mana') {
        sortedKeys.sort((a,b) => {
            const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
            const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
            return numA - numB;
        });
    } else if (groupBy === 'rarity') {
        const rOrder = ['Mythic', 'Rare', 'Uncommon', 'Common'];
        sortedKeys.sort((a,b) => rOrder.indexOf(a) - rOrder.indexOf(b));
    } else if (groupBy === 'keyword') {
        sortedKeys.sort((a,b) => {
            if (a === 'No Keywords') return 1;
            if (b === 'No Keywords') return -1;
            return a.localeCompare(b);
        });
    } else {
        sortedKeys.sort();
    }

    simGroupsContainer.innerHTML = `
        <div style="font-size:1.2rem; font-weight:600; color:${clg.colorHex}; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom:1rem;">
            Showing: ${originFilter === 'all' ? 'Entire Pool' : (originFilter === 'seeded' ? 'Seeded Booster Only' : 'Play Boosters Only')} (${viewPool.length} Cards) ${colorFilter === 'on-color' ? '<span style="font-size:0.9rem; opacity:0.8;">[College Legal Only]</span>' : ''}
        </div>
    `;

    sortedKeys.forEach(k => {
        if (!groups[k].length) return;
        
        let gridHtml = '';
        groups[k].forEach(card => {
            const imgSrc = getCardImage(card);
            if (!imgSrc) return;
            const inDeckClass = simMainDeck.has(card._uid) ? 'in-deck' : '';
            gridHtml += `
                <div class="card-wrapper">
                    <img src="${imgSrc}" class="grid-card sim-grid-card ${inDeckClass}" title="${card.name}" data-name="${card.name}" data-uid="${card._uid}">
                    <div class="magnifier-btn">🔍</div>
                </div>
            `;
        });

        const section = document.createElement('div');
        section.className = 'group-section';
        section.innerHTML = `
            <div class="group-section-header">
                <span style="color: ${clg.colorHex}">${k}</span>
                <span class="group-count">${groups[k].length} cards</span>
            </div>
            <div class="grid-view mini-grid">
                ${gridHtml}
            </div>
        `;
        simGroupsContainer.appendChild(section);
    });

    // Render Sidebar Deck
    const deckSidebar = document.getElementById('sim-deck-sidebar');
    const deckList = document.getElementById('sim-deck-list');
    const deckCountText = document.getElementById('deck-count-text');

    if (pool.length > 0) {
        deckSidebar.classList.remove('hidden');
        deckCountText.textContent = simMainDeck.size;
        
        let deckHtml = '';
        const deckCards = pool.filter(c => simMainDeck.has(c._uid));
        
        // Group deck cards by CMC for clean list
        const deckGroups = {};
        deckCards.forEach(c => {
            const cmc = c.cmc || 0;
            const key = cmc >= 7 ? '7+' : cmc.toString();
            if(!deckGroups[key]) deckGroups[key] = [];
            deckGroups[key].push(c);
        });

        // Sort keys ascending
        const sortedDeckKeys = Object.keys(deckGroups).sort((a,b) => parseInt(a) - parseInt(b));

        sortedDeckKeys.forEach(k => {
            deckHtml += `<div class="deck-list-group-header">Mana Value ${k}</div>`;
            
            // Sort by name within CMC
            deckGroups[k].sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
                deckHtml += `
                    <div class="deck-item" data-uid="${c._uid}">
                        <div class="deck-item-mana">${parseManaCost(c.mana_cost || '')}</div>
                        <div class="deck-item-name">${c.name}</div>
                    </div>
                `;
            });
        });

        deckList.innerHTML = deckHtml;

        // Bind clicks to dynamically remove from deck
        deckList.querySelectorAll('.deck-item').forEach(el => {
            el.addEventListener('click', () => {
                const cUid = parseInt(el.dataset.uid);
                simMainDeck.delete(cUid);
                renderSimulatorPool(simulatedPool);
            });
        });
    } else {
        deckSidebar.classList.add('hidden');
    }

    const simWrappers = simGroupsContainer.querySelectorAll('.card-wrapper');
    simWrappers.forEach(wrapper => {
        const img = wrapper.querySelector('.sim-grid-card');
        const mag = wrapper.querySelector('.magnifier-btn');
        const cUid = parseInt(img.dataset.uid);
        const card = pool.find(c => c._uid === cUid);
        
        if (card) {
            mag.addEventListener('click', (e) => {
                e.stopPropagation();
                openCardModal(card, viewPool);
            });
            img.addEventListener('click', () => {
                if (simMainDeck.has(cUid)) simMainDeck.delete(cUid);
                else simMainDeck.add(cUid);
                renderSimulatorPool(simulatedPool);
            });
        }
    });
}
