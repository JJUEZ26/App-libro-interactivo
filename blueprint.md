# 📚 Blueprint Maestro: Lecturas Interactivas - Transformación Total

## 🎯 Filosofía del Proyecto

**"Lecturas Interactivas"** es una plataforma inmersiva de narrativa adaptativa que transforma la lectura clásica en una experiencia cinematográfica e interactiva. No es solo un lector de libros, es un **portal dimensional literario** donde cada decisión del usuario ramifica realidades alternativas, acompañadas de:

- 🎭 **Narrativa Ramificada**: Decisiones que alteran el curso de historias clásicas
- 🎨 **Atmósfera Visual**: Imágenes contextuales que intensifican momentos clave
- 🎵 **Paisajes Sonoros**: Audio ambiental y efectos que sumergen al lector
- 🤖 **IA Contextual**: Asistente conversacional para profundizar en la lectura
- ✨ **Efectos Visuales**: Partículas, overlays y animaciones temáticas
- 🎯 **Resaltados Inteligentes**: Sistema de citas y marcadores personalizables

### Visión Original
Este es tu primer proyecto, diseñado con una estética **Netflix-like** para web móvil. Su valor sentimental es inmenso porque representa tus primeros pasos en desarrollo. Ahora lo elevaremos a **nivel Google** con:

1. **Arquitectura de Clase Mundial**: Modular, escalable, documentada
2. **UX Premium**: Micro-interacciones, animaciones fluidas, feedback táctil
3. **Performance Óptima**: Carga progresiva, caching inteligente, optimización de assets
4. **Accesibilidad Total**: WCAG 2.1 AAA, navegación por teclado, lectores de pantalla
5. **Mobile-First Perfecto**: Responsive real, gestos naturales, notch-aware
6. **PWA Avanzada**: Instalable, offline-first, sincronización en background

---

## 🏗️ Arquitectura Actual (Estado Base)

### Estructura de Carpetas
```
App-libro-interactivo/
├── api/                       # Endpoints de backend
│   ├── chat.js               # Chat con IA (Gemini)
│   └── live-key.js           # Gestión de API keys
├── backend_audio/            # Procesamiento de audio
├── data/                     # Datos estáticos
├── images/                   # Assets visuales
├── sounds/                   # Efectos de sonido
├── stories/                  # Biblioteca de historias JSON
│   ├── frankenstein.json     # 313 páginas, narrativa ramificada
│   ├── el_extranjero.json    # 193KB - Camus
│   ├── ivan_ilich.json       # 173KB - Tolstói
│   ├── meditaciones.json     # 332KB - Marco Aurelio
│   ├── pajaro_azul.json      # Poema - Bukowski (lectura simple)
│   ├── pecado_borges.json    # Poema - Borges (con audio)
│   ├── idea_vilarino_ya_no_sera.json  # Poema - Vilariño (con audio)
│   ├── becquer_golondrinas.json    # Poema - Bécquer (con audio fantasma)
│   ├── la_puerta.json              # Relato de misterio (convertido de PDF)
│   └── ... (11 historias totales)
├── src/
│   ├── app/                  # Core de la aplicación
│   │   ├── init.js          # Inicialización y orquestación
│   │   ├── state.js         # Estado global
│   │   └── dom.js           # Helpers de DOM
│   ├── books/               # Lógica de biblioteca
│   │   └── index.js         # Catálogo y carga de libros
│   ├── effects/             # Efectos visuales modulares
│   │   ├── overlay/         # Capas de color
│   │   ├── bluebird/        # Pájaros animados
│   │   ├── smoke/           # Humo/niebla
│   │   ├── rain/            # Lluvia
│   │   └── beetle/          # Escarabajos
│   ├── library/             # Vista de biblioteca (Netflix-like)
│   │   └── view.js          # Renderizado de carrusel
│   ├── reader/              # Motor de lectura
│   │   ├── story.js         # Carga de historias JSON
│   │   ├── render.js        # Renderizado de páginas
│   │   ├── navigation.js    # Sistema de navegación
│   │   └── highlights.js    # Sistema de resaltados
│   ├── ui/                  # Componentes de interfaz
│   │   ├── ChatModule.js    # Chat contextual con IA
│   │   ├── GeminiLiveClient.js # WebSocket para voz en vivo
│   │   └── index.js         # Temas, font-size, fullscreen
│   ├── utils/               # Utilidades
│   │   └── storage.js       # LocalStorage wrapper
│   └── styles/              # Sistema de estilos
│       ├── base.css         # Reset y variables
│       ├── layout.css       # Estructura grid/flex
│       ├── ui.css           # Componentes UI
│       ├── library.css      # Estilos de biblioteca
│       ├── reader.css       # Estilos de lector
│       └── utilities.css    # Clases helper
├── index.html               # Punto de entrada
├── manifest.webmanifest     # PWA manifest
├── service-worker.js        # Service Worker básico
└── package.json             # Dependencias (Vite)
```

