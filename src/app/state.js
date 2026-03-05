export const state = {
    appMode: 'library',
    currentBook: null,
    story: null,
    storyIndex: null,  // Map<pageId, pageData> — índice O(1)
    currentStoryId: -1,
    pageHistory: [],
    fontSize: 1.1,
    currentTheme: 'dark',
    // Orden: Negro (default) → Sepia (rosado clásico) → Claro (blanco limpio)
    readerThemes: ['dark', 'sepia', 'light'],
    libraryThemes: ['dark'],
    isTransitioning: false,
    currentAudio: null,
    currentAudioFile: null,
    currentVolume: 1,
    totalPagesInStory: 0,
    karaokeInterval: null
};

export const themeColors = {
    dark: '#1a1a1a',
    sepia: '#f4ecd8',
    light: '#ffffff'
};

export const themeLabels = {
    dark: 'Oscuro',
    sepia: 'Clásico',
    light: 'Claro'
};

export const setFontSize = (value) => {
    state.fontSize = value;
};

export const setCurrentTheme = (value) => {
    state.currentTheme = value;
};

export const setCurrentVolume = (value) => {
    state.currentVolume = value;
};

export const getAppMode = () => state.appMode;
