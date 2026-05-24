/**
 * ambient-video.js — Native engine for ambient background videos.
 * Supports looping (smoke) and freeze-at-end (madreselvas).
 *
 * Extracted from render.js to isolate video logic.
 */

/**
 * Initializes the ambient background video found in the current page DOM.
 * Reads data attributes from .ambient-bg-wrapper and applies playback settings.
 */
export function initAmbientVideo() {
    const wrapper = document.querySelector('.ambient-bg-wrapper');
    if (!wrapper) return;

    const playRate = parseFloat(wrapper.dataset.rate) || 0.85;
    const maxOpacity = parseFloat(wrapper.dataset.opacity) || 0.4;
    const shouldFreeze = wrapper.dataset.freeze === 'true';

    const vid = wrapper.querySelector('.single-loop');
    if (!vid) return;

    vid.playbackRate = playRate;

    // Soft fade-in so it doesn't pop in aggressively
    vid.style.opacity = '0';
    vid.style.transition = 'opacity 2.5s ease-in-out';

    // Once it actually starts playing, fade it up to its max allowed opacity
    vid.addEventListener('playing', () => {
        vid.style.opacity = String(maxOpacity);
    }, { once: true });

    // If freezeAtEnd, pause on the very last frame so the image stays
    if (shouldFreeze) {
        vid.addEventListener('ended', () => {
            if (vid.duration) {
                vid.currentTime = vid.duration - 0.01;
            }
            vid.pause();
        }, { once: true });
    }
}
