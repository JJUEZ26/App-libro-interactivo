# Plan de Arquitectura: Citas 2.0 (Remake Total)

## 1. Auditoría y Evaluación de Tecnologías

### Método Actual (`TreeWalker` + inyección de `<span>`)
**Problemas del estado actual:**
- **Destructivo:** Altera el DOM, mutando nodos de texto originales en fragmentos múltiples.
- **Frágil:** Puede entrar en conflicto destructivo con otros sistemas que dependen de la estructura HTML original (ej. efectos visuales complejos, modo Karaoke, sanitizador).
- **Residual:** Al eliminar un resaltado, se extrae el texto del `span` pero quedan nodos de texto fragmentados (falta un `.normalize()`), lo cual genera "basura" en el DOM virtual.

### CSS Custom Highlight API
La evolución natural para nuestro "Rascacielos" experimental. La API crea resaltados visuales nativos sin mutar el DOM.
- **Pros:** Rendimiento nativo, cero DOM bleeding, desacoplamiento total de la estructura. Esencial para no interferir con el CSS y los WebComponents de las viñetas.
- **Viabilidad:** Soporte amplio en navegadores modernos (Safari 17+, Chrome 105+, Firefox 114+). Es la opción definitiva para un entorno premium.
- **Implementación:** 
  1. Se reconstruyen los `Range` a partir del `startOffset` y `endOffset` de la página.
  2. Se instancian en clases `Highlight`.
  3. Se registran globalmente: `CSS.highlights.set('color-mint', new Highlight(r1, r2, ...));`.
  4. Los estilos se aplican en el CSS global usando el pseudo-elemento `::highlight(color-mint)`.
- **Interacción:** Como los rangos no emiten eventos *click*, delegaremos los clicks en el contenedor principal (`.content-centerer`) y comprobaremos las coordenadas con respecto a los Rects computados de los `Range` resaltados (`range.getBoundingClientRect()`), logrando una detección 100% limpia.

---

## 2. Nueva Arquitectura UX (Flujo Citas 2.0)

### 2.1. El "Tooltip" Interactivo Flotante (Glassmorphism Premium)
Un único elemento DOM flotante (`#highlight-tooltip-wrapper`), reutilizado e inyectado en la raíz de la app (no dentro de la página, para evitar que el `overflow: hidden` o los estilos de escena lo corten).

- **Diseño:** Fondo oscuro/translúcido (`backdrop-filter: blur(20px)`), `border: 1px solid oklch(255 0 0 / 10%)`, sombras profundas `var(--shadow-xl)`.
- **Comportamiento:**
  - Al seleccionar texto (nuevo resaltado), el tooltip aparece arriba de la selección ofreciendo: [Iconos circulares de color: Ámbar, Menta, Celeste].
  - Al tocar un texto ya resaltado, el tooltip ofrece acciones extendidas: [Modificar color] | [Compartir (Share API)] | [Borrar (Icono papelera de peligro)].
  - Animación sutil (`scale 0.95 -> 1.0`, y `opacity` con curva `ease-out-expo`).

### 2.2. Panel Lateral (Quote Cards / Social Hub)
Se reescribirá la estructura y CSS del aside de resaltados.

- **Diseño Quote Cards (`.quote-card`):**
  - Cada cita pasa de ser un `<button>` a un `<article>` sofisticado tipo tarjeta.
  - El texto citado adopta la tipografía serif elegante `var(--font-display)`. Incluirá comillas tipográficas de fondo para dar ancla visual.
  - Detalles de origen al pie: `"Página X - [Nombre del Texto]"`.
  - **Footer Action Bar:** Separador de acciones explícitas en flexbox:
    - ➡️ **Ir a la página** (Botón principal ghost).
    - 📤 **Compartir** (Icono de red).
    - 🗑️ **Eliminar** (Acción destructiva sutil).

### 2.3 Persistencia y Estructura de Datos (Storage)
La estructura para el `localStorage` se mantendrá liviana, pero estandarizada:
```js
{
  id: "uuid",
  text: "El texto seleccionado puro...",
  color: "sun|mint|sky", // Mapeados directamente a CSS.highlights
  startOffset: 125,      // Offset total desde el inicio del textContent del .content-centerer
  endOffset: 250,
  pageId: "escena-1",
  pageNumber: 1
}
```

---

## 3. Hoja de Ruta de Implementación (Próximos Pasos tras Aprobación)

1. **Limpieza CSS (`reader.css` & `library.css`):**
   - Eliminar las clases obsoletas de `span.highlight-yellow` y transicionar a las reglas `::highlight()`.
   - Crear los estilos base de las `Quote Cards` y del nuevo `Tooltip Premium`.
2. **Refactorización Core JS (`highlights.js`):**
   - Eliminar `TreeWalker` destructivo.
   - Implementar la lógica core basada en `Range` y `CSS.highlights`.
   - Escribir la detección de puntero de clic sobre un `Range` de CSS Highlights (iterando rangos activos y evaluando intersecciones XY del click).
3. **Refactorización UX Panel y Tooltip:**
   - Montaje del nuevo Tooltip global flotante unificado con delegación de eventos.
   - Reescribir la función `renderHighlightPanel()` para emitir semántica de `Quote Cards`.
4. **Verificación / Pruebas Citas:**
   - Ver que persistencia, selección multi-párrafo y modo "compartir" nativo fluyan a 60fps.
