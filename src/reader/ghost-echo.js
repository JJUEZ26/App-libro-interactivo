/**
 * ghost-echo.js — "Audio Fantasma" system for the reading experience.
 *
 * Implements a dual-layer audio loop: the main audio fades out near the end
 * while a "ghost" copy silently starts from the top, then takes over.
 * The result is a continuous, breathing melody that never goes silent.
 *
 * Flujo emocional:
 *   1. Audio principal arranca con fade-in suave (0 → volumen deseado en ~3s)
 *   2. Cuando quedan ~18s del audio principal, el "fantasma" empieza a muy bajo
 *   3. El audio principal hace fade-out en sus últimos ~8s
 *   4. El fantasma sube y se convierte en el nuevo principal, repitiendo el ciclo
 *
 * Extracted from audio.js to isolate the ghost logic.
 */

import { state } from '../app/state.js';
import { FADE_INTERVAL_MS, clearFadeInterval, rampVolume } from './audio-utils.js';

// =============================================
// CONSTANTS
// =============================================

const SAFE_AUDIO_START_CAP = { ambient: 0.32, voice: 0.45 };
const SAFE_AUDIO_PRIMARY_FADE_MS = 1400;
const SAFE_AUDIO_SECONDARY_FADE_MS = 3600;

const GHOST_TRIGGER_SECONDS = 18;
const GHOST_MIN_VOLUME = 0.03;
export const GHOST_MAX_VOLUME = 0.20;
const MAIN_FADE_IN_DURATION = 3000;
const MAIN_FADE_OUT_DURATION = 8000;
const GHOST_FADE_IN_DURATION = 12000;

// =============================================
// GHOST STATE — Module-level (singleton)
// =============================================

let ghostAudio = null;
let ghostFadeInterval = null;
let mainFadeInterval = null;
let mainFadeInInterval = null;
let ghostCheckInterval = null;
let comfortFadeInterval = null;

// =============================================
// EXPORTS — Access ghost audio for volume sync
// =============================================

/** Returns the current ghost Audio element, or null. */
export function getGhostAudio() {
    return ghostAudio;
}

// =============================================
// SCHEDULER CLEANUP
// =============================================

export function clearGhostSchedulers() {
    if (ghostFadeInterval) { clearInterval(ghostFadeInterval); ghostFadeInterval = null; }
    if (ghostCheckInterval) { clearInterval(ghostCheckInterval); ghostCheckInterval = null; }
    if (mainFadeInterval) { clearInterval(mainFadeInterval); mainFadeInterval = null; }
    if (mainFadeInInterval) { clearInterval(mainFadeInInterval); mainFadeInInterval = null; }
    if (comfortFadeInterval) { clearInterval(comfortFadeInterval); comfortFadeInterval = null; }
}

export function cleanupGhost() {
    clearGhostSchedulers();
    if (ghostAudio) {
        ghostAudio.pause();
        ghostAudio.currentTime = 0;
        ghostAudio = null;
    }
}

// =============================================
// GHOST SYSTEM CORE
// =============================================

/**
 * Starts the ghost echo system for a given audio file.
 * Only activates if the page has ghostEcho: true.
 * @param {string} soundFile
 * @param {number} baseVolume
 */
export function startGhostSystem(soundFile, baseVolume) {
    cleanupGhost();
    if (!state.currentAudio || !soundFile) return;

    ghostCheckInterval = setInterval(() => {
        if (!state.currentAudio) { cleanupGhost(); return; }
        const timeRemaining = state.currentAudio.duration - state.currentAudio.currentTime;
        if (timeRemaining <= GHOST_TRIGGER_SECONDS && timeRemaining > 0 && !ghostAudio) {
            spawnGhost(soundFile, baseVolume);
        }
    }, 500);
}

function spawnGhost(soundFile, baseVolume) {
    ghostAudio = new Audio(`sounds/${soundFile}`);
    ghostAudio.volume = 0;
    ghostAudio.loop = true;
    ghostAudio.play().catch(err => console.warn('Ghost audio blocked:', err));

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

    startMainFadeOut(baseVolume);
}

