// ===================================================
// TWILIGHT EFFECT — Atardecer progresivo para Bécquer
// Overlay de gradiente que transiciona del dorado al azul noche.
// Incluye luciérnagas opcionales para las escenas nocturnas.
// ===================================================

const TWILIGHT_PALETTES = {
    golden: {
        gradient: 'linear-gradient(180deg, rgba(255,200,100,0.08) 0%, rgba(255,160,60,0.12) 50%, rgba(200,120,50,0.06) 100%)',
        filter: 'none'
    },
    sunset: {
        gradient: 'linear-gradient(180deg, rgba(255,140,50,0.12) 0%, rgba(220,80,40,0.1) 40%, rgba(160,60,80,0.08) 100%)',
        filter: 'none'
    },
    dusk_early: {
        gradient: 'linear-gradient(180deg, rgba(140,80,120,0.12) 0%, rgba(80,50,100,0.15) 50%, rgba(40,30,70,0.1) 100%)',
        filter: 'none'
    },
    dusk: {
        gradient: 'linear-gradient(180deg, rgba(80,50,110,0.15) 0%, rgba(50,30,80,0.18) 50%, rgba(30,20,60,0.12) 100%)',
        filter: 'brightness(0.95)'
    },
    dusk_late: {
        gradient: 'linear-gradient(180deg, rgba(50,30,80,0.2) 0%, rgba(30,20,60,0.25) 50%, rgba(15,10,40,0.18) 100%)',
        filter: 'brightness(0.9)'
    },
    night: {
        gradient: 'linear-gradient(180deg, rgba(15,15,45,0.25) 0%, rgba(10,10,35,0.3) 50%, rgba(5,5,25,0.22) 100%)',
        filter: 'brightness(0.85)'
    },
    deep_night: {
        gradient: 'linear-gradient(180deg, rgba(8,8,30,0.35) 0%, rgba(5,5,20,0.4) 50%, rgba(2,2,15,0.3) 100%)',
        filter: 'brightness(0.78)'
    }
};

export function startTwilightEffect(intensity = 'sunset') {
    const palette = TWILIGHT_PALETTES[intensity] || TWILIGHT_PALETTES.sunset;
    const container = document.getElementById('app-container') || document.body;

    const overlay = document.createElement('div');
    overlay.className = `twilight-overlay twilight-${intensity}`;
    overlay.style.cssText = `
        position: absolute; inset: 0; z-index: 1; pointer-events: none;
        background: ${palette.gradient};
        opacity: 0;
        transition: opacity 2s ease;
    `;

    if (palette.filter !== 'none') {
        // Apply filter to the page content, not the overlay
        const pageContent = container.querySelector('.page-content');
        if (pageContent) {
            pageContent.style.transition = 'filter 2s ease';
            pageContent.style.filter = palette.filter;
        }
    }

    container.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    return () => {
        overlay.style.opacity = '0';
        const pageContent = container.querySelector('.page-content');
        if (pageContent) pageContent.style.filter = 'none';
        setTimeout(() => overlay.remove(), 2000);
    };
}

// --- FIREFLIES (Luciérnagas) ---
export function startFirefliesEffect(intensity = 'subtle') {
    const container = document.getElementById('app-container') || document.body;
    const overlay = document.createElement('div');
    overlay.className = 'fireflies-overlay';
    overlay.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:75;';
    container.appendChild(overlay);

    const count = intensity === 'subtle' ? 8 : 15;
    let destroyed = false;

    function spawnFirefly() {
        if (destroyed) return;
        const fly = document.createElement('div');
        fly.className = 'firefly';

        const size = 2 + Math.random() * 3;
        const x = Math.random() * 100;
        const y = 20 + Math.random() * 60;
        const duration = 4 + Math.random() * 6;
        const delay = Math.random() * 3;
        const drift = -20 + Math.random() * 40;

        fly.style.cssText = `
            position: absolute;
            left: ${x}%;
            top: ${y}%;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(255,255,180,0.9) 0%, rgba(255,220,100,0.4) 50%, transparent 70%);
            border-radius: 50%;
            box-shadow: 0 0 ${size * 3}px ${size}px rgba(255,240,150,0.3);
            opacity: 0;
            animation: fireflyGlow ${duration}s ease-in-out ${delay}s infinite;
            --fly-drift: ${drift}px;
            pointer-events: none;
        `;

        overlay.appendChild(fly);
        return fly;
    }

    for (let i = 0; i < count; i++) spawnFirefly();

    // Slowly add more
    const timer = setInterval(() => {
        if (destroyed) return;
        const current = overlay.querySelectorAll('.firefly').length;
        if (current < count * 1.5) spawnFirefly();
    }, 3000);

    return () => {
        destroyed = true;
        clearInterval(timer);
        overlay.style.transition = 'opacity 1.5s';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 1800);
    };
}
