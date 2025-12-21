import { getAppMode, state } from '../app/state.js';
import { handlePageEffects } from '../effects/index.js';
import {
    playPageSound,
    startKaraokeSync,
    stopCurrentAudio,
    toggleKaraokeAudio,
    updatePlayButtonState
} from './audio.js';

let elements = null;
let goToPage = null;

export function setRenderDependencies({ elements: elementsRef, goToPage: goToPageRef }) {
    elements = elementsRef;
    goToPage = goToPageRef;
}

export function preloadNextImages(currentPageId) {
    if (!state.story) return;
    const currentPage = state.story.find((page) => page.id === currentPageId);
    if (!currentPage || !currentPage.choices) return;

    currentPage.choices.forEach((choice) => {
        const nextPage = state.story.find((page) => page.id === choice.page);
        if (nextPage) {
            if (nextPage.images) nextPage.images.forEach((url) => {
                new Image().src = url;
            });
            if (nextPage.sound) {
                new Audio(`sounds/${nextPage.sound}`).preload = 'auto';
            }
        }
    });
}

export function renderPage(pageId) {
    if (!elements?.pageWrapper) return;

    elements.pageWrapper.innerHTML = '';
    if (!state.story) return;

    const pageData = state.story.find((page) => page.id === pageId);
    if (!pageData) return;

    const pageContent = document.createElement('div');
    pageContent.className = 'page-content';

    const contentCenterer = document.createElement('div');
    contentCenterer.className = 'content-centerer';

    let contentHtml = '';
    if (pageData.images && pageData.images.length > 0) {
        const imgsHtml = pageData.images
            .map((url) => `<img src="${url}" alt="Ilustración" loading="eager">`)
            .join('');
        contentHtml += `<div class="images-container">${imgsHtml}</div>`;
    }

    if (pageData.karaokeLines) {
        if (pageData.audioText) {
            contentHtml += `<p class="audio-hint">${pageData.audioText}</p>`;
        }

        contentHtml += `
            <div class="audio-controls-container">
                <button id="karaoke-play-btn" class="karaoke-btn" aria-label="Reproducir">
                    <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </button>
                <span class="audio-instruction">Pulsa para escuchar</span>
            </div>
        `;

        contentHtml += `<div class="karaoke-container">`;
        pageData.karaokeLines.forEach((line) => {
            contentHtml += `<p class="karaoke-line clickable" data-start="${line.start}" data-end="${line.end}">${line.text}</p>`;
        });
        contentHtml += `</div>`;
    } else if (pageData.scenes && pageData.scenes.length > 0) {
        const scenesHtml = pageData.scenes
            .map((scene, index) => `<p class="fade-in-text" style="animation-delay: ${index * 0.2}s">${scene.replace(/\n/g, '</p><p class="fade-in-text">')}</p>`)
            .join('');
        contentHtml += `<div class="scenes-container">${scenesHtml}</div>`;
    }

    contentCenterer.innerHTML = contentHtml;

    if (pageData.choices && (pageData.choices.length > 1 || (pageData.choices.length > 0 && pageData.forceShowChoices))) {
        const choicesDiv = document.createElement('div');
        choicesDiv.className = 'choices';
        pageData.choices.forEach((choice) => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                if (choice.page === 'pecado' || choice.text.toLowerCase().includes('escuchar')) {
                    if (state.currentAudio) {
                        state.currentAudio.currentTime = 0;
                        state.currentAudio.play();
                        updatePlayButtonState(true);
                        const firstLine = document.querySelector('.karaoke-line');
                        if (firstLine) firstLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } else if (goToPage) {
                    goToPage(choice.page);
                }
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
    elements.pageWrapper.appendChild(pageContent);

    const playBtn = document.getElementById('karaoke-play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleKaraokeAudio();
        });
    }

    const lines = document.querySelectorAll('.karaoke-line');
    lines.forEach((line) => {
        line.addEventListener('click', () => {
            const start = parseFloat(line.dataset.start);
            if (state.currentAudio) {
                state.currentAudio.currentTime = start;
                if (state.currentAudio.paused) {
                    state.currentAudio.play();
                    updatePlayButtonState(true);
                }
            }
        });
    });

    if (pageData.bgMusic) {
        playPageSound(null, pageData.bgMusic, true);
    } else if (pageData.sound) {
        playPageSound(null, pageData.sound, true);
    } else if (pageData.audio) {
        playPageSound(null, pageData.audio, false);
        if (pageData.karaokeLines) {
            startKaraokeSync();
        }
    } else {
        stopCurrentAudio();
    }

    handlePageEffects(pageData.effect, { getAppMode });
    preloadNextImages(pageId);
}

export function resetScrollPosition() {
    if (elements?.pageWrapper && elements.pageWrapper.querySelector('.page-content')) {
        elements.pageWrapper.querySelector('.page-content').scrollTop = 0;
    }
    if (elements?.pageWrapper) elements.pageWrapper.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}
