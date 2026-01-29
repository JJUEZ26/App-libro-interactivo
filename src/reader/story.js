import { state } from '../app/state.js';

export async function loadStory(storyFilePath) {
    try {
        // Normalizar ruta para Vercel: asegurar que empiece con /
        const finalPath = storyFilePath.startsWith('/') ? storyFilePath : `/${storyFilePath}`;

        console.log('Cargando historia desde:', finalPath);
        const response = await fetch(finalPath);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} cargando ${finalPath}`);
        state.story = await response.json();
        state.totalPagesInStory = state.story.length;
    } catch (error) {
        console.error('Error al cargar historia:', error);
        // Mejor manejo de error visual
        if (document.getElementById('reader-view')) {
            document.getElementById('reader-view').innerHTML = `
                <div style="padding:40px; text-align:center; color:white;">
                    <h2>Error al abrir el libro</h2>
                    <p>No se pudo encontrar el archivo de la historia en: ${storyFilePath}</p>
                    <button onclick="location.reload()" style="margin-top:20px; padding:10px 20px;">Volver a intentar</button>
                </div>
            `;
        }
        state.story = null;
    }
}
