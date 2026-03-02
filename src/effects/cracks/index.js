export function startCracksEffect(stage) {
    const container = document.getElementById('app-container') || document.body;

    let overlay = document.getElementById('cracks-overlay');

    // Si no existe el overlay de grietas, lo creamos
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'cracks-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '9999'; // encima de todo

        // Un único vaso de SVG donde pintaremos las grietas
        overlay.innerHTML = `
            <svg id="cracks-svg" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <style>
                    .crack-path {
                        fill: none;
                        stroke: rgba(0, 0, 0, 0.85); /* oscuro, casi negro */
                        stroke-width: 2px;
                        stroke-linecap: round;
                        stroke-linejoin: round;
                        filter: drop-shadow(1px 1px 1px rgba(255, 255, 255, 0.2));
                        /* Animación de dibujarse */
                        stroke-dasharray: 2000;
                        stroke-dashoffset: 2000;
                        transition: stroke-dashoffset 2s cubic-bezier(0.25, 1, 0.5, 1);
                    }
                    /* Pequeñas ramificaciones */
                    .crack-branch {
                        stroke-width: 1px;
                        opacity: 0.7;
                    }
                </style>
                <!-- Filtro para darle textura a la grieta -->
                <defs>
                    <filter id="displacementFilter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>
                <g id="cracks-group" filter="url(#displacementFilter)"></g>
            </svg>
        `;
        container.appendChild(overlay);
    }

    const cracksGroup = document.getElementById('cracks-group');

    // Dependiendo de la etapa (start, grow, grow_more, final) metemos nuevas rutas SVG que se dibujarán.
    setTimeout(() => {
        let pathStr = "";

        if (stage === 'start') {
            // Empieza una grieta en la esquina superior izquierda que entra hacia el centro
            pathStr = `
                <path class="crack-path" d="M -10,-10 Q 50,40 30,120 T 100,250 T 150,300" />
                <path class="crack-path crack-branch" d="M 30,120 Q 80,100 120,80" />
            `;
        } else if (stage === 'grow') {
            // Grieta lateral derecha
            pathStr = `
                <path class="crack-path" d="M 105vw,30vh Q 80vw,35vh 75vw,50vh T 60vw,65vh" />
                <path class="crack-path crack-branch" d="M 75vw,50vh Q 70vw,40vh 65vw,45vh" />
            `;
        } else if (stage === 'grow_more') {
            // Grieta desde abajo y se une con la de la derecha
            pathStr = `
                <path class="crack-path" d="M 40vw,105vh Q 45vw,80vh 35vw,70vh T 50vw,50vh" />
                <path class="crack-path crack-branch" d="M 35vw,70vh Q 20vw,65vh 15vw,55vh" />
                <path class="crack-path crack-branch" d="M 50vw,50vh Q 55vw,60vh 60vw,65vh" />
            `;
        } else if (stage === 'final') {
            // El cristal se rompe por completo, grieta que atraviesa toda la pantalla diagonalmente
            pathStr = `
                <path class="crack-path" style="stroke-width:4px;" d="M -10,105vh Q 20vw,80vh 50vw,50vh T 105vw,-10" />
                <path class="crack-path crack-branch" style="stroke-width:2px;" d="M 50vw,50vh Q 60vw,30vh 80vw,20vh" />
                <path class="crack-path crack-branch" style="stroke-width:2px;" d="M 50vw,50vh Q 30vw,60vh 20vw,80vh" />
                <path class="crack-path crack-branch" d="M 80vw,20vh Q 90vw,10vh 95vw,25vh" />
                <path class="crack-path crack-branch" d="M 20vw,80vh Q 10vw,90vh 5vw,75vh" />
            `;
        } // Si vuelves al inicio, deberíamos hacer un reset, pero esta historia no vuelve atrás en un flujo normal, 
        // excepto si reinicia. Para eso sirve la función cleanup.

        if (pathStr) {
            cracksGroup.insertAdjacentHTML('beforeend', pathStr);
            // Forza el reflow para que calcule la animación de dashoffset
            const newPaths = cracksGroup.querySelectorAll('path');
            // Usamos setTimeout corto para que la opacidad y dashoffset aplique
            setTimeout(() => {
                newPaths.forEach(p => {
                    p.style.strokeDashoffset = '0';
                });
            }, 50);

            // Sonidillo de cristal rompiéndose (opcional sutil) si tuvieras audio
        }
    }, 100);

    // Retorna función de cleanup
    return () => {
        const el = document.getElementById('cracks-overlay');
        if (el) el.remove();
    };
}
