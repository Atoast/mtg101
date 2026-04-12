let allCards = [];
let currentFiltered = [];
let allMechanics = [];

// App Navigation
const tabCards = document.getElementById('tab-cards');
const tabMechanics = document.getElementById('tab-mechanics');
const viewCards = document.getElementById('view-cards');
const viewMechanics = document.getElementById('view-mechanics');

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
    } catch (e) {
        console.error("Failed to load generic data.", e);
    }
}

// ========================
// TABS LOGIC
// ========================
tabCards.addEventListener('click', () => {
    tabCards.classList.add('active');
    tabMechanics.classList.remove('active');
    viewCards.classList.remove('hidden');
    viewMechanics.classList.add('hidden');
});
tabMechanics.addEventListener('click', () => {
    tabMechanics.classList.add('active');
    tabCards.classList.remove('active');
    viewMechanics.classList.remove('hidden');
    viewCards.classList.add('hidden');
});

// ========================
// MECHANICS LOGIC
// ========================
function renderMechanics(mechanics) {
    mechanicsMain.innerHTML = '';
    mechanicListEl.innerHTML = '';

    const scrollContainer = mechanicsMain;

    mechanics.forEach(mech => {
        // 1. Sidebar Nav Link
        const li = document.createElement('li');
        li.className = 'card-item';
        li.dataset.name = mech.name;
        
        const newHtml = mech.isNew ? '<span class="badge-new">NEW</span>' : '';
        li.innerHTML = `
            <div class="card-item-name" style="display:flex; align-items:center;">
                ${mech.name} ${newHtml}
            </div>
        `;
        li.addEventListener('click', () => {
            const section = document.getElementById(`mech-section-${mech.name}`);
            if (section) {
                // native smooth scroll
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            
            // Highlight sidebar item active
            document.querySelectorAll('#mechanic-list .card-item').forEach(el => el.classList.remove('active'));
            li.classList.add('active');
        });
        mechanicListEl.appendChild(li);

        // 2. Main One-Page Section
        const section = document.createElement('div');
        section.id = `mech-section-${mech.name}`;
        section.className = 'mechanic-section';
        section.style.marginBottom = '4rem'; // Add some breathing room between mechanics

        // Synergy cards
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
            <div style="display:flex; align-items:center; margin-bottom:1.5rem;">
                ${headerTitle} ${newBadge}
            </div>
            <div class="mechanic-desc" style="background:var(--panel-bg); padding:2rem; border-radius:8px; border:1px solid var(--border-color); font-size:1.1rem; line-height:1.6; margin-bottom:2rem;">
                <p>${mech.description}</p>
            </div>
            ${synergyCards.length > 0 ? `
                <h3 style="font-size:1.5rem; color:var(--text-secondary); margin-bottom:1rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">Cards using ${mech.name}</h3>
                <div class="grid-view mini-grid" style="padding-bottom:1rem">
                    ${gridHtml}
                </div>
            ` : ''}
            <hr style="border:0; height:1px; background:var(--border-color); margin-top:1rem;">
        `;
        
        mechanicsMain.appendChild(section);
    });

    // Wire up events for clicking mechanic sub-images
    const allMechImgs = mechanicsMain.querySelectorAll('.mech-grid-card');
    allMechImgs.forEach(img => {
        img.addEventListener('click', (e) => {
            const cardName = e.target.dataset.name;
            const card = allCards.find(c => c.name === cardName);
            if(card) {
                tabCards.click();
                selectCard(card);
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

init();
