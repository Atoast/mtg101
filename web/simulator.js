/**
 * simulator.js
 * Generates structured MTG Prerelease Sealed Pools based on SOS Play Booster rules.
 */

// We assume allCards array exists globally from app.js
let simulatedPool = [];

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

    // Helper to get random item
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const getRandomN = (arr, n) => {
        let result = [];
        let pool = [...arr];
        for(let i=0; i < n; i++) {
            if(pool.length === 0) break;
            const idx = Math.floor(Math.random() * pool.length);
            result.push(pool[idx]);
            pool.splice(idx, 1);
        }
        return result;
    };

    // Helper: is card legal in college
    const isLegalInCollege = (c) => {
        const iden = c.color_identity || [];
        if (iden.length === 0) return true;
        return iden.every(color => clg.colors.includes(color));
    };

    // 1. Generate 1x College Seeded Pack
    // Seeded pack contains ONLY cards that fit the color identity of the college + colorless
    const seededCommons = commons.filter(isLegalInCollege);
    const seededUncommons = uncommons.filter(isLegalInCollege);
    const seededRares = raresAndMythics.filter(isLegalInCollege);

    const tagOrigin = (cardsPool, originName) => cardsPool.map(c => ({ ...c, _origin: originName }));

    simulatedPool.push(...tagOrigin(getRandomN(seededCommons, 8), 'seeded'));
    simulatedPool.push(...tagOrigin(getRandomN(seededUncommons, 3), 'seeded'));
    
    // Guaranteed rare/mythic for college
    const collegeRare = getRandom(seededRares);
    simulatedPool.push(...tagOrigin([collegeRare], 'seeded'));

    // Guaranteed foil promo for college
    const promoFoil = getRandom(seededRares);
    simulatedPool.push(...tagOrigin([promoFoil], 'seeded'));

    // 2. Generate 5x Play Boosters
    for (let p = 0; p < 5; p++) {
        // Standard slot breakdown:
        // 6 Commons
        // 3 Uncommons
        // 1 Rare or Mythic
        // 1 Special Guest (spg) OR Secret Archives (soa) OR Common/Uncommon
        // 1 Foil Wildcard (any rarity)
        // 1 Land (we skip basic lands for the visual pool if we don't have them, or just use another common)

        simulatedPool.push(...tagOrigin(getRandomN(commons, 7), 'play')); // Using 7 commons to replace the land slot
        simulatedPool.push(...tagOrigin(getRandomN(uncommons, 3), 'play'));
        simulatedPool.push(...tagOrigin([getRandom(raresAndMythics)], 'play'));

        // Special Slot (15% SOA, 5% SPG, 80% Common)
        const roll = Math.random();
        if (roll < 0.05 && spgCards.length > 0) {
            simulatedPool.push(...tagOrigin([getRandom(spgCards)], 'play'));
        } else if (roll < 0.20 && soaCards.length > 0) {
            simulatedPool.push(...tagOrigin([getRandom(soaCards)], 'play'));
        } else {
            simulatedPool.push(...tagOrigin([getRandom(commons)], 'play'));
        }

        // Foil Wildcard (any rarity, 10% rare/mythic, 25% uncommon, 65% common)
        const foilRoll = Math.random();
        if (foilRoll < 0.10) {
            simulatedPool.push(...tagOrigin([getRandom(raresAndMythics)], 'play'));
        } else if (foilRoll < 0.35) {
            simulatedPool.push(...tagOrigin([getRandom(uncommons)], 'play'));
        } else {
            simulatedPool.push(...tagOrigin([getRandom(commons)], 'play'));
        }
    }

    return simulatedPool;
}

// Rendering Logic for Simulator Tab
const btnGeneratePool = document.getElementById('btn-generate-pool');
const simGroupsContainer = document.getElementById('sim-groups-container');
const simGroupBy = document.getElementById('sim-group-by');
const simOriginFilter = document.getElementById('sim-origin-filter');
const simCollegeBtns = document.querySelectorAll('#view-simulator .college-btn');
let activeSimCollege = 'silverquill';

simCollegeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        simCollegeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSimCollege = btn.dataset.college;
        
        simGroupsContainer.innerHTML = `<div style="text-align:center; padding: 4rem; color:var(--text-muted); font-size:1.2rem;">
            Click "Generate Sealed Pool" to crack 6 new packs for ${COLLEGES[activeSimCollege].name}!
        </div>`;
        simulatedPool = [];
    });
});

btnGeneratePool.addEventListener('click', () => {
    if (!allCards || allCards.length === 0) return; // Prevent clicking before loaded
    const pool = generatePrereleasePool(activeSimCollege);
    renderSimulatorPool(pool);
});

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

function renderSimulatorPool(pool) {
    const clg = COLLEGES[activeSimCollege];
    const groupBy = simGroupBy.value;
    const originFilter = simOriginFilter.value;
    const groups = {};

    let viewPool = pool;
    if (originFilter === 'seeded') viewPool = pool.filter(c => c._origin === 'seeded');
    else if (originFilter === 'play') viewPool = pool.filter(c => c._origin === 'play');

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
            Showing: ${originFilter === 'all' ? 'Entire Pool' : (originFilter === 'seeded' ? 'Seeded Booster Only' : 'Play Boosters Only')} (${viewPool.length} Cards)
        </div>
    `;

    sortedKeys.forEach(k => {
        if (!groups[k].length) return;
        
        let gridHtml = '';
        groups[k].forEach(card => {
            const imgSrc = getCardImage(card);
            if (!imgSrc) return;
            // Ensure any special borders or badges for foils could theoretically be added here
            // Just displaying them standard for now
            gridHtml += `<img src="${imgSrc}" class="grid-card sim-grid-card" title="${card.name}" data-name="${card.name}">`;
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

    const simImgs = simGroupsContainer.querySelectorAll('.sim-grid-card');
    simImgs.forEach(img => {
        img.addEventListener('click', (e) => {
            const cName = e.target.dataset.name;
            const card = pool.find(c => c.name === cName);
            if (card) {
                openCardModal(card);
            }
        });
    });
}
