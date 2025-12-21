export function createLibrary({ libraryHero, librarySections, openBook }) {
    let books = [];
    let sectionsConfig = null;

    async function loadBooks() {
        if (!libraryHero && !librarySections) return;

        try {
            const [booksResponse, sectionsResponse] = await Promise.all([
                fetch('data/books.json'),
                fetch('data/library-sections.json')
            ]);
            if (!booksResponse.ok) throw new Error(`Error HTTP: ${booksResponse.status}`);
            if (!sectionsResponse.ok) throw new Error(`Error HTTP: ${sectionsResponse.status}`);
            books = await booksResponse.json();
            sectionsConfig = await sectionsResponse.json();
            renderLibrary();
        } catch (error) {
            console.error('Error al cargar books.json:', error);
            if (librarySections) {
                librarySections.innerHTML =
                    '<p style="padding: 20px; color: red;">Error cargando la biblioteca. Revisa que data/books.json y data/library-sections.json existan y sean válidos.</p>';
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

    function renderHero(booksById) {
        const featuredId = sectionsConfig?.featuredBookId;
        const featuredBook = featuredId ? booksById.get(featuredId) : null;

        const hero = document.createElement('div');
        hero.className = 'library-hero-card';

        const heroContent = document.createElement('div');
        heroContent.className = 'library-hero-content';

        const heroLabel = document.createElement('span');
        heroLabel.className = 'library-hero-label';
        heroLabel.textContent = 'Libro estrella';

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
        heroButton.textContent = featuredBook?.storyFile ? 'Leer ahora' : 'Muy pronto';
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
            img.onerror = function() { this.classList.add('placeholder'); this.src=''; this.alt='Imagen no encontrada'; };
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
            const openHandler = () => openBook(featuredBook);
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

    function createBookCard(bookData, { label }) {
        const hasStory = Boolean(bookData?.storyFile);
        const card = document.createElement('article');
        card.className = 'book-card';
        if (!bookData || !hasStory) card.classList.add('book-card--disabled');

        const coverWrapper = document.createElement('div');
        coverWrapper.className = 'book-cover-wrapper';

        if (bookData?.cover) {
            const img = document.createElement('img');
            img.src = bookData.cover;
            img.alt = `Portada de ${bookData.title || 'libro'}`;
            img.loading = 'lazy';
            img.className = 'book-cover';
            img.onerror = function() { this.classList.add('placeholder'); this.src=''; this.alt='Imagen no encontrada'; };
            coverWrapper.appendChild(img);
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
        btn.textContent = hasStory ? 'Leer' : 'Muy pronto';
        btn.disabled = !hasStory;

        body.appendChild(titleEl);
        if (bookData?.author) body.appendChild(authorEl);
        body.appendChild(btn);
        card.appendChild(coverWrapper);
        card.appendChild(body);

        if (hasStory) {
            const openHandler = (ev) => { ev.stopPropagation(); openBook(bookData); };
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
