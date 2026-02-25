import { state } from '../app/state.js';

// =====================================
// AUDIO PRECACHING
// =====================================

/** Cache de Audio precargados para eliminan latencia */
const audioCache = new Map();

/**
 * Precarga un archivo de audio en background.
 * Si ya está en cache, no hace nada.
 */
export function preloadAudio(soundFile) {
    if (!soundFile || audioCache.has(soundFile)) return;
    const audio = new Audio(`sounds/${soundFile}`);
    audio.preload = 'auto';
    // Forzar que el navegador empiece a descargar
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

    // Precargar audio de la página actual
    const currentPage = state.story[pageIndex];
    const currentSound = currentPage?.bgMusic || currentPage?.sound || currentPage?.audio;
    if (currentSound) preloadAudio(currentSound);

    // Precargar audio de la SIGUIENTE página
    const nextPage = state.story[pageIndex + 1];
    const nextSound = nextPage?.bgMusic || nextPage?.sound || nextPage?.audio;
    if (nextSound) preloadAudio(nextSound);

    // Precargar audio de choices (si las hay)
    if (currentPage?.choices) {
        currentPage.choices.forEach(choice => {
            const choicePage = state.story.find(p => p.id === choice.page);
            const choiceSound = choicePage?.bgMusic || choicePage?.sound || choicePage?.audio;
            if (choiceSound) preloadAudio(choiceSound);
        });
    }
}

// =====================================
// CORE AUDIO CONTROL
// =====================================

export function stopCurrentAudio() {
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

    if (state.story && pageId) {
        const pageData = state.story.find((page) => page.id === pageId);
        if (pageData) {
            if (!soundFile) soundFile = pageData.sound || pageData.audio;
            volumeMultiplier = pageData.volume ?? 1;
            playbackRate = pageData.playbackRate ?? 1;
        }
    }

    if (!soundFile) return;

    // Si ya estamos reproduciendo este mismo archivo, solo ajustar
    if (state.currentAudio && state.currentAudioFile === soundFile) {
        state.currentAudio.volume = state.currentVolume * volumeMultiplier;
        state.currentAudio.playbackRate = playbackRate;
        if (autoPlay && state.currentAudio.paused) {
            state.currentAudio.play().catch((err) => console.error('Error audio:', err));
        }
        return;
    }

    stopCurrentAudio();

    // Intentar usar audio precacheado para arranque instantáneo
    let audio = audioCache.get(soundFile);
    if (audio) {
        // Reusar el audio precargado (ya tiene datos buffered)
        audioCache.delete(soundFile);
        audio.currentTime = 0;
    } else {
        // Fallback: crear nuevo (sin precache)
        audio = new Audio(`sounds/${soundFile}`);
        audio.preload = 'auto';
    }

    state.currentAudio = audio;
    state.currentAudioFile = soundFile;

    const pageData = state.story?.find((page) => page.id === pageId);
    const isKaraoke = pageData?.karaokeLines;

    audio.loop = !isKaraoke;
    audio.volume = state.currentVolume * volumeMultiplier;
    audio.playbackRate = playbackRate;

    audio.addEventListener('error', (e) => {
        console.error('Error cargando audio:', soundFile, e);
    });

    audio.addEventListener('ended', () => {
        updatePlayButtonState(false);
    });

    if (autoPlay) {
        audio
            .play()
            .then(() => {
                updatePlayButtonState(true);
            })
            .catch((err) => {
                console.warn('Reproducción automática bloqueada:', err);
                updatePlayButtonState(false);
            });
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
