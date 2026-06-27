// =============================================
// STATIC IMPORTS — Módulos usados en la Library View (siempre cargados)
// =============================================
import { initBeetle } from './beetle/index.js';
import { startLibraryParticles } from './library-atmosphere/particles.js';
import { startCardParallax } from './library-atmosphere/card-parallax.js';
import { state } from '../app/state.js';

// =============================================
// DYNAMIC IMPORTS — Efectos del Reader cargados bajo demanda
// Cada efecto solo se descarga cuando una página lo necesita.
// =============================================
const loadLeaves       = () => import('./leaves/index.js');
const loadTimePulse    = () => import('./time-pulse/index.js');
const loadSwallows     = () => import('./swallows/index.js');
const loadTwilight     = () => import('./twilight/index.js');
const loadDewdrops     = () => import('./dewdrops/index.js');
const loadCracks       = () => import('./cracks/index.js');
const loadPobres       = () => import('./pobres/index.js');
const loadEterno       = () => import('./eterno-retorno/index.js');
const loadSisyphus     = () => import('./sisyphus/index.js');
const loadFacade       = () => import('./facade/index.js');
const loadOlmo         = () => import('./olmo/index.js');

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
let activePobresCleanup = null;
let activeEternoCleanup = null;
let activeSisyphusCleanup = null;
let activeFacadeCleanup = null;
let activeOlmoCleanup = null;
let activeLibraryParticlesCleanup = null;
let activeCardParallaxCleanup = null;
const activeEffectAudio = new Set();
const activeEffectFadeIntervals = new Map();

function getConnectionInfo() {
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

function shouldReduceLibraryAtmosphere() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const connection = getConnectionInfo();
    const effectiveType = String(connection?.effectiveType || '').toLowerCase();
    const constrainedConnection = Boolean(connection?.saveData) || effectiveType.includes('2g') || effectiveType === '3g';
    const lowMemory = (navigator.deviceMemory || 4) <= 2;
    const lowCores = (navigator.hardwareConcurrency || 4) <= 4;

    return prefersReducedMotion || constrainedConnection || lowMemory || lowCores;
}

function canPlayManagedEffectSounds() {
    const bookId = state.currentBook?.id;
    if (!bookId) return false;
    return state.audioBookDecisions[bookId] === 'enabled';
}

function clearEffectFade(audio) {
    const fadeInterval = activeEffectFadeIntervals.get(audio);
    if (fadeInterval) {
        clearInterval(fadeInterval);
        activeEffectFadeIntervals.delete(audio);
    }
}

function unregisterEffectAudio(audio, { resetPlayback = false } = {}) {
    if (!audio) return;
    clearEffectFade(audio);
    activeEffectAudio.delete(audio);

    if (resetPlayback) {
        audio.pause();
        audio.currentTime = 0;
    }

    audio.__shouldResume = false;
}

function stopAllEffectAudio() {
    activeEffectAudio.forEach((audio) => unregisterEffectAudio(audio, { resetPlayback: true }));
}

export function pauseAllEffectAudio() {
    activeEffectAudio.forEach((audio) => {
        clearEffectFade(audio);
        audio.__shouldResume = !audio.paused;
        if (!audio.paused) audio.pause();
    });
}

export function resumeEffectAudio() {
    if (!canPlayManagedEffectSounds()) return;

    activeEffectAudio.forEach((audio) => {
        if (!audio.__shouldResume) return;
        audio.__shouldResume = false;
        audio.play().catch(() => { });
    });
}

export function syncEffectAudioVolume() {
    activeEffectAudio.forEach((audio) => {
        const baseVolume = audio.__baseVolume ?? 1;
        audio.volume = Math.min(baseVolume * (state.currentVolume || 1), 1);
    });
}

