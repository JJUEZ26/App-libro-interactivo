import { createLibrary } from '../books/index.js';
import { setLibraryDependencies, openBook, switchToLibraryView, setOnLibraryReturn } from '../library/view.js';
import { loadStory } from '../reader/story.js';
import { initHighlights } from '../reader/highlights.js';
import { setRenderDependencies, renderPage, resetScrollPosition } from '../reader/render.js';
import {
    closeNav,
    goBack,
    goForward,
    goToPage,
    openNav,
    previewScrubber,
    restartStory,
    setNavigationDependencies
} from '../reader/navigation.js';
import { loadPreferences, saveVolume } from '../utils/storage.js';
import { applyTheme, changeFontSize, selectTheme, toggleFullscreen } from '../ui/index.js';
import { LazyChatFeature } from '../ui/LazyChatFeature.js';
import { CommandOrb } from '../ui/CommandOrb.js';
import { getEl } from './dom.js';
import { setCurrentTheme, setCurrentVolume, setFontSize, state } from './state.js';
import { handlePageEffects, pauseAllEffectAudio, resumeEffectAudio, syncEffectAudioVolume } from '../effects/index.js';
import { syncCurrentAudioVolume, pauseAllAudioForBackground, resumeAudioFromBackground } from '../reader/audio.js';
import { AuthService } from '../auth/AuthService.js';
import { initAuthViews, showAuthView } from '../auth/AuthViews.js';
import { createAvatarButton, updateAvatarButton, closeDrawer, setProfileControls, isDrawerOpen } from '../auth/UserProfile.js';
import { ensureLibraryStyles } from './styleLoader.js';

