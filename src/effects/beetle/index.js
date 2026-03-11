// SVG del escarabajo como string para inyectarlo fácilmente
const beetleSVG = `
<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; overflow: visible;" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5)) drop-shadow(0 0 10px rgba(185, 70, 245, 0.15))">
    <defs>
        <linearGradient id="beetle-shell" x1="0%" y1="0%" x2="100%" y2="100%">
            <!-- Iridescent chitin color: deep violet to black -->
            <stop offset="0%" stop-color="#3b2d4a" />
            <stop offset="40%" stop-color="#14141e" />
            <stop offset="100%" stop-color="#050508" />
        </linearGradient>
        <mask id="chitin-texture">
            <rect x="0" y="0" width="500" height="500" fill="white" />
            <path d="M150,295 C180,290 250,285 310,305" stroke="black" stroke-width="1.5" fill="none" />
            <path d="M315,260 C330,280 330,310 315,335" stroke="black" stroke-width="2" fill="none" />
            <path d="M350,295 C355,305 355,315 350,325" stroke="black" stroke-width="1.5" fill="none" />
            <g fill="black" opacity="0.6">
                <circle cx="160" cy="300" r="1.5" /> <circle cx="220" cy="270" r="2" />
                <circle cx="320" cy="280" r="1" /> <circle cx="330" cy="300" r="1.5" />
                <path d="M170,290 L180,288 M250,270 L260,268" stroke="black" stroke-width="0.5" />
            </g>
            <path d="M360,300 L370,305 L362,312 Z" fill="black" />
        </mask>
    </defs>
    <g id="beetle-group" fill="url(#beetle-shell)" stroke="#11111a" stroke-linecap="round" stroke-linejoin="round">
        <g id="legs-far" opacity="0.85" fill="none" stroke="#1c1c28">
            <g class="leg-group tripod-b"><path d="M180,320 L150,350 L140,380" stroke-width="4" /><path d="M140,380 L130,385" stroke-width="1" /></g>
            <g class="leg-group tripod-a" transform-origin="center"><path d="M240,320 L230,360 L225,390" stroke-width="4" /></g>
            <g class="leg-group tripod-b"><path d="M310,320 L320,350 L330,375" stroke-width="4" /></g>
        </g>
        <g id="body" stroke="none" mask="url(#chitin-texture)">
            <path d="M110,295 C110,250 160,230 240,240 C300,245 325,270 325,295 C325,330 280,355 200,350 C150,345 110,330 110,295 Z" />
            <path d="M305,255 Q360,260 365,295 Q365,335 320,345 Q290,325 305,255 Z" />
            <path d="M350,290 C370,285 395,300 390,325 C385,335 365,335 355,325 Z" />
            <path d="M390,310 L405,305 L398,318 Z" />
            <path d="M388,325 L400,335 L392,338 Z" />
        </g>
        <g id="antennae" fill="none" stroke-width="1.5" stroke="#222233">
            <path d="M370,300 C390,280 440,280 460,250" opacity="0.6" />
            <path d="M375,310 L385,305 L400,295 L415,280 L430,260 L440,240" stroke-width="2" stroke-linecap="butt" stroke-linejoin="bevel" />
        </g>
        <g id="legs-near" stroke="none" fill="#14141e">
            <g id="leg-rear" class="leg-group tripod-a">
                <path d="M190,320 C170,310 140,300 130,330 C125,340 135,350 150,340 Z" />
                <path d="M132,335 L100,370 L105,372 L138,340 Z" />
                <path d="M120,350 L115,345 L122,352 Z" /> <path d="M110,360 L105,355 L112,362 Z" /> <path d="M100,370 L90,385 L95,385 Z" />
            </g>
            <g id="leg-mid" class="leg-group tripod-b">
                <path d="M250,330 C260,310 270,300 280,330 C285,340 275,350 260,345 Z" />
                <path d="M278,335 L290,380 L294,378 L282,335 Z" />
                <path d="M282,350 L288,352 L280,355 Z" /> <path d="M286,365 L292,367 L284,370 Z" /> <path d="M290,380 L295,395 L298,393 Z" />
            </g>
            <g id="leg-front" class="leg-group tripod-a">
                <path d="M320,330 C330,300 360,290 375,310 C380,315 370,325 360,320 Z" />
                <path d="M372,312 L400,340 L403,337 L376,308 Z" />
                <path d="M385,325 L390,320 L388,328 Z" /> <path d="M395,335 L400,330 L398,338 Z" /> <path d="M400,340 L410,345 L412,350 L408,342 Z" />
            </g>
        </g>
    </g>
</svg>
`;

