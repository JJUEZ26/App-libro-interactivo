import { initBeetle } from '../effects/beetle/index.js';
3.  Busca la función donde se renderiza la librería (probablemente se llame `renderLibrary` o similar, o al final del `init`).
import { getAppMode, state } from '../app/state.js';
import { handlePageEffects } from '../effects/index.js';
import { loadPageHistory } from '../utils/storage.js';
import { stopCurrentAudio } from '../reader/audio.js';

let elements = null;
let loadStoryRef = null;
let goToPageRef = null;

export function setLibraryDependencies({ elements: elementsRef, loadStory, goToPage }) {
    elements = elementsRef;
    loadStoryRef = loadStory;
    goToPageRef = goToPage;
}

export function switchToLibraryView() {
    state.appMode = 'library';
    document.body.classList.remove('app-mode-reader', 'fullscreen-mode');
    document.body.classList.add('app-mode-library');

    if (elements?.libraryView) {
        elements.libraryView.hidden = false;
        elements.libraryView.style.display = '';
    }

    if (elements?.readerView) {
        elements.readerView.classList.remove('active');
        elements.readerView.hidden = true;
        elements.readerView.style.display = 'none';
    }

    if (elements?.pageWrapper) {
        elements.pageWrapper.innerHTML = '';
    }

    if (elements?.backToLibraryBtn) elements.backToLibraryBtn.classList.add('hidden');
    if (elements?.navToggle) elements.navToggle.classList.add('hidden');
    if (elements?.fullscreenBtn) elements.fullscreenBtn.classList.add('hidden');
    if (elements?.appFooter) elements.appFooter.classList.add('hidden');
    if (elements?.mainTitle) elements.mainTitle.textContent = 'Lecturas Interactivas';

    stopCurrentAudio();
    handlePageEffects(null, { getAppMode });
    window.scrollTo(0, 0);
}

export function switchToReaderView() {
    state.appMode = 'reader';
    document.body.classList.remove('app-mode-library');
    document.body.classList.add('app-mode-reader');

    if (elements?.libraryView) {
        elements.libraryView.hidden = true;
        elements.libraryView.style.display = 'none';
    }

    if (elements?.readerView) {
        elements.readerView.hidden = false;
        elements.readerView.style.display = '';
        elements.readerView.classList.add('active');
    }

    if (elements?.backToLibraryBtn) elements.backToLibraryBtn.classList.remove('hidden');
    if (elements?.navToggle) elements.navToggle.classList.remove('hidden');
    if (elements?.fullscreenBtn) elements.fullscreenBtn.classList.remove('hidden');
    if (elements?.appFooter) elements.appFooter.classList.remove('hidden');
}

export async function openBook(bookData) {
    if (!bookData || !bookData.storyFile) return;
    state.currentBook = bookData;
    if (elements?.mainTitle) elements.mainTitle.textContent = bookData.title || 'Lectura';
    if (loadStoryRef) await loadStoryRef(bookData.storyFile);
    if (!state.story) return;

    const loadedHistory = loadPageHistory(state.currentBook.id);
    if (loadedHistory && loadedHistory.length > 0) {
        state.pageHistory = loadedHistory;
        state.currentStoryId = state.pageHistory[state.pageHistory.length - 1];
    } else {
        state.currentStoryId = state.story[0].id;
        state.pageHistory = [state.currentStoryId];
    }
    switchToReaderView();
    if (goToPageRef) goToPageRef(state.currentStoryId, true);
}
