import { initBeetle } from './beetle/index.js';

let activeEffectInterval = null;
let activeSmokeInterval = null;
let activeRainInterval = null;
let activeBirdInterval = null;
let activeBeetleTimeout = null;
let activeBeetleCleanup = null;

function clearExistingEffects() {
    // Limpiamos intervalos individualmente
    if (activeEffectInterval) { clearInterval(activeEffectInterval); activeEffectInterval = null; }
    if (activeSmokeInterval) { clearInterval(activeSmokeInterval); activeSmokeInterval = null; }
    if (activeRainInterval) { clearInterval(activeRainInterval); activeRainInterval = null; }
    if (activeBirdInterval) { clearInterval(activeBirdInterval); activeBirdInterval = null; }

    const existingBirds = document.querySelectorAll('.flying-bird');
    existingBirds.forEach(el => el.remove());

    const existingOverlays = document.querySelectorAll('.effect-overlay');
    existingOverlays.forEach(el => el.remove());
    
    const existingParticles = document.querySelectorAll('.smoke-particle, .rain-drop');
    existingParticles.forEach(el => el.remove());
}

function startBirdEffect(getAppMode) {
    const spawnBird = () => {
        if (getAppMode() !== 'reader') return;
        const container = document.getElementById('app-container') || document.body;
        
        const bird = document.createElement('div');
        bird.className = 'flying-bird';
        
        // Posición aleatoria pero controlada
        const randomTop = Math.floor(Math.random() * 60) + 10;
        bird.style.top = `${randomTop}%`;
        
        // Tamaño variable
        const scale = 0.9 + Math.random() * 0.4;
        bird.style.transform = `scale(${scale})`;
        
        container.appendChild(bird);
        
        // Iniciar animación
        requestAnimationFrame(() => bird.classList.add('animate-fly'));
        
        // Limpieza automática del elemento
        setTimeout(() => { if (bird.parentNode) bird.remove(); }, 25000);
    };

    // Lanzar uno inmediatamente
    spawnBird();

    // Programar siguientes pájaros
    activeBirdInterval = setInterval(() => {
        // Probabilidad del 40% cada 15 segundos
        if (Math.random() > 0.6) spawnBird();
    }, 15000);
}

function startSmokeEffect(getAppMode) {
    const overlay = document.createElement('div');
    overlay.className = 'effect-overlay';
    const container = document.body;
    container.appendChild(overlay);

    const spawnSmoke = () => {
        if (getAppMode() !== 'reader') return;
        const smoke = document.createElement('div');
        smoke.className = 'smoke-particle';
        smoke.style.left = (Math.random() * 80 + 10) + '%'; // Centrado un poco más
        overlay.appendChild(smoke);

        setTimeout(() => { if (smoke.parentNode) smoke.remove(); }, 12000);
    };

    // Humo constante y suave
    activeSmokeInterval = setInterval(spawnSmoke, 1500);
    spawnSmoke(); // Uno inicial
}

function startRainEffect(getAppMode) {
    const overlay = document.createElement('div');
    overlay.className = 'effect-overlay';
    const container = document.body;
    container.appendChild(overlay);

    const createDrop = () => {
        if (getAppMode() !== 'reader') return;
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        drop.style.left = Math.random() * 100 + '%';
        
        // Lluvia lenta (3s a 5s)
        const duration = 3 + Math.random() * 2;
        drop.style.animationDuration = duration + 's';
        
        overlay.appendChild(drop);
        
        // Limpiar gota al terminar
        setTimeout(() => { if (drop.parentNode) drop.remove(); }, duration * 1000);
    };

    // Mantener pocas gotas (Lluvia ligera/triste)
    activeRainInterval = setInterval(() => {
        const drops = document.querySelectorAll('.rain-drop');
        if (drops.length < 15) { // Máximo 15 gotas simultáneas
            createDrop();
        }
    }, 300);
}

function getBeetleHideTarget() {
    const rawCandidates = [
        ...document.querySelectorAll('.book-card'),
        ...document.querySelectorAll('.library-hero-card')
    ];

    const candidates = rawCandidates.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    });

    if (candidates.length === 0) return null;

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const rect = target.getBoundingClientRect();

    return {
        x: rect.left + rect.width * (0.2 + Math.random() * 0.6),
        y: rect.top + rect.height * (0.65 + Math.random() * 0.25)
    };
}

export function startLibraryBeetle({ getAppMode }) {
    stopLibraryBeetle();

    const scheduleNext = () => {
        if (getAppMode() !== 'library') return;
        const delay = 12000 + Math.random() * 22000;

        activeBeetleTimeout = setTimeout(() => {
            if (getAppMode() !== 'library') {
                scheduleNext();
                return;
            }

            activeBeetleCleanup = initBeetle({
                getHideTarget: getBeetleHideTarget,
                maxLifetimeMs: 18000 + Math.random() * 20000,
                onCleanup: () => {
                    activeBeetleCleanup = null;
                    if (getAppMode() === 'library') scheduleNext();
                }
            });
        }, delay);
    };

    scheduleNext();
}

export function stopLibraryBeetle() {
    if (activeBeetleTimeout) {
        clearTimeout(activeBeetleTimeout);
        activeBeetleTimeout = null;
    }
    if (activeBeetleCleanup) {
        activeBeetleCleanup();
        activeBeetleCleanup = null;
    }
}

export function handlePageEffects(effectString, { getAppMode }) {
    clearExistingEffects();

    if (!effectString) return;

    // Permitir múltiples efectos separados por coma (ej: "humo, pajaro")
    const effects = effectString.split(',').map(e => e.trim());

    if (effects.includes('bluebird_pass')) {
        startBirdEffect(getAppMode);
    }
    
    if (effects.includes('smoke_overlay')) {
        startSmokeEffect(getAppMode);
    }
    
    if (effects.includes('rain_subtle')) {
        startRainEffect(getAppMode);
    }
}
