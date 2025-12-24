import { state } from '../app/state.js';

export class ChatFeature {
    constructor(options = {}) {
        this.options = {
            container: document.body,
            enableTTS: false,
            ...options
        };
        this.messages = [];
        this.messageElements = new Map();
        this.isOpen = false;
        this.recognition = null;
        this.setupStyles();
        this.createUI();
        this.setupSpeechRecognition();
    }

    setupStyles() {
        if (document.getElementById('ai-chat-styles')) return;
        const style = document.createElement('style');
        style.id = 'ai-chat-styles';
        style.textContent = `
            .ai-chat-fab {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                border: none;
                cursor: pointer;
                background: linear-gradient(135deg, #4f46e5, #9333ea, #ec4899);
                color: #fff;
                font-weight: 700;
                font-size: 20px;
                box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
                z-index: 9999;
            }

            .ai-chat-panel {
                position: fixed;
                bottom: 90px;
                right: 24px;
                width: min(360px, 92vw);
                max-height: min(560px, 80vh);
                display: flex;
                flex-direction: column;
                background: #111827;
                color: #f9fafb;
                border-radius: 16px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                overflow: hidden;
                opacity: 0;
                transform: translateY(20px);
                pointer-events: none;
                transition: opacity 0.2s ease, transform 0.2s ease;
                z-index: 9999;
            }

            .ai-chat-panel.open {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }

            .ai-chat-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 16px;
                background: #0f172a;
                border-bottom: 1px solid rgba(148, 163, 184, 0.2);
            }

            .ai-chat-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }

            .ai-chat-close {
                border: none;
                background: transparent;
                color: #e2e8f0;
                font-size: 18px;
                cursor: pointer;
            }

            .ai-chat-messages {
                flex: 1;
                padding: 16px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .ai-chat-message {
                max-width: 85%;
                padding: 10px 12px;
                border-radius: 12px;
                font-size: 14px;
                line-height: 1.4;
                white-space: pre-wrap;
            }

            .ai-chat-message.user {
                align-self: flex-end;
                background: #2563eb;
                color: #f8fafc;
            }

            .ai-chat-message.ai {
                align-self: flex-start;
                background: #1f2937;
                color: #e5e7eb;
            }

            .ai-chat-message.loading {
                opacity: 0.7;
                font-style: italic;
            }

            .ai-chat-input-area {
                display: flex;
                gap: 8px;
                padding: 12px;
                background: #0f172a;
                border-top: 1px solid rgba(148, 163, 184, 0.2);
            }

            .ai-chat-input {
                flex: 1;
                border-radius: 10px;
                border: 1px solid #334155;
                background: #0b1220;
                color: #f8fafc;
                padding: 8px 10px;
                font-size: 14px;
            }

            .ai-chat-button {
                border: none;
                border-radius: 10px;
                background: #4f46e5;
                color: #fff;
                padding: 8px 12px;
                font-size: 14px;
                cursor: pointer;
            }

            .ai-chat-button.secondary {
                background: #1f2937;
                border: 1px solid #334155;
            }

            .ai-chat-button.recording {
                background: #dc2626;
            }

            .ai-chat-status {
                font-size: 12px;
                padding: 0 16px 8px;
                color: #94a3b8;
            }
        `;
        document.head.appendChild(style);
    }

