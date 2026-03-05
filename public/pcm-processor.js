/**
 * AudioWorklet processor para capturar audio del micrófono.
 * Reemplaza al deprecado createScriptProcessor.
 *
 * Este archivo se carga como un módulo separado por el AudioWorklet:
 * audioContext.audioWorklet.addModule('/src/ui/pcm-processor.js')
 */
class PCMProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0];
        if (input && input[0] && input[0].length > 0) {
            // Enviar los samples al hilo principal via port
            this.port.postMessage(input[0]);
        }
        return true; // Mantener el procesador activo
    }
}

registerProcessor('pcm-processor', PCMProcessor);
