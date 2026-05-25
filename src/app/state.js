export const state = {
    appMode: 'library',
    currentBook: null,
    // Auth state
    currentUser: null,
    isAuthenticated: false,
    authView: 'login', // 'login' | 'register' | 'forgot-password'
    story: null,
    storyIndex: null,  // Map<pageId, pageData> — índice O(1)
    currentStoryId: -1,
    pageHistory: [],
    fontSize: 1.2,
    currentTheme: 'dark',
    // Orden: Negro (default) → Sepia (rosado clásico) → Claro (blanco limpio)
    readerThemes: ['dark', 'sepia', 'light'],
    libraryThemes: ['dark'],
    isTransitioning: false,
    currentAudio: null,
    currentAudioFile: null,
    currentAudioBaseVolume: 1,
    currentAudioPageId: null,
    currentAudioPageData: null,
    currentVolume: 1,
    totalPagesInStory: 0,
    karaokeInterval: null,
    audioStatus: 'idle',
    audioStatusMessage: '',
    audioBookDecisions: {},
    audioUserActivated: false,
    audioVolumeTouched: false,
    // Datos efímeros de sesión (juegos, puntuaciones temporales)
    // No se persisten en localStorage — se limpian al cambiar de libro
    ephemeral: {}
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
