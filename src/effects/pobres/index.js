/**
 * Efecto "Como aman los pobres" (version sobria).
 * Menos literal, menos infantil, mas atmosferico.
 */

const FLOWER_COLORS = {
    tierra: ['#6f4a35', '#8a5a3f', '#a06a4c', '#b78a66'],
    flama: ['#8f3e35', '#aa4e43', '#c45b49', '#7d352f'],
    brasa: ['#b55735', '#cb6a3c', '#dd7d46', '#9b462a'],
    rosa: ['#973e55', '#ad4d64', '#c06374', '#7f344a'],
    bio: ['#5f3b5f', '#744772', '#8a5484', '#4f2f4f'],
    intro: ['#4f4f4f', '#636363', '#767676', '#8a8a8a'],
    corazon: ['#8f2c3f', '#a83649', '#c24a58', '#772634']
};

const INTENSITIES = {
    pobres_intro: { count: 2, speed: 'slow', bloom: 'small' },
    pobres_tierra: { count: 3, speed: 'slow', bloom: 'small' },
    pobres_flama: { count: 5, speed: 'medium', bloom: 'medium' },
    pobres_brasa: { count: 7, speed: 'medium', bloom: 'medium' },
    pobres_rosa: { count: 9, speed: 'fast', bloom: 'large' },
    pobres_corazon: { count: 11, speed: 'fast', bloom: 'large' },
    pobres_bio: { count: 4, speed: 'slow', bloom: 'medium' }
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

function isMobileViewport() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Draws a more abstract "bloom" so the look feels less cartoonish.
 */
function createFlowerSVG(color, size) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size * 1.7);
    svg.setAttribute('viewBox', `0 0 ${size} ${size * 1.7}`);
    svg.style.overflow = 'visible';

    const cx = size / 2;
    const topY = size * 0.52;
    const stemBottomY = size * 1.68;

    const stem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const stemDrift = (Math.random() - 0.5) * size * 0.16;
    stem.setAttribute(
        'd',
        `M ${cx} ${stemBottomY} Q ${cx + stemDrift} ${size * 1.1} ${cx + stemDrift * 0.8} ${topY + size * 0.12}`
    );
    stem.setAttribute('stroke', 'rgba(115, 92, 72, 0.48)');
    stem.setAttribute('stroke-width', Math.max(1, size * 0.035));
    stem.setAttribute('stroke-linecap', 'round');
    stem.setAttribute('fill', 'none');
    svg.appendChild(stem);

    const petalCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < petalCount; i += 1) {
        const angle = (i / petalCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.28;
        const radius = size * (0.18 + Math.random() * 0.09);
        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        const px = cx + Math.cos(angle) * radius * 0.8;
        const py = topY + Math.sin(angle) * radius * 0.6;

        petal.setAttribute('cx', px);
        petal.setAttribute('cy', py);
        petal.setAttribute('rx', String(size * (0.15 + Math.random() * 0.04)));
        petal.setAttribute('ry', String(size * (0.25 + Math.random() * 0.06)));
        petal.setAttribute('fill', color);
        petal.setAttribute('opacity', String(0.26 + Math.random() * 0.26));
        petal.setAttribute('transform', `rotate(${(angle * 180) / Math.PI}, ${px}, ${py})`);
        svg.appendChild(petal);
    }

    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    halo.setAttribute('cx', String(cx));
    halo.setAttribute('cy', String(topY));
    halo.setAttribute('r', String(size * 0.2));
    halo.setAttribute('fill', color);
    halo.setAttribute('opacity', '0.16');
    svg.appendChild(halo);

    return svg;
}

function spawnFlower(overlay, colors, sizeConfig, speedConfig) {
    const wrapper = document.createElement('div');
    wrapper.className = 'pobres-flower';

    const x = 4 + Math.random() * 92;
    const delay = Math.random() * 5000;
    wrapper.style.left = `${x}%`;
    wrapper.style.bottom = `${-2 + Math.random() * 6}%`;

    const color = colors[Math.floor(Math.random() * colors.length)];
    const size =
        sizeConfig === 'small'
            ? 10 + Math.random() * 7
            : sizeConfig === 'medium'
                ? 14 + Math.random() * 10
                : 18 + Math.random() * 12;

    wrapper.appendChild(createFlowerSVG(color, size));

    const duration =
        speedConfig === 'slow'
            ? 6 + Math.random() * 2
            : speedConfig === 'medium'
                ? 4.8 + Math.random() * 2
                : 3.8 + Math.random() * 1.6;

    wrapper.style.setProperty('--bloom-duration', `${duration}s`);
    wrapper.style.setProperty('--flower-delay', `${delay}ms`);
    wrapper.style.setProperty('--flower-tilt', `${(Math.random() - 0.5) * 10}deg`);
    wrapper.style.setProperty('--flower-drift', `${(Math.random() - 0.5) * 8}px`);

    overlay.appendChild(wrapper);
}

/**
 * Starts the atmospheric effect for "Como aman los pobres".
 */
