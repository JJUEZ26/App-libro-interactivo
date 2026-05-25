let startupStylesPromise = null;
let libraryStylesPromise = null;
let readerStylesPromise = null;

function getConnectionInfo() {
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

function isConstrainedConnection() {
    const connection = getConnectionInfo();
    if (!connection) return false;
    const effectiveType = String(connection.effectiveType || '').toLowerCase();
    return Boolean(connection.saveData) || effectiveType.includes('2g') || effectiveType === '3g';
}

function isLowEndDevice() {
    const memory = navigator.deviceMemory || 0;
    const cores = navigator.hardwareConcurrency || 0;
    return (memory > 0 && memory <= 2) || (cores > 0 && cores <= 4);
}

function logStyleError(scope, error) {
    console.warn(`No se pudieron cargar los estilos de ${scope}:`, error);
}

export function ensureStartupStyles() {
    if (startupStylesPromise) return startupStylesPromise;
    startupStylesPromise = import('../styles/startup.css').catch((error) => {
        logStyleError('arranque', error);
    });
    return startupStylesPromise;
}

export function ensureLibraryStyles() {
    if (libraryStylesPromise) return libraryStylesPromise;
    libraryStylesPromise = import('../styles/library-shell.css').catch((error) => {
        logStyleError('biblioteca', error);
    });
    return libraryStylesPromise;
}

export function ensureReaderStyles() {
    if (readerStylesPromise) return readerStylesPromise;
    readerStylesPromise = import('../styles/reader-deferred.css').catch((error) => {
        logStyleError('lector', error);
    });
    return readerStylesPromise;
}

export function scheduleMobileStyleWarmup() {
    const constrainedConnection = isConstrainedConnection();
    const lowEndDevice = isLowEndDevice();
    const shouldWarmReader = !constrainedConnection && !lowEndDevice;

    const warmLibrary = () => {
        ensureLibraryStyles();
    };

    const warmReader = () => {
        ensureReaderStyles();
    };

    const schedulePostLoadWarmup = () => {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(warmLibrary, { timeout: 2200 });
            if (shouldWarmReader) {
                window.requestIdleCallback(warmReader, { timeout: 6200 });
            }
        } else {
            setTimeout(warmLibrary, 2000);
            if (shouldWarmReader) {
                setTimeout(warmReader, 5600);
            }
        }
    };

    if (document.readyState === 'complete') {
        schedulePostLoadWarmup();
    } else {
        window.addEventListener('load', schedulePostLoadWarmup, { once: true });
    }

    // If the user interacts very early, prioritize library shell first.
    const eagerLibraryWarmup = () => {
        ensureLibraryStyles();
        document.removeEventListener('pointerdown', eagerLibraryWarmup, true);
        document.removeEventListener('keydown', eagerLibraryWarmup, true);
    };
    document.addEventListener('pointerdown', eagerLibraryWarmup, true);
    document.addEventListener('keydown', eagerLibraryWarmup, true);
}
