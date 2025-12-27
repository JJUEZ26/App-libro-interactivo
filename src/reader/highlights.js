import { state } from '../app/state.js';
import { loadHighlights, saveHighlights } from '../utils/storage.js';

const highlightColors = [
    { id: 'sun', label: 'Amarillo suave', className: 'highlight-yellow' },
    { id: 'mint', label: 'Menta', className: 'highlight-green' },
    { id: 'sky', label: 'Celeste', className: 'highlight-blue' }
];

let elements = null;
let goToPageRef = null;
let activeRange = null;
let activeHighlightId = null;
let currentColor = highlightColors[0];
let pendingFocusId = null;

export function initHighlights({ elements: elementsRef, goToPage }) {
    elements = elementsRef;
    goToPageRef = goToPage;

    if (!elements?.pageWrapper) return;

    bindMenuActions();
    bindSelectionHandlers();
    bindHighlightInteractions();
    bindPanelActions();
}

export function applyHighlightsForPage(pageId) {
    if (!elements?.pageWrapper || !state.currentBook) return;
    hideAllMenus();

    const container = elements.pageWrapper.querySelector('.content-centerer');
    if (!container) return;

    const highlights = loadHighlights(state.currentBook.id).filter((item) => item.pageId === pageId);
    highlights
        .slice()
        .sort((a, b) => a.startOffset - b.startOffset)
        .forEach((highlight) => {
            applyHighlightFromOffsets(container, highlight);
        });

    if (pendingFocusId) {
        const target = container.querySelector(`[data-highlight-id="${pendingFocusId}"]`);
        if (target) {
            target.classList.add('highlight-focus');
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => target.classList.remove('highlight-focus'), 1200);
        }
        pendingFocusId = null;
    }
}

function bindMenuActions() {
    if (!elements?.highlightMenu || !elements?.highlightEditMenu) return;

    const resaltarBtn = elements.highlightMenu.querySelector('[data-action="highlight"]');
    if (resaltarBtn) {
        resaltarBtn.addEventListener('click', () => {
            if (!activeRange || !state.currentBook) return;
            const highlight = createHighlightFromSelection(activeRange, currentColor);
            if (!highlight) return;
            persistHighlight(highlight);
            clearSelection();
            hideAllMenus();
            renderHighlightPanel();
        });
    }

    elements.highlightMenu
        .querySelectorAll('[data-color-id]')
        .forEach((button) => {
            button.addEventListener('click', () => {
                const colorId = button.dataset.colorId;
                const found = highlightColors.find((color) => color.id === colorId);
                if (found) {
                    currentColor = found;
                    updateSelectedColor(elements.highlightMenu, currentColor.id);
                }
            });
        });

    elements.highlightEditMenu
        .querySelectorAll('[data-color-id]')
        .forEach((button) => {
            button.addEventListener('click', () => {
                if (!activeHighlightId || !state.currentBook) return;
                const colorId = button.dataset.colorId;
                const found = highlightColors.find((color) => color.id === colorId);
                if (!found) return;
                updateHighlightColor(activeHighlightId, found);
                updateSelectedColor(elements.highlightEditMenu, colorId);
                hideAllMenus();
            });
        });

    const deleteBtn = elements.highlightEditMenu.querySelector('[data-action="delete"]');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (!activeHighlightId || !state.currentBook) return;
            removeHighlight(activeHighlightId);
            hideAllMenus();
            renderHighlightPanel();
        });
    }
}

function bindSelectionHandlers() {
    const container = elements.pageWrapper;
    container.addEventListener('mouseup', () => setTimeout(handleSelection, 10));
    container.addEventListener('touchend', () => setTimeout(handleSelection, 10));
    container.addEventListener('scroll', hideAllMenus, { passive: true });

    document.addEventListener('click', (event) => {
        if (event.target.closest('.highlight-menu')) return;
        if (event.target.closest('.highlight-panel')) return;
        if (event.target.closest('.highlight-panel-toggle')) return;
        hideAllMenus();
    });

    document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            activeRange = null;
            hideSelectionMenu();
        }
    });
}

function bindHighlightInteractions() {
    elements.pageWrapper.addEventListener('click', (event) => {
        const highlight = event.target.closest('.text-highlight');
        if (!highlight) return;
        event.stopPropagation();
        activeHighlightId = highlight.dataset.highlightId;
        const colorId = highlight.dataset.highlightColor;
        updateSelectedColor(elements.highlightEditMenu, colorId);
        showMenu(elements.highlightEditMenu, highlight.getBoundingClientRect());
    });
}

