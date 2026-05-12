/**
 * Efecto "Eterno Retorno" — Nietzsche
 * 
 * Efecto visual contemplativo e inmersivo que evoca la idea
 * de la repetición eterna, el tiempo cíclico, y la profundidad
 * existencial del eterno retorno.
 * 
 * Fases:
 *   eterno_portada    — Halo sutil, pocas partículas
 *   eterno_aparicion  — Presencia misteriosa, anillos pulsantes
 *   eterno_revelacion — Frases que pesan, halo más grande
 *   eterno_golpe      — Vacío, un solo anillo central latiendo
 *   eterno_cierre     — Calma, halo se ralentiza, luz tenue
 *   eterno_bio        — Biografía, atmósfera sutil
 */
import { getEternoCycle } from './cycle-state.js';

const PHASES = {
    eterno_portada:    { rings: 4, particles: 6,  speed: 0.06, glow: 'gold',    bg: 'abyss',   haloSize: 0.7 },
    eterno_aparicion:  { rings: 5, particles: 10, speed: 0.10, glow: 'amber',   bg: 'night',   haloSize: 0.85 },
    eterno_revelacion: { rings: 6, particles: 14, speed: 0.14, glow: 'ember',   bg: 'deep',    haloSize: 1.0 },
    eterno_golpe:      { rings: 2, particles: 4,  speed: 0.03, glow: 'cold',    bg: 'void',    haloSize: 0.5 },
    eterno_cierre:     { rings: 4, particles: 8,  speed: 0.05, glow: 'warmth',  bg: 'dusk',    haloSize: 0.9 },
    eterno_bio:        { rings: 3, particles: 5,  speed: 0.04, glow: 'amber',   bg: 'night',   haloSize: 0.6 }
};

const GLOW_COLORS = {
    gold:   { primary: 'rgba(212, 175, 55, 0.15)',  particle: 'rgba(212, 175, 55, 0.6)',  ring: 'rgba(212, 175, 55, 0.12)' },
    amber:  { primary: 'rgba(191, 144, 63, 0.12)',  particle: 'rgba(191, 155, 80, 0.55)', ring: 'rgba(180, 140, 60, 0.10)' },
    ember:  { primary: 'rgba(160, 82, 45, 0.10)',   particle: 'rgba(180, 100, 50, 0.5)',  ring: 'rgba(160, 82, 45, 0.08)' },
    cold:   { primary: 'rgba(140, 150, 175, 0.08)', particle: 'rgba(180, 190, 210, 0.4)', ring: 'rgba(140, 150, 175, 0.06)' },
    warmth: { primary: 'rgba(200, 160, 80, 0.12)',  particle: 'rgba(220, 180, 100, 0.5)', ring: 'rgba(200, 160, 80, 0.09)' }
};

const BG_GRADIENTS = {
    abyss:   'linear-gradient(180deg, rgba(5,5,10,0.95) 0%, rgba(8,6,12,0.98) 40%, rgba(12,8,15,0.96) 100%)',
    night:   'linear-gradient(180deg, rgba(8,8,14,0.93) 0%, rgba(10,8,16,0.97) 50%, rgba(14,10,18,0.95) 100%)',
    deep:    'linear-gradient(180deg, rgba(10,6,8,0.94) 0%, rgba(14,8,12,0.97) 45%, rgba(18,10,14,0.95) 100%)',
    void:    'linear-gradient(180deg, rgba(4,4,6,0.97) 0%, rgba(6,5,8,0.99) 50%, rgba(8,6,10,0.97) 100%)',
    dusk:    'linear-gradient(180deg, rgba(10,8,12,0.92) 0%, rgba(14,10,16,0.96) 50%, rgba(18,14,20,0.94) 100%)'
};

function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Creates the rotating halo — concentric rings with subtle continuous rotation
 */
