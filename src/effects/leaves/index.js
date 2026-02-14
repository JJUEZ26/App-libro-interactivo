const LEAF_TYPES = [
    {
        name: 'maple',
        path: "M175,300 Q175,250 175,200 L140,220 L150,190 L120,180 L140,160 L110,130 L140,120 L130,90 L160,80 L175,40 L190,80 L220,90 L210,120 L240,130 L210,160 L230,180 L200,190 L210,220 L175,200 Q175,250 175,300 Z",
        veins: [
            "M175,300 L175,40", // Central
            "M175,200 L140,220", "M175,200 L210,220", // Bottom lobes
            "M175,160 L110,130", "M175,160 L240,130", // Middle lobes
            "M175,120 L130,90", "M175,120 L220,90"    // Top lobes
        ],
        colors: [
            { start: '#e74c3c', end: '#c0392b' }, // Red
            { start: '#e67e22', end: '#d35400' }, // Orange
            { start: '#f1c40f', end: '#e67e22' }  // Yellow-Orange
        ],
        viewBox: "0 0 350 350"
    },
    {
        name: 'oak',
        path: "M175,300 C175,280 175,240 175,220 C140,230 110,210 120,180 C110,160 100,140 120,120 C110,100 120,80 140,70 C150,60 175,40 175,40 C175,40 200,60 210,70 C230,80 240,100 230,120 C250,140 240,160 230,180 C240,210 210,230 175,220 C175,240 175,280 175,300 Z",
        veins: [
            "M175,300 L175,40", // Central
            "M175,220 L120,180", "M175,220 L230,180",
            "M175,160 L120,120", "M175,160 L230,120",
            "M175,100 L140,70", "M175,100 L210,70"
        ],
        colors: [
            { start: '#795548', end: '#5d4037' }, // Brown
            { start: '#d35400', end: '#a04000' }, // Rust
            { start: '#a67c52', end: '#8b5e3c' }  // Terracotta
        ],
        viewBox: "0 0 350 350"
    },
    {
        name: 'simple',
        path: "M175,300 C175,280 175,240 175,220 C100,180 120,100 175,30 C230,100 250,180 175,220 C175,240 175,280 175,300 Z",
        veins: [
            "M175,300 L175,30", // Central
            "M175,220 L130,180", "M175,220 L220,180",
            "M175,180 L130,140", "M175,180 L220,140",
            "M175,140 L140,100", "M175,140 L210,100"
        ],
        colors: [
            { start: '#2ecc71', end: '#27ae60' }, // Green
            { start: '#f1c40f', end: '#f39c12' }, // Yellow
            { start: '#e74c3c', end: '#c0392b' }  // Red
        ],
        viewBox: "0 0 350 350"
    }
];

