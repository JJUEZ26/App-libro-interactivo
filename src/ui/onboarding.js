export class Onboarding {
    constructor() {
        this.storageKey = 'lecturas_onboarding_completed';
        this.steps = [
            {
                title: 'Navegación',
                text: 'Desliza hacia los lados o toca los bordes de la pantalla para pasar de página.',
                highlight: 'edges' // css class that adds glowing edges
            },
            {
                title: 'Tus Citas',
                text: 'Selecciona cualquier fragmento de texto para resaltarlo y guardarlo en tu panel de citas.',
                highlight: 'center'
            }
        ];
        this.currentStep = 0;
        this.overlay = null;
    }

    shouldShow() {
        return localStorage.getItem(this.storageKey) !== 'true';
    }

    start() {
        if (!this.shouldShow()) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'onboarding-overlay';
        
        this.dialogBox = document.createElement('div');
        this.dialogBox.className = 'onboarding-dialog';
        
        this.overlay.appendChild(this.dialogBox);
        document.body.appendChild(this.overlay);

        // Force layout
        this.overlay.offsetHeight;
        this.overlay.classList.add('active');

        this.renderStep();
    }

    renderStep() {
        const step = this.steps[this.currentStep];
        
        // Remove old highlights
        this.overlay.classList.remove('highlight-edges', 'highlight-center', 'highlight-orb');
        if (step.highlight) {
            this.overlay.classList.add(`highlight-${step.highlight}`);
        }

        const isLast = this.currentStep === this.steps.length - 1;

        this.dialogBox.innerHTML = `
            <div class="onboarding-content">
                <span class="onboarding-step-counter">Paso ${this.currentStep + 1} de ${this.steps.length}</span>
                <h3 class="onboarding-title">${step.title}</h3>
                <p class="onboarding-text">${step.text}</p>
            </div>
            <div class="onboarding-actions">
                <button class="btn btn-ghost" id="onboarding-skip">Omitir</button>
                <button class="btn btn-primary" id="onboarding-next">${isLast ? 'Comenzar a leer' : 'Siguiente'}</button>
            </div>
        `;

        // Re-bind animate in
        this.dialogBox.classList.remove('animate-in');
        void this.dialogBox.offsetWidth; // force reflow
        this.dialogBox.classList.add('animate-in');

        document.getElementById('onboarding-next').addEventListener('click', () => this.next());
        document.getElementById('onboarding-skip').addEventListener('click', () => this.finish());
    }

    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.renderStep();
        } else {
            this.finish();
        }
    }

    finish() {
        localStorage.setItem(this.storageKey, 'true');
        this.overlay.classList.remove('active');
        this.overlay.classList.add('fade-out');
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
        }, 400); // match css transition
    }
}
