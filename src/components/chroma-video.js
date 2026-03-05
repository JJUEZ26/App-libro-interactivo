/**
 * <chroma-key-video> — Web Component para eliminar fondo verde de videos.
 *
 * VERSIÓN 2.0: Usa WebGL shader para chromakey en GPU.
 * La v1 usaba getImageData() por píxel que bloqueaba el CPU ~10ms/frame.
 * Esta versión hace el mismo trabajo en ~0.1ms via GPU fragment shader.
 */
export class ChromaKeyVideo extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.rafId = null;
        this.gl = null;
        this.program = null;
        this.texture = null;
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

        // Intentar usar WebGL, fallback a Canvas 2D si no está disponible
        this.gl = this.canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
        if (this.gl) {
            this._initWebGL();
        } else {
            // Fallback: Canvas 2D (como la versión anterior)
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
            this._useFallback = true;
        }

        this.video.addEventListener('loadedmetadata', () => {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this.style.aspectRatio = `${this.canvas.width}/${this.canvas.height}`;
            if (this.gl) {
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
            this.video.play().catch(e => console.warn("Auto-play prevented", e));
        });

        this.video.addEventListener('play', () => {
            this._renderLoop();
        });

        this.video.addEventListener('ended', () => {
            if (!this.hasAttribute('loop')) {
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
        // Limpiar recursos WebGL
        if (this.gl && this.texture) {
            this.gl.deleteTexture(this.texture);
        }
    }

    // =============================================
    // WebGL Setup
    // =============================================

    _initWebGL() {
        const gl = this.gl;

        // Vertex shader: dibuja un quad que cubre toda la pantalla
        const vsSource = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            varying vec2 v_texCoord;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
        `;

        // Fragment shader: chromakey — elimina verde, suaviza bordes
        const fsSource = `
            precision mediump float;
            uniform sampler2D u_image;
            varying vec2 v_texCoord;

            void main() {
                vec4 color = texture2D(u_image, v_texCoord);
                float r = color.r;
                float g = color.g;
                float b = color.b;
                float maxRB = max(r, b);
                float diff = g - maxRB;

                float alpha = 1.0;
                if (diff > 0.125) {
                    alpha = 0.0;
                } else if (diff > 0.025) {
                    // Suavizado para anti-aliasing (halo reduction)
                    alpha = 1.0 - (diff - 0.025) / 0.1;
                }

                // Spill suppression: reducir verde residual en bordes
                float newG = (alpha > 0.0 && alpha < 1.0) ? min(g, maxRB + 0.04) : g;

                gl_FragColor = vec4(color.r, newG, color.b, color.a * alpha);
            }
        `;

        // Compilar shaders
        const vs = this._compileShader(gl.VERTEX_SHADER, vsSource);
        const fs = this._compileShader(gl.FRAGMENT_SHADER, fsSource);
        if (!vs || !fs) return;

        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Shader program link error:', gl.getProgramInfoLog(this.program));
            this._useFallback = true;
            return;
        }

        gl.useProgram(this.program);

        // Full-screen quad (2 triángulos)
        const positions = new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1
        ]);
        const texCoords = new Float32Array([
            0, 1, 1, 1, 0, 0,
            0, 0, 1, 1, 1, 0
        ]);

        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        const posLoc = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const texBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
        const texLoc = gl.getAttribLocation(this.program, 'a_texCoord');
        gl.enableVertexAttribArray(texLoc);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

        // Crear textura para el video
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Habilitar transparencia
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    _compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    // =============================================
    // Render Loop
    // =============================================

    _renderLoop() {
        if (this.video.paused || this.video.ended) return;

        if (this._useFallback) {
            this._renderCanvas2D();
        } else {
            this._renderWebGL();
        }

        this.rafId = requestAnimationFrame(() => this._renderLoop());
    }

    _renderWebGL() {
        const gl = this.gl;
        if (!gl || !this.texture) return;
        if (this.canvas.width === 0 || this.canvas.height === 0) return;

        // Subir el frame del video como textura (la GPU hace el chromakey)
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);

        // Dibujar
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // Fallback Canvas 2D (para navegadores sin WebGL)
    _renderCanvas2D() {
        if (!this.ctx || this.canvas.width === 0 || this.canvas.height === 0) return;

        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        const frame = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const len = frame.data.length / 4;

        for (let i = 0; i < len; i++) {
            const r = frame.data[i * 4];
            const g = frame.data[i * 4 + 1];
            const b = frame.data[i * 4 + 2];
            const maxRb = Math.max(r, b);

            if (g > maxRb + 10 && g > 70) {
                const diff = g - maxRb;
                let alpha = 255;
                if (diff > 50) {
                    alpha = 0;
                } else {
                    alpha = 255 - ((diff - 10) * (255 / 40));
                }
                frame.data[i * 4 + 3] = alpha;
                if (alpha > 0) {
                    frame.data[i * 4 + 1] = Math.min(g, maxRb + 10);
                }
            }
        }
        this.ctx.putImageData(frame, 0, 0);
    }
}

customElements.define('chroma-key-video', ChromaKeyVideo);
