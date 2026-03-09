import { state } from '../app/state.js';

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
    return {
        root: document.getElementById('audio-presence'),
        title: document.getElementById('audio-presence-title'),
        primary: document.getElementById('audio-presence-primary'),
        secondary: document.getElementById('audio-presence-secondary')
    };
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
            const choicePage = state.story.find(p => p.id === choice.page);
            const choiceSound = choicePage?.bgMusic || choicePage?.sound || choicePage?.audio;
            if (choiceSound) preloadAudio(choiceSound);
        });
    }
}

export function createAudioExperienceMarkup(pageData) {
    const descriptor = getAudioDescriptor(pageData);
    if (!descriptor) return '';

    return `
        <aside id="audio-presence" class="audio-pill audio-pill--${descriptor.kind}" aria-live="polite">
            <div class="audio-pill__icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
            </div>
            <div class="audio-pill__content">
                <span id="audio-presence-title" class="audio-pill__title">${descriptor.kind === 'voice' ? 'Voz disponible' : 'Sonido disponible'}</span>
            </div>
            <div class="audio-pill__actions">
                 <button id="audio-presence-primary" type="button" class="audio-pill__btn audio-pill__btn--primary" aria-label="Activar sonido">Escuchar</button>
                 <button id="audio-presence-secondary" type="button" class="audio-pill__btn audio-pill__btn--secondary" aria-label="Cerrar aviso">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                 </button>
            </div>
        </aside>
    `;
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
}

function playPreparedAudio(pageData) {
    if (!pageData) return;

    const shouldRestartKaraoke = Boolean(pageData.karaokeLines?.length);

    if (!state.currentAudio || state.currentAudioFile !== getPageSoundFile(pageData)) {
        playPageSound(pageData.id, getPageSoundFile(pageData), true);
    } else {
        state.currentAudio.volume = 0;
        state.currentAudio.play()
            .then(() => {
                applyComfortFadeIn(state.currentAudio, pageData, getPreparedAudioTargetVolume(pageData), {
                    ghostEcho: pageData.ghostEcho === true,
                    fadeIn: pageData.fadeIn === true
                });
            })
            .catch((err) => {
                console.warn('Reanudación bloqueada:', err);
                setAudioStatus('blocked', 'Toca para iniciar el sonido.');
            });
    }

    if (shouldRestartKaraoke) {
        startKaraokeSync();
    }
}

function handlePrimaryAudioAction(event) {
    event.stopPropagation();

    const pageData = state.currentAudioPageData;
    if (!pageData) return;

    if (getBookAudioDecision() !== 'enabled') {
        setCurrentBookAudioDecision('enabled', { fromUser: true });
    }

    if (!state.currentAudio || state.currentAudio.paused) {
        playPreparedAudio(pageData);
        return;
    }

    if (pageData.ghostEcho === true) {
        stopCurrentAudio();
    } else {
        state.currentAudio.pause();
    }
    updatePlayButtonState(false);
    setAudioStatus('paused', getAudioDescriptor(pageData)?.pausedMessage || '');
}

function handleSecondaryAudioAction(event) {
    event.stopPropagation();
    setCurrentBookAudioDecision('silent');
    stopCurrentAudio();
}

export function bindAudioExperience(pageId, pageData) {
    state.currentAudioPageId = pageId;
    state.currentAudioPageData = pageData;

    const { primary, secondary } = getAudioCompanionElements();
    if (primary) {
        primary.addEventListener('click', handlePrimaryAudioAction);
    }
    if (secondary) {
        secondary.addEventListener('click', handleSecondaryAudioAction);
    }

    const decision = getBookAudioDecision();
    if (decision === 'enabled') {
        setAudioStatus(state.currentAudio && !state.currentAudio.paused ? 'playing' : 'preparing');
    } else if (decision === 'silent') {
        setAudioStatus('silent', AUDIO_SILENT_MESSAGE);
    } else {
        setAudioStatus('prompt', getAudioDescriptor(pageData)?.promptMessage || AUDIO_PROMPT_MESSAGE);
    }
}

