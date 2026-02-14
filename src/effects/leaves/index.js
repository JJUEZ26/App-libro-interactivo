const LEAF_TYPES = [
    {
        name: 'maple-red',
        path: 'M175 316 C171 287 170 255 173 224 C154 235 131 242 113 230 C120 214 118 197 101 189 C116 179 122 162 119 146 C138 148 154 138 164 120 C149 110 138 94 137 76 C157 84 174 79 188 63 C198 79 214 84 233 76 C232 96 222 111 207 121 C219 136 235 146 252 145 C248 163 254 180 269 190 C252 198 246 215 255 231 C236 243 213 235 195 223 C198 254 197 287 191 316 Z',
        stem: 'M182 316 C178 334 179 348 183 364',
        colors: [
            { start: '#8f2f1f', end: '#cf5b31' },
            { start: '#9b3a1d', end: '#dd7c33' }
        ],
        viewBox: '70 45 220 330'
    },
    {
        name: 'oak-dry',
        path: 'M173 315 C171 286 170 252 174 224 C147 227 123 212 126 186 C111 171 108 146 125 126 C118 104 129 82 151 72 C164 57 178 50 187 50 C196 50 210 57 223 72 C246 83 257 104 249 126 C266 146 263 171 248 186 C251 212 227 228 200 224 C204 252 203 286 201 315 Z',
        stem: 'M186 315 C184 334 184 347 190 363',
        colors: [
            { start: '#6d3b25', end: '#a26036' },
            { start: '#5f3423', end: '#8a5335' }
        ],
        viewBox: '95 40 190 330'
    },
    {
        name: 'elm-brown',
        path: 'M178 322 C170 289 170 255 173 222 C141 212 118 182 120 145 C124 109 148 78 176 61 C204 78 228 109 232 145 C234 182 211 212 179 222 C183 255 184 289 178 322 Z',
        stem: 'M178 322 C176 338 176 350 181 364',
        colors: [
            { start: '#7f4a2f', end: '#b77742' },
            { start: '#6f422b', end: '#a86b3c' }
        ],
        veins: [
            'M176 71 L176 319',
            'M176 130 L142 160',
            'M176 130 L210 160',
            'M176 180 L139 207',
            'M176 180 L213 207'
        ],
        viewBox: '105 50 150 320'
    }
];

function getPerformanceScale() {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return 0.45;
    if (memory <= 2 || cores <= 4) return 0.7;
    return 1;
}

