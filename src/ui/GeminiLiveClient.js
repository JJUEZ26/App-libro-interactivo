export class GeminiLiveClient {
    constructor({
        apiKey,
        model = 'gemini-2.5-flash-preview-live',
        voiceName = 'Puck',
        targetSampleRate = 16000,
        vadThreshold = 0.015,
        vadSilenceMs = 900,
        vadHangoverMs = 250,
        onStatus,
        onText,
        onAudio,
        onError,
        onVadChange
    } = {}) {
        this.apiKey = apiKey;
        this.model = model;
        this.voiceName = voiceName;
        this.targetSampleRate = targetSampleRate;
        this.vadThreshold = vadThreshold;
        this.vadSilenceMs = vadSilenceMs;
        this.vadHangoverMs = vadHangoverMs;
        this.onStatus = onStatus;
        this.onText = onText;
        this.onAudio = onAudio;
        this.onError = onError;
        this.onVadChange = onVadChange;

        this.ws = null;
        this.captureContext = null;
        this.captureSource = null;
        this.captureProcessor = null;
        this.captureGain = null;
        this.captureStream = null;
        this.outputContext = null;
        this.playbackTime = 0;
        this.isSpeaking = false;
        this.lastVoiceTs = 0;
        this.isStarted = false;
    }

    setVoiceName(voiceName) {
        this.voiceName = voiceName;
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendSetup();
        }
    }

    async start() {
        if (this.isStarted) return;
        await this.connect();
        await this.startAudioCapture();
        this.isStarted = true;
    }

    async connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
        if (!this.apiKey) throw new Error('Falta la API Key de Gemini Live.');
        const endpoint = `wss://generativelanguage.googleapis.com/v1beta/models/${this.model}:connect?key=${this.apiKey}`;

        await new Promise((resolve, reject) => {
            this.ws = new WebSocket(endpoint);
            this.ws.addEventListener('open', () => {
                this.onStatus?.('Conectado al chat de voz.');
                this.sendSetup();
                resolve();
            });
            this.ws.addEventListener('message', (event) => {
                this.handleServerMessage(event.data);
            });
        this.ws.addEventListener('close', (event) => {
            this.onStatus?.('Conexión cerrada.');
            if (event?.reason) {
                this.onError?.(new Error(`WebSocket cerrado (${event.code}): ${event.reason}`));
            }
        });
            this.ws.addEventListener('error', (event) => {
                this.onError?.(event);
                reject(new Error('No se pudo conectar al WebSocket de Gemini Live.'));
            });
        });
    }

    async startAudioCapture() {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('getUserMedia no está disponible en este navegador.');
        }

        this.captureStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        this.captureContext = new AudioContext();
        this.captureSource = this.captureContext.createMediaStreamSource(this.captureStream);
        this.captureProcessor = this.captureContext.createScriptProcessor(4096, 1, 1);
        this.captureGain = this.captureContext.createGain();
        this.captureGain.gain.value = 0;
        this.captureSource.connect(this.captureProcessor);
        this.captureProcessor.connect(this.captureGain);
        this.captureGain.connect(this.captureContext.destination);

        this.captureProcessor.onaudioprocess = (event) => {
            const inputBuffer = event.inputBuffer.getChannelData(0);
            const rms = this.calculateRms(inputBuffer);
            this.updateVad(rms);
            const now = performance.now();
            const shouldSend = this.isSpeaking || (now - this.lastVoiceTs < this.vadHangoverMs);
            if (!shouldSend) return;

            const downsampled = downsampleBuffer(inputBuffer, this.captureContext.sampleRate, this.targetSampleRate);
            const pcm16 = float32ToInt16(downsampled);
            const base64 = encodeBase64(new Uint8Array(pcm16.buffer));
            this.sendAudioChunk(base64, this.targetSampleRate);
        };

        if (this.captureContext.state === 'suspended') {
            await this.captureContext.resume();
        }
    }

    ensureOutputContext() {
        if (!this.outputContext) {
            this.outputContext = new AudioContext();
            this.playbackTime = this.outputContext.currentTime;
        }
    }

    sendSetup() {
        const payload = {
            setup: {
                model: `models/${this.model}`,
                response_modalities: ['AUDIO', 'TEXT'],
                speech_config: {
                    voice_config: {
                        prebuilt_voice_config: {
                            voice_name: this.voiceName
                        }
                    }
                }
            }
        };
        this.send(payload);
    }

    sendAudioChunk(base64Audio, sampleRate) {
        this.send({
            realtime_input: {
                media_chunks: [
                    {
                        mime_type: `audio/pcm;rate=${sampleRate}`,
                        data: base64Audio
                    }
                ]
            }
        });
    }

    handleServerMessage(raw) {
        let message = null;
        try {
            message = JSON.parse(raw);
        } catch (error) {
            this.onError?.(error);
            return;
        }

        if (message.error) {
            this.onError?.(message.error);
        }

        const serverContent = message.server_content;
        if (serverContent?.model_turn?.parts?.length) {
            const parts = serverContent.model_turn.parts;
            const textParts = parts
                .filter((part) => typeof part.text === 'string')
                .map((part) => part.text)
                .join('');
            if (textParts) {
                this.onText?.(textParts, serverContent.turn_complete === true);
            }
            for (const part of parts) {
                if (part.inline_data?.data && part.inline_data?.mime_type?.includes('audio/pcm')) {
                    this.handleAudioChunk(part.inline_data);
                }
            }
        }
    }

    handleAudioChunk({ data, mime_type: mimeType }) {
        const sampleRate = extractSampleRate(mimeType) || 24000;
        const bytes = decodeBase64(data);
        const pcm16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
        const float32 = int16ToFloat32(pcm16);
        this.ensureOutputContext();

        const audioBuffer = this.outputContext.createBuffer(1, float32.length, sampleRate);
        audioBuffer.getChannelData(0).set(float32);

        const source = this.outputContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputContext.destination);

        if (this.playbackTime < this.outputContext.currentTime) {
            this.playbackTime = this.outputContext.currentTime;
        }
        source.start(this.playbackTime);
        this.playbackTime += audioBuffer.duration;
        this.onAudio?.();
    }

    updateVad(rms) {
        const now = performance.now();
        if (rms > this.vadThreshold) {
            this.lastVoiceTs = now;
            if (!this.isSpeaking) {
                this.isSpeaking = true;
                this.onVadChange?.(true);
            }
        } else if (this.isSpeaking && now - this.lastVoiceTs > this.vadSilenceMs) {
            this.isSpeaking = false;
            this.onVadChange?.(false);
        }
    }

    calculateRms(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i += 1) {
            sum += buffer[i] * buffer[i];
        }
        return Math.sqrt(sum / buffer.length);
    }

    send(payload) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify(payload));
    }

    stop() {
        if (this.captureProcessor) {
            this.captureProcessor.disconnect();
            this.captureProcessor.onaudioprocess = null;
            this.captureProcessor = null;
        }
        if (this.captureGain) {
            this.captureGain.disconnect();
            this.captureGain = null;
        }
        if (this.captureSource) {
            this.captureSource.disconnect();
            this.captureSource = null;
        }
        if (this.captureContext) {
            this.captureContext.close();
            this.captureContext = null;
        }
        if (this.captureStream) {
            this.captureStream.getTracks().forEach((track) => track.stop());
            this.captureStream = null;
        }
        if (this.outputContext) {
            this.outputContext.close();
            this.outputContext = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isStarted = false;
        this.isSpeaking = false;
        this.playbackTime = 0;
    }
}

function downsampleBuffer(buffer, sourceRate, targetRate) {
    if (targetRate === sourceRate) return buffer;
    const ratio = sourceRate / targetRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
        let sum = 0;
        let count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
            sum += buffer[i];
            count += 1;
        }
        result[offsetResult] = sum / count;
        offsetResult += 1;
        offsetBuffer = nextOffsetBuffer;
    }
    return result;
}

function float32ToInt16(buffer) {
    const output = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i += 1) {
        let sample = Math.max(-1, Math.min(1, buffer[i]));
        output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return output;
}

function int16ToFloat32(buffer) {
    const output = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i += 1) {
        output[i] = buffer[i] / 0x8000;
    }
    return output;
}

function encodeBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
}

function decodeBase64(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function extractSampleRate(mimeType = '') {
    const match = mimeType.match(/rate=(\d+)/);
    return match ? Number(match[1]) : null;
}
