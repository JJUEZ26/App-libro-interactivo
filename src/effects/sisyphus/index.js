/**
 * Efecto "Sísifo" — Albert Camus
 * 
 * Efecto visual atmosférico nocturno que evoca la montaña,
 * la soledad del castigo, y la dignidad de la rebelión absurda.
 * 
 * Fases:
 *   sisifo_portada       — Cielo estrellado, luna, calma
 *   sisifo_condena       — Oscuridad pesada, partículas de ceniza
 *   sisifo_juego         — Mínimo: solo vignette sutil (no interferir con el juego)
 *   sisifo_contemplacion — Niebla azulada, partículas lentas
 *   sisifo_final         — Vacío luminoso, partículas ascendentes
 *   sisifo_bio           — Atmósfera sutil de fondo
 */

const PHASES = {
    sisifo_portada:       { particles: 12, speed: 0.04, glow: 'moon',    bg: 'night',      starCount: 40 },
    sisifo_condena:       { particles: 8,  speed: 0.06, glow: 'ash',     bg: 'oppressive',  starCount: 0 },
    sisifo_juego:         { particles: 0,  speed: 0,    glow: 'none',    bg: 'transparent', starCount: 0 },
    sisifo_contemplacion: { particles: 10, speed: 0.03, glow: 'blue',    bg: 'mist',        starCount: 8 },
    sisifo_final:         { particles: 14, speed: 0.02, glow: 'warmth',  bg: 'dawn',        starCount: 0 },
    sisifo_bio:           { particles: 5,  speed: 0.03, glow: 'moon',    bg: 'night',       starCount: 6 },
};

const GLOW_COLORS = {
    moon:   { particle: 'rgba(200, 210, 230, 0.45)' },
    ash:    { particle: 'rgba(140, 130, 120, 0.35)' },
    blue:   { particle: 'rgba(120, 150, 200, 0.40)' },
    warmth: { particle: 'rgba(220, 180, 120, 0.50)' },
    none:   { particle: 'transparent' },
};

const BG_GRADIENTS = {
    night:       'linear-gradient(180deg, rgba(6,8,16,0.96) 0%, rgba(10,12,22,0.98) 50%, rgba(8,10,18,0.96) 100%)',
    oppressive:  'linear-gradient(180deg, rgba(4,4,6,0.98) 0%, rgba(6,5,8,0.99) 50%, rgba(8,6,10,0.98) 100%)',
    transparent: 'transparent',
    mist:        'linear-gradient(180deg, rgba(8,10,18,0.94) 0%, rgba(14,18,30,0.96) 50%, rgba(10,12,22,0.95) 100%)',
    dawn:        'linear-gradient(180deg, rgba(12,10,16,0.93) 0%, rgba(18,14,20,0.95) 45%, rgba(22,18,24,0.93) 100%)',
};

function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function createStars(container, count) {
    if (count <= 0) return () => {};
    
    const overlay = document.createElement('div');
    overlay.className = 'sisifo-stars';
    container.appendChild(overlay);
    
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'sisifo-star';
        const size = 1 + Math.random() * 1.5;
        const x = Math.random() * 100;
        const y = Math.random() * 60; // upper 60% of screen
        const duration = 3 + Math.random() * 5;
        const delay = Math.random() * 4;
        
        star.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}%;
            top: ${y}%;
            --twinkle-duration: ${duration}s;
            --twinkle-delay: ${delay}s;
        `;
        overlay.appendChild(star);
    }
    
    return () => overlay.remove();
}

function createParticles(container, config, colorSet) {
    if (config.particles <= 0) return () => {};
    
    const overlay = document.createElement('div');
    overlay.className = 'sisifo-particles';
    container.appendChild(overlay);
    
    const mobileFactor = isMobile() ? 0.6 : 1;
    const count = Math.max(2, Math.round(config.particles * mobileFactor));
    const isAscending = config.glow === 'warmth'; // final phase particles rise
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'sisifo-particle';
        if (isAscending) particle.classList.add('sisifo-particle--ascending');
        
        const size = 1 + Math.random() * 2.5;
        const x = Math.random() * 100;
        const y = 20 + Math.random() * 70;
        const duration = 12 + Math.random() * 18;
        const delay = Math.random() * 8;
        const drift = (Math.random() - 0.5) * 30;
        
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}%;
            top: ${y}%;
            background: ${colorSet.particle};
            box-shadow: 0 0 ${size * 3}px ${colorSet.particle};
            --drift: ${drift}px;
            --float-duration: ${duration}s;
            --float-delay: ${delay}s;
        `;
        overlay.appendChild(particle);
    }
    
    return () => overlay.remove();
}

