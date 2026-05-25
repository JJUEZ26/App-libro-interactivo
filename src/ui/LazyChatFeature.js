export class LazyChatFeature {
    constructor(options = {}) {
        this.options = options;
        this.instance = null;
        this.loadPromise = null;
        this.pendingOpen = false;
    }

    get isOpen() {
        return Boolean(this.instance?.isOpen || this.pendingOpen);
    }

    ensureLoaded() {
        if (this.instance) return Promise.resolve(this.instance);
        if (!this.loadPromise) {
            this.loadPromise = import('./ChatModule.js')
                .then(({ ChatFeature }) => {
                    this.instance = new ChatFeature(this.options);
                    return this.instance;
                })
                .finally(() => {
                    this.loadPromise = null;
                });
        }
        return this.loadPromise;
    }

    runWhenLoaded(action) {
        this.ensureLoaded()
            .then((chatFeature) => {
                action(chatFeature);
            })
            .catch((error) => {
                this.pendingOpen = false;
                console.error('No se pudo cargar el chat IA:', error);
            });
    }

    openPanel() {
        if (this.instance) {
            this.instance.openPanel();
            return;
        }

        this.pendingOpen = true;
        this.runWhenLoaded((chatFeature) => {
            if (this.pendingOpen) chatFeature.openPanel();
            this.pendingOpen = false;
        });
    }

    closePanel() {
        this.pendingOpen = false;
        if (this.instance) this.instance.closePanel();
    }

    togglePanel() {
        if (this.instance) {
            this.instance.togglePanel();
            return;
        }

        if (this.pendingOpen) {
            this.pendingOpen = false;
            return;
        }

        this.openPanel();
    }
}
