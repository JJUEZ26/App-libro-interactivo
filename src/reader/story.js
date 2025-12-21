import { state } from '../app/state.js';

export async function loadStory(storyFilePath) {
    try {
        const response = await fetch(storyFilePath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        state.story = await response.json();
        state.totalPagesInStory = state.story.length;
    } catch (error) {
        console.error('Error al cargar historia:', error);
        alert('No se pudo cargar la historia. Verifica la consola para más detalles.');
        state.story = null;
    }
}
