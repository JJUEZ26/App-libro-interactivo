import { state } from '../app/state.js';

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
    if (instructionText) {
        if (isPlaying) {
            instructionText.classList.add('faded');
        }
    }
}

export function playPageSound(pageId, soundFileOverride = null, autoPlay = true) {
    let soundFile = soundFileOverride;
    if (!soundFile && state.story && pageId) {
        const pageData = state.story.find((page) => page.id === pageId);
        if (pageData) soundFile = pageData.sound || pageData.audio;
    }

    if (soundFile) {
        if (state.currentAudio && state.currentAudioFile === soundFile) {
            state.currentAudio.volume = state.currentVolume;
            if (autoPlay && state.currentAudio.paused) {
                state.currentAudio.play().catch((err) => console.error('Error audio:', err));
            }
            return;
        }

        stopCurrentAudio();
        state.currentAudio = new Audio(`sounds/${soundFile}`);
        state.currentAudioFile = soundFile;

        const pageData = state.story.find((page) => page.id === pageId);
        const isKaraoke = pageData && pageData.karaokeLines;

        state.currentAudio.loop = !isKaraoke;
        state.currentAudio.volume = state.currentVolume;

        state.currentAudio.addEventListener('ended', () => {
            updatePlayButtonState(false);
        });

        if (autoPlay) {
            state.currentAudio
                .play()
                .then(() => {
                    updatePlayButtonState(true);
                })
                .catch((err) => console.error('Error audio:', err));
        } else {
            updatePlayButtonState(false);
        }
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
