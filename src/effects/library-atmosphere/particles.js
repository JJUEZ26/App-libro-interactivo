/**
 * Efectos de atmósfera para la biblioteca (Meta A.1)
 * Canvas de partículas reactivas al mouse.
 */

export function startLibraryParticles() {
    const libraryView = document.getElementById('library-view');
    if (!libraryView) return () => {};

    // Desactivar el pseudo-element estático de CSS
    libraryView.classList.add('has-particle-canvas');

    const canvas = document.createElement('canvas');
    canvas.id = 'library-particles-canvas';
    canvas.style.cssText = 'position: absolute; inset: 0; z-index: 0; pointer-events: none; width: 100%; height: 100%;';
    
    // Insertar como primer hijo para que quede de fondo real
    if (libraryView.firstChild) {
        libraryView.insertBefore(canvas, libraryView.firstChild);
    } else {
        libraryView.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    let width, height, dpr;
    let mouseX = -1000;
    let mouseY = -1000;
    
    // Prevenir el exceso de partículas en dispositivos que prefieren reducción de movimiento
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Calcular cantidad óptima según hardware
    const particleCount = prefersReducedMotion ? 15 : (navigator.hardwareConcurrency > 4 ? 50 : 25);
    const particles = [];

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = libraryView.clientWidth;
        height = libraryView.clientHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        if (particles.length === 0) {
            initParticles();
        } else {
            // Asegurar que no queden fuera de bounds
            particles.forEach(p => {
                if (p.baseX > width) p.baseX = Math.random() * width;
                if (p.baseY > height) p.baseY = Math.random() * height;
            });
        }
    }

    function initParticles() {
        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            particles.push({
                x: x,
                y: y,
                baseX: x,
                baseY: y,
                radius: 1 + Math.random() * 2,       // 1-3px (conforme al plan)
                opacity: 0.02 + Math.random() * 0.04, // 0.02-0.06 (conforme al plan)
                currentOpacity: 0.02,
                driftSpeed: 0.1 + Math.random() * 0.2,
                driftAngle: Math.random() * Math.PI * 2,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function onMouseMove(e) {
        if (prefersReducedMotion) return;
        const rect = libraryView.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * dpr;
        mouseY = (e.clientY - rect.top) * dpr;
    }

    function onTouchMove(e) {
        if (prefersReducedMotion || !e.touches || e.touches.length === 0) return;
        const rect = libraryView.getBoundingClientRect();
        mouseX = (e.touches[0].clientX - rect.left) * dpr;
        mouseY = (e.touches[0].clientY - rect.top) * dpr;
    }
    
    function onMouseLeave() {
        mouseX = -1000;
        mouseY = -1000;
    }

    window.addEventListener('resize', resize);
    libraryView.addEventListener('mousemove', onMouseMove, { passive: true });
    libraryView.addEventListener('touchmove', onTouchMove, { passive: true });
    libraryView.addEventListener('mouseleave', onMouseLeave);
    
    // Primera inicialización
    resize();

    let frameCount = 0;
    let animId = null;

    function updateParticles() {
        const time = performance.now() * 0.001;
        
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            
            // Física base de drift (movimiento sinusoidal suave)
            if (!prefersReducedMotion) {
                p.x = p.baseX + Math.sin(time * p.driftSpeed + p.phase) * 15;
                p.y = p.baseY + Math.cos(time * p.driftSpeed * 0.7 + p.phase) * 10;
            } else {
                p.x = p.baseX;
                p.y = p.baseY;
            }

            // Reacción al mouse (solo si no es reduced motion)
            if (!prefersReducedMotion) {
                const dist = Math.hypot((p.x * dpr) - mouseX, (p.y * dpr) - mouseY);
                const influenceRadius = 150 * dpr;
                
                if (dist < influenceRadius) {
                    // Repulsión magnética
                    const force = (1 - dist / influenceRadius) * 0.3;
                    const angle = Math.atan2((p.y * dpr) - mouseY, (p.x * dpr) - mouseX);
                    
                    p.x += Math.cos(angle) * force * 8;
                    p.y += Math.sin(angle) * force * 8;
                    
                    // Brillo momentáneo
                    p.currentOpacity = Math.min(0.15, p.opacity + force * 0.1);
                } else {
                    // Lerp suave de vuelta a la opacidad normal
                    p.currentOpacity += (p.opacity - p.currentOpacity) * 0.05;
                }
            } else {
                p.currentOpacity = p.opacity;
            }
            
            // Wrap around visual si se salen del canvas
            if (p.x < -20) p.baseX = width + 20;
            if (p.x > width + 20) p.baseX = -20;
            if (p.y < -20) p.baseY = height + 20;
            if (p.y > height + 20) p.baseY = -20;
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            ctx.globalAlpha = p.currentOpacity;
            ctx.beginPath();
            ctx.arc(p.x * dpr, p.y * dpr, p.radius * dpr, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function render() {
        frameCount++;
        // Solo recalcular física cada 2 frames
        if (frameCount % 2 === 0) {
            updateParticles();
        }
        drawParticles();
        animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return function cleanup() {
        if (animId) cancelAnimationFrame(animId);
        window.removeEventListener('resize', resize);
        libraryView.removeEventListener('mousemove', onMouseMove);
        libraryView.removeEventListener('touchmove', onTouchMove);
        libraryView.removeEventListener('mouseleave', onMouseLeave);
        libraryView.classList.remove('has-particle-canvas');
        if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
    };
}
