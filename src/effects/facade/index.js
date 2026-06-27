/**
 * Facade scratch effect for "Antes de que llegues".
 *
 * The effect keeps the dirty image as a CSS background and paints the clean
 * image on a canvas. Scratching erases the canvas; restoring redraws only the
 * touched patch. A gesture resolver lets vertical swipes scroll the poem while
 * short or diagonal strokes keep acting as scratch gestures.
 */

const ICON_SCRATCH = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a3 3 0 0 0-3-3 3 3 0 0 0-2.12.88L6 12.76V18h5.24l6.88-6.88A3 3 0 0 0 18 8z"/><path d="M2 21h6"/></svg>`;
const ICON_READ = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;

const DEFAULT_CONFIG = {
    cleanImage: 'images/antes_clean.webp',
    dirtyImage: 'images/antes_dirty.webp',
    focus: { x: 0.5, y: 0.3 },
    tint: { clean: 0.22, dirty: 0.3 },
    brush: { radius: 20, jitter: 4, step: 7 },
    gesture: { threshold: 14, dominance: 1.28, wheelFactor: 0.95 },
    gridCell: 8
};

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function toAssetUrl(value, fallback) {
    const src = value || fallback;
    if (/^(https?:|data:|blob:|\/)/i.test(src)) return src;
    return `/${src.replace(/^\.?\//, '')}`;
}

function normalizeConfig(options = {}) {
    return {
        cleanImage: toAssetUrl(options.cleanImage || options.cleanSrc, DEFAULT_CONFIG.cleanImage),
        dirtyImage: toAssetUrl(options.dirtyImage || options.dirtySrc, DEFAULT_CONFIG.dirtyImage),
        focus: {
            x: clamp(options.focus?.x ?? DEFAULT_CONFIG.focus.x, 0, 1),
            y: clamp(options.focus?.y ?? DEFAULT_CONFIG.focus.y, 0, 1)
        },
        tint: {
            clean: clamp(options.tint?.clean ?? DEFAULT_CONFIG.tint.clean, 0, 0.75),
            dirty: clamp(options.tint?.dirty ?? DEFAULT_CONFIG.tint.dirty, 0, 0.75)
        },
        brush: {
            radius: Math.max(8, options.brush?.radius ?? DEFAULT_CONFIG.brush.radius),
            jitter: Math.max(0, options.brush?.jitter ?? DEFAULT_CONFIG.brush.jitter),
            step: Math.max(3, options.brush?.step ?? DEFAULT_CONFIG.brush.step)
        },
        gesture: {
            threshold: Math.max(6, options.gesture?.threshold ?? DEFAULT_CONFIG.gesture.threshold),
            dominance: Math.max(1.05, options.gesture?.dominance ?? DEFAULT_CONFIG.gesture.dominance),
            wheelFactor: Math.max(0.2, options.gesture?.wheelFactor ?? DEFAULT_CONFIG.gesture.wheelFactor)
        },
        gridCell: Math.max(4, options.gridCell ?? DEFAULT_CONFIG.gridCell)
    };
}

