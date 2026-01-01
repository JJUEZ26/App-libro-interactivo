/* src/ui/GeminiLiveClient.js */
export class GeminiLiveClient {
    constructor({ apiKey, model = 'gemini-2.0-flash-exp', voiceName = 'Puck', onStatus, onText, onAudio, onError }) {
        this.apiKey = apiKey;
        this.model = model;
        this.voiceName = voiceName;
        this.onStatus = onStatus;
        this.onText = onText;
        this.onAudio = onAudio;
        this.onError = onError;

        // Estado interno
        this.ws = null;
        this.audioContext = null;      // Para capturar micrófono
        this.mediaStream = null;
        this.processor = null;
        this.inputSampleRate = 16000;
        
        // Contexto de salida (Reproducción) - Lo creamos UNA sola vez
        this.outputContext = null;
        this.nextPlayTime = 0;
    }

    async start() {
        this.onStatus?.("Iniciando conexión...");
        // Inicializar contexto de salida si no existe
        if (!this.outputContext) {
            this.outputContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        }
        
        await this.connect();
        await this.startRecording();
    }

    async connect() {
        const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;

        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                this.onStatus?.("🟢 Conectado. Habla ahora.");
                this.sendSetup();
                resolve();
            };

            this.ws.onmessage = async (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onclose = (ev) => {
                this.onStatus?.("🔴 Desconectado");
                console.log("Cierre WS:", ev.code, ev.reason);
            };

            this.ws.onerror = (err) => {
                console.error("Error WS:", err);
                this.onError?.(err);
                reject(err);
            };
        });
    }

    sendSetup() {
        const setupMessage = {
            setup: {
                model: `models/${this.model}`,
                generation_config: {
                    response_modalities: ["AUDIO"],
                    speech_config: {
                        voice_config: { prebuilt_voice_config: { voice_name: this.voiceName } }
                    }
                }
            }
        };
        this.ws.send(JSON.stringify(setupMessage));
    }

    async handleMessage(data) {
        if (data instanceof Blob) {
            try {
                const arrayBuffer = await data.arrayBuffer();
                this.playAudioChunk(arrayBuffer);
                this.onAudio?.(); 
            } catch (e) {
                console.error("Error decodificando audio", e);
            }
        } else {
            // Manejo de mensajes de control (texto)
            try {
                // Aquí podrías procesar 'turn_complete' si quisieras
            } catch (e) {}
        }
    }

    async startRecording() {
        // Contexto de entrada (Micrófono)
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: this.inputSampleRate
        });

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: this.inputSampleRate
                }
            });

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = this.convertFloat32ToInt16(inputData);
                this.sendAudioChunk(pcm16);
            };

            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

        } catch (err) {
            this.onError?.("Error mic: " + err.message);
        }
    }

    sendAudioChunk(int16Data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const base64Audio = this.arrayBufferToBase64(int16Data.buffer);
            const msg = {
                realtime_input: {
                    media_chunks: [{
                        mime_type: "audio/pcm",
                        data: base64Audio
                    }]
                }
            };
            this.ws.send(JSON.stringify(msg));
        }
    }

    stop() {
        // Detener micrófono
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        // Cerrar WebSocket
        if (this.ws) {
            this.ws.close();
        }
        this.onStatus?.("⏹️ Detenido");
    }

    // --- Utilidades ---
    convertFloat32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array;
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    playAudioChunk(arrayBuffer) {
        // Usamos el contexto de salida persistente
        if (!this.outputContext) return;

        const float32Data = new Float32Array(arrayBuffer.byteLength / 2);
        const dataView = new DataView(arrayBuffer);

        for (let i = 0; i < float32Data.length; i++) {
            const int16 = dataView.getInt16(i * 2, true);
            float32Data[i] = int16 / 32768.0;
        }

        const buffer = this.outputContext.createBuffer(1, float32Data.length, 24000);
        buffer.copyToChannel(float32Data, 0);

        const source = this.outputContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.outputContext.destination);

        // Lógica simple de cola para que no se superpongan los audios
        const now = this.outputContext.currentTime;
        // Si el próximo tiempo de reproducción es menor que ahora, empezamos ya.
        // Si no, programamos para cuando termine el anterior.
        const startTime = Math.max(now, this.nextPlayTime);
        
        source.start(startTime);
        this.nextPlayTime = startTime + buffer.duration;
    }
}
