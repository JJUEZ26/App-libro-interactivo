import { initBeetle } from './beetle/index.js';
import { startLeavesEffect } from './leaves/index.js';
import { startTimePulseEffect } from './time-pulse/index.js';
import { startSwallowsEffect } from './swallows/index.js';
import { startTwilightEffect, startFirefliesEffect } from './twilight/index.js';
import { startDewdropsEffect } from './dewdrops/index.js';
import { startCracksEffect } from './cracks/index.js';

/**
 * Returns the correct container for visual effects.
 * Uses #app-container so effects render correctly in both
 * normal mode AND fullscreen mode (Fullscreen API only
 * renders the fullscreen element and its descendants).
 */
function getEffectsContainer() {
    return document.getElementById('app-container') || document.body;
}

let activeEffectInterval = null;
let activeSmokeInterval = null;
let activeRainInterval = null;
let activeBirdInterval = null;
let activeBeetleTimeout = null;
let activeBeetleCleanup = null;
let activeLeavesCleanup = null;
let activeTimePulseCleanup = null;
let activeSepiaOverlay = null;
let activeSwallowsCleanup = null;
let activeTwilightCleanup = null;
let activeDewdropsCleanup = null;
let activeFirefliesCleanup = null;
let activeCracksCleanup = null;

function clearExistingEffects(nextEffects = []) {
    if (activeEffectInterval) { clearInterval(activeEffectInterval); activeEffectInterval = null; }
    if (activeSmokeInterval) { clearInterval(activeSmokeInterval); activeSmokeInterval = null; }
    if (activeRainInterval) { clearInterval(activeRainInterval); activeRainInterval = null; }
    if (activeBirdInterval) { clearInterval(activeBirdInterval); activeBirdInterval = null; }

    // Limpiar nuevos efectos
    if (activeLeavesCleanup) { activeLeavesCleanup(); activeLeavesCleanup = null; }
    if (activeTimePulseCleanup) { activeTimePulseCleanup(); activeTimePulseCleanup = null; }
    if (activeSepiaOverlay) { activeSepiaOverlay.remove(); activeSepiaOverlay = null; }
    if (activeSwallowsCleanup) { activeSwallowsCleanup(); activeSwallowsCleanup = null; }
    if (activeTwilightCleanup) { activeTwilightCleanup(); activeTwilightCleanup = null; }
    if (activeDewdropsCleanup) { activeDewdropsCleanup(); activeDewdropsCleanup = null; }
    if (activeFirefliesCleanup) { activeFirefliesCleanup(); activeFirefliesCleanup = null; }

    const keepCracks = nextEffects.some(e => e.startsWith('cracks_'));
    if (!keepCracks && activeCracksCleanup) { activeCracksCleanup(); activeCracksCleanup = null; }

    // Single combined querySelectorAll for all effect elements (merged 3 calls → 1)
    const cracksQuery = keepCracks ? '' : ', #cracks-overlay';
    const allEffectElements = document.querySelectorAll(
        '.flying-bird, .effect-overlay, .leaves-effect-overlay, .time-pulse-overlay, ' +
        '.sepia-overlay, .swallows-effect-overlay, .twilight-overlay, .dewdrops-overlay, ' +
        '.fireflies-overlay, .smoke-particle, .rain-drop, .falling-leaf, ' +
        '.time-pulse-ring, .swallow-bird, .firefly, .dewdrop, ' +
        '.door-light-overlay, .door-choices-cinematic' + cracksQuery
    );
    allEffectElements.forEach(el => el.remove());
}

function startBirdEffect(getAppMode) {
    const spawnBird = () => {
        if (getAppMode() !== 'reader') return;
        const container = document.getElementById('app-container') || document.body;
        const bird = document.createElement('div');
        bird.className = 'flying-bird';
        const randomTop = Math.floor(Math.random() * 60) + 10;
        bird.style.top = `${randomTop}%`;
        const scale = 0.9 + Math.random() * 0.4;
        bird.style.transform = `scale(${scale})`;
        container.appendChild(bird);
        requestAnimationFrame(() => bird.classList.add('animate-fly'));
        setTimeout(() => { if (bird.parentNode) bird.remove(); }, 25000);
    };
    spawnBird();
    activeBirdInterval = setInterval(() => {
        if (Math.random() > 0.6) spawnBird();
    }, 15000);
}

function startSmokeEffect(getAppMode) {
    const overlay = document.createElement('div');
    overlay.className = 'effect-overlay';
    getEffectsContainer().appendChild(overlay);
    const spawnSmoke = () => {
        if (getAppMode() !== 'reader') return;
        const smoke = document.createElement('div');
        smoke.className = 'smoke-particle';
        smoke.style.left = (Math.random() * 80 + 10) + '%';
        overlay.appendChild(smoke);
        setTimeout(() => { if (smoke.parentNode) smoke.remove(); }, 12000);
    };
    activeSmokeInterval = setInterval(spawnSmoke, 1500);
    spawnSmoke();
}

