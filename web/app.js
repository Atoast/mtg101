let allCards = [];
let currentFiltered = [];
let allMechanics = [];

// App Navigation
const tabCards = document.getElementById('tab-cards');
const tabMechanics = document.getElementById('tab-mechanics');
const tabColleges = document.getElementById('tab-colleges');
const viewCards = document.getElementById('view-cards');
const viewMechanics = document.getElementById('view-mechanics');
const viewColleges = document.getElementById('view-colleges');

// Cards View Elements
const searchInput = document.getElementById('search-input');
const colorFilter = document.getElementById('color-filter');
const cardListEl = document.getElementById('card-list');
const btnGallery = document.getElementById('btn-gallery');
const gridView = document.getElementById('grid-view');
const cardDetail = document.getElementById('card-detail');
// Cards Detail elements
const detailImage = document.getElementById('detail-image');
const detailName = document.getElementById('detail-name');
const detailMana = document.getElementById('detail-mana');
const detailType = document.getElementById('detail-type');
const detailOracle = document.getElementById('detail-oracle');
const detailFlavor = document.getElementById('detail-flavor');
const detailPtContainer = document.getElementById('detail-pt-container');
const detailPt = document.getElementById('detail-pt');
const detailLoyaltyContainer = document.getElementById('detail-loyalty-container');
const detailLoyalty = document.getElementById('detail-loyalty');
const detailArtist = document.getElementById('detail-artist');
const detailRelease = document.getElementById('detail-release');

// Mechanics View Elements
const mechanicListEl = document.getElementById('mechanic-list');
const mechanicsMain = document.getElementById('mechanics-main');

// Colleges View Elements
const collegeBtns = document.querySelectorAll('.college-btn');
const clgTitle = document.getElementById('clg-title');
const clgLore = document.getElementById('clg-lore');
const clgCount = document.getElementById('clg-playable-count');
const clgGroupBy = document.getElementById('clg-group-by');
const clgGroupsContainer = document.getElementById('college-groups-container');

const COLLEGES = {
    'silverquill': { name: 'Silverquill', colors: ['W', 'B'], lore: 'Stylish wordsmiths who master the magic of words, from inspiring battle poetry to biting arcane insults.', colorHex: 'var(--silverquill)' },
    'prismari': { name: 'Prismari', colors: ['U', 'R'], lore: 'Artsy elementalists wielding fire and ice with spells that are spectacles of raw creativity.', colorHex: 'var(--prismari)' },
    'witherbloom': { name: 'Witherbloom', colors: ['B', 'G'], lore: 'Witchy biologists who brew herbal concoctions to control the essence of life and death.', colorHex: 'var(--witherbloom)' },
    'lorehold': { name: 'Lorehold', colors: ['R', 'W'], lore: 'Adventurous historians who bring the spirits of the past to life and call forth magic from ancient tomes.', colorHex: 'var(--lorehold)' },
    'quandrix': { name: 'Quandrix', colors: ['G', 'U'], lore: 'Quirky math magicians who study patterns and fractals to command and multiply the forces of nature.', colorHex: 'var(--quandrix)' }
};

let activeCollege = 'silverquill';

async function init() {
    try {
        const [cardsRes, mechRes] = await Promise.all([
            fetch('../data/sets/sos/cards.json'),
            fetch('../data/mechanics.json')
        ]);
        
        const cardsData = await cardsRes.json();
        const mechData = await mechRes.json();
        
        allCards = cardsData.cards;
        // Sort mechanics A-Z
        allMechanics = mechData.mechanics.sort((a,b) => a.name.localeCompare(b.name));
        
        applyFilters(); 
        renderMechanics(allMechanics);
        updateCollegeView();
    } catch (e) {
        console.error("Failed to load generic data.", e);
    }
}

// ========================
// TABS LOGIC
// ========================
function switchTab(tabName) {
    [tabCards, tabMechanics, tabColleges].forEach(b => b.classList.remove('active'));
    [viewCards, viewMechanics, viewColleges].forEach(v => v.classList.add('hidden'));

    if (tabName === 'cards') {
        tabCards.classList.add('active'); viewCards.classList.remove('hidden');
    } else if (tabName === 'mechanics') {
        tabMechanics.classList.add('active'); viewMechanics.classList.remove('hidden');
    } else if (tabName === 'colleges') {
        tabColleges.classList.add('active'); viewColleges.classList.remove('hidden');
        updateCollegeView();
    }
}

tabCards.addEventListener('click', () => switchTab('cards'));
tabMechanics.addEventListener('click', () => switchTab('mechanics'));
tabColleges.addEventListener('click', () => switchTab('colleges'));

// ========================
// COLLEGES LOGIC
// ========================
collegeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        collegeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCollege = btn.dataset.college;
        updateCollegeView();
    });
});

clgGroupBy.addEventListener('change', () => {
    updateCollegeView();
});

function getCollegePool(collegeId) {
    const clg = COLLEGES[collegeId];
    return allCards.filter(card => {
        const iden = card.color_identity || [];
        // Pool is valid if the card's color identity is entirely contained within the College's colors
        // e.g. for Prismari (UR), card can be U, R, UR, or Colorless.
        // It CANNOT contain W, B, or G.
        return iden.every(c => clg.colors.includes(c));
    });
}

