/**
 * Time Pulse Effect
 * Círculos concéntricos que pulsan simbolizando el tic-tac del tiempo
 */

export function startTimePulseEffect(intensity = 'subtle') {
    const overlay = document.createElement('div');
    overlay.className = 'time-pulse-overlay';
    (document.getElementById('app-container') || document.body).appendChild(overlay);

    // Configurar intensidad
    const opacities = {
        'subtle': 0.08,
        'medium': 0.15,
        'strong': 0.25
    };

    const frequencies = {
        'subtle': 4000,   // Pulso cada 4 segundos
        'medium': 3000,   // Pulso cada 3 segundos
        'strong': 2000    // Pulso cada 2 segundos
    };

    const maxOpacity = opacities[intensity] || opacities.subtle;
    const frequency = frequencies[intensity] || frequencies.subtle;

    const createPulse = () => {
        const pulse = document.createElement('div');
        pulse.className = 'time-pulse-ring';

        // Color dorado sepia
        pulse.style.setProperty('--pulse-color', 'oklch(65% 0.12 55)');
        pulse.style.setProperty('--pulse-max-opacity', maxOpacity);

        // Posición central
        pulse.style.left = '50%';
        pulse.style.top = '50%';

        overlay.appendChild(pulse);

        // Activar animación
        requestAnimationFrame(() => {
            pulse.classList.add('pulsing');
        });

        // Auto-eliminar después de la animación (3s)
        setTimeout(() => {
            if (pulse.parentNode) pulse.remove();
        }, 3000);
    };

    // Pulso inicial
    createPulse();

    // Pulsos periódicos
    const interval = setInterval(createPulse, frequency);

    // Retornar cleanup function
    return () => {
        clearInterval(interval);
        if (overlay.parentNode) {
            overlay.remove();
        }
    };
}