### Stack Tecnológico Actual
- **Build Tool**: Vite 5.0
- **Frontend**: Vanilla HTML/CSS/JS (ES Modules)
- **IA**: Gemini 2.5 Flash (API + WebSocket Live)
- **Audio**: Web Audio API + getUserMedia
- **PWA**: Manifest + Service Worker básico
- **Animaciones**: CSS transforms + transitions

### Características Implementadas
✅ **Vista Biblioteca**: Diseño tipo Netflix con hero y secciones horizontales  
✅ **Motor de Lectura**: Páginas JSON con `scenes[]`, `choices[]`, `images[]`, `sound`  
✅ **Sistema de Decisiones**: Navegación ramificada con historial  
✅ **Audio Ambiental**: Reproducción sincronizada con páginas  
✅ **Resaltados**: Selección de texto con 3 colores, persistencia local  
✅ **Panel de Citas**: Sidebar con resaltados guardados  
✅ **Chat con IA**: Panel flotante, contexto de lectura, voz en vivo  
✅ **Temas**: Light/Dark/Sepia + control de font-size  
✅ **Gestos Táctiles**: Swipe horizontal para navegar, tap en bordes  
✅ **Efectos Visuales**: Overlays, partículas (pájaros, humo, lluvia, escarabajos)  
✅ **Scrubber**: Barra de progreso deslizable  
✅ **Fullscreen API**: Botón de pantalla completa  

### Problemas Identificados
❌ **Responsive Issues**: No se adapta perfectamente a todos los tamaños de móvil  
❌ **Notch/Safe Areas**: No respeta las áreas seguras en iOS  
❌ **Microinteracciones**: Faltan animaciones de feedback  
❌ **Performance**: Imágenes no optimizadas, no hay lazy loading  
❌ **Accesibilidad**: Falta navegación por teclado, ARIA incompleto  
❌ **PWA Básica**: Service Worker mínimo, no hay sincronización offline avanzada  
❌ **Tipografía**: Falta jerarquía visual más marcada  
❌ **Color System**: Paleta limitada, falta sistema de tokens modernos  
❌ **Documentación**: Código sin comentarios JSDoc, falta guía de usuario  
❌ **Testing**: Sin tests automatizados  
❌ **Analytics**: No hay tracking de engagement  

---

## 🚀 PLAN MAESTRO DE TRANSFORMACIÓN

### 🎨 **FASE 1: FUNDAMENTOS VISUALES Y DISEÑO (Sistema de Diseño Premium)**

#### 1.1. Sistema de Tokens de Diseño Modernos
**Objetivo**: Crear un design system cohesivo con tokens reutilizables

**Acciones**:
- ✨ **Color System Avanzado**:
  - Migrar a **OKLCH** para colores más vibrantes y perceptualmente uniformes
  - Crear paleta de 12 tonos por color primario (50-950)
  - Agregar tokens semánticos: `--color-primary`, `--color-success`, `--color-danger`
  - Modo oscuro con contraste AAA
  - Tema "Aurora" (gradientes vibrantes) y "Midnight" (dark premium)

- 📐 **Sistema de Espaciado**:
  - Escala modular basada en 4px: `--space-1` (4px), `--space-2` (8px)... `--space-20` (80px)
  - Tokens semánticos: `--space-section`, `--space-card-padding`

- 🔤 **Tipografía Expresiva**:
  - **Google Fonts**: 
    - Playfair Display (títulos heroicos, serif elegante)
    - Inter (cuerpo, UI, sans-serif moderno)
    - Fira Code (código, monospace)
  - Escala tipográfica: `--text-xs` (12px) → `--text-9xl` (128px)
  - Peso variable: 300, 400, 600, 700, 900
  - Altura de línea óptima: 1.2 (títulos), 1.6 (cuerpo)

