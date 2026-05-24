  # 📚 Blueprint Maestro: Lecturas Interactivas - Transformación Total

## 🎯 Filosofía del Proyecto (El Rascacielos Experimental)

**"Lecturas Interactivas"** es una obra arquitectónica maestra, una plataforma inmersiva, escalable y **heterogénea** que transforma la lectura clásica en una experiencia interactiva. No es solo un lector de libros o poesía; es un **portal dimensional literario** donde caben textos solemnes, mecánicas narrativas complejas y **pequeños juegos interactivos experimentales (viñetas)** que complementan o exploran los conceptos de los textos.

- 🎭 **Narrativa Ramificada**: Decisiones que alteran el curso de historias clásicas
- 🎮 **Viñetas Dinámicas**: Juegos y módulos web interactivos aislados herméticamente
- 🎨 **Atmósfera Visual**: Imágenes contextuales que intensifican momentos clave
- 🎵 **Paisajes Sonoros**: Audio ambiental y efectos que sumergen al lector
- 🤖 **IA Contextual**: Asistente conversacional para profundizar en la lectura
- ✨ **Efectos Visuales**: Partículas, overlays y animaciones temáticas
- 🎯 **Resaltados Inteligentes**: Sistema de citas y marcadores personalizables

### Visión Original vs. Nueva Visión
Este es tu primer proyecto, diseñado con una estética **Netflix-like**. Ahora lo estamos elevando a **Nivel Rascacielos** para que *cualquier cosa nueva que quieras experimentar* funcione sin romper el edificio. El core es el minimalismo y el "Silencio Visual", mientras que el poder subyacente es la escalabilidad.

1. **Arquitectura de Rascacielos**: Modular, escalable, aislamiento perfecto de módulos experimentales
2. **UX Premium Contemplativa**: Micro-interacciones sutiles, animaciones fluidas, sin gamificación barata
3. **Performance Óptima**: Carga progresiva, caching inteligente, optimización obsesiva de assets
4. **Accesibilidad Total**: WCAG 2.1 AAA, navegación por teclado, lectores de pantalla
5. **Mobile-First Perfecto**: Responsive real, gestos naturales, notch-aware
6. **PWA Avanzada**: Instalable, offline-first, sincronización en background

---

## 🛠️ PLAN DE AUDITORÍA DE CIMIENTOS (Nuevo)

Antes de seguir construyendo más pisos y agregando módulos experimentales complejos, se debe realizar una auditoría arquitectónica para asegurar la solidez:

1. **Aislamiento de Módulos (Encapsulamiento):** Comprobar si las viñetas/juegos actuales (ej. Sísifo) o futuros están 100% aislados (Web Components, sandboxing o iframes) para que su física, su CSS o sus loops de animación (`requestAnimationFrame`) no rompan la app central ni generen sangrado visual (bleeding).
2. **Gestión de Memoria y Rendimiento:** Evaluar cómo `init.js`, `render.js` y el sistema de módulos manejan la inicialización y, sobre todo, la **destrucción** (cleanup) de librerías pesadas (ej. `matter.js`, canvas complejos, audios grandes) al desmontar la vista para evitar *memory leaks*.
3. **Escalabilidad del Estado Global (`state.js`):** Determinar si el patrón de estado actual puede soportar puntuaciones temporales de minijuegos u otros datos efímeros sin persistirlos innecesariamente en `localStorage`, ni contaminar la lectura principal.
4. **Mantenimiento Autónomo CSS:** Consolidar variables huérfanas o reglas dispersas en el nuevo sistema de tokens unificados.

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

#### 1.1. Sistema de Tokens de Diseño Modernos ✅
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

#### 1.2. Componentes UI Rediseñados ✅
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

#### 1.4. Responsive y Mobile-First Perfecto ✅
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

#### 2.1. Optimización de Assets ✅
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

#### 2.2. PWA Avanzada ✅
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
✅ **Tour Interactivo** (primera vez):
  - 5 pasos con overlay y highlights (Refactorizado a Invitación Sensorial y Gestos Básicos)
  - Explicación de gestos (swipe, tap en bordes)
  - Demo de chat con IA y Audio Ambiental
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

