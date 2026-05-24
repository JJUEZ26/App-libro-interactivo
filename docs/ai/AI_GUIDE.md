# 🤖 Guía para IA — Lecturas Interactivas

> Este documento es una **ruta de navegación** para cualquier IA que trabaje en este proyecto.
> Léelo antes de hacer cambios. Te ahorrará errores y te dará contexto completo.

---

## 📂 Estructura del Proyecto (Mapa Definitivo)

```
App-libro-interactivo/
│
├── index.html                    # Punto de entrada principal (SPA)
├── manifest.webmanifest          # PWA manifest
├── service-worker.js             # Service Worker (cache strategies)
├── package.json                  # Solo Vite como dependencia
├── GEMINI.md                     # Reglas de sistema para IA
├── AI_GUIDE.md                   # ← ESTÁS AQUÍ
├── blueprint.md                  # Blueprint maestro del proyecto
│
├── api/                          # Serverless functions (Vercel)
│   ├── chat.js                   # Endpoint: POST /api/chat → Gemini AI
│   └── live-key.js               # Endpoint: GET /api/live-key → API key
│
├── docs/                         # Documentación histórica (solo referencia)
│   ├── BROCHE_DE_ORO.md
│   ├── DIA_1_COMPLETADO.md
│   ├── GITHUB_VERCEL_GUIDE.md
│   └── ...
│
├── public/                       # Assets estáticos (servidos en raíz por Vite)
│   ├── data/
│   │   ├── books.json            # Catálogo de libros (ID, portada, storyFile...)
│   │   └── library-sections.json # Secciones de la biblioteca (orden y agrupación)
│   ├── images/                   # Portadas e imágenes (formato WebP optimizado)
│   ├── sounds/                   # Audio: música, efectos, narraciones
│   ├── stories/                  # JSON de cada historia/poema con páginas
│   ├── videos/                   # Videos de fondo y efectos visuales
│   ├── offline.html              # Página offline (PWA fallback)
│   └── pcm-processor.js          # AudioWorklet para captura de micrófono
│
└── src/                          # Código fuente (ES Modules)
    ├── main.js                   # Entry point → importa init.js + chroma-video + registra SW
    │                              #   (SW se registra después de load para no bloquear)
    │
    ├── app/                      # Core de la aplicación
    │   ├── init.js               # Orquestador principal — conecta TODOS los módulos
    │   ├── state.js              # Estado global (appMode, currentBook, theme, etc.)
    │   └── dom.js                # Helper: getEl(id)
    │
    ├── books/                    # Lógica de biblioteca
    │   ├── index.js              # Carga books.json, crea cards, hero, progress rings
    │   └── pajaro-azul/styles.css # Estilos específicos para Pájaro Azul
    │
    ├── components/               # Web Components
    │   └── chroma-video.js       # <chroma-key-video> — chromakey via WebGL shader (+fallback Canvas2D)
    │
    ├── effects/                  # Sistema de efectos visuales
    │   ├── index.js              # Orquestador de efectos (handlePageEffects)
    │   ├── beetle/               # Escarabajo animado (biblioteca)
    │   ├── bluebird/             # Pájaro azul (GIF animado)
    │   ├── cracks/               # Grietas
    │   ├── dewdrops/             # Gotas de rocío
    │   ├── leaves/               # Hojas de otoño (SVG generadas)
    │   ├── overlay/              # Filtros de color (sepia, oscuro)
    │   ├── rain/                 # Lluvia
    │   ├── smoke/                # Humo/niebla
    │   ├── swallows/             # Golondrinas (video chromakey)
    │   ├── time-pulse/           # Pulso temporal
    │   ├── transition/           # Transiciones entre páginas
    │   └── twilight/             # Crepúsculo + luciérnagas
    │
    ├── library/                  # Vista biblioteca (Netflix-like)
    │   └── view.js               # switchToLibraryView, switchToReaderView, openBook
    │
    ├── reader/                   # Motor de lectura
    │   ├── audio.js              # Sistema de audio: play, ghost echo, karaoke
    │   ├── highlights.js         # Resaltados de texto + panel de citas
    │   ├── navigation.js         # Navegación: goToPage, goBack, goForward, scrubber
    │   ├── render.js             # Renderizado de páginas: HTML, images, choices, video
    │   └── story.js              # Carga de historias desde JSON
    │
    ├── ui/                       # Componentes de interfaz
    │   ├── ChatModule.js         # Chat con IA (Gemini) — panel flotante
    │   ├── GeminiLiveClient.js   # WebSocket para voz en vivo (AudioWorklet + fallback)
    │   └── index.js              # Temas, font-size, fullscreen, settings
    │
    ├── utils/                    # Utilidades
    │   ├── storage.js            # LocalStorage: guardar/cargar progreso, temas (try/catch safe)
    │   └── sanitize.js           # Sanitizador HTML anti-XSS para contenido de historias
    │
    └── styles/                   # Sistema de estilos CSS
        ├── index.css             # Barrel file: importa todos los CSS
        ├── base.css              # Reset, variables CSS, tipografía base
        ├── animations.css        # Keyframes y transiciones
        ├── chat.css              # Chat IA: estilos dedicados (mobile-first, safe-area)
        ├── layout.css            # Grid/flex principal
        ├── library.css           # Estilos de biblioteca y cards
        ├── reader.css            # Estilos del lector (scrollbar whisper + progress bar)
        ├── poem-experience.css   # Estilos de experiencia poética
        ├── ui.css                # Componentes UI (botones, sliders, modales)
        └── utilities.css         # Clases helper
```

