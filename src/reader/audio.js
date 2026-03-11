import { state } from '../app/state.js';
import { pauseAllEffectAudio, replayManagedPageEffectSounds, resumeEffectAudio } from '../effects/index.js';

// =====================================
// AUDIO PRECACHING
// =====================================

/** Cache de Audio precargados para eliminar latencia */
const audioCache = new Map();
const MAX_AUDIO_CACHE = 8;
const SAFE_AUDIO_START_CAP = {
    ambient: 0.32,
    voice: 0.45
};
const SAFE_AUDIO_PRIMARY_FADE_MS = 1400;
const SAFE_AUDIO_SECONDARY_FADE_MS = 3600;
const AUDIO_PROMPT_MESSAGE = 'Mejor con auriculares o con el volumen a media altura. El sonido empieza en suave.';
const AUDIO_SILENT_MESSAGE = 'Puedes seguir leyendo en silencio y activar el sonido cuando quieras.';
const AUDIO_LOADING_MESSAGE = 'Preparando el sonido…';
const AUDIO_BUFFERING_MESSAGE = 'Afinando la entrada…';
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

function getAudioCompanionElements() {
    return {};
}

function setAudioStatus(status, message = '') {
    state.audioStatus = status;
    state.audioStatusMessage = message;
    syncAudioExperienceUI();
}

function getPreparedAudioTargetVolume(pageData = state.currentAudioPageData) {
    if (!pageData) return state.currentVolume;
    const pageVolume = pageData.volume ?? 1;
    return Math.min(state.currentVolume * pageVolume, 1);
}

function getSafeStartTarget(pageData, targetVolume) {
    const kind = getAudioKind(pageData);
    const cap = kind === 'voice' ? SAFE_AUDIO_START_CAP.voice : SAFE_AUDIO_START_CAP.ambient;
    return Math.min(targetVolume, cap);
}

function clearFadeInterval(intervalRef) {
    if (intervalRef) clearInterval(intervalRef);
    return null;
}

function rampVolume(audio, from, to, duration, onComplete = null) {
    if (!audio) {
        if (onComplete) onComplete();
        return null;
    }

    if (duration <= 0 || from === to) {
        audio.volume = Math.max(0, Math.min(to, 1));
        if (onComplete) onComplete();
        return null;
    }

    const steps = Math.max(1, Math.round(duration / FADE_INTERVAL_MS));
    const delta = (to - from) / steps;
    let step = 0;
    audio.volume = Math.max(0, Math.min(from, 1));

    const interval = setInterval(() => {
        if (!audio || audio !== state.currentAudio) {
            clearInterval(interval);
            return;
        }

        step += 1;
        const nextVolume = step >= steps ? to : audio.volume + delta;
        audio.volume = Math.max(0, Math.min(nextVolume, 1));

        if (step >= steps) {
            clearInterval(interval);
            if (onComplete) onComplete();
        }
    }, FADE_INTERVAL_MS);

    return interval;
}

/**
 * Precarga un archivo de audio en background.
 * Si ya está en cache, no hace nada.
 * Evicta el más antiguo si el cache está lleno.
 */