function createSpiralCanvas(container, config, colorSet) {
    const canvas = document.createElement('canvas');
    canvas.className = 'eterno-spiral-canvas';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 800 * dpr;
    canvas.height = 800 * dpr;
    canvas.style.width = '800px';
    canvas.style.height = '800px';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const cx = 400 * dpr, cy = 400 * dpr;
    let angle = 0;
    let animId = null;
    const haloScale = config.haloSize || 1;

    function drawHalo() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw concentric rings with slow rotation
        for (let r = 0; r < config.rings; r++) {
            const baseRadius = (70 + r * 50) * dpr * haloScale;
            const ringOpacity = 0.06 + (r * 0.018);
            const ringWidth = (1.2 + r * 0.4) * dpr;
            const rotationOffset = angle * (1 + r * 0.3);

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rotationOffset);

            ctx.beginPath();
            ctx.strokeStyle = colorSet.ring.replace(/[\d.]+\)$/, `${ringOpacity})`);
            ctx.lineWidth = ringWidth;

            // Slightly wobbly circle path for organic feel
            for (let i = 0; i <= 360; i += 1) {
                const radians = (i * Math.PI) / 180;
                const wobble = Math.sin(radians * 5 + angle * 2) * (3 + r * 1.5) * dpr;
                const currentR = baseRadius + wobble;
                const x = Math.cos(radians) * currentR;
                const y = Math.sin(radians) * currentR;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        }

        // Central radial glow — the "halo" effect
        const glowRadius = 180 * dpr * haloScale;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        gradient.addColorStop(0, colorSet.primary);
        gradient.addColorStop(0.5, colorSet.primary.replace(/[\d.]+\)$/, '0.04)'));
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Outer soft glow ring
        const outerGlow = ctx.createRadialGradient(cx, cy, glowRadius * 0.7, cx, cy, glowRadius * 1.3);
        outerGlow.addColorStop(0, 'transparent');
        outerGlow.addColorStop(0.5, colorSet.ring.replace(/[\d.]+\)$/, '0.03)'));
        outerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = outerGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle slow continuous rotation
        angle += config.speed * 0.008;
        animId = requestAnimationFrame(drawHalo);
    }

    drawHalo();

    return () => {
        if (animId) cancelAnimationFrame(animId);
        canvas.remove();
    };
}

/**
 * Creates floating particles — golden dust specks
 */
