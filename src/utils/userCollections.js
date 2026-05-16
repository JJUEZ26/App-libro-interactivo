const SHELF_KEY = 'li-reading-shelf';
const GALLERY_KEY = 'lecturas_canvas_gallery';

function readArray(key) {
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        localStorage.removeItem(key);
        return [];
    }
}

function writeArray(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`[Collections] No se pudo guardar ${key}:`, error);
    }
}

export function getShelf() {
    return readArray(SHELF_KEY);
}

export function isShelfBook(bookId) {
    return getShelf().some((book) => book.id === bookId);
}

export function toggleShelfBook(bookData) {
    if (!bookData?.id) return { saved: false, shelf: getShelf() };

    const shelf = getShelf();
    const existingIndex = shelf.findIndex((book) => book.id === bookData.id);

    if (existingIndex >= 0) {
        shelf.splice(existingIndex, 1);
        writeArray(SHELF_KEY, shelf);
        return { saved: false, shelf };
    }

    const entry = {
        id: bookData.id,
        title: bookData.title || 'Lectura',
        author: bookData.author || '',
        cover: bookData.cover || '',
        type: bookData.type || 'book',
        savedAt: Date.now()
    };

    shelf.unshift(entry);
    if (shelf.length > 60) shelf.length = 60;
    writeArray(SHELF_KEY, shelf);
    return { saved: true, shelf };
}

export function removeShelfBook(bookId) {
    const shelf = getShelf().filter((book) => book.id !== bookId);
    writeArray(SHELF_KEY, shelf);
    return shelf;
}

export function getLocalReadingSummary() {
    const summary = {
        startedBooks: 0,
        pagesRead: 0,
        savedQuotes: 0,
        galleryItems: readArray(GALLERY_KEY).length,
        shelfItems: getShelf().length
    };

    try {
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (!key) continue;

            if (key.startsWith('pageHistory-')) {
                const history = readArray(key);
                if (history.length > 0) {
                    summary.startedBooks += 1;
                    summary.pagesRead += new Set(history).size;
                }
            }

            if (key.startsWith('highlights-')) {
                summary.savedQuotes += readArray(key).length;
            }
        }
    } catch {
        return summary;
    }

    return summary;
}