export function preloadAudio(soundFile) {
    if (!soundFile || audioCache.has(soundFile)) return;

    // Evictar el más antiguo si estamos al límite
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
 * Llamar esto ANTES de renderizar el DOM para ganar tiempo.
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

/**
 * Creates audio experience markup for the page.
 * Now returns empty — the CommandOrb handles all visual UI.
 */
export function createAudioExperienceMarkup(pageData) {
    const descriptor = getAudioDescriptor(pageData);
    if (!descriptor) return '';
    // Signal that this page has audio (used by render.js to set mode)
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

function isActiveAudioRequest(requestId, audio) {
    return requestId === audioPlaybackRequestId && audio === state.currentAudio;
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

    // --- PAUSE: audio is currently playing ---
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
        // Same file exists, just resume it
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

        // Also resume ghost if it was paused
        if (ghostAudio && ghostAudio.paused) {
            ghostAudio.play().catch(() => {});
        }
        resumeEffectAudio();
    } else {
        // No audio loaded or different file — full fresh start
        playPageSound(pageData.id, soundFile, true);
    }

    resumeEffectAudio();
}

// Listen for CommandOrb audio tap events
document.addEventListener('command-orb-audio-tap', () => toggleCurrentAudio());

export function bindAudioExperience(pageId, pageData) {
    state.currentAudioPageId = pageId;
    state.currentAudioPageData = pageData;

    // Set CommandOrb to audio mode
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

export function syncAudioExperienceUI() {
    const status = state.audioStatus || 'prompt';
    const decision = getBookAudioDecision();

    // Sync via CommandOrb
    if (state.commandOrb) {
        let orbStatus = status;
        if ((status === 'silent' || decision === 'silent') && status !== 'playing') {
            orbStatus = 'silent';
        }
        state.commandOrb.syncAudioState(orbStatus);
    }

    // Sync karaoke instruction text (independent of orb)
    const instructionText = document.querySelector('.audio-instruction');
    if (instructionText) {
        if (status === 'playing') {
            instructionText.textContent = 'Sonando en suave';
            instructionText.classList.add('faded');
        } else if (status === 'preparing') {
            instructionText.textContent = 'Preparando…';
            instructionText.classList.remove('faded');
        } else if (status === 'silent') {
            instructionText.textContent = 'Silenciado';
            instructionText.classList.remove('faded');
        } else {
            instructionText.textContent = 'Pulsa para escuchar';
            instructionText.classList.remove('faded');
        }
    }
}

export function syncCurrentAudioVolume() {
    state.audioVolumeTouched = true;
    const targetVolume = state.currentAudioPageData
        ? getPreparedAudioTargetVolume()
        : Math.min(state.currentVolume * (state.currentAudioBaseVolume || 1), 1);

    if (state.currentAudio) {
        state.currentAudio.volume = targetVolume;
    }

    if (ghostAudio) {
        ghostAudio.volume = Math.min(targetVolume * GHOST_MAX_VOLUME, 1);
    }
}

// =====================================
// GHOST / ECHO AUDIO SYSTEM
// =====================================

/**
 * Sistema de "audio fantasma" — una segunda capa de la misma melodía
 * que comienza a sonar muy bajito antes de que termine el audio principal,
 * para que el lector nunca se sienta en silencio.
 *
 * Flujo emocional:
 *   1. Audio principal arranca con fade-in suave (0 → volumen deseado en ~3s)
 *   2. Cuando quedan ~15s del audio principal, el "fantasma" empieza a
 *      reproducirse desde el inicio a volumen MUY bajo (~15% del principal)
 *   3. El audio principal hace fade-out en sus últimos ~8s
 *   4. El fantasma hace un fade-in lento hasta ~30% y se convierte en
 *      el nuevo audio principal, repitiendo el ciclo
 *
 * Resultado: una melodía que respira, baja, sube, nunca muere.
 */

let ghostAudio = null;
let ghostFadeInterval = null;
let mainFadeInterval = null;
let mainFadeInInterval = null;
let ghostCheckInterval = null;
let comfortFadeInterval = null;

const GHOST_TRIGGER_SECONDS = 18;  // Cuántos segundos antes del final activar el fantasma
const GHOST_MIN_VOLUME = 0.03;     // Volumen mínimo del fantasma (un susurro)
const GHOST_MAX_VOLUME = 0.20;     // Volumen máximo del fantasma (fondo suave)
const MAIN_FADE_IN_DURATION = 3000;  // ms para fade-in del audio principal
const MAIN_FADE_OUT_DURATION = 8000; // ms para fade-out del audio principal
const GHOST_FADE_IN_DURATION = 12000; // ms para fade-in del fantasma (muy lento)
const FADE_INTERVAL_MS = 50;       // Granularidad de los fades

function clearGhostSchedulers() {
    if (ghostFadeInterval) { clearInterval(ghostFadeInterval); ghostFadeInterval = null; }
    if (ghostCheckInterval) { clearInterval(ghostCheckInterval); ghostCheckInterval = null; }
    if (mainFadeInterval) { clearInterval(mainFadeInterval); mainFadeInterval = null; }
    if (mainFadeInInterval) { clearInterval(mainFadeInInterval); mainFadeInInterval = null; }
    if (comfortFadeInterval) { clearInterval(comfortFadeInterval); comfortFadeInterval = null; }
}

function cleanupGhost() {
    clearGhostSchedulers();

    if (ghostAudio) {
        ghostAudio.pause();
        ghostAudio.currentTime = 0;
        ghostAudio = null;
    }
}

/**
 * Inicia el sistema de eco fantasma para un audio dado.
 * Solo se activa si la página tiene la propiedad `ghostEcho: true`
 */
function startGhostSystem(soundFile, baseVolume) {
    cleanupGhost();

    if (!state.currentAudio || !soundFile) return;

    // Monitorear el audio principal para saber cuándo activar el fantasma
    ghostCheckInterval = setInterval(() => {
        if (!state.currentAudio) {
            cleanupGhost();
            return;
        }

        const timeRemaining = state.currentAudio.duration - state.currentAudio.currentTime;

        // Cuando quedan GHOST_TRIGGER_SECONDS segundos, despertar al fantasma
        if (timeRemaining <= GHOST_TRIGGER_SECONDS && timeRemaining > 0 && !ghostAudio) {
            spawnGhost(soundFile, baseVolume);
        }
    }, 500);
}

/**
 * Crea la capa fantasma: un segundo <audio> de la misma melodía
 * que empieza desde el inicio a volumen casi imperceptible.
 */
function spawnGhost(soundFile, baseVolume) {
    ghostAudio = new Audio(`sounds/${soundFile}`);
    ghostAudio.volume = 0;
    ghostAudio.loop = true;
    ghostAudio.play().catch(err => console.warn('Ghost audio blocked:', err));

    // Fade-in del fantasma: de 0 → GHOST_MIN_VOLUME (un susurro)
    const ghostTargetVol = GHOST_MIN_VOLUME * baseVolume * (state.currentVolume || 1);
    const ghostSteps = GHOST_FADE_IN_DURATION / FADE_INTERVAL_MS;
    const ghostVolStep = ghostTargetVol / ghostSteps;
    let ghostCurrentVol = 0;

    ghostFadeInterval = setInterval(() => {
        if (!ghostAudio) { clearInterval(ghostFadeInterval); return; }
        ghostCurrentVol = Math.min(ghostCurrentVol + ghostVolStep, ghostTargetVol);
        ghostAudio.volume = Math.min(ghostCurrentVol, 1);

        if (ghostCurrentVol >= ghostTargetVol) {
            clearInterval(ghostFadeInterval);
            ghostFadeInterval = null;
        }
    }, FADE_INTERVAL_MS);

    // Fade-out del audio principal en sus últimos segundos
    startMainFadeOut(baseVolume);
}

/**
 * Fade-out suave del audio principal.
 * Al terminar, el fantasma sube un poco más para tomar su lugar.
 */
function startMainFadeOut(baseVolume) {
    if (!state.currentAudio) return;

    const currentVol = state.currentAudio.volume;
    const fadeSteps = MAIN_FADE_OUT_DURATION / FADE_INTERVAL_MS;
    const volStep = currentVol / fadeSteps;

    mainFadeInterval = setInterval(() => {
        if (!state.currentAudio) {
            clearInterval(mainFadeInterval);
            mainFadeInterval = null;
            return;
        }

        const newVol = state.currentAudio.volume - volStep;
        state.currentAudio.volume = Math.max(newVol, 0);

        if (state.currentAudio.volume <= 0.01) {
            clearInterval(mainFadeInterval);
            mainFadeInterval = null;

            // El principal terminó su ciclo. El fantasma ahora sube un poquito.
            promoteGhost(baseVolume);
        }
    }, FADE_INTERVAL_MS);
}

/**
 * Promueve al fantasma: sube su volumen suavemente a GHOST_MAX_VOLUME.
 * El fantasma se convierte en el compañero silencioso del lector.
 */
function promoteGhost(baseVolume) {
    if (!ghostAudio) return;

    const targetVol = GHOST_MAX_VOLUME * baseVolume * (state.currentVolume || 1);
    const promoteSteps = 6000 / FADE_INTERVAL_MS;
    const currentGhostVol = ghostAudio.volume;
    const volStep = (targetVol - currentGhostVol) / promoteSteps;
    let vol = currentGhostVol;

    const promoteInterval = setInterval(() => {
        if (!ghostAudio) { clearInterval(promoteInterval); return; }
        vol = Math.min(vol + volStep, targetVol);
        ghostAudio.volume = Math.min(vol, 1);

        if (vol >= targetVol) {
            clearInterval(promoteInterval);
        }
    }, FADE_INTERVAL_MS);

    // Cuando el audio principal termine naturalmente (evento 'ended'),
    // reiniciar todo el ciclo si la página sigue activa
    if (state.currentAudio) {
        state.currentAudio.addEventListener('ended', () => {
            // El fantasma ya está sonando. Ahora, después de un breather,
            // reiniciamos el principal desde 0 y repetimos el ciclo
            setTimeout(() => {
                restartMainFromGhost(baseVolume);
            }, 4000); // 4 segundos de solo fantasma — un respiro melancólico
        }, { once: true });
    }
}

/**
 * Reinicia el audio principal suavemente, bajando el fantasma de vuelta.
 * El ciclo se repite: principal sube → fantasma baja → loop infinito.
 */
function restartMainFromGhost(baseVolume) {
    if (!state.currentAudio || !ghostAudio) return;

    // Reiniciar el principal — respetar startAt si existe
    const currentPage = state.story?.find(p =>
        (p.sound === state.currentAudioFile || p.bgMusic === state.currentAudioFile || p.audio === state.currentAudioFile)
        && p.startAt !== undefined
    );
    state.currentAudio.currentTime = currentPage?.startAt ?? 0;
    state.currentAudio.volume = 0;
    state.currentAudio.play().catch(() => { });

    // Fade-in del principal de nuevo
    const targetVol = baseVolume * (state.currentVolume || 1);
    const fadeSteps = MAIN_FADE_IN_DURATION / FADE_INTERVAL_MS;
    const volStep = targetVol / fadeSteps;
    let vol = 0;

    mainFadeInInterval = setInterval(() => {
        if (!state.currentAudio) { clearInterval(mainFadeInInterval); return; }
        vol = Math.min(vol + volStep, targetVol);
        state.currentAudio.volume = Math.min(vol, 1);

        if (vol >= targetVol) {
            clearInterval(mainFadeInInterval);
            mainFadeInInterval = null;
        }
    }, FADE_INTERVAL_MS);

    // Bajar el fantasma de vuelta a susurro
    const ghostTarget = GHOST_MIN_VOLUME * baseVolume * (state.currentVolume || 1);
    const ghostSteps = 5000 / FADE_INTERVAL_MS;
    const ghostCurrent = ghostAudio.volume;
    const ghostStep = (ghostCurrent - ghostTarget) / ghostSteps;
    let gVol = ghostCurrent;

    const fadeGhostDown = setInterval(() => {
        if (!ghostAudio) { clearInterval(fadeGhostDown); return; }
        gVol = Math.max(gVol - ghostStep, ghostTarget);
        ghostAudio.volume = Math.max(gVol, 0);

        if (gVol <= ghostTarget) {
            clearInterval(fadeGhostDown);
        }
    }, FADE_INTERVAL_MS);

    // Reiniciar el monitoreo para el próximo ciclo
    startGhostSystem(state.currentAudioFile, baseVolume);
}

function applyComfortFadeIn(audio, pageData, targetVolume, { ghostEcho = false, fadeIn = false } = {}) {
    if (!audio) return;

    comfortFadeInterval = clearFadeInterval(comfortFadeInterval);
    mainFadeInInterval = clearFadeInterval(mainFadeInInterval);

    const safeTarget = getSafeStartTarget(pageData, targetVolume);
    const attackDuration = fadeIn || ghostEcho ? MAIN_FADE_IN_DURATION : SAFE_AUDIO_PRIMARY_FADE_MS;

    audio.volume = 0;
    mainFadeInInterval = rampVolume(audio, 0, safeTarget, attackDuration, () => {
        mainFadeInInterval = null;

        if (targetVolume > safeTarget) {
            comfortFadeInterval = rampVolume(audio, safeTarget, targetVolume, SAFE_AUDIO_SECONDARY_FADE_MS, () => {
                comfortFadeInterval = null;
            });
        }
    });
}


// =====================================
// CORE AUDIO CONTROL
// =====================================

export function stopCurrentAudio() {
    cancelPendingAudioStart();

    // Limpiar el sistema fantasma primero
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

    _isProgrammaticPause = true;
    if (state.currentAudio && !state.currentAudio.paused) {
        state.currentAudio.pause();
    }
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

export function updatePlayButtonState(isPlaying) {
    const btn = document.getElementById('karaoke-play-btn');
    if (!btn) return;

    const iconPlay = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>`;
    const iconPause = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>`;

    btn.innerHTML = isPlaying ? iconPause : iconPlay;
    btn.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproducir');

    const instructionText = document.querySelector('.audio-instruction');
    if (instructionText) {
        instructionText.classList.toggle('faded', isPlaying);
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
            // Resume with a simple fade-in, no delay
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
            // Already playing, just update the volume smoothly
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

    // --- Event listeners (same for all audio) ---
    audio.addEventListener('playing', () => {
        if (audio !== state.currentAudio) return;
        updatePlayButtonState(true);
        setAudioStatus('playing', getAudioDescriptor(getActivePageData())?.playingMessage || '');
    });

    audio.addEventListener('pause', () => {
        if (audio !== state.currentAudio || audio.ended) return;
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

    // --- Start playback or just prepare ---
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
        // Audio prepared but not playing — user must tap CommandOrb
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
