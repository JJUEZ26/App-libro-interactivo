export class SensoryInvite {
    constructor() {
        this.storageKey = 'lecturas_sensory_invite_completed';
        this.overlay = null;
    }

    shouldShow() {
        return localStorage.getItem(this.storageKey) !== 'true';
    }

    start() {
        return new Promise((resolve) => {
            if (!this.shouldShow()) {
                resolve(false); 
                return;
            }

            this.overlay = document.createElement('div');
            this.overlay.className = 'sensory-invite-overlay';
            
            const contentBox = document.createElement('div');
            contentBox.className = 'sensory-invite-content';
            
            contentBox.innerHTML = `
                <div class="sensory-icon-group">
                    <svg class="icon-audio" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                    <div class="icon-divider"></div>
                    <div class="icon-orb-preview"></div>
                </div>
                <h2 class="sensory-title">Bienvenido a la Experiencia</h2>
                <p class="sensory-text">
                    La literatura aquí no se lee en silencio. 
                    <br><br>
                    <strong>El audio y la música ambiental</strong> abarcan el 50% de la narrativa de este entorno, acompañando cada palabra. 
                    <br><br>
                    Además, un <strong>Orbe de Inteligencia Artificial</strong> aguarda para analizar la historia a tu lado en tiempo real, resolviendo dudas y desglosando filosofía a medida que avanzas.
                </p>
                <div class="sensory-actions">
                    <button class="btn btn-ghost" id="sensory-decline">Continuar en silencio</button>
                    <button class="btn btn-primary" id="sensory-accept">
                        <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        Encender Experiencia
                    </button>
                </div>
            `;
            
            this.overlay.appendChild(contentBox);
            document.body.appendChild(this.overlay);

            // Reflow para animación inicial
            this.overlay.offsetHeight;
            this.overlay.classList.add('active');

            const acceptBtn = document.getElementById('sensory-accept');
            const declineBtn = document.getElementById('sensory-decline');

            acceptBtn.addEventListener('click', () => {
                // TODO: Eventualmente despachar un evento o iniciar el sistema de audio global aquí.
                this.finish(resolve);
            });

            declineBtn.addEventListener('click', () => {
                this.finish(resolve);
            });
        });
    }

    finish(resolveCallback) {
        localStorage.setItem(this.storageKey, 'true');
        this.overlay.classList.remove('active');
        this.overlay.classList.add('fade-out');
        
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            resolveCallback(true);
        }, 500); // 500ms match css transition
    }
}
