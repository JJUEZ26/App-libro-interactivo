/**
 * CommandOrb — Unified floating control
 * Merges audio control + AI chat into a single contextual orb.
 * Audio is the primary function; AI is secondary, revealed with interaction.
 *
 * Inspired by:
 *  - Apple Dynamic Island (contextual transformation)
 *  - Spotify mini-player (floating, minimal)
 *  - Material Design 3 Extended FAB (expandable)
 */

import { state } from '../app/state.js';

export class CommandOrb {
    constructor({ chatFeature }) {
        this.chatFeature = chatFeature;
        this.mode = 'ia'; // 'ia' | 'audio'
        this.isSecondaryRevealed = false;
        this.secondaryTimer = null;
        this.longPressTimer = null;
        this.isLongPress = false;

        this.createElement();
        this.bindEvents();

        // Store ref in state for audio.js access
        state.commandOrb = this;
    }

    // =============================
    // DOM CREATION
    // =============================
    createElement() {
        this.el = document.createElement('div');
        this.el.id = 'command-orb';
        this.el.className = 'command-orb mode-ia';
        this.el.innerHTML = `
            <button class="command-orb__tertiary" aria-label="Lienzo de dibujo" tabindex="0">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
            </button>
            <button class="command-orb__secondary" aria-label="Asistente de lectura IA" tabindex="0">
                <span>G</span>
            </button>
            <button class="command-orb__primary" aria-label="Control" tabindex="0">
                <div class="command-orb__halo"></div>
                <div class="command-orb__core">
                    <div class="command-orb__eq" aria-hidden="true">
                        <span></span><span></span><span></span>
                    </div>
                    <svg class="command-orb__icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <svg class="command-orb__icon-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                    <span class="command-orb__letter" aria-hidden="true">G</span>
                </div>
            </button>
            <span class="command-orb__tooltip"></span>
        `;

        this.primary = this.el.querySelector('.command-orb__primary');
        this.secondary = this.el.querySelector('.command-orb__secondary');
        this.tertiary = this.el.querySelector('.command-orb__tertiary');
        this.tooltip = this.el.querySelector('.command-orb__tooltip');
        this.core = this.el.querySelector('.command-orb__core');

        document.body.appendChild(this.el);
    }

