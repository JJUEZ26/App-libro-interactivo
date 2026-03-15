# Plan de Arquitectura Escalable: Citas 2.0 & Ecosistema de Compartición Social

Este documento es una guía estructural extensa diseñada para organizar múltiples horas de trabajo ininterrumpido. Abarca tanto el recambio tecnológico del sistema de resaltados en memoria (Citas 2.0) como el nuevo motor escalable para la compartición social de obras, poemas y viñetas (Frontend V2 y Backend SSR para Open Graph).

---

## BLOQUE 1: Arquitectura y Cimientos de Compartición (Social Ecosytem)

### 1.1. El Problema de las SPA en Redes Sociales (Meta Tags)
Actualmente, "Lecturas Interactivas" funciona como una Single Page Application (SPA). Si compartimos una URL en WhatsApp, Twitter/X o Facebook con un hash (ej. `mi-app.com/#book=ilich`), los parsers de esas redes ven el `index.html` estático vacío, omitiendo la portada del libro leído, el título de la viñeta interactiva, etc.

### 1.2. La Solución Backend Vercel Serverless (La "Puerta Falsa")
Generar la "Previsualización Óptima".
En lugar de forzar Next.js o un framework monstruoso, **crearemos rutas en Vercel Serverless que actuarán como proxies de renderizado (Edge/Serverless)**.

- **Endpoint:** `/api/share.js` (o usando redirecciones en `vercel.json` como `/share/:id`).
- **Lógica del SSR Ligero:** 
  1. El usuario comparte un libro desde la biblioteca (ej. El Mito de Sísifo).
  2. El enlace generado es HTTPS: `https://[dominio]/share/sisifo`.
  3. WhatsApp entra a ese enlace. Vercel lee `sisifo`, busca en `books.json` (o un diccionario embebido en el código de la función Serverless por máxima velocidad) los datos.
  4. La función Serverless devuelve un String HTML simple y puro: 
     `<meta property="og:title" content="Lee El Mito de Sísifo en la Biblioteca Interactiva">`
     `<meta property="og:image" content="URL completa del cover.webp">`.
  5. En el `<body>` incluirá un script para que un humano real en un navegador normal sea redirigido instantáneamente al estado de la aplicación real: `<script>window.location.replace('/?book=sisifo');</script>`.

### 1.3. La Interfaz Frontend (Web Share API Unificado)
- Modulo: `src/utils/shareUtils.js`. 
- Se invocará cuando el usuario:
  - Comparte el libro completo desde la vista de Netflix ("Compartir Obra").
  - Comparte una cita seleccionada.
- **Flujo UI**: Utiliza siempre `navigator.share()` nativo de los smartphones. Si está en Desktop sin soporte, recurre al copiado por `navigator.clipboard` lanzando un *Toast* ("¡Enlace copiado!").

---

## BLOQUE 2: Citas 2.0 (Motor CSS Custom Highlights)

### 2.1. El Problema del Engine Actual
El método de usar `document.createTreeWalker()` para romper los nodos de texto e insertar etiquetas `<span>` es sumamente destructivo en un entorno de "Rascacielos". 
- Degrada la performance web en textos largos de 300 páginas.
- Destroza la API del Modo Karaoke que espera bloques continuos intactos de texto para el TTS/Sincronización de audio.

### 2.2. La Solución Escolar: CSS Custom Highlight API
La evolución natural. La API crea resaltados visuales de bajo nivel gráfico, sin inmutar el Virtual DOM. Rendimiento nativo total.

- **Flujo de Guardado (Cita Nueva):**
  1. El usuario selecciona texto y se detecta en el objeto `window.getSelection()`.
  2. Al pulsar Guardar en el Tooltip, se extrae el Rango de selección (`getRangeAt(0)`).
  3. Se calculan sus coordenadas de offset absolutas para la página actual almacenada en `state.storyIndex.get("id-pag")`.
  4. Se crea un objeto serializable persistido en `localStorage`.
  5. Inmediatamente, se añade el objeto nativo a `CSS.highlights`. Se instanciará una clase propia para cada color: `CSS.highlights.set('color-mint', new Highlight(r1, r2, ...));`.
  
- **Flujo de Rehidratación:** Cuando el usuario carga la plataforma (refresh o cambio de libro), el archivo `highlights.js` lee la base de datos de localstorage, reconstituye los objetos `Range` usando los desplazamientos exactos del texto, y los empuja de vuelta a `CSS.highlights.set()`.

---

## BLOQUE 3: Citas 2.0 (UI & UX Premium)

### 3.1. Tooltip Interactivo Flotante (Glassmorphism)
Desaparece el panel burdo. Nace un solo elemento DOM maestro `#highlight-tooltip-wrapper`, insertado directamente sobre `<body>` para evitar superposiciones raras (`overflow`, `z-index` de viñetas gráficas 3D/juegos iframe).
- **Activación:** Suscrito a eventos `selectionchange` en móvil y `mouseup` en desktop.
- **Renderizado Dinámico:** Captura las coordenadas exactas de la selección vía `range.getBoundingClientRect()` e inyecta el menú flotante justo por encima (cuidando que el elemento no traspase el límite superior de la ventana - safe area).
- **Botones Dinámicos:** Selector de paleta de colores (Sol / Menta / Cielo). Si toca un texto ya seleccionado, la interfaz permuta para mostrar un icono prominente de "Compartir" y un "Basurero" rojo.

### 3.2. Quote Cards (Panel Lateral Social)
Sucesión de tarjetas pulidas en `.highlight-panel`.
- Un contendor `<article class="quote-card">` con `backdrop-filter` por cada cita guardada.
- Tipografía del texto citado con gran espacio (padding) y uso formal de *serif* para simular editorial print.
- **Acciones incrustadas en el pie del card:** Las famosas "Action Bar". Botoneras elegantes `flex` distribuidas que permitan "Ir al origen", "Compartir en Redes" y "Eliminar".

---

## 📅 Roadmap a Nivel de Bloques Tareas (Tasking)
Este framework da la libertad a la IA para codear sin descanso:
1. **Fase Preparatoria**: Reemplazar lógica de localStorage y remover fragmentación del DOM (TreeWalker).
2. **Fase Motor CSS**: Escribir la algoritmia de CSS Custom Highlights en `highlights.js`.
3. **Fase Interfaz Hover**: Construir el tooltip Glassmorphism de la cita (lógica y CSS).
4. **Fase Interfaz Cards**: Construir Quote Cards en el Panel.
5. **Fase Ecosistema Backend**: Setup del endpoint Serverless de Vercel/SSR (`api/share.js`).
6. **Fase Ecosistema Frontend**: Botoneras `navigator.share()` conectadas a todas partes.
