/**
 * ocean-text-mask.js — Efecto de video de olas dentro del texto.
 *
 * Usa Canvas 2D compositing para dibujar el video SOLO dentro
 * de la silueta de las letras. Esto funciona en TODOS los navegadores
 * (incluyendo iOS Safari) a diferencia de SVG foreignObject + video.
 *
 * Técnica:
 *   1. Dibuja el texto en el canvas (blanco sobre transparente)
 *   2. Usa globalCompositeOperation = 'source-in'
 *   3. Dibuja el frame del video o el gradiente de fallback.
 */

let activeCleanups = [];

/**
 * Busca .ocean-waves-text en el contenedor y los transforma en video-mask.
 */
export function mountOceanTextMask(container = document) {
    const targets = container.querySelectorAll('.ocean-waves-text');
    if (!targets.length) return;

    targets.forEach((span) => {
        const text = span.textContent.trim();
        if (!text) return;

        // --- Medir dimensiones del texto ---
        const computed = getComputedStyle(span);
        const fontStyle = computed.fontStyle || 'normal';
        const fontWeight = computed.fontWeight || '400';
        let baseFontSize = parseFloat(computed.fontSize) || 24;
        if (baseFontSize < 16) baseFontSize = 24; // Evitar colapsado temprano
        const fontString = `${fontStyle} ${fontWeight} ${baseFontSize}px "Cormorant Garamond", Georgia, serif`;

        const measureCanvas = document.createElement('canvas');
        const measureCtx = measureCanvas.getContext('2d');
        measureCtx.font = fontString;
        const metrics = measureCtx.measureText(text);
        const textWidth = Math.ceil(metrics.width) + 12;
        const textHeight = Math.ceil(baseFontSize * 1.55);

        // --- Crear wrapper span (semánticamente correcto para mantener inline-block) ---
        const wrapper = document.createElement('span');
        wrapper.className = 'ocean-video-text-wrapper';
        wrapper.style.cssText = `
            display: inline-block;
            position: relative;
            width: ${textWidth}px;
            height: ${textHeight}px;
            vertical-align: middle;
            margin: 0 4px;
        `;

        // --- Crear video oculto ---
        const video = document.createElement('video');
        video.src = '/videos/olas.mp4';
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.preload = 'auto';
        video.style.cssText = 'position:absolute;width:0;height:0;opacity:0;pointer-events:none;';

        // --- Crear canvas visible ---
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = document.createElement('canvas');
        canvas.width = textWidth * dpr;
        canvas.height = textHeight * dpr;
        canvas.style.cssText = `
            width: ${textWidth}px;
            height: ${textHeight}px;
            display: inline-block;
            vertical-align: middle;
        `;
        const ctx = canvas.getContext('2d');

        wrapper.appendChild(video);
        wrapper.appendChild(canvas);

        // --- Dibujar en el Canvas (con o sin video) ---
        function drawCanvas() {
            const w = textWidth;
            const h = textHeight;

            // Limpiar todo
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.scale(dpr, dpr);

            // Paso 1: Dibujar texto blanco (máscara de opacidad)
            ctx.font = fontString;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, w / 2, h / 2);

            // Paso 2: Operación de composición source-in
            ctx.globalCompositeOperation = 'source-in';

            const hasValidVideo = video.readyState >= 2 && video.videoWidth > 0 && !video.paused && !video.ended;

            if (hasValidVideo) {
                // Dibujar el frame del video escalado para cubrir el canvas
                const vw = video.videoWidth;
                const vh = video.videoHeight;
                const scale = Math.max(w / vw, h / vh);
                const dw = vw * scale;
                const dh = vh * scale;
                const dx = (w - dw) / 2;
                const dy = (h - dh) / 2;

                ctx.filter = 'brightness(1.35) contrast(1.15) saturate(1.25)';
                try {
                    ctx.drawImage(video, dx, dy, dw, dh);
                } catch (e) {
                    drawFallbackGradient();
                }
                ctx.filter = 'none';
            } else {
                drawFallbackGradient();
            }

            // Resetear operación de composición para futuros dibujos
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();
        }

        // Dibuja el gradiente oceánico de alta fidelidad
        function drawFallbackGradient() {
            const gradient = ctx.createLinearGradient(0, 0, textWidth, 0);
            gradient.addColorStop(0, '#0b4d8a');
            gradient.addColorStop(0.5, '#1a8fca');
            gradient.addColorStop(1, '#0b4d8a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, textWidth, textHeight);
        }

        // --- Render loop optimizado ---
        let rafId = null;
        let isActive = true;

        function render() {
            if (!isActive) return;

            drawCanvas();

            const isVideoActive = video.readyState >= 2 && !video.paused && !video.ended;
            if (isVideoActive) {
                rafId = requestAnimationFrame(render);
            } else {
                rafId = null;
            }
        }

        // Dibujar el primer frame con gradiente de inmediato
        drawCanvas();

        // --- Gestión de eventos del video ---
        function startRendering() {
            if (!isActive) return;
            video.play().catch(() => {
                // Si autoplay es bloqueado por gestos de usuario, reintentar al primer toque
                const retry = () => {
                    video.play().catch(() => {});
                    document.removeEventListener('click', retry);
                    document.removeEventListener('touchstart', retry);
                };
                document.addEventListener('click', retry, { once: true });
                document.addEventListener('touchstart', retry, { once: true });
            });
        }

        video.addEventListener('playing', () => {
            if (!rafId && isActive) render();
        });

        video.addEventListener('pause', () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            drawCanvas();
        });

        video.addEventListener('waiting', () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        });

        video.addEventListener('error', (e) => {
            console.warn('[OceanMask] Error al cargar video, usando gradiente estático:', video.error);
            drawCanvas();
        });

        video.addEventListener('loadeddata', startRendering);
        if (video.readyState >= 2) startRendering();

        // --- Reemplazar el span original ---
        span.replaceWith(wrapper);

        // --- Registrar cleanup ---
        const cleanup = () => {
            isActive = false;
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            try {
                video.pause();
                video.removeAttribute('src');
                video.load();
            } catch (e) { /* ignore */ }
        };

        activeCleanups.push(cleanup);
    });
}

/**
 * Limpia todos los videos/canvas activos del efecto.
 */
export function cleanupOceanTextMask() {
    activeCleanups.forEach((fn) => fn());
    activeCleanups = [];
}
