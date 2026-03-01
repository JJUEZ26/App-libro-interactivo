// ===================================================
// GOLONDRINAS — "Volverán las oscuras golondrinas"
// Two modes:
//   1. "passing"  → bird flies across, plays once, fades out
//   2. "landing"  → bird flies down and lands on the last "!" 
//                    character of the last verse-line
// ===================================================

function getContainer() {
    return document.getElementById('app-container') || document.body;
}

/**
 * Find the bounding rect of the last "!" character in the poem.
 * We look for the last .verse-line in the last .stanza,
 * then use Range API to locate the exact "!" glyph.
 */
function findExclamationPosition() {
    const stanzas = document.querySelectorAll('.poem-layout .stanza');
    if (!stanzas.length) return null;

    const lastStanza = stanzas[stanzas.length - 1];
    const verseLines = lastStanza.querySelectorAll('.verse-line');
    if (!verseLines.length) return null;

    const lastLine = verseLines[verseLines.length - 1];
    const textContent = lastLine.textContent;
    const exclamIndex = textContent.lastIndexOf('!');
    if (exclamIndex === -1) return null;

    // Walk through text nodes to find the one containing "!"
    const walker = document.createTreeWalker(lastLine, NodeFilter.SHOW_TEXT);
    let charCount = 0;
    let targetNode = null;
    let offsetInNode = 0;

    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (charCount + node.length > exclamIndex) {
            targetNode = node;
            offsetInNode = exclamIndex - charCount;
            break;
        }
        charCount += node.length;
    }

    if (!targetNode) return null;

    // Create a range around just the "!" character
    const range = document.createRange();
    range.setStart(targetNode, offsetInNode);
    range.setEnd(targetNode, offsetInNode + 1);
    const rect = range.getBoundingClientRect();

    // Convert to coordinates relative to the effects container
    const container = getContainer();
    const containerRect = container.getBoundingClientRect();

    return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top,
        charWidth: rect.width,
        charHeight: rect.height
    };
}


// --- PASSING EFFECT (bird flies across once) ---
function createPassingEffect(overlay) {
    let destroyed = false;

    const video = document.createElement('chroma-key-video');
    video.setAttribute('src', 'videos/golondrina_vuelo.mp4');
    // No 'loop' → plays once

    const topOffset = 5 + Math.random() * 25;

    video.style.cssText = `
        position: absolute;
        top: ${topOffset}%;
        left: 50%;
        transform: translateX(-50%);
        width: 30%;
        max-width: 360px;
        min-width: 150px;
        height: auto;
        opacity: 0;
        transition: opacity 1.5s ease;
    `;
    overlay.appendChild(video);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (!destroyed) video.style.opacity = '1';
        });
    });

    video.addEventListener('videoended', () => {
        if (destroyed) return;
        video.style.opacity = '0';
        setTimeout(() => { if (video.parentNode) video.remove(); }, 1800);
    });

    return () => { destroyed = true; };
}


// --- LANDING EFFECT (bird lands on "!" character) ---
function createLandingEffect(overlay) {
    let destroyed = false;

    // The video is ~8 seconds long:
    //   0-2s: bird flies in from upper-left
    //   2-3s: bird lands at bottom-center
    //   3-8s: bird perches still
    //
    // Verse timing (0.6s stagger, 4 verses):
    //   verse 0: 0.0s, verse 1: 0.6s, verse 2: 1.2s, verse 3: 1.8s
    //   last verse "ésas... ¡no volverán!" appears at ~1.8s, fully visible ~3.0s
    //
    // Strategy: Start the video at ~0.5s (shortly after text begins).
    // The bird will be flying during 0.5-2.5s while text is appearing,
    // and will land around 2.5-3.5s — right when "¡no volverán!" becomes visible.
    const delay = 500;

    setTimeout(() => {
        if (destroyed) return;

        // We need the "!" position. Since the verse hasn't animated yet,
        // the element exists in DOM but may be invisible (opacity:0 via animation).
        // We can still measure its position!
        const pos = findExclamationPosition();
        if (!pos) {
            console.warn('Could not find "!" position for landing swallow');
            return;
        }

        const video = document.createElement('chroma-key-video');
        video.setAttribute('src', 'videos/golondrina_aterrizaje.mp4');
        // No 'loop' → plays once, bird lands and stays on last frame

        // Size: generous to avoid pixelation on the canvas-based chroma-key
        const videoSize = Math.max(160, pos.charHeight * 10);

        video.style.cssText = `
            position: absolute;
            width: ${videoSize}px;
            height: auto;
            left: ${pos.x}px;
            bottom: ${overlay.offsetHeight - pos.y + pos.charHeight * 0.3}px;
            transform: translateX(-50%);
            opacity: 0;
            transition: opacity 0.3s ease-in;
        `;
        overlay.appendChild(video);

        // Fade in quickly so the bird is visible from the start of its flight
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!destroyed) video.style.opacity = '1';
            });
        });

    }, delay);

    return () => { destroyed = true; };
}


// --- PUBLIC API ---
export function startSwallowsEffect(mode = 'passing') {
    const overlay = document.createElement('div');
    overlay.className = 'swallows-effect-overlay';
    overlay.style.cssText = `
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 80;
    `;
    getContainer().appendChild(overlay);

    const cleanups = [];

    if (mode === 'landing' || mode === 'fading') {
        // "fading" pages are the ones with "¡no volverán!" 
        cleanups.push(createLandingEffect(overlay));
    } else {
        cleanups.push(createPassingEffect(overlay));
    }

    // Cleanup
    return () => {
        cleanups.forEach(fn => fn?.());
        overlay.style.transition = 'opacity 1.5s ease-out';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 1800);
    };
}
