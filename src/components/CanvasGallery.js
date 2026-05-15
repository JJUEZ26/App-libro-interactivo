/**
 * CanvasGallery — localStorage-based gallery for saved drawings.
 * Prepared for future Firebase Storage migration.
 */
const STORAGE_KEY = 'lecturas_canvas_gallery';

export function getGallery() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
}

export function saveToGallery(base64Image, meta = {}) {
    const gallery = getGallery();
    const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        image: base64Image,
        timestamp: Date.now(),
        bookId: meta.bookId || null,
        pageId: meta.pageId || null,
        bookTitle: meta.bookTitle || '',
    };
    gallery.unshift(entry);
    // Keep max 20 drawings
    if (gallery.length > 20) gallery.length = 20;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gallery));
    } catch (e) {
        console.warn('Gallery save failed (storage full?):', e);
        // Try removing oldest
        gallery.pop();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gallery));
    }
    return entry;
}

export function removeFromGallery(id) {
    const gallery = getGallery().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gallery));
}

export function clearGallery() {
    localStorage.removeItem(STORAGE_KEY);
}