---

## 🧭 Flujo de Datos Principal

```
1. Usuario abre la app → index.html → main.js → initApp()
2. initApp() carga books.json → renderiza biblioteca (hero + secciones)
3. Usuario toca un libro → openBook() → carga story JSON
4. Transición cinemática → switchToReaderView()
5. renderPage() → genera HTML + audio + efectos visuales
6. Usuario navega (swipe/tap/botones) → goToPage()
7. Se guardan progreso y resaltados en localStorage
```

---

## ⚡ Reglas Críticas para la IA

### 🚫 NO hacer nunca:
1. **NO tocar `public/stories/*.json` a menos que el usuario lo pida** — son el contenido literario
2. **NO eliminar archivos de audio/video/imagen** sin verificar si están referenciados
3. **NO instalar frameworks** (React, Vue, etc.) — este proyecto es vanilla JS puro
4. **NO usar `public/...` como ruta en código JS/CSS** — Vite sirve `public/` en la raíz (usar `/sounds/`, `/images/`, etc.)
5. **NO romper el Service Worker** — si cacheas archivos que no existen, la instalación falla silenciosamente
6. **NO usar innerHTML sin sanitizar** — todo contenido de historias pasa por `sanitizeHTML()` de `utils/sanitize.js`
7. **NO agregar imágenes en PNG/JPG** — usar WebP para portadas (ver `scripts/convert-to-webp.js`)

### ✅ SIEMPRE hacer:
1. **Verificar el build** después de cada cambio: `npx vite build`
2. **Respetar la arquitectura modular** — cada carpeta tiene un propósito claro
3. **Usar ES Modules** — `import`/`export` estándar
4. **Mantener el estado en `state.js`** — no crear variables globales sueltas
5. **Actualizar `blueprint.md`** si agregas features significativas
6. **NUNCA exponer API keys** en el frontend — las llaves van en Vercel env vars y se acceden via `/api/`
7. **Proteger localStorage** — siempre usar try/catch en JSON.parse (datos pueden corromperse en mobile)
8. **Usar `state.storyIndex`** para buscar páginas por ID — es un Map O(1), no usar `.find()` que es O(n)
9. **Imágenes en WebP** — las portadas e imágenes internas ya usan formato WebP optimizado

---

## 🔌 Cómo Agregar Cosas Nuevas

### Agregar un nuevo libro/poema:
1. Crear el JSON de historia en `public/stories/mi_libro.json`
2. Agregar la portada en `public/images/mi_libro_portada.webp` (formato WebP, max 1200px ancho)
3. Añadir la entrada en `public/data/books.json` con su ID, metadata y storyFile
4. Agregar el ID en la sección correspondiente de `public/data/library-sections.json`
5. Si tiene audio, colocar el MP3 en `public/sounds/`

### Agregar un nuevo efecto visual:
1. Crear carpeta `src/effects/mi_efecto/`
2. Crear `index.js` con la función de inicio exportada
3. Si tiene CSS, crear `styles.css` y agregar `@import` en `src/styles/index.css`
4. Registrar el efecto en `src/effects/index.js` → `handlePageEffects()`
5. Usar `"effects": "mi_efecto"` en el JSON de historia