- 🌊 **Sombras en Capas**:
  - Sistema de 5 niveles de elevación
  - `--shadow-sm`: Sutil hover
  - `--shadow-md`: Cards
  - `--shadow-lg`: Modales
  - `--shadow-xl`: Dropdowns
  - `--shadow-2xl`: Mega elementos

- 🎭 **Efectos Premium**:
  - Glassmorphism: `backdrop-filter: blur(20px)` con bordes sutiles
  - Gradientes multicolor con 3+ stops
  - Texturas de ruido sutil en fondos
  - Bordes luminosos con `box-shadow` inset
  - Animaciones de "glow" en interactivos

#### 1.2. Componentes UI Rediseñados
**Objetivo**: Elevar cada elemento a calidad premium

**Acciones**:
- 🔘 **Botones**:
  - 5 variantes: Primary, Secondary, Outline, Ghost, Danger
  - Estados: Default, Hover (scale 1.05 + shadow), Active (scale 0.98), Disabled, Loading
  - Ripple effect en tap (Material Design)
  - Iconos con Lucide Icons o Phosphor Icons

- 📇 **Cards de Libro**:
  - Hover: Lift (translateY -8px) + shadow intenso + scale 1.02
  - Cover con aspect-ratio 2/3
  - Badge de "Nuevo", "En Progreso", "Completado"
  - Progress bar circular en esquina
  - Blur del fondo con color dominante de portada

- 🎚️ **Controles**:
  - Sliders con thumb custom, track gradient
  - Tooltips con valores en tiempo real
  - Switches con animación de toggle suave
  - Inputs con floating labels y validación visual

#### 1.3. Animaciones y Microinteracciones
**Objetivo**: Hacer la app "viva" y deliciosa de usar

**Acciones**:
- 🌀 **Sistema de Easing**:
  - `--ease-out-expo`: Elementos que entran
  - `--ease-in-out-cubic`: Transiciones suaves
  - `--ease-spring`: Efecto rebote (usando cubic-bezier)

- ✨ **Animaciones de Entrada**:
  - Fade + Slide desde abajo (stagger 50ms entre elementos)
  - Scale desde 0.8 a 1.0 en modales
  - Blur de 10px a 0 en hero sections

- 🎯 **Feedback Táctil**:
  - Vibración: `navigator.vibrate(10)` en taps importantes
  - Sonidos sutiles: Click, swipe, success (opcional, con toggle)
  - Visual: Pulse en botones, ripple en tap

- 🌊 **Transiciones de Página**:
  - Crossfade entre biblioteca y lector (300ms)
  - Slide horizontal en navegación de páginas
  - Shimmer loading en carga de imágenes

#### 1.4. Responsive y Mobile-First Perfecto
**Objetivo**: Adaptación pixel-perfect a todos los dispositivos

**Acciones**:
- 📱 **Breakpoints Modernos**:
  ```css
  --bp-xs: 375px   /* iPhone SE */
  --bp-sm: 640px   /* Móviles grandes */
  --bp-md: 768px   /* Tablets */
  --bp-lg: 1024px  /* Laptops */
  --bp-xl: 1280px  /* Desktops */
  --bp-2xl: 1536px /* Pantallas grandes */
  ```

- 🔒 **Safe Area Insets** (iOS notch/home bar):
  ```css
  padding-top: max(var(--space-4), env(safe-area-inset-top));
  padding-bottom: max(var(--space-4), env(safe-area-inset-bottom));
  ```

- 👆 **Touch Targets**:
  - Mínimo 44x44px (Apple HIG)
  - Espaciado de 8px entre elementos táctiles
  - Font-size mínimo 16px en inputs (evita zoom en iOS)

- 🖼️ **Container Queries**:
  - Cards que se adaptan a su contenedor, no al viewport
  - Componentes reusables en diferentes contextos

---

### ⚡ **FASE 2: PERFORMANCE Y OPTIMIZACIÓN**

#### 2.1. Optimización de Assets
**Acciones**:
- 🖼️ **Imágenes**:
  - Convertir a **WebP** (mejor compresión)
  - Generar versiones responsive: 400w, 800w, 1200w
  - Lazy loading: `loading="lazy"` + Intersection Observer
  - Placeholders con BlurHash o color dominante
  - Aspect ratio boxes para evitar CLS

- 🎵 **Audio**:
  - Preload: `<audio preload="metadata">` solo para próxima página
  - Formato AAC (.m4a) para mejor compresión
  - Fade in/out suave entre transiciones

