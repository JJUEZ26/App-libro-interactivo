import { getAppMode, state } from '../app/state.js';
import { handlePageEffects } from '../effects/index.js';
import { loadPageHistory } from '../utils/storage.js';
import { stopCurrentAudio } from '../reader/audio.js';
// 1. Importamos la función del escarabajo
import { initBeetle } from '../effects/beetle/index.js';

let elements = null;
let loadStoryRef = null;
let goToPageRef = null;

export function setLibraryDependencies({ elements: elementsRef, loadStory, goToPage }) {
    elements = elementsRef;
    loadStoryRef = loadStory;
    goToPageRef = goToPage;
}

// Función auxiliar para borrar el escarabajo si existe
function removeBeetle() {
    const beetle = document.getElementById('beetle-container');
    if (beetle) beetle.remove();
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

    // --- LÓGICA DEL ESCARABAJO ---
    // Intentamos invocar al escarabajo con un 30% de probabilidad
    if (Math.random() < 0.3) { 
        setTimeout(() => {
            // Verificación de seguridad: ¿Seguimos en la biblioteca?
            // Esto evita que aparezca si el usuario entró y salió rápido de un libro.
            if (state.appMode === 'library') {
                initBeetle();
            }
        }, 1500); // Espera 1.5s para dar un susto sorpresa
    }
    // -----------------------------
}

export function switchToReaderView() {
    // --- LIMPIEZA ---
    // Si el usuario abre un libro, el escarabajo debe desaparecer inmediatamente
    removeBeetle();
    // ----------------

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
    // --- LIMPIEZA EXTRA ---
    // Aseguramos que se borre también al llamar a openBook
    removeBeetle();
    // ----------------------

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
