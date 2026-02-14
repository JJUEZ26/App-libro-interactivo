// ===================================================
// HOJAS DE OTOÑO FOTORREALISTAS — "No Volveré a Ser Joven"
// Usa imágenes WebP con transparencia real.
// Cada hoja es una foto real de hoja otoñal.
// Física natural via requestAnimationFrame.
// ===================================================

// --- IMÁGENES DE HOJAS ---
// 4 fotografías reales de hojas con fondo transparente (WebP, ~7KB cada una)
const LEAF_IMAGES = [
    'images/leaves/hoja_seca_01.webp',
    'images/leaves/hoja_seca_02.webp',
    'images/leaves/hoja_seca_03.webp',
    'images/leaves/hoja_seca_04.webp',
    'images/leaves/hoja_roja_05.webp',
    'images/leaves/hoja_marron_06.webp',
    'images/leaves/hoja_amarilla_07.webp',
];

// Precarga de imágenes para evitar parpadeo
const preloadedImages = [];
let imagesPreloaded = false;

function preloadLeafImages() {
    if (imagesPreloaded) return Promise.resolve();

    return new Promise((resolve) => {
        let loaded = 0;
        LEAF_IMAGES.forEach((src, idx) => {
            const img = new Image();
            img.onload = () => {
                preloadedImages[idx] = img;
                loaded++;
                if (loaded === LEAF_IMAGES.length) {
                    imagesPreloaded = true;
                    resolve();
                }
            };
            img.onerror = () => {
                loaded++;
                if (loaded === LEAF_IMAGES.length) {
                    imagesPreloaded = true;
                    resolve();
                }
            };
            img.src = src;
        });
    });
}


// --- SISTEMA DE RENDIMIENTO ---
function getPerformanceScale() {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return 0.3;
    if (memory <= 2 || cores <= 2) return 0.55;
    if (memory <= 4 || cores <= 4) return 0.75;
    return 1;
}


// --- FÍSICA NATURAL DE CAÍDA ---

function createNaturalFallAnimation(leaf, options = {}) {
    const {
        fallDuration = 18,
        delay = 0,
        startMidAir = false
    } = options;

    // Parámetros únicos para cada hoja
    const swayAmplitude = 30 + Math.random() * 70;
    const swayFrequency = 0.3 + Math.random() * 0.4;
    const driftDirection = Math.random() > 0.5 ? 1 : -1;
    const driftAmount = 10 + Math.random() * 35;
    const turbulence = Math.random() * 0.3;

    // Rotación
    const rotStart = Math.random() * 360;
    const rotEnd = rotStart + (Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 240);

    // Flip 3D — simula ver la hoja desde distintos ángulos
    const flipFrequency = 1.5 + Math.random() * 2;
    const flipMaxAngle = 40 + Math.random() * 30;

    let startTime = null;
    let animFrameId = null;
    const totalDuration = fallDuration * 1000;
    const effectiveDelay = startMidAir ? 0 : delay * 1000;
    const initialProgress = startMidAir ? (0.1 + Math.random() * 0.5) : 0;

    // Pausas aleatorias — momentos donde la hoja "flota"
    const pauseMoments = [];
    const pauseCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < pauseCount; i++) {
        pauseMoments.push({
            start: 0.15 + Math.random() * 0.6,
            duration: 0.02 + Math.random() * 0.04
        });
    }

    function easeOutQuad(t) {
        return 1 - (1 - t) * (1 - t);
    }

    function animate(timestamp) {
        if (!startTime) startTime = timestamp + effectiveDelay;

        if (timestamp < startTime) {
            leaf.style.opacity = '0';
            animFrameId = requestAnimationFrame(animate);
            return;
        }

        const elapsed = timestamp - startTime;
        let progress = initialProgress + (elapsed / totalDuration) * (1 - initialProgress);

        if (progress >= 1) {
            leaf.style.opacity = '0';
            setTimeout(() => leaf.remove(), 100);
            return;
        }

        // Posición vertical (top -> bottom con curva natural)
        const verticalProgress = easeOutQuad(progress);
        const topPercent = -10 + verticalProgress * 120;

        // Vaivén horizontal con turbulencia
        const swayBase = Math.sin(progress * Math.PI * 2 * swayFrequency * 3) * swayAmplitude;
        const turbulenceOffset = Math.sin(progress * 17 + turbulence * 100) * turbulence * 20;
        const drift = progress * driftAmount * driftDirection;
        const totalX = swayBase + turbulenceOffset + drift;

        // Rotación 2D
        const rotation = rotStart + (rotEnd - rotStart) * progress;

        // Flip 3D (simulando que la hoja gira sobre sí misma)
        const flipY = Math.sin(progress * Math.PI * flipFrequency) * flipMaxAngle;
        const flipX = Math.sin(progress * Math.PI * flipFrequency * 0.7 + 1.2) * (flipMaxAngle * 0.5);

        // Opacidad
        let opacity = 1;
        if (progress < 0.06) {
            opacity = progress / 0.06;
        } else if (progress > 0.9) {
            opacity = (1 - progress) / 0.1;
        }

        // Escala sutil (se encoge leve al alejarse)
        const scale = 1 - progress * 0.05;

        // Aplicar transformaciones
        leaf.style.top = `${topPercent}vh`;
        leaf.style.transform = `translateX(${totalX}px) rotate(${rotation}deg) perspective(400px) rotateX(${flipX}deg) rotateY(${flipY}deg) scale(${scale})`;
        leaf.style.opacity = `${Math.max(0, opacity)}`;

        animFrameId = requestAnimationFrame(animate);
    }

    animFrameId = requestAnimationFrame(animate);

    return () => {
        if (animFrameId) cancelAnimationFrame(animFrameId);
    };
}


