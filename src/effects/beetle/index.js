// SVG del escarabajo como string para inyectarlo fácilmente
const beetleSVG = `
<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; overflow: visible;">
    <defs>
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
    <g id="beetle-group" fill="#000000" stroke="#000000" stroke-linecap="round" stroke-linejoin="round">
        <g id="legs-far" opacity="0.8" fill="none" stroke="#000000">
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
        <g id="antennae" fill="none" stroke-width="1.5">
            <path d="M370,300 C390,280 440,280 460,250" opacity="0.6" />
            <path d="M375,310 L385,305 L400,295 L415,280 L430,260 L440,240" stroke-width="2" stroke-linecap="butt" stroke-linejoin="bevel" />
        </g>
        <g id="legs-near" stroke="none" fill="#000000">
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

export function initBeetle({ getHideTarget, onCleanup, maxLifetimeMs } = {}) {
    console.log('🪲 [Beetle] Intentando inicializar...');

    // 1. Evitar duplicados y errores de retorno
    if (document.getElementById('beetle-container')) {
        console.log('🪲 [Beetle] Ya existe uno, abortando.');
        return () => {}; // Devolver función vacía para que no explote el caller
    }

    // 2. Crear el contenedor
    const container = document.createElement('div');
    container.id = 'beetle-container';
    container.innerHTML = beetleSVG;
    
    // --- ESTILOS DE SEGURIDAD (JS) ---
    // Esto garantiza que se vea aunque falle la conexión con el archivo CSS
    container.style.position = 'fixed';
    container.style.width = '120px';
    container.style.height = '120px';
    container.style.zIndex = '9999';
    container.style.pointerEvents = 'auto';
    container.style.cursor = 'pointer';
    // ----------------------------------

    document.body.appendChild(container);
    console.log('🪲 [Beetle] Añadido al DOM correctamente.');

    // 3. Variables de estado
    const initialPoint = getRandomPoint();
    let x = initialPoint.x;
    let y = initialPoint.y;
    let rotation = Math.random() * 360;
    let targetX = x;
    let targetY = y;
    let speed = 0;
    let maxSpeed = 3;
    let state = 'idle'; 
    let timer = 0;
    let hideTarget = null;
    let isHiding = false;
    let hideTimeout = null;
    let lifetimeTimeout = null;
    let requestID;

    // Función auxiliar para puntos aleatorios
    function getRandomPoint() {
        const padding = 50; 
        return {
            x: padding + Math.random() * (window.innerWidth - padding * 2),
            y: padding + Math.random() * (window.innerHeight - padding * 2)
        };
    }

    // 4. Lógica de click para HUIR
    function startHiding() {
        if (isHiding) return;
        isHiding = true;
        container.classList.add('hiding');
        // Transición manual por si el CSS falla
        container.style.transition = 'opacity 0.6s ease';
        container.style.opacity = '0';
        
        hideTimeout = setTimeout(() => {
            cleanup();
        }, 600);
    }

    container.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state === 'fleeing') return;

        console.log('🪲 [Beetle] ¡Click detectado! Huyendo.');
        state = 'fleeing';
        container.classList.add('fleeing', 'walking');

        const hideSpot = getHideTarget ? getHideTarget() : null;
        if (hideSpot) {
            hideTarget = hideSpot;
            targetX = hideSpot.x;
            targetY = hideSpot.y;
            maxSpeed = 12;
            return;
        }
        
        const angle = Math.random() * Math.PI * 2;
        const fleeDist = Math.max(window.innerWidth, window.innerHeight) * 2;
        
        targetX = x + Math.cos(angle) * fleeDist;
        targetY = y + Math.sin(angle) * fleeDist;
        
        maxSpeed = 12;
    });

    // 5. Bucle de animación
    function update() {
        if (!document.body.contains(container)) return; 

        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (state === 'idle') {
            container.classList.remove('walking');
            timer--;
            if (timer <= 0) {
                const pt = getRandomPoint();
                targetX = pt.x;
                targetY = pt.y;
                state = 'moving';
                maxSpeed = 2 + Math.random() * 3;
            }
        } 
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
        else if (state === 'hesitating') {
            container.classList.remove('walking');
            speed = 0;
            timer--;
            if (timer <= 0) state = 'moving';
        }
        else if (state === 'fleeing') {
            if (hideTarget && dist < 30) {
                startHiding();
                return;
            }
            if (!hideTarget && dist < 50) {
                cleanup();
                return;
            }
        }

        if (state !== 'idle' && state !== 'hesitating') {
            let targetRotation = Math.atan2(dy, dx) * 180 / Math.PI;
            let diff = targetRotation - rotation;
            while (diff > 180) diff -= 360;
            while (diff < -180) diff += 360;

            const turnSpeed = state === 'fleeing' ? 0.3 : 0.1;
            rotation += diff * turnSpeed;

            if (state !== 'fleeing') rotation += (Math.random() - 0.5) * 4;

            if (Math.abs(diff) < 90) {
                speed = Math.min(speed + 0.2, maxSpeed);
            } else {
                speed *= 0.9;
            }

            x += Math.cos(rotation * Math.PI/180) * speed;
            y += Math.sin(rotation * Math.PI/180) * speed;
        }

        container.style.transform = `translate(${x - 60}px, ${y - 60}px) rotate(${rotation}deg)`;
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

    if (maxLifetimeMs) {
        lifetimeTimeout = setTimeout(() => {
            startHiding();
        }, maxLifetimeMs);
    }

    return cleanup;
}