#### 3.3. Social Features & Citas 2.0 (Ampliación Épica)
**Implementadas (Marzo 2026)**:
- 🔖 **Citas 2.0 (Core Engine & UX)**:
  - **Core**: Refactorización absoluta de `highlights.js` utilizando **CSS Custom Highlight API** para eliminar la mutación destructiva del DOM (`TreeWalker`). Sistema de alto rendimiento nativo.
  - **UI (Tooltip Flotante)**: Nuevo menú tipo "Glassmorphism" inyectado en la raíz (`#highlight-tooltip-wrapper`). Aparece sin modificar la estructura semántica de la página central al seleccionar texto. *Bulletproof* contra colapsos nativos de selección en dispositivos móviles, implementando contramedidas activas para tap/touch-events que abordan las limitaciones críticas en iOS/Android.
  - **UX (Quote Cards)**: Rediseño del panel lateral. Las citas se muestran en tarjetas premium (glassmorphism) con Action Bar (Ir a página, Compartir, Eliminar).
  - **Persistencia Robusta**: Serialización de objetos `Range` guardados en `localStorage` basada en la cuenta absoluta de textos para prevenir desajustes al recargar.

- 🌐 **Ecosistema de Compartición Social Moderno (Libros y Citas)**:
  - **Compartir Obras**: Posibilidad de compartir un libro, poema o cita específica con un solo botón en portadas y tooltips.
  - **Kebab Menus (Escalabilidad)**: La acción de compartir ahora se encuentra alojada bajo menús desplegables universales de tres puntos verticales (Kebab), implementados uniformemente tanto en las `book-cards` como en el banner destacado (**Hero**), completamente blindados contra distorsión en Desktop usando nowrap properties.
  - **Frontend Módulo**: Integración de `navigator.share()` nativo, con Fallback automático de portapapeles (`textarea.select()`) para sortear el bloqueo de HTTP en IPs locales desde smartphones.
  - **Backend (Open Graph Dinámico)**: Implementación de un endpoint Serverless (`/api/share.js`) capaz de interceptar URIs generadas y devolver metaetiquetas (OG) SEO-friendly a WhatsApp, Facebook y Twitter antes de redireccionar a la Single Page App.

- 🎛️ **Lectura Inmersiva Mobile-First**:
  - **Scroll-to-Reveal**: Todos los paneles fijos inferiores (Orbe, Toggle Citas, Audios) aplican una transformación CSS fluida de salida cuando el usuario desliza hacia abajo para leer ininterrumpidamente, y reaparecen automáticamente al subir. Incluye amortiguación hermética contra la cinemática de inercia y rebote (elastic bounce) propia de navegadores móviles (Safari/iOS).

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

### Sistema de Audio Fantasma "Ghost Echo" (v1.0 — Marzo 2026, DORMANT)
**Módulo**: `src/reader/audio.js`  
**Estado**: ⏸️ Código presente pero inactivo. Se desactivó para priorizar estabilidad.

**Filosofía**:
> La melodía no es decoración; es la presencia emocional que acompaña al lector. El sistema Ghost Echo usa una segunda capa de audio "fantasma" que anticipa el final y asegura continuidad.

**Reactivación pendiente**: El código completo está en `audio.js` como referencia para reactivar de forma controlada.

---

### Unificación del Sistema de Audio (v2.0 — Marzo 2026)
**Módulo**: `src/reader/audio.js` + `src/reader/render.js`  
**Propósito**: Un solo camino de reproducción para todo el audio (poemas, La Puerta, karaoke).

**Cambios clave**:
1. **`playPageSound()`** simplificada — ya no lee `ghostEcho`, `fadeIn`, ni `delay`.
2. **`toggleCurrentAudio()`** simplificada — pause/resume directo.
3. **`render.js`** unificada — un solo `pageSoundFile` para todos los campos de audio.
4. **`audio.loop = true`** por defecto (excepto karaoke).
5. **Fade-in estándar** (1.4s) para todo.

---

### CommandOrb — Rediseño Visual con Psicología del Color (v2.0 — Marzo 2026)
**Módulo**: `src/styles/command-orb.css`

