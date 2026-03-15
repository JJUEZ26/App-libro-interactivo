/**
 * Gestor Centralizado de Compartición Social (Web Share API)
 * Utiliza fallback a navigator.clipboard si Web Share API no está disponible.
 */

export class ShareManager {
    /**
     * Extrae al host actual estandarizado para armar la URL.
     * @returns {string} Protocolo + Host actual (ej. https://miapp.com)
     */
    static getBaseUrl() {
        return window.location.origin;
    }

    /**
     * Dispara la interfaz nativa del sistema operativo para compartir.
     * @param {Object} data { title, text, url }
     * @returns {Promise<boolean>} True si fue exitoso, false si falló o canceló
     */
    static async triggerNativeShare(data) {
        if (navigator.share) {
            try {
                await navigator.share(data);
                console.log('Contenido compartido con éxito');
                return true;
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error compartiendo:', error);
                }
                return false;
            }
        } else {
            // Fallback: Copiar al portapapeles
            let clipboardText = data.url;
            if (data.text) {
                clipboardText = `${data.text}\n\n${data.url}`;
            }

            try {
                // Si la Clipboard API existe y estamos en contexto seguro (HTTPS o localhost puro)
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(clipboardText);
                    this.showToast('Enlace copiado al portapapeles');
                    return true;
                }
            } catch (err) {
                console.warn('Clipboard API falló (posible Local IP HTTP). Usando fallback manual.', err);
            }

            // Fallback robusto para HTTP locales en Móviles (document.execCommand)
            try {
                const textarea = document.createElement('textarea');
                textarea.value = clipboardText;
                // Prevenir scroll saltos
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                textarea.style.top = '0';
                textarea.style.left = '0';
                
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textarea);
                
                if (successful) {
                    this.showToast('Enlace copiado (Modo Local)');
                    return true;
                } else {
                    this.showToast('Tu móvil bloquea el portapapeles en esta IP local.');
                    return false;
                }
            } catch (err) {
                console.error('Error total copiando al portapapeles: ', err);
                this.showToast('Error copiando. Usa HTTPS/Vercel.');
                return false;
            }
        }
    }

    /**
     * Comparte el libro de forma global utilizando nuestro backend SSR (/share/:book).
     * @param {string} bookId ID del libro en books.json
     * @param {string} title Título del Libro o Viñeta
     */
    static async shareBook(bookId, title) {
        // En vez de enviar a #/?book=sisifo enviamos a la ruta Serverless /share/sisifo
        // para asegurar previsualización de Open Graph en WhatsApp.
        const shareUrl = `${this.getBaseUrl()}/share/${bookId}`;
        const shareText = `Lee "${title}" en la instalación interactiva...`;

        await this.triggerNativeShare({
            title: `Lectura Interactiva: ${title}`,
            text: shareText,
            url: shareUrl
        });
    }

    /**
     * Comparte un texto literal seleccionado (Citas 2.0). 
     * @param {string} quoteText El fragmento citado.
     * @param {string} sourceName Nombre de la obra, ejemplo "Frankenstein"
     * @param {string} baseUrlParam Opcionalmente si queremos llevarlo directo a la obra
     */
    static async shareQuote(quoteText, sourceName, bookId) {
        // Truncar para asegurar que quepa bien en un Tweet/Mensaje corto
        const maxTextLength = 200;
        let snippet = quoteText.length > maxTextLength
            ? `"${quoteText.substring(0, maxTextLength)}..."`
            : `"${quoteText}"`;

        const shareText = `${snippet}\n— ${sourceName}`;
        
        let shareUrl = this.getBaseUrl();
        if (bookId) {
            shareUrl = `${this.getBaseUrl()}/share/${bookId}`;
        }

        await this.triggerNativeShare({
            title: `Cita de ${sourceName}`,
            text: shareText,
            url: shareUrl
        });
    }

    /**
     * Muestra un mensajito temporal básico por pantalla (reutiliza o crea div temporal)
     */
    static showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'share-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // CSS inyectado mínimo
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%) translateY(20px)',
            opacity: '0',
            backgroundColor: 'oklch(20% 0.03 240 / 90%)',
            color: 'oklch(95% 0.01 240)',
            padding: '12px 24px',
            borderRadius: '100px',
            fontSize: '14px',
            fontFamily: 'system-ui, sans-serif',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: '99999',
            pointerEvents: 'none'
        });

        // Animación de entrada
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
            toast.style.opacity = '1';
        });

        // Eliminar y animar salida tras 3 segundos
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}
