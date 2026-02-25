import { getAppMode, state } from '../app/state.js';
import { handlePageEffects } from '../effects/index.js';
import { applyHighlightsForPage } from './highlights.js';
import {
    playPageSound,
    preloadAudio,
    preloadPageAudio,
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
            // Use centralized audio preloading
            const nextSound = nextPage.bgMusic || nextPage.sound || nextPage.audio;
            if (nextSound) preloadAudio(nextSound);
        }
    });
}

export function renderPage(pageId) {
    if (!elements?.pageWrapper) return;

    elements.pageWrapper.querySelectorAll('.page-content').forEach((node) => node.remove());
    if (!state.story) return;

    const pageData = state.story.find((page) => page.id === pageId);
    if (!pageData) return;

    // PRIMERO: Iniciar precarga de audio ANTES de tocar el DOM
    // Esto le da al navegador tiempo para descargar mientras construimos la página
    preloadPageAudio(pageId);

    const pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    if (pageData.pageClass) {
        pageContent.classList.add(pageData.pageClass);
    }

    const contentCenterer = document.createElement('div');
    contentCenterer.className = 'content-centerer';

    let contentHtml = '';
    if (pageData.images && pageData.images.length > 0) {
        const imgsHtml = pageData.images
            .map((url) => `<img src="${url}" alt="Ilustración" loading="eager">`)
            .join('');
        contentHtml += `<div class="images-container">${imgsHtml}</div>`;
    }

    if (pageData.video && pageData.video.length > 0) {
        const videosHtml = pageData.video
            .map((url) => `<chroma-key-video src="${url}" loop></chroma-key-video>`)
            .join('');
        contentHtml += `<div class="videos-container">${videosHtml}</div>`;
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
        // Check if this is a poem intro page (contains custom title markup)
        const isPoemIntro = pageData.scenes.some(s => s.includes('poem-title-display'));

        if (isPoemIntro) {
            // — POEM INTRO MODE — render HTML directly, centered
            const introHtml = pageData.scenes
                .map((scene) => `<div class="poem-intro-content">${scene}</div>`)
                .join('');
            contentHtml += `<div class="scenes-container poem-intro-layout">${introHtml}</div>`;
        } else {
            // Detectar si es contenido poético (tiene \n o scenes cortas)
            const isPoetry = pageData.scenes.some(s => s.includes('\n')) ||
                pageData.scenes.every(s => s.replace(/<[^>]+>/g, '').length < 80);

            if (isPoetry && !pageData.scenes.some(s => s.includes('<img'))) {
                // — MODO POEMA —
                // Cada scene es una estrofa, cada \n es un verso
                let verseIndex = 0;
                const stanzasHtml = pageData.scenes.map((scene) => {
                    const lines = scene.split('\n');
                    const linesHtml = lines.map((line) => {
                        const delay = verseIndex * 0.6;
                        verseIndex++;
                        return `<span class="verse-line fade-in-text" style="animation-delay: ${delay}s">${line}</span>`;
                    }).join('');
                    return `<div class="stanza">${linesHtml}</div>`;
                }).join('');
                contentHtml += `<div class="scenes-container poem-layout">${stanzasHtml}</div>`;
            } else {
                // — MODO PROSA —
                const scenesHtml = pageData.scenes
                    .map((scene, index) => `<p class="fade-in-text" style="animation-delay: ${index * 0.2}s">${scene.replace(/\n/g, '</p><p class="fade-in-text">')}</p>`)
                    .join('');
                contentHtml += `<div class="scenes-container">${scenesHtml}</div>`;
            }
        }
    }

    contentCenterer.innerHTML = contentHtml;

    // Renderizar opciones
    if (pageData.choices && pageData.choices.length > 0) {
        const shouldRenderChoiceButtons =
            pageData.forceShowChoices ||
            pageData.choices.length > 1 ||
            pageData.choices.some((choice) => choice.page === -1);

        if (shouldRenderChoiceButtons) {
            const choicesDiv = document.createElement('div');
            choicesDiv.className = 'choices';

            if (pageData.delayedChoices) {
                choicesDiv.classList.add('choices-delayed');
            }

            // Check if any choice in the data already has "desde el inicio" text
            const hasExplicitRestart = pageData.choices.some(
                (c) => c.text && c.text.toLowerCase().includes('desde el inicio')
            );

            pageData.choices.forEach((choice) => {
                // Auto-inject restart button before "Volver a la biblioteca" 
                // only if no explicit restart choice exists in the data
                if (choice.page === -1 && !hasExplicitRestart) {
                    const restartBtn = document.createElement('button');
                    restartBtn.textContent = "Comenzar desde el inicio";
                    restartBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        // Stop audio completely on restart
                        if (state.currentAudio) {
                            state.currentAudio.pause();
                            state.currentAudio.currentTime = 0;
                        }
                        if (state.story && state.story.length > 0) {
                            goToPage(state.story[0].id);
                        }
                    });
                    choicesDiv.appendChild(restartBtn);
                }

                const btn = document.createElement('button');
                btn.textContent = choice.text;

                // Determine button style based on context
                const textLower = (choice.text || '').toLowerCase();
                const isListenChoice = textLower.includes('escuchar') || textLower.includes('🎧');
                const isReadChoice = textLower.includes('leer en silencio') || textLower.includes('leer sin');
                const isRestart = textLower.includes('comenzar desde el inicio');

                if (isListenChoice) {
                    btn.classList.add('choice-primary');
                } else if (isReadChoice) {
                    btn.classList.add('choice-secondary');
                }

                btn.addEventListener('click', (event) => {
                    event.stopPropagation();

                    // If restarting or reading silently, STOP audio
                    if (isRestart || isReadChoice) {
                        if (state.currentAudio) {
                            state.currentAudio.pause();
                            state.currentAudio.currentTime = 0;
                        }
                    }

                    if (choice.page === 'pecado' || isListenChoice) {
                        // For listening, we want to play
                        if (state.currentAudio) {
                            state.currentAudio.currentTime = 0;
                            state.currentAudio.play();
                            updatePlayButtonState(true);
                            const firstLine = document.querySelector('.karaoke-line');
                            if (firstLine) firstLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        // And navigate
                        if (goToPage) goToPage(choice.page);

                    } else if (goToPage) {
                        goToPage(choice.page);
                    }
                });
                choicesDiv.appendChild(btn);
            });
            contentCenterer.appendChild(choicesDiv);
        }
    }

    pageContent.appendChild(contentCenterer);
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
        playPageSound(pageId, pageData.bgMusic, true);
    } else if (pageData.sound) {
        playPageSound(pageId, pageData.sound, true);
    } else if (pageData.audio) {
        const isKaraoke = pageData.karaokeLines && pageData.karaokeLines.length > 0;
        // El karaoke debe iniciar pausado para que el usuario controle la reproducción
        playPageSound(pageId, pageData.audio, !isKaraoke);

        if (isKaraoke) {
            startKaraokeSync();
        }
    } else {
        stopCurrentAudio();
    }

    handlePageEffects(pageData.effect, { getAppMode });
    preloadNextImages(pageId);
    applyHighlightsForPage(pageId);
}

export function resetScrollPosition() {
    if (elements?.pageWrapper && elements.pageWrapper.querySelector('.page-content')) {
        elements.pageWrapper.querySelector('.page-content').scrollTop = 0;
    }
    if (elements?.pageWrapper) elements.pageWrapper.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}