function bindPanelActions() {
    if (!elements?.highlightPanelToggle || !elements?.highlightPanel) return;

    elements.highlightPanelToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = elements.highlightPanel.classList.toggle('open');
        elements.highlightPanelToggle.classList.toggle('active', isOpen);
        elements.highlightPanel.setAttribute('aria-hidden', String(!isOpen));
        if (isOpen) renderHighlightPanel();
    });

    const closeBtn = elements.highlightPanel.querySelector('[data-action="close"]');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            elements.highlightPanel.classList.remove('open');
            elements.highlightPanelToggle.classList.remove('active');
            elements.highlightPanel.setAttribute('aria-hidden', 'true');
        });
    }

    document.addEventListener('click', (event) => {
        if (event.target.closest('.highlight-panel') || event.target.closest('.highlight-panel-toggle')) return;
        elements.highlightPanel.classList.remove('open');
        elements.highlightPanelToggle.classList.remove('active');
        elements.highlightPanel.setAttribute('aria-hidden', 'true');
    });
}

function handleSelection() {
    if (!state.currentBook) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
        hideSelectionMenu();
        return;
    }
    const range = selection.getRangeAt(0);
    const container = elements.pageWrapper.querySelector('.content-centerer');
    if (!container || !container.contains(range.commonAncestorContainer)) {
        hideSelectionMenu();
        return;
    }
    if (range.toString().trim().length === 0) {
        hideSelectionMenu();
        return;
    }
    if (selectionIntersectsHighlight(container, range)) {
        hideSelectionMenu();
        return;
    }
    if (range.commonAncestorContainer.parentElement?.closest('.choices, button, .audio-controls-container')) {
        hideSelectionMenu();
        return;
    }
    activeRange = range;
    updateSelectedColor(elements.highlightMenu, currentColor.id);
    showMenu(elements.highlightMenu, range.getBoundingClientRect());
}

function createHighlightFromSelection(range, color) {
    const container = elements.pageWrapper.querySelector('.content-centerer');
    if (!container) return null;

    const selectedText = range.toString().trim();
    if (!selectedText) return null;

    const offsets = getOffsetsFromRange(container, range, selectedText.length);
    if (!offsets) return null;

    const highlightId = generateHighlightId();
    const highlight = {
        id: highlightId,
        bookId: state.currentBook.id,
        pageId: state.currentStoryId,
        pageNumber: getPageNumber(state.currentStoryId),
        text: selectedText,
        color: color.id,
        className: color.className,
        createdAt: new Date().toISOString(),
        startOffset: offsets.startOffset,
        endOffset: offsets.endOffset
    };

    applyHighlightFromRange(range, highlight);
    return highlight;
}

function applyHighlightFromRange(range, highlight) {
    const colorClass = highlight.className;
    const textNodes = getTextNodesInRange(range);
    if (!textNodes.length) return;

    textNodes.forEach((node) => {
        const startOffset = node === range.startContainer ? range.startOffset : 0;
        const endOffset = node === range.endContainer ? range.endOffset : node.nodeValue.length;
        wrapTextNode(node, startOffset, endOffset, highlight, colorClass);
    });
}

function applyHighlightFromOffsets(container, highlight) {
    if (!highlight || highlight.startOffset === undefined || highlight.endOffset === undefined) return;
    const textNodes = getTextNodes(container);
    let cursor = 0;

    textNodes.forEach((node) => {
        const nodeLength = node.nodeValue.length;
        const nodeStart = cursor;
        const nodeEnd = cursor + nodeLength;

        if (highlight.endOffset <= nodeStart || highlight.startOffset >= nodeEnd) {
            cursor += nodeLength;
            return;
        }

        const startOffset = Math.max(0, highlight.startOffset - nodeStart);
        const endOffset = Math.min(nodeLength, highlight.endOffset - nodeStart);

        wrapTextNode(node, startOffset, endOffset, highlight, highlight.className);
        cursor += nodeLength;
    });
}

function wrapTextNode(node, startOffset, endOffset, highlight, colorClass) {
    if (!node || startOffset === endOffset) return;
    const text = node.nodeValue;
    const before = text.slice(0, startOffset);
    const middle = text.slice(startOffset, endOffset);
    const after = text.slice(endOffset);

    const fragment = document.createDocumentFragment();
    if (before) fragment.appendChild(document.createTextNode(before));

    const span = document.createElement('span');
    span.className = `text-highlight ${colorClass}`;
    span.dataset.highlightId = highlight.id;
    span.dataset.highlightColor = highlight.color;
    span.textContent = middle;
    fragment.appendChild(span);

    if (after) fragment.appendChild(document.createTextNode(after));
    node.parentNode.replaceChild(fragment, node);
}

