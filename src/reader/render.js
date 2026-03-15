import { getAppMode, state } from '../app/state.js';
import { handlePageEffects } from '../effects/index.js';
import { applyHighlightsForPage } from './highlights.js';
import { sanitizeHTML } from '../utils/sanitize.js';
import { renderDiscoveries } from './discoveries.js';
import {
    bindAudioExperience,
    clearAudioExperienceContext,
    createAudioExperienceMarkup,
    getCurrentBookAudioDecision,
    playPageSound,
    preloadAudio,
    preloadPageAudio,
    setCurrentBookAudioDecision,
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
    const currentPage = state.storyIndex?.get(currentPageId) || state.story.find((page) => page.id === currentPageId);
    if (!currentPage || !currentPage.choices) return;

    currentPage.choices.forEach((choice) => {
        const nextPage = state.storyIndex?.get(choice.page) || state.story.find((page) => page.id === choice.page);
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

    const pageData = state.storyIndex?.get(pageId) || state.story.find((page) => page.id === pageId);
    if (!pageData) return;

    // PRIMERO: Iniciar precarga de audio en background (no bloquea)
    preloadPageAudio(pageId);

    const pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    if (pageData.pageClass) {
        pageContent.classList.add(pageData.pageClass);
    }

    const audioExperienceMarkup = createAudioExperienceMarkup(pageData);

    const contentCenterer = document.createElement('div');
    contentCenterer.className = 'content-centerer';

    let contentHtml = '';

    if (pageData.bgVideo) {
        const videoSrc = typeof pageData.bgVideo === 'string' ? pageData.bgVideo : pageData.bgVideo.src;
        const playRate = typeof pageData.bgVideo === 'object' && pageData.bgVideo.speed ? pageData.bgVideo.speed : 0.85;
        const maxOpacity = typeof pageData.bgVideo === 'object' && pageData.bgVideo.opacity !== undefined
            ? pageData.bgVideo.opacity : 0.4;
        const blendMode = typeof pageData.bgVideo === 'object' && pageData.bgVideo.blendMode
            ? pageData.bgVideo.blendMode : 'normal';
        const freezeAtEnd = typeof pageData.bgVideo === 'object' && pageData.bgVideo.freezeAtEnd === true;
        const loopAttr = freezeAtEnd ? '' : 'loop';

        // Native HTML5 <video> — blendMode "screen" removes black backgrounds.
        // freezeAtEnd: video plays once and pauses on the last frame.
        contentHtml += `<div class="ambient-bg-wrapper"
            data-rate="${playRate}"
            data-opacity="${maxOpacity}"
            data-freeze="${freezeAtEnd}"
            style="mix-blend-mode: ${blendMode}">
            <video class="ambient-bg-video single-loop" src="${videoSrc}" muted playsinline ${loopAttr} autoplay></video>
        </div>`;
    }

    if (pageData.images && pageData.images.length > 0) {
        const imgsHtml = pageData.images
            .map((url) => `<img src="${url}" alt="Ilustración" loading="eager">`)
            .join('');
        contentHtml += `<div class="images-container">${imgsHtml}</div>`;
    }

    if (pageData.video && pageData.video.length > 0) {
        const loopAttr = pageData.loopVideo === false ? '' : 'loop';
        let videosHtml = '';
        pageData.video.forEach(url => {
            videosHtml += `<chroma-key-video src="${url}" ${loopAttr}></chroma-key-video>`;
        });
        contentHtml += `<div class="videos-container">${videosHtml}</div>`;
    }

    if (pageData.karaokeLines) {
        if (pageData.audioText) {
            contentHtml += `<p class="audio-hint">${sanitizeHTML(pageData.audioText)}</p>`;
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
            contentHtml += `<p class="karaoke-line clickable" data-start="${line.start}" data-end="${line.end}">${sanitizeHTML(line.text)}</p>`;
        });
        contentHtml += `</div>`;
    } else if (pageData.scenes && pageData.scenes.length > 0) {
        const isPoemIntro = pageData.scenes.some(s => s.includes('poem-title-display'));

        if (isPoemIntro) {
            const introHtml = pageData.scenes
                .map((scene) => `<div class="poem-intro-content">${sanitizeHTML(scene)}</div>`)
                .join('');
            contentHtml += `<div class="scenes-container poem-intro-layout">${introHtml}</div>`;
        } else {
            const isPoetry = pageData.scenes.some(s => s.includes('\n')) ||
                pageData.scenes.every(s => s.replace(/<[^>]+>/g, '').length < 80);

            if (isPoetry && !pageData.scenes.some(s => s.includes('<img'))) {
                let verseIndex = 0;
                const stanzasHtml = pageData.scenes.map((scene) => {
                    const lines = scene.split('\n');
                    const linesHtml = lines.map((line) => {
                        const delay = verseIndex * 0.6;
                        verseIndex++;
                        return `<span class="verse-line fade-in-text" style="animation-delay: ${delay}s">${sanitizeHTML(line)}</span>`;
                    }).join('');
                    return `<div class="stanza">${linesHtml}</div>`;
                }).join('');
                contentHtml += `<div class="scenes-container poem-layout">${stanzasHtml}</div>`;
            } else {
                const scenesHtml = pageData.scenes
                    .map((scene, index) => `<p class="fade-in-text" style="animation-delay: ${index * 0.2}s">${sanitizeHTML(scene).replace(/\n/g, '</p><p class="fade-in-text">')}</p>`)
                    .join('');
                contentHtml += `<div class="scenes-container">${scenesHtml}</div>`;
            }
        }
    }

    contentCenterer.innerHTML = contentHtml;

    // Renderizar descubrimientos (orbe interactivo en biografías)
    // Placeholder removed — will inject after choices below

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

            const hasExplicitRestart = pageData.choices.some(
                (c) => c.text && c.text.toLowerCase().includes('desde el inicio')
            );

            pageData.choices.forEach((choice) => {
                if (choice.page === -1 && !hasExplicitRestart) {
                    const restartBtn = document.createElement('button');
                    restartBtn.textContent = "Comenzar desde el inicio";
                    restartBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
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

                const textLower = (choice.text || '').toLowerCase();
                const isListenChoice = textLower.includes('escuchar') || textLower.includes('🎧');
                const isReadChoice = textLower.includes('leer en silencio') || textLower.includes('leer sin');
                const isRestart = textLower.includes('comenzar desde el inicio');

                if (isListenChoice) {
                    btn.classList.add('choice-primary');
                    const cleanText = choice.text.replace('🎧', '').trim();
                    btn.innerHTML = `<svg style="vertical-align: middle; margin-right: 6px; position:relative; top:-2px;" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg> ${cleanText}`;
                } else if (isReadChoice) {
                    btn.classList.add('choice-secondary');
                }

                btn.addEventListener('click', (event) => {
                    event.stopPropagation();

                    if (isListenChoice) {
                        setCurrentBookAudioDecision('enabled', { fromUser: true });
                    } else if (isReadChoice) {
                        setCurrentBookAudioDecision('silent');
                    }

                    if (isRestart || isReadChoice) {
                        if (state.currentAudio) {
                            state.currentAudio.pause();
                            state.currentAudio.currentTime = 0;
                        }
                    }

                    if (choice.page === 'pecado' || isListenChoice) {
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

    // Inject discoveries orb AFTER choices are in the DOM
    if (pageData.discoveries && pageData.discoveries.length > 0) {
        const authorName = pageData.discoverAuthor || '';
        renderDiscoveries(contentCenterer, pageData.discoveries, authorName);
    }

    // =====================================================
    // PAINT FIRST: Attach content to DOM immediately
    // so the browser can render text/images without delay.
    // =====================================================
    pageContent.appendChild(contentCenterer);
    elements.pageWrapper.appendChild(pageContent);

    // — Scrollbar auto-hide y Scroll-to-Reveal (Hide Action Bar on down-scroll) —
    let scrollTimeout = null;
    let lastScrollY = 0;
    
    pageContent.addEventListener('scroll', () => {
        const currentScrollY = pageContent.scrollTop;

        // Ignorar comportamientos elásticos (bounce) en top y bottom (especial iOS)
        if (currentScrollY <= 0 || currentScrollY >= pageContent.scrollHeight - pageContent.clientHeight) {
            return;
        }

        pageContent.classList.add('is-scrolling');
        
        // Debounce mejorado con umbral más alto para pantallas táctiles
        if (Math.abs(currentScrollY - lastScrollY) > 15) {
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scroll down: Hide elements
                document.body.classList.add('is-scrolling-down');
            } else if (currentScrollY < lastScrollY) {
                // Scroll up: Reveal elements
                document.body.classList.remove('is-scrolling-down');
            }
            lastScrollY = currentScrollY;
        }

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            pageContent.classList.remove('is-scrolling');
        }, 1200);
    }, { passive: true });

    // =====================================================
    // DEFER HEAVY WORK: Bind events + start audio/effects
    // after the first paint, so the UI doesn't freeze.
    // =====================================================
    requestAnimationFrame(() => {
        // — Bind karaoke controls (lightweight) —
        const playBtn = document.getElementById('karaoke-play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                toggleKaraokeAudio();
            });
        }

        const karaokeLines = document.querySelectorAll('.karaoke-line');
        karaokeLines.forEach((line) => {
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

        // — Unified audio context binding —
        const pageSoundFile = pageData.bgMusic || pageData.sound || pageData.audio || null;

        if (audioExperienceMarkup && pageSoundFile) {
            bindAudioExperience(pageId, pageData);
        } else {
            clearAudioExperienceContext();
        }

        // — Start audio (deferred so it doesn't block paint) —
        // Unified path: one branch for all audio field types
        if (pageSoundFile) {
            const audioDecision = getCurrentBookAudioDecision();

            if (audioDecision === 'enabled') {
                playPageSound(pageId, pageSoundFile, true);
                if (pageData.karaokeLines?.length) {
                    startKaraokeSync();
                }
            } else if (audioDecision === 'silent') {
                // User explicitly chose silence — stop any running audio
                stopCurrentAudio();
            } else {
                // Decision is null/undefined (prompt state).
                // Do NOT destroy current audio — set up context so the
                // CommandOrb toggle will work immediately when user taps.
                playPageSound(pageId, pageSoundFile, false);
            }
        } else {
            clearAudioExperienceContext();
            stopCurrentAudio();
        }

        // — Initialize ambient video (deferred) —
        initAmbientVideo();

        // — Bind Eterno Retorno contemplative response buttons —
        const eternoResponses = document.querySelectorAll('.eterno-response-btn');
        eternoResponses.forEach((btn) => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                // Remove selected from siblings
                eternoResponses.forEach(b => b.classList.remove('selected'));
                // Mark this one
                btn.classList.add('selected');
            });
        });

        // — Defer even heavier work to NEXT frame —
        // Effects, highlights, and preloading happen after content is visible
        requestAnimationFrame(() => {
            handlePageEffects(pageData.effect, { getAppMode });
            preloadNextImages(pageId);

            // Highlights are the heaviest (TreeWalker + DOM mutation),
            // so we use requestIdleCallback if available, else setTimeout
            if (typeof requestIdleCallback === 'function') {
                requestIdleCallback(() => applyHighlightsForPage(pageId), { timeout: 300 });
            } else {
                setTimeout(() => applyHighlightsForPage(pageId), 50);
            }
        });
    });
}

/**
 * Native engine for ambient background videos.
 * Supports looping (smoke) and freeze-at-end (madreselvas).
 */
function initAmbientVideo() {
    const wrapper = document.querySelector('.ambient-bg-wrapper');
    if (!wrapper) return;

    const playRate = parseFloat(wrapper.dataset.rate) || 0.85;
    const maxOpacity = parseFloat(wrapper.dataset.opacity) || 0.4;
    const shouldFreeze = wrapper.dataset.freeze === 'true';

    const vid = wrapper.querySelector('.single-loop');
    if (!vid) return;

    // Apply properties immediately
    vid.playbackRate = playRate;

    // Soft fade in on load, so it doesn't pop in aggressively
    vid.style.opacity = '0';
    vid.style.transition = 'opacity 2.5s ease-in-out';

    // Once it actually starts playing, fade it up to its max allowed opacity
    vid.addEventListener('playing', () => {
        vid.style.opacity = String(maxOpacity);
    }, { once: true });

    // If freezeAtEnd, pause on the very last frame so the image stays
    if (shouldFreeze) {
        vid.addEventListener('ended', () => {
            // Seek to the last possible moment and pause
            if (vid.duration) {
                vid.currentTime = vid.duration - 0.01;
            }
            vid.pause();
        }, { once: true });
    }
}

export function resetScrollPosition() {
    if (elements?.pageWrapper && elements.pageWrapper.querySelector('.page-content')) {
        elements.pageWrapper.querySelector('.page-content').scrollTop = 0;
    }
    if (elements?.pageWrapper) elements.pageWrapper.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    
    // Reset Mobile Bottom Bar Visibility
    document.body.classList.remove('is-scrolling-down');
}