/**
 * Obtiene la posición central del orb G (hogar del escarabajo)
 */
function getOrbPosition() {
    const orb = document.querySelector('.command-orb__primary') || document.getElementById('command-orb');
    if (!orb) return null;
    const rect = orb.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

export function initBeetle({ getHideTarget, onCleanup, maxLifetimeMs } = {}) {
    console.log('🪲 [Beetle] Intentando inicializar...');

    // 1. Evitar duplicados
    if (document.getElementById('beetle-container')) {
        console.log('🪲 [Beetle] Ya existe uno, abortando.');
        return () => {};
    }

    // 2. Crear el contenedor (15% más pequeño: 120 → 102)
    const BEETLE_SIZE = 102;
    const BEETLE_HALF = BEETLE_SIZE / 2;
    const container = document.createElement('div');
    container.id = 'beetle-container';
    container.innerHTML = beetleSVG;
    
    // --- ESTILOS DE SEGURIDAD (JS) ---
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = BEETLE_SIZE + 'px';
    container.style.height = BEETLE_SIZE + 'px';
    // Con z-index 9989 nos aseguramos que quede POR DEBAJO del command-orb (que usa 9990)
    // Así da la impresión de que sale o entra DENTRO de la G.
    container.style.zIndex = '9989';
    container.style.pointerEvents = 'auto';
    container.style.cursor = 'pointer';
    container.style.opacity = '0';
    container.style.transform = 'scale(0.1)';
    // ----------------------------------

    document.body.appendChild(container);
    console.log('🪲 [Beetle] Añadido al DOM correctamente (Z-Index 9989).');

    // 3. Variables de estado
    const orbPos = getOrbPosition();
    const originX = orbPos ? orbPos.x : window.innerWidth - 40;
    const originY = orbPos ? orbPos.y : window.innerHeight - 40;
    
    // Rotación de salida: Hacia afuera de la G (ángulo aleatorio, pero tendiendo a subir/izquierda)
    let rotation = orbPos ? (180 + Math.random() * 90) : Math.random() * 360;
    
    // El objetivo actual al terminar de emerger (a unos pocos píxeles de la G)
    let x = originX + Math.cos(rotation * Math.PI / 180) * 45;
    let y = originY + Math.sin(rotation * Math.PI / 180) * 45;
    
    let targetX = x;
    let targetY = y;
    let speed = 0;
    let maxSpeed = 3;
    let state = 'emerging'; // 'emerging' | 'sniffing' | 'idle' | 'moving' | 'hesitating' | 'fleeing' | 'returning'
    let timer = 0;
    let hideTimeout = null;
    let lifetimeTimeout = null;
    let requestID;
    let sniffCount = 0;
    let emergeProgress = 0;

    // Función auxiliar para puntos aleatorios (no demasiado lejos del centro)
    function getRandomPoint() {
        const padding = 80; 
        return {
            x: padding + Math.random() * (window.innerWidth - padding * 2),
            y: padding + Math.random() * (window.innerHeight - padding * 2)
        };
    }

    // Función para que el escarabajo "olfatee" — pequeños giros rápidos
    function sniffAnimation() {
        container.classList.add('sniffing');
        // Después de un rato quitar la clase
        setTimeout(() => container.classList.remove('sniffing'), 800);
    }

    // 4. Lógica de click: CORRER DE VUELTA A LA G
    container.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state === 'fleeing' || state === 'returning') return;

        console.log('🪲 [Beetle] ¡Click! Corriendo a casa (G).');
        state = 'returning';
        container.classList.add('fleeing', 'walking', 'scared');

        // Vibración táctil sutil
        if (navigator.vibrate) navigator.vibrate(15);

        // Destino: el orb G
        const currentOrbPos = getOrbPosition();
        if (currentOrbPos) {
            targetX = currentOrbPos.x;
            targetY = currentOrbPos.y;
        } else {
            // Fallback: esquina inferior derecha
            targetX = window.innerWidth - 30;
            targetY = window.innerHeight - 30;
        }
        maxSpeed = 14;
    });

    // 5. Bucle de animación
    function update() {
        if (!document.body.contains(container)) return; 

        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // ===== ESTADO: EMERGING (saliendo tímidamente de la G) =====
        if (state === 'emerging') {
            emergeProgress += 0.012; // Un poco más lento, para disfrutar el deslizamiento
            
            // Función de suavizado para el movimiento
            const easeOut = 1 - Math.pow(1 - emergeProgress, 3);
            
            // Va desde el centro (originX) hacia afuera (x, y calculados antes)
            const currentX = originX + (x - originX) * easeOut;
            const currentY = originY + (y - originY) * easeOut;
            
            // Fade in + scale up gradualmente (para que no aparezca de golpe bajo el cristal)
            const opacity = Math.min(emergeProgress * 2, 1);
            const scale = 0.2 + easeOut * 0.8;
            
            container.style.opacity = String(opacity);
            container.style.transform = `translate(${currentX - BEETLE_HALF}px, ${currentY - BEETLE_HALF}px) rotate(${rotation}deg) scale(${Math.min(scale, 1)})`;
            
            container.classList.add('walking');

            if (emergeProgress >= 1) {
                container.style.opacity = '1';
                container.classList.remove('walking');
                state = 'sniffing';
                timer = 30 + Math.random() * 40; // Olfatea un rato antes de moverse
                sniffCount = 0;
                sniffAnimation();
            }
            
            requestID = requestAnimationFrame(update);
            return;
        }

        // ===== ESTADO: SNIFFING (olfateando, tímido) =====
        if (state === 'sniffing') {
            container.classList.remove('walking');
            container.classList.add('sniffing-idle');
            
            // Micro-movimientos de rotación (como olfateando)
            rotation += (Math.random() - 0.5) * 8;
            
            timer--;
            sniffCount++;
            
            // Cada 30 frames, hacer una olfateada más pronunciada
            if (sniffCount % 30 === 0) {
                sniffAnimation();
            }
            
            if (timer <= 0) {
                container.classList.remove('sniffing-idle');
                // Primer objetivo: un punto cercano a la G, tímido
                const firstTarget = getRandomPoint();
                // No ir muy lejos en la primera exploración
                const orbP = getOrbPosition();
                if (orbP) {
                    targetX = orbP.x + (firstTarget.x - orbP.x) * 0.4;
                    targetY = orbP.y + (firstTarget.y - orbP.y) * 0.4;
                } else {
                    targetX = firstTarget.x;
                    targetY = firstTarget.y;
                }
                state = 'moving';
                maxSpeed = 1.5 + Math.random() * 1.5; // Empieza lento, tímido
            }
        }

        // ===== ESTADO: IDLE =====
        else if (state === 'idle') {
            container.classList.remove('walking');
            timer--;
            
            // A veces olfatea mientras está quieto
            if (Math.random() < 0.03) {
                sniffAnimation();
                rotation += (Math.random() - 0.5) * 15;
            }
            
            if (timer <= 0) {
                const pt = getRandomPoint();
                targetX = pt.x;
                targetY = pt.y;
                state = 'moving';
                maxSpeed = 2 + Math.random() * 3;
            }
        }
        
        // ===== ESTADO: MOVING =====
        else if (state === 'moving') {
            container.classList.add('walking');
            if (Math.random() < 0.02) {
                state = 'hesitating';
                timer = 20 + Math.random() * 40;
            }
            if (dist < 10) {
                state = 'idle';
                timer = 60 + Math.random() * 120;
                speed = 0;
            }
        }

        // ===== ESTADO: HESITATING =====
        else if (state === 'hesitating') {
            container.classList.remove('walking');
            speed = 0;
            // Olfatea
            rotation += (Math.random() - 0.5) * 5;
            timer--;
            if (timer <= 0) state = 'moving';
        }

        // ===== ESTADO: RETURNING (volviendo a la G después de ser aplastado) =====
        else if (state === 'returning') {
            // Actualizar posición del orb en tiempo real
            const currentOrbPos = getOrbPosition();
            if (currentOrbPos) {
                targetX = currentOrbPos.x;
                targetY = currentOrbPos.y;
            }
            
            if (container.classList.contains('entering-home')) {
                // Si ya está entrando, no actualizar 'x' y 'y' con su rutina normal
                // porque la animación CSS se está encargando
                return;
            }

            if (dist < 32) {
                // Llegó al borde — deslizarse bajo la G
                container.classList.add('entering-home');
                
                // Usamos transition para hacer el movimiento final ultra-suave
                container.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
                container.style.opacity = '0';
                container.style.transform = `translate(${targetX - BEETLE_HALF}px, ${targetY - BEETLE_HALF}px) rotate(${rotation}deg) scale(0.2)`;
                
                setTimeout(() => {
                    cleanup();
                }, 600);
                return;
            }
        }

        // ===== ESTADO: FLEEING (fallback, fuera de pantalla) =====
        else if (state === 'fleeing') {
            if (dist < 50) {
                cleanup();
                return;
            }
        }

        // ===== MOVIMIENTO =====
        if (state !== 'idle' && state !== 'hesitating' && state !== 'sniffing') {
            let targetRotation = Math.atan2(dy, dx) * 180 / Math.PI;
            let diff = targetRotation - rotation;
            while (diff > 180) diff -= 360;
            while (diff < -180) diff += 360;

            const turnSpeed = (state === 'returning' || state === 'fleeing') ? 0.35 : 0.1;
            rotation += diff * turnSpeed;

            if (state !== 'returning' && state !== 'fleeing') {
                rotation += (Math.random() - 0.5) * 4;
            }

            if (Math.abs(diff) < 90) {
                speed = Math.min(speed + 0.2, maxSpeed);
            } else {
                speed *= 0.9;
            }

            x += Math.cos(rotation * Math.PI/180) * speed;
            y += Math.sin(rotation * Math.PI/180) * speed;
        }

        container.style.transform = `translate(${x - BEETLE_HALF}px, ${y - BEETLE_HALF}px) rotate(${rotation}deg)`;
        requestID = requestAnimationFrame(update);
    }

    update();

    // 6. Función de limpieza
    function cleanup() {
        if (requestID) cancelAnimationFrame(requestID);
        if (hideTimeout) clearTimeout(hideTimeout);
        if (lifetimeTimeout) clearTimeout(lifetimeTimeout);
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        if (onCleanup) onCleanup();
    }

    // Auto-regreso a la G después del tiempo de vida
    if (maxLifetimeMs) {
        lifetimeTimeout = setTimeout(() => {
            if (state === 'returning' || state === 'fleeing') return;
            
            console.log('🪲 [Beetle] Tiempo agotado, volviendo a casa.');
            state = 'returning';
            container.classList.add('walking');
            
            const currentOrbPos = getOrbPosition();
            if (currentOrbPos) {
                targetX = currentOrbPos.x;
                targetY = currentOrbPos.y;
            } else {
                targetX = window.innerWidth - 30;
                targetY = window.innerHeight - 30;
            }
            maxSpeed = 6;
        }, maxLifetimeMs);
    }

    return cleanup;
}