export function createFallingLeaf(container, intensity = 'medium', isFirst = false, startMidAir = false) {
    const leaf = document.createElement('div');
    leaf.className = 'falling-leaf';

    const depth = Math.random();
    const size = 24 + depth * 42;
    const zIndex = Math.floor(20 + depth * 80);
    const blur = depth < 0.18 ? (0.18 - depth) * 5 : 0;

    const baseDuration = intensity === 'minimal' ? 26 : 16;
    const speedMultiplier = 0.58 + depth * 0.9;

    leaf.style.left = `${Math.random() * 108 - 4}%`;
    leaf.style.width = `${size}px`;
    leaf.style.height = `${size}px`;
    leaf.style.zIndex = `${zIndex}`;
    leaf.style.opacity = `${0.5 + depth * 0.45}`;
    if (blur > 0) leaf.style.filter = `blur(${blur}px)`;

    const leafType = LEAF_TYPES[Math.floor(Math.random() * LEAF_TYPES.length)];
    const colorPair = leafType.colors[Math.floor(Math.random() * leafType.colors.length)];
    const uniqueId = `leaf-grad-${Math.random().toString(36).slice(2, 11)}`;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', leafType.viewBox);
    svg.setAttribute('aria-hidden', 'true');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.transform = `rotate(${Math.random() * 360}deg)`;

    const defs = document.createElementNS(svgNS, 'defs');
    const linearGradient = document.createElementNS(svgNS, 'linearGradient');
    linearGradient.setAttribute('id', uniqueId);
    linearGradient.setAttribute('x1', '0%');
    linearGradient.setAttribute('y1', '100%');
    linearGradient.setAttribute('x2', '0%');
    linearGradient.setAttribute('y2', '0%');

    const stop1 = document.createElementNS(svgNS, 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', colorPair.start);

    const stop2 = document.createElementNS(svgNS, 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', colorPair.end);

    linearGradient.append(stop1, stop2);
    defs.appendChild(linearGradient);
    svg.appendChild(defs);

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', leafType.path);
    path.setAttribute('fill', `url(#${uniqueId})`);
    path.setAttribute('stroke', 'rgba(44, 24, 18, 0.28)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);

    if (leafType.veins) {
        const veinsGroup = document.createElementNS(svgNS, 'g');
        leafType.veins.forEach((veinPath) => {
            const vPath = document.createElementNS(svgNS, 'path');
            vPath.setAttribute('d', veinPath);
            vPath.setAttribute('fill', 'none');
            vPath.setAttribute('stroke', 'rgba(55, 33, 20, 0.18)');
            vPath.setAttribute('stroke-width', '2');
            vPath.setAttribute('stroke-linecap', 'round');
            veinsGroup.appendChild(vPath);
        });
        svg.appendChild(veinsGroup);
    }

    if (leafType.stem) {
        const stem = document.createElementNS(svgNS, 'path');
        stem.setAttribute('d', leafType.stem);
        stem.setAttribute('fill', 'none');
        stem.setAttribute('stroke', '#4b2b1a');
        stem.setAttribute('stroke-width', '3');
        stem.setAttribute('stroke-linecap', 'round');
        svg.appendChild(stem);
    }

    leaf.appendChild(svg);

    const fallDuration = baseDuration / speedMultiplier;
    const swayDuration = 3 + Math.random() * 5;
    const flutterDuration = 2.5 + Math.random() * 3;
    const swayAmount = 45 + Math.random() * 95;
    const tiltAmount = 8 + Math.random() * 14;
    const rotationSpeed = 8 + Math.random() * 10;

    let delay = 0;
    let animationDelay = 0;

    if (startMidAir) {
        animationDelay = -(1.5 + Math.random() * (fallDuration * 0.65));
    } else if (intensity === 'minimal') {
        delay = 3;
    } else {
        delay = isFirst ? 0 : 0.2 + Math.random() * 1.4;
    }

    leaf.style.setProperty('--fall-duration', `${fallDuration}s`);
    leaf.style.setProperty('--fall-delay', `${delay}s`);
    leaf.style.setProperty('--sway-amount', `${swayAmount}px`);
    leaf.style.setProperty('--tilt-amount', `${tiltAmount}deg`);
    leaf.style.setProperty('--sway-duration', `${swayDuration}s`);
    leaf.style.setProperty('--flutter-duration', `${flutterDuration}s`);
    leaf.style.setProperty('--rotation-speed', `${rotationSpeed}s`);

    if (startMidAir) {
        leaf.style.animationDelay = `${animationDelay}s, ${animationDelay}s`;
        svg.style.animationDelay = `${animationDelay}s, ${animationDelay}s`;
    }

    container.appendChild(leaf);

    leaf.addEventListener('animationend', (event) => {
        if (event.animationName === 'leaf-fall') leaf.remove();
    });

    return leaf;
}

export function startLeavesEffect(intensity = 'medium') {
    const overlay = document.createElement('div');
    overlay.className = 'leaves-effect-overlay';
    document.body.appendChild(overlay);

    const settings = {
        minimal: { interval: 10000, max: 1, initialCount: 0 },
        low: { interval: 3400, max: 8, initialCount: 1 },
        medium: { interval: 1800, max: 14, initialCount: 4 },
        high: { interval: 1100, max: 20, initialCount: 6 },
        intense: { interval: 650, max: 30, initialCount: 10 }
    };

    const config = settings[intensity] || settings.medium;
    const scale = getPerformanceScale();
    const interval = Math.round(config.interval / Math.max(scale, 0.45));
    const max = Math.max(1, Math.round(config.max * scale));
    const initialCount = Math.max(0, Math.round(config.initialCount * scale));

    let isFirstLeaf = true;

    const spawn = (startMidAir = false) => {
        if (overlay.querySelectorAll('.falling-leaf').length < max) {
            createFallingLeaf(overlay, intensity, isFirstLeaf, startMidAir);
            isFirstLeaf = false;
        }
    };

    for (let i = 0; i < initialCount; i += 1) spawn(true);

    const timer = setInterval(() => spawn(false), interval);

    return () => {
        clearInterval(timer);
        overlay.classList.add('fading-out');
        setTimeout(() => overlay.remove(), 1000);
    };
}