// --- API PÚBLICA ---

export function createFallingLeaf(container, intensity = 'medium', isFirst = false, startMidAir = false) {
    const leaf = document.createElement('div');
    leaf.className = 'falling-leaf';

    // Profundidad visual (perspectiva / tamaño)
    const depth = Math.random();
    const baseSize = intensity === 'minimal' ? 32 : 40;
    const sizeRange = intensity === 'minimal' ? 28 : 38;
    const size = baseSize + depth * sizeRange;
    const zIndex = Math.floor(10 + depth * 90);
    const blur = depth < 0.12 ? (0.12 - depth) * 5 : 0;

    leaf.style.left = `${Math.random() * 100}%`;
    leaf.style.width = `${size}px`;
    leaf.style.height = `${size}px`;
    leaf.style.zIndex = `${zIndex}`;
    leaf.style.position = 'absolute';
    leaf.style.top = '-10vh';
    leaf.style.pointerEvents = 'none';
    leaf.style.willChange = 'transform, top, opacity';

    // Seleccionar imagen aleatoria
    const imgIndex = Math.floor(Math.random() * LEAF_IMAGES.length);

    const img = document.createElement('img');
    img.src = LEAF_IMAGES[imgIndex];
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.draggable = false;
    img.style.display = 'block';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.pointerEvents = 'none';
    img.style.userSelect = 'none';

    // Sombra natural + blur de profundidad
    const filterParts = ['drop-shadow(1px 3px 4px rgba(20,10,5,0.35))'];
    if (blur > 0) filterParts.push(`blur(${blur}px)`);

    // Variación de color sutil (para que hojas del mismo tipo se vean distintas)
    const hueShift = -15 + Math.random() * 30;
    const saturation = 85 + Math.random() * 30;
    const brightness = 85 + Math.random() * 30;
    filterParts.push(`hue-rotate(${hueShift}deg)`);
    filterParts.push(`saturate(${saturation}%)`);
    filterParts.push(`brightness(${brightness}%)`);

    leaf.style.filter = filterParts.join(' ');

    leaf.appendChild(img);
    container.appendChild(leaf);

    // Configurar caída
    const durationMap = {
        minimal: 28 + Math.random() * 10,
        low: 20 + Math.random() * 8,
        medium: 16 + Math.random() * 6,
        high: 13 + Math.random() * 5,
        intense: 10 + Math.random() * 4
    };

    const fallDuration = (durationMap[intensity] || durationMap.medium) / (0.6 + depth * 0.4);

    let delay = 0;
    if (!startMidAir) {
        if (intensity === 'minimal') {
            delay = isFirst ? 1 : 4 + Math.random() * 3;
        } else {
            delay = isFirst ? 0 : 0.3 + Math.random() * 1.5;
        }
    }

    // Iniciar animación con física natural
    const cancelAnim = createNaturalFallAnimation(leaf, {
        fallDuration,
        delay,
        startMidAir
    });

    leaf._cancelAnim = cancelAnim;
    return leaf;
}

export function startLeavesEffect(intensity = 'medium') {
    // Precargar imágenes antes de crear hojas
    preloadLeafImages();

    const overlay = document.createElement('div');
    overlay.className = 'leaves-effect-overlay';
    (document.getElementById('app-container') || document.body).appendChild(overlay);

    const settings = {
        minimal: { interval: 12000, max: 2, initialCount: 0 },
        low: { interval: 4000, max: 6, initialCount: 1 },
        medium: { interval: 2200, max: 12, initialCount: 3 },
        high: { interval: 1200, max: 18, initialCount: 5 },
        intense: { interval: 700, max: 28, initialCount: 8 }
    };

    const config = settings[intensity] || settings.medium;
    const scale = getPerformanceScale();
    const interval = Math.round(config.interval / Math.max(scale, 0.35));
    const max = Math.max(1, Math.round(config.max * scale));
    const initialCount = Math.max(0, Math.round(config.initialCount * scale));

    let isFirstLeaf = true;
    let isDestroyed = false;

    const spawn = (startMidAir = false) => {
        if (isDestroyed) return;
        if (overlay.querySelectorAll('.falling-leaf').length < max) {
            createFallingLeaf(overlay, intensity, isFirstLeaf, startMidAir);
            isFirstLeaf = false;
        }
    };

    // Hojas iniciales ya en el aire
    for (let i = 0; i < initialCount; i++) spawn(true);

    // Spawn continuo
    const timer = setInterval(() => spawn(false), interval);

    // Cleanup
    return () => {
        isDestroyed = true;
        clearInterval(timer);
        overlay.classList.add('fading-out');
        overlay.querySelectorAll('.falling-leaf').forEach(leaf => {
            if (leaf._cancelAnim) leaf._cancelAnim();
        });
        setTimeout(() => overlay.remove(), 1200);
    };
}
