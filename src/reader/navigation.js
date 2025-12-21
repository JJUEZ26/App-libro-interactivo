import { state } from '../app/state.js';
import { savePageHistory } from '../utils/storage.js';

let elements = null;
let renderPageRef = null;
let resetScrollPositionRef = null;
let switchToLibraryViewRef = null;

export function setNavigationDependencies({
    elements: elementsRef,
    renderPage,
    resetScrollPosition,
    switchToLibraryView
}) {
    elements = elementsRef;
    renderPageRef = renderPage;
    resetScrollPositionRef = resetScrollPosition;
    switchToLibraryViewRef = switchToLibraryView;
}

function updateUI() {
    if (!elements?.progressBar) return;
    if (!state.story || state.totalPagesInStory === 0) {
        elements.progressBar.style.width = '0%';
        return;
    }
    const uniqueVisited = new Set(state.pageHistory);
    const progress = (uniqueVisited.size / state.totalPagesInStory) * 100;
    elements.progressBar.style.width = `${progress}%`;
}

export function goToPage(pageId, isGoingBack = false) {
    if (!state.story || state.isTransitioning) return;

    if (pageId === -1) {
        if (switchToLibraryViewRef) switchToLibraryViewRef();
        return;
    }

    if (!state.story.some((page) => page.id === pageId)) return;

    state.isTransitioning = true;
    if (elements?.pageWrapper) {
        elements.pageWrapper.classList.remove('page-enter');
        elements.pageWrapper.classList.add('page-exit');
    }

    setTimeout(() => {
        if (renderPageRef) renderPageRef(pageId);
        if (resetScrollPositionRef) resetScrollPositionRef();
        state.currentStoryId = pageId;
        if (!isGoingBack && !state.pageHistory.includes(pageId)) {
            state.pageHistory.push(pageId);
        }
        savePageHistory({ currentBook: state.currentBook, pageHistory: state.pageHistory });
        if (elements?.pageWrapper) {
            elements.pageWrapper.classList.remove('page-exit');
            void elements.pageWrapper.offsetWidth;
            elements.pageWrapper.classList.add('page-enter');
        }
        setTimeout(() => {
            state.isTransitioning = false;
            updateUI();
        }, 500);
    }, 400);
}

export function goBack() {
    if (state.isTransitioning || state.pageHistory.length <= 1) return;
    state.pageHistory.pop();
    const prevId = state.pageHistory[state.pageHistory.length - 1];
    goToPage(prevId, true);
}

export function goForward() {
    if (state.isTransitioning || !state.story) return;
    const pageData = state.story.find((page) => page.id === state.currentStoryId);
    if (pageData && pageData.forceShowChoices) return;
    if (pageData && pageData.choices && pageData.choices.length === 1) {
        goToPage(pageData.choices[0].page);
    }
}

export function openNav() {
    if (!state.story) return;
    updateNavigationList();
    if (elements?.navModal) elements.navModal.classList.add('active');
}

export function closeNav() {
    if (elements?.navModal) elements.navModal.classList.remove('active');
}

export function updateNavigationList() {
    if (!elements?.historyList) return;
    elements.historyList.innerHTML = '';
    if (!state.story || !state.pageHistory.length) return;
    const milestones = state.pageHistory.filter((pageId, index) => {
        if (index === 0) return true;
        const pageData = state.story.find((page) => page.id === pageId);
        return pageData && pageData.choices && pageData.choices.length > 1;
    });
    const recentMilestones = milestones.slice().reverse();
    recentMilestones.forEach((pageId) => {
        const pageData = state.story.find((page) => page.id === pageId);
        if (!pageData) return;
        const li = document.createElement('li');
        li.className = 'history-item decision';
        const isStart = state.pageHistory.indexOf(pageId) === 0;
        const title = isStart ? 'Inicio' : 'Punto de decisión';
        let preview = '';
        if (pageData.scenes && pageData.scenes.length > 0) {
            const clean = pageData.scenes[0].replace(/<[^>]*>?/gm, '');
            preview = clean.substring(0, 60) + (clean.length > 60 ? '…' : '');
        } else if (pageData.karaokeLines && pageData.karaokeLines.length > 0) {
            preview = 'Lectura interactiva de poema...';
        }
        li.innerHTML = `<span class="history-title">${title} <span class="history-tag">Volver aquí</span></span>
                        <span class="history-preview">${preview}</span>`;
        li.addEventListener('click', () => {
            jumpToHistoryPoint(pageId);
            closeNav();
        });
        elements.historyList.appendChild(li);
    });
}

function jumpToHistoryPoint(targetId) {
    if (!state.story) return;
    if (targetId === state.currentStoryId) return;
    const idx = state.pageHistory.indexOf(targetId);
    if (idx !== -1) {
        state.pageHistory = state.pageHistory.slice(0, idx + 1);
        goToPage(targetId, true);
    }
}

export function restartStory() {
    if (!state.story || !state.currentBook) return;
    const confirmed = confirm('¿Reiniciar historia?');
    if (!confirmed) return;
    const startId = state.story[0].id;
    state.pageHistory = [startId];
    savePageHistory({ currentBook: state.currentBook, pageHistory: state.pageHistory });
    goToPage(startId, true);
    closeNav();
}
