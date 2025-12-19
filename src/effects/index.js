let activeEffectInterval = null;

function clearExistingEffects() {
    if (activeEffectInterval) {
        clearInterval(activeEffectInterval);
        activeEffectInterval = null;
    }

    const existingBirds = document.querySelectorAll('.flying-bird');
    existingBirds.forEach(el => el.remove());

    const existingOverlays = document.querySelectorAll('.effect-overlay');
    existingOverlays.forEach(el => el.remove());
}

function startBirdEffect(getAppMode) {
    const spawnBird = () => {
        if (getAppMode() !== 'reader') return;
        const container = document.body || document.documentElement;
        if (!container) return;
        const bird = document.createElement('div');
        bird.className = 'flying-bird';
        const randomTop = Math.floor(Math.random() * 60) + 10;
        bird.style.top = `${randomTop}%`;
        const scale = 0.8 + Math.random() * 0.5;
        bird.style.transform = `scale(${scale})`;
        container.appendChild(bird);
        requestAnimationFrame(() => bird.classList.add('animate-fly'));
        setTimeout(() => { if (bird.parentNode) bird.parentNode.remove(); }, 8000);
    };
    setTimeout(spawnBird, 1500);
    activeEffectInterval = setInterval(() => {
        if (Math.random() > 0.4) spawnBird();
    }, 12000);
}

function startSmokeEffect(getAppMode) {
    const overlay = document.createElement('div');
    overlay.className = 'effect-overlay';
    const container = document.body || document.documentElement;
    if (!container) return;
    container.appendChild(overlay);

    const spawnSmoke = () => {
        if (getAppMode() !== 'reader') return;
        const smoke = document.createElement('div');
        smoke.className = 'smoke-particle';
        smoke.style.left = Math.random() * 100 + '%';
        smoke.style.animationDuration = (6 + Math.random() * 4) + 's';
        overlay.appendChild(smoke);

        setTimeout(() => { if (smoke.parentNode) smoke.remove(); }, 10000);
    };

    activeEffectInterval = setInterval(spawnSmoke, 800);
}

function startRainEffect(getAppMode) {
    const overlay = document.createElement('div');
    overlay.className = 'effect-overlay';
    const container = document.body || document.documentElement;
    if (!container) return;
    container.appendChild(overlay);

    for (let i = 0; i < 30; i += 1) {
        createDrop(overlay);
    }

    activeEffectInterval = setInterval(() => {
        if (document.querySelectorAll('.rain-drop').length < 50) {
            createDrop(overlay);
        }
    }, 100);
}

function createDrop(container) {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.left = Math.random() * 100 + '%';
    const duration = 1 + Math.random();
    drop.style.animationDuration = duration + 's';
    drop.style.animationDelay = Math.random() * -2 + 's';

    container.appendChild(drop);
}

export function handlePageEffects(effectName, { getAppMode }) {
    clearExistingEffects();

    if (!effectName) return;

    if (effectName === 'bluebird_pass') {
        startBirdEffect(getAppMode);
    } else if (effectName === 'smoke_overlay') {
        startSmokeEffect(getAppMode);
    } else if (effectName === 'rain_subtle') {
        startRainEffect(getAppMode);
    }
}
