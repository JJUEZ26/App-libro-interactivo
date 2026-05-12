/**
 * Efectos de atmósfera para la biblioteca (Meta A.3)
 * Micro-interacciones Stripe-like con parallax sutil en cards de libros.
 */

export function startCardParallax() {
    // Si no tiene hover (ej. mobile), no activamos el parallax
    if (!window.matchMedia('(hover: hover)').matches) {
        return () => {};
    }

    const librarySections = document.getElementById('library-sections');
    if (!librarySections) return () => {};

    function onMouseMove(event) {
        const card = event.target.closest('.book-card:not(.book-card--upcoming)');
        if (!card) return;

        const rect = card.getBoundingClientRect();
        
        // Calcular posición normalizada del mouse (-1 a 1)
        const mx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const my = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        
        // Actualizar variables CSS
        card.style.setProperty('--mx', mx.toFixed(3));
        card.style.setProperty('--my', my.toFixed(3));
    }

    function onMouseOut(event) {
        // Solo si realmente salió de la card (no hacia un hijo)
        const card = event.target.closest('.book-card');
        if (card && !card.contains(event.relatedTarget)) {
            card.style.removeProperty('--mx');
            card.style.removeProperty('--my');
        }
    }

    librarySections.addEventListener('mousemove', onMouseMove, { passive: true });
    librarySections.addEventListener('mouseout', onMouseOut, true);

    return function cleanup() {
        librarySections.removeEventListener('mousemove', onMouseMove);
        librarySections.removeEventListener('mouseout', onMouseOut, true);
        
        // Resetear todas las variables CSS en cards existentes
        document.querySelectorAll('.book-card').forEach(card => {
            card.style.removeProperty('--mx');
            card.style.removeProperty('--my');
        });
    };
}
