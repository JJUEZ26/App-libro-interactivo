
export function startBlurFade({ onComplete } = {}) {
    const container = document.getElementById('app-container') || document.body;

    // Cleanup existing
    const existing = container.querySelector('.transition-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'transition-overlay transition-blur';
    container.appendChild(overlay);

    // Auto remove after animation
    const timeout = setTimeout(() => {
        if (overlay.parentNode) overlay.remove();
        if (onComplete) onComplete();
    }, 2500);

    return () => {
        clearTimeout(timeout);
        if (overlay.parentNode) overlay.remove();
    };
}

export function startDustParticles(intensity = 'medium') {
    const container = document.getElementById('app-container') || document.body;
    let particleCount = 20;
    let spawnRate = 800;

    if (intensity === 'low') { particleCount = 10; spawnRate = 1200; }
    if (intensity === 'high') { particleCount = 50; spawnRate = 300; }

    const overlay = document.createElement('div');
    overlay.className = 'effect-overlay particles-overlay';
    container.appendChild(overlay);

    function createDust() {
        if (!overlay.parentNode) return;
        const p = document.createElement('div');
        p.className = 'dust-particle';

        // Random usage
        const size = Math.random() * 3 + 1;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        p.style.animationDuration = `${10 + Math.random() * 10}s`;

        overlay.appendChild(p);

        setTimeout(() => { if (p.parentNode) p.remove(); }, 20000);
    }

    // Initial population
    for (let i = 0; i < particleCount; i++) {
        createDust();
    }

    const interval = setInterval(createDust, spawnRate);

    return () => {
        clearInterval(interval);
        if (overlay.parentNode) overlay.remove();
    };
}
