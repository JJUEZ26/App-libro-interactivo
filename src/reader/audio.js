import { state } from '../app/state.js';

// =====================================
// AUDIO PRECACHING
// =====================================

/** Cache de Audio precargados para eliminar latencia */
const audioCache = new Map();
const MAX_AUDIO_CACHE = 8;

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
}

export function updatePlayButtonState(isPlaying) {
    const btn = document.getElementById('karaoke-play-btn');
    if (!btn) return;

    const iconPlay = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>`;
    const iconPause = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>`;

    btn.innerHTML = isPlaying ? iconPause : iconPlay;
    btn.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproducir');

    const instructionText = document.querySelector('.audio-instruction');
    if (instructionText && isPlaying) {
        instructionText.classList.add('faded');
    }
}

export function playPageSound(pageId, soundFileOverride = null, autoPlay = true) {
    let soundFile = soundFileOverride;
    let volumeMultiplier = 1;
    let playbackRate = 1;
    let ghostEcho = false;
    let fadeIn = false;

    if (state.story && pageId) {
        const pageData = state.story.find((page) => page.id === pageId);
        if (pageData) {
            if (!soundFile) soundFile = pageData.sound || pageData.audio;
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
        const newVolume = state.currentVolume * volumeMultiplier;

        // Si el ghost echo maneja el volumen, no pisarle el fade
        if (!ghostEcho || !mainFadeInInterval) {
            state.currentAudio.volume = newVolume;
        }
        state.currentAudio.playbackRate = playbackRate;

        // VERIFICAR que realmente está sonando. Si no, reanimarlo.
        if (state.currentAudio.paused || state.currentAudio.ended) {
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

    const pageData = state.story?.find((page) => page.id === pageId);

    // Configurar startAt inmediato si existe
    if (pageData?.startAt !== undefined) {
        audio.currentTime = pageData.startAt;
    }

    const isKaraoke = pageData?.karaokeLines;

    // Si tiene ghostEcho, NO hacemos loop normal del audio principal
    // El sistema fantasma se encarga del loop infinito
    audio.loop = ghostEcho ? false : !isKaraoke;

    const targetVolume = state.currentVolume * volumeMultiplier;

    // Si fadeIn está activado, empezar en 0 y subir suavemente
    if (fadeIn || ghostEcho) {
        audio.volume = 0;
    } else {
        audio.volume = targetVolume;
    }

    audio.playbackRate = playbackRate;

    audio.addEventListener('error', (e) => {
        console.error('Error cargando audio:', soundFile, e);
    });

    audio.addEventListener('ended', () => {
        updatePlayButtonState(false);
    });

    if (autoPlay) {
        const startPlay = () => {
            // Asegurar startAt antes de reproducir
            if (pageData?.startAt !== undefined) {
                audio.currentTime = pageData.startAt;
            }
            audio.play()
                .then(() => {
                    updatePlayButtonState(true);
                    if (fadeIn || ghostEcho) {
                        let vol = 0;
                        const fadeSteps = MAIN_FADE_IN_DURATION / FADE_INTERVAL_MS;
                        const volStep = targetVolume / fadeSteps;
                        mainFadeInInterval = setInterval(() => {
                            if (!state.currentAudio) { clearInterval(mainFadeInInterval); mainFadeInInterval = null; return; }
                            vol = Math.min(vol + volStep, targetVolume);
                            state.currentAudio.volume = Math.min(vol, 1);
                            if (vol >= targetVolume) { clearInterval(mainFadeInInterval); mainFadeInInterval = null; }
                        }, FADE_INTERVAL_MS);
                    }
                    if (ghostEcho) startGhostSystem(soundFile, volumeMultiplier);
                })
                .catch((err) => {
                    console.warn('Reproducción automática bloqueada:', err);
                    updatePlayButtonState(false);
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
    if (!state.currentAudio) return;

    if (state.currentAudio.paused) {
        state.currentAudio.play();
        updatePlayButtonState(true);
    } else {
        state.currentAudio.pause();
        updatePlayButtonState(false);
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
