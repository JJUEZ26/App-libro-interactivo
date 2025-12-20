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
        const container = document.getElementById('app-container') || document.body || document.documentElement;
        if (!container || typeof container.appendChild !== 'function') return;
        const bird = document.createElement('div');
        bird.className = 'flying-bird';
        const randomTop = Math.floor(Math.random() * 50) + 10; // Ajustado para que no salga tan abajo
        bird.style.top = `${randomTop}%`;
        // Variación de tamaño aleatoria, pero base grande
        const scale = 0.9 + Math.random() * 0.4; 
        bird.style.transform = `scale(${scale})`;
        container.appendChild(bird);
        requestAnimationFrame(() => bird.classList.add('animate-fly'));
        
        // Eliminamos el elemento después de que termine la animación larga
        setTimeout(() => { if (bird.parentNode) bird.remove(); }, 20000);
    };
    
    // Iniciar el primer pájaro
    setTimeout(spawnBird, 1000);
    
    // Intervalo para siguientes pájaros (más espaciado porque van lento)
    activeEffectInterval = setInterval(() => {
        if (Math.random() > 0.3) spawnBird();
    }, 20000);
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
        // Duración aleatoria para variedad
        smoke.style.animationDuration = (8 + Math.random() * 5) + 's';
        overlay.appendChild(smoke);

        setTimeout(() => { if (smoke.parentNode) smoke.remove(); }, 14000);
    };

    // Generar humo más frecuentemente para que sea denso
    activeEffectInterval = setInterval(spawnSmoke, 150); 
}

function startRainEffect(getAppMode) {
    const overlay = document.createElement('div');
    overlay.className = 'effect-overlay';
    const container = document.body || document.documentElement;
    if (!container) return;
    container.appendChild(overlay);

    // MENOS GOTAS: Iniciamos solo con 10 (antes 30)
    for (let i = 0; i < 10; i += 1) {
        createDrop(overlay);
    }

    // Mantenemos pocas gotas en pantalla (máximo 15, antes 50)
    activeEffectInterval = setInterval(() => {
        if (document.querySelectorAll('.rain-drop').length < 10) {
            createDrop(overlay);
        }
    }, 200); // Intervalo más lento de creación
}

function createDrop(container) {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.left = Math.random() * 100 + '%';
    
    // Duración lenta base + aleatoriedad
    const duration = 2.5 + Math.random() * 2; 
    drop.style.animationDuration = duration + 's';
    drop.style.animationDelay = Math.random() * -5 + 's';

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