function injectStyles() {
    if (document.getElementById('sisifo-effect-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'sisifo-effect-styles';
    style.textContent = `
        /* === SÍSIFO EFFECT === */
        .sisifo-bg-overlay {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 2;
            transition: background 2s ease, opacity 1.2s ease;
        }

        .sisifo-stars {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 3;
            overflow: hidden;
        }

        .sisifo-star {
            position: absolute;
            border-radius: 50%;
            background: rgba(220, 230, 255, 0.8);
            opacity: 0;
            animation: sisifoTwinkle var(--twinkle-duration, 4s) ease-in-out var(--twinkle-delay, 0s) infinite;
        }

        @keyframes sisifoTwinkle {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.8; }
        }

        .sisifo-particles {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 3;
            overflow: hidden;
        }

        .sisifo-particle {
            position: absolute;
            border-radius: 50%;
            opacity: 0;
            animation:
                sisifoFloat var(--float-duration, 15s) ease-in-out var(--float-delay, 0s) infinite alternate,
                sisifoFadeInOut var(--float-duration, 15s) ease-in-out var(--float-delay, 0s) infinite;
        }

        .sisifo-particle--ascending {
            animation:
                sisifoRise var(--float-duration, 15s) linear var(--float-delay, 0s) infinite,
                sisifoFadeInOut var(--float-duration, 15s) ease-in-out var(--float-delay, 0s) infinite;
        }

        @keyframes sisifoFloat {
            0%   { transform: translateY(0) translateX(0); }
            50%  { transform: translateY(-14px) translateX(var(--drift, 8px)); }
            100% { transform: translateY(5px) translateX(calc(var(--drift, 8px) * -0.4)); }
        }

        @keyframes sisifoRise {
            0%   { transform: translateY(0) translateX(0); }
            100% { transform: translateY(-80vh) translateX(var(--drift, 8px)); }
        }

        @keyframes sisifoFadeInOut {
            0%   { opacity: 0; }
            12%  { opacity: 0.5; }
            50%  { opacity: 0.3; }
            88%  { opacity: 0.6; }
            100% { opacity: 0; }
        }

        /* === SÍSIFO MODE: transparent reader === */
        body.sisifo-mode #page-wrapper {
            background-color: transparent !important;
            box-shadow: none !important;
            border-color: transparent !important;
        }
        body.sisifo-mode #page-wrapper::before,
        body.sisifo-mode #page-wrapper::after {
            display: none !important;
        }
        body.sisifo-mode #reader-view {
            background-color: transparent !important;
        }
        body.sisifo-mode #app-container {
            background-color: #050608;
        }
        body.sisifo-mode #book-container,
        body.sisifo-mode #book,
        body.sisifo-mode #page-wrapper,
        body.sisifo-mode .page-content,
        body.sisifo-mode .content-centerer {
            position: relative;
            z-index: 10;
        }

        /* Sísifo text styling */
        body.sisifo-mode .content-centerer {
            color: rgba(220, 225, 235, 0.92);
        }
        body.sisifo-mode .poem-layout .verse-line {
            color: rgba(220, 225, 235, 0.92);
        }
        body.sisifo-mode .choices button {
            border-color: rgba(180, 190, 210, 0.2);
            color: rgba(220, 225, 235, 0.85);
            background: rgba(10, 12, 20, 0.7);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: var(--font-reader-body, 'Playfair Display', serif);
            font-size: 1rem;
            letter-spacing: 0.06em;
            padding: 14px 28px;
            border-radius: 4px;
        }
        body.sisifo-mode .choices button:hover {
            border-color: rgba(200, 210, 230, 0.45);
            color: rgba(245, 248, 255, 1);
            background: rgba(180, 190, 210, 0.08);
            transform: translateY(-2px);
            box-shadow: 0 6px 30px rgba(140, 160, 200, 0.1);
        }

        /* === SÍSIFO COVER === */
        .sisifo-cover-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 65vh;
            text-align: center;
        }
        .sisifo-cover-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }
        .sisifo-cover-label {
            font-family: 'Inter', sans-serif;
            font-size: 0.85rem;
            font-weight: 500;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            color: rgba(180, 190, 210, 0.6);
            opacity: 0;
            animation: sisifoFadeUp 1.2s ease-out 0.3s forwards;
        }
        .sisifo-cover-title {
            font-family: 'Playfair Display', serif;
            font-size: clamp(2.8rem, 8vw, 5rem);
            font-weight: 700;
            line-height: 1.1;
            letter-spacing: -0.02em;
            color: #ffffff;
            margin: 0;
            background: linear-gradient(180deg, #ffffff 20%, rgba(180, 190, 210, 0.7) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: none;
            opacity: 0;
            animation: sisifoFadeUp 1.5s ease-out 0.6s forwards;
        }
        .sisifo-cover-line {
            width: 60px;
            height: 1px;
            background: rgba(180, 190, 210, 0.25);
            opacity: 0;
            animation: sisifoFadeUp 1s ease-out 1s forwards;
        }
        .sisifo-cover-subtitle {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-size: 1.1rem;
            color: rgba(180, 190, 210, 0.5);
            opacity: 0;
            animation: sisifoFadeUp 1s ease-out 1.2s forwards;
        }

        @keyframes sisifoFadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        /* Transition page styling */
        .sisifo-transition-page .scenes-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
        }
        .sisifo-emphasis {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-size: 1.6rem;
            color: rgba(220, 225, 235, 0.95);
        }

        /* Final page styling */
        .sisifo-final-page .scenes-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
        }

        /* Game mount — fullscreen within the reader */
        .sisifo-game-mount {
            position: relative;
            width: 100%;
            height: 70vh;
            min-height: 400px;
            max-height: 700px;
            background: #050608;
            border-radius: 12px;
            overflow: hidden;
        }

        /* Cycle overlay — philosophical text between cycles */
        .sisifo-cycle-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(5, 6, 8, 0.82);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 10;
            opacity: 0;
            transition: opacity 1.2s ease;
            pointer-events: none;
            padding: 2rem;
        }
        .sisifo-cycle-overlay.visible {
            opacity: 1;
        }
        .sisifo-cycle-text {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-size: clamp(1.1rem, 2.5vw, 1.5rem);
            color: rgba(220, 225, 235, 0.9);
            text-align: center;
            line-height: 2;
            max-width: 500px;
            white-space: pre-line;
        }
        .sisifo-cycle-overlay .sisifo-continue-btn {
            margin-top: 2.5rem;
            padding: 12px 32px;
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
            font-weight: 500;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: rgba(220, 225, 235, 0.8);
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(180, 190, 210, 0.2);
            border-radius: 4px;
            cursor: pointer;
            pointer-events: auto;
            opacity: 0;
            transition: all 0.4s ease;
            animation: sisifoFadeUp 0.8s ease-out 2s forwards;
        }
        .sisifo-cycle-overlay .sisifo-continue-btn:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(200, 210, 230, 0.4);
        }

        /* Game hint */
        .sisifo-game-hint {
            position: absolute;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            font-family: 'Inter', sans-serif;
            font-size: 0.8rem;
            font-weight: 400;
            letter-spacing: 0.12em;
            color: rgba(200, 210, 230, 0.5);
            z-index: 5;
            pointer-events: none;
            opacity: 0;
            animation: sisifoFadeUp 1s ease-out 1.5s forwards;
            transition: opacity 0.6s ease;
        }
        .sisifo-game-hint.hidden {
            opacity: 0 !important;
        }

        /* bio specifics */
        body.sisifo-mode .bio-portrait-container {
            margin-bottom: 1.5rem;
        }
        body.sisifo-mode .bio-portrait {
            border: 2px solid rgba(180, 190, 210, 0.15);
        }
        body.sisifo-mode .bio-badge {
            background: rgba(180, 190, 210, 0.08);
            color: rgba(220, 225, 235, 0.8);
        }
        body.sisifo-mode .bio-name {
            color: rgba(220, 225, 235, 0.95);
        }
        body.sisifo-mode .bio-quote {
            color: rgba(180, 190, 210, 0.65);
        }

        /* Progress bar in sisifo mode */
        body.sisifo-mode #progress-fill {
            background: rgba(180, 190, 210, 0.4);
        }

        @media (max-width: 768px) {
            .sisifo-game-mount {
                height: 55vh;
                min-height: 320px;
                border-radius: 8px;
            }
            .sisifo-cycle-text {
                font-size: 1.05rem;
                line-height: 1.8;
                padding: 0 1rem;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Main entry point for the Sisyphus effect.
 * @param {string} effectName — one of the PHASES keys
 * @returns {function} cleanup function
 */
export function startSisyphusEffect(effectName) {
    const container = document.getElementById('app-container') || document.body;
    const config = PHASES[effectName] || PHASES.sisifo_portada;
    const colorSet = GLOW_COLORS[config.glow] || GLOW_COLORS.moon;
    const bgKey = config.bg || 'night';

    injectStyles();

    // Add body class
    document.body.classList.add('sisifo-mode');

    // Background overlay (skip for game phase)
    let bgOverlay = null;
    if (bgKey !== 'transparent') {
        bgOverlay = document.createElement('div');
        bgOverlay.className = 'sisifo-bg-overlay';
        bgOverlay.style.background = BG_GRADIENTS[bgKey];
        container.appendChild(bgOverlay);
    }

    // Stars
    const cleanupStars = createStars(container, config.starCount);

    // Particles
    const cleanupParticles = createParticles(container, config, colorSet);

    return function cleanup() {
        cleanupStars();
        cleanupParticles();
        if (bgOverlay) bgOverlay.remove();
        document.body.classList.remove('sisifo-mode');
    };
}
