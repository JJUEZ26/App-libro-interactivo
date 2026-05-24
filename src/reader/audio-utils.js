/**
 * audio-utils.js — Shared low-level audio utilities.
 *
 * Contains pure helper functions and constants used by both
 * audio.js (core) and ghost-echo.js (ghost system).
 * Having them here prevents any circular dependency between the two.
 */

/** Granularity of all volume fades in ms */
export const FADE_INTERVAL_MS = 50;

/**
 * Clears a fade interval reference and returns null.
 * @param {number|null} intervalRef
 * @returns {null}
 */
export function clearFadeInterval(intervalRef) {
    if (intervalRef) clearInterval(intervalRef);
    return null;
}

/**
 * Smoothly ramps the volume of an Audio element from one value to another.
 * Validates that the audio element is still the one tracked in state
 * by accepting a `getActiveAudio` callback instead of importing state directly.
 *
 * @param {HTMLAudioElement} audio
 * @param {number} from - Starting volume (0–1)
 * @param {number} to - Target volume (0–1)
 * @param {number} duration - Total ramp duration in ms
 * @param {Function|null} onComplete - Called when ramp finishes
 * @param {Function} [getActiveAudio] - Returns the currently tracked audio element.
 *                                      Ramp stops if audio no longer matches.
 * @returns {number|null} Interval ID, or null if no ramp was needed.
 */
export function rampVolume(audio, from, to, duration, onComplete = null, getActiveAudio = () => audio) {
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
        if (!audio || audio !== getActiveAudio()) {
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
