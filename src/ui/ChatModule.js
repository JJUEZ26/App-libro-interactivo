import { state } from '../app/state.js';
import '../styles/chat.css';

export class ChatFeature {
    constructor(options = {}) {
        this.options = {
            container: document.body,
            enableTTS: false,
            enableLiveVoice: false, // Desactivado temporalmente según petición
            // Mantenemos el modelo 2.0 experimental porque es el único que soporta voz
            liveVoiceModel: 'gemini-2.0-flash-exp',
            liveApiKey: '',
            ...options
        };
        this.messages = [];
        this.conversationHistory = [];
        this.libraryCatalog = [];
        this.libraryCatalogPromise = this.loadLibraryCatalog();
        this.messageElements = new Map();
        this.isOpen = false;
        this.recognition = null;
        this.liveClient = null;
        this.isLiveActive = false;
        this.liveTextMessageId = null;
        this.liveTextBuffer = '';
        this.setupStyles();
        this.createUI();
        this.setupSpeechRecognition();
    }

    setupStyles() {
        // Estilos cargados desde src/styles/chat.css
        // (movidos de inline JS a CSS propio para mobile, temas y mantenimiento)
    }

    createUI() {

        this.panel = document.createElement('section');
        this.panel.className = 'ai-chat-panel';
        this.panel.setAttribute('role', 'dialog');
        this.panel.setAttribute('aria-label', 'Chat de IA');

        const header = document.createElement('div');
        header.className = 'ai-chat-header';
        const title = document.createElement('h3');
        title.textContent = 'Gregorio'; // Nuevo nombre de la IA

        const headerActions = document.createElement('div');
        headerActions.className = 'ai-chat-header-actions';

        this.voiceSelect = document.createElement('select');
        this.voiceSelect.className = 'ai-chat-select';
        this.voiceSelect.setAttribute('aria-label', 'Voz del asistente');
        ['Puck', 'Kore'].forEach((voice) => {
            const option = document.createElement('option');
            option.value = voice;
            option.textContent = voice;
            this.voiceSelect.appendChild(option);
        });

        const resetButton = document.createElement('button');
        resetButton.className = 'ai-chat-reset';
        resetButton.type = 'button';
        resetButton.textContent = 'Nuevo chat';
        resetButton.setAttribute('aria-label', 'Iniciar un chat nuevo');

        const closeButton = document.createElement('button');
        closeButton.className = 'ai-chat-close';
        closeButton.setAttribute('aria-label', 'Cerrar chat');
        closeButton.textContent = '✕';

        // headerActions.appendChild(this.voiceSelect); // Suprimido temporalmente
        headerActions.appendChild(resetButton);
        headerActions.appendChild(closeButton);
        header.appendChild(title);
        header.appendChild(headerActions);

        this.messagesContainer = document.createElement('div');
        this.messagesContainer.className = 'ai-chat-messages';

        this.statusLine = document.createElement('div');
        this.statusLine.className = 'ai-chat-status';
        this.statusLine.textContent = 'Habla con la librería. Pregunta lo que desees.';

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

        this.liveButton = document.createElement('button');
        this.liveButton.className = 'ai-chat-button live';
        this.liveButton.type = 'button';
        this.liveButton.textContent = 'Voz';
        this.liveButton.setAttribute('aria-label', 'Iniciar conversación de voz');
        if (!this.options.enableLiveVoice) {
            this.liveButton.disabled = true;
            this.liveButton.title = 'Modo voz deshabilitado.';
        }

        this.sendButton = document.createElement('button');
        this.sendButton.className = 'ai-chat-button';
        this.sendButton.type = 'button';
        this.sendButton.textContent = 'Enviar';

        inputArea.appendChild(this.input);
        // inputArea.appendChild(this.micButton); // Suprimido temporalmente
        // inputArea.appendChild(this.liveButton); // Suprimido temporalmente
        inputArea.appendChild(this.sendButton);

        this.panel.appendChild(header);
        this.panel.appendChild(this.messagesContainer);
        this.panel.appendChild(this.statusLine);
        this.panel.appendChild(inputArea);

        this.options.container.appendChild(this.panel);

        closeButton.addEventListener('click', () => this.closePanel());
        this.sendButton.addEventListener('click', () => this.handleSend());
        this.input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.handleSend();
            }
        });
        this.micButton.addEventListener('click', () => this.startVoiceRecognition());
        this.liveButton.addEventListener('click', () => this.toggleLiveVoice());
        this.voiceSelect.addEventListener('change', () => this.updateLiveVoice());
        resetButton.addEventListener('click', () => this.resetConversation());
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
        if (state.commandOrb) state.commandOrb.onChatToggle(true);
        setTimeout(() => this.input.focus(), 200);
    }

    closePanel() {
        this.isOpen = false;
        this.panel.classList.remove('open');
        if (state.commandOrb) state.commandOrb.onChatToggle(false);
        if (this.isLiveActive) this.stopLiveVoice();
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
            this.conversationHistory.push({ role: 'user', content: question });
            this.conversationHistory.push({ role: 'assistant', content: answer });
            if (this.options.enableTTS) this.speak(answer);
        } catch (error) {
            const fallback = 'Lo siento, hubo un problema al contactar con la IA.';
            console.error('ChatFeature error:', error);
            this.updateMessage(loadingId, { text: fallback, status: 'error' });
        }
    }

    async sendToAI(userQuestion) {
        await this.libraryCatalogPromise;
        const context = this.getChatContext();
        const conversationHistory = this.getConversationHistoryPayload();
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: userQuestion,
                context,
                conversationHistory,
                libraryCatalog: this.libraryCatalog
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

    resetConversation() {
        this.messages = [];
        this.conversationHistory = [];
        this.messageElements.clear();
        this.messagesContainer.innerHTML = '';
        this.statusLine.textContent = 'El hilo se ha cortado. ¿Empezamos de nuevo?';
        this.scrollToBottom();
    }

    async loadLibraryCatalog() {
        try {
            const response = await fetch('/data/books.json');
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const books = await response.json();
            this.libraryCatalog = (Array.isArray(books) ? books : []).map((book) => ({
                id: book.id || '',
                title: book.title || 'Sin título',
                author: book.author || 'Autor desconocido',
                tags: this.normalizeTags(book.tags),
                description: book.description || '',
                era: book.era || book.year || ''
            }));
        } catch (error) {
            console.warn('No se pudo cargar el catálogo de libros:', error);
            this.libraryCatalog = [];
        }
    }

    normalizeTags(tags) {
        if (!tags) return [];
        if (Array.isArray(tags)) return tags.filter(Boolean);
        if (typeof tags === 'string') {
            return tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean);
        }
        return [];
    }

    getConversationHistoryPayload() {
        const maxMessages = 12;
        const trimmedHistory = this.conversationHistory.slice(-maxMessages);
        return trimmedHistory.map((item) => ({
            role: item.role,
            content: String(item.content || '').trim()
        })).filter((item) => item.content);
    }

    getCurrentPageText() {
        const storyData = state.storyData || state.story || null;
        const currentPageId = state.currentStoryId;

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

    getChatContext() {
        const storyData = state.storyData || state.story || {};
        const currentBook = state.currentBook || null;
        const currentPageText = this.getCurrentPageText();
        const page = state.appMode === 'reader' ? 'book' : 'home';

        const excerpt = currentPageText
            ? currentPageText.replace(/\s+/g, ' ').trim().slice(0, 1200)
            : '';

        const bookDetails = currentBook
            ? {
                id: currentBook.id || '',
                title: currentBook.title || storyData.title || 'Desconocido',
                author: currentBook.author || storyData.author || 'Desconocido',
                era: currentBook.era || currentBook.year || '',
                tags: this.normalizeTags(currentBook.tags),
                description: currentBook.description || ''
            }
            : null;

        return {
            page,
            currentBook: bookDetails,
            currentBookExcerpt: excerpt
        };
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

    updateLiveVoice() {
        if (this.liveClient) {
            this.liveClient.setVoiceName(this.voiceSelect.value);
        }
    }

    async toggleLiveVoice() {
        if (!this.options.enableLiveVoice) return;
        if (this.isLiveActive) {
            this.stopLiveVoice();
        } else {
            await this.startLiveVoice();
        }
    }

    // ==========================================================
    // CÓDIGO RESTAURADO A SU VERSIÓN ORIGINAL Y CORRECTA
    // ==========================================================
    async startLiveVoice() {
        // 1. Obtenemos la llave dinámicamente (servidor o navegador)
        const apiKey = await this.getLiveApiKey();

        if (!apiKey) {
            this.statusLine.textContent = 'Ingresa una API Key de Gemini para usar voz en vivo.';
            return;
        }

        if (!this.liveClient) {
            const { GeminiLiveClient } = await import('./GeminiLiveClient.js');
            this.liveClient = new GeminiLiveClient({
                apiKey,
                voiceName: this.voiceSelect.value,
                onStatus: (message) => {
                    this.statusLine.textContent = message;
                },
                onText: (text, isFinal) => {
                    this.handleLiveText(text, isFinal);
                },
                onVadChange: (isSpeaking) => {
                    this.statusLine.textContent = isSpeaking
                        ? 'Detectando voz...'
                        : 'Silencio detectado. Esperando respuesta.';
                },
                onError: (error) => {
                    console.error('Gemini Live error:', error);
                    this.statusLine.textContent = 'Error en el chat de voz. Revisa la consola.';
                }
            });
        }

        this.statusLine.textContent = 'Conectando al chat de voz...';
        this.liveButton.classList.add('active');
        this.liveButton.textContent = 'Voz activa';

        try {
            await this.liveClient.start();
            this.isLiveActive = true;
        } catch (error) {
            console.error('No se pudo iniciar voz en vivo:', error);
            this.statusLine.textContent = 'No se pudo iniciar el chat de voz (posible error 1011 de quota).';
            this.liveButton.classList.remove('active');
            this.liveButton.textContent = 'Voz';
        }
    }

    stopLiveVoice() {
        if (this.liveClient) {
            this.liveClient.stop();
            // MANTENEMOS ESTA CORRECCIÓN: Borra el cliente antiguo para no reciclar conexiones fallidas
            this.liveClient = null;
        }
        this.isLiveActive = false;
        this.liveButton.classList.remove('active');
        this.liveButton.textContent = 'Voz';
        this.statusLine.textContent = 'Modo voz detenido. Puedes escribir un mensaje.';
        this.resetLiveTranscript();
    }

    resetLiveTranscript() {
        this.liveTextMessageId = null;
        this.liveTextBuffer = '';
    }

    handleLiveText(text, isFinal) {
        if (!text) return;
        if (!this.liveTextMessageId) {
            this.liveTextMessageId = this.addMessage({
                sender: 'ai',
                text: '',
                status: 'loading'
            });
        }
        this.liveTextBuffer += text;
        this.updateMessage(this.liveTextMessageId, {
            text: this.liveTextBuffer,
            status: isFinal ? 'done' : 'loading'
        });
        if (isFinal) {
            this.conversationHistory.push({ role: 'assistant', content: this.liveTextBuffer });
            this.resetLiveTranscript();
        }
    }

    async getLiveApiKey() {
        // La llave solo se obtiene del servidor (Vercel env vars).
        // NUNCA se almacena en el navegador ni se pide al usuario.
        const fromOptions = this.options.liveApiKey?.trim();
        if (fromOptions) return fromOptions;

        const fromServer = await this.fetchLiveApiKeyFromServer();
        if (fromServer) return fromServer;

        return '';
    }

    async fetchLiveApiKeyFromServer() {
        try {
            const response = await fetch('/api/live-key');
            if (!response.ok) return '';
            const data = await response.json();
            if (data?.apiKey) return String(data.apiKey).trim();
        } catch (error) {
            console.warn('No se pudo obtener la API Key del servidor:', error);
        }
        return '';
    }

    speak(text) {
        if (!('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
}