    createUI() {
        this.fabButton = document.createElement('button');
        this.fabButton.className = 'ai-chat-fab';
        this.fabButton.setAttribute('aria-label', 'Abrir chat de IA');
        this.fabButton.textContent = 'G';

        this.panel = document.createElement('section');
        this.panel.className = 'ai-chat-panel';
        this.panel.setAttribute('role', 'dialog');
        this.panel.setAttribute('aria-label', 'Chat de IA');

        const header = document.createElement('div');
        header.className = 'ai-chat-header';
        const title = document.createElement('h3');
        title.textContent = 'Asistente de lectura';
        const closeButton = document.createElement('button');
        closeButton.className = 'ai-chat-close';
        closeButton.setAttribute('aria-label', 'Cerrar chat');
        closeButton.textContent = '✕';
        header.appendChild(title);
        header.appendChild(closeButton);

        this.messagesContainer = document.createElement('div');
        this.messagesContainer.className = 'ai-chat-messages';

        this.statusLine = document.createElement('div');
        this.statusLine.className = 'ai-chat-status';
        this.statusLine.textContent = 'Pregunta sobre la página actual del libro.';

        const inputArea = document.createElement('div');
        inputArea.className = 'ai-chat-input-area';

        this.input = document.createElement('input');
        this.input.className = 'ai-chat-input';
        this.input.type = 'text';
        this.input.placeholder = 'Escribe tu pregunta...';
        this.input.setAttribute('aria-label', 'Pregunta al asistente');

        this.micButton = document.createElement('button');
        this.micButton.className = 'ai-chat-button secondary';
        this.micButton.type = 'button';
        this.micButton.textContent = '🎙️';
        this.micButton.setAttribute('aria-label', 'Dictar pregunta');

        this.sendButton = document.createElement('button');
        this.sendButton.className = 'ai-chat-button';
        this.sendButton.type = 'button';
        this.sendButton.textContent = 'Enviar';

        inputArea.appendChild(this.input);
        inputArea.appendChild(this.micButton);
        inputArea.appendChild(this.sendButton);

        this.panel.appendChild(header);
        this.panel.appendChild(this.messagesContainer);
        this.panel.appendChild(this.statusLine);
        this.panel.appendChild(inputArea);

        this.options.container.appendChild(this.fabButton);
        this.options.container.appendChild(this.panel);

        this.fabButton.addEventListener('click', () => this.togglePanel());
        closeButton.addEventListener('click', () => this.closePanel());
        this.sendButton.addEventListener('click', () => this.handleSend());
        this.input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.handleSend();
            }
        });
        this.micButton.addEventListener('click', () => this.startVoiceRecognition());
    }

    togglePanel() {
        if (this.isOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    openPanel() {
        this.isOpen = true;
        this.panel.classList.add('open');
        setTimeout(() => this.input.focus(), 200);
    }

    closePanel() {
        this.isOpen = false;
        this.panel.classList.remove('open');
    }

    addMessage({ sender, text, status }) {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const messageEl = document.createElement('div');
        messageEl.className = `ai-chat-message ${sender}`;
        if (status === 'loading') messageEl.classList.add('loading');
        messageEl.textContent = text;
        this.messagesContainer.appendChild(messageEl);
        this.messages.push({ id, sender, text, status });
        this.messageElements.set(id, messageEl);
        this.scrollToBottom();
        return id;
    }

    updateMessage(id, { text, status }) {
        const message = this.messages.find((item) => item.id === id);
        const messageEl = this.messageElements.get(id);
        if (!message || !messageEl) return;
        if (text) message.text = text;
        if (status) message.status = status;
        messageEl.textContent = message.text;
        messageEl.classList.toggle('loading', message.status === 'loading');
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async handleSend() {
        const question = this.input.value.trim();
        if (!question) return;
        this.input.value = '';
        this.addMessage({ sender: 'user', text: question, status: 'sent' });
        const loadingId = this.addMessage({
            sender: 'ai',
            text: 'Analizando...',
            status: 'loading'
        });

        try {
            const answer = await this.sendToAI(question);
            this.updateMessage(loadingId, { text: answer, status: 'done' });
            if (this.options.enableTTS) this.speak(answer);
        } catch (error) {
            const fallback = 'Lo siento, hubo un problema al contactar con la IA.';
            console.error('ChatFeature error:', error);
            this.updateMessage(loadingId, { text: fallback, status: 'error' });
        }
    }

    async sendToAI(userQuestion) {
        const bookContext = this.getBookContext();
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: userQuestion,
                context: bookContext
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        if (!data || !data.answer) {
            throw new Error('Respuesta inválida del servidor.');
        }
        return data.answer;
    }

    getCurrentPageText() {
        const storyData = state.storyData || state.story || null;
        const currentPageId = state.currentStoryId;

        // TODO: Ajustar estas propiedades según mi implementación real de state.storyData.
        let pageFromState = null;
        if (Array.isArray(storyData)) {
            pageFromState = storyData.find((page) => page.id === currentPageId) || null;
        } else if (storyData?.pages && typeof storyData.currentPageIndex === 'number') {
            pageFromState = storyData.pages[storyData.currentPageIndex] || null;
        } else if (storyData?.currentNode) {
            pageFromState = storyData.currentNode;
        }

        if (pageFromState) {
            if (Array.isArray(pageFromState.scenes)) {
                return pageFromState.scenes.join(' ').trim() || null;
            }
            if (Array.isArray(pageFromState.karaokeLines)) {
                return pageFromState.karaokeLines.map((line) => line.text).join(' ').trim() || null;
            }
            if (typeof pageFromState.text === 'string') {
                return pageFromState.text.trim() || null;
            }
        }

        // TODO: Ajustar este selector a la clase de la página actual en mi lector.
        const selectors = [
            '.page--active',
            '.page.active',
            '.reader-page-current',
            '.page-content',
            '.content-centerer'
        ];
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent) {
                const text = el.textContent.trim();
                if (text) return text;
            }
        }

        return null;
    }

    getBookContext() {
        const storyData = state.storyData || state.story || {};
        const title = storyData.title || 'Desconocido';
        const author = storyData.author || 'Desconocido';
        const currentPageText = this.getCurrentPageText();

        const globalPieces = [];

        // TODO: Ajustar estas propiedades según mi implementación real de state.storyData.
        if (typeof storyData.content === 'string') {
            globalPieces.push(storyData.content);
        }
        if (Array.isArray(storyData.pages)) {
            storyData.pages.forEach((page) => {
                if (Array.isArray(page.scenes)) globalPieces.push(page.scenes.join(' '));
                if (typeof page.text === 'string') globalPieces.push(page.text);
                if (Array.isArray(page.karaokeLines)) {
                    globalPieces.push(page.karaokeLines.map((line) => line.text).join(' '));
                }
            });
        }
        if (Array.isArray(state.story)) {
            state.story.forEach((page) => {
                if (Array.isArray(page.scenes)) globalPieces.push(page.scenes.join(' '));
                if (typeof page.text === 'string') globalPieces.push(page.text);
                if (Array.isArray(page.karaokeLines)) {
                    globalPieces.push(page.karaokeLines.map((line) => line.text).join(' '));
                }
            });
        }

        let globalText = globalPieces.join('\n').replace(/\s+/g, ' ').trim();
        if (globalText.length > 8000) {
            globalText = `${globalText.slice(0, 8000)}...`;
        }

        const currentTextBlock = currentPageText
            ? currentPageText
            : '[No se detectó claramente la página actual; responde usando solo el texto global.]';

        return `Título del libro: ${title}\nAutor: ${author}\n\nTEXTO PRINCIPAL (PÁGINA ACTUAL):\n${currentTextBlock}\n\nTEXTO GLOBAL (RESUMEN LARGO, TRUNCADO):\n${globalText || 'No se pudo obtener texto global.'}`;
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.micButton.disabled = true;
            this.micButton.title = 'Dictado no disponible en este navegador.';
            this.statusLine.textContent = 'Tu navegador no soporta dictado por voz.';
            return;
        }
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'es-ES';
        this.recognition.interimResults = false;

        this.recognition.addEventListener('result', (event) => {
            const transcript = Array.from(event.results)
                .map((result) => result[0].transcript)
                .join(' ')
                .trim();
            if (transcript) {
                this.input.value = transcript;
                this.handleSend();
            }
        });

        this.recognition.addEventListener('end', () => {
            this.micButton.classList.remove('recording');
            this.input.placeholder = 'Escribe tu pregunta...';
        });

        this.recognition.addEventListener('error', (event) => {
            console.warn('SpeechRecognition error:', event.error);
            this.micButton.classList.remove('recording');
        });
    }

    startVoiceRecognition() {
        if (!this.recognition) return;
        try {
            this.micButton.classList.add('recording');
            this.input.placeholder = 'Escuchando...';
            this.recognition.start();
        } catch (error) {
            console.warn('No se pudo iniciar reconocimiento de voz:', error);
            this.micButton.classList.remove('recording');
        }
    }

    speak(text) {
        if (!('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
}
