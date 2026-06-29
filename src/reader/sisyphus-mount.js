/**
 * sisyphus-mount.js — Dynamic mount logic for the Sísifo game widget.
 *
 * Extracted from render.js to isolate the game bootstrapping logic
 * and its wind particle system from the core page renderer.
 */

// ====================================================
// CYCLE TEXTS — Philosophical overlays per game cycle
// ====================================================
const CYCLE_TEXTS = [
    // Cycle 1
    `Su <span class="sisifo-keyword">castigo</span> encarna la condición humana:<br>el <span class="sisifo-keyword">esfuerzo</span> perpetuo, la lucha diaria<br>contra la gravedad de nuestras propias <span class="sisifo-keyword">responsabilidades</span>.`,
    // Cycle 2
    `En ese instante sutil en que el <span class="sisifo-keyword">hombre</span><br>vuelve sobre su vida, Sísifo contempla<br>esa serie de actos sin vínculo<br>que se convierten en su <span class="sisifo-keyword">destino</span>.`,
    // Cycle 3 (easter egg)
    `La <span class="sisifo-keyword">lucha</span> misma hacia las <span class="sisifo-keyword">cumbres</span><br>basta para llenar un corazón de hombre.<br><br>Hay que imaginarse a Sísifo <span class="sisifo-keyword">feliz</span>.`,
];

// ====================================================
// WIDGET INSTANCE — Managed locally
// ====================================================
let activeSisyphusWidget = null;

/**
 * Returns and clears the active widget instance.
 * Called by render.js before rendering a new page.
 */
export function destroySisyphusWidget() {
    if (activeSisyphusWidget) {
        try { activeSisyphusWidget.destroy(); } catch (_) { /* ignore */ }
        activeSisyphusWidget = null;
    }
}

// ====================================================
// WIDGET LOADER — Script-tag based dynamic import
// Vite cannot statically analyze imports from /public/
// ====================================================

/**
 * Dynamically loads the Sisyphus widget ES module via a script tag shim.
 * @returns {Promise<{ createSisyphusGame: Function }>}
 */
function loadSisyphusWidget() {
    if (window.SisyphusWidget?.createSisyphusGame) {
        return Promise.resolve(window.SisyphusWidget);
    }

    return new Promise((resolve, reject) => {
        const onReady = () => {
            window.removeEventListener('sisyphus-widget-ready', onReady);
            resolve(window.SisyphusWidget);
        };
        window.addEventListener('sisyphus-widget-ready', onReady);

        if (!document.querySelector('script[data-sisyphus-widget]')) {
            const script = document.createElement('script');
            script.type = 'module';
            script.dataset.sisyphusWidget = 'true';
            script.src = '/dist/sisyphus-loader.js';
            document.head.appendChild(script);
        }

        setTimeout(() => {
            window.removeEventListener('sisyphus-widget-ready', onReady);
            if (window.SisyphusWidget?.createSisyphusGame) {
                resolve(window.SisyphusWidget);
            } else {
                reject(new Error('Timeout loading sisyphus-widget'));
            }
        }, 8000);
    });
}

// ====================================================
// WIND PARTICLE SYSTEM — Cinematic push feedback
// ====================================================

function createWindSystem(gameContainer) {
    const windContainer = document.createElement('div');
    windContainer.className = 'sisifo-wind-container';
    gameContainer.appendChild(windContainer);

    let windIntervalId = null;
    let windActive = false;

    function spawnWindParticle(intensity) {
        const p = document.createElement('div');
        const isGust = Math.random() < 0.28;
        const isThick = Math.random() < 0.3;
        p.className = 'sisifo-wind-particle' +
            (isGust ? ' sisifo-wind-particle--gust' : '') +
            (isThick ? ' sisifo-wind-particle--thick' : '');
        const w = 40 + Math.random() * 160 * intensity;
        const alpha = (0.14 + Math.random() * 0.28) * Math.min(1, intensity);
        const dur = 0.7 + Math.random() * 1.1 / Math.max(0.3, intensity);
        const delay = Math.random() * 0.25;
        const yPct = 5 + Math.random() * 88;
        const drift = (Math.random() - 0.5) * 16;
        p.style.cssText = `--wind-w:${w.toFixed(0)}px;--wind-alpha:${alpha.toFixed(2)};` +
            `--wind-dur:${dur.toFixed(2)}s;--wind-delay:${delay.toFixed(2)}s;` +
            `--wind-y:${yPct.toFixed(1)}%;--wind-drift:${drift.toFixed(1)}px;`;
        windContainer.appendChild(p);
        setTimeout(() => p.remove(), (dur + delay + 0.4) * 1000);
    }

    function startWindEffect(intensity) {
        if (windActive) return;
        windActive = true;
        const rate = Math.max(55, 300 - intensity * 240);
        for (let i = 0; i < 5; i++) setTimeout(() => spawnWindParticle(intensity), i * 90);
        windIntervalId = setInterval(() => spawnWindParticle(intensity), rate);
    }

    function stopWindEffect() {
        if (!windActive) return;
        windActive = false;
        clearInterval(windIntervalId);
        windIntervalId = null;
    }

    return { startWindEffect, stopWindEffect };
}

