/**
 * Efecto "Flores en el Hormigón" — Gata Cattana
 * 
 * Flores silvestres que crecen desde el borde inferior de la pantalla.
 * Delicadas, inesperadas, como el amor de los pobres:
 * germinan donde no deberían poder germinar.
 */

const FLOWER_COLORS = {
    tierra: ['#8B4513', '#A0522D', '#D2691E', '#C19A6B'],
    flama: ['#B22222', '#CD5C5C', '#DC143C', '#8B0000'],
    brasa: ['#FF4500', '#FF6347', '#E2642A', '#CC4400'],
    rosa: ['#E8174D', '#F72B5A', '#FF1744', '#C2185B'],
    bio: ['#6B2D5E', '#8E3A78', '#B5458F', '#7B1FA2'],
    intro: ['#555555', '#6B6B6B', '#7A7A7A', '#888888'],
    corazon: ['#FF1744', '#F50057', '#D50000', '#FF0000']
};

const INTENSITIES = {
    pobres_intro: { count: 3, speed: 'slow', bloom: 'small' },
    pobres_tierra: { count: 5, speed: 'slow', bloom: 'small' },
    pobres_flama: { count: 8, speed: 'medium', bloom: 'medium' },
    pobres_brasa: { count: 11, speed: 'medium', bloom: 'medium' },
    pobres_rosa: { count: 14, speed: 'fast', bloom: 'large' },
    pobres_corazon: { count: 20, speed: 'fast', bloom: 'large' },
    pobres_bio: { count: 6, speed: 'slow', bloom: 'medium' },
};

function getColorPalette(effectName) {
    if (effectName.includes('intro')) return FLOWER_COLORS.intro;
    if (effectName.includes('tierra')) return FLOWER_COLORS.tierra;
    if (effectName.includes('flama')) return FLOWER_COLORS.flama;
    if (effectName.includes('brasa')) return FLOWER_COLORS.brasa;
    if (effectName.includes('rosa')) return FLOWER_COLORS.rosa;
    if (effectName.includes('corazon')) return FLOWER_COLORS.corazon;
    if (effectName.includes('bio')) return FLOWER_COLORS.bio;
    return FLOWER_COLORS.tierra;
}

/**
 * Draws a wildflower as an SVG path
 */
function createFlowerSVG(color, size, type) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size * 1.6);
    svg.setAttribute('viewBox', `0 0 ${size} ${size * 1.6}`);
    svg.style.overflow = 'visible';

    const cx = size / 2;
    const stemH = size * 0.8;

    // Stem
    const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    stem.setAttribute('x1', cx);
    stem.setAttribute('y1', size * 1.6);
    stem.setAttribute('x2', cx + (Math.random() - 0.5) * size * 0.3);
    stem.setAttribute('y2', size * 0.5);
    stem.setAttribute('stroke', '#3a5a2a');
    stem.setAttribute('stroke-width', Math.max(1, size * 0.05));
    stem.setAttribute('stroke-linecap', 'round');
    svg.appendChild(stem);

    if (type === 'simple') {
        // 5-petal flower
        const petalCount = 5;
        const r = size * 0.28;
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
            const px = cx + Math.cos(angle) * r;
            const py = size * 0.5 + Math.sin(angle) * r;
            const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            petal.setAttribute('cx', px);
            petal.setAttribute('cy', py);
            petal.setAttribute('rx', size * 0.13);
            petal.setAttribute('ry', size * 0.22);
            petal.setAttribute('fill', color);
            petal.setAttribute('opacity', '0.85');
            petal.setAttribute('transform', `rotate(${(i / petalCount) * 360}, ${px}, ${py})`);
            svg.appendChild(petal);
        }
        // Center
        const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        center.setAttribute('cx', cx);
        center.setAttribute('cy', size * 0.5);
        center.setAttribute('r', size * 0.12);
        center.setAttribute('fill', '#F4C542');
        svg.appendChild(center);

    } else if (type === 'wild') {
        // Ragged wildflower with irregular petals
        const petalCount = 6 + Math.floor(Math.random() * 3);
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const r = size * (0.2 + Math.random() * 0.15);
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const x1 = cx + Math.cos(angle) * r * 0.3;
            const y1 = size * 0.5 + Math.sin(angle) * r * 0.3;
            const x2 = cx + Math.cos(angle) * r;
            const y2 = size * 0.5 + Math.sin(angle) * r;
            const ctrl1x = cx + Math.cos(angle - 0.4) * r * 0.7;
            const ctrl1y = size * 0.5 + Math.sin(angle - 0.4) * r * 0.7;
            const ctrl2x = cx + Math.cos(angle + 0.4) * r * 0.7;
            const ctrl2y = size * 0.5 + Math.sin(angle + 0.4) * r * 0.7;
            path.setAttribute('d', `M ${cx} ${size * 0.5} C ${ctrl1x} ${ctrl1y} ${x1} ${y1} ${x2} ${y2} C ${ctrl2x} ${ctrl2y} ${cx} ${size * 0.5} Z`);
            path.setAttribute('fill', color);
            path.setAttribute('opacity', String(0.7 + Math.random() * 0.3));
            svg.appendChild(path);
        }
        const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        center.setAttribute('cx', cx);
        center.setAttribute('cy', size * 0.5);
        center.setAttribute('r', size * 0.1);
        center.setAttribute('fill', '#FFF8DC');
        svg.appendChild(center);

    } else {
        // Poppy-like — single bold petals
        const petalCount = 4;
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2 + Math.PI / 4;
            const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            petal.setAttribute('cx', cx + Math.cos(angle) * size * 0.18);
            petal.setAttribute('cy', size * 0.5 + Math.sin(angle) * size * 0.18);
            petal.setAttribute('rx', size * 0.18);
            petal.setAttribute('ry', size * 0.28);
            petal.setAttribute('fill', color);
            petal.setAttribute('opacity', '0.9');
            petal.setAttribute('transform', `rotate(${(i / petalCount) * 360 + 45}, ${cx + Math.cos(angle) * size * 0.18}, ${size * 0.5 + Math.sin(angle) * size * 0.18})`);
            svg.appendChild(petal);
        }
        const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        center.setAttribute('cx', cx);
        center.setAttribute('cy', size * 0.5);
        center.setAttribute('r', size * 0.11);
        center.setAttribute('fill', '#1a0a0a');
        svg.appendChild(center);
    }

    return svg;
}

