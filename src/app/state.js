export const state = {
    appMode: 'library',
    currentBook: null,
    story: null,
    currentStoryId: -1,
    pageHistory: [],
    fontSize: 1.1,
    currentTheme: 'light',
    readerThemes: ['light', 'dark', 'sepia', 'bone'],
    libraryThemes: ['light', 'dark'],
    isTransitioning: false,
    currentAudio: null,
    currentAudioFile: null,
    currentVolume: 1,
    totalPagesInStory: 0,
    karaokeInterval: null,
    currentGoal: null,
    goalSessions: []
};

export const themeColors = {
    light: '#fdf6e3',
    sepia: '#f4ecd8',
    bone: '#f2f0e9',
    dark: '#1a1a1a'
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