export function initApp() {
    console.log('Iniciando Lecturas Interactivas v5.0 (Seguridad + PWA + Accesibilidad)');

    // Expose state globally for lazily-loaded components (e.g. DrawingCanvas gallery metadata)
    window.__APP_STATE__ = state;

    // ── Splash dismissal ──
    function dismissSplash() {
        const splash = document.getElementById('app-splash');
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.classList.add('ready');
        if (splash) {
            splash.classList.add('fade-out');
            splash.addEventListener('transitionend', () => splash.remove(), { once: true });
            // Fallback removal if transitionend doesn't fire
            setTimeout(() => splash.remove(), 500);
        }
    }

    const elements = {
        appContainer: getEl('app-container'),
        libraryView: getEl('library-view'),
        libraryHero: getEl('library-hero'),
        librarySections: getEl('library-sections'),
        authView: getEl('auth-view'),
        headerAvatarSlot: getEl('header-avatar-slot'),
        fullscreenBtn: getEl('fullscreen-btn'),
        readerView: getEl('reader-view'),
        book: getEl('book'),
        pageWrapper: getEl('page-wrapper'),
        mainTitle: getEl('main-title'),
        backToLibraryBtn: getEl('back-to-library'),
        navToggle: getEl('nav-toggle'),
        navModal: getEl('nav-modal'),
        navClose: getEl('nav-close'),
        restartBtn: getEl('restart-btn'),
        historyList: getEl('history-list'),
        progressBarContainer: getEl('progress-bar-container'),
        progressMarker: getEl('progress-marker'),
        progressSlider: getEl('progress-slider'),
        progressPageLabel: getEl('progress-page-label'),
        appFooter: getEl('app-footer'),
        highlightMenu: getEl('highlight-menu'),
        highlightEditMenu: getEl('highlight-edit-menu'),
        highlightPanelToggle: getEl('highlight-panel-toggle'),
        highlightPanel: getEl('highlight-panel'),
        highlightList: getEl('highlight-list')
    };

    setLibraryDependencies({ elements, loadStory, goToPage });
    setRenderDependencies({ elements, goToPage });
    setNavigationDependencies({ elements, renderPage, resetScrollPosition, switchToLibraryView });
    initHighlights({ elements, goToPage });

    const library = createLibrary({
        libraryHero: elements.libraryHero,
        librarySections: elements.librarySections,
        openBook
    });
    let libraryLoadPromise = null;

    function ensureLibraryReady() {
        if (libraryLoadPromise) return libraryLoadPromise;
        libraryLoadPromise = (async () => {
            await ensureLibraryStyles();
            await library.loadBooks();
        })().catch((error) => {
            libraryLoadPromise = null;
            throw error;
        });
        return libraryLoadPromise;
    }

    // Register callback to re-render library when returning from reader
    setOnLibraryReturn(() => library.renderLibrary());

    if (elements.backToLibraryBtn) {
        elements.backToLibraryBtn.addEventListener('click', () => {
            switchToLibraryView();
        });
    }

    if (elements.fullscreenBtn) {
        elements.fullscreenBtn.addEventListener('click', () => {
            toggleFullscreen();
        });
    }

    if (elements.book) {
        elements.book.addEventListener('click', (event) => {
            if (state.appMode !== 'reader') return;
            if (state.isTransitioning) return;
            if (
                event.target.closest('.choices') ||
                event.target.closest('button') ||
                event.target.closest('.karaoke-line') ||
                event.target.closest('.audio-controls-container') ||
                event.target.closest('.discoveries-container')
            ) {
                return;
            }

            const selection = window.getSelection();
            if (selection && selection.type === 'Range') return;

            const rect = elements.book.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const edgeThreshold = rect.width * 0.2;
            if (clickX < edgeThreshold) goBack();
            else if (clickX > rect.width - edgeThreshold) goForward();
        });

        let touchStartX = 0;
        let touchStartY = 0;
        elements.book.addEventListener(
            'touchstart',
            (event) => {
                if (state.appMode !== 'reader') return;
                if (state.isTransitioning) return;
                const touch = event.changedTouches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            },
            { passive: true }
        );

        elements.book.addEventListener(
            'touchend',
            (event) => {
                if (state.appMode !== 'reader') return;
                if (state.isTransitioning) return;
                if (
                    event.target.closest('.choices') ||
                    event.target.closest('button') ||
                    event.target.closest('.karaoke-line') ||
                    event.target.closest('.audio-controls-container') ||
                    event.target.closest('.discoveries-container')
                ) {
                    return;
                }

                const touch = event.changedTouches[0];
                const deltaX = touch.clientX - touchStartX;
                const deltaY = touch.clientY - touchStartY;
                const absDeltaX = Math.abs(deltaX);
                const absDeltaY = Math.abs(deltaY);
                if (absDeltaX < 60 || absDeltaX < absDeltaY * 1.5) return;
                if (navigator.vibrate) navigator.vibrate(15);
                if (deltaX < 0) goForward();
                else goBack();
            },
            { passive: true }
        );
    }

    // =============================================
    // NAVEGACION POR TECLADO (Accesibilidad)
    // =============================================
    document.addEventListener('keydown', (event) => {
        if (state.appMode !== 'reader' || state.isTransitioning) return;
        // No capturar teclas si el usuario esta escribiendo en un input
        if (event.target.closest('input, textarea, [contenteditable]')) return;

        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                goBack();
                break;
            case 'ArrowRight':
                event.preventDefault();
                goForward();
                break;
            case 'Escape':
                event.preventDefault();
                switchToLibraryView();
                break;
        }
    });

    // Navegacion coherente con boton atras
    window.addEventListener('popstate', (event) => {
        if (isDrawerOpen()) {
            closeDrawer(true);
            return;
        }

        if (state.appMode === 'reader') {
            switchToLibraryView(false);
        }
    });

    window.addEventListener('beforeunload', (event) => {
        if (state.appMode === 'reader' && state.currentAudio && !state.currentAudio.paused) {
            event.preventDefault();
            event.returnValue = '';
        }
    });

    // Pausar/reanudar audio cuando la pestana pierde/recupera foco
    let wasPlayingBeforeHidden = false;
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (state.currentAudio && !state.currentAudio.paused) {
                wasPlayingBeforeHidden = true;
                pauseAllAudioForBackground();
            } else {
                wasPlayingBeforeHidden = false;
            }
            pauseAllEffectAudio();
        } else {
            if (wasPlayingBeforeHidden) {
                resumeAudioFromBackground();
                wasPlayingBeforeHidden = false;
            }
            resumeEffectAudio();
        }
    });
    if (elements.navToggle) elements.navToggle.addEventListener('click', openNav);
    if (elements.navClose) elements.navClose.addEventListener('click', closeNav);
    if (elements.restartBtn) elements.restartBtn.addEventListener('click', restartStory);
    if (elements.navModal) {
        elements.navModal.addEventListener('click', (event) => {
            if (event.target === elements.navModal) closeNav();
        });
    }

    if (elements.progressSlider) {
        const setScrubbingState = (isScrubbing) => {
            if (!elements.progressBarContainer) return;
            elements.progressBarContainer.classList.toggle('scrubbing', isScrubbing);
        };

        elements.progressSlider.addEventListener('input', (event) => {
            const value = parseInt(event.target.value, 10);
            previewScrubber(value);
        });

        elements.progressSlider.addEventListener('change', (event) => {
            if (!state.story || state.isTransitioning) return;
            const value = parseInt(event.target.value, 10);
            const target = state.story[value - 1];
            if (!target) return;
            goToPage(target.id);
        });

        elements.progressSlider.addEventListener('pointerdown', () => setScrubbingState(true));
        elements.progressSlider.addEventListener('pointerup', () => setScrubbingState(false));
        elements.progressSlider.addEventListener('pointercancel', () => setScrubbingState(false));
        elements.progressSlider.addEventListener('blur', () => setScrubbingState(false));
    }

    const handleFullscreenChange = () => {
        const isFs = !!document.fullscreenElement || document.body.classList.contains('virtual-fullscreen');
        if (isFs) {
            document.body.classList.add('fullscreen-mode');
        } else {
            document.body.classList.remove('fullscreen-mode');
        }
        resetScrollPosition();
        // Re-trigger effects for current page to ensure they display correctly
        // in the new fullscreen/normal context
        if (state.story && state.currentStoryId) {
            const currentPage = state.story.find(p => p.id === state.currentStoryId);
            if (currentPage && currentPage.effect) {
                handlePageEffects(currentPage.effect, { getAppMode: () => state.appMode });
            }
        }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const headerEl = getEl('app-header');
    let lastScrollTop = 0;
    let headerHidden = false;
    const toggleHeader = (shouldHide) => {
        if (!headerEl) return;
        if (shouldHide === headerHidden) return;
        headerHidden = shouldHide;
        headerEl.classList.toggle('header-hidden', headerHidden);
    };
    const handleScroll = (currentScroll) => {
        const delta = currentScroll - lastScrollTop;
        if (Math.abs(delta) < 8) return;
        if (currentScroll <= 0) {
            toggleHeader(false);
        } else if (delta > 0) {
            toggleHeader(true);
        } else {
            toggleHeader(false);
        }
        lastScrollTop = currentScroll;
    };

    window.addEventListener('scroll', () => handleScroll(window.scrollY), { passive: true });
    if (elements.pageWrapper) {
        elements.pageWrapper.addEventListener(
            'scroll',
            (event) => handleScroll(event.target.scrollTop || 0),
            { passive: true, capture: true }
        );
    }

    setProfileControls({
        getState: () => ({
            currentTheme: state.currentTheme,
            fontSize: state.fontSize,
            currentVolume: state.currentVolume,
            isFullscreen: Boolean(document.fullscreenElement) || 
                          document.body.classList.contains('fullscreen-mode') || 
                          document.body.classList.contains('virtual-fullscreen')
        }),
        onThemeChange: selectTheme,
        onFontSizeChange: changeFontSize,
        onVolumeChange: (value) => {
            state.currentVolume = value;
            syncCurrentAudioVolume();
            syncEffectAudioVolume();
            saveVolume(state.currentVolume);
        },
        onFullscreenToggle: toggleFullscreen
    });

    const chatFeature = new LazyChatFeature();
    const commandOrb = new CommandOrb({ chatFeature });

    async function initializeApp() {
        loadPreferences({
            readerThemes: state.readerThemes,
            libraryThemes: state.libraryThemes,
            applyTheme,
            setFontSize,
            setCurrentTheme,
            setCurrentVolume
        });

        // =====================================================
        // REACTIVE STATE SUBSCRIPTIONS
        // Cada vez que estas propiedades cambian DESDE CUALQUIER
        // módulo, los efectos secundarios ocurren automáticamente.
        // Ya no hay que recordar llamar syncX() manualmente.
        // =====================================================

        // 1. Tema: aplicar clase CSS y meta-color automáticamente
        state.on('currentTheme', (newTheme) => {
            applyTheme(newTheme);
        });

        // 2. Tamaño de fuente: sincronizar CSS var automáticamente
        state.on('fontSize', (newSize) => {
            document.documentElement.style.setProperty('--font-size-dynamic', `${newSize}rem`);
        });

        // 3. Volumen: sincronizar audio principal y efectos automáticamente
        state.on('currentVolume', () => {
            syncCurrentAudioVolume();
            syncEffectAudioVolume();
        });

        // 4. Modo de app: actualizar título del documento para lectores de pantalla
        state.on('appMode', (newMode) => {
            const modeLabels = { library: 'Biblioteca', reader: 'Leyendo', auth: 'Iniciar sesión' };
            const suffix = modeLabels[newMode] || '';
            document.title = suffix ? `${suffix} — Lecturas Interactivas` : 'Lecturas Interactivas';
        });

        // 5. Libro actual: limpiar datos efímeros de sesión (puntuaciones de juegos, etc.)
        state.on('currentBook', (newBook, oldBook) => {
            if (newBook?.id !== oldBook?.id) {
                state.ephemeral = {};
            }
        });

        // Auth System Setup
        // Mount avatar button in header
        const avatarBtn = createAvatarButton();
        if (elements.headerAvatarSlot) {
            elements.headerAvatarSlot.appendChild(avatarBtn);
        }

        // Initialize auth views
        if (elements.authView) {
            initAuthViews({
                container: elements.authView,
                onSuccess: () => {
                    // After successful login/register or skip, go to library
                    switchToLibraryFromAuth();
                }
            });
        }

        // Listen for auth state changes
        AuthService.onAuthStateChange((user) => {
            state.currentUser = user;
            state.isAuthenticated = !!user;
            updateAvatarButton(avatarBtn, user);
        });

        // Listen for login request from profile drawer
        window.addEventListener('auth:show-login', () => {
            switchToAuthView();
        });

        // Determine initial view
        const hasSession = AuthService.isAuthenticated();
        if (hasSession) {
            await ensureLibraryStyles();
            // User is logged in -> go straight to library
            document.body.classList.add('app-mode-library');
            switchToLibraryView();
            void ensureLibraryReady().catch((error) => {
                console.error('No se pudo cargar la biblioteca inicial:', error);
            });
        } else {
            // Show auth screen first
            switchToAuthView();
        }

        // ── Reveal content & dismiss splash ──
        dismissSplash();
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    /**
     * Show the authentication view
     */
    function switchToAuthView() {
        state.appMode = 'auth';
        document.body.classList.remove('app-mode-library', 'app-mode-reader');
        document.body.classList.add('app-mode-auth');

        if (elements.authView) elements.authView.hidden = false;
        if (elements.libraryView) elements.libraryView.hidden = true;
        if (elements.readerView) elements.readerView.hidden = true;

        // Hide reader-only and user controls
        if (elements.headerAvatarSlot) elements.headerAvatarSlot.classList.add('hidden');
        if (elements.fullscreenBtn) elements.fullscreenBtn.classList.add('hidden');
        if (elements.backToLibraryBtn) elements.backToLibraryBtn.classList.add('hidden');
        if (elements.navToggle) elements.navToggle.classList.add('hidden');
        if (elements.appFooter) elements.appFooter.classList.add('hidden');
        if (elements.mainTitle) elements.mainTitle.textContent = 'Lecturas Interactivas';

        showAuthView('login');
    }

    /**
     * Transition from auth view to library view
     */
    async function switchToLibraryFromAuth() {
        await ensureLibraryStyles();
        if (elements.authView) {
            elements.authView.hidden = true;
        }
        closeDrawer();
        switchToLibraryView();
        void ensureLibraryReady().catch((error) => {
            console.error('No se pudo cargar la biblioteca tras autenticacion:', error);
        });
    }

    initializeApp();
}