// ====================================================
// MAIN MOUNT FUNCTION
// ====================================================

/**
 * Mounts the Sisyphus game widget into the given container.
 * @param {HTMLElement} gameContainer - The container element for the game.
 * @param {HTMLElement} pageContentEl - The parent page content element.
 * @param {{ goToPage: Function }} deps - Navigation dependency.
 */
export async function mountSisyphusGame(gameContainer, pageContentEl, { goToPage }) {
    try {
        const widgetModule = await loadSisyphusWidget();
        const createSisyphusGame = widgetModule.createSisyphusGame;

        // Game hint
        const hint = document.createElement('div');
        hint.className = 'sisifo-game-hint';
        hint.textContent = 'Mantén presionado sobre la figura para empujar la roca';
        gameContainer.appendChild(hint);

        // Wind system
        const { startWindEffect, stopWindEffect } = createWindSystem(gameContainer);

        // Cycle overlay
        const overlay = document.createElement('div');
        overlay.className = 'sisifo-cycle-overlay';
        overlay.innerHTML = `<div class="sisifo-cycle-text"></div>`;
        gameContainer.appendChild(overlay);

        const textEl = overlay.querySelector('.sisifo-cycle-text');
        let hasAdvancedToNextPage = false;
        let lastSpeedMult = 1;

        const game = createSisyphusGame(gameContainer, {
            assetBaseUrl: '/dist/assets/',
            onCycleComplete: (cycleNumber) => {
                hint.classList.add('hidden');

                const textIndex = Math.min(cycleNumber - 1, CYCLE_TEXTS.length - 1);
                const text = CYCLE_TEXTS[textIndex];
                if (!text) return;

                textEl.innerHTML = text;

                const existingBtn = overlay.querySelector('.sisifo-continue-btn');
                if (existingBtn) existingBtn.remove();

                if (cycleNumber >= 2) {
                    const btn = document.createElement('button');
                    btn.className = 'sisifo-continue-btn';
                    btn.textContent = 'Continuar';
                    btn.addEventListener('click', () => {
                        if (!hasAdvancedToNextPage && goToPage) {
                            hasAdvancedToNextPage = true;
                            stopWindEffect();
                            goToPage('contemplacion');
                        }
                    });
                    overlay.appendChild(btn);
                }

                overlay.classList.add('visible');

                if (cycleNumber < 2) {
                    setTimeout(() => overlay.classList.remove('visible'), 5000);
                }
            }
        });

        activeSisyphusWidget = game;

        // Connect wind to physics feedback
        game.onProgressUpdate = (data) => {
            if (data.isPushing && typeof lastSpeedMult === 'number' && lastSpeedMult < 0.65) {
                const intensity = Math.min(1, (0.65 - lastSpeedMult) / 0.3);
                startWindEffect(Math.max(0.25, intensity));
            } else if (!data.isPushing) {
                stopWindEffect();
            }
        };

        console.log('%c🪨 Sísifo montado en el reader', 'color:#e07a5f;font-weight:bold');
    } catch (error) {
        console.error('Error al cargar el widget de Sísifo:', error);
        gameContainer.innerHTML = `<p style="color: rgba(220,225,235,0.6); text-align: center; padding-top: 30%; font-family: Inter, sans-serif; font-size: 0.95rem;">No se pudo cargar el motor de juego.</p>`;
    }
}
