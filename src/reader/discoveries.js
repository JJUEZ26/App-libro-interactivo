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
 * Injects the discovery orb and expanded cards into a biography page.
 * @param {HTMLElement} contentCenterer - The container to append to
 * @param {Array} discoveries - Array of {title, type, year, line, available}
 * @param {string} authorName - The author's name
 */
export function renderDiscoveries(contentCenterer, discoveries, authorName) {
    if (!discoveries || discoveries.length === 0) return;

    const container = document.createElement('div');
    container.className = 'discoveries-container';

    // — The Orb —
    const orbWrapper = document.createElement('div');
    orbWrapper.className = 'discovery-orb-wrapper';
    orbWrapper.innerHTML = `
        <button class="discovery-orb" aria-label="Descubrir más obras de ${authorName}">
            <span class="orb-ring orb-ring--1"></span>
            <span class="orb-ring orb-ring--2"></span>
            <span class="orb-ring orb-ring--3"></span>
            <span class="orb-core"></span>
            <span class="orb-label">Descubrir más</span>
        </button>
    `;

    // — The Expanded Panel —
    const panel = document.createElement('div');
    panel.className = 'discovery-panel';
    panel.setAttribute('aria-hidden', 'true');

    const panelHeader = document.createElement('div');
    panelHeader.className = 'discovery-panel-header';
    panelHeader.innerHTML = `<span class="discovery-panel-title">Lecturas esenciales</span><span class="discovery-panel-subtitle">de ${authorName}</span>`;
    panel.appendChild(panelHeader);

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

    panel.appendChild(cardsContainer);

    // — Toggle Logic —
    let isOpen = false;
    const toggle = () => {
        isOpen = !isOpen;
        container.classList.toggle('discoveries--open', isOpen);
        panel.setAttribute('aria-hidden', String(!isOpen));
        orbWrapper.querySelector('.discovery-orb').setAttribute('aria-expanded', String(isOpen));
    };

    orbWrapper.querySelector('.discovery-orb').addEventListener('click', (e) => {
        e.stopPropagation();
        toggle();
    });

    container.appendChild(orbWrapper);
    container.appendChild(panel);

    // Insert before the choices buttons
    const choicesDiv = contentCenterer.querySelector('.choices');
    if (choicesDiv) {
        contentCenterer.insertBefore(container, choicesDiv);
    } else {
        contentCenterer.appendChild(container);
    }
}
