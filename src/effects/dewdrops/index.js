// ===================================================
// DEWDROPS — Gotas de rocío / lágrimas
// Partículas brillantes que se condensan y caen.
// Dos modos: 'shimmer' (rocío flotante) y 'tears' (caen como lágrimas).
// ===================================================

function getContainer() {
    return document.getElementById('app-container') || document.body;
}

function createDrop(overlay, mode) {
    const drop = document.createElement('div');
    drop.className = `dewdrop dewdrop-${mode}`;

    const size = mode === 'tears' ? (3 + Math.random() * 4) : (2 + Math.random() * 3);
    const x = 10 + Math.random() * 80;
    const startY = mode === 'tears' ? (10 + Math.random() * 30) : (15 + Math.random() * 60);
    const duration = mode === 'tears' ? (3 + Math.random() * 4) : (5 + Math.random() * 5);
    const delay = Math.random() * 3;

    // Teardrop shape for 'tears' mode, circle for 'shimmer'
    const borderRadius = mode === 'tears' ? '50% 50% 50% 50% / 60% 60% 40% 40%' : '50%';

    drop.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${startY}%;
        width: ${size}px;
        height: ${size * (mode === 'tears' ? 1.4 : 1)}px;
        background: radial-gradient(ellipse at 30% 30%, 
            rgba(200,220,255,0.95) 0%, 
            rgba(150,190,240,0.6) 40%, 
            rgba(100,150,220,0.3) 70%, 
            transparent 100%);
        border-radius: ${borderRadius};
        box-shadow: 
            0 0 ${size * 2}px rgba(180,210,255,0.3),
            inset -1px -1px 2px rgba(255,255,255,0.5);
        opacity: 0;
        pointer-events: none;
        animation: ${mode === 'tears' ? 'dewdropFall' : 'dewdropShimmer'} ${duration}s ease-in-out ${delay}s infinite;
        --drop-fall-distance: ${mode === 'tears' ? (40 + Math.random() * 40) : (5 + Math.random() * 10)}vh;
        --drop-sway: ${-10 + Math.random() * 20}px;
    `;

    overlay.appendChild(drop);

    // Auto-cleanup after some cycles
    if (mode === 'tears') {
        setTimeout(() => { if (drop.parentNode) drop.remove(); }, (duration + delay) * 2 * 1000);
    }

    return drop;
}

export function startDewdropsEffect(mode = 'shimmer') {
    const container = getContainer();
    const overlay = document.createElement('div');
    overlay.className = 'dewdrops-overlay';
    overlay.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:70;';
    container.appendChild(overlay);

    const maxDrops = mode === 'tears' ? 15 : 10;
    const spawnInterval = mode === 'tears' ? 800 : 2000;
    let destroyed = false;

    // Initial batch
    const initialCount = mode === 'tears' ? 5 : 4;
    for (let i = 0; i < initialCount; i++) {
        createDrop(overlay, mode);
    }

    // Continuous spawn
    const timer = setInterval(() => {
        if (destroyed) return;
        const current = overlay.querySelectorAll('.dewdrop').length;
        if (current < maxDrops) createDrop(overlay, mode);
    }, spawnInterval);

    return () => {
        destroyed = true;
        clearInterval(timer);
        overlay.style.transition = 'opacity 1.5s';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 1800);
    };
}
