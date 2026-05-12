/**
 * Efectos de atmósfera para la biblioteca (Meta A.2)
 * Drone ambiental generativo con Web Audio API.
 */

let sharedCtx = null;

export function startLibraryDrone(getCurrentVolume) {
    if (!sharedCtx) {
        sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Si ya está cerrado o en error irrecuperable, crear otro
    if (sharedCtx.state === 'closed') {
        sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Por políticas de autoplay, suspenderlo inicialmente si no está running
    if (sharedCtx.state !== 'running') {
        sharedCtx.suspend();
    }

    const osc1 = sharedCtx.createOscillator();
    const osc2 = sharedCtx.createOscillator();
    const lfo = sharedCtx.createOscillator();
    
    const mixGain = sharedCtx.createGain();
    const filter = sharedCtx.createBiquadFilter();
    const masterGain = sharedCtx.createGain();
    const lfoGain = sharedCtx.createGain();

    // Oscilador 1: Sine 55Hz (A1)
    osc1.type = 'sine';
    osc1.frequency.value = 55;

    // Oscilador 2: Triangle 82.41Hz (E2 detuned)
    osc2.type = 'triangle';
    osc2.frequency.value = 82.41 * Math.pow(2, 3/1200); // +3 cents detune

    // Ganancia pre-mezcla para osc2
    const osc2Gain = sharedCtx.createGain();
    osc2Gain.gain.value = 0.6;
    osc2.connect(osc2Gain);

    // Conectar osciladores a mixGain
    osc1.connect(mixGain);
    osc2Gain.connect(mixGain);

    // Filtro Lowpass
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 1.5;

    // LFO modula la frecuencia del filtro (0.05Hz = 1 ciclo cada 20s)
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = 80; // Modula +/- 80Hz
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Master Gain (Inicia en 0 para fade-in)
    masterGain.gain.value = 0;

    // Cadena principal
    mixGain.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(sharedCtx.destination);

    let isPlaying = false;
    let volumeSyncInterval = null;

    function startAudioNodes() {
        if (isPlaying) return;
        isPlaying = true;
        
        osc1.start();
        osc2.start();
        lfo.start();

        const targetVol = 0.04 * (getCurrentVolume() || 0);
        masterGain.gain.linearRampToValueAtTime(targetVol, sharedCtx.currentTime + 5);

        // Sincronización continua de volumen
        volumeSyncInterval = setInterval(() => {
            if (sharedCtx.state === 'running') {
                const vol = 0.04 * (getCurrentVolume() || 0);
                masterGain.gain.setTargetAtTime(vol, sharedCtx.currentTime, 0.5);
            }
        }, 1000);
    }

    // Política de Autoplay: Esperar interacción si está suspendido
    function onInteract() {
        if (sharedCtx.state === 'suspended') {
            sharedCtx.resume().then(() => {
                startAudioNodes();
            });
        }
        document.removeEventListener('click', onInteract);
        document.removeEventListener('touchstart', onInteract);
    }

    if (sharedCtx.state === 'running') {
        startAudioNodes();
    } else {
        document.addEventListener('click', onInteract, { once: true });
        document.addEventListener('touchstart', onInteract, { once: true });
    }

    return function cleanup() {
        document.removeEventListener('click', onInteract);
        document.removeEventListener('touchstart', onInteract);
        
        if (volumeSyncInterval) clearInterval(volumeSyncInterval);
        
        if (isPlaying && sharedCtx.state === 'running') {
            masterGain.gain.cancelScheduledValues(sharedCtx.currentTime);
            masterGain.gain.setValueAtTime(masterGain.gain.value, sharedCtx.currentTime);
            masterGain.gain.linearRampToValueAtTime(0, sharedCtx.currentTime + 2);
            
            setTimeout(() => {
                try {
                    osc1.stop();
                    osc2.stop();
                    lfo.stop();
                    osc1.disconnect();
                    osc2.disconnect();
                    lfo.disconnect();
                    filter.disconnect();
                    masterGain.disconnect();
                } catch (e) {
                    // Ignorar errores si ya se detuvo
                }
            }, 2200);
        }
    };
}
