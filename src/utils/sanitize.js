/**
 * Sanitiza HTML proveniente de los JSON de historias.
 * Permite SOLO tags de formato de texto (em, strong, br, etc.)
 * y elimina scripts, iframes, atributos on*, y tags peligrosos.
 *
 * Esto protege contra XSS si en el futuro el contenido
 * viene de una fuente externa (API, colaboradores, etc.).
 */

const ALLOWED_TAGS = new Set([
    'em', 'i', 'strong', 'b', 'br', 'span', 'p',
    'u', 'small', 'sub', 'sup', 'mark', 'abbr',
    'div', 'img', 'a'
]);

const ALLOWED_ATTRS = new Set([
    'class', 'style', 'href', 'src', 'alt', 'title',
    'data-start', 'data-end', 'loading', 'aria-label'
]);

export function sanitizeHTML(raw) {
    if (!raw || typeof raw !== 'string') return '';

    const template = document.createElement('template');
    template.innerHTML = raw;
    const fragment = template.content;

    // Eliminar tags peligrosos completamente
    fragment.querySelectorAll('script, iframe, object, embed, form, textarea, select, meta, link, base')
        .forEach(el => el.remove());

    // Limpiar atributos peligrosos de todos los elementos
    fragment.querySelectorAll('*').forEach(el => {
        const tagName = el.tagName.toLowerCase();

        // Si el tag no está permitido, reemplazar con su contenido
        if (!ALLOWED_TAGS.has(tagName)) {
            const parent = el.parentNode;
            while (el.firstChild) {
                parent.insertBefore(el.firstChild, el);
            }
            parent.removeChild(el);
            return;
        }

        // Eliminar atributos peligrosos
        [...el.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on') || !ALLOWED_ATTRS.has(name)) {
                el.removeAttribute(attr.name);
            }
        });

        // Sanitizar href para prevenir javascript: URIs
        if (el.hasAttribute('href')) {
            const href = el.getAttribute('href');
            if (href && href.trim().toLowerCase().startsWith('javascript:')) {
                el.removeAttribute('href');
            }
        }
    });

    // Serializar el fragment limpio de vuelta a string
    const div = document.createElement('div');
    div.appendChild(fragment.cloneNode(true));
    return div.innerHTML;
}