- 📦 **Code Splitting**:
  - Dynamic imports: `import('./effects/rain.js')` solo cuando se necesita
  - Separar librerías grandes (Gemini SDK) en chunks

- 🗜️ **Compresión**:
  - Gzip/Brotli en servidor
  - Minificación de CSS/JS con Vite

#### 2.2. PWA Avanzada
**Acciones**:
- 💾 **Service Worker Pro**:
  - Estrategia de caché:
    - **Network First**: API de IA, stories JSON
    - **Cache First**: Assets estáticos (CSS, JS, imágenes)
    - **Stale While Revalidate**: Fonts, iconos
  - Offline fallback elegante con UI dedicada
  - Background sync para sincronizar resaltados cuando vuelva conexión

- 🔔 **Notificaciones Push** (opcional):
  - Recordatorios de lectura
  - Nuevas historias disponibles

- 📲 **Instalación Optimizada**:
  - Prompt de instalación custom (no usar el default del browser)
  - Screenshots en manifest para app stores
  - Iconos adaptativos para Android

#### 2.3. Métricas Web Core
**Objetivo**: Alcanzar puntuación 95+ en Lighthouse

**Acciones**:
- **LCP** (Largest Contentful Paint): < 2.5s
  - Preload de hero image
  - Critical CSS inline
  - Font preload

- **FID** (First Input Delay): < 100ms
  - Evitar JavaScript pesado en main thread
  - Code splitting

- **CLS** (Cumulative Layout Shift): < 0.1
  - Aspect ratios definidos
  - Font loading optimizado (font-display: swap)

---

### 🎭 **FASE 3: EXPERIENCIA DE USUARIO AVANZADA**

#### 3.1. Sistema de Onboarding
**Acciones**:
- 🎬 **Tour Interactivo** (primera vez):
  - 5 pasos con overlay y highlights
  - Explicación de gestos (swipe, tap en bordes)
  - Demo de chat con IA
  - Configuración inicial (tema preferido, tamaño de letra)

- 🌟 **Empty States**:
  - Ilustraciones custom cuando no hay resaltados
  - Sugerencias de qué leer primero

#### 3.2. Gamificación Sutil
**Acciones**:
- 🏆 **Logros**:
  - "Primera Decisión", "10 Páginas Leídas", "Todas las Rutas de Frankenstein"
  - Badges con animaciones de confeti

- 📊 **Estadísticas**:
  - Tiempo total de lectura
  - Historias completadas
  - Decisiones tomadas
  - Heatmap de lectura (horarios preferidos)

- 🎯 **Progreso Visual**:
  - Barra de progreso global por historia
  - Árbol de decisiones desbloqueado

#### 3.3. Social Features (Opcional)
**Acciones**:
- 🔗 **Compartir Citas**:
  - Generar imagen con texto resaltado + atribución
  - Share API nativa

- 👥 **Lectura Compartida**:
  - Sincronizar progreso entre dispositivos (Firebase Realtime Database)

---

### 🛠️ **FASE 4: ARQUITECTURA Y CÓDIGO**

#### 4.1. Refactorización a Web Components
**Objetivo**: Encapsular lógica reutilizable

**Acciones**:
- Crear componentes:
  - `<book-card>`: Card de libro con shadow DOM
  - `<reading-progress>`: Barra de progreso
  - `<highlight-marker>`: Resaltado inline
  - `<chat-bubble>`: Mensaje de IA
  - `<effect-overlay>`: Container de efectos visuales

- Ventajas:
  - CSS encapsulado (no bleeding)
  - Reusabilidad
  - Custom events para comunicación

#### 4.2. State Management Moderno
**Acciones**:
- Implementar patrón **Observable** para estado global:
  ```javascript
  class AppState {
    constructor() { this.listeners = []; }
    setState(newState) {
      Object.assign(this.state, newState);
      this.notify();
    }
    subscribe(listener) { this.listeners.push(listener); }
    notify() { this.listeners.forEach(l => l(this.state)); }
  }
  ```

- Beneficios:
  - Reactive UI updates
  - Debugging más fácil
  - Undo/Redo simple

#### 4.3. Documentación y Testing
**Acciones**:
- 📝 **JSDoc** en todas las funciones:
  ```javascript
  /**
   * Navega a una página específica de la historia
   * @param {number} pageId - ID de la página destino
   * @param {boolean} saveHistory - Si debe guardar en historial
   * @returns {Promise<void>}
   */
  async function goToPage(pageId, saveHistory = true) { }
  ```

