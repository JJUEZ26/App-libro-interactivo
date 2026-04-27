/**
 * Discoveries Module
 * Renders an interactive "discover more" experience at the end of biography pages.
 * A softly glowing orb invites the reader to explore 3 essential works by the author.
 */

const ICON_BOOK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>`;
const ICON_POEM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>`;
const ICON_MUSIC = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"/></svg>`;

const TYPE_ICONS = {
    poem: ICON_POEM,
    book: ICON_BOOK,
    song: ICON_MUSIC
};

/**
 * Creates the DOM elements for the Music Credits Orb and Panel.
 */
function createMusicCreditsElements(musicCredits) {
    if (!musicCredits) return null;

    const orbWrapper = document.createElement('div');
    orbWrapper.className = 'discovery-orb-wrapper music-orb-wrapper';
    orbWrapper.innerHTML = `
        <button class="discovery-orb discovery-orb--music" aria-label="Ver créditos musicales">
            <span class="orb-ring orb-ring--music orb-ring--1"></span>
            <span class="orb-ring orb-ring--music orb-ring--2"></span>
            <span class="orb-ring orb-ring--music orb-ring--3"></span>
            <span class="orb-core orb-core--music">
                <span class="orb-music-icon">${ICON_MUSIC}</span>
            </span>
            <span class="orb-label">Créditos</span>
        </button>
    `;

    const panel = document.createElement('div');
    panel.className = 'music-credits-panel';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
        <div class="music-credits-inner">
            <div class="music-credits-icon">${ICON_MUSIC}</div>
            <div class="music-credits-body">
                <span class="music-credits-title">${musicCredits.title}</span>
                <span class="music-credits-composer">${musicCredits.composer}</span>
                ${musicCredits.note ? `<span class="music-credits-note">${musicCredits.note}</span>` : ''}
            </div>
        </div>
    `;

    return { orbWrapper, panel };
}

/**
 * Renders ONLY the music credits (for pages without discoveries like La Puerta).
 */
export function renderMusicCredits(container, musicCredits) {
    if (!musicCredits) return;

    const mainContainer = document.createElement('div');
    mainContainer.className = 'discoveries-container';

    const orbsRow = document.createElement('div');
    orbsRow.className = 'orbs-row';
    
    const elements = createMusicCreditsElements(musicCredits);
    orbsRow.appendChild(elements.orbWrapper);
    
    mainContainer.appendChild(orbsRow);
    mainContainer.appendChild(elements.panel);

    let open = false;
    elements.orbWrapper.querySelector('.discovery-orb').addEventListener('click', (e) => {
        e.stopPropagation();
        open = !open;
        mainContainer.classList.toggle('music-open', open);
        elements.panel.setAttribute('aria-hidden', String(!open));
    });

    const choicesDiv = container.querySelector('.choices');
    if (choicesDiv) {
        container.insertBefore(mainContainer, choicesDiv);
    } else {
        container.appendChild(mainContainer);
    }
}

/**
 * Injects the discovery orb and expanded cards into a biography page.
 * If musicCredits is provided, renders both orbs centered side-by-side.
 */
export function renderDiscoveries(contentCenterer, discoveries, authorName, musicCredits) {
    if (!discoveries || discoveries.length === 0) {
        if (musicCredits) renderMusicCredits(contentCenterer, musicCredits);
        return;
    }

    const container = document.createElement('div');
    container.className = 'discoveries-container';

    const orbsRow = document.createElement('div');
    orbsRow.className = 'orbs-row';

    // — The Discovery Orb —
    const discoveryOrbWrapper = document.createElement('div');
    discoveryOrbWrapper.className = 'discovery-orb-wrapper main-orb-wrapper';
    discoveryOrbWrapper.innerHTML = `
        <button class="discovery-orb" aria-label="Descubrir más obras de ${authorName}">
            <span class="orb-ring orb-ring--1"></span>
            <span class="orb-ring orb-ring--2"></span>
            <span class="orb-ring orb-ring--3"></span>
            <span class="orb-core"></span>
            <span class="orb-label">Descubrir más</span>
        </button>
    `;
    orbsRow.appendChild(discoveryOrbWrapper);

    // — The Music Orb (optional) —
    let musicElements = null;
    if (musicCredits) {
        musicElements = createMusicCreditsElements(musicCredits);
        orbsRow.appendChild(musicElements.orbWrapper);
    }

    container.appendChild(orbsRow);

    // — The Expanded Panel (Discoveries) —
    const discoveryPanel = document.createElement('div');
    discoveryPanel.className = 'discovery-panel';
    discoveryPanel.setAttribute('aria-hidden', 'true');

    const panelHeader = document.createElement('div');
    panelHeader.className = 'discovery-panel-header';
    panelHeader.innerHTML = `<span class="discovery-panel-title">Lecturas esenciales</span><span class="discovery-panel-subtitle">de ${authorName}</span>`;
    discoveryPanel.appendChild(panelHeader);

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'discovery-cards';

    discoveries.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = `discovery-card${item.available ? '' : ' discovery-card--upcoming'}`;
        card.style.setProperty('--card-index', i);

        const icon = TYPE_ICONS[item.type] || ICON_POEM;
        const statusBadge = item.available
            ? ''
            : `<span class="discovery-upcoming">Próximamente</span>`;

        card.innerHTML = `
            <div class="discovery-card-icon">${icon}</div>
            <div class="discovery-card-body">
                <span class="discovery-card-title">${item.title}</span>
                <span class="discovery-card-year">${item.year}</span>
                <span class="discovery-card-line">${item.line}</span>
                ${statusBadge}
            </div>
        `;
        cardsContainer.appendChild(card);
    });

    discoveryPanel.appendChild(cardsContainer);
    
    // Wrap panels so they don't overlap awkwardly
    const panelsWrapper = document.createElement('div');
    panelsWrapper.className = 'panels-wrapper';
    panelsWrapper.appendChild(discoveryPanel);
    
    if (musicElements) {
        panelsWrapper.appendChild(musicElements.panel);
    }

    container.appendChild(panelsWrapper);

    // — Toggle Logic —
    let isDiscoveryOpen = false;
    let isMusicOpen = false;

    const toggleDiscovery = () => {
        isDiscoveryOpen = !isDiscoveryOpen;
        if (isDiscoveryOpen && isMusicOpen) toggleMusic(); // close the other
        
        container.classList.toggle('discoveries--open', isDiscoveryOpen);
        discoveryPanel.setAttribute('aria-hidden', String(!isDiscoveryOpen));
        discoveryOrbWrapper.querySelector('.discovery-orb').setAttribute('aria-expanded', String(isDiscoveryOpen));
    };

    const toggleMusic = () => {
        isMusicOpen = !isMusicOpen;
        if (isMusicOpen && isDiscoveryOpen) toggleDiscovery(); // close the other
        
        container.classList.toggle('music-open', isMusicOpen);
        musicElements.panel.setAttribute('aria-hidden', String(!isMusicOpen));
        musicElements.orbWrapper.querySelector('.discovery-orb').setAttribute('aria-expanded', String(isMusicOpen));
    };

    discoveryOrbWrapper.querySelector('.discovery-orb').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDiscovery();
    });

    if (musicElements) {
        musicElements.orbWrapper.querySelector('.discovery-orb').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMusic();
        });
    }

    // Insert before the choices buttons
    const choicesDiv = contentCenterer.querySelector('.choices');
    if (choicesDiv) {
        contentCenterer.insertBefore(container, choicesDiv);
    } else {
        contentCenterer.appendChild(container);
    }
}
