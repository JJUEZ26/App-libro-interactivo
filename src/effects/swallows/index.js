// ===================================================
// GOLONDRINAS — "Volverán las oscuras golondrinas"
// Modes:
//   1. "arriving"  → flock of swallows arrive (multiple passing birds)
//   2. "passing"   → bird flies across, plays once, fades out
//   3. "single"    → single distant bird, smaller and slower
//   4. "fading"    → bird flies down and lands on the last "!" 
//                     character of the last verse-line
// ===================================================

function getContainer() {
    return document.getElementById('app-container') || document.body;
}

/**
 * Find the bounding rect of the last occurrence of a character.
 * We look for the last .verse-line in the last .stanza.
 */
function findTargetCharacterPosition(charToFind = '!') {
    const stanzas = document.querySelectorAll('.poem-layout .stanza');
    if (!stanzas.length) return null;

    const lastStanza = stanzas[stanzas.length - 1];
    const verseLines = lastStanza.querySelectorAll('.verse-line');
    if (!verseLines.length) return null;

    const lastLine = verseLines[verseLines.length - 1];
    const textContent = lastLine.textContent;
    const targetIndex = textContent.lastIndexOf(charToFind);
    if (targetIndex === -1) return null;

    // Walk through text nodes to find the one containing "!"
    const walker = document.createTreeWalker(lastLine, NodeFilter.SHOW_TEXT);
    let charCount = 0;
    let targetNode = null;
    let offsetInNode = 0;

    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (charCount + node.length > targetIndex) {
            targetNode = node;
            offsetInNode = targetIndex - charCount;
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
function createPassingEffect(overlay, { scale = 1, delay = 0, topRange = [5, 25] } = {}) {
    let destroyed = false;

    setTimeout(() => {
        if (destroyed) return;

        const video = document.createElement('chroma-key-video');
        video.setAttribute('src', '/videos/golondrina_vuelo.mp4');
        // No 'loop' → plays once

        const topOffset = topRange[0] + Math.random() * (topRange[1] - topRange[0]);
        const baseWidth = 30 * scale;

        video.style.cssText = `
            position: absolute;
            top: ${topOffset}%;
            left: 50%;
            transform: translateX(-50%) scale(${0.8 + Math.random() * 0.4});
            width: ${baseWidth}%;
            max-width: ${360 * scale}px;
            min-width: ${150 * scale}px;
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
    }, delay);

    return () => { destroyed = true; };
}


// --- ARRIVING EFFECT (multiple swallows fly in, staggered) ---
function createArrivingEffect(overlay) {
    const cleanups = [];

    // First bird: prominent, center-ish
    cleanups.push(createPassingEffect(overlay, { scale: 1, delay: 800, topRange: [10, 20] }));
    // Second bird: slightly higher, delayed
    cleanups.push(createPassingEffect(overlay, { scale: 0.75, delay: 2500, topRange: [5, 15] }));
    // Third bird: lower, even more delayed
    cleanups.push(createPassingEffect(overlay, { scale: 0.6, delay: 4500, topRange: [20, 35] }));

    return () => { cleanups.forEach(fn => fn?.()); };
}


// --- SINGLE EFFECT (one small distant bird) ---
function createSingleEffect(overlay) {
    return createPassingEffect(overlay, { scale: 0.5, delay: 1500, topRange: [15, 40] });
}


// --- LANDING EFFECT (bird lands on target character) ---
function createLandingEffect(overlay, { targetChar = '!', delay = 500, scale = 1, yOffset = 0.3 } = {}) {
    let destroyed = false;

    setTimeout(() => {
        if (destroyed) return;

        const pos = findTargetCharacterPosition(targetChar);
        if (!pos) {
            console.warn(`Could not find "${targetChar}" position for landing swallow`);
            // Fallback: just show a passing bird
            createPassingEffect(overlay, { scale: 0.7 * scale, delay: 0, topRange: [15, 30] });
            return;
        }

        const video = document.createElement('chroma-key-video');
        video.setAttribute('src', '/videos/golondrina_aterrizaje.mp4');
        // No 'loop' → plays once, bird lands and stays on last frame

        // Size: generous to avoid pixelation on the canvas-based chroma-key
        const videoSize = Math.max(160, pos.charHeight * 10) * scale;

        video.style.cssText = `
            position: absolute;
            width: ${videoSize}px;
            height: auto;
            left: ${pos.x}px;
            bottom: ${overlay.offsetHeight - pos.y + pos.charHeight * yOffset}px;
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


// --- TINY SWALLOWS (Vaivén) ---
function createTinyEffect(overlay, position) {
    let destroyed = false;
    
    // Position can be 'mid' or 'under'
    // "muchas golondrinas" -> 12 a 15 pájaros
    const numBirds = position === 'mid' ? 12 : 15;
    
    for (let i = 0; i < numBirds; i++) {
        setTimeout(() => {
            if (destroyed) return;
            const bird = document.createElement('div');
            
            // Tamaño muy pequeño (12px a 22px)
            const size = 12 + Math.random() * 10;
            
            // "mid" = pasa por el medio del texto (35% a 50%)
            // "under" = pasa por debajo del texto (70% a 85%)
            const topPos = position === 'mid' 
                ? 35 + Math.random() * 15 
                : 70 + Math.random() * 15;
            
            bird.style.cssText = `
                position: absolute;
                top: ${topPos}%;
                left: -10vw;
                width: ${size}px;
                height: ${size}px;
                background-image: url('/images/bluebird_flying.gif');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                opacity: 0.9;
                pointer-events: none;
                z-index: 100;
                /* Hacemos la silueta gris oscura con un leve borde para que resalte incluso en fondos de noche */
                filter: grayscale(1) brightness(0.4) drop-shadow(0 0 1px rgba(255,255,255,0.3));
            `;
            
            overlay.appendChild(bird);
            
            // Velocidad más lenta y relajada (4s a 7s para cruzar la pantalla)
            const duration = 4000 + Math.random() * 3000;
            const yOffset = Math.random() * 80 - 40; // Oscilación en Y
            const rotation = Math.random() * 20 - 10; // Ángulo de vuelo
            
            const animation = bird.animate([
                { transform: `translateX(0vw) translateY(0px) rotate(${rotation}deg)` },
                { transform: `translateX(120vw) translateY(${yOffset}px) rotate(${rotation}deg)` }
            ], {
                duration: duration,
                easing: 'linear',
                fill: 'forwards'
            });
            
            animation.onfinish = () => {
                if (!destroyed && bird.parentNode) {
                    bird.remove();
                }
            };
            
        }, i * 250 + Math.random() * 200); // Aparecen en forma de bandada con ligero retraso entre ellas
    }
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

    if (mode === 'arriving') {
        cleanups.push(createArrivingEffect(overlay));
    } else if (mode === 'nesting') {
        cleanups.push(createLandingEffect(overlay, { targetChar: '!', scale: 1 }));
    } else if (mode === 'passing') {
        cleanups.push(createPassingEffect(overlay));
    } else if (mode === 'tiny_mid') {
        cleanups.push(createTinyEffect(overlay, 'mid'));
    } else if (mode === 'tiny_under') {
        cleanups.push(createTinyEffect(overlay, 'under'));
    } else if (mode === 'tiny_landing') {
        cleanups.push(createLandingEffect(overlay, { targetChar: '.', delay: 1500, scale: 0.35, yOffset: -0.45 }));
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