- 🧪 **Tests** con Vitest:
  - Unit tests para funciones puras (navigation, storage)
  - Integration tests para flujos completos
  - Visual regression tests con Playwright

- 📚 **Guía de Usuario**:
  - Página `/help` con tutoriales
  - FAQs
  - Video demos

---

### 🌟 **FASE 5: FEATURES INNOVADORAS**

#### 5.1. Modo Lectura Inmersiva
**Acciones**:
- 🌌 **Ambient Mode**:
  - Fondo que cambia según la escena (azul frío en noche, rojo en peligro)
  - Particles.js con efectos contextuales
  - Música ambiental generativa (Web Audio API + Tone.js)

- 📖 **Modo Focus**:
  - Oculta UI, solo texto y fondo
  - Párrafos que aparecen progresivamente (evita scroll)
  - Auto-scroll a velocidad configurable

#### 5.2. IA Mejorada
**Acciones**:
- 🤖 **Análisis Contextual**:
  - Reconocer personajes mencionados
  - Explicar referencias históricas/literarias
  - Sugerir decisiones según personalidad del lector (aprendizaje)

- 🗣️ **TTS Natural**:
  - Integrar Gemini Live para narración
  - Voces diferentes por personaje
  - Control de velocidad y entonación

#### 5.3. Editor de Historias (Futuro)
**Acciones**:
- ✍️ **CMS Visual**:
  - Interface para crear historias sin código
  - Drag & drop para ramificaciones
  - Preview en tiempo real
  - Exportar a JSON

---

### 📋 **FASE 6: CALIDAD Y PULIDO**

#### 6.1. Accesibilidad (A11Y)
**Acciones**:
- ♿ **ARIA Completo**:
  - `role`, `aria-label`, `aria-live` en elementos dinámicos
  - `aria-current` en página activa

- ⌨️ **Navegación por Teclado**:
  - Tab order lógico
  - Shortcuts: `→` siguiente, `←` anterior, `Esc` cerrar modales
  - Focus visible con outline elegante

- 🎨 **Contraste**:
  - Ratio mínimo 7:1 (AAA)
  - Herramienta de verificación integrada

- 🔊 **Screen Readers**:
  - Anuncios de cambio de página
  - Descripciones de imágenes (alt text descriptivo)

#### 6.2. Internacionalización (i18n)
**Acciones**:
- 🌍 Soporte multiidioma:
  - Sistema de traducciones JSON
  - Detección automática de idioma del navegador
  - Historias en inglés, español, francés (meta inicial)

#### 6.3. Error Handling Robusto
**Acciones**:
- 🚨 **Error Boundaries**:
  - Capturar errores sin romper toda la app
  - UI de fallback elegante
  - Botón de "Reintentar"

- 📊 **Logging**:
  - Sentry o similar para tracking de errores en producción
  - Analytics de engagement

---

## 🎯 PRIORIZACIÓN DE IMPLEMENTACIÓN

### SPRINT 1 (SEMANA 1): **Fundamentos Visuales** ⭐⭐⭐
- Sistema de tokens de diseño (colores OKLCH, espaciado, tipografía)
- Componentes UI rediseñados (botones, cards)
- Responsive perfecto con safe areas

### SPRINT 2 (SEMANA 2): **Microinteracciones y Animaciones** ⭐⭐⭐
- Sistema de animaciones
- Feedback táctil (vibración, ripple)
- Transiciones de página suaves

### SPRINT 3 (SEMANA 3): **Performance** ⭐⭐⭐
- Optimización de imágenes (WebP, lazy loading)
- PWA avanzada (service worker pro)
- Code splitting

### SPRINT 4 (SEMANA 4): **Features Avanzadas** ⭐⭐
- Onboarding
- Gamificación
- IA mejorada

### SPRINT 5 (SEMANA 5): **Arquitectura** ⭐⭐
- Web Components
- State management
- Testing

### SPRINT 6 (SEMANA 6): **Calidad** ⭐⭐
- Accesibilidad completa
- Internacionalización
- Error handling

---

## 🔧 TECNOLOGÍAS Y HERRAMIENTAS NUEVAS A INTEGRAR

