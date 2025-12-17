document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando Lecturas Interactivas");

    // ELEMENTOS BÁSICOS
    const appContainer = document.getElementById('app-container');
    const libraryView = document.getElementById('library-view');
    const libraryGrid = document.getElementById('library-grid');
    const readerView = document.getElementById('reader-view');

    const book = document.getElementById('book');
    const pageWrapper = document.getElementById('page-wrapper');

    const mainTitle = document.getElementById('main-title');
    const backToLibraryBtn = document.getElementById('back-to-library');

    const increaseFontBtn = document.getElementById('increase-font');
    const decreaseFontBtn = document.getElementById('decrease-font');
    const themeSelectorBtn = document.getElementById('theme-selector');
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsMenu = document.getElementById('settings-menu');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const volumeSlider = document.getElementById('volume-slider');

    const navToggle = document.getElementById('nav-toggle');
    const navModal = document.getElementById('nav-modal');
    const navClose = document.getElementById('nav-close');
    const restartBtn = document.getElementById('restart-btn');
    const historyList = document.getElementById('history-list');

    const progressBar = document.getElementById('progress-bar');
    const appFooter = document.getElementById('app-footer');

    // ESTADO GENERAL
    let appMode = 'library';
    let books = [];
    let currentBook = null;

    // Estado de lectura
    let story = null;
    let currentStoryId = -1;
    let pageHistory = [];
    let fontSize = 1.1;

    // Efectos
    let birdInterval = null;

    const readerThemes = ['light', 'sepia', 'bone', 'dark'];
    const libraryThemes = ['light', 'dark'];
    let currentTheme = 'light';

    let isTransitioning = false;
    let currentAudio = null;
    let currentVolume = 1;
    let totalPagesInStory = 0;

    const themeColors = {
        light: '#fdf6e3',
        sepia: '#f4ecd8',
        bone: '#f2f0e9',
        dark: '#1a1a1a'
    };

    /* =========================
       PREFERENCIAS
       ========================= */
    function loadPreferences() {
        const savedFontSize = localStorage.getItem('fontSize');
        const savedTheme = localStorage.getItem('theme');
        const savedVolume = localStorage.getItem('volume');

        if (savedFontSize) {
            fontSize = parseFloat(savedFontSize);
            document.documentElement.style.setProperty('--font-size-dynamic', `${fontSize}rem`);
        }

        if (savedTheme && (readerThemes.includes(savedTheme) || libraryThemes.includes(savedTheme))) {
            currentTheme = savedTheme;
        } else {
            currentTheme = 'light';
        }
        applyTheme(currentTheme);

        if (savedVolume !== null) {
            currentVolume = parseFloat(savedVolume);
            volumeSlider.value = currentVolume;
        }
    }

    function saveFontSize() { localStorage.setItem('fontSize', fontSize); }
    function saveTheme() { localStorage.setItem('theme', currentTheme); }
    function saveVolume() { localStorage.setItem('volume', currentVolume); }

    function getPageHistoryKey(bookId) { return `pageHistory-${bookId}`; }
    function savePageHistory() {
        if (!currentBook) return;
        localStorage.setItem(getPageHistoryKey(currentBook.id), JSON.stringify(pageHistory));
    }
    function loadPageHistory(bookId) {
        const savedHistory = localStorage.getItem(getPageHistoryKey(bookId));
        return savedHistory ? JSON.parse(savedHistory) : null;
    }

    /* =========================
       TEMAS
       ========================= */
    function applyTheme(themeName) {
        document.body.classList.remove('theme-light', 'theme-sepia', 'theme-bone', 'theme-dark');
        const className = `theme-${themeName}`;
        document.body.classList.add(className);

        const metaThemeColor = document.querySelector("meta[name=theme-color]");
        if (metaThemeColor && themeColors[themeName]) {
            metaThemeColor.setAttribute('content', themeColors[themeName]);
        }
    }

    function cycleTheme() {
        const palette = (appMode === 'reader') ? readerThemes : libraryThemes;
        let index = palette.indexOf(currentTheme);
        if (index === -1) index = 0;
        const nextIndex = (index + 1) % palette.length;
        currentTheme = palette[nextIndex];
        applyTheme(currentTheme);
        saveTheme();
    }

    /* =========================
       BIBLIOTECA
       ========================= */
    async function loadBooks() {
        try {
            const response = await fetch('data/books.json');
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            books = await response.json();
            renderLibrary();
        } catch (error) {
            console.error('Error al cargar books.json:', error);
            libraryGrid.innerHTML = '<p>No se pudieron cargar los libros.</p>';
        }
    }

    function renderLibrary() {
        libraryGrid.innerHTML = '';
        if (!books || books.length === 0) {
            libraryGrid.innerHTML = '<p>Tu biblioteca está vacía.</p>';
            return;
        }
        books.forEach((bookData) => {
            const hasStory = Boolean(bookData.storyFile);
            const card = document.createElement('article');
            card.className = 'book-card';
            if (!hasStory) card.classList.add('book-card--disabled');
            card.dataset.bookId = bookData.id;

            const coverWrapper = document.createElement('div');
            coverWrapper.className = 'book-cover-wrapper';

            if (bookData.cover) {
                const img = document.createElement('img');
                img.src = bookData.cover;
                img.alt = `Portada de ${bookData.title || 'libro'}`;
                img.loading = 'lazy';
                img.className = 'book-cover';
                coverWrapper.appendChild(img);
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'book-cover placeholder';
                placeholder.textContent = 'Próximamente';
                coverWrapper.appendChild(placeholder);
            }

            if (!hasStory) {
                const tag = document.createElement('span');
                tag.className = 'book-tag';
                tag.textContent = 'Próximamente';
                coverWrapper.appendChild(tag);
            }

            const body = document.createElement('div');
            body.className = 'book-card-body';
            const titleEl = document.createElement('h3');
            titleEl.className = 'book-title';
            titleEl.textContent = bookData.title || 'Título pendiente';

            const authorEl = document.createElement('p');
            authorEl.className = 'book-author';
            authorEl.textContent = bookData.author || '';

            const btn = document.createElement('button');
            btn.className = 'book-open-btn';
            btn.textContent = hasStory ? 'Leer' : 'Muy pronto';
            btn.disabled = !hasStory;

            body.appendChild(titleEl);
            if (bookData.author) body.appendChild(authorEl);
            body.appendChild(btn);
            card.appendChild(coverWrapper);
            card.appendChild(body);
            libraryGrid.appendChild(card);

            if (hasStory) {
                const openHandler = (ev) => { ev.stopPropagation(); openBook(bookData); };
                card.addEventListener('click', openHandler);
                btn.addEventListener('click', openHandler);
            }
        });
    }

    function switchToLibraryView() {
        appMode = 'library';
        document.body.classList.remove('app-mode-reader', 'fullscreen-mode');
        document.body.classList.add('app-mode-library');
        libraryView.hidden = false;
        readerView.hidden = true;
        backToLibraryBtn.classList.add('hidden');
        navToggle.classList.add('hidden');
        fullscreenBtn.classList.add('hidden');
        if (appFooter) appFooter.classList.add('hidden');
        mainTitle.textContent = 'Lecturas Interactivas';
        stopCurrentAudio();
        
        // Limpiar efectos especiales al salir
        if (birdInterval) {
            clearInterval(birdInterval);
            birdInterval = null;
        }
        const bird = document.querySelector('.flying-bird');
        if (bird) bird.remove();
    }

    function switchToReaderView() {
        appMode = 'reader';
        document.body.classList.remove('app-mode-library');
        document.body.classList.add('app-mode-reader');
        libraryView.hidden = true;
        readerView.hidden = false;
        readerView.classList.add('active');
        backToLibraryBtn.classList.remove('hidden');
        navToggle.classList.remove('hidden');
        fullscreenBtn.classList.remove('hidden');
        if (appFooter) appFooter.classList.remove('hidden');
    }

    async function openBook(bookData) {
        if (!bookData || !bookData.storyFile) return;
        currentBook = bookData;
        mainTitle.textContent = bookData.title || 'Lectura';
        await loadStory(bookData.storyFile);
        if (!story) return;

        // Reiniciar siempre al principio si es el poema (para efectos) o cargar historial si existe
        // Para este caso, mantenemos la lógica estándar:
        const loadedHistory = loadPageHistory(currentBook.id);
        if (loadedHistory && loadedHistory.length > 0) {
            pageHistory = loadedHistory;
            currentStoryId = pageHistory[pageHistory.length - 1];
        } else {
            currentStoryId = story[0].id;
            pageHistory = [currentStoryId];
        }
        switchToReaderView();
        goToPage(currentStoryId, true);
    }

    backToLibraryBtn.addEventListener('click', () => {
        switchToLibraryView();
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });

    /* =========================
       HISTORIA / LECTOR
       ========================= */
    async function loadStory(storyFilePath) {
        try {
            const response = await fetch(storyFilePath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            story = await response.json();
            totalPagesInStory = story.length;
        } catch (error) {
            console.error('Error al cargar historia:', error);
            story = null;
        }
    }

    function stopCurrentAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
    }

    function playPageSound(pageId, soundFileOverride = null) {
        stopCurrentAudio();
        
        let soundFile = soundFileOverride;
        if (!soundFile && story && pageId) {
            const pageData = story.find(p => p.id === pageId);
            if (pageData) soundFile = pageData.sound;
        }

        if (soundFile) {
            currentAudio = new Audio(`sounds/${soundFile}`);
            currentAudio.loop = true;
            currentAudio.volume = currentVolume;
            currentAudio.play().catch(err => console.error('Error al reproducir audio:', err));
        }
    }

    volumeSlider.addEventListener('input', (e) => {
        currentVolume = parseFloat(e.target.value);
        if (currentAudio) {
            currentAudio.volume = currentVolume;
        }
        saveVolume();
    });

    /* =========================
       SISTEMA DE EFECTOS
       ========================= */
    function handlePageEffects(effectName) {
        if (birdInterval) {
            clearInterval(birdInterval);
            birdInterval = null;
        }
        const existingBird = document.querySelector('.flying-bird');
        if (existingBird) existingBird.remove();

        if (effectName === 'bluebird_pass') {
            startBirdEffect();
        }
    }

    function startBirdEffect() {
        const spawnBird = () => {
            // Asegurarnos de que estamos en modo lectura
            if (appMode !== 'reader') return;

            const bird = document.createElement('div');
            bird.className = 'flying-bird';
            
            // Posición aleatoria en altura
            const randomTop = Math.floor(Math.random() * 60) + 10;
            bird.style.top = `${randomTop}%`;
            
            // Tamaño aleatorio
            const scale = 0.8 + Math.random() * 0.5;
            bird.style.transform = `scale(${scale})`;

            document.body.appendChild(bird);
            
            requestAnimationFrame(() => {
                bird.classList.add('animate-fly');
            });

            setTimeout(() => {
                if(bird.parentNode) bird.parentNode.removeChild(bird);
            }, 8000);
        };

        // Primer pájaro a los 2s
        setTimeout(spawnBird, 2000);

        // Pájaro periódico
        birdInterval = setInterval(() => {
            if(Math.random() > 0.4) spawnBird(); 
        }, 12000);
    }

    function preloadNextImages(currentPageId) {
        if (!story) return;
        const currentPage = story.find(p => p.id === currentPageId);
        if (!currentPage || !currentPage.choices) return;

        currentPage.choices.forEach(choice => {
            // Si es número o string, buscamos
            const nextPage = story.find(p => p.id === choice.page);
            if (nextPage) {
                if (nextPage.images && nextPage.images.length > 0) {
                    nextPage.images.forEach(imgUrl => {
                        const img = new Image();
                        img.src = imgUrl;
                    });
                }
                if (nextPage.sound) {
                    const audio = new Audio(`sounds/${nextPage.sound}`);
                    audio.preload = 'auto';
                }
            }
        });
    }

    function renderPage(pageId) {
        pageWrapper.innerHTML = '';
        if (!story) return;

        // Manejar "volver atrás" si id es -1
        if (pageId === -1) {
            switchToLibraryView();
            return;
        }

        const pageData = story.find(p => p.id === pageId);
        if (!pageData) return;

        const pageContent = document.createElement('div');
        pageContent.className = 'page-content';

        const contentCenterer = document.createElement('div');
        contentCenterer.className = 'content-centerer';

        let contentHtml = '';
        if (pageData.images && pageData.images.length > 0) {
            const imgsHtml = pageData.images
                .map(url => `<img src="${url}" alt="Ilustración" loading="eager">`)
                .join('');
            contentHtml += `<div class="images-container">${imgsHtml}</div>`;
        }

        if (pageData.scenes && pageData.scenes.length > 0) {
            const scenesHtml = pageData.scenes
                .map((s, index) => `<p class="fade-in-text" style="animation-delay: ${index * 0.2}s">${s.replace(/\n/g, '</p><p class="fade-in-text">')}</p>`)
                .join('');
            contentHtml += `<div class="scenes-container">${scenesHtml}</div>`;
        }

        contentCenterer.innerHTML = contentHtml;

        if (pageData.choices && pageData.choices.length > 0) {
            const choicesDiv = document.createElement('div');
            choicesDiv.className = 'choices';
            pageData.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.textContent = choice.text;
                btn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    goToPage(choice.page);
                });
                choicesDiv.appendChild(btn);
            });
            contentCenterer.appendChild(choicesDiv);
        }

        pageContent.appendChild(contentCenterer);
        if (pageData.page !== undefined) {
            const pageNumberDiv = document.createElement('div');
            pageNumberDiv.className = 'page-number';
            pageNumberDiv.textContent = `Página ${pageData.page}`;
            pageContent.appendChild(pageNumberDiv);
        }
        pageWrapper.appendChild(pageContent);
        
        // --- AUDIO ---
        if (pageData.bgMusic) {
            playPageSound(null, pageData.bgMusic);
        } else if (pageData.sound) {
            playPageSound(null, pageData.sound);
        }

        // --- EFECTOS ---
        handlePageEffects(pageData.effect);

        preloadNextImages(pageId);
    }

    function resetScrollPosition() {
        if (pageWrapper.querySelector('.page-content')) {
            pageWrapper.querySelector('.page-content').scrollTop = 0;
        }
        pageWrapper.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    function updateUI() {
        if (!story || totalPagesInStory === 0) {
            progressBar.style.width = '0%';
            return;
        }
        const uniqueVisited = new Set(pageHistory);
        const progress = (uniqueVisited.size / totalPagesInStory) * 100;
        progressBar.style.width = `${progress}%`;
    }

    function goToPage(pageId, isGoingBack = false) {
        if (!story || isTransitioning) return;
        
        // Manejo especial salir
        if (pageId === -1) {
            switchToLibraryView();
            return;
        }

        if (!story.some(p => p.id === pageId)) return;

        isTransitioning = true;
        pageWrapper.classList.remove('page-enter');
        pageWrapper.classList.add('page-exit');

        setTimeout(() => {
            renderPage(pageId);
            resetScrollPosition();
            currentStoryId = pageId;
            if (!isGoingBack && !pageHistory.includes(pageId)) {
                pageHistory.push(pageId);
            }
            savePageHistory();
            pageWrapper.classList.remove('page-exit');
            void pageWrapper.offsetWidth;
            pageWrapper.classList.add('page-enter');
            setTimeout(() => { isTransitioning = false; updateUI(); }, 500);
        }, 400);
    }

    function goBack() {
        if (isTransitioning || pageHistory.length <= 1) return;
        pageHistory.pop();
        const prevId = pageHistory[pageHistory.length - 1];
        goToPage(prevId, true);
    }

    function goForward() {
        if (isTransitioning || !story) return;
        const pageData = story.find(p => p.id === currentStoryId);
        if (pageData && pageData.choices && pageData.choices.length === 1) {
            goToPage(pageData.choices[0].page);
        }
    }

    book.addEventListener('click', (event) => {
        if (appMode !== 'reader') return;
        if (isTransitioning) return;
        if (event.target.closest('.choices') || event.target.closest('button')) return;
        const rect = book.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        if (clickX < rect.width * 0.3) goBack(); else goForward();
    });

    /* =========================
       NAVEGACIÓN / HISTORIAL
       ========================= */
    function openNav() {
        if (!story) return;
        updateNavigationList();
        navModal.classList.add('active');
    }
    function closeNav() { navModal.classList.remove('active'); }
    function updateNavigationList() {
        historyList.innerHTML = '';
        if (!story || !pageHistory.length) return;
        const milestones = pageHistory.filter((pageId, index) => {
            if (index === 0) return true;
            const pageData = story.find(p => p.id === pageId);
            return pageData && pageData.choices && pageData.choices.length > 1;
        });
        const recentMilestones = milestones.slice().reverse();
        recentMilestones.forEach(pageId => {
            const pageData = story.find(p => p.id === pageId);
            if (!pageData) return;
            const li = document.createElement('li');
            li.className = 'history-item decision';
            const isStart = (pageHistory.indexOf(pageId) === 0);
            const title = isStart ? 'Inicio' : 'Punto de decisión';
            let preview = '';
            if (pageData.scenes && pageData.scenes.length > 0) {
                const clean = pageData.scenes[0].replace(/<[^>]*>?/gm, '');
                preview = clean.substring(0, 60) + (clean.length > 60 ? '…' : '');
            }
            li.innerHTML = `<span class="history-title">${title} <span class="history-tag">Volver aquí</span></span>
                            <span class="history-preview">${preview}</span>`;
            li.addEventListener('click', () => { jumpToHistoryPoint(pageId); closeNav(); });
            historyList.appendChild(li);
        });
    }
    function jumpToHistoryPoint(targetId) {
        if (!story) return;
        if (targetId === currentStoryId) return;
        const idx = pageHistory.indexOf(targetId);
        if (idx !== -1) {
            pageHistory = pageHistory.slice(0, idx + 1);
            goToPage(targetId, true);
        }
    }
    function restartStory() {
        if (!story || !currentBook) return;
        const confirmed = confirm('¿Reiniciar historia?');
        if (!confirmed) return;
        const startId = story[0].id;
        pageHistory = [startId];
        savePageHistory();
        goToPage(startId, true);
        closeNav();
    }

    navToggle.addEventListener('click', openNav);
    navClose.addEventListener('click', closeNav);
    restartBtn.addEventListener('click', restartStory);
    navModal.addEventListener('click', (ev) => { if (ev.target === navModal) closeNav(); });

    /* =========================
       AJUSTES: FUENTE / TEMA / FULLSCREEN
       ========================= */
    function changeFontSize(delta) {
        fontSize = Math.max(0.8, Math.min(1.8, fontSize + delta));
        document.documentElement.style.setProperty('--font-size-dynamic', `${fontSize}rem`);
        saveFontSize();
    }
    function toggleSettingsMenu() { settingsMenu.classList.toggle('visible'); }

    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    function toggleFullscreen() {
        const doc = document;
        if (isIOS()) {
            document.body.classList.toggle('fullscreen-mode');
            window.scrollTo(0, 1);
            return;
        }
        if (!doc.fullscreenElement) {
            doc.documentElement.requestFullscreen().catch(err => {
                console.warn('Fullscreen API falló, usando modo CSS:', err);
                document.body.classList.toggle('fullscreen-mode');
            });
        } else {
            doc.exitFullscreen();
        }
    }

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            document.body.classList.add('fullscreen-mode');
            resetScrollPosition();
        } else {
            document.body.classList.remove('fullscreen-mode');
            resetScrollPosition();
        }
    });

    increaseFontBtn.addEventListener('click', () => changeFontSize(0.1));
    decreaseFontBtn.addEventListener('click', () => changeFontSize(-0.1));
    themeSelectorBtn.addEventListener('click', cycleTheme);
    settingsToggle.addEventListener('click', toggleSettingsMenu);
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    /* =========================
       INICIALIZACIÓN
       ========================= */
    async function initializeApp() {
        loadPreferences();
        switchToLibraryView();
        await loadBooks();
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    initializeApp();
});
