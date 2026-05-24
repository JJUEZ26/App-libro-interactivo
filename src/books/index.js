import { loadPageHistory } from '../utils/storage.js';
import { ShareManager } from '../utils/shareUtils.js';
import { isShelfBook, toggleShelfBook } from '../utils/userCollections.js';

export function createLibrary({ libraryHero, librarySections, openBook }) {
    let books = [];
    let sectionsConfig = null;
    let kebabGlobalCloseBound = false;

    function closeAllKebabMenus(exceptMenu = null) {
        document.querySelectorAll('.book-kebab-menu.active').forEach((menu) => {
            if (menu === exceptMenu) return;
            menu.classList.remove('active');
            const button = menu.parentElement?.querySelector('.book-kebab-btn');
            button?.setAttribute('aria-expanded', 'false');
        });
    }

    function ensureKebabGlobalCloseListener() {
        if (kebabGlobalCloseBound) return;
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.book-kebab-container')) {
                closeAllKebabMenus();
            }
        });
        kebabGlobalCloseBound = true;
    }

    function setKebabOpen(button, menu, isOpen) {
        menu.classList.toggle('active', isOpen);
        button.setAttribute('aria-expanded', String(isOpen));
    }

    async function loadBooks() {
        if (!libraryHero && !librarySections) return;

        try {
            const [booksResponse, sectionsResponse] = await Promise.all([
                fetch('/data/books.json'),
                fetch('/data/library-sections.json')
            ]);
            if (!booksResponse.ok) throw new Error(`Error HTTP: ${booksResponse.status}`);
            if (!sectionsResponse.ok) throw new Error(`Error HTTP: ${sectionsResponse.status}`);
            books = await booksResponse.json();
            sectionsConfig = await sectionsResponse.json();

            books = books.map(book => ({
                ...book,
                cover: book.cover && !book.cover.startsWith('/') ? `/${book.cover}` : book.cover,
                storyFile: book.storyFile && !book.storyFile.startsWith('/') ? `/${book.storyFile}` : book.storyFile
            }));

            renderLibrary();
        } catch (error) {
            console.error('Error al cargar la biblioteca:', error);
            if (librarySections) {
                librarySections.innerHTML = `
                    <div style="padding: 40px; text-align: center; color: var(--color-danger); background: rgba(220, 38, 38, 0.05); border-radius: var(--radius-xl); border: 1px solid var(--color-danger);">
                        <h3 style="margin-bottom: 10px;">Error cargando la biblioteca</h3>
                        <p style="font-size: 0.9rem; opacity: 0.8;">No pudimos conectar con el servidor de datos. Revisa que <code>/data/books.json</code> exista.</p>
                        <button onclick="location.reload()" style="margin-top: 20px; padding: 8px 16px; background: var(--color-danger); color: white; border: none; border-radius: 99px; cursor: pointer;">Reintentar</button>
                    </div>`;
            }
        }
    }

    function renderLibrary() {
        if (!librarySections || !libraryHero) return;
        ensureKebabGlobalCloseListener();
        libraryHero.innerHTML = '';
        librarySections.innerHTML = '';
        if (!books || books.length === 0) {
            librarySections.innerHTML = '<p>Tu biblioteca está vacía.</p>';
            return;
        }
        const booksById = new Map(books.map((book) => [book.id, book]));
        renderHero(booksById); 
        renderSections(booksById);
    }

    /**
     * Calculate reading progress for a book
     * @returns {{ pagesRead: number, totalPages: number, percent: number } | null}
     */
    function getReadingProgress(bookData) {
        if (!bookData || bookData.type === 'poem') return null;
        const totalPages = bookData.totalPages || 0;
        if (totalPages === 0) return null;

        const history = loadPageHistory(bookData.id);
        if (!history || history.length === 0) return null;

        const pagesRead = history.length;
        const percent = Math.min(100, Math.round((pagesRead / totalPages) * 100));

        return { pagesRead, totalPages, percent };
    }

    /**
     * Create SVG circular progress ring
     */
    function createProgressRing(percent) {
        const size = 40;
        const strokeWidth = 3;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;
        const gradientId = `progressGradient-${Math.random().toString(36).slice(2, 9)}`;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        svg.classList.add('progress-ring');

        // Background circle
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', size / 2);
        bgCircle.setAttribute('cy', size / 2);
        bgCircle.setAttribute('r', radius);
        bgCircle.setAttribute('fill', 'none');
        bgCircle.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
        bgCircle.setAttribute('stroke-width', strokeWidth);

        // Progress circle
        const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        progressCircle.setAttribute('cx', size / 2);
        progressCircle.setAttribute('cy', size / 2);
        progressCircle.setAttribute('r', radius);
        progressCircle.setAttribute('fill', 'none');
        progressCircle.setAttribute('stroke', `url(#${gradientId})`);
        progressCircle.setAttribute('stroke-width', strokeWidth);
        progressCircle.setAttribute('stroke-linecap', 'round');
        progressCircle.setAttribute('stroke-dasharray', circumference);
        progressCircle.setAttribute('stroke-dashoffset', offset);
        progressCircle.setAttribute('transform', `rotate(-90 ${size / 2} ${size / 2})`);
        progressCircle.classList.add('progress-ring-circle');

        // Gradient
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', gradientId);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#ec4899');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#8b5cf6');

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);

        svg.appendChild(defs);
        svg.appendChild(bgCircle);
        svg.appendChild(progressCircle);

        // Percentage text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '50%');
        text.setAttribute('y', '50%');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-weight', '700');
        text.setAttribute('font-family', 'Inter, sans-serif');
        text.textContent = `${percent}%`;
        svg.appendChild(text);

        return svg;
    }

    function createShelfMenuItem(bookData, iconSize = 16, onSelected = null) {
        const shelfItem = document.createElement('button');
        shelfItem.className = 'kebab-menu-item';
        shelfItem.innerHTML = `
            <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span></span>
        `;

        const label = shelfItem.querySelector('span');
        const syncLabel = () => {
            label.textContent = isShelfBook(bookData.id) ? 'Quitar de guardados' : 'Guardar obra';
        };

        syncLabel();
        shelfItem.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleShelfBook(bookData);
            syncLabel();
            window.dispatchEvent(new CustomEvent('profile:collections-updated'));
            if (onSelected) onSelected();
        });

        return shelfItem;
    }

    function renderHero(booksById) {
        const featuredId = sectionsConfig?.featuredBookId;
        const featuredBook = featuredId ? booksById.get(featuredId) : null;

        const hero = document.createElement('div');
        hero.className = 'library-hero-card';

        const heroContent = document.createElement('div');
        heroContent.className = 'library-hero-content';

        const heroLabel = document.createElement('span');
        heroLabel.className = 'library-hero-label';
        heroLabel.textContent = '✨ Destacado';

        const heroTitle = document.createElement('h2');
        heroTitle.className = 'library-hero-title';
        heroTitle.textContent = featuredBook?.title || 'Tu próximo favorito';

        const heroDescription = document.createElement('p');
        heroDescription.className = 'library-hero-description';
        heroDescription.textContent =
            featuredBook?.description ||
            'Explora nuestra selección interactiva y descubre nuevas historias con decisiones.';

        const heroMeta = document.createElement('p');
        heroMeta.className = 'library-hero-meta';
        heroMeta.textContent = featuredBook?.author || 'Biblioteca interactiva';

        const heroActions = document.createElement('div');
        heroActions.className = 'library-hero-actions';

        const heroButton = document.createElement('button');
        heroButton.className = 'library-hero-btn';

        // Show progress on hero if applicable
        const heroProgress = featuredBook ? getReadingProgress(featuredBook) : null;
        if (heroProgress && heroProgress.percent > 0) {
            heroButton.textContent = heroProgress.percent >= 100 ? '🎉 Leer de nuevo' : `Continuar (${heroProgress.percent}%)`;
        } else {
            heroButton.textContent = featuredBook?.storyFile ? 'Leer ahora' : 'Muy pronto';
        }
        heroButton.disabled = !featuredBook?.storyFile;

        heroActions.appendChild(heroButton);

        // --- Hero Kebab Menu ---
        if (featuredBook?.storyFile) {
            const kebabContainer = document.createElement('div');
            kebabContainer.className = 'book-kebab-container hero-kebab-container';
            
            const kebabBtn = document.createElement('button');
            // Reutilizamos la clase base hero-share-btn para mantener el tamaño y layout, pero cambiamos el interior
            kebabBtn.className = 'library-hero-share-btn book-kebab-btn';
            kebabBtn.setAttribute('title', 'Opciones de Obra Destacada');
            kebabBtn.setAttribute('aria-expanded', 'false');
            kebabBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="12" cy="5" r="1.5"></circle>
                    <circle cx="12" cy="19" r="1.5"></circle>
                </svg>
            `;

            // Menu Popover
            const kebabMenu = document.createElement('div');
            kebabMenu.className = 'book-kebab-menu hero-kebab-menu'; // hero-kebab-menu is for specific positioning if needed
            
            // Item 1: Compartir
            const shareItem = document.createElement('button');
            shareItem.className = 'kebab-menu-item';
            shareItem.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                <span>Compartir Obra</span>
            `;
            shareItem.addEventListener('click', (ev) => {
                ev.stopPropagation();
                setKebabOpen(kebabBtn, kebabMenu, false);
                ShareManager.shareBook(featuredBook.id, featuredBook.title);
            });
            
            kebabMenu.appendChild(shareItem);
            kebabMenu.appendChild(createShelfMenuItem(featuredBook, 18, () => setKebabOpen(kebabBtn, kebabMenu, false)));
            
            // Lógica de apertura/cierre
            kebabBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const isOpening = !kebabMenu.classList.contains('active');
                closeAllKebabMenus(kebabMenu);
                setKebabOpen(kebabBtn, kebabMenu, isOpening);
            });

            kebabContainer.appendChild(kebabBtn);
            kebabContainer.appendChild(kebabMenu);
            heroActions.appendChild(kebabContainer);
        }

        heroContent.appendChild(heroLabel);
        heroContent.appendChild(heroTitle);
        heroContent.appendChild(heroDescription);
        heroContent.appendChild(heroMeta);
        heroContent.appendChild(heroActions);

        const heroCover = document.createElement('div');
        heroCover.className = 'library-hero-cover';
        if (featuredBook?.cover) {
            const img = document.createElement('img');
            img.src = featuredBook.cover;
            img.alt = `Portada de ${featuredBook.title || 'libro destacado'}`;
            img.loading = 'eager';
            img.className = 'library-hero-image';
            img.onerror = function () { this.classList.add('placeholder'); this.src = ''; this.alt = 'Imagen no encontrada'; };
            heroCover.appendChild(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'library-hero-image placeholder';
            placeholder.textContent = 'Portada destacada';
            heroCover.appendChild(placeholder);
        }

        hero.appendChild(heroContent);
        hero.appendChild(heroCover);
        libraryHero.appendChild(hero);

        if (featuredBook?.storyFile) {
            const openHandler = (ev) => handleBookOpen(ev, featuredBook, heroCover.querySelector('img'));
            heroButton.addEventListener('click', openHandler);
            heroCover.addEventListener('click', openHandler);
        }
    }

    function renderSections(booksById) {
        const sections = sectionsConfig?.sections || [];
        if (sections.length === 0) {
            librarySections.innerHTML = '<p>No hay secciones disponibles.</p>';
            return;
        }

        sections.forEach((sectionData) => {
            const section = document.createElement('section');
            section.className = 'library-row-section';
            section.dataset.sectionId = sectionData.id || '';

            const header = document.createElement('div');
            header.className = 'library-row-header';

            const title = document.createElement('h3');
            title.className = 'library-row-title';
            title.textContent = sectionData.title || 'Sección';

            header.appendChild(title);

            if (sectionData.subtitle) {
                const subtitle = document.createElement('p');
                subtitle.className = 'library-row-subtitle';
                subtitle.textContent = sectionData.subtitle;
                header.appendChild(subtitle);
            }

            const row = document.createElement('div');
            row.className = 'library-row';

            const bookIds = sectionData.bookIds || [];
            const placeholders = Number(sectionData.placeholderCount) || 0;

            bookIds.forEach((bookId) => {
                const bookData = booksById.get(bookId);
                row.appendChild(createBookCard(bookData, { label: 'Próximamente' }));
            });

            for (let i = 0; i < placeholders; i += 1) {
                row.appendChild(createBookCard(null, { label: 'Añadir título' }));
            }

            section.appendChild(header);
            section.appendChild(row);
            librarySections.appendChild(section);
        });
    }

    /**
     * Handle book opening — passes cover image for cinematic transition
     * Applied to ALL books (novels and poems alike)
     */
    function handleBookOpen(event, bookData, coverImgEl) {
        event.stopPropagation();
        // openBook now handles the cinematic transition internally
        openBook(bookData, coverImgEl || null);
    }

    function createBookCard(bookData, { label }) {
        const hasStory = Boolean(bookData?.storyFile || bookData?.htmlFile);
        const isUpcoming = !hasStory;
        const isNovel = bookData?.type === 'novel';
        const card = document.createElement('article');
        card.className = 'book-card';
        if (isUpcoming) card.classList.add('book-card--upcoming');
        if (bookData?.author === 'Ju Ez') {
            card.classList.add('book-card--original');
            card.classList.add(`book-card--${bookData?.type || 'novel'}`);
        }

        const coverWrapper = document.createElement('div');
        coverWrapper.className = 'book-cover-wrapper';
        if (isUpcoming) coverWrapper.classList.add('book-cover-wrapper--upcoming');

        let coverImg = null;

        if (bookData?.cover) {
            coverImg = document.createElement('img');
            coverImg.src = bookData.cover;
            coverImg.alt = `Portada de ${bookData.title || 'libro'}`;
            coverImg.loading = 'lazy';
            coverImg.className = 'book-cover';
            if (bookData.objectPosition) {
                coverImg.style.objectPosition = bookData.objectPosition;
            }
            if (bookData.objectFit) {
                coverImg.style.objectFit = bookData.objectFit;
            }
            coverImg.onerror = function () { this.classList.add('placeholder'); this.src = ''; this.alt = 'Imagen no encontrada'; };
            coverWrapper.appendChild(coverImg);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'book-cover placeholder';
            // Leave it empty; the CSS will style it as a dark mysterious background.
            // The author's name will be prominently displayed below it.
            coverWrapper.appendChild(placeholder);
        }

        if (isUpcoming) {
            const tag = document.createElement('span');
            tag.className = 'book-tag';
            tag.textContent = label || 'Próximamente';
            coverWrapper.appendChild(tag);
        } else if (hasStory && bookData?.type === 'poem') {
            const aura = document.createElement('div');
            aura.className = 'book-aura';
            aura.setAttribute('aria-hidden', 'true');
            coverWrapper.appendChild(aura);
        }

        // Author voice badge
        if (bookData?.authorVoice && hasStory) {
            const voiceBadge = document.createElement('span');
            voiceBadge.className = 'book-voice-badge';
            voiceBadge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg> Voz del autor`;
            coverWrapper.appendChild(voiceBadge);
        }

        // Progress indicator — only for novels with reading history
        const progress = bookData ? getReadingProgress(bookData) : null;
        if (progress && progress.percent > 0 && isNovel) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'book-progress-badge';
            progressContainer.appendChild(createProgressRing(progress.percent));
            coverWrapper.appendChild(progressContainer);

            // Also add "Continuar" label instead of "Leer"
            card.dataset.hasProgress = 'true';
        }

        // Original work badge (Poema / Relato)
        if (bookData?.author === 'Ju Ez' && hasStory) {
            const originalBadge = document.createElement('span');
            originalBadge.className = 'book-original-badge';
            originalBadge.textContent = bookData.type === 'poem' ? 'Poema' : 'Relato';
            coverWrapper.appendChild(originalBadge);
        }

        const body = document.createElement('div');
        body.className = 'book-card-body';
        if (isUpcoming) body.classList.add('book-card-body--upcoming');

        const displayTitle = isUpcoming
            ? (bookData?.previewTitle || bookData?.title || 'Título en reserva')
            : (bookData?.title || 'Título pendiente');

        const titleEl = document.createElement('h4');
        titleEl.className = 'book-title';
        titleEl.textContent = displayTitle;

        const authorEl = document.createElement('p');
        authorEl.className = 'book-author';
        if (bookData?.author === 'Ju Ez') {
            authorEl.innerHTML = `<span class="author-signature">Ju Ez</span>`;
        } else {
            authorEl.textContent = bookData?.author || '';
        }

        const btn = document.createElement('button');
        btn.className = 'book-open-btn';
        if (hasStory) {
            if (progress && progress.percent > 0) {
                btn.textContent = progress.percent >= 100 ? '✓ Completado' : 'Continuar';
                if (progress.percent >= 100) btn.classList.add('book-open-btn--completed');
            } else {
                btn.textContent = 'Leer';
            }
        } else {
            btn.textContent = 'Muy pronto';
        }
        btn.disabled = !hasStory;

        if (isUpcoming && bookData?.author) {
            body.appendChild(authorEl);
            body.appendChild(titleEl);
        } else {
            body.appendChild(titleEl);
            if (bookData?.author) body.appendChild(authorEl);
        }
        
        // --- Card Action Area ---
        const actionsArea = document.createElement('div');
        actionsArea.className = 'book-card-actions';
        actionsArea.appendChild(btn);

        if (hasStory) {
            // Contenedor relativo para el Kebab y su Popover
            const kebabContainer = document.createElement('div');
            kebabContainer.className = 'book-kebab-container';
            
            const kebabBtn = document.createElement('button');
            kebabBtn.className = 'book-kebab-btn';
            kebabBtn.setAttribute('title', `Opciones de ${displayTitle}`);
            kebabBtn.setAttribute('aria-expanded', 'false');
            // SVG: Tres puntos verticales (more-vertical)
            kebabBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                </svg>
            `;

            // Menu Popover
            const kebabMenu = document.createElement('div');
            kebabMenu.className = 'book-kebab-menu';
            
            // Item 1: Compartir
            const shareItem = document.createElement('button');
            shareItem.className = 'kebab-menu-item';
            shareItem.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                <span>Compartir Obra</span>
            `;
            shareItem.addEventListener('click', (ev) => {
                ev.stopPropagation();
                setKebabOpen(kebabBtn, kebabMenu, false);
                ShareManager.shareBook(bookData.id, bookData.title);
            });
            
            kebabMenu.appendChild(shareItem);
            kebabMenu.appendChild(createShelfMenuItem(bookData, 16, () => setKebabOpen(kebabBtn, kebabMenu, false)));
            
            // Lógica de apertura/cierre
            kebabBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const isOpening = !kebabMenu.classList.contains('active');
                closeAllKebabMenus(kebabMenu);
                setKebabOpen(kebabBtn, kebabMenu, isOpening);
            });

            kebabContainer.appendChild(kebabBtn);
            kebabContainer.appendChild(kebabMenu);
            actionsArea.appendChild(kebabContainer);
        }

        body.appendChild(actionsArea);
        card.appendChild(coverWrapper);
        card.appendChild(body);

        if (hasStory) {
            const openHandler = (ev) => handleBookOpen(ev, bookData, coverImg);
            card.addEventListener('click', openHandler);
            btn.addEventListener('click', openHandler);
        }

        return card;
    }

    return {
        loadBooks,
        renderLibrary
    };
}
