import { state } from '../app/state.js';
import { pauseAllEffectAudio, replayManagedPageEffectSounds, resumeEffectAudio } from '../effects/index.js';
import { requestWakeLock, releaseWakeLock } from '../utils/wakeLock.js';
import { applyComfortFadeIn, cleanupGhost, clearGhostSchedulers, startGhostSystem, getGhostAudio, GHOST_MAX_VOLUME } from './ghost-echo.js';
import { setAudioStatus, syncAudioExperienceUI, syncCurrentAudioVolume, updatePlayButtonState } from './audio-ui-sync.js';

// Re-export for consumers that import directly from audio.js
export { updatePlayButtonState } from './audio-ui-sync.js';


// =====================================
// AUDIO PRECACHING
// =====================================

/** Cache de Audio precargados para eliminar latencia */
const audioCache = new Map();
const MAX_AUDIO_CACHE = 8;
const AUDIO_PROMPT_MESSAGE = 'Mejor con auriculares o con el volumen a media altura. El sonido empieza en suave.';
const AUDIO_SILENT_MESSAGE = 'Puedes seguir leyendo en silencio y activar el sonido cuando quieras.';
const AUDIO_LOADING_MESSAGE = 'Preparando el sonido…';
let pendingAudioStartTimeout = null;
let audioPlaybackRequestId = 0;
let _isProgrammaticPause = false;

function getCurrentBookId() {
    return state.currentBook?.id ?? null;
}

function getBookAudioDecision() {
    const bookId = getCurrentBookId();
    if (!bookId) return null;
    return state.audioBookDecisions[bookId] ?? null;
}

export function getCurrentBookAudioDecision() {
    return getBookAudioDecision();
}

function getPageById(pageId) {
    if (!state.story || pageId === null || pageId === undefined) return null;
    return state.storyIndex?.get(pageId) || state.story.find((page) => page.id === pageId) || null;
}

function hasAudioForPage(pageData) {
    return Boolean(pageData?.bgMusic || pageData?.sound || pageData?.audio);
}

function getPageSoundFile(pageData) {
    return pageData?.bgMusic || pageData?.sound || pageData?.audio || null;
}

function getAudioKind(pageData) {
    if (!hasAudioForPage(pageData)) return null;
    return pageData?.karaokeLines?.length ? 'voice' : 'ambient';
}

function getAudioDescriptor(pageData = state.currentAudioPageData) {
    const kind = getAudioKind(pageData);
    if (!kind) return null;

    if (kind === 'voice') {
        return {
            kind,
            eyebrow: 'Voz original',
            title: 'Lectura en voz disponible',
            promptMessage: AUDIO_PROMPT_MESSAGE,
            playingMessage: 'La voz ya está acompañando la lectura.',
            pausedMessage: 'La voz está lista para continuar.'
        };
    }

    return {
        kind,
        eyebrow: 'Experiencia sonora',
        title: 'La lectura incluye sonido',
        promptMessage: AUDIO_PROMPT_MESSAGE,
        playingMessage: 'El ambiente ya acompaña la lectura.',
        pausedMessage: 'El sonido está listo para volver.'
    };
}

function getPreparedAudioTargetVolume(pageData = state.currentAudioPageData) {
    if (!pageData) return state.currentVolume;
    const pageVolume = pageData.volume ?? 1;
    return Math.min(state.currentVolume * pageVolume, 1);
}

/**
 * Creates audio experience markup for the page.
 * Returns empty string or '__HAS_AUDIO__' sentinel.
 */
export function createAudioExperienceMarkup(pageData) {
    const descriptor = getAudioDescriptor(pageData);
    if (!descriptor) return '';
    return '__HAS_AUDIO__';
}

export function setCurrentBookAudioDecision(decision, { fromUser = false } = {}) {
    const bookId = getCurrentBookId();
    if (!bookId) return;

    state.audioBookDecisions[bookId] = decision;
    if (fromUser) {
        state.audioUserActivated = true;
    }

    if (decision === 'silent') {
        setAudioStatus('silent', AUDIO_SILENT_MESSAGE);
    }

    syncAudioExperienceUI();
}

export function clearAudioExperienceContext() {
    state.currentAudioPageId = null;
    state.currentAudioPageData = null;
    state.audioStatus = 'idle';
    state.audioStatusMessage = '';
    if (state.commandOrb) state.commandOrb.setMode('ia');
}

