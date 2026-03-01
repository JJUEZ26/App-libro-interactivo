# 🔍 Auditoría de Rendimiento — Congelamiento al Abrir Libro/Poema

## Fecha: 2026-02-28

---

## 🚨 PROBLEMA REPORTADO
Al abrir un poema o libro, la app se congela/lag momentáneamente. 
El problema está correlacionado con la imagen de portada (feature reciente).

---

## 🔬 CAUSAS IDENTIFICADAS (ordenadas por severidad)

### 🔴 CRÍTICO 1: Transición cinemática bloquea el hilo principal
**Archivo:** `src/library/view.js` → `openBook()`

**Problema:** La función `openBook()` realiza TODO de forma síncrona en el hilo principal:
1. Crea overlay del DOM
2. Fuerza reflow con `overlay.offsetHeight` (línea 119)  
3. Clona la imagen de portada y calcula posiciones
4. Carga la historia (fetch JSON)
5. Cambia a vista de lector
6. Renderiza la primera página (con posibles videos/efectos)
7. Espera paint con doble `requestAnimationFrame`
8. Inicia animaciones de fade-out

**El `await nextPaint()` (línea 204) + la carga de story + renderizado de página 
ocurre todo ANTES de liberar el hilo, causando el congelamiento visual.**

### 🔴 CRÍTICO 2: `renderPage()` es extremadamente pesado y síncrono
**Archivo:** `src/reader/render.js` → `renderPage()`

**Problema:** Se ejecutan TODAS estas operaciones secuencialmente sin ceder al browser:
1. `preloadPageAudio()` — precarga audio de página actual + siguiente + choices
2. Construcción de HTML via string concatenation  
3. Creación de elementos DOM para choices
4. `playPageSound()` — inicia reproducción de audio
5. `handlePageEffects()` — limpia TODOS efectos existentes + crea nuevos
6. `preloadNextImages()` — crea objetos Image para precargar
7. `applyHighlightsForPage()` — recorre TreeWalker por todo el texto
8. `initAmbientVideo()` — configura video de fondo

**Todo esto ocurre en un solo frame, sin `requestAnimationFrame` ni `setTimeout`.**

### 🟡 ALTO 3: `handlePageEffects()` tiene limpieza costosa
**Archivo:** `src/effects/index.js` → `clearExistingEffects()` + `handlePageEffects()`

**Problema:**  
- `clearExistingEffects()` hace 3 `querySelectorAll()` con selectores largos
- Cada uno itera sobre los resultados para remover del DOM
- Luego inmediatamente crea nuevos efectos (spawn particles, etc.)
- Todo ocurre en el mismo frame que `renderPage()`

### 🟡 ALTO 4: `applyHighlightsForPage()` recorre todo el DOM
**Archivo:** `src/reader/highlights.js`

**Problema:**
- Usa `TreeWalker` para recorrer TODOS los nodos de texto
- Para cada highlight guardado, hace un recorrido completo
- Modifica el DOM (split text nodes + wrap in spans) durante el render inicial
- Esto causa reflows en cadena

### 🟡 ALTO 5: Imagen de portada clonada sin optimizar
**Archivo:** `src/library/view.js` → `openBook()`

**Problema:**
- Clona `coverImgEl.src` (imagen original, posiblemente varios MB)
- Posiciona con `position: fixed` → fuerza compositing layer
- `will-change: transform, opacity` + `transition: all 0.45s` → GPU compositing pesado
- Si la imagen no estaba en caché del navegador, puede causar un re-decode

### 🟠 MEDIO 6: `backdrop-filter: blur(20px)` en overlay
**Archivo:** `src/styles/library.css` → `.book-open-overlay.active`

**Problema:**
- `backdrop-filter: blur(20px)` es EXTREMADAMENTE costoso en rendimiento
- Se aplica sobre TODA la pantalla (inset: 0)
- En dispositivos móviles o GPU débiles, esto solo causa frames dropped
- Se combina con la animación de la imagen clonada

### 🟠 MEDIO 7: La transición `goToPage()` tiene delays innecesarios
**Archivo:** `src/reader/navigation.js` → `goToPage()`

**Problema:**
- 400ms de delay para `page-exit` animation
- Luego fuerza reflow con `void elements.pageWrapper.offsetWidth`
- Luego 500ms más para `page-enter` 
- Total: 900ms de bloqueo donde `isTransitioning = true`

### 🟢 BAJO 8: ChromaKeyVideo hace `getImageData` por frame
**Archivo:** `src/components/chroma-video.js`

**Problema:**
- `getImageData()` + loop pixel-by-pixel + `putImageData()` cada frame
- Si se activa en la primera página, contribuye al lag inicial
- `willReadFrequently: true` ayuda pero sigue siendo costoso

---

## ✅ FIXES IMPLEMENTADOS

### Fix 1: Diferir operaciones pesadas en renderPage()
Se envuelven las operaciones no-críticas en `requestAnimationFrame` + `setTimeout` 
para que el browser pueda pintar el contenido primero, y los efectos/audio carguen después.

### Fix 2: Reducir backdrop-filter en la transición
Se reduce el blur de 20px a 8px y se usa `will-change: backdrop-filter` para 
preparar la GPU.

### Fix 3: Usar `requestIdleCallback` para highlights
Los highlights se aplican de forma diferida cuando el browser está idle,
en vez de bloquear el render inicial.

### Fix 4: Optimizar la limpieza de efectos
Se usa un solo `querySelectorAll` con selector combinado y se batch-remove.

### Fix 5: Precargar la imagen del clone
Se asegura que la imagen esté en memoria antes de clonar.
