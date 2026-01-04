import { createLibrary } from '../books/index.js';
import { setLibraryDependencies, openBook, switchToLibraryView } from '../library/view.js';
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
import { applyTheme, changeFontSize, cycleTheme, toggleFullscreen, toggleSettingsMenu } from '../ui/index.js';
import { ChatFeature } from '../ui/ChatModule.js';
import { getEl } from './dom.js';
import { initGoalWizard } from './goalWizard.js';
import { setCurrentTheme, setCurrentVolume, setFontSize, state } from './state.js';

export function initApp() {
    console.log('Iniciando Lecturas Interactivas v4.2 (Corrección Audio & Estilos)');

    const elements = {
        appContainer: getEl('app-container'),
        libraryView: getEl('library-view'),
        libraryHero: getEl('library-hero'),
        librarySections: getEl('library-sections'),
        readerView: getEl('reader-view'),
        book: getEl('book'),
        pageWrapper: getEl('page-wrapper'),
        mainTitle: getEl('main-title'),
        backToLibraryBtn: getEl('back-to-library'),
        increaseFontBtn: getEl('increase-font'),
        decreaseFontBtn: getEl('decrease-font'),
        themeSelectorBtn: getEl('theme-selector'),
        settingsToggle: getEl('settings-toggle'),
        settingsMenu: getEl('settings-menu'),
        openGoalWizard: getEl('open-goal-wizard'),
        goalWizardModal: getEl('modal-project'),
        goalWizardClose: getEl('wizard-close'),
        fullscreenBtn: getEl('fullscreen-btn'),
        volumeSlider: getEl('volume-slider'),
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

    if (elements.backToLibraryBtn) {
        elements.backToLibraryBtn.addEventListener('click', () => {
            switchToLibraryView();
        });
    }

    if (elements.volumeSlider) {
        elements.volumeSlider.addEventListener('input', (event) => {
            state.currentVolume = parseFloat(event.target.value);
            if (state.currentAudio) state.currentAudio.volume = state.currentVolume;
            saveVolume(state.currentVolume);
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
                event.target.closest('.audio-controls-container')
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
                    event.target.closest('.audio-controls-container')
                ) {
                    return;
                }

                const touch = event.changedTouches[0];
                const deltaX = touch.clientX - touchStartX;
                const deltaY = touch.clientY - touchStartY;
                const absDeltaX = Math.abs(deltaX);
                const absDeltaY = Math.abs(deltaY);
                if (absDeltaX < 50 || absDeltaX < absDeltaY) return;
                if (deltaX < 0) goForward();
                else goBack();
            },
            { passive: true }
        );
    }

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

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            document.body.classList.add('fullscreen-mode');
            resetScrollPosition();
        } else {
            document.body.classList.remove('fullscreen-mode');
            resetScrollPosition();
        }
    });

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

    if (elements.increaseFontBtn) {
        elements.increaseFontBtn.addEventListener('click', () => changeFontSize(0.1));
    }
    if (elements.decreaseFontBtn) {
        elements.decreaseFontBtn.addEventListener('click', () => changeFontSize(-0.1));
    }
    if (elements.themeSelectorBtn) {
        elements.themeSelectorBtn.addEventListener('click', cycleTheme);
    }
    if (elements.settingsToggle) {
        elements.settingsToggle.addEventListener('click', () => toggleSettingsMenu(elements.settingsMenu));
    }
    if (elements.fullscreenBtn) {
        elements.fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    new ChatFeature();
    const goalWizard = initGoalWizard({
        modal: elements.goalWizardModal,
        openButton: elements.openGoalWizard,
        closeButton: elements.goalWizardClose
    });

    async function initializeApp() {
        loadPreferences({
            readerThemes: state.readerThemes,
            libraryThemes: state.libraryThemes,
            applyTheme,
            volumeSlider: elements.volumeSlider,
            setFontSize,
            setCurrentTheme,
            setCurrentVolume
        });
        switchToLibraryView();
        await library.loadBooks();
        if (goalWizard?.openIfFirstTime) {
            goalWizard.openIfFirstTime();
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    initializeApp();
}