export function syncAudioExperienceUI() {
    const descriptor = getAudioDescriptor();
    const els = getAudioCompanionElements();
    if (!descriptor || !els.root) return;

    const status = state.audioStatus || 'prompt';
    const decision = getBookAudioDecision();

    els.root.className = `audio-pill audio-pill--${descriptor.kind}`;
    els.root.classList.toggle('is-playing', status === 'playing');
    els.root.classList.toggle('is-paused', status === 'paused');
    els.root.classList.toggle('is-loading', status === 'preparing');
    els.root.classList.toggle('is-silent', status === 'silent');

    if (els.title) {
        if (status === 'playing') {
            els.title.textContent = descriptor.kind === 'voice' ? 'Voz sonando' : 'Sonido activo';
        } else if (status === 'paused') {
            els.title.textContent = 'En pausa';
        } else if (status === 'silent') {
            els.title.textContent = 'Silencio';
        } else if (status === 'preparing') {
            els.title.textContent = 'Cargando...';
        } else {
            els.title.textContent = descriptor.kind === 'voice' ? 'Voz disponible' : 'Sonido disponible';
        }
    }

    if (els.primary) {
        els.primary.disabled = status === 'preparing';
        if (status === 'playing') {
            els.primary.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
            els.primary.setAttribute('aria-label', 'Pausar');
        } else if (status === 'paused') {
            els.primary.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
            els.primary.setAttribute('aria-label', 'Reanudar');
        } else {
            els.primary.textContent = 'Escuchar';
            els.primary.removeAttribute('aria-label');
        }
    }

    if (els.secondary) {
        const shouldHideSecondary = status === 'playing' || status === 'paused' || status === 'preparing' || decision === 'silent';
        els.secondary.style.display = shouldHideSecondary ? 'none' : 'flex';
    }

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

function cleanupGhost() {
    if (ghostFadeInterval) { clearInterval(ghostFadeInterval); ghostFadeInterval = null; }
    if (ghostCheckInterval) { clearInterval(ghostCheckInterval); ghostCheckInterval = null; }
    if (mainFadeInterval) { clearInterval(mainFadeInterval); mainFadeInterval = null; }
    if (mainFadeInInterval) { clearInterval(mainFadeInInterval); mainFadeInInterval = null; }
    if (comfortFadeInterval) { clearInterval(comfortFadeInterval); comfortFadeInterval = null; }

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

export function playPageSound(pageId, soundFileOverride = null, autoPlay = true) {
    let soundFile = soundFileOverride;
    let volumeMultiplier = 1;
    let playbackRate = 1;
    let ghostEcho = false;
    let fadeIn = false;
    let pageData = null;

    if (state.story && pageId) {
        pageData = state.story.find((page) => page.id === pageId);
        if (pageData) {
            if (!soundFile) soundFile = getPageSoundFile(pageData);
            volumeMultiplier = pageData.volume ?? 1;
            playbackRate = pageData.playbackRate ?? 1;
            ghostEcho = pageData.ghostEcho === true;
            fadeIn = pageData.fadeIn === true;
        }
    }

    if (!soundFile) return;

    // Si ya estamos reproduciendo este mismo archivo, ajustar volumen
    // y GARANTIZAR que sigue sonando (fix para el bug de 'a veces no suena')
    if (state.currentAudio && state.currentAudioFile === soundFile) {
        const newVolume = getPreparedAudioTargetVolume(pageData);
        state.currentAudioBaseVolume = volumeMultiplier;
        state.currentAudioPageId = pageId;
        state.currentAudioPageData = pageData;

        // Si el ghost echo maneja el volumen, no pisarle el fade
        if (!ghostEcho || !mainFadeInInterval) {
            state.currentAudio.volume = newVolume;
        }
        state.currentAudio.playbackRate = playbackRate;

        // VERIFICAR que realmente está sonando. Si no, reanimarlo.
        if (autoPlay && (state.currentAudio.paused || state.currentAudio.ended)) {
            // Si terminó (ended), reiniciar desde startAt o desde 0
            if (state.currentAudio.ended) {
                const pg = state.story?.find((p) => p.id === pageId);
                state.currentAudio.currentTime = pg?.startAt ?? 0;
            }
            state.currentAudio.play().catch((err) => console.warn('Reanudación audio:', err));
        }

        // Si la nueva página pide ghostEcho pero no hay ghost activo, iniciarlo
        if (ghostEcho && !ghostAudio && !ghostCheckInterval) {
            startGhostSystem(soundFile, volumeMultiplier);
        }

        return;
    }

    stopCurrentAudio();

    // Intentar usar audio precacheado para arranque instantáneo
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

    // Configurar startAt inmediato si existe
    if (pageData?.startAt !== undefined) {
        audio.currentTime = pageData.startAt;
    }

    const isKaraoke = pageData?.karaokeLines;

    // Si tiene ghostEcho, NO hacemos loop normal del audio principal
    // El sistema fantasma se encarga del loop infinito
    audio.loop = ghostEcho ? false : !isKaraoke;

    const targetVolume = getPreparedAudioTargetVolume(pageData);

    // Si fadeIn está activado, empezar en 0 y subir suavemente
    if (fadeIn || ghostEcho || autoPlay) {
        audio.volume = 0;
    } else {
        audio.volume = targetVolume;
    }

    audio.playbackRate = playbackRate;

    audio.addEventListener('loadstart', () => {
        if (audio === state.currentAudio && autoPlay) {
            setAudioStatus('preparing', pageData?.delay ? 'El sonido entra en un instante.' : AUDIO_LOADING_MESSAGE);
        }
    });

    audio.addEventListener('waiting', () => {
        if (audio === state.currentAudio) {
            setAudioStatus('preparing', AUDIO_BUFFERING_MESSAGE);
        }
    });

    audio.addEventListener('playing', () => {
        if (audio !== state.currentAudio) return;
        updatePlayButtonState(true);
        setAudioStatus('playing', getAudioDescriptor(pageData)?.playingMessage || '');
    });

    audio.addEventListener('pause', () => {
        if (audio !== state.currentAudio || audio.ended) return;
        updatePlayButtonState(false);
        setAudioStatus('paused', getAudioDescriptor(pageData)?.pausedMessage || '');
    });

    audio.addEventListener('error', (e) => {
        console.error('Error cargando audio:', soundFile, e);
        if (audio === state.currentAudio) {
            setAudioStatus('error', 'No se pudo cargar este audio.');
        }
    });

    audio.addEventListener('ended', () => {
        updatePlayButtonState(false);
        if (audio === state.currentAudio && !ghostEcho) {
            setAudioStatus('paused', 'La pieza terminó. Puedes volver a escucharla.');
        }
    });

    if (autoPlay) {
        setAudioStatus('preparing', pageData?.delay ? 'El sonido entra en un instante.' : AUDIO_LOADING_MESSAGE);
        const startPlay = () => {
            // Asegurar startAt antes de reproducir
            if (pageData?.startAt !== undefined) {
                audio.currentTime = pageData.startAt;
            }
            audio.play()
                .then(() => {
                    applyComfortFadeIn(audio, pageData, targetVolume, { ghostEcho, fadeIn });
                    if (ghostEcho) startGhostSystem(soundFile, volumeMultiplier);
                })
                .catch((err) => {
                    console.warn('Reproducción automática bloqueada:', err);
                    updatePlayButtonState(false);
                    setAudioStatus('blocked', 'Toca para iniciar el sonido.');
                });
        };

        if (pageData?.delay) {
            setTimeout(startPlay, pageData.delay);
        } else {
            startPlay();
        }
    } else {
        updatePlayButtonState(false);
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
        state.currentAudio.volume = 0;
        state.currentAudio.play()
            .then(() => {
                applyComfortFadeIn(state.currentAudio, state.currentAudioPageData, getPreparedAudioTargetVolume(), {
                    ghostEcho: state.currentAudioPageData?.ghostEcho === true,
                    fadeIn: state.currentAudioPageData?.fadeIn === true
                });
            })
            .catch((err) => {
                console.warn('Reproducción manual bloqueada:', err);
                setAudioStatus('blocked', 'Toca para iniciar el sonido.');
            });
    } else {
        state.currentAudio.pause();
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