export function startPobresEffect(effectName) {
    const container = document.getElementById('app-container') || document.body;

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
                animation-name: flowerBloom, flowerSway;
                animation-duration: var(--bloom-duration, 5s), calc(var(--bloom-duration, 5s) * 1.8);
                animation-delay: var(--flower-delay, 0ms), var(--flower-delay, 0ms);
                animation-timing-function: ease-out, ease-in-out;
                animation-fill-mode: forwards, both;
                animation-iteration-count: 1, infinite;
                animation-direction: normal, alternate;
                opacity: 0;
                z-index: 3;
                filter: saturate(0.78) blur(0.35px);
            }
            @keyframes flowerBloom {
                0% {
                    opacity: 0;
                    transform: scale(0.65) rotate(var(--flower-tilt, 0deg)) translateY(18px);
                }
                45% {
                    opacity: 0.54;
                }
                100% {
                    opacity: 0.32;
                    transform: scale(1) rotate(var(--flower-tilt, 0deg)) translateY(0);
                }
            }
            @keyframes flowerSway {
                0% {
                    transform: translateX(calc(var(--flower-drift, 0px) * -0.35)) rotate(calc(var(--flower-tilt, 0deg) * -0.35));
                }
                100% {
                    transform: translateX(var(--flower-drift, 0px)) rotate(var(--flower-tilt, 0deg));
                }
            }

            .pobres-bg-overlay {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 2;
                transition: background 1.3s ease, opacity 0.6s ease;
            }

            .pobres-bg-tierra {
                background:
                    linear-gradient(180deg, rgba(10, 9, 8, 0.7) 0%, rgba(15, 11, 9, 0.88) 45%, rgba(28, 16, 12, 0.86) 100%),
                    radial-gradient(120% 74% at 50% 112%, rgba(125, 76, 42, 0.28) 0%, rgba(24, 13, 10, 0) 74%);
            }
            .pobres-bg-flama {
                background:
                    linear-gradient(180deg, rgba(10, 8, 8, 0.72) 0%, rgba(17, 10, 9, 0.9) 46%, rgba(33, 13, 11, 0.88) 100%),
                    radial-gradient(120% 72% at 50% 112%, rgba(150, 60, 35, 0.3) 0%, rgba(26, 12, 11, 0) 74%);
            }
            .pobres-bg-brasa {
                background:
                    linear-gradient(180deg, rgba(11, 8, 7, 0.74) 0%, rgba(19, 10, 8, 0.92) 46%, rgba(41, 17, 10, 0.88) 100%),
                    radial-gradient(120% 70% at 50% 112%, rgba(180, 88, 40, 0.3) 0%, rgba(30, 14, 9, 0) 74%);
            }
            .pobres-bg-rosa {
                background:
                    linear-gradient(180deg, rgba(11, 8, 10, 0.75) 0%, rgba(20, 10, 14, 0.93) 46%, rgba(38, 13, 23, 0.9) 100%),
                    radial-gradient(120% 70% at 50% 112%, rgba(173, 73, 101, 0.31) 0%, rgba(24, 10, 14, 0) 74%);
            }
            .pobres-bg-corazon {
                background:
                    linear-gradient(180deg, rgba(12, 7, 9, 0.78) 0%, rgba(20, 9, 12, 0.95) 46%, rgba(40, 12, 18, 0.92) 100%),
                    radial-gradient(110% 62% at 50% 110%, rgba(188, 52, 78, 0.34) 0%, rgba(24, 9, 13, 0) 72%);
            }
            .pobres-bg-bio {
                background:
                    linear-gradient(180deg, rgba(11, 9, 12, 0.72) 0%, rgba(16, 10, 18, 0.9) 45%, rgba(28, 15, 32, 0.86) 100%),
                    radial-gradient(112% 66% at 50% 108%, rgba(112, 69, 130, 0.28) 0%, rgba(18, 12, 21, 0) 74%);
            }
            .pobres-bg-intro {
                background:
                    linear-gradient(180deg, rgba(11, 10, 9, 0.68) 0%, rgba(17, 14, 12, 0.86) 45%, rgba(24, 20, 18, 0.8) 100%),
                    radial-gradient(120% 74% at 50% 112%, rgba(116, 102, 88, 0.22) 0%, rgba(18, 15, 13, 0) 74%);
            }

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
            body.pobres-mode #book-container,
            body.pobres-mode #book,
            body.pobres-mode #page-wrapper,
            body.pobres-mode .page-content,
            body.pobres-mode .content-centerer {
                position: relative;
                z-index: 10;
            }

            @media (max-width: 768px) {
                .pobres-overlay {
                    opacity: 0.78;
                }
                .pobres-bg-overlay {
                    opacity: 0.88;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.classList.add('pobres-mode');

    const config = INTENSITIES[effectName] || INTENSITIES.pobres_tierra;
    const colors = getColorPalette(effectName);
    const mobileFactor = isMobileViewport() ? 0.72 : 1;
    const motionFactor = prefersReducedMotion() ? 0.45 : 1;
    const densityFactor = mobileFactor * motionFactor;
    const spawnCount = Math.max(2, Math.round(config.count * densityFactor));

    const theme = effectName.replace('pobres_', '');
    const bgOverlay = document.createElement('div');
    bgOverlay.className = `pobres-bg-overlay pobres-bg-${theme}`;
    container.appendChild(bgOverlay);

    const overlay = document.createElement('div');
    overlay.className = 'pobres-overlay';
    container.appendChild(overlay);

    for (let i = 0; i < spawnCount; i += 1) {
        spawnFlower(overlay, colors, config.bloom, config.speed);
    }

    const baseInterval = config.speed === 'slow' ? 4200 : config.speed === 'medium' ? 3000 : 2200;
    const intervalMs = Math.round(baseInterval * (isMobileViewport() ? 1.28 : 1) * (prefersReducedMotion() ? 1.65 : 1));

    const interval = setInterval(() => {
        const existing = overlay.querySelectorAll('.pobres-flower').length;
        const maxFlowers = Math.max(6, spawnCount * 2);
        if (existing < maxFlowers) {
            const batch = Math.max(1, Math.ceil(spawnCount / 4));
            for (let i = 0; i < batch; i += 1) {
                spawnFlower(overlay, colors, config.bloom, config.speed);
            }
        }
    }, intervalMs);

    return function cleanup() {
        clearInterval(interval);
        overlay.remove();
        bgOverlay.remove();
        document.body.classList.remove('pobres-mode');
    };
}