function playManagedEffectSound(soundFile, { baseVolume = 1, fadeStep = 0.01, fadeIntervalMs = 20 } = {}) {
    if (!soundFile || !canPlayManagedEffectSounds()) return null;

    const audio = new Audio(`/sounds/${soundFile}`);
    audio.__baseVolume = baseVolume;
    audio.__shouldResume = false;
    audio.volume = 0;
    activeEffectAudio.add(audio);

    const cleanup = () => unregisterEffectAudio(audio);
    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });

    audio.play().then(() => {
        const targetVolume = Math.min(baseVolume * (state.currentVolume || 1), 1);
        let vol = 0;
        const fadeInterval = setInterval(() => {
            if (!activeEffectAudio.has(audio)) {
                clearInterval(fadeInterval);
                return;
            }

            vol = Math.min(vol + fadeStep, targetVolume);
            audio.volume = vol;

            if (vol >= targetVolume) {
                clearInterval(fadeInterval);
                activeEffectFadeIntervals.delete(audio);
            }
        }, fadeIntervalMs);

        activeEffectFadeIntervals.set(audio, fadeInterval);
    }).catch((error) => {
        unregisterEffectAudio(audio);
        console.warn('Bloqueado:', error);
    });

    return audio;
}

function triggerManagedEffectSounds(effects = []) {
    if (effects.includes('sfx_door_loud')) {
        playManagedEffectSound('efectosonido_puerta.mp4', { baseVolume: 0.11, fadeStep: 0.015, fadeIntervalMs: 20 });
    } else if (effects.includes('sfx_door_soft')) {
        playManagedEffectSound('efectosonido_puerta.mp4', { baseVolume: 0.04, fadeStep: 0.006, fadeIntervalMs: 25 });
    } else if (effects.includes('sfx_ocean_loop')) {
        const audio = playManagedEffectSound('olas_mar.mp3', { baseVolume: 0.35, fadeStep: 0.005, fadeIntervalMs: 30 });
        if (audio) {
            audio.loop = true;
        }
    }
}

export function replayManagedPageEffectSounds(effectString) {
    const effects = effectString ? effectString.split(',').map((effect) => effect.trim()) : [];
    if (effects.length === 0) return;
    stopAllEffectAudio();
    triggerManagedEffectSounds(effects);
}