export function createFallingLeaf(container, intensity = 'medium', isFirst = false, startMidAir = false) {
    const leaf = document.createElement('div');
    leaf.className = 'falling-leaf';

    // Profundidad
    const depth = Math.random();
    const size = 30 + (depth * 50); // 30px a 80px (adjusted for images)
    const zIndex = Math.floor(depth * 100);
    const blur = depth < 0.2 ? (0.2 - depth) * 4 : 0;

    // Velocidad
    const baseDuration = (intensity === 'minimal') ? 22 : 15; // Slower for minimal
    const speedMultiplier = 0.6 + (depth * 0.8);

    const startX = Math.random() * 105 - 2.5;
    leaf.style.left = `${startX}%`;
    leaf.style.width = `${size}px`;
    leaf.style.height = `${size}px`;
    leaf.style.zIndex = zIndex;

    if (blur > 0) leaf.style.filter = `blur(${blur}px)`;

    // SVG Selection
    const leafType = LEAF_TYPES[Math.floor(Math.random() * LEAF_TYPES.length)];
    const colorPair = leafType.colors[Math.floor(Math.random() * leafType.colors.length)];
    const uniqueId = `leaf-grad-${Math.random().toString(36).substr(2, 9)}`;

    // Create SVG element
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", leafType.viewBox);
    svg.style.width = '100%';
    svg.style.height = '100%';
    // Add slight rotation to the image itself for variety
    svg.style.transform = `rotate(${Math.random() * 360}deg)`;
    svg.style.overflow = 'visible';

    // Create Gradient Definition
    const defs = document.createElementNS(svgNS, "defs");
    const linearGradient = document.createElementNS(svgNS, "linearGradient");
    linearGradient.setAttribute("id", uniqueId);
    linearGradient.setAttribute("x1", "0%");
    linearGradient.setAttribute("y1", "100%"); // Bottom
    linearGradient.setAttribute("x2", "0%");
    linearGradient.setAttribute("y2", "0%");   // Top

    const stop1 = document.createElementNS(svgNS, "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", colorPair.start);

    const stop2 = document.createElementNS(svgNS, "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", colorPair.end);

    linearGradient.appendChild(stop1);
    linearGradient.appendChild(stop2);
    defs.appendChild(linearGradient);
    svg.appendChild(defs);

    // Create Main Leaf Path
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", leafType.path);
    path.setAttribute("fill", `url(#${uniqueId})`);
    path.setAttribute("stroke", "rgba(0,0,0,0.1)");
    path.setAttribute("stroke-width", "1");
    svg.appendChild(path);

    // Create Veins
    if (leafType.veins) {
        const veinsGroup = document.createElementNS(svgNS, "g");
        leafType.veins.forEach(veinPath => {
            const vPath = document.createElementNS(svgNS, "path");
            vPath.setAttribute("d", veinPath);
            vPath.setAttribute("fill", "none");
            vPath.setAttribute("stroke", "rgba(0,0,0,0.15)"); // Darker than outline
            vPath.setAttribute("stroke-width", "2");
            vPath.setAttribute("stroke-linecap", "round");
            veinsGroup.appendChild(vPath);
        });
        svg.appendChild(veinsGroup);
    }

    leaf.appendChild(svg);

    const fallDuration = baseDuration / speedMultiplier;
    const swayDuration = 3 + Math.random() * 4;
    const swayAmount = 60 + Math.random() * 80;
    const rotationSpeed = 6 + Math.random() * 10;

    // DELAY configuration
    // If startMidAir is true, we use a negative delay to simulate the leaf being already in motion
    let delay = 0;
    let animationDelay = 0;

    if (startMidAir) {
        // Random negative delay between 2s and fallDuration/2
        animationDelay = -1 * (2 + Math.random() * (fallDuration * 0.6));
    } else {
        // Normal stagger
        // If it's minimal intensity, the first leaf has a fixed 3s delay
        if (intensity === 'minimal') {
            delay = 3;
        } else {
            delay = isFirst ? 0 : (0.2 + Math.random() * 1.5);
        }
    }

    leaf.style.setProperty('--fall-duration', `${fallDuration}s`);
    leaf.style.setProperty('--fall-delay', `${delay}s`);
    leaf.style.setProperty('--animation-delay-offset', `${animationDelay}s`); // New variable for negative delay
    leaf.style.setProperty('--sway-amount', `${swayAmount}px`);
    leaf.style.setProperty('--sway-duration', `${swayDuration}s`);
    leaf.style.setProperty('--rotation-speed', `${rotationSpeed}s`);

    // For startMidAir, we need to ensure the animation starts immediately in its cycle
    if (startMidAir) {
        leaf.style.animationDelay = `${animationDelay}s, ${animationDelay}s, ${animationDelay}s`;
    }

    container.appendChild(leaf);

    leaf.addEventListener('animationend', (e) => {
        if (e.animationName === 'leaf-fall') leaf.remove();
    });

    return leaf;
}

export function startLeavesEffect(intensity = 'medium') {
    const overlay = document.createElement('div');
    overlay.className = 'leaves-effect-overlay';
    document.body.appendChild(overlay);

    const settings = {
        'minimal': { interval: 10000, max: 1, initialCount: 0 },
        'low': { interval: 3500, max: 8, initialCount: 1 },
        'medium': { interval: 1800, max: 15, initialCount: 4 },
        'high': { interval: 1000, max: 22, initialCount: 7 },
        'intense': { interval: 500, max: 35, initialCount: 12 }
    };

    const config = settings[intensity] || settings.medium;
    const { interval, max, initialCount } = config;

    let isFirstLeaf = true;

    const spawn = (startMidAir = false) => {
        if (overlay.querySelectorAll('.falling-leaf').length < max) {
            createFallingLeaf(overlay, intensity, isFirstLeaf, startMidAir);
            isFirstLeaf = false;
        }
    };

    // GENERATE INITIAL BATCH (Mid-air)
    for (let i = 0; i < initialCount; i++) {
        spawn(true);
    }

    // Continue spawning normal leaves
    const timer = setInterval(() => spawn(false), interval);

    return () => {
        clearInterval(timer);
        overlay.classList.add('fading-out');
        setTimeout(() => overlay.remove(), 1000);
    };
}