### Build & Dev
- **Vite** ✅ (ya implementado)
- **Vitest**: Testing unitario
- **Playwright**: Testing E2E

### UI/UX
- **Lucide Icons**: Iconografía moderna
- **Lottie**: Animaciones JSON (micro-interactions premium)
- **GSAP** (opcional): Animaciones complejas

### Performance
- **Sharp** (Node): Optimización de imágenes
- **Workbox**: Service Worker con cache strategies

### Analytics
- **Google Analytics 4**: Eventos personalizados
- **Sentry**: Error tracking

---

## 📊 KPIs DE ÉXITO

### Performance
- ⚡ Lighthouse Score: > 95
- 🎨 First Contentful Paint: < 1.5s
- 📱 TTI (Time to Interactive): < 3s

### UX
- 👆 Tasa de instalación PWA: > 30%
- 📚 Páginas por sesión: > 15
- ⏱️ Tiempo de sesión promedio: > 10 min

### Calidad
- ♿ Accesibilidad: WCAG 2.1 AAA
- 🌍 Soporte de navegadores: > 95% cobertura
- 🐛 Error rate: < 0.1%

---

## 🎨 PALETA DE COLORES PROPUESTA (OKLCH)

### Tema "Midnight Library" (Dark Premium)
```css
--color-bg-primary: oklch(15% 0.02 240);        /* Azul muy oscuro */
--color-bg-secondary: oklch(20% 0.03 240);      /* Azul oscuro */
--color-bg-tertiary: oklch(25% 0.04 240);       /* Azul medio-oscuro */

--color-accent-primary: oklch(70% 0.25 330);    /* Rosa vibrante */
--color-accent-secondary: oklch(75% 0.20 200);  /* Cyan brillante */

--color-text-primary: oklch(95% 0.01 240);      /* Blanco cálido */
--color-text-secondary: oklch(70% 0.02 240);    /* Gris claro */

--color-success: oklch(70% 0.20 145);           /* Verde esmeralda */
--color-warning: oklch(75% 0.20 60);            /* Amarillo dorado */
--color-danger: oklch(65% 0.25 25);             /* Rojo coral */
```

### Tema "Aurora" (Light Vibrante)
```css
--color-bg-primary: oklch(98% 0.01 240);        /* Blanco suave */
--color-bg-secondary: oklch(95% 0.02 240);      /* Gris muy claro */

--color-accent-primary: oklch(55% 0.24 280);    /* Morado vibrante */
--color-accent-secondary: oklch(60% 0.22 180);  /* Turquesa */

--color-text-primary: oklch(20% 0.02 240);      /* Negro azulado */
--color-text-secondary: oklch(40% 0.03 240);    /* Gris oscuro */
```

---

## 📝 NOTAS FINALES

Este blueprint es un **documento vivo**. Se actualizará conforme implementemos cada fase. 

**Filosofía de trabajo**:
1. **Calidad sobre velocidad**: Cada feature debe sentirse premium
2. **Mobile-first always**: El 80% de usuarios leerá en móvil
3. **Accesibilidad no negociable**: Todos deben poder disfrutar
4. **Performance obsesiva**: Sub-segundo load times
5. **Detalles que deleitan**: Las micro-interacciones definen la excelencia

**Próximos Pasos Inmediatos**:
1. Revisión y aprobación de este blueprint
2. Setup de entorno de desarrollo mejorado
3. Inicio de SPRINT 1: Sistema de tokens de diseño

---

**Este proyecto es especial. Lo trataremos con el cariño que merece.** 🚀📚✨

---

## 🍂 SISTEMA DE EFECTOS EMOCIONALES — Filosofía

### Principio Rector
> Cada efecto visual debe reflejar el **alma** del poema o historia. No es decoración; es una extensión emocional del texto.

### Hojas de Otoño (v2.0 — Febrero 2026)
**Poema**: "No Volveré a Ser Joven" de Jaime Gil de Biedma  
**Esencia**: La pérdida irreversible de la juventud. Melancolía resignada. El otoño como metáfora del tiempo que pasa sin remedio.