function clearExistingEffects(nextEffects = []) {
    if (activeEffectInterval) { clearInterval(activeEffectInterval); activeEffectInterval = null; }
    if (activeSmokeInterval) { clearInterval(activeSmokeInterval); activeSmokeInterval = null; }
    if (activeRainInterval) { clearInterval(activeRainInterval); activeRainInterval = null; }
    if (activeBirdInterval) { clearInterval(activeBirdInterval); activeBirdInterval = null; }
    stopAllEffectAudio();

    // Limpiar nuevos efectos
    if (activeLeavesCleanup) { activeLeavesCleanup(); activeLeavesCleanup = null; }
    if (activeTimePulseCleanup) { activeTimePulseCleanup(); activeTimePulseCleanup = null; }
    if (activeSepiaOverlay) { activeSepiaOverlay.remove(); activeSepiaOverlay = null; }
    if (activeSwallowsCleanup) { activeSwallowsCleanup(); activeSwallowsCleanup = null; }
    if (activeTwilightCleanup) { activeTwilightCleanup(); activeTwilightCleanup = null; }
    if (activeDewdropsCleanup) { activeDewdropsCleanup(); activeDewdropsCleanup = null; }
    if (activeFirefliesCleanup) { activeFirefliesCleanup(); activeFirefliesCleanup = null; }
    if (activePobresCleanup) { activePobresCleanup(); activePobresCleanup = null; }
    if (activeEternoCleanup) { activeEternoCleanup(); activeEternoCleanup = null; }
    if (activeSisyphusCleanup) { activeSisyphusCleanup(); activeSisyphusCleanup = null; }
    if (activeFacadeCleanup) { activeFacadeCleanup(); activeFacadeCleanup = null; }
    const keepOlmo = nextEffects.some(e => e.startsWith('olmo_tree_'));
    if (!keepOlmo && activeOlmoCleanup) { activeOlmoCleanup(); activeOlmoCleanup = null; }
    const keepCracks = nextEffects.some(e => e.startsWith('cracks_'));
    if (!keepCracks && activeCracksCleanup) { activeCracksCleanup(); activeCracksCleanup = null; }

    // Single combined querySelectorAll for all effect elements (merged 3 calls → 1)
    const cracksQuery = keepCracks ? '' : ', #cracks-overlay';
    const olmoQuery = keepOlmo ? '' : ', #olmo-overlay';
    const allEffectElements = document.querySelectorAll(
        '.flying-bird, .effect-overlay, .leaves-effect-overlay, .time-pulse-overlay, ' +
        '.sepia-overlay, .swallows-effect-overlay, .twilight-overlay, .dewdrops-overlay, ' +
        '.fireflies-overlay, .smoke-particle, .rain-drop, .falling-leaf, ' +
        '.time-pulse-ring, .swallow-bird, .firefly, .dewdrop, ' +
        '.pobres-overlay, .pobres-bg-overlay, ' +
        '.eterno-bg-overlay, .eterno-spiral-canvas, .eterno-particles, ' +
        '.sisifo-bg-overlay, .sisifo-stars, .sisifo-particles, ' +
        '.door-light-overlay, .door-choices-cinematic' + cracksQuery + olmoQuery
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
    // El hogar del escarabajo es la G (el orb de IA)
    const orb = document.querySelector('.command-orb__primary') || document.getElementById('command-orb');
    if (orb) {
        const rect = orb.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
    // Fallback: esquina inferior derecha
    return { x: window.innerWidth - 30, y: window.innerHeight - 30 };
}

export function startLibraryBeetle({ getAppMode }) {
    stopLibraryBeetle();
    if (shouldReduceLibraryAtmosphere()) return;

    const scheduleNext = () => {
        if (getAppMode() !== 'library') return;

        // Tiempo más espaciado: Entre 20 y 60 segundos (evento especial)
        const delay = 20000 + Math.random() * 40000;

        activeBeetleTimeout = setTimeout(() => {
            if (getAppMode() !== 'library') return;

            activeBeetleCleanup = initBeetle({
                getHideTarget: getBeetleHideTarget,
                maxLifetimeMs: 25000 + Math.random() * 15000,
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

export async function handlePageEffects(effectString, { getAppMode, pageData } = {}) {
    const effects = effectString ? effectString.split(',').map(e => e.trim()) : [];
    clearExistingEffects(effects);
    if (!effectString) return;

    // Efectos CSS-only (síncronos, no requieren módulos)
    if (effects.includes('bluebird_pass')) startBirdEffect(getAppMode);
    if (effects.includes('smoke_overlay')) startSmokeEffect(getAppMode);
    if (effects.includes('rain_subtle')) startRainEffect(getAppMode);

    // --- Hojas cayendo (dynamic import) ---
    const leavesMatch = effects.find(e => e.startsWith('falling_leaves_'));
    if (leavesMatch) {
        const intensity = leavesMatch.replace('falling_leaves_', '');
        const { startLeavesEffect } = await loadLeaves();
        activeLeavesCleanup = startLeavesEffect(intensity);
    }

    // --- Pulso del tiempo (dynamic import) ---
    const pulseMatch = effects.find(e => e.startsWith('time_pulse_'));
    if (pulseMatch) {
        const intensity = pulseMatch.replace('time_pulse_', '');
        const { startTimePulseEffect } = await loadTimePulse();
        activeTimePulseCleanup = startTimePulseEffect(intensity);
    }

    // Overlay sepia (CSS-only, síncrono)
    if (effects.some(e => e.startsWith('sepia_'))) {
        const sepiaEffect = effects.find(e => e.startsWith('sepia_') && e !== 'sepia_grain');
        const intensity = sepiaEffect ? sepiaEffect.split('_')[1] : null;
        const withGrain = effects.includes('sepia_grain');

        if (intensity) {
            activeSepiaOverlay = document.createElement('div');
            activeSepiaOverlay.className = `sepia-overlay sepia-${intensity}`;
            if (withGrain) activeSepiaOverlay.classList.add('with-grain');
            getEffectsContainer().appendChild(activeSepiaOverlay);
        }
    }

    // --- Golondrinas (dynamic import) ---
    const swallowModes = [
        'swallows_arriving', 'swallows_nesting', 'swallows_passing',
        'swallows_fading', 'swallows_single', 'tiny_swallows_mid', 'tiny_swallows_under'
    ];
    const swallowModeMap = {
        'swallows_arriving': 'arriving', 'swallows_nesting': 'nesting',
        'swallows_passing': 'passing', 'swallows_fading': 'fading',
        'swallows_single': 'single', 'tiny_swallows_mid': 'tiny_mid',
        'tiny_swallows_under': 'tiny_under'
    };
    const activeSwallowMode = effects.find(e => swallowModes.includes(e));
    const needsSwallows = activeSwallowMode || effects.includes('tiny_landing');

    if (needsSwallows) {
        const { startSwallowsEffect } = await loadSwallows();

        if (activeSwallowMode) {
            activeSwallowsCleanup = startSwallowsEffect(swallowModeMap[activeSwallowMode]);
        }

        if (effects.includes('tiny_landing')) {
            const landingCleanup = startSwallowsEffect('tiny_landing');
            if (activeSwallowsCleanup) {
                const oldCleanup = activeSwallowsCleanup;
                activeSwallowsCleanup = () => { oldCleanup(); landingCleanup(); };
            } else {
                activeSwallowsCleanup = landingCleanup;
            }
        }
    }

    // --- Atardecer/Noche (dynamic import) ---
    const twilightEffect = effects.find(e => e.startsWith('twilight_'));
    const needsFireflies = effects.find(e => e.startsWith('fireflies_'));
    if (twilightEffect || needsFireflies) {
        const mod = await loadTwilight();
        if (twilightEffect) {
            const intensity = twilightEffect.replace('twilight_', '');
            activeTwilightCleanup = mod.startTwilightEffect(intensity);
        }
        if (needsFireflies) {
            const intensity = needsFireflies.replace('fireflies_', '');
            activeFirefliesCleanup = mod.startFirefliesEffect(intensity);
        }
    }

    // --- Gotas de rocío / Lágrimas (dynamic import) ---
    const dewMatch = effects.find(e => e.startsWith('dewdrops_'));
    if (dewMatch) {
        const mode = dewMatch.replace('dewdrops_', '');
        const { startDewdropsEffect } = await loadDewdrops();
        activeDewdropsCleanup = startDewdropsEffect(mode);
    }

    // --- Grietas SVG (dynamic import) ---
    const cracksEffect = effects.find(e => e.startsWith('cracks_'));
    if (cracksEffect) {
        const stage = cracksEffect.replace('cracks_', '');
        const { startCracksEffect } = await loadCracks();
        const cleanup = startCracksEffect(stage);
        if (!activeCracksCleanup) {
            activeCracksCleanup = cleanup;
        }
    }

    // --- Flores en el Hormigón — Gata Cattana (dynamic import) ---
    const pobresEffect = effects.find(e => e.startsWith('pobres_'));
    if (pobresEffect) {
        const { startPobresEffect } = await loadPobres();
        activePobresCleanup = startPobresEffect(pobresEffect);
    }

    // --- Eterno Retorno — Nietzsche (dynamic import) ---
    const eternoEffect = effects.find(e => e.startsWith('eterno_'));
    if (eternoEffect) {
        const { startEternoRetornoEffect } = await loadEterno();
        activeEternoCleanup = startEternoRetornoEffect(eternoEffect);
    }

    // --- Sísifo — Camus (dynamic import) ---
    const sisifoEffect = effects.find(e => e.startsWith('sisifo_'));
    if (sisifoEffect) {
        const { startSisyphusEffect } = await loadSisyphus();
        activeSisyphusCleanup = startSisyphusEffect(sisifoEffect);
    }

    // --- La Máscara (Canvas Scratch-off) (dynamic import) ---
    const facadeEffect = effects.find(e => e === 'facade_scratch');
    if (facadeEffect) {
        const { startFacadeEffect } = await loadFacade();
        activeFacadeCleanup = startFacadeEffect(pageData?.facade || pageData?.effectOptions?.facade || {});
    }

    // --- Olmo Animado — Peras del olmo (dynamic import) ---
    const olmoEffect = effects.find(e => e.startsWith('olmo_tree_'));
    if (olmoEffect) {
        const stage = olmoEffect.replace('olmo_tree_', '');
        const { startOlmoEffect } = await loadOlmo();
        activeOlmoCleanup = startOlmoEffect(stage);
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
    // --- Sonidos puntuales integrados al sistema global de audio ---
    triggerManagedEffectSounds(effects);
}

export function startLibraryAtmosphere() {
    stopLibraryAtmosphere();
    if (!shouldReduceLibraryAtmosphere()) {
        activeLibraryParticlesCleanup = startLibraryParticles();
    }
    activeCardParallaxCleanup = startCardParallax();
}

export function stopLibraryAtmosphere() {
    if (activeLibraryParticlesCleanup) {
        activeLibraryParticlesCleanup();
        activeLibraryParticlesCleanup = null;
    }
    if (activeCardParallaxCleanup) {
        activeCardParallaxCleanup();
        activeCardParallaxCleanup = null;
    }
}