export function startFacadeEffect(options = {}) {
    const container = document.getElementById('app-container') || document.body;
    if (document.getElementById('facade-bg')) return () => {};

    const config = normalizeConfig(options);
    const bgPosition = `${config.focus.x * 100}% ${config.focus.y * 100}%`;

    let mode = 'reveal';
    let isDrawing = false;
    let gestureMode = null;
    let paintMode = null;
    let passthroughTarget = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let canvasCssW = 0;
    let canvasCssH = 0;
    let resizeTimer = null;

    let stateGrid = null;
    let gridCols = 0;
    let gridRows = 0;

    function initStateGrid(w, h) {
        gridCols = Math.ceil(w / config.gridCell);
        gridRows = Math.ceil(h / config.gridCell);
        stateGrid = new Uint8Array(gridCols * gridRows);
    }

    function markGrid(cx, cy, radius, value) {
        if (!stateGrid) return;
        const cell = config.gridCell;
        const minCol = Math.max(0, Math.floor((cx - radius) / cell));
        const maxCol = Math.min(gridCols - 1, Math.floor((cx + radius) / cell));
        const minRow = Math.max(0, Math.floor((cy - radius) / cell));
        const maxRow = Math.min(gridRows - 1, Math.floor((cy + radius) / cell));

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                stateGrid[row * gridCols + col] = value;
            }
        }
    }

    function readGrid(cx, cy) {
        if (!stateGrid) return 0;
        const col = Math.floor(cx / config.gridCell);
        const row = Math.floor(cy / config.gridCell);
        if (col < 0 || col >= gridCols || row < 0 || row >= gridRows) return 0;
        return stateGrid[row * gridCols + col];
    }

    const bgDiv = document.createElement('div');
    bgDiv.id = 'facade-bg';
    Object.assign(bgDiv.style, {
        position: 'fixed',
        inset: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '1',
        pointerEvents: 'none',
        backgroundImage: `url("${config.dirtyImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: bgPosition,
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#0a0a0c'
    });

    const tint = document.createElement('div');
    Object.assign(tint.style, {
        position: 'absolute',
        inset: '0',
        backgroundColor: `rgba(0,0,0,${config.tint.dirty})`
    });
    bgDiv.appendChild(tint);
    container.appendChild(bgDiv);

    const canvas = document.createElement('canvas');
    canvas.id = 'facade-canvas';
    Object.assign(canvas.style, {
        position: 'fixed',
        inset: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '2',
        pointerEvents: 'none'
    });
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    const touchDiv = document.createElement('div');
    touchDiv.id = 'facade-touch';
    Object.assign(touchDiv.style, {
        position: 'fixed',
        inset: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '9998',
        pointerEvents: 'auto',
        cursor: 'crosshair',
        background: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: 'none'
    });
    container.appendChild(touchDiv);

    const readerView = document.getElementById('reader-view');
    const pageWrapper = document.getElementById('page-wrapper');
    const saved = {
        rv: readerView ? {
            position: readerView.style.position,
            zIndex: readerView.style.zIndex,
            backgroundColor: readerView.style.backgroundColor
        } : null,
        pw: pageWrapper ? {
            backgroundColor: pageWrapper.style.backgroundColor,
            boxShadow: pageWrapper.style.boxShadow,
            border: pageWrapper.style.border
        } : null
    };

    if (readerView) {
        readerView.style.position = 'relative';
        readerView.style.zIndex = '10';
        readerView.style.backgroundColor = 'transparent';
    }

    if (pageWrapper) {
        pageWrapper.style.backgroundColor = 'transparent';
        pageWrapper.style.boxShadow = 'none';
        pageWrapper.style.border = 'none';
        // Elevate choice buttons above the facade touch overlay
        pageWrapper.querySelectorAll('.choices button').forEach((btn) => {
            btn.style.position = 'relative';
            btn.style.zIndex = '99999';
            btn.style.pointerEvents = 'auto';
        });
        // Elevate the choices container itself
        const choicesContainer = pageWrapper.querySelector('.choices');
        if (choicesContainer) {
            choicesContainer.style.position = 'relative';
            choicesContainer.style.zIndex = '99999';
        }
    }

    const appHeader = document.getElementById('app-header');
    const appFooter = document.getElementById('app-footer');

    if (appHeader) {
        appHeader.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        appHeader.style.transform = 'translateY(-100%)';
        appHeader.style.opacity = '0';
        appHeader.style.pointerEvents = 'none';
    }

    if (appFooter) {
        appFooter.style.transition = 'opacity 0.4s ease';
        appFooter.style.opacity = '0';
        appFooter.style.pointerEvents = 'none';
    }

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'facade-toggle';
    toggleBtn.className = 'facade-toggle-btn';

    const tooltip = document.createElement('span');
    tooltip.className = 'facade-toggle-tooltip';
    toggleBtn.appendChild(tooltip);
    container.appendChild(toggleBtn);

    function setMode(nextMode) {
        mode = nextMode;
        toggleBtn.setAttribute('data-mode', mode);
        toggleBtn.querySelector('svg')?.remove();

        if (mode === 'reveal') {
            toggleBtn.insertAdjacentHTML('afterbegin', ICON_SCRATCH);
            tooltip.textContent = 'Interactuar';
            touchDiv.style.pointerEvents = 'auto';
            touchDiv.style.cursor = 'crosshair';
        } else {
            toggleBtn.insertAdjacentHTML('afterbegin', ICON_READ);
            tooltip.textContent = 'Lectura';
            touchDiv.style.pointerEvents = 'none';
            touchDiv.style.cursor = 'default';
        }
    }

    function onToggleClick(event) {
        event.stopPropagation();
        event.preventDefault();
        setMode(mode === 'reveal' ? 'read' : 'reveal');
        toggleBtn.style.transform = 'scale(0.85)';
        setTimeout(() => { toggleBtn.style.transform = 'scale(1)'; }, 180);
        if (navigator.vibrate) navigator.vibrate(15);
    }

    toggleBtn.addEventListener('click', onToggleClick);

    const cleanImg = new Image();
    let imgReady = false;
    let drawParams = { ox: 0, oy: 0, dw: 0, dh: 0 };

    function calcCover(imgW, imgH, cW, cH) {
        const imageRatio = imgW / imgH;
        const canvasRatio = cW / cH;
        let dw;
        let dh;
        let ox;
        let oy;

        if (canvasRatio > imageRatio) {
            dw = cW;
            dh = cW / imageRatio;
            ox = 0;
            oy = (cH - dh) * config.focus.y;
        } else {
            dh = cH;
            dw = cH * imageRatio;
            ox = (cW - dw) * config.focus.x;
            oy = 0;
        }

        return { ox, oy, dw, dh };
    }

    function drawFullClean() {
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvasCssW, canvasCssH);
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvasCssW, canvasCssH);

        drawParams = calcCover(cleanImg.width, cleanImg.height, canvasCssW, canvasCssH);
        ctx.drawImage(cleanImg, drawParams.ox, drawParams.oy, drawParams.dw, drawParams.dh);

        ctx.fillStyle = `rgba(0,0,0,${config.tint.clean})`;
        ctx.fillRect(0, 0, canvasCssW, canvasCssH);
    }

    function resizeCanvas({ force = false } = {}) {
        const nextW = window.innerWidth;
        const nextH = window.innerHeight;
        const widthChanged = Math.abs(nextW - canvasCssW) > 2;
        const heightChangedMajor = Math.abs(nextH - canvasCssH) > 120;

        if (!force && !widthChanged && !heightChangedMajor) return;

        canvasCssW = nextW;
        canvasCssH = nextH;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(canvasCssW * dpr);
        canvas.height = Math.round(canvasCssH * dpr);
        canvas.style.width = `${canvasCssW}px`;
        canvas.style.height = `${canvasCssH}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        initStateGrid(canvasCssW, canvasCssH);
        if (imgReady) drawFullClean();
    }

    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => resizeCanvas(), 140);
    }

    cleanImg.onload = () => {
        imgReady = true;
        resizeCanvas({ force: true });
    };

    cleanImg.onerror = () => {
        console.warn('[Facade] Failed to load clean image');
        imgReady = false;
        resizeCanvas({ force: true });
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(0, 0, canvasCssW, canvasCssH);
    };

    cleanImg.src = config.cleanImage;
    resizeCanvas({ force: true });
    window.addEventListener('resize', onResize);

    function scratch(x, y, radius) {
        ctx.globalCompositeOperation = 'destination-out';
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(0.4, 'rgba(0,0,0,0.8)');
        grad.addColorStop(0.72, 'rgba(0,0,0,0.28)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        markGrid(x, y, radius, 1);
    }

    function restore(x, y, radius) {
        if (!imgReady) return;

        const p = drawParams;
        const scaleX = p.dw / cleanImg.width;
        const scaleY = p.dh / cleanImg.height;

        const canvasX = x - radius;
        const canvasY = y - radius;
        const canvasW = radius * 2;
        const canvasH = radius * 2;

        const rawSx = (canvasX - p.ox) / scaleX;
        const rawSy = (canvasY - p.oy) / scaleY;
        const rawSw = canvasW / scaleX;
        const rawSh = canvasH / scaleY;

        const sx = clamp(rawSx, 0, cleanImg.width);
        const sy = clamp(rawSy, 0, cleanImg.height);
        const sx2 = clamp(rawSx + rawSw, 0, cleanImg.width);
        const sy2 = clamp(rawSy + rawSh, 0, cleanImg.height);
        const sw = sx2 - sx;
        const sh = sy2 - sy;

        if (sw <= 0 || sh <= 0) return;

        const dx = canvasX + (sx - rawSx) * scaleX;
        const dy = canvasY + (sy - rawSy) * scaleY;
        const dw = sw * scaleX;
        const dh = sh * scaleY;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(cleanImg, sx, sy, sw, sh, dx, dy, dw, dh);
        ctx.fillStyle = `rgba(0,0,0,${config.tint.clean})`;
        ctx.fillRect(canvasX, canvasY, canvasW, canvasH);
        ctx.restore();

        markGrid(x, y, radius, 0);
    }

    function paintAt(x, y) {
        if (paintMode === null) {
            paintMode = readGrid(x, y) === 0 ? 'erase' : 'restore';
        }

        const radius = config.brush.radius + Math.random() * config.brush.jitter;
        if (paintMode === 'erase') scratch(x, y, radius);
        else restore(x, y, radius);
    }

    function getPos(event) {
        if (event.touches && event.touches.length > 0) {
            return { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }
        return { x: event.clientX, y: event.clientY };
    }

    function getPageContent() {
        return document.querySelector('.page-content');
    }

    function getPassthroughTarget(pos) {
        return document.elementsFromPoint(pos.x, pos.y)
            .map((el) => el.closest?.('.choices button, .canvas-contextual-btn, .discoveries-container button, a[href]'))
            .find(Boolean) || null;
    }

    function scrollReaderBy(deltaY) {
        const pageContent = getPageContent();
        if (!pageContent) return;
        pageContent.scrollTop -= deltaY;
        pageContent.classList.add('is-scrolling');
        clearTimeout(pageContent.__facadeScrollTimer);
        pageContent.__facadeScrollTimer = setTimeout(() => {
            pageContent.classList.remove('is-scrolling');
        }, 900);
    }

    function paintLine(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(1, Math.floor(dist / config.brush.step));

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            paintAt(fromX + dx * t, fromY + dy * t);
        }
    }

    function resolveGesture(pos, isTouch) {
        if (!isTouch) return 'scratch';
        if (gestureMode) return gestureMode;

        const dx = pos.x - startX;
        const dy = pos.y - startY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < config.gesture.threshold) return null;

        gestureMode = absY > absX * config.gesture.dominance ? 'scroll' : 'scratch';
        if (gestureMode === 'scratch') paintAt(startX, startY);
        return gestureMode;
    }

    function onStart(event) {
        if (mode !== 'reveal') return;

        const pos = getPos(event);
        const isTouch = event.type.startsWith('touch');

        isDrawing = true;
        passthroughTarget = getPassthroughTarget(pos);
        if (passthroughTarget) {
            gestureMode = 'control';
            startX = pos.x;
            startY = pos.y;
            lastX = pos.x;
            lastY = pos.y;
            return;
        }

        gestureMode = isTouch ? null : 'scratch';
        paintMode = null;
        startX = pos.x;
        startY = pos.y;
        lastX = pos.x;
        lastY = pos.y;

        if (!isTouch) paintAt(pos.x, pos.y);
    }

    function onMove(event) {
        if (!isDrawing || mode !== 'reveal') return;

        const pos = getPos(event);
        const isTouch = event.type.startsWith('touch');

        if (gestureMode === 'control') {
            const dx = pos.x - startX;
            const dy = pos.y - startY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > config.gesture.threshold) {
                passthroughTarget = null;
                gestureMode = Math.abs(dy) > Math.abs(dx) * config.gesture.dominance ? 'scroll' : 'scratch';
                if (gestureMode === 'scratch') paintAt(startX, startY);
            } else {
                return;
            }
        }

        const resolved = resolveGesture(pos, isTouch);

        if (!resolved) return;
        if (event.cancelable) event.preventDefault();

        if (resolved === 'scroll') {
            scrollReaderBy(pos.y - lastY);
        } else {
            paintLine(lastX, lastY, pos.x, pos.y);
        }

        lastX = pos.x;
        lastY = pos.y;
    }

    function onEnd() {
        if (gestureMode === 'control' && passthroughTarget) {
            const target = passthroughTarget;
            isDrawing = false;
            gestureMode = null;
            paintMode = null;
            passthroughTarget = null;
            target.click();
            return;
        }

        if (isDrawing && mode === 'reveal' && gestureMode === null) {
            paintAt(startX, startY);
        }

        isDrawing = false;
        gestureMode = null;
        paintMode = null;
        passthroughTarget = null;
    }

    function onWheel(event) {
        if (mode !== 'reveal') return;
        if (event.cancelable) event.preventDefault();
        scrollReaderBy(-event.deltaY * config.gesture.wheelFactor);
    }

    touchDiv.addEventListener('mousedown', onStart);
    touchDiv.addEventListener('mousemove', onMove);
    touchDiv.addEventListener('mouseup', onEnd);
    touchDiv.addEventListener('mouseleave', onEnd);
    touchDiv.addEventListener('touchstart', onStart, { passive: false });
    touchDiv.addEventListener('touchmove', onMove, { passive: false });
    touchDiv.addEventListener('touchend', onEnd);
    touchDiv.addEventListener('touchcancel', onEnd);
    touchDiv.addEventListener('wheel', onWheel, { passive: false });

    showFacadeTutorial(container);
    setMode('reveal');

    return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
        toggleBtn.removeEventListener('click', onToggleClick);

        ['facade-bg', 'facade-canvas', 'facade-touch', 'facade-toggle', 'facade-tutorial']
            .forEach((id) => document.getElementById(id)?.remove());

        if (readerView && saved.rv) {
            readerView.style.position = saved.rv.position;
            readerView.style.zIndex = saved.rv.zIndex;
            readerView.style.backgroundColor = saved.rv.backgroundColor;
        }

        if (pageWrapper && saved.pw) {
            pageWrapper.style.backgroundColor = saved.pw.backgroundColor;
            pageWrapper.style.boxShadow = saved.pw.boxShadow;
            pageWrapper.style.border = saved.pw.border;
            pageWrapper.querySelectorAll('.choices button').forEach((btn) => {
                ['position', 'zIndex', 'pointerEvents', 'backgroundColor', 'color', 'borderColor']
                    .forEach((prop) => { btn.style[prop] = ''; });
            });
        }

        if (appHeader) {
            appHeader.style.transform = '';
            appHeader.style.opacity = '';
            appHeader.style.pointerEvents = '';
        }

        if (appFooter) {
            appFooter.style.opacity = '';
            appFooter.style.pointerEvents = '';
        }

        stateGrid = null;
    };
}

