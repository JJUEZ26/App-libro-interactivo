/**
 * Atmosphere effects for the library view.
 * Reactive particles with mobile/low-end safeguards.
 */

export function startLibraryParticles() {
    const libraryView = document.getElementById('library-view');
    if (!libraryView) return () => {};

    libraryView.classList.add('has-particle-canvas');

    const canvas = document.createElement('canvas');
    canvas.id = 'library-particles-canvas';
    canvas.style.cssText = 'position: absolute; inset: 0; z-index: 0; pointer-events: none; width: 100%; height: 100%;';

    if (libraryView.firstChild) {
        libraryView.insertBefore(canvas, libraryView.firstChild);
    } else {
        libraryView.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    let width;
    let height;
    let dpr;
    let mouseX = -1000;
    let mouseY = -1000;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compactViewport = window.matchMedia('(max-width: 900px)').matches;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = String(connection?.effectiveType || '').toLowerCase();
    const constrainedConnection = Boolean(connection?.saveData) || effectiveType.includes('2g') || effectiveType === '3g';
    const deviceMemory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const lowPowerDevice = constrainedConnection || deviceMemory <= 2 || cores <= 4;
    const enablePointerReactivity = !prefersReducedMotion && !lowPowerDevice;

    const particleCount = prefersReducedMotion
        ? 12
        : lowPowerDevice
            ? (compactViewport ? 10 : 14)
            : (cores > 6 ? 42 : 26);
    const updateStride = lowPowerDevice ? 3 : 2;
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
            particles.forEach((particle) => {
                if (particle.baseX > width) particle.baseX = Math.random() * width;
                if (particle.baseY > height) particle.baseY = Math.random() * height;
            });
        }
    }

    function initParticles() {
        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            particles.push({
                x,
                y,
                baseX: x,
                baseY: y,
                radius: 1 + Math.random() * 2,
                opacity: 0.02 + Math.random() * 0.04,
                currentOpacity: 0.02,
                driftSpeed: 0.1 + Math.random() * 0.2,
                driftAngle: Math.random() * Math.PI * 2,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function onMouseMove(event) {
        if (!enablePointerReactivity) return;
        const rect = libraryView.getBoundingClientRect();
        mouseX = (event.clientX - rect.left) * dpr;
        mouseY = (event.clientY - rect.top) * dpr;
    }

    function onTouchMove(event) {
        if (!enablePointerReactivity || !event.touches || event.touches.length === 0) return;
        const rect = libraryView.getBoundingClientRect();
        mouseX = (event.touches[0].clientX - rect.left) * dpr;
        mouseY = (event.touches[0].clientY - rect.top) * dpr;
    }

    function onMouseLeave() {
        mouseX = -1000;
        mouseY = -1000;
    }

    window.addEventListener('resize', resize);
    if (enablePointerReactivity) {
        libraryView.addEventListener('mousemove', onMouseMove, { passive: true });
        libraryView.addEventListener('touchmove', onTouchMove, { passive: true });
        libraryView.addEventListener('mouseleave', onMouseLeave);
    }

    resize();

    let frameCount = 0;
    let animId = null;

    function updateParticles() {
        const time = performance.now() * 0.001;

        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];

            if (!prefersReducedMotion) {
                particle.x = particle.baseX + Math.sin(time * particle.driftSpeed + particle.phase) * 15;
                particle.y = particle.baseY + Math.cos(time * particle.driftSpeed * 0.7 + particle.phase) * 10;
            } else {
                particle.x = particle.baseX;
                particle.y = particle.baseY;
            }

            if (enablePointerReactivity) {
                const dist = Math.hypot((particle.x * dpr) - mouseX, (particle.y * dpr) - mouseY);
                const influenceRadius = 150 * dpr;

                if (dist < influenceRadius) {
                    const force = (1 - dist / influenceRadius) * 0.3;
                    const angle = Math.atan2((particle.y * dpr) - mouseY, (particle.x * dpr) - mouseX);

                    particle.x += Math.cos(angle) * force * 8;
                    particle.y += Math.sin(angle) * force * 8;
                    particle.currentOpacity = Math.min(0.15, particle.opacity + force * 0.1);
                } else {
                    particle.currentOpacity += (particle.opacity - particle.currentOpacity) * 0.05;
                }
            } else {
                particle.currentOpacity = particle.opacity;
            }

            if (particle.x < -20) particle.baseX = width + 20;
            if (particle.x > width + 20) particle.baseX = -20;
            if (particle.y < -20) particle.baseY = height + 20;
            if (particle.y > height + 20) particle.baseY = -20;
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            ctx.globalAlpha = particle.currentOpacity;
            ctx.beginPath();
            ctx.arc(particle.x * dpr, particle.y * dpr, particle.radius * dpr, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function render() {
        frameCount++;
        if (frameCount % updateStride === 0) {
            updateParticles();
        }
        drawParticles();
        animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return function cleanup() {
        if (animId) cancelAnimationFrame(animId);
        window.removeEventListener('resize', resize);
        if (enablePointerReactivity) {
            libraryView.removeEventListener('mousemove', onMouseMove);
            libraryView.removeEventListener('touchmove', onTouchMove);
            libraryView.removeEventListener('mouseleave', onMouseLeave);
        }
        libraryView.classList.remove('has-particle-canvas');
        if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
    };
}
