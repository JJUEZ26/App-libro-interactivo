export class ChromaKeyVideo extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.rafId = null;
    }

    connectedCallback() {
        const src = this.getAttribute('src');
        if (!src) return;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    max-width: 100%;
                    overflow: hidden;
                    /* Default sizing, usually overridden by container */
                    aspect-ratio: 16/9; 
                }
                .container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                video {
                    display: none;
                }
                canvas {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            </style>
            <div class="container">
                <video src="${src}" playsinline muted autoplay ${this.hasAttribute('loop') ? 'loop' : ''} crossorigin="anonymous"></video>
                <canvas></canvas>
            </div>
        `;

        this.video = this.shadowRoot.querySelector('video');
        this.canvas = this.shadowRoot.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        // Force play on some browsers that require interaction or just to be safe
        this.video.addEventListener('loadedmetadata', () => {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this.style.aspectRatio = `${this.canvas.width}/${this.canvas.height}`;
            this.video.play().catch(e => console.warn("Auto-play prevented", e));
        });

        this.video.addEventListener('play', () => {
            this.timerCallback();
        });

        // When video ends (non-looping), keep last frame visible and dispatch event
        this.video.addEventListener('ended', () => {
            if (!this.hasAttribute('loop')) {
                // Keep the last frame painted on canvas (bird stays perched)
                // Just stop the animation loop and notify parent
                if (this.rafId) {
                    cancelAnimationFrame(this.rafId);
                    this.rafId = null;
                }
                this.dispatchEvent(new CustomEvent('videoended', { bubbles: true }));
            }
        });
    }

    disconnectedCallback() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        if (this.video) {
            this.video.pause();
            this.video.removeAttribute('src');
            this.video.load();
        }
    }

    timerCallback() {
        if (this.video.paused || this.video.ended) {
            return;
        }
        this.computeFrame();
        this.rafId = requestAnimationFrame(() => this.timerCallback());
    }

    computeFrame() {
        if (this.canvas.width === 0 || this.canvas.height === 0) return;

        // Draw the current video frame to the canvas
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        // Read the image data
        let frame = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        let l = frame.data.length / 4;

        for (let i = 0; i < l; i++) {
            let r = frame.data[i * 4 + 0];
            let g = frame.data[i * 4 + 1];
            let b = frame.data[i * 4 + 2];

            // Determine if the pixel is dominantly green
            let maxRb = Math.max(r, b);

            // These thresholds might need tuning depending on the exact shade of green
            if (g > maxRb + 10 && g > 70) {
                let diff = g - maxRb;
                let alpha = 255;

                if (diff > 50) {
                    // Completely transparent for strong green
                    alpha = 0;
                } else {
                    // Smooth transition for anti-aliasing (halo reduction)
                    // Map diff from 10..50 to 255..0
                    alpha = 255 - ((diff - 10) * (255 / 40));
                }

                frame.data[i * 4 + 3] = alpha;

                // Spill suppression: reduce remaining green so edges don't look sickly
                if (alpha > 0) {
                    frame.data[i * 4 + 1] = Math.min(g, maxRb + 10);
                }
            }
        }

        // Put the modified image data back onto the canvas
        this.ctx.putImageData(frame, 0, 0);
    }
}
customElements.define('chroma-key-video', ChromaKeyVideo);