function updateCollegeView() {
    if (!allCards.length) return;
    
    const clg = COLLEGES[activeCollege];
    clgTitle.textContent = clg.name;
    clgTitle.style.color = clg.colorHex;
    clgLore.textContent = clg.lore;
    
    const pool = getCollegePool(activeCollege);
    clgCount.textContent = pool.length;
    clgCount.style.color = clg.colorHex;

    const groupBy = clgGroupBy.value;
    const groups = {};

    pool.forEach(card => {
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

    // Sort keys intelligently
    let sortedKeys = Object.keys(groups);
    if (groupBy === 'mana') {
        sortedKeys.sort((a,b) => {
            const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
            const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
            return numA - numB;
        });
    } else if (groupBy === 'rarity') {
        const rOrder = ['Common', 'Uncommon', 'Rare', 'Mythic'];
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

    clgGroupsContainer.innerHTML = '';
    
    sortedKeys.forEach(k => {
        if (!groups[k].length) return;
        
        let gridHtml = '';
        groups[k].forEach(card => {
            const imgSrc = getCardImage(card);
            if (!imgSrc) return;
            gridHtml += `<img src="${imgSrc}" class="grid-card clg-grid-card" title="${card.name}" data-name="${card.name}">`;
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
        clgGroupsContainer.appendChild(section);
    });

    const clgImgs = clgGroupsContainer.querySelectorAll('.clg-grid-card');
    clgImgs.forEach(img => {
        img.addEventListener('click', (e) => {
            const cName = e.target.dataset.name;
            const card = allCards.find(c => c.name === cName);
            if (card) {
                openCardModal(card);
            }
        });
    });
}

// ========================
// MECHANICS LOGIC
// ========================
function renderMechanics(mechanics) {
    mechanicsMain.innerHTML = '';
    mechanicListEl.innerHTML = '';

    mechanics.forEach(mech => {
        const li = document.createElement('li');
        li.className = 'card-item';
        li.dataset.name = mech.name;
        
        const newHtml = mech.isNew ? '<span class="badge-new">NEW</span>' : '';
        li.innerHTML = `<div class="card-item-name" style="display:flex; align-items:center;">${mech.name} ${newHtml}</div>`;
        li.addEventListener('click', () => {
            const section = document.getElementById(`mech-section-${mech.name}`);
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.querySelectorAll('#mechanic-list .card-item').forEach(el => el.classList.remove('active'));
            li.classList.add('active');
        });
        mechanicListEl.appendChild(li);

        const section = document.createElement('div');
        section.id = `mech-section-${mech.name}`;
        section.className = 'mechanic-section';
        section.style.marginBottom = '4rem';

        const synergyCards = allCards.filter(c => c.keywords && c.keywords.includes(mech.name));
        let gridHtml = '';
        synergyCards.forEach(card => {
            const imgSrc = getCardImage(card);
            if (!imgSrc) return;
            gridHtml += `<img src="${imgSrc}" class="grid-card mech-grid-card" title="${card.name}" data-name="${card.name}">`;
        });

        const headerTitle = `<h1 style="font-size:2.5rem; color:var(--accent); font-weight:700;">${mech.name}</h1>`;
        const newBadge = mech.isNew ? `<span class="badge-new" style="margin-left:1rem; font-size:0.8rem; padding:0.25rem 0.5rem;">NEW</span>` : '';

        section.innerHTML = `
            <div style="display:flex; align-items:center; margin-bottom:1.5rem;">${headerTitle} ${newBadge}</div>
            <div class="mechanic-desc" style="background:var(--panel-bg); padding:2rem; border-radius:8px; border:1px solid var(--border-color); font-size:1.1rem; line-height:1.6; margin-bottom:2rem;">
                <p>${mech.description}</p>
            </div>
            ${synergyCards.length > 0 ? `
                <h3 style="font-size:1.5rem; color:var(--text-secondary); margin-bottom:1rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">Cards using ${mech.name}</h3>
                <div class="grid-view mini-grid" style="padding-bottom:1rem">${gridHtml}</div>
            ` : ''}
            <hr style="border:0; height:1px; background:var(--border-color); margin-top:1rem;">
        `;
        mechanicsMain.appendChild(section);
    });

    const allMechImgs = mechanicsMain.querySelectorAll('.mech-grid-card');
    allMechImgs.forEach(img => {
        img.addEventListener('click', (e) => {
            const cName = e.target.dataset.name;
            const card = allCards.find(c => c.name === cName);
            if(card) {
                openCardModal(card);
            }
        });
    });
}

// ========================
// CARDS LOGIC
// ========================
function parseManaCost(manaCost) {
    if (!manaCost) return '';
    const regex = /\{([^}]+)\}/g;
    let match, result = '';
    while ((match = regex.exec(manaCost)) !== null) {
        const sym = match[1].replace('/', '');
        result += `<span class="mana-badge ${sym}">${sym}</span>`;
    }
    return result;
}

function formatOracleText(text) {
    if (!text) return '';
    return text.split('\n').map(p => `<p>${p}</p>`).join('');
}

function getCardImage(card) {
    if (card.image_uris && card.image_uris.normal) return card.image_uris.normal; 
    if (card.card_faces && card.card_faces[0].image_uris) return card.card_faces[0].image_uris.normal;
    return '';
}

function renderGallery(cards) {
    gridView.innerHTML = '';
    cards.forEach(card => {
        const imgSrc = getCardImage(card);
        if (!imgSrc) return;
        const img = document.createElement('img');
        img.src = imgSrc;
        img.className = 'grid-card';
        img.title = card.name;
        img.addEventListener('click', () => selectCard(card));
        gridView.appendChild(img);
    });
}

function renderList(cards) {
    cardListEl.innerHTML = '';
    cards.forEach(card => {
        const li = document.createElement('li');
        li.className = 'card-item';
        li.dataset.name = card.name;
        li.innerHTML = `<div class="card-item-name">${card.name}</div><div class="card-item-type">${card.type_line}</div>`;
        li.addEventListener('click', () => selectCard(card));
        cardListEl.appendChild(li);
    });
}

function selectCard(card) {
    gridView.classList.add('hidden');
    cardDetail.classList.remove('hidden');
    document.querySelectorAll('#card-list .card-item').forEach(el => {
        if (el.dataset.name === card.name) el.classList.add('active');
        else el.classList.remove('active');
    });

    detailImage.src = getCardImage(card);
    detailName.textContent = card.name;
    detailMana.innerHTML = parseManaCost(card.mana_cost);
    detailType.textContent = card.type_line;
    detailOracle.innerHTML = formatOracleText(card.oracle_text);
    
    if (card.flavor_text) {
        detailFlavor.innerHTML = `<p>"${card.flavor_text}"</p>`;
        detailFlavor.classList.remove('hidden');
    } else detailFlavor.classList.add('hidden');

    if (card.power && card.toughness) {
        detailPt.textContent = `${card.power}/${card.toughness}`;
        detailPtContainer.classList.remove('hidden');
    } else detailPtContainer.classList.add('hidden');

    if (card.loyalty) {
        detailLoyalty.textContent = `Loyalty: ${card.loyalty}`;
        detailLoyaltyContainer.classList.remove('hidden');
    } else detailLoyaltyContainer.classList.add('hidden');

    detailArtist.textContent = card.artist || 'Unknown';
    detailRelease.textContent = card.released_at || '2026-04-24';
}

function showGalleryView() {
    document.querySelectorAll('#card-list .card-item').forEach(el => el.classList.remove('active'));
    cardDetail.classList.add('hidden');
    gridView.classList.remove('hidden');
}

function applyFilters() {
    const q = searchInput.value.toLowerCase();
    const c = colorFilter.value;
    currentFiltered = allCards.filter(card => {
        const matchesQuery = card.name.toLowerCase().includes(q) || (card.type_line && card.type_line.toLowerCase().includes(q));
        let matchesColor = true;
        
        if (c === 'M') matchesColor = card.colors && card.colors.length > 1;
        else if (c === 'C') matchesColor = !card.colors || card.colors.length === 0;
        else if (c) matchesColor = card.colors && card.colors.includes(c);
        
        return matchesQuery && matchesColor;
    });
    renderList(currentFiltered);
    renderGallery(currentFiltered);
}

searchInput.addEventListener('input', applyFilters);
colorFilter.addEventListener('change', applyFilters);
btnGallery.addEventListener('click', showGalleryView);

function openCardModal(card) {
    document.getElementById('modal-image').src = getCardImage(card);
    document.getElementById('modal-name').textContent = card.name;
    document.getElementById('modal-mana').innerHTML = parseManaCost(card.mana_cost);
    document.getElementById('modal-type').textContent = card.type_line;
    document.getElementById('modal-oracle').innerHTML = formatOracleText(card.oracle_text);
    
    if (card.flavor_text) {
        document.getElementById('modal-flavor').innerHTML = `<p>"${card.flavor_text}"</p>`;
        document.getElementById('modal-flavor').classList.remove('hidden');
    } else document.getElementById('modal-flavor').classList.add('hidden');

    if (card.power && card.toughness) {
        document.getElementById('modal-pt').textContent = `${card.power}/${card.toughness}`;
        document.getElementById('modal-pt-container').classList.remove('hidden');
    } else document.getElementById('modal-pt-container').classList.add('hidden');

    if (card.loyalty) {
        document.getElementById('modal-loyalty').textContent = `Loyalty: ${card.loyalty}`;
        document.getElementById('modal-loyalty-container').classList.remove('hidden');
    } else document.getElementById('modal-loyalty-container').classList.add('hidden');

    document.getElementById('modal-artist').textContent = card.artist || 'Unknown';
    document.getElementById('modal-release').textContent = card.released_at || '2026-04-24';
    
    document.getElementById('card-modal').classList.remove('hidden');
}

// Add event listeners for modal close
document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('card-modal').classList.add('hidden');
});
document.getElementById('modal-overlay').addEventListener('click', () => {
    document.getElementById('card-modal').classList.add('hidden');
});

init();