**Implementación técnica**:
- **8 formas orgánicas únicas** (arce, roble, olmo, abedul, tilo, sauce, higuera, hoja clásica) con paths SVG irregulares y asimétricos
- **8 paletas emocionales**: desde "recién caída" (todavía con vida) hasta "ceniza" (casi muerta), pasando por "vino seco" (melancolía profunda)
- **Textura fractal** via filtros SVG `feTurbulence` — simula la textura orgánica de una hoja real
- **Manchas de envejecimiento** — elipses semi-transparentes aleatorias sobre el cuerpo de la hoja
- **Venas botánicas** — trazos con dasharray irregular, vena central más gruesa
- **Bordes secos** — segunda capa de stroke con dasharray dinámico
- **Física natural via `requestAnimationFrame`** — reemplaza animaciones CSS cíclicas:
  - Vaivén sinusoidal con turbulencia
  - Drift lateral aleatorio
  - Rotación 3D con "flip" para simular dos caras de la hoja
  - Pausas aleatorias donde la hoja "flota" brevemente
  - Aceleración natural (easeOutQuad)
- **Progresión emocional por página**:
  - Pág 1 (`minimal`): Casi vacío, una hoja solitaria — *"No volveré a ser joven"*
  - Pág 2 (`low`): Pocas hojas caen lentamente — *"yo vine a llevarme la vida por delante"*
  - Pág 3 (`medium`): Otoño visible — *"envejecer, morir, eran las dimensiones del teatro"*
  - Pág 4 (`high`): Caída densa — *"es el único argumento de la obra"*
- **0 imágenes externas** — todo es SVG generado por código (sin fondos blancos, sin peso extra)
- **Rendimiento adaptativo** — ajusta cantidad de hojas según memoria del dispositivo y CPU

---

### Experiencia Dual Poética (v1.0 — Febrero 2026)
**Objetivo**: Ofrecer dos formas de consumir poesía: la experiencia auditiva original (voz del autor) y la experiencia de lectura íntima (silenciosa).

**Implementación**:
1. **Página de Introducción**:
   - Título y autor con animación de entrada cinemática.
   - Dos opciones claras:
     - 🎧 **Escuchar con la voz del autor** (Botón primario, pulsante, destacado)
     - **Leer en silencio** (Botón secundario, sutil)

2. **Modo Audio (Karaoke Mejorado)**:
   - Texto completo visible con resaltado sincrónico.
   - Botón de reproducción rediseñado, elegante y minimalista.
   - Animaciones dramáticas para el verso activo (`scale` + `glow`).

3. **Modo Lectura Silenciosa**:
   - **Paginación verso a verso**: El poema se desglosa en múltiples páginas para controlar el ritmo de lectura.
   - **Tipografía Emocional**: Uso de fuentes serif clásicas, centradas, con mucho aire.
   - **Animaciones de Entrada**: Los versos aparecen con un `blur-in` escalonado, simulando el pensamiento formándose.
   - **Atmósfera Visual Personalizada**:
     - **Borges ("El Remordimiento")**: Progresión de filtro Sepia (`light` -> `medium` -> `strong` + `grain`) para evocar memoria y antigüedad.
     - **Vilariño ("Ya no")**: Efecto de "Lluvia Sutil" (`rain_subtle`) constante para evocar tristeza fría y pérdida.

---

### Chroma Key Dinámico WebGL/Canvas (v3.0 — Febrero 2026)
**Módulo**: `<chroma-key-video>` (Web Component)
**Propósito**: Integrar vídeos con pantalla verde (ej. golondrinas volando) sobre cualquier fondo de la aplicación, haciéndolos transparente de manera dinámica según el tema seleccionado por el usuario.

**Estrategia Técnica**:
- Se creó el Web Component encapsulado `<chroma-key-video>`.
- Procesa el vídeo frame por frame utilizando la API de Canvas (`getImageData` y `putImageData`).
- **Algoritmo de Chroma**: Mide la dominancia del canal verde (`g > Math.max(r, b) + threshold`).
- Implementa una transición suave de anti-aliasing (alpha blend) en los bordes para reducir el "halo" verde ("spill suppression").
- No requiere librerías externas ni procesado en servidor; funciona client-side permitiendo que el video flote sobre CSS cambiante.
- Integrado directamente en el motor de renderizado (`render.js`) a través de la propiedad de datos `"video": ["rutadelvideo.mp4"]`.

---

### Sistema de Audio Fantasma "Ghost Echo" (v1.0 — Marzo 2026)
**Módulo**: `src/reader/audio.js`  
**Propósito**: Crear una experiencia sonora que respira, baja, sube, y nunca muere. Diseñado para el poema de Bécquer pero reutilizable en cualquier lectura.

