import { CANVAS_STYLES, CANVAS_HTML, COLORS } from './DrawingCanvasTemplate.js';
import { saveToGallery } from './CanvasGallery.js';

export class DrawingCanvas extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Drawing state
        this.isDrawing = false;
        this.hasDrawn = false;
        this.mode = 'brush'; // 'brush' | 'eraser'
        this.lineWidth = 3;
        this.drawColor = COLORS[0].value;
        this.isLocked = false;
        this.lastX = 0;
        this.lastY = 0;
        this.points = []; // current stroke points for smoothing

        // Zoom/Pan state
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.pinchStartDist = 0;
        this.pinchStartScale = 1;

        // Undo/Redo — stores canvas snapshots
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = 30;

        // Popups
        this._colorOpen = false;
        this._sizeOpen = false;

        this._build();
    }

    _build() {
        this.shadowRoot.innerHTML = `<style>${CANVAS_STYLES}</style>${CANVAS_HTML}`;
        this._bindEls();
        this._buildColorPicker();
        this._bindSizePopup();
        this._bindEvents();
    }

    _bindEls() {
        this.canvas = this.shadowRoot.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = this.shadowRoot.querySelector('.co');
        this.placeholder = this.shadowRoot.querySelector('.ph');
        this.zoomLabel = this.shadowRoot.querySelector('.zoom-label');
        this.toastEl = this.shadowRoot.querySelector('.toast');
        this.undoBtn = this.shadowRoot.querySelector('[data-action="undo"]');
        this.redoBtn = this.shadowRoot.querySelector('[data-action="redo"]');
    }

    _buildColorPicker() {
        const cpop = this.shadowRoot.getElementById('cpop');
        COLORS.forEach((c, i) => {
            const el = document.createElement('div');
            el.className = 'cpop-color' + (i === 0 ? ' sel' : '');
            el.style.background = c.value;
            el.title = c.name;
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.drawColor = c.value;
                cpop.querySelectorAll('.cpop-color').forEach(x => x.classList.remove('sel'));
                el.classList.add('sel');
                // Update swatch
                this.shadowRoot.querySelector('.swatch').style.background = c.value;
                this._closePopups();
            });
            cpop.appendChild(el);
        });
    }

    _bindSizePopup() {
        const spop = this.shadowRoot.getElementById('spop');
        const slider = spop.querySelector('input[type=range]');
        const dot = spop.querySelector('.size-dot');
        const val = spop.querySelector('.size-val');
        slider.value = this.lineWidth;
        this._updateSizeDot(dot, val);

        slider.addEventListener('input', (e) => {
            e.stopPropagation();
            this.lineWidth = parseInt(e.target.value);
            this._updateSizeDot(dot, val);
        });
    }

    _updateSizeDot(dot, val) {
        const s = Math.max(4, this.lineWidth * 1.5);
        dot.style.width = s + 'px';
        dot.style.height = s + 'px';
        val.textContent = this.lineWidth + 'px';
    }

    connectedCallback() {
        if (this._connected) return;
        this._connected = true;
        setTimeout(() => {
            this.overlay.classList.add('visible');
            this.resizeCanvas();
            this._saveSnapshot(); // initial blank state
            this._updateUndoRedo();
        }, 10);
        this._resizeH = this.resizeCanvas.bind(this);
        window.addEventListener('resize', this._resizeH);
        this._keyH = (e) => {
            if (e.key === 'Escape') this.closeCanvas();
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this.undo(); }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); this.redo(); }
        };
        document.addEventListener('keydown', this._keyH);
    }

    disconnectedCallback() {
        this._connected = false;
        if (this._resizeH) window.removeEventListener('resize', this._resizeH);
        if (this._keyH) document.removeEventListener('keydown', this._keyH);
    }

    _bindEvents() {
        const c = this.canvas;
        // Mouse
        c.addEventListener('mousedown', (e) => this._onPointerDown(e));
        c.addEventListener('mousemove', (e) => this._onPointerMove(e));
        c.addEventListener('mouseup', () => this._onPointerUp());
        c.addEventListener('mouseleave', () => this._onPointerUp());
        // Touch
        c.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
        c.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
        c.addEventListener('touchend', (e) => this._onTouchEnd(e));
        c.addEventListener('touchcancel', (e) => this._onTouchEnd(e));
        // Wheel zoom
        c.addEventListener('wheel', (e) => { e.preventDefault(); this._onWheel(e); }, { passive: false });
        // Double-click to reset zoom
        c.addEventListener('dblclick', () => { if (this.scale !== 1) this.resetZoom(); });
        // Zoom label click = reset
        this.zoomLabel.style.cursor = 'pointer';
        this.zoomLabel.addEventListener('click', () => this.resetZoom());

        // Toolbar buttons
        this.shadowRoot.querySelectorAll('.tb-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.mode = btn.dataset.tool;
                this.shadowRoot.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._closePopups();
            });
        });

        // Action buttons
        const actions = {
            undo: () => this.undo(),
            redo: () => this.redo(),
            lock: () => this._toggleLock(),
            clear: () => this._clearAll(),
            save: () => this._save(),
            color: () => this._togglePopup('color'),
            size: () => this._togglePopup('size'),
        };
        this.shadowRoot.querySelectorAll('.tb-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fn = actions[btn.dataset.action];
                if (fn) fn();
            });
        });

        this.shadowRoot.querySelector('.close-btn').addEventListener('click', () => this.closeCanvas());

        // Close popups on canvas click
        this.overlay.addEventListener('click', (e) => {
            if (!e.target.closest('.tb')) this._closePopups();
        });
    }

    // ── POINTER HANDLING ──
    _getPos(e) {
        const r = this.canvas.getBoundingClientRect();
        const cx = (e.clientX || 0) - r.left;
        const cy = (e.clientY || 0) - r.top;
        // Convert screen coords → canvas coords (accounting for zoom/pan)
        return {
            x: (cx - this.panX) / this.scale,
            y: (cy - this.panY) / this.scale
        };
    }

    _onPointerDown(e) {
        if (this.isLocked) return;
        // Middle click = pan
        if (e.button === 1) { this._startPan(e.clientX, e.clientY); return; }
        if (e.button !== 0) return;
        // Space+click = pan (handled via key)
        e.preventDefault();
        this._startDraw(e);
    }

    _onPointerMove(e) {
        if (this.isPanning) { this._doPan(e.clientX, e.clientY); return; }
        if (!this.isDrawing) return;
        this._doDraw(e);
    }

    _onPointerUp() {
        if (this.isPanning) { this.isPanning = false; return; }
        if (this.isDrawing) this._endDraw();
    }

    _onTouchStart(e) {
        if (this.isLocked) return;
        e.preventDefault();
        if (e.touches.length === 2) {
            // Pinch start
            this._endDraw();
            const d = this._touchDist(e.touches);
            this.pinchStartDist = d;
            this.pinchStartScale = this.scale;
            this._startPan(
                (e.touches[0].clientX + e.touches[1].clientX) / 2,
                (e.touches[0].clientY + e.touches[1].clientY) / 2
            );
            return;
        }
        if (e.touches.length === 1) {
            this._startDraw(e.touches[0]);
        }
    }

    _onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 2) {
            const d = this._touchDist(e.touches);
            const newScale = Math.max(1, Math.min(8, this.pinchStartScale * (d / this.pinchStartDist)));
            this.scale = newScale;
            this._doPan(
                (e.touches[0].clientX + e.touches[1].clientX) / 2,
                (e.touches[0].clientY + e.touches[1].clientY) / 2
            );
            this._applyTransform();
            return;
        }
        if (this.isPanning) return;
        if (e.touches.length === 1 && this.isDrawing) {
            this._doDraw(e.touches[0]);
        }
    }

    _onTouchEnd(e) {
        if (e.touches.length < 2) { this.isPanning = false; }
        if (e.touches.length === 0 && this.isDrawing) this._endDraw();
    }

    _touchDist(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    _onWheel(e) {
        const delta = e.deltaY > 0 ? 0.92 : 1.08;
        const newScale = Math.max(1, Math.min(8, this.scale * delta));
        // Zoom toward cursor position
        const r = this.canvas.getBoundingClientRect();
        const cx = e.clientX - r.left;
        const cy = e.clientY - r.top;
        this.panX = cx - (cx - this.panX) * (newScale / this.scale);
        this.panY = cy - (cy - this.panY) * (newScale / this.scale);
        this.scale = newScale;
        this._applyTransform();
    }

    _startPan(x, y) { this.isPanning = true; this.panStartX = x - this.panX; this.panStartY = y - this.panY; }
    _doPan(x, y) { if (!this.isPanning) return; this.panX = x - this.panStartX; this.panY = y - this.panStartY; this._applyTransform(); }

    _applyTransform() {
        // No CSS transform — zoom is handled via ctx redraw
        this.zoomLabel.textContent = Math.round(this.scale * 100) + '%';
        this._redrawFromSnapshot();
    }

    _redrawFromSnapshot() {
        // Redraw the last saved snapshot with the current transform
        const snap = this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (snap) {
            const img = this._snapshotCache;
            if (img && img._src === snap) {
                // Use cached image
                this.ctx.setTransform(this.scale, 0, 0, this.scale, this.panX, this.panY);
                this.ctx.drawImage(img, 0, 0);
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            } else {
                const newImg = new Image();
                newImg._src = snap;
                newImg.onload = () => {
                    this._snapshotCache = newImg;
                    this.ctx.setTransform(this.scale, 0, 0, this.scale, this.panX, this.panY);
                    this.ctx.drawImage(newImg, 0, 0);
                    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                };
                newImg.src = snap;
            }
        }
    }

    resetZoom() {
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this._applyTransform();
        this._toast('Zoom: 100%');
    }

    // ── DRAWING with quadratic bezier smoothing ──
    _startDraw(e) {
        this.isDrawing = true;
        const pos = this._getPos(e);
        this.points = [pos];
        this.lastX = pos.x;
        this.lastY = pos.y;
        if (!this.hasDrawn) { this.hasDrawn = true; this.placeholder.classList.add('hid'); }
    }

    _doDraw(e) {
        if (!this.isDrawing) return;
        const pos = this._getPos(e);
        this.points.push(pos);

        // Apply transform so we draw in canvas-space
        this.ctx.save();
        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.panX, this.panY);
        this.ctx.beginPath();
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        if (this.mode === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.lineWidth * 3;
            this.ctx.shadowBlur = 0;
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.drawColor;
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.shadowBlur = Math.min(this.lineWidth * 0.8, 6);
            this.ctx.shadowColor = this.drawColor;
        }

        // Quadratic bezier for smooth curves
        if (this.points.length >= 3) {
            const l = this.points.length;
            const p0 = this.points[l - 3];
            const p1 = this.points[l - 2];
            const p2 = this.points[l - 1];
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            this.ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
            this.ctx.quadraticCurveTo(p1.x, p1.y, mx, my);
        } else {
            this.ctx.moveTo(this.lastX, this.lastY);
            this.ctx.lineTo(pos.x, pos.y);
        }
        this.ctx.stroke();
        this.ctx.restore();
        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    _endDraw() {
        this.isDrawing = false;
        this.points = [];
        this.ctx.beginPath();
        this._saveSnapshot();
    }

    // ── UNDO / REDO ──
    _saveSnapshot() {
        // Save at identity transform (no zoom/pan) for clean snapshots
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        const snap = this.canvas.toDataURL();
        this.undoStack.push(snap);
        if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
        this.redoStack = [];
        this._snapshotCache = null; // invalidate cache
        this._updateUndoRedo();
    }

    _restoreSnapshot(dataUrl) {
        const img = new Image();
        img.onload = () => {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            // Re-apply current view transform
            this._redrawFromSnapshot();
        };
        img.src = dataUrl;
    }

    undo() {
        if (this.undoStack.length <= 1) return;
        const current = this.undoStack.pop();
        this.redoStack.push(current);
        const prev = this.undoStack[this.undoStack.length - 1];
        this._restoreSnapshot(prev);
        this._updateUndoRedo();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const snap = this.redoStack.pop();
        this.undoStack.push(snap);
        this._restoreSnapshot(snap);
        this._updateUndoRedo();
    }

    _updateUndoRedo() {
        this.undoBtn?.classList.toggle('disabled', this.undoStack.length <= 1);
        this.redoBtn?.classList.toggle('disabled', this.redoStack.length === 0);
    }

    // ── LOCK ──
    _toggleLock() {
        this.isLocked = !this.isLocked;
        this.overlay.classList.toggle('locked', this.isLocked);
        const btn = this.shadowRoot.querySelector('[data-action="lock"]');
        btn.classList.toggle('active', this.isLocked);
        this._toast(this.isLocked ? 'Lienzo bloqueado' : 'Lienzo desbloqueado');
    }

    // ── CLEAR ──
    _clearAll() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.hasDrawn = false;
        this.placeholder.classList.remove('hid');
        this._saveSnapshot();
        this._toast('Lienzo limpio');
    }

    // ── SAVE ──
    _save() {
        const base64 = this.canvas.toDataURL('image/png');
        let meta = {};
        // Try to read context from global app state
        if (window.__APP_STATE__) {
            const s = window.__APP_STATE__;
            meta = { bookId: s.currentBook?.id, pageId: s.currentStoryId, bookTitle: s.currentBook?.title };
        }
        const entry = saveToGallery(base64, meta);
        this.dispatchEvent(new CustomEvent('canvas-saved', { detail: { image: base64, entry }, bubbles: true, composed: true }));
        window.dispatchEvent(new CustomEvent('profile:collections-updated'));
        this._toast('Guardado en galería ✓');
    }

    // ── POPUPS ──
    _togglePopup(which) {
        if (which === 'color') {
            this._colorOpen = !this._colorOpen;
            this._sizeOpen = false;
        } else {
            this._sizeOpen = !this._sizeOpen;
            this._colorOpen = false;
        }
        this.shadowRoot.getElementById('cpop').classList.toggle('open', this._colorOpen);
        this.shadowRoot.getElementById('spop').classList.toggle('open', this._sizeOpen);
    }

    _closePopups() {
        this._colorOpen = false;
        this._sizeOpen = false;
        this.shadowRoot.getElementById('cpop')?.classList.remove('open');
        this.shadowRoot.getElementById('spop')?.classList.remove('open');
    }

    // ── TOAST ──
    _toast(msg) {
        this.toastEl.textContent = msg;
        this.toastEl.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), 2000);
    }

    // ── RESIZE ──
    resizeCanvas() {
        let tempCanvas;
        if (this.hasDrawn) {
            tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            tempCanvas.getContext('2d').drawImage(this.canvas, 0, 0);
        }
        const r = this.overlay.getBoundingClientRect();
        this.canvas.width = r.width;
        this.canvas.height = r.height;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        if (this.hasDrawn && tempCanvas) {
            this.ctx.drawImage(tempCanvas, 0, 0);
        }
    }

    exportToImage() { return this.canvas.toDataURL('image/png'); }

    closeCanvas() {
        this.overlay.classList.remove('visible');
        setTimeout(() => this.remove(), 500);
    }
}

// Workaround for sync context
function await_import_workaround() {
    try {
        // Attempt to read global state
        return { state: window.__APP_STATE__ || null };
    } catch { return { state: null }; }
}

customElements.define('drawing-canvas', DrawingCanvas);