/**
 * Spawns a flower that grows from the bottom of the screen
 */
function spawnFlower(overlay, colors, sizeConfig, speedConfig) {
    const wrapper = document.createElement('div');
    wrapper.className = 'pobres-flower';

    // Random position along the bottom
    const x = 3 + Math.random() * 94; // 3-97%
    const delay = Math.random() * 4000;
    wrapper.style.left = `${x}%`;
    wrapper.style.bottom = `${-1 + Math.random() * 5}%`;

    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = sizeConfig === 'small' ? 14 + Math.random() * 10 :
        sizeConfig === 'medium' ? 18 + Math.random() * 14 :
            22 + Math.random() * 18;

    const types = ['simple', 'wild', 'poppy'];
    const type = types[Math.floor(Math.random() * types.length)];

    const svg = createFlowerSVG(color, size, type);
    wrapper.appendChild(svg);

    const duration = speedConfig === 'slow' ? 3.5 + Math.random() * 2 :
        speedConfig === 'medium' ? 2.5 + Math.random() * 1.5 :
            2 + Math.random() * 1;

    // Use CSS custom properties so they don't conflict with the animation shorthand
    wrapper.style.setProperty('--bloom-duration', `${duration}s`);
    wrapper.style.setProperty('--flower-delay', `${delay}ms`);

    // Slight random tilt
    const tilt = (Math.random() - 0.5) * 20;
    wrapper.style.setProperty('--flower-tilt', `${tilt}deg`);

    overlay.appendChild(wrapper);
}

/**
 * Starts the "Flowers in the Concrete" effect for the poverty poems
 * @param {string} effectName - e.g. 'pobres_terra', 'pobres_brasa', etc.
 * @returns {Function} cleanup function
 */