**Filosofía**:
> La melodía no es decoración; es la presencia emocional que acompaña al lector. Cuando el sonido termina abruptamente, el alma del poema se rompe. El sistema Ghost Echo resuelve esto con una segunda capa de audio "fantasma" que anticipa el final y asegura continuidad.

**Flujo Emocional**:
1. **Nacimiento** — Audio principal arranca con fade-in suave (0 → volumen deseado en ~3s)
2. **Vida** — La melodía acompaña al lector a volumen pleno
3. **Anticipación** — Cuando quedan ~18s del audio principal, el "fantasma" se despierta: la misma melodía desde el inicio a volumen casi imperceptible (~3%)
4. **Despedida** — El audio principal hace fade-out en sus últimos ~8 segundos
5. **Susurro** — El fantasma sube suavemente a ~20% y se convierte en el acompañante
6. **Renacimiento** — Tras 4 segundos de solo fantasma (un respiro melancólico), el audio principal renace desde 0 con fade-in, y el ciclo se repite infinitamente

**Propiedades JSON**:
- `ghostEcho: true` — Activa el sistema fantasma en la página
- `fadeIn: true` — Activa el fade-in inicial del audio principal
- `volume: 0.55` — Volumen base (multiplicado por el volumen global del usuario)

**Curva de Volumen Emocional (Bécquer)**:
- Estrofa 1: `0.55` (esperanza, la melodía llena el espacio)
- Estrofa 2 (Pérdida 1): `0.50` (la primera herida)
- Estrofa 3 (Madreselvas): `0.50` (naturaleza aún viva)
- Estrofa 4 (Pérdida 2): `0.45` (lágrimas caen)
- Estrofa 5 (Palabras ardientes): `0.40` (la voz se apaga)
- Estrofa 6 (Final): `0.35` (desolación, casi un susurro)
- Biografía: `0.20` (un recuerdo distante)

---

### Indicador Visual de Despliegue (Marzo 2026)
**Objetivo**: Añadir un pequeño identificador visual en la página principal para confirmar rápidamente actualizaciones en el entorno de producción (especialmente para instalaciones PWA cacheadas).
**Implementación**:
- Se añadió un pequeño texto "v2" junto al título principal "Lecturas Interactivas" en el header (`index.html`).
- Estilo sutil: `font-size: 0.4em`, `opacity: 0.6`, no intrusivo y alineado verticalmente (`super`).

---

### Poema "Como Aman los Pobres" — Gata Cattana (Marzo 2026)
**Autora**: Ana Isabel García Llorente, *Gata Cattana* (Adamuz, Córdoba, 1991 — Madrid, 2017). Rapera, poeta y politóloga feminista. Poemario *"La Escala de Mohs"* (2016).

**Efecto visual**: "Flores en el Hormigón" — sistema de partículas SVG que brotan desde el borde inferior de la pantalla. 7 intensidades (intro → tierra → flama → brasa → rosa → corazón → bio) con paletas de color que evolucionan de tierra/ocre a rojo vivo y carmesí a medida que el poema crece emocionalmente.

**Componentes nuevos**:
- `src/effects/pobres/index.js`: Motor SVG para flores silvestres. 3 formas (simple, wild, poppy), tallos verdes, centro brillante. Animación `flowerBloom` con overshoot elástico.
- `public/stories/gata_cattana_aman_pobres.json`: 12 páginas. Paréntesis con clase `gata-parenthesis` para renderizado en susurro.
- `public/images/gata_cattana_portada.webp`: Portada artística (manos trabajadoras + flores en hormigón).
- `public/images/gata_cattana_retrato.webp`: Retrato ilustrado para la página de homenaje.
- `src/styles/poem-experience.css`: Estilos `.gata-*`: título en lowercase warmth, paréntesis-susurros, retrato circular con sepia, badge "1991 — 2017", cita de cierre.

**Paleta emocional**:
- Pág 1–2 (tierra): carbón oscuro + ocre (`#D2691E`)
- Pág 3–5 (flama): rojo oscuro (`#B22222`) — amor sin ventanas
- Pág 6–7 (brasa): naranja vivo (`#FF4500`) — Heracles, Urano, Gea
- Pág 8–9 (rosa): carmesí (`#E8174D`) — flores, arte, boleros
- Pág 10 (corazón): rojo puro (`#FF1744`) — confesión final
- Pág 11 (bio): morado (`#6B2D5E`) — tributo, eternidad

