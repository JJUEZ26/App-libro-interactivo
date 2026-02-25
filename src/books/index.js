import { loadPageHistory } from '../utils/storage.js';

export function createLibrary({ libraryHero, librarySections, openBook }) {
    let books = [];
    let sectionsConfig = null;

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
        progressCircle.setAttribute('stroke', 'url(#progressGradient)');
        progressCircle.setAttribute('stroke-width', strokeWidth);
        progressCircle.setAttribute('stroke-linecap', 'round');
        progressCircle.setAttribute('stroke-dasharray', circumference);
        progressCircle.setAttribute('stroke-dashoffset', offset);
        progressCircle.setAttribute('transform', `rotate(-90 ${size / 2} ${size / 2})`);
        progressCircle.classList.add('progress-ring-circle');

        // Gradient
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'progressGradient');
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

            const subtitle = document.createElement('p');
            subtitle.className = 'library-row-subtitle';
            subtitle.textContent = sectionData.subtitle || 'Nuevas incorporaciones para explorar.';

            header.appendChild(title);
            header.appendChild(subtitle);

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
        const hasStory = Boolean(bookData?.storyFile);
        const isNovel = bookData?.type === 'novel';
        const card = document.createElement('article');
        card.className = 'book-card';
        if (!bookData || !hasStory) card.classList.add('book-card--disabled');

        const coverWrapper = document.createElement('div');
        coverWrapper.className = 'book-cover-wrapper';

        let coverImg = null;

        if (bookData?.cover) {
            coverImg = document.createElement('img');
            coverImg.src = bookData.cover;
            coverImg.alt = `Portada de ${bookData.title || 'libro'}`;
            coverImg.loading = 'lazy';
            coverImg.className = 'book-cover';
            coverImg.onerror = function () { this.classList.add('placeholder'); this.src = ''; this.alt = 'Imagen no encontrada'; };
            coverWrapper.appendChild(coverImg);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'book-cover placeholder';
            placeholder.textContent = label || 'Próximamente';
            coverWrapper.appendChild(placeholder);
        }

        if (!hasStory) {
            const tag = document.createElement('span');
            tag.className = 'book-tag';
            tag.textContent = label || 'Próximamente';
            coverWrapper.appendChild(tag);
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

        const body = document.createElement('div');
        body.className = 'book-card-body';
        const titleEl = document.createElement('h4');
        titleEl.className = 'book-title';
        titleEl.textContent = bookData?.title || 'Título pendiente';

        const authorEl = document.createElement('p');
        authorEl.className = 'book-author';
        authorEl.textContent = bookData?.author || '';

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

        body.appendChild(titleEl);
        if (bookData?.author) body.appendChild(authorEl);
        body.appendChild(btn);
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
