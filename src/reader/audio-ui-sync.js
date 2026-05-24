/**
 * audio-ui-sync.js — DOM synchronization for the audio experience UI.
 *
 * Extracted from audio.js to isolate visual feedback logic from core audio control.
 * Reads state but avoids heavy audio operations.
 */

import { state } from '../app/state.js';

const AUDIO_SILENT_MESSAGE = 'Puedes seguir leyendo en silencio y activar el sonido cuando quieras.';

// =============================================
// STATUS MANAGEMENT
// =============================================

/**
 * Updates state.audioStatus and triggers a full UI sync.
 * @param {string} status
 * @param {string} [message]
 */
export function setAudioStatus(status, message = '') {
    state.audioStatus = status;
    state.audioStatusMessage = message;
    syncAudioExperienceUI();
}

// =============================================
// FULL UI SYNC
// =============================================

/**
 * Syncs the CommandOrb and any inline karaoke UI to reflect current audio state.
 * Called after any state change that affects the audio experience.
 */
export function syncAudioExperienceUI() {
    const status = state.audioStatus || 'prompt';
    const decision = state.audioBookDecisions?.[state.currentBook?.id] ?? null;

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

// =============================================
// VOLUME SYNC
// =============================================

/**
 * Syncs the current audio and ghost audio volumes to match state.currentVolume.
 * @param {HTMLAudioElement|null} ghostAudioRef - The ghost audio element if active.
 * @param {number} GHOST_MAX_VOLUME - Max volume multiplier for ghost.
 */
export function syncCurrentAudioVolume(ghostAudioRef, GHOST_MAX_VOLUME) {
    state.audioVolumeTouched = true;

    const baseVolume = state.currentAudioPageData?.volume ?? (state.currentAudioBaseVolume || 1);
    const targetVolume = Math.min(state.currentVolume * baseVolume, 1);

    if (state.currentAudio) {
        state.currentAudio.volume = targetVolume;
    }

    if (ghostAudioRef) {
        ghostAudioRef.volume = Math.min(targetVolume * GHOST_MAX_VOLUME, 1);
    }
}

// =============================================
// PLAY BUTTON STATE
// =============================================

/**
 * Updates the karaoke play/pause button icon and aria-label.
 * @param {boolean} isPlaying
 */
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