**Sistema de color**:
- **Modo IA (G)**: Violeta profundo (#7c3aed → #a855f7) — creatividad, sabiduría, tecnología
- **Modo Audio**: Ámbar cálido (#d97706 → #f59e0b) — calidez, invitación, experiencia sensorial

**Implementación**:
1. CSS custom properties: `--orb-color-ia`, `--orb-color-audio`
2. G con gradiente violeta + glow, letra blanca
3. Audio con iconos en ámbar, halo warm, EQ bars doradas
4. Secondary orb (mini G) con mismo gradiente violeta
5. Tooltip refinado: uppercase, tracking wider, glass effect

---

### Rediseño Premium de la Homepage (Marzo 2026, actualizado Mayo 2026)
**Objetivo**: Transformar la página principal en un portal inmersivo, editorial y altamente enfocado, con una estética "Netflix + app literaria premium".

**Estructura implementada (Mayo 2026 — Reestructuración de secciones)**:
1. **Hero Destacado (`la-puerta`)**: Puerta de entrada al ecosistema (Obra original).
2. **Poesía** — *"Versos que respiran"*: Solo poemas puros (Gata Cattana, Bukowski ×2, Borges, Vilariño, Gil de Biedma, Bécquer). Separados de conceptos filosóficos.
3. **Conceptos Filosóficos** — *"Ideas que se sienten"*: Experiencias filosóficas inmersivas (El Eterno Retorno de Nietzsche, El Mito de Sísifo de Camus). Cards más anchas para reflejar su naturaleza inmersiva. `type: "philosophy"` en `books.json`.
4. **Creación Propia** — *"Escritura desde adentro"*: Obras originales/exclusivas de la plataforma (La Puerta, La Levedad del Deseo). Título con gradiente sutil (text-primary → accent-secondary) para distinguir la sección.
5. **Novelas con bifurcaciones**: Categoría propia y diferenciada (`frankenstein`).
6. **Libros** — *"Narrativa clásica reimaginada"*: Obras narrativas clásicas (Iván Ilich, El Extranjero, Meditaciones).
7. **Próximamente**: Módulos premium para autores anunciados. Placeholders elegantes ("book-card--upcoming") con gradients oscuros, blurs translúcidos y títulos desenfocados.

**Mejoras CSS (Mayo 2026)**:
- `.library-row-section[data-section-id="filosofia"]`: Cards más anchas (300px max), altura mayor para enfatizar la naturaleza inmersiva.
- `.library-row-section[data-section-id="creacion-propia"]`: Título con gradient text (background-clip) para distinguir la sección.
- Staggered animations extendidas a 6 secciones (100ms–600ms delays).
- `.book-card--upcoming`: Sombras reactivas sutiles, overlays tipo *glassmorphism*, badge integrado pero transparente y un estilo visual que comunica "premium en desarrollo".

### Poema "Como aman los pobres" — Gata Cattana (Marzo 2026)
**Objetivo**: Dotar a la obra de Gata Cattana de una identidad visual premium y representativa para la biblioteca.

**Implementación**:
1. **Edición Artística de Portada**: Se ha generado una portada personalizada utilizando la imagen original de las manos y la amapola, incorporando el título "Como aman los pobres" y el nombre de la autora en tipografía serif elegante con sombras suaves para asegurar legibilidad y coherencia estética con el resto de la colección.
2. **Coherencia Visual**: La portada ahora incluye la etiqueta "POEMAS" bajo el título, unificando el lenguaje gráfico con otras obras contemporáneas y clásicas de la plataforma.

### Poema "el cordón del zapato" — Charles Bukowski (Marzo 2026)
**Objetivo**: Añadir el poema de Charles Bukowski asegurando una lectura rápida, fluida y con la imagen gráfica adecuada.

**Implementación**:
1. **Transcripción Literal**: Respeto total al formato y fluidez de las estrofas.
2. **Paginación para Lectura Rápida**: Agrupaciones amplias de versos por página para minimizar los clics y acelerar la cadencia lectora.
3. **Portada Temática**: Creación automatizada de portada con IA basada en la estética solicitada (zapatos, iluminación dark, títulos integrados "el cordón del zapato" / "Charles Bukowski").
4. **Integración en Sistema**: Añadido exitosamente a la sección inicial de `poemas` en `library-sections.json` e incorporado el objeto de libro en `books.json`.

### Refinamiento "Eterno Retorno" — Nietzsche (Marzo 2026)
**Objetivo**: Oscurecer, hacer más elegante y directa la experiencia interactiva de "El eterno retorno", alejándola del aspecto generado por IA y dándole un tono sobrio, auténtico y contemplativo.

**Implementación**:
1. **Rediseño Gráfico**: Nuevas imágenes (portada y retrato biográfico) mucho más oscuras y solemnes, emulando fotografía histórica genuina y texturas minimalistas.
2. **Estructura y Tono**: Título en español ("El eterno retorno"), rediseño tipográfico sumamente elegante de la pregunta inicial en portada (`.eterno-hook`), y eliminación de pantallas de diálogo irrelevantes o excesivas ("haz una pausa", etc).
3. **Flujo de Decisión Elegante**: La pregunta final culmina directamente con las opciones de afirmación y rechazo usando botones limpios, continuados inmediatamente por la biografía del autor.
4. **Biografía y Ambientación**: Cambio de la cita final a "Aquel que tiene un porqué para vivir, puede soportar casi cualquier cómo", y ralentización de las velocidades del canvas de fondo (halo rotatorio) para infundir un movimiento contemplativo sutil en la experiencia.
5. **Ajuste de Tempo (Cierre)**: Sincronización refinada de la página final. La transición de sombreado (dimming) del texto y la aparición de las preguntas se ha adelantado de 5s a 4s para mejorar el ritmo de lectura y asegurar que las opciones sean visibles antes de que el usuario intente avanzar manualmente.

### Optimización UI Autenticación (Mayo 2026)
**Objetivo**: Mejorar el encuadre visual del sistema de inicio de sesión para dispositivos móviles y PC, garantizando la visibilidad inmediata de la opción "Explorar sin cuenta".

**Implementación**:
1. **Reducción de Dimensiones**: Ajuste de paddings (`var(--space-6)` a `var(--space-4)`), márgenes, y font-sizes (`text-2xl` a `text-xl`) en el archivo `auth.css`.
2. **Compactación de Formularios**: Reducción del gap entre inputs, padding interno de campos y altura mínima de botones (de `48px` a `44px` y `40px` para redes sociales).
3. **Visibilidad Garantizada**: La optimización global del espaciado vertical asegura que el botón de omitir registro (`.auth-skip-btn`) renderice siempre en la primera pantalla visible (above the fold) sin necesidad de scroll, mejorando la conversión y experiencia del usuario inicial.

### Auditoría Frontend y Perfil Social Local (Mayo 2026)
**Objetivo**: Pulir errores visibles de navegación, biografías y experiencia de usuario sin tocar backend ni alterar la identidad visual del proyecto.

**Implementación**:
1. **Integridad de Lectura**: Corrección de decisiones finales rotas en `Frankenstein`, `La muerte de Iván Ilich` y `Meditaciones`; eliminación de IDs duplicados críticos en `Meditaciones` para evitar saltos invisibles en el `Map` de páginas.
2. **Finales Más Limpios**: Ajuste del renderer para no generar botones redundantes de reinicio cuando una página final ya ofrece volver a la biblioteca.
3. **Biografías Mejor Encuadradas**: Centrado robusto del `bio-badge` de fechas bajo los retratos sin cambiar colores, paleta ni tratamiento autoral.
4. **Biblioteca Más Fluida**: Consolidación del cierre de menús kebab en un único listener global y IDs únicos para gradientes SVG de progreso.
5. **Ecosistema Social Local**: Nuevo estante personal, galería de huellas, resumen de citas/páginas/lecturas y ajustes de perfil desde el drawer de usuario, todo con persistencia local y preparado para migración futura a backend.

### Centro Personal Unificado (Mayo 2026)
**Objetivo**: Unificar usuario, cuenta, configuración de lectura, estadísticas locales y galería de huellas en una sola sección para que la aplicación se perciba más terminada y menos fragmentada.

**Implementación**:
1. **Entrada Única**: Eliminado el engranaje independiente del header; el avatar abre ahora un centro personal con resumen, huellas, lectura y cuenta.
2. **Lenguaje Más Claro**: La antigua idea de estante queda expresada como "obras guardadas", mientras la métrica principal evita "total lecturas" y muestra obras, páginas, citas y huellas.
3. **Configuración Integrada**: Tema, tamaño de texto, volumen y pantalla completa viven dentro del panel de lectura del drawer y se conectan con las funciones reales del estado global.
4. **Galería Prioritaria**: Las huellas aparecen como primera superficie del resumen y se pueden abrir desde la galería completa con vista previa.
5. **Pulido Responsive**: Ajustes específicos para móvil, cache-busting de CSS y verificación en navegador para evitar overflow horizontal o pestañas apretadas.

### Integración y Estilización de Creaciones Propias (Mayo 2026)
**Objetivo**: Consolidar y elevar las 4 obras originales del autor ("La Puerta", "La levedad del deseo", "Vaivén" y "Ocaso") mediante una identidad de autor unificada, tarjetas de biblioteca personalizadas y una cartilla biográfica inmersiva.

**Detalles de la Implementación**:
1. **Identidad del Autor ("Ju Ez")**:
   - Firma tipográfica moderna, sobria y existencial (sans-serif uppercase con espaciado amplio y estilo itálico/inclinado "en K").
   - Reemplazo de marcas impersonales por la rúbrica estilizada `<span class="author-signature">Ju Ez</span>` en portadas y el lector. Respaldada en los estilos modulares.
2. **Biografía Inmersiva (Espejo "Yo")**:
   - En lugar de retratos fotográficos, las biografías de las obras de Ju Ez muestran una superficie circular reflectante de cristal/plata (efecto *glassmorphism* con desenfoque de 16px y bordes luminosos).
   - En el centro flota la palabra **"Yo"** en tipografía Serif de color **blanco hueso profundo** (`#f5f2eb`), con un halo de brillo que simula un espejo introspectivo.
   - El badge biográfico inferior luce la firma cursiva `"Ju Ez"`.
3. **Diferenciación Estética en Biblioteca**:
   - **Efecto Glow Premium**: Las tarjetas de obras propias (`.book-card--original`) irradian un halo de luz reactivo en hover (al estilo de "La Puerta").
   - **Separación de Género**: 
     - **Poemas** (Vaivén, Ocaso): Lucen un badge de cristal violeta/rosa (`Poema`) con un destello a juego.
     - **Escritos/Relatos** (La Puerta, La levedad del deseo): Lucen un badge de cristal cyan/azul (`Relato`) con un destello tecnológico a juego.
4. **Vínculos de Estilos**:
   - Todos los estilos viven de forma modular y limpia en [poem-original.css](file:///c:/App-libro-interactivo/src/styles/poem-original.css), cargados bajo el `@layer poems` de [index.css](file:///c:/App-libro-interactivo/src/styles/index.css).

### Lógica de Cabecera y Pantalla Completa Virtual Móvil (Mayo 2026)
**Objetivo**: Mejorar la experiencia inmersiva del lector ocultando el botón del avatar de usuario cuando se lee y mostrando en su lugar el botón de pantalla completa, e implementar un sistema de pantalla completa virtual móvil robusto para dispositivos sin soporte de Fullscreen API (como iOS Safari en iPhone) de forma paralela.

**Detalles de la Implementación**:
1. **Alternancia de Cabecera**:
   - Al entrar al lector (`switchToReaderView`), el botón de avatar de usuario (`#header-avatar-slot`) se oculta y se muestra el botón de pantalla completa (`#fullscreen-btn`).
   - Al volver a la biblioteca (`switchToLibraryView`), el avatar de usuario se vuelve a mostrar y se oculta el botón de pantalla completa.
   - En la pantalla de autenticación, ambos elementos se ocultan de forma automática.
2. **Pantalla Completa Híbrida (Nativa/Virtual)**:
   - Se reescribe la lógica de `toggleFullscreen` en [index.js](file:///c:/App-libro-interactivo/src/ui/index.js) para detectar la falta de soporte de la API nativa de pantalla completa y dispositivos iOS.
   - Si no hay soporte nativo, se activa la **Pantalla Completa Virtual** agregando la clase `.virtual-fullscreen` al `body` y disparando manualmente el evento `fullscreenchange` sobre el `document`.
3. **Estilización de Pantalla Completa Virtual**:
   - Se implementan reglas CSS específicas en [poem-original.css](file:///c:/App-libro-interactivo/src/styles/poem-original.css) bajo la clase `body.virtual-fullscreen` para fijar la ventana (`position: fixed`, `width: 100%`, `height: 100%`, `overflow: hidden`) y estirar el contenedor de la aplicación (`#app-container`) al viewport dinámico completo (`100dvw`, `100dvh`, `z-index: 9999`).
   - Al disparar el evento `fullscreenchange` de forma manual, la aplicación sincroniza la clase `.fullscreen-mode` en el `body`, de modo que toda la lógica de visualización Zen y ocultación de barras nativas del lector heredan automáticamente el comportamiento sin duplicación de código CSS.

### Reestructuración del Catálogo y Hero Principal (Mayo 2026)
**Objetivo**: Mejorar el descubrimiento de contenido promoviendo la nueva obra poética e implementando una categorización más natural.

**Implementación**:
1. **Destacado Principal (Hero)**: Se reemplazó "La Puerta" por el poema "Vaivén" (`original-vaiven`) como la obra destacada en la cabecera (Hero) de la biblioteca.
2. **Reubicación de La Puerta**: "La Puerta" se retiró del Hero y ahora reside de manera exclusiva en su sección correspondiente de obras de autor.
3. **Renombramiento de Sección**: La sección "Creación Propia" fue renombrada a "Escritos Originales".
4. **Nuevo Orden de Secciones**: Poesía, Conceptos Filosóficos, Con la Voz del Autor, Escritos Originales, Novelas con bifurcaciones, Libros, Próximamente.

### Corrección de Versos, Latido Lento y Salpicadura de Sangre de Alta Precisión por Letra en Ocaso (Mayo 2026)
**Objetivo**: Corregir la página 4 de "Ocaso" (finalizando en "Inevitable."), enlentecer el latido a un ritmo de 5.5s imperceptible, y simular una tinción de sangre realista y asimétrica de letras individuales en múltiples páginas de la obra, animando la sangre para que fluya en la dirección física de la salpicadura de forma muy gradual (6.5s).

**Implementación**:
1. **Tinción Precisa por Letras Multi-Página ([ocaso.json](file:///c:/App-libro-interactivo/public/stories/ocaso.json))**:
   - **Portada (Pág. 1)**: Envolver la **O** de "Ocaso" (`.blood-title-O` a 20% vertical superior, goteando hacia abajo) y la **J** de "Ju Ez" (`.blood-author-J` a 5% diagonal inferior izquierda).
   - **Página 2**: Envolver la primera **b** de "imposibilidad" (`.blood-b-split` con tinción dual: 40% abajo y 20% arriba, uniéndose en el centro) y `"i-l-i-d-a-d"` (`.blood-bottom-40` a 40% vertical desde abajo).
   - **Página 3**:
     * Envolver la **j** (`.blood-bottom-90` a 90% vertical desde abajo) y la tilde **á** (`.blood-accent-30` a 30% vertical desde arriba / accent) de "Ojalá".
     * Envolver la **m** (`.blood-70` a 70% vertical desde abajo), la **o** (`.blood-o-soñamos` a 30% desde la izquierda / horizontal para fluidez con la M) y la **s** (`.blood-s-top-25` a 25% superior) de "soñamos".
   - **Página 4**: Envolver las letras `n`, `v`, `t`, `a` (`.blood-bottom-90` a 90% vertical) y la **b** (`.blood-b-inevitable` a 60% diagonal incompleta) de "Inevitable.".
   - **Página 5**: Envolver las letras según el patrón ya definido (Como, amor, queda, aguardar, otro, amar.).
2. **Latido Ultra Lento e Imperceptible (5.5s)**:
   - Mantener el ciclo de `5.5s` en `@keyframes heartbeatPulse` con escala mínima de `1.012` / `1.002` para un pulso existencial sumamente lento.
     * `--blood-core: oklch(28% 0.26 24)` (rojo sangre profundo y denso)
     * `--blood-dark: oklch(16% 0.20 18)` (bordes oscuros y coagulados)
     * `--text-white: #e6e5ec` (blanco hueso base de texto sin manchar)
   - Aplicar la animación de crecimiento `stainLetterBlood` de `0% 100%` a `100% 100%` a partir del segundo 3.5.
4. **Invalidación de Caché en Producción**:
   - Incrementar `CACHE_NAME` a `lecturas-interactivas-cache-v17` en [service-worker.js](file:///c:/App-libro-interactivo/public/service-worker.js) para invalidar los estilos locales antiguos.
   - Incrementar el query param de estilos a `index.css?v=105` en [index.html](file:///c:/App-libro-interactivo/index.html).