    // =============================
    // EVENT BINDING
    // =============================
    bindEvents() {
        // — Primary: tap handler —
        this.primary.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (this.isLongPress) {
                this.isLongPress = false;
                return; // Swallow click after long-press
            }
            this.handlePrimaryTap();
        });

        // — Primary: long-press detection (mobile) —
        this.primary.addEventListener('touchstart', () => {
            this.isLongPress = false;
            this.longPressTimer = setTimeout(() => {
                this.isLongPress = true;
                this.revealSecondary();
                if (navigator.vibrate) navigator.vibrate(10);
            }, 400);
        }, { passive: true });

        this.primary.addEventListener('touchend', () => {
            clearTimeout(this.longPressTimer);
        }, { passive: true });

        this.primary.addEventListener('touchcancel', () => {
            clearTimeout(this.longPressTimer);
            this.isLongPress = false;
        }, { passive: true });

        this.primary.addEventListener('touchmove', () => {
            clearTimeout(this.longPressTimer);
        }, { passive: true });

        // — Secondary: tap handler —
        this.secondary.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.handleSecondaryTap();
        });

        // — Tertiary: tap handler —
        this.tertiary.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.handleTertiaryTap();
        });

        // — Keyboard accessibility —
        this.primary.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handlePrimaryTap();
            }
        });

        this.secondary.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleSecondaryTap();
            }
        });

        // — Desktop: hover reveals secondary —
        this.el.addEventListener('mouseenter', () => {
            if (this.mode === 'audio' && !this.chatFeature.isOpen) {
                this.revealSecondary();
            }
        });

        this.el.addEventListener('mouseleave', () => {
            this.dismissSecondary(800);
        });
    }

    // =============================
    // TAP HANDLERS
    // =============================
    handlePrimaryTap() {
        // If chat is open → close it
        if (this.chatFeature.isOpen) {
            this.chatFeature.closePanel();
            return;
        }

        if (this.mode === 'ia') {
            // No audio → toggle chat
            this.chatFeature.togglePanel();
            return;
        }

        // Audio mode → toggle audio (dispatched to audio.js)
        document.dispatchEvent(new CustomEvent('command-orb-audio-tap'));

        // Briefly flash the secondary (so user discovers the IA)
        this.flashSecondary();
    }

    handleSecondaryTap() {
        this.chatFeature.togglePanel();
        this.hideSecondary();
    }

    async handleTertiaryTap() {
        this.hideSecondary();
        // Guard: don't open a second canvas if one is already active
        if (document.querySelector('drawing-canvas')) return;
        // Lazy-load and mount the Web Component
        await import('../components/DrawingCanvas.js');
        const canvas = document.createElement('drawing-canvas');
        document.body.appendChild(canvas);
    }

    // =============================
    // SECONDARY ORB CONTROL
    // =============================
    revealSecondary() {
        if (this.mode === 'ia') return;
        this.el.classList.add('secondary-visible');
        this.isSecondaryRevealed = true;
        clearTimeout(this.secondaryTimer);
        this.secondaryTimer = setTimeout(() => this.hideSecondary(), 4000);
    }

    hideSecondary() {
        this.el.classList.remove('secondary-visible');
        this.isSecondaryRevealed = false;
    }

    flashSecondary() {
        if (this.mode === 'ia') return;
        this.revealSecondary();
        clearTimeout(this.secondaryTimer);
        this.secondaryTimer = setTimeout(() => this.hideSecondary(), 2500);
    }

    dismissSecondary(delay = 0) {
        clearTimeout(this.secondaryTimer);
        if (delay > 0) {
            this.secondaryTimer = setTimeout(() => this.hideSecondary(), delay);
        } else {
            this.hideSecondary();
        }
    }

    // =============================
    // MODE SWITCHING
    // =============================
    setMode(mode) {
        this.mode = mode;
        this.el.classList.toggle('mode-ia', mode === 'ia');
        this.el.classList.toggle('mode-audio', mode === 'audio');
        if (mode === 'ia') {
            this.hideSecondary();
            this.primary.setAttribute('aria-label', 'Abrir asistente IA');
        }
    }

    // =============================
    // AUDIO STATE SYNC
    // Called by syncAudioExperienceUI() in audio.js
    // =============================
    syncAudioState(status) {
        const states = ['is-invitation', 'is-playing', 'is-paused', 'is-silent', 'is-loading', 'is-blocked'];
        this.el.classList.remove(...states);

        if (this.mode !== 'audio') return;

        switch (status) {
            case 'playing':
                this.el.classList.add('is-playing');
                this.primary.setAttribute('aria-label', 'Pausar audio');
                break;
            case 'paused':
                this.el.classList.add('is-paused');
                this.primary.setAttribute('aria-label', 'Reanudar audio');
                break;
            case 'blocked':
                this.el.classList.add('is-blocked');
                this.primary.setAttribute('aria-label', 'Toca para activar el sonido');
                this.setTooltip('Toca para activar');
                break;
            case 'silent':
                this.el.classList.add('is-silent');
                this.primary.setAttribute('aria-label', 'Activar experiencia sonora');
                break;
            case 'preparing':
                this.el.classList.add('is-loading');
                this.primary.setAttribute('aria-label', 'Cargando audio');
                break;
            default: // 'prompt'
                this.el.classList.add('is-invitation');
                this.primary.setAttribute('aria-label', 'Toca para la experiencia sonora');
                this.setTooltip('Experiencia sonora');
                break;
        }
    }

    // =============================
    // CHAT STATE SYNC
    // Called by ChatModule open/close
    // =============================
    onChatToggle(isOpen) {
        this.el.classList.toggle('chat-open', isOpen);
        if (isOpen) {
            this.hideSecondary();
        }
    }

    // =============================
    // TOOLTIP
    // =============================
    setTooltip(text) {
        this.tooltip.textContent = text;
    }
}