function cancelPendingAudioStart() {
    if (pendingAudioStartTimeout) {
        clearTimeout(pendingAudioStartTimeout);
        pendingAudioStartTimeout = null;
    }
    audioPlaybackRequestId += 1;
    return audioPlaybackRequestId;
}

function scheduleManagedAudioStart(startFn, delayMs = 0) {
    const requestId = cancelPendingAudioStart();

    if (delayMs > 0) {
        pendingAudioStartTimeout = setTimeout(() => {
            pendingAudioStartTimeout = null;
            if (requestId !== audioPlaybackRequestId) return;
            startFn(requestId);
        }, delayMs);
    } else {
        startFn(requestId);
    }

    return requestId;
}

function resumeManagedAudio(pageData) {
    if (!state.currentAudio || !pageData) return;

    const audio = state.currentAudio;
    const targetVolume = getPreparedAudioTargetVolume(pageData);

    audio.playbackRate = pageData.playbackRate ?? 1;
    audio.volume = 0;

    audio.play()
        .then(() => {
            if (audio !== state.currentAudio) return;
            applyComfortFadeIn(audio, pageData, targetVolume);
            updatePlayButtonState(true);
            setAudioStatus('playing', getAudioDescriptor(pageData)?.playingMessage || '');
        })
        .catch((err) => {
            console.warn('Reanudacion bloqueada:', err);
            setAudioStatus('blocked', 'Toca para iniciar el sonido.');
        });
}

function playPreparedAudio(pageData) {
    if (!pageData) return;

    const soundFile = getPageSoundFile(pageData);
    if (!soundFile) return;

    if (!state.currentAudio || state.currentAudioFile !== soundFile) {
        playPageSound(pageData.id, soundFile, true);
    } else {
        state.currentAudioPageId = pageData.id;
        state.currentAudioPageData = pageData;
        resumeManagedAudio(pageData);
    }

    if (pageData.karaokeLines?.length) {
        startKaraokeSync();
    }
}

/**
 * Toggles current audio playback.
 * Called by CommandOrb via custom event.
 */
export function toggleCurrentAudio() {
    const pageData = state.currentAudioPageData;
    if (!pageData) return;

    const soundFile = getPageSoundFile(pageData);
    if (!soundFile) return;

    const ghostAudio = getGhostAudio();

    // --- PAUSE ---
    if (state.currentAudio && !state.currentAudio.paused) {
        _isProgrammaticPause = true;
        state.currentAudio.pause();
        if (ghostAudio && !ghostAudio.paused) ghostAudio.pause();
        _isProgrammaticPause = false;

        pauseAllEffectAudio();
        updatePlayButtonState(false);
        setAudioStatus('paused', getAudioDescriptor(pageData)?.pausedMessage || '');
        return;
    }

    // --- PLAY/RESUME ---
    setCurrentBookAudioDecision('enabled', { fromUser: true });
    replayManagedPageEffectSounds(pageData.effect);

    if (state.currentAudio && state.currentAudioFile === soundFile) {
        const targetVolume = getPreparedAudioTargetVolume(pageData);
        state.currentAudio.volume = 0;
        state.currentAudio.play()
            .then(() => {
                if (state.currentAudio?.src && !state.currentAudio.paused) {
                    applyComfortFadeIn(state.currentAudio, pageData, targetVolume);
                    updatePlayButtonState(true);
                    setAudioStatus('playing', getAudioDescriptor(pageData)?.playingMessage || '');
                }
            })
            .catch(() => {
                setAudioStatus('blocked', 'Toca para iniciar el sonido.');
            });

        if (ghostAudio && ghostAudio.paused) {
            ghostAudio.play().catch(() => {});
        }
        resumeEffectAudio();
    } else {
        playPageSound(pageData.id, soundFile, true);
    }

    resumeEffectAudio();
}

// Listen for CommandOrb audio tap events
document.addEventListener('command-orb-audio-tap', () => toggleCurrentAudio());

export function bindAudioExperience(pageId, pageData) {
    state.currentAudioPageId = pageId;
    state.currentAudioPageData = pageData;

    if (state.commandOrb) state.commandOrb.setMode('audio');

    const decision = getBookAudioDecision();
    if (decision === 'enabled') {
        setAudioStatus(state.currentAudio && !state.currentAudio.paused ? 'playing' : 'preparing');
    } else if (decision === 'silent') {
        setAudioStatus('silent', AUDIO_SILENT_MESSAGE);
    } else {
        setAudioStatus('prompt');
    }
}