export function startPobresEffect(effectName) {
    const container = document.getElementById('app-container') || document.body;

    // Inject CSS if not already present
    if (!document.getElementById('pobres-effect-styles')) {
        const style = document.createElement('style');
        style.id = 'pobres-effect-styles';
        style.textContent = `
            .pobres-overlay {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 3;
                overflow: hidden;
            }
            .pobres-flower {
                position: absolute;
                transform-origin: bottom center;
                animation-name: flowerBloom;
                animation-duration: var(--bloom-duration, 3s);
                animation-delay: var(--flower-delay, 0ms);
                animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
                animation-fill-mode: forwards;
                animation-play-state: running;
                opacity: 0;
                z-index: 3;
            }
            @keyframes flowerBloom {
                0% {
                    opacity: 0;
                    transform: scale(0) rotate(var(--flower-tilt, 0deg)) translateY(20px);
                }
                40% {
                    opacity: 0.9;
                }
                70% {
                    transform: scale(1.1) rotate(var(--flower-tilt, 0deg)) translateY(-4px);
                    opacity: 1;
                }
                100% {
                    transform: scale(1) rotate(var(--flower-tilt, 0deg)) translateY(0);
                    opacity: 0.75;
                }
            }

            /* Background overlay for the poem pages */
            .pobres-bg-overlay {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 2;
                transition: background 1.5s ease;
            }
            .pobres-bg-tierra  { background: radial-gradient(ellipse at 50% 100%, rgba(80,40,20,0.60) 0%, rgba(20,15,12,0.92) 70%); }
            .pobres-bg-flama   { background: radial-gradient(ellipse at 50% 100%, rgba(100,20,10,0.62) 0%, rgba(18,10,10,0.93) 70%); }
            .pobres-bg-brasa   { background: radial-gradient(ellipse at 50% 100%, rgba(120,30,10,0.65) 0%, rgba(15,8,6,0.94) 70%); }
            .pobres-bg-rosa    { background: radial-gradient(ellipse at 50% 100%, rgba(140,20,50,0.65) 0%, rgba(14,6,10,0.95) 70%); }
            .pobres-bg-corazon { background: radial-gradient(ellipse at 50% 50%,  rgba(160,10,30,0.70) 0%, rgba(10,4,8,0.97) 70%); }
            .pobres-bg-bio     { background: radial-gradient(ellipse at 50% 50%,  rgba(60,20,70,0.60) 0%, rgba(12,8,18,0.93) 70%); }
            .pobres-bg-intro   { background: radial-gradient(ellipse at 50% 100%, rgba(40,35,30,0.55) 0%, rgba(16,14,12,0.90) 70%); }

            /* When pobres-mode is active, make the page-wrapper transparent
               so the atmospheric background shows through */
            body.pobres-mode #page-wrapper {
                background-color: transparent !important;
                box-shadow: none !important;
                border-color: transparent !important;
            }
            body.pobres-mode #reader-view {
                background-color: transparent !important;
            }
            body.pobres-mode #app-container {
                background-color: #0f0a08;
            }
            /* Ensure poem text stays above the flower layer */
            body.pobres-mode #book-container,
            body.pobres-mode #book,
            body.pobres-mode #page-wrapper,
            body.pobres-mode .page-content,
            body.pobres-mode .content-centerer {
                position: relative;
                z-index: 10;
            }
        `;
        document.head.appendChild(style);
    }

    // Mark body so CSS can make the page-wrapper transparent
    document.body.classList.add('pobres-mode');

    const config = INTENSITIES[effectName] || INTENSITIES['pobres_tierra'];
    const colors = getColorPalette(effectName);

    // Background tint overlay
    const theme = effectName.replace('pobres_', '');
    const bgOverlay = document.createElement('div');
    bgOverlay.className = `pobres-bg-overlay pobres-bg-${theme}`;
    container.appendChild(bgOverlay);

    // Flower overlay
    const overlay = document.createElement('div');
    overlay.className = 'pobres-overlay';
    container.appendChild(overlay);

    // Initial batch of flowers
    for (let i = 0; i < config.count; i++) {
        spawnFlower(overlay, colors, config.bloom, config.speed);
    }

    // Keep spawning flowers over time
    const intervalMs = config.speed === 'slow' ? 3500 :
        config.speed === 'medium' ? 2500 : 1800;

    const interval = setInterval(() => {
        const existing = overlay.querySelectorAll('.pobres-flower').length;
        // Keep a natural density — don't overcrowd
        const maxFlowers = config.count * 3;
        if (existing < maxFlowers) {
            const batch = Math.ceil(config.count / 3);
            for (let i = 0; i < batch; i++) {
                spawnFlower(overlay, colors, config.bloom, config.speed);
            }
        }
        // Prune flowers that have finished animating (opacity 0.75 = done)
        overlay.querySelectorAll('.pobres-flower').forEach(f => {
            const style = window.getComputedStyle(f);
            if (style.animationPlayState === 'finished' || parseFloat(style.opacity) < 0.1) {
                // Leave them — they look like a garden
            }
        });
    }, intervalMs);

    return function cleanup() {
        clearInterval(interval);
        overlay.remove();
        bgOverlay.remove();
        document.body.classList.remove('pobres-mode');
    };
}