function createParticles(container, config, colorSet) {
    const overlay = document.createElement('div');
    overlay.className = 'eterno-particles';
    container.appendChild(overlay);

    const mobileFactor = isMobile() ? 0.6 : 1;
    const motionFactor = prefersReducedMotion() ? 0.4 : 1;
    const count = Math.max(3, Math.round(config.particles * mobileFactor * motionFactor));

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'eterno-particle';

        const size = 1.5 + Math.random() * 2.5;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = 10 + Math.random() * 15;
        const delay = Math.random() * 8;
        const drift = (Math.random() - 0.5) * 25;

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}%;
            top: ${y}%;
            background: ${colorSet.particle};
            box-shadow: 0 0 ${size * 4}px ${colorSet.particle};
            --drift: ${drift}px;
            --float-duration: ${duration}s;
            --float-delay: ${delay}s;
        `;

        overlay.appendChild(particle);
    }

    return () => overlay.remove();
}

/**
 * Injects the effect stylesheet once
 */
function injectStyles() {
    if (document.getElementById('eterno-retorno-styles')) return;

    const style = document.createElement('style');
    style.id = 'eterno-retorno-styles';
    style.textContent = `
        /* === ETERNO RETORNO EFFECT === */
        .eterno-bg-overlay {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 2;
            transition: background 1.8s ease, opacity 1s ease;
        }

        .eterno-spiral-canvas {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: min(90vw, 800px) !important;
            height: min(90vw, 800px) !important;
            pointer-events: none;
            z-index: 3;
            opacity: 0;
            mix-blend-mode: screen;
            animation: eternoHaloFadeIn 4s ease-out forwards;
        }

        @keyframes eternoHaloFadeIn {
            0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
            100% { opacity: 0.45; transform: translate(-50%, -50%) scale(1); }
        }

        .eterno-particles {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 3;
            overflow: hidden;
        }

        .eterno-particle {
            position: absolute;
            border-radius: 50%;
            opacity: 0;
            animation:
                eternoFloat var(--float-duration, 12s) ease-in-out var(--float-delay, 0s) infinite alternate,
                eternoFadeInOut var(--float-duration, 12s) ease-in-out var(--float-delay, 0s) infinite;
        }

        @keyframes eternoFloat {
            0%   { transform: translateY(0) translateX(0); }
            50%  { transform: translateY(-18px) translateX(var(--drift, 10px)); }
            100% { transform: translateY(6px) translateX(calc(var(--drift, 10px) * -0.5)); }
        }

        @keyframes eternoFadeInOut {
            0%   { opacity: 0; }
            15%  { opacity: 0.6; }
            50%  { opacity: 0.35; }
            85%  { opacity: 0.7; }
            100% { opacity: 0; }
        }

        /* === NIETZSCHE MODE: transparent reader === */
        body.eterno-mode #page-wrapper {
            background-color: transparent !important;
            box-shadow: none !important;
            border-color: transparent !important;
        }
        body.eterno-mode #page-wrapper::before,
        body.eterno-mode #page-wrapper::after {
            display: none !important;
        }
        body.eterno-mode #reader-view {
            background-color: transparent !important;
        }
        body.eterno-mode #app-container {
            background-color: #050408;
        }
        body.eterno-mode #book-container,
        body.eterno-mode #book,
        body.eterno-mode #page-wrapper,
        body.eterno-mode .page-content,
        body.eterno-mode .content-centerer {
            position: relative;
            z-index: 10;
        }

        /* Eterno retorno text styling */
        body.eterno-mode .content-centerer {
            color: rgba(235, 225, 210, 0.92);
        }
        body.eterno-mode .poem-layout .verse-line {
            color: rgba(235, 225, 210, 0.92);
        }
        body.eterno-mode .choices button {
            border-color: rgba(212, 175, 55, 0.3);
            color: rgba(235, 225, 210, 0.85);
            background: rgba(15, 12, 20, 0.7);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: var(--font-reader-body, 'Playfair Display', serif);
            font-size: 1rem;
            letter-spacing: 0.06em;
            padding: 14px 28px;
            border-radius: 4px;
        }
        body.eterno-mode .choices button:hover {
            border-color: rgba(212, 175, 55, 0.55);
            color: rgba(255, 245, 225, 1);
            background: rgba(212, 175, 55, 0.1);
            transform: translateY(-2px);
            box-shadow: 0 6px 30px rgba(212, 175, 55, 0.12);
        }

        /* bio specifics */
        body.eterno-mode .bio-portrait-container {
            margin-bottom: 1.5rem;
        }
        body.eterno-mode .bio-portrait {
            border: 2px solid rgba(212, 175, 55, 0.15);
        }
        body.eterno-mode .bio-badge {
            background: rgba(212, 175, 55, 0.1);
            color: rgba(235, 225, 210, 0.8);
        }
        body.eterno-mode .bio-name {
            color: rgba(235, 225, 210, 0.95);
        }
        body.eterno-mode .bio-quote {
            color: rgba(212, 175, 55, 0.7);
        }

        /* Progress bar in eterno mode */
        body.eterno-mode #progress-fill {
            background: rgba(212, 175, 55, 0.5);
        }

        @media (max-width: 768px) {
            .eterno-spiral-canvas {
                width: 100vw !important;
                height: 100vw !important;
            }
            @keyframes eternoHaloFadeIn {
                0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
                100% { opacity: 0.35; transform: translate(-50%, -50%) scale(1); }
            }
            .eterno-particles {
                opacity: 0.8;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Main entry point for the Eterno Retorno effect.
 * @param {string} effectName — one of the PHASES keys
 * @returns {function} cleanup function
 */
export function startEternoRetornoEffect(effectName) {
    const cycle = getEternoCycle();
    const container = document.getElementById('app-container') || document.body;
    const baseConfig = PHASES[effectName] || PHASES.eterno_portada;
    
    const cycleFactor = Math.min(cycle, 4);
    const config = {
        ...baseConfig,
        speed: baseConfig.speed * (1 + (cycleFactor - 1) * 0.15),
        particles: Math.max(3, Math.round(baseConfig.particles * (1 - (cycleFactor - 1) * 0.2))),
        haloSize: baseConfig.haloSize * (1 - (cycleFactor - 1) * 0.08),
        rings: Math.max(1, baseConfig.rings - (cycleFactor - 1))
    };
    
    const glowKey = cycleFactor >= 4 ? 'cold' :
                    cycleFactor >= 3 ? 'cold' :
                    cycleFactor >= 2 ? 'ember' :
                    baseConfig.glow;
    const colorSet = GLOW_COLORS[glowKey] || GLOW_COLORS.gold;
    
    const bgKey = cycleFactor >= 4 ? 'void' : (baseConfig.bg || 'abyss');

    injectStyles();

    // Add body class
    document.body.classList.add('eterno-mode');

    // Background overlay
    const bgOverlay = document.createElement('div');
    bgOverlay.className = 'eterno-bg-overlay';
    bgOverlay.style.background = BG_GRADIENTS[bgKey];
    container.appendChild(bgOverlay);

    // Halo canvas (enhanced spiral)
    const cleanupSpiral = createSpiralCanvas(container, config, colorSet);

    // Particles
    const cleanupParticles = createParticles(container, config, colorSet);

    return function cleanup() {
        cleanupSpiral();
        cleanupParticles();
        bgOverlay.remove();
        document.body.classList.remove('eterno-mode');
    };
}