function getTextNodes(container) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
    });

    const nodes = [];
    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }
    return nodes;
}

function getTextNodesInRange(range) {
    const container = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentNode
        : range.commonAncestorContainer;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
    });

    const nodes = [];
    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }
    return nodes;
}

function getOffsetsFromRange(container, range, textLength) {
    const preRange = range.cloneRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    return {
        startOffset,
        endOffset: startOffset + textLength
    };
}

function persistHighlight(highlight) {
    const highlights = loadHighlights(state.currentBook.id);
    highlights.push(highlight);
    saveHighlights(state.currentBook.id, highlights);
}

function updateHighlightColor(highlightId, newColor) {
    const highlights = loadHighlights(state.currentBook.id);
    const target = highlights.find((item) => item.id === highlightId);
    if (!target) return;
    target.color = newColor.id;
    target.className = newColor.className;
    saveHighlights(state.currentBook.id, highlights);

    const spans = elements.pageWrapper.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
    spans.forEach((span) => {
        highlightColors.forEach((color) => span.classList.remove(color.className));
        span.classList.add(newColor.className);
        span.dataset.highlightColor = newColor.id;
    });
    renderHighlightPanel();
}

function removeHighlight(highlightId) {
    const highlights = loadHighlights(state.currentBook.id).filter((item) => item.id !== highlightId);
    saveHighlights(state.currentBook.id, highlights);

    const spans = elements.pageWrapper.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
    spans.forEach((span) => {
        const text = document.createTextNode(span.textContent);
        span.parentNode.replaceChild(text, span);
    });
}

function renderHighlightPanel() {
    if (!elements?.highlightList || !state.currentBook) return;
    const highlights = loadHighlights(state.currentBook.id)
        .slice()
        .sort((a, b) => a.pageNumber - b.pageNumber || new Date(b.createdAt) - new Date(a.createdAt));

    elements.highlightList.innerHTML = '';

    if (!highlights.length) {
        elements.highlightList.innerHTML = '<p class="highlight-panel-empty">Aún no hay citas guardadas.</p>';
        return;
    }

    highlights.forEach((highlight) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'highlight-panel-item';
        item.innerHTML = `
            <span class="highlight-panel-swatch ${highlight.className}"></span>
            <span class="highlight-panel-text">${escapeHtml(highlight.text)}</span>
            <span class="highlight-panel-meta">Página ${highlight.pageNumber}</span>
        `;
        item.addEventListener('click', () => {
            pendingFocusId = highlight.id;
            elements.highlightPanel.classList.remove('open');
            elements.highlightPanelToggle.classList.remove('active');
            if (goToPageRef) goToPageRef(highlight.pageId);
        });
        elements.highlightList.appendChild(item);
    });
}

function showMenu(menu, rect) {
    if (!menu || !rect) return;
    const offset = 10;
    const wrapperRect = elements.pageWrapper.getBoundingClientRect();
    const top = rect.top - wrapperRect.top - menu.offsetHeight - offset;
    const left = rect.left - wrapperRect.left + rect.width / 2 - menu.offsetWidth / 2;

    menu.style.top = `${Math.max(12, top)}px`;
    menu.style.left = `${Math.max(12, Math.min(left, wrapperRect.width - menu.offsetWidth - 12))}px`;
    menu.classList.add('active');
    menu.setAttribute('aria-hidden', 'false');
}

function hideAllMenus() {
    hideSelectionMenu();
    if (elements?.highlightEditMenu) {
        elements.highlightEditMenu.classList.remove('active');
        elements.highlightEditMenu.setAttribute('aria-hidden', 'true');
    }
}

function hideSelectionMenu() {
    if (elements?.highlightMenu) {
        elements.highlightMenu.classList.remove('active');
        elements.highlightMenu.setAttribute('aria-hidden', 'true');
    }
}

function clearSelection() {
    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
    activeRange = null;
}

function updateSelectedColor(menu, colorId) {
    if (!menu) return;
    menu.querySelectorAll('[data-color-id]').forEach((button) => {
        button.classList.toggle('active', button.dataset.colorId === colorId);
    });
}

function generateHighlightId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `highlight-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getPageNumber(pageId) {
    const index = state.story ? state.story.findIndex((page) => page.id === pageId) : -1;
    return index >= 0 ? index + 1 : 1;
}

function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function queueHighlightFocus(highlightId) {
    pendingFocusId = highlightId;
}

export function getHighlightColors() {
    return highlightColors;
}

function selectionIntersectsHighlight(container, range) {
    const highlights = container.querySelectorAll('.text-highlight');
    return Array.from(highlights).some((highlight) => range.intersectsNode(highlight));
}