function showFacadeTutorial(container) {
    const KEY = 'facade_tutorial_seen_v2';
    if (localStorage.getItem(KEY)) return;

    const el = document.createElement('div');
    el.id = 'facade-tutorial';
    el.className = 'facade-tutorial-overlay';

    el.innerHTML = `
        <div class="facade-tutorial-content">
            <div class="facade-tutorial-title">Esta pagina es tactil</div>

            <div class="facade-tutorial-row">
                <div class="facade-tutorial-icon facade-tutorial-icon--scratch">
                    <svg viewBox="0 0 24 24"><path d="M18 8a3 3 0 0 0-3-3 3 3 0 0 0-2.12.88L6 12.76V18h5.24l6.88-6.88A3 3 0 0 0 18 8z"/><path d="M2 21h6"/></svg>
                </div>
                <div class="facade-tutorial-desc">Raspa con trazos cortos o diagonales.</div>
            </div>

            <div class="facade-tutorial-row">
                <div class="facade-tutorial-icon facade-tutorial-icon--read">
                    <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                </div>
                <div class="facade-tutorial-desc">Desliza verticalmente para leer.</div>
            </div>

            <div class="facade-tutorial-hint">El boton inferior sigue disponible como modo lectura.</div>

            <button class="facade-tutorial-dismiss">Entendido</button>
        </div>
    `;

    container.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => {
        el.classList.add('visible');
    }));

    function dismiss() {
        localStorage.setItem(KEY, '1');
        el.classList.remove('visible');
        setTimeout(() => el.remove(), 500);
    }

    el.addEventListener('click', dismiss);
    setTimeout(() => { if (el.parentNode) dismiss(); }, 9000);
}