### Agregar un nuevo componente UI:
1. Crear el archivo en `src/ui/` o `src/components/`
2. Si es un Web Component, registrar con `customElements.define()`
3. Importar en `src/main.js` o en el módulo que lo necesite

---

## 🎵 Sistema de Audio (Referencia Rápida)

| Propiedad JSON | Propósito |
|----------------|-----------|
| `"sound": "archivo.mp3"` | Audio principal de la página |
| `"audio": "archivo.mp3"` | Audio alternativo (poemas) |
| `"volume": 0.5` | Volumen base (0-1) |
| `"fadeIn": true` | Entrar suavemente |
| `"ghostEcho": true` | Activar sistema de eco fantasma (loop suave infinito) |
| `"animatedVolume": {...}` | Volumen dinámico con curvas (para La Puerta) |
| `"karaokeLines": [...]` | Sincronización texto-audio (modo karaoke) |
| `"startTime": 5` | Segundo donde empieza la reproducción |

---

## 🎭 Sistema de Efectos (Referencia Rápida)

| Valor de `"effects"` | Descripción |
|----------------------|-------------|
| `"bird"` | Pájaro azul volando (GIF) |
| `"smoke"` | Humo/niebla |
| `"rain"` o `"rain_subtle"` | Lluvia (normal o sutil) |
| `"leaves_minimal"`, `"leaves_low"`, etc. | Hojas de otoño (4 densidades) |
| `"sepia_light"`, `"sepia_medium"`, etc. | Filtro sepia con intensidades |
| `"twilight"` | Crepúsculo |
| `"fireflies"` | Luciérnagas |
| `"cracks"` | Grietas |
| `"dewdrops"` | Gotas de rocío |
| `"swallows_flight"` | Golondrina en vuelo (chromakey) |
| `"swallows_landing"` | Golondrina aterrizando (chromakey) |
| `"door_light"` | Efecto de luz de puerta abriéndose |

---

## 📋 Temas Disponibles

| Tema | Clase CSS | Color de fondo |
|------|-----------|----------------|
| Dark (default) | `theme-dark` | `#1a1a1a` |
| Sepia (Clásico) | `theme-sepia` | `#f4ecd8` |
| Light (Claro) | `theme-light` | `#ffffff` |

---

## 🐛 Problemas Conocidos

1. ~~**`GeminiLiveClient.js`** deprecado~~ → ✅ Migrado a AudioWorklet (con fallback)
2. ~~**Imágenes grandes**~~ → ✅ Convertidas a WebP (48 MB → 3.7 MB, −92%)
3. **Sin tests automatizados** — oportunidad de mejora

---

## 🔒 Seguridad

| Medida | Implementación |
|--------|----------------|
| API Key protegida | Validación de origen en `/api/live-key` y `/api/chat` |
| Rate limiting | 15 req/min por IP en `/api/chat` |
| XSS prevention | `sanitizeHTML()` en todo contenido renderizado con innerHTML |
| localStorage seguro | try/catch en todos los JSON.parse |
| beforeunload | Advertencia al cerrar con audio activo |

## 🎨 Diseño UX

| Elemento | Filosofía |
|----------|----------|
| Scrollbar | «Whisper» — invisible por defecto, aparece al scroll, desaparece 1.2s después |
| Progress bar | Línea 2px casi invisible, revela info (página, %) solo en hover |
| Chat IA | Pantalla completa en móvil (<480px), CSS propio en `chat.css` |
| Portadas | WebP optimizado, max 1200px, ~92% menos peso |

---

## 📝 Historial de Auditorías

| Fecha | Acción | Resultado |
|-------|--------|-----------|
| 2026-02-24 | Primera auditoría (referencias, SW, rutas) | 14 errores corregidos |
| 2026-02-28 | Auditoría de rendimiento (openBook, renderPage) | 5 fixes de performance |
| 2026-03-04 | **Auditoría completa** (limpieza, organización, optimización) | ~25 archivos eliminados, deps limpiadas, guía IA creada |
| 2026-03-04 | **Hardening de seguridad + PWA** | API keys protegidas, rate limiting, SW registrado, teclado, localStorage seguro |
| 2026-03-04 | **Hardening profundo + UX** | XSS sanitizer, ChromaKey WebGL, AudioWorklet, imágenes WebP (−92%), offline fallback, ícono PWA, OG/SEO tags, whisper scrollbar + progress bar |
