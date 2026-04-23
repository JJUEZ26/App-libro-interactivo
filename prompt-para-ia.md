# PROMPT PARA LA OTRA IA: INTEGRACIÓN DE SÍSIFO

**Copia y pega exactamente el siguiente texto a la otra IA en tu nuevo proyecto:**

***

Actúa como un desarrollador web experto en diseño de interfaces limpias, modernas y artículos interactivos de filosofía. 

Mi objetivo es crear una viñeta interactiva (similar a "El Eterno Retorno") sobre el Mito de Sísifo y la filosofía del Absurdismo de Albert Camus.

Tengo una carpeta llamada `dist` que acabo de traer de otro proyecto. Esta carpeta contiene un motor interactivo basado en físicas y Canvas 2D. No necesitas modificar nada dentro de la carpeta `dist`. Tu única tarea es **armar la página web HTML/CSS/JS (o componente, según corresponda)** que consuma este widget y estructure el documento de la siguiente manera:

### 1. Estructura de la página requerida (en este orden estricto):
1. **Título:** "El Mito de Sísifo" (o similar).
2. **Sinopsis/Frase inicial:** Una frase poética, reflexiva y sombría que sirva de gancho introductorio.
3. **El Juego (El Widget Interactivo):** Aquí irá incrustado el lienzo interactivo del que te hablé.
4. **Contenido Filosófico:** Después del juego, añade una explicación breve, concisa y muy bien redactada sobre el mito de Sísifo clásico y su interpretación desde la perspectiva del absurdismo (tener que empujar la roca eternamente y encontrarle un sentido al absurdo de la existencia).

### 2. Instrucciones Técnicas Críticas (Cómo montar el Juego):
La carpeta `dist` incluye un motor listo para usarse. Para renderizar el juego correctamente en la sección correspondiente, debes cumplir con esta configuración:

- Asegúrate de cargar la hoja de estilos nativa del widget: `<link rel="stylesheet" href="./dist/style.css">`.
- Carga el script global de la librería al final del "body": `<script src="./dist/sisyphus-widget.umd.cjs"></script>`.
- Crea un contenedor HTML (`<div>`) en el punto de la página donde quieres que vaya el juego. 
  - **CRÍTICO:** Este contenedor *debe* tener los estilos `position: relative;`, `overflow: hidden;` y un tamaño explícito (por ejemplo, `width: 100%; max-width: 900px; height: 600px;` y bordes redondeados). El Canvas dibujará automáticamente su contenido para encajar dentro del contenedor.
- Finalmente, inicializa la animación usando este script:
```javascript
  const container = document.getElementById('tu-id-del-contenedor'); // El div que creaste
  if (window.SisyphusWidget) {
      window.SisyphusWidget.createSisyphusGame(container);
  }
```

### 3. Estética:
La paleta de colores debe ser en tonos sombríos, elegantes, usando mucho espacio negativo (estilo minimalista o dark-mode) para que el juego —que tiene tonos azul oscuro de cielo nocturno, montaña gris oscuro y una luna cálida— resalte a la vista. 

Escribe el código completo de la página (`index.html` u otro formato si aplica) con sus estilos básicos necesarios e incluye los textos correspondientes para el contenido.