// Re-export syncAudioExperienceUI for external callers
export { syncAudioExperienceUI };

export function syncCurrentAudioVolumePublic() {
    syncCurrentAudioVolume(getGhostAudio(), GHOST_MAX_VOLUME);
}

// Keep the old export name for backward compatibility
export { syncCurrentAudioVolumePublic as syncCurrentAudioVolume };

// =====================================
// AUDIO PRECACHING
// =====================================

/**
 * Precarga un archivo de audio en background.
 */
export function preloadAudio(soundFile) {
    if (!soundFile || audioCache.has(soundFile)) return;

    if (audioCache.size >= MAX_AUDIO_CACHE) {
        const oldest = audioCache.keys().next().value;
        audioCache.delete(oldest);
    }

    const audio = new Audio(`sounds/${soundFile}`);
    audio.preload = 'auto';
    audio.load();
    audioCache.set(soundFile, audio);
}

/**
 * Precarga el audio de la página actual Y la siguiente.
 */
export function preloadPageAudio(pageId) {
    if (!state.story) return;

    const pageIndex = state.story.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;

    const currentPage = state.story[pageIndex];
    const currentSound = currentPage?.bgMusic || currentPage?.sound || currentPage?.audio;
    if (currentSound) preloadAudio(currentSound);

    const nextPage = state.story[pageIndex + 1];
    const nextSound = nextPage?.bgMusic || nextPage?.sound || nextPage?.audio;
    if (nextSound) preloadAudio(nextSound);

    if (currentPage?.choices) {
        currentPage.choices.forEach(choice => {
            const choicePage = getPageById(choice.page);
            const choiceSound = choicePage?.bgMusic || choicePage?.sound || choicePage?.audio;
            if (choiceSound) preloadAudio(choiceSound);
        });
    }
}

// =====================================
// CORE AUDIO CONTROL
// =====================================

export function stopCurrentAudio() {
    cancelPendingAudioStart();
    releaseWakeLock();

    cleanupGhost();

    if (state.karaokeInterval) {
        clearInterval(state.karaokeInterval);
        state.karaokeInterval = null;
    }

    if (state.currentAudio) {
        state.currentAudio.pause();
        state.currentAudio.currentTime = 0;
        state.currentAudio = null;
    }
    state.currentAudioFile = null;
    state.currentAudioBaseVolume = 1;
}

export function pauseAllAudioForBackground() {
    cancelPendingAudioStart();
    clearGhostSchedulers();
    releaseWakeLock();

    _isProgrammaticPause = true;
    if (state.currentAudio && !state.currentAudio.paused) {
        state.currentAudio.pause();
    }
    const ghostAudio = getGhostAudio();
    if (ghostAudio && !ghostAudio.paused) {
        ghostAudio.pause();
    }
    _isProgrammaticPause = false;
}

export function resumeAudioFromBackground() {
    if (state.currentAudio && state.currentAudio.paused && state.appMode === 'reader') {
        resumeManagedAudio(state.currentAudioPageData);
        syncAudioExperienceUI();
    }
}