function startRainEffect(getAppMode) {
    const overlay = document.createElement('div');
    overlay.className = 'effect-overlay';
    getEffectsContainer().appendChild(overlay);
    const createDrop = () => {
        if (getAppMode() !== 'reader') return;
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        drop.style.left = Math.random() * 100 + '%';
        const duration = 3 + Math.random() * 2;
        drop.style.animationDuration = duration + 's';
        overlay.appendChild(drop);
        setTimeout(() => { if (drop.parentNode) drop.remove(); }, duration * 1000);
    };
    activeRainInterval = setInterval(() => {
        const drops = document.querySelectorAll('.rain-drop');
        if (drops.length < 15) createDrop();
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

        // Tiempo natural: Entre 5 y 15 segundos
        const delay = 5000 + Math.random() * 10000;

        activeBeetleTimeout = setTimeout(() => {
            if (getAppMode() !== 'library') return;

            activeBeetleCleanup = initBeetle({
                getHideTarget: getBeetleHideTarget,
                maxLifetimeMs: 20000 + Math.random() * 10000,
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
    const el = document.getElementById('beetle-container');
    if (el) el.remove();
}

export function handlePageEffects(effectString, { getAppMode }) {
    const effects = effectString ? effectString.split(',').map(e => e.trim()) : [];
    clearExistingEffects(effects);
    if (!effectString) return;

    // Efectos existentes
    if (effects.includes('bluebird_pass')) startBirdEffect(getAppMode);
    if (effects.includes('smoke_overlay')) startSmokeEffect(getAppMode);
    if (effects.includes('rain_subtle')) startRainEffect(getAppMode);

    // Nuevos efectos: Hojas cayendo con intensidades
    if (effects.includes('falling_leaves_minimal')) {
        activeLeavesCleanup = startLeavesEffect('minimal');
    } else if (effects.includes('falling_leaves_low')) {
        activeLeavesCleanup = startLeavesEffect('low');
    } else if (effects.includes('falling_leaves_medium')) {
        activeLeavesCleanup = startLeavesEffect('medium');
    } else if (effects.includes('falling_leaves_high')) {
        activeLeavesCleanup = startLeavesEffect('high');
    } else if (effects.includes('falling_leaves_intense')) {
        activeLeavesCleanup = startLeavesEffect('intense');
    }

    // Pulso del tiempo con intensidades
    if (effects.includes('time_pulse_subtle')) {
        activeTimePulseCleanup = startTimePulseEffect('subtle');
    } else if (effects.includes('time_pulse_medium')) {
        activeTimePulseCleanup = startTimePulseEffect('medium');
    } else if (effects.includes('time_pulse_strong')) {
        activeTimePulseCleanup = startTimePulseEffect('strong');
    }

    // Overlay sepia con intensidades
    if (effects.some(e => e.startsWith('sepia_'))) {
        const sepiaEffect = effects.find(e => e.startsWith('sepia_') && e !== 'sepia_grain');
        const intensity = sepiaEffect ? sepiaEffect.split('_')[1] : null; // light, medium, strong
        const withGrain = effects.includes('sepia_grain');

        if (intensity) {
            activeSepiaOverlay = document.createElement('div');
            activeSepiaOverlay.className = `sepia-overlay sepia-${intensity}`;
            if (withGrain) activeSepiaOverlay.classList.add('with-grain');
            getEffectsContainer().appendChild(activeSepiaOverlay);
        }
    }

    // --- Golondrinas (Bécquer) ---
    if (effects.includes('swallows_arriving')) {
        activeSwallowsCleanup = startSwallowsEffect('arriving');
    } else if (effects.includes('swallows_nesting')) {
        activeSwallowsCleanup = startSwallowsEffect('nesting');
    } else if (effects.includes('swallows_passing')) {
        activeSwallowsCleanup = startSwallowsEffect('passing');
    } else if (effects.includes('swallows_fading')) {
        activeSwallowsCleanup = startSwallowsEffect('fading');
    } else if (effects.includes('swallows_single')) {
        activeSwallowsCleanup = startSwallowsEffect('single');
    }

    // --- Atardecer/Noche (Bécquer) ---
    const twilightEffect = effects.find(e => e.startsWith('twilight_'));
    if (twilightEffect) {
        const intensity = twilightEffect.replace('twilight_', '');
        activeTwilightCleanup = startTwilightEffect(intensity);
    }

    // --- Gotas de rocío / Lágrimas ---
    if (effects.includes('dewdrops_shimmer')) {
        activeDewdropsCleanup = startDewdropsEffect('shimmer');
    } else if (effects.includes('dewdrops_tears')) {
        activeDewdropsCleanup = startDewdropsEffect('tears');
    }

    // --- Luciérnagas ---
    if (effects.includes('fireflies_subtle')) {
        activeFirefliesCleanup = startFirefliesEffect('subtle');
    } else if (effects.includes('fireflies_bright')) {
        activeFirefliesCleanup = startFirefliesEffect('bright');
    }

    // --- Grietas SVG ---
    const cracksEffect = effects.find(e => e.startsWith('cracks_'));
    if (cracksEffect) {
        const stage = cracksEffect.replace('cracks_', '');
        // Guardamos el cleanup si no había uno
        const cleanup = startCracksEffect(stage);
        if (!activeCracksCleanup) {
            activeCracksCleanup = cleanup;
        }
    }

    // --- Luz Enceguecedora (La Puerta) — Efecto cinemático ---
    if (effects.includes('door_of_light')) {
        const container = getEffectsContainer();

        // Capa 1: Rendija de luz (la "puerta" abriéndose desde la izquierda)
        const lightSlit = document.createElement('div');
        lightSlit.className = 'door-light-overlay door-light-slit';
        container.appendChild(lightSlit);

        // Capa 2: Halo difuso (el resplandor general que inunda)
        const halo = document.createElement('div');
        halo.className = 'door-light-overlay door-light-halo';
        container.appendChild(halo);

        // Capa 3: Rayos de luz divergentes
        const rays = document.createElement('div');
        rays.className = 'door-light-overlay door-light-rays';
        container.appendChild(rays);

        // Los botones finales aparecen 4 segundos DESPUÉS de que la luz
        // haya completado su animación (~7s animación + 2s delay = 9s total),
        // es decir a los 13 segundos desde que se renderiza la página.
        const LIGHT_TOTAL_DURATION = 13000; // 2s delay + 7s anim + 4s extra
        setTimeout(() => {
            const choices = document.querySelector('.final-door-page .choices');
            if (choices) {
                // Mover al frente del overlay para estar por encima de todo
                container.appendChild(choices);
                choices.style.pointerEvents = 'auto';

                // Posicionar el contenedor de choices directamente (los selectores
                // CSS que usaban .final-door-page ya no aplican al moverlo)
                choices.style.cssText = `
                    position: fixed !important;
                    bottom: 30vh;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 90%;
                    max-width: 500px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    pointer-events: auto;
                `;

                // Forzar la animación de entrada cinemática
                choices.classList.add('door-choices-cinematic');

                // IMPORTANTE: Al mover los botones fuera de .final-door-page,
                // los selectores CSS que dependen de ese ancestro dejan de aplicar.
                // Aplicamos los estilos INLINE para garantizar visibilidad.
                choices.querySelectorAll('button').forEach(btn => {
                    btn.style.cssText = `
                        background: rgba(20, 20, 20, 0.85) !important;
                        border: none !important;
                        color: #fff !important;
                        font-weight: 500;
                        font-size: 0.95rem;
                        letter-spacing: 0.8px;
                        padding: 14px 32px;
                        border-radius: 30px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                        min-width: 260px;
                        cursor: pointer;
                        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                        position: relative;
                        z-index: 10001;
                    `;
                    btn.addEventListener('mouseenter', () => {
                        btn.style.background = 'rgba(0, 0, 0, 0.95)';
                        btn.style.transform = 'translateY(-2px)';
                        btn.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.35)';
                    });
                    btn.addEventListener('mouseleave', () => {
                        btn.style.background = 'rgba(20, 20, 20, 0.85)';
                        btn.style.transform = 'translateY(0)';
                        btn.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
                    });

                    // Limpiar TODO al hacer clic (evita botones fantasma)
                    btn.addEventListener('click', () => {
                        document.querySelectorAll(
                            '.door-light-overlay, .door-choices-cinematic'
                        ).forEach(el => el.remove());
                    });
                });
            }
        }, LIGHT_TOTAL_DURATION);
    }

    // --- Sonido de Puerta (con fade-in para suavizarlo) ---
    if (effects.includes('sfx_door_loud')) {
        const audio = new Audio('sounds/efectosonido_puerta.mp4');
        const targetVol = 0.11;
        audio.volume = 0;
        audio.play().then(() => {
            // Fade-in rápido de 200ms para que no sea un golpe seco
            let vol = 0;
            const fadeIn = setInterval(() => {
                vol = Math.min(vol + 0.015, targetVol);
                audio.volume = vol;
                if (vol >= targetVol) clearInterval(fadeIn);
            }, 20);
        }).catch(e => console.warn('Bloqueado:', e));
    } else if (effects.includes('sfx_door_soft')) {
        const audio = new Audio('sounds/efectosonido_puerta.mp4');
        const targetVol = 0.04;
        audio.volume = 0;
        audio.play().then(() => {
            let vol = 0;
            const fadeIn = setInterval(() => {
                vol = Math.min(vol + 0.006, targetVol);
                audio.volume = vol;
                if (vol >= targetVol) clearInterval(fadeIn);
            }, 25);
        }).catch(e => console.warn('Bloqueado:', e));
    }
}
