import { getAppMode, state } from '../app/state.js';
import { handlePageEffects, startLibraryBeetle, stopLibraryBeetle } from '../effects/index.js';
import { loadPageHistory } from '../utils/storage.js';
import { clearAudioExperienceContext, stopCurrentAudio } from '../reader/audio.js';

let elements = null;
let loadStoryRef = null;
let goToPageRef = null;
let onLibraryReturnCallback = null;

export function setLibraryDependencies({ elements: elementsRef, loadStory, goToPage }) {
    elements = elementsRef;
    loadStoryRef = loadStory;
    goToPageRef = goToPage;
}

/**
 * Register a callback to re-render library when returning from reader
 */
export function setOnLibraryReturn(callback) {
    onLibraryReturnCallback = callback;
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
    clearAudioExperienceContext();
    handlePageEffects(null, { getAppMode });
    startLibraryBeetle({ getAppMode });
    window.scrollTo(0, 0);

    // Re-render library to update progress indicators
    if (onLibraryReturnCallback) {
        onLibraryReturnCallback();
    }
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
    stopLibraryBeetle();
}

/** Small helper: resolve after N ms */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



/**
 * Open a book with a smooth cinematic transition.
 * 
 * ARCHITECTURE (optimized for zero-freeze):
 *   1. Show overlay INSTANTLY (lightweight CSS-only)
 *   2. In parallel: animate cover + load story data
 *   3. When BOTH are done: switch to reader view (hidden under overlay)
 *   4. Fade overlay out — NO blocking nextPaint()
 */
export async function openBook(bookData, coverImgEl) {
    if (!bookData || !bookData.storyFile) return;

    // --- STEP 1: Instant overlay ---
    const overlay = document.createElement('div');
    overlay.className = 'book-open-overlay';
    document.body.appendChild(overlay);

    // Force layout then activate
    overlay.offsetHeight;
    overlay.classList.add('active');

    // --- STEP 2: Create cover clone (if we have an image) ---
    let clone = null;
    let titleEl = null;

    if (coverImgEl?.src && coverImgEl.naturalWidth > 0) {
        const rect = coverImgEl.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const targetW = Math.min(220, vw * 0.4);
        const targetH = targetW * 1.5;
        const targetX = (vw - targetW) / 2;
        const targetY = (vh - targetH) / 2 - 20;

        clone = document.createElement('img');
        clone.src = coverImgEl.src;
        clone.decoding = 'async'; // Don't block main thread for image decode
        clone.style.cssText = `
            position: fixed;
            top: ${rect.top}px;
            left: ${rect.left}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            object-fit: cover;
            border-radius: 12px;
            z-index: 10002;
            will-change: transform, opacity;
            transition: top 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                        left 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                        width 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                        height 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                        border-radius 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                        box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
        `;
        document.body.appendChild(clone);

        titleEl = document.createElement('div');
        titleEl.className = 'book-open-title';
        titleEl.innerHTML = `<h2>${bookData.title || ''}</h2><p>${bookData.author || ''}</p>`;
        document.body.appendChild(titleEl);

        // Animate to center on next frame
        requestAnimationFrame(() => {
            clone.style.top = `${targetY}px`;
            clone.style.left = `${targetX}px`;
            clone.style.width = `${targetW}px`;
            clone.style.height = `${targetH}px`;
            clone.style.borderRadius = '16px';
            clone.style.boxShadow = '0 25px 60px rgba(0,0,0,0.8)';
        });

        // Show title with slight delay
        setTimeout(() => titleEl?.classList.add('visible'), 180);
    }

    // --- STEP 3: Load story IN PARALLEL with the animation ---
    const MIN_ANIMATION_MS = 350; // Reduced from 500 — cover is already centered by then

    const [storyLoaded] = await Promise.all([
        (async () => {
            state.currentBook = bookData;
            if (elements?.mainTitle) elements.mainTitle.textContent = bookData.title || 'Lectura';
            if (loadStoryRef) await loadStoryRef(bookData.storyFile);
            return !!state.story;
        })(),
        delay(MIN_ANIMATION_MS)
    ]);

    if (!storyLoaded) {
        cleanup(overlay, clone, titleEl);
        return;
    }

    // --- STEP 4: Prepare reader UNDER the overlay ---
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

    // --- STEP 5: Fade out everything smoothly ---
    // Instead of blocking with await nextPaint(), we use a single rAF
    // so the browser paints the reader content, then starts fade-out.
    requestAnimationFrame(() => {
        if (clone) {
            clone.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            clone.style.opacity = '0';
            clone.style.transform = 'scale(1.05)';
        }
        if (titleEl) {
            titleEl.classList.remove('visible');
            titleEl.classList.add('fade-out');
        }
        overlay.classList.add('fade-out');

        // Cleanup after fade completes
        setTimeout(() => cleanup(overlay, clone, titleEl), 350);
    });
}

function cleanup(overlay, clone, titleEl) {
    clone?.remove();
    titleEl?.remove();
    overlay?.remove();
}