function startMainFadeOut(baseVolume) {
    if (!state.currentAudio) return;
    const currentVol = state.currentAudio.volume;
    const fadeSteps = MAIN_FADE_OUT_DURATION / FADE_INTERVAL_MS;
    const volStep = currentVol / fadeSteps;

    mainFadeInterval = setInterval(() => {
        if (!state.currentAudio) { clearInterval(mainFadeInterval); mainFadeInterval = null; return; }
        const newVol = state.currentAudio.volume - volStep;
        state.currentAudio.volume = Math.max(newVol, 0);
        if (state.currentAudio.volume <= 0.01) {
            clearInterval(mainFadeInterval);
            mainFadeInterval = null;
            promoteGhost(baseVolume);
        }
    }, FADE_INTERVAL_MS);
}

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
        if (vol >= targetVol) clearInterval(promoteInterval);
    }, FADE_INTERVAL_MS);

    if (state.currentAudio) {
        state.currentAudio.addEventListener('ended', () => {
            setTimeout(() => restartMainFromGhost(baseVolume), 4000);
        }, { once: true });
    }
}

function restartMainFromGhost(baseVolume) {
    if (!state.currentAudio || !ghostAudio) return;

    const currentPage = state.story?.find(p =>
        (p.sound === state.currentAudioFile || p.bgMusic === state.currentAudioFile || p.audio === state.currentAudioFile)
        && p.startAt !== undefined
    );
    state.currentAudio.currentTime = currentPage?.startAt ?? 0;
    state.currentAudio.volume = 0;
    state.currentAudio.play().catch(() => { });

    const targetVol = baseVolume * (state.currentVolume || 1);
    const fadeSteps = MAIN_FADE_IN_DURATION / FADE_INTERVAL_MS;
    const volStep = targetVol / fadeSteps;
    let vol = 0;

    mainFadeInInterval = setInterval(() => {
        if (!state.currentAudio) { clearInterval(mainFadeInInterval); return; }
        vol = Math.min(vol + volStep, targetVol);
        state.currentAudio.volume = Math.min(vol, 1);
        if (vol >= targetVol) { clearInterval(mainFadeInInterval); mainFadeInInterval = null; }
    }, FADE_INTERVAL_MS);

    const ghostTarget = GHOST_MIN_VOLUME * baseVolume * (state.currentVolume || 1);
    const ghostSteps = 5000 / FADE_INTERVAL_MS;
    const ghostCurrent = ghostAudio.volume;
    const ghostStep = (ghostCurrent - ghostTarget) / ghostSteps;
    let gVol = ghostCurrent;

    const fadeGhostDown = setInterval(() => {
        if (!ghostAudio) { clearInterval(fadeGhostDown); return; }
        gVol = Math.max(gVol - ghostStep, ghostTarget);
        ghostAudio.volume = Math.max(gVol, 0);
        if (gVol <= ghostTarget) clearInterval(fadeGhostDown);
    }, FADE_INTERVAL_MS);

    startGhostSystem(state.currentAudioFile, baseVolume);
}

// =============================================
// COMFORT FADE-IN — Used by audio-core on play
// =============================================

/**
 * Applies the two-phase comfort fade-in to a new audio element.
 * Phase 1: quick ramp to a safe lower volume (avoids jump scare).
 * Phase 2: slow ramp to the real target volume.
 *
 * @param {HTMLAudioElement} audio
 * @param {Object} pageData
 * @param {number} targetVolume
 * @param {Object} [options]
 */
export function applyComfortFadeIn(audio, pageData, targetVolume, { fadeIn = false } = {}) {
    if (!audio) return;

    comfortFadeInterval = clearFadeInterval(comfortFadeInterval);
    mainFadeInInterval = clearFadeInterval(mainFadeInInterval);

    const kind = pageData?.karaokeLines?.length ? 'voice' : 'ambient';
    const cap = kind === 'voice' ? SAFE_AUDIO_START_CAP.voice : SAFE_AUDIO_START_CAP.ambient;
    const safeTarget = Math.min(targetVolume, cap);
    const attackDuration = fadeIn ? MAIN_FADE_IN_DURATION : SAFE_AUDIO_PRIMARY_FADE_MS;

    audio.volume = 0;
    mainFadeInInterval = rampVolume(audio, 0, safeTarget, attackDuration, () => {
        mainFadeInInterval = null;
        if (targetVolume > safeTarget) {
            comfortFadeInterval = rampVolume(audio, safeTarget, targetVolume, SAFE_AUDIO_SECONDARY_FADE_MS, () => {
                comfortFadeInterval = null;
            }, () => state.currentAudio);
        }
    }, () => state.currentAudio);
}
