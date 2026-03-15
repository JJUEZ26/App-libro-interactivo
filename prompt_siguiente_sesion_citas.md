# INICIO DE SESIÓN DE AUTONOMÍA: FASE 3.4 (Citas 2.0)

Actúa como Antigravity, el arquitecto de software de mi proyecto "Lecturas Interactivas" (El Rascacielos Experimental).

## CONTEXTO Y MEMORIA
Nuestra misión continua es transformar este lector web básico en una plataforma inmersiva, escalable y heterogénea. En la sesión anterior culminamos los primeros bloques de la Fase 3 (UX Avanzada):
- **Onboarding Interactivo**: Encapsulado en `src/ui/onboarding.js` (tutorial puramente mecánico de navegación).
- **Sensory Invite**: Una pantalla inmersiva previa al Onboarding (`src/ui/sensory-invite.js`) que pide encender el Audio/IA con una estética Dark Premium.
- **Social Share Core**: Introdujimos el botón de compartir vía `navigator.share()` nativo en el panel lateral de citas.

**Tu primera tarea es cargar tu contexto de inmediato leyendo estos archivos clave:**
1. Revisa `session_log.md` (ve al final, a la "SESIÓN ACTUAL - FASE 3").
2. Revisa `blueprint.md` para asimilar al 100% nuestra filosofía de "Rascacielos": CSS moderno (OKLCH, glassmorphism), aislamiento estricto y foco en Web Components o módulos limpios sin librerías de terceros innecesarias.
3. Revisa `src/reader/highlights.js`.

## LA MISIÓN DE HOY: CITAS 2.0 (REMAKE TOTAL)

El sistema de resaltados (`src/reader/highlights.js`) actual es funcional pero frágil, se escribió rápido en las primeras versiones, y al tratar de inyectarle la función de compartir vimos que su DOM subyacente comienza a volverse espagueti. 
**Nunca lo trabajamos bien, así que vamos a repensarlo desde cero.**

### Directrices para Citas 2.0
Queremos un sistema robusto, elegante y que se sienta "nativo".

1. **Auditoría y Destrucción Controlada**: Analiza cómo `highlights.js` intercepta el texto seleccionado por el usuario (`window.getSelection()`). Tu primera misión es diseñar una estrategia mejor. ¿Deberíamos usar la API nativa de Highlight (CSS Custom Highlight API) si está disponible, con un fallback a envolturas `<span>`? Piensa en rendimiento.
2. **El "Tooltip" Interactivo**: Al seleccionar texto, el tooltip emergente flotante debe ser ultra-premium (glassmorphism con backdrop-filter, sombras densas OKLCH). Debe ofrecer guardar en 3 colores (Ámbar, Menta, Celeste), borrar o compartir (Share API) directamente desde ahí, sin necesidad de ir al panel lateral.
3. **El Panel Lateral (Social Hub)**: El `.highlight-panel` (aside) dejará de ser una lista de `<button>` simples. Cada cita guardada debe verse como una tarjeta pulcra ("Quote Card") que muestre:
   - El texto citado (con tipografía serif `var(--font-display)`)
   - El origen (ej. "Página 12 - Frankenstein")
   - Acciones al pie de la tarjeta: Ir a la página (ícono de flecha), Compartir (ícono de share nativo), Eliminar (ícono de papelera sutil).
4. **Almacenamiento (Persistencia)**: La estructura de datos guardada en `localStorage` debe ser limpia y fácil de iterar.

### Tu Primer Paso (Instrucción Estricta)
**NO comiences a escribir código JS todavía.**
Quiero que evalúes la viabilidad de usar la CSS Custom Highlight API vs el método actual (`document.createTreeWalker` + `<span>`). 
Escribe un plan de arquitectura detallado en un archivo llamado `citas_2_0_plan.md` en el root del proyecto. Explícame ahí cómo estructurarás el nuevo `highlights.js` y cómo será la nueva experiencia UX del Tooltip y las Quote Cards.
Notifícame ("notify_user") en cuanto hayas escrito ese plan para que yo lo apruebe antes de que dinamites el código actual.