export function playPageSound(pageId, soundFileOverride = null, autoPlay = true, options = {}) {
    let soundFile = soundFileOverride;
    let volumeMultiplier = 1;
    let playbackRate = 1;
    let pageData = null;

    pageData = getPageById(pageId);
    if (pageData) {
        if (!soundFile) soundFile = getPageSoundFile(pageData);
        volumeMultiplier = pageData.volume ?? 1;
        playbackRate = pageData.playbackRate ?? 1;
    }

    if (!soundFile) return;

    // --- Same file already loaded: just update context ---
    if (state.currentAudio && state.currentAudioFile === soundFile) {
        const existingAudio = state.currentAudio;
        state.currentAudioBaseVolume = volumeMultiplier;
        state.currentAudioPageId = pageId;
        state.currentAudioPageData = pageData;
        existingAudio.playbackRate = playbackRate;

        if (autoPlay && (existingAudio.paused || existingAudio.ended)) {
            const targetVolume = getPreparedAudioTargetVolume(pageData);
            existingAudio.volume = 0;
            existingAudio.play()
                .then(() => {
                    if (state.currentAudio !== existingAudio) return;
                    applyComfortFadeIn(existingAudio, pageData, targetVolume);
                    updatePlayButtonState(true);
                    setAudioStatus('playing', getAudioDescriptor(pageData)?.playingMessage || '');
                })
                .catch(() => {
                    setAudioStatus('blocked', 'Toca para iniciar el sonido.');
                });
        } else if (!autoPlay && !existingAudio.paused) {
            existingAudio.volume = getPreparedAudioTargetVolume(pageData);
        }

        return;
    }

    // --- Different file or no audio: create new ---
    stopCurrentAudio();

    let audio = audioCache.get(soundFile);
    if (audio) {
        audioCache.delete(soundFile);
        audio.currentTime = 0;
    } else {
        audio = new Audio(`sounds/${soundFile}`);
        audio.preload = 'auto';
    }

    state.currentAudio = audio;
    state.currentAudioFile = soundFile;
    state.currentAudioBaseVolume = volumeMultiplier;
    state.currentAudioPageId = pageId;
    state.currentAudioPageData = pageData;

    if (pageData?.startAt !== undefined) {
        audio.currentTime = pageData.startAt;
    }

    const isKaraoke = pageData?.karaokeLines;
    audio.loop = !isKaraoke;
    audio.volume = 0;
    audio.playbackRate = playbackRate;

    const getActivePageData = () => state.currentAudioPageData || pageData;

    audio.addEventListener('playing', () => {
        if (audio !== state.currentAudio) return;
        requestWakeLock();
        updatePlayButtonState(true);
        setAudioStatus('playing', getAudioDescriptor(getActivePageData())?.playingMessage || '');
    });

    audio.addEventListener('pause', () => {
        if (audio !== state.currentAudio || audio.ended) return;
        releaseWakeLock();
        if (_isProgrammaticPause) return;
        updatePlayButtonState(false);
        setAudioStatus('paused', getAudioDescriptor(getActivePageData())?.pausedMessage || '');
    });

    audio.addEventListener('error', (e) => {
        console.error('Error cargando audio:', soundFile, e);
        if (audio === state.currentAudio) {
            setAudioStatus('error', 'No se pudo cargar este audio.');
        }
    });

    audio.addEventListener('ended', () => {
        if (audio !== state.currentAudio) return;
        updatePlayButtonState(false);
        setAudioStatus('paused', 'La pieza terminó. Puedes volver a escucharla.');
    });

    if (autoPlay) {
        setAudioStatus('preparing', AUDIO_LOADING_MESSAGE);

        const targetVolume = getPreparedAudioTargetVolume(pageData);
        audio.play()
            .then(() => {
                if (audio !== state.currentAudio) return;
                applyComfortFadeIn(audio, pageData, targetVolume);
                updatePlayButtonState(true);
                setAudioStatus('playing', getAudioDescriptor(pageData)?.playingMessage || '');
            })
            .catch((err) => {
                console.warn('Reproduccion automatica bloqueada:', err);
                updatePlayButtonState(false);
                setAudioStatus('blocked', 'Toca para iniciar el sonido.');
            });
    } else {
        audio.load();
    }
}

export function toggleKaraokeAudio() {
    if (!state.currentAudio && state.currentAudioPageData) {
        setCurrentBookAudioDecision('enabled', { fromUser: true });
        playPreparedAudio(state.currentAudioPageData);
        return;
    }

    if (!state.currentAudio) return;

    if (state.currentAudio.paused) {
        setCurrentBookAudioDecision('enabled', { fromUser: true });
        resumeManagedAudio(state.currentAudioPageData);
        if (state.currentAudioPageData?.karaokeLines?.length) {
            startKaraokeSync();
        }
    } else {
        pauseAllAudioForBackground();
        updatePlayButtonState(false);
        setAudioStatus('paused', getAudioDescriptor(state.currentAudioPageData)?.pausedMessage || '');
    }
}

export function startKaraokeSync() {
    if (state.karaokeInterval) clearInterval(state.karaokeInterval);

    state.karaokeInterval = setInterval(() => {
        if (!state.currentAudio) return;

        const time = state.currentAudio.currentTime;
        const domLines = document.querySelectorAll('.karaoke-line');

        domLines.forEach((line) => {
            const start = parseFloat(line.dataset.start);
            const end = parseFloat(line.dataset.end);

            if (time >= start && time < end) {
                if (!line.classList.contains('active')) {
                    domLines.forEach((other) => other.classList.remove('active'));
                    line.classList.add('active');
                    line.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }, 100);
}
