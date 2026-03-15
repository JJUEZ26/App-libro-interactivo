import { state } from '../app/state.js';
import { loadHighlights, saveHighlights } from '../utils/storage.js';
import { ShareManager } from '../utils/shareUtils.js';

// The colors mapping to CSS custom highlight rules (::highlight(color-sun))
const highlightColors = [
    { id: 'sun', label: 'Amarillo suave', className: 'color-sun' },
    { id: 'mint', label: 'Menta', className: 'color-mint' },
    { id: 'sky', label: 'Celeste', className: 'color-sky' }
];

let elements = null;
let goToPageRef = null;
let activeRange = null;

// This will substitute the native popups
let tooltipFlotante = null;
let tooltipIsVisible = false;
let selectionTimeoutId = null;

// Global memory for CSS Custom Highlights API
const activeHighlightRanges = {
    sun: new Set(),
    mint: new Set(),
    sky: new Set()
};

export function initHighlights({ elements: elementsRef, goToPage }) {
    elements = elementsRef;
    goToPageRef = goToPage;

    if (!elements?.pageWrapper) return;

    // Feature Check
    if (!CSS.highlights) {
        console.warn('CSS Custom Highlight API no está soportada. Las citas avanzadas requieren Chrome 105+ o Safari 17+.');
    } else {
        // Initialize highlight registers Map
        CSS.highlights.set('color-sun', new Highlight());
        CSS.highlights.set('color-mint', new Highlight());
        CSS.highlights.set('color-sky', new Highlight());
    }

    createTooltipDOM();
    bindSelectionHandlers();
    bindHighlightInteractions();
    bindPanelActions();
}

/**
 * Creates the global premium tooltip injected in body
 */
function createTooltipDOM() {
    tooltipFlotante = document.createElement('div');
    tooltipFlotante.id = 'highlight-tooltip-wrapper';
    tooltipFlotante.style.position = 'absolute';
    tooltipFlotante.style.zIndex = '999999';
    tooltipFlotante.style.pointerEvents = 'none';
    tooltipFlotante.style.opacity = '0';
    tooltipFlotante.style.transition = 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
    tooltipFlotante.style.transform = 'translateY(10px) translateX(-50%)';
    
    // Internal HTML for Color selection and Tooltip Actions
    tooltipFlotante.innerHTML = `
        <div class="highlight-tooltip-glass">
            <div class="highlight-tooltip-actions create-mode">
                ${highlightColors.map(c => `
                    <button class="ht-color-btn ${c.className}" data-color="${c.id}" aria-label="${c.label}"></button>
                `).join('')}
            </div>
            <div class="highlight-tooltip-actions edit-mode" style="display:none;">
                <button class="ht-action-btn share-btn" aria-label="Compartir">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                </button>
                <div class="ht-separator"></div>
                <button class="ht-action-btn delete-btn" aria-label="Eliminar ODA">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(tooltipFlotante);

    // Event bind: Create new highlight 
    tooltipFlotante.querySelectorAll('.ht-color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const colorId = btn.dataset.color;
            if (activeRange && state.currentBook) {
                createHighlightFromSelection(activeRange, colorId);
                clearSelection();
                hideTooltip();
            }
        });
    });

    // Event bind: Edit/Delete highlight
    tooltipFlotante.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (tooltipFlotante.dataset.highlightId) {
            removeHighlight(tooltipFlotante.dataset.highlightId);
            hideTooltip();
        }
    });

    tooltipFlotante.querySelector('.share-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (tooltipFlotante.dataset.highlightId && tooltipFlotante.dataset.highlightText) {
            ShareManager.shareQuote(tooltipFlotante.dataset.highlightText, state.currentBook.title, state.currentBook.id);
            hideTooltip();
        }
    });
}

/**
 * Mapea highlights guardados y los recrea visualmente al entrar a una pagina.
 */
export function applyHighlightsForPage(pageId) {
    if (!CSS.highlights || !elements?.pageWrapper || !state.currentBook) return;
    hideTooltip();
    
    // Cleanup previous ranges 
    activeHighlightRanges.sun.clear();
    activeHighlightRanges.mint.clear();
    activeHighlightRanges.sky.clear();
    updateCSSHighlights();

    const container = elements.pageWrapper.querySelector('.content-centerer');
    if (!container) return;

    const highlights = loadHighlights(state.currentBook.id).filter((item) => item.pageId === pageId);
    
    // Sort logically
    highlights.sort((a, b) => a.startOffset - b.startOffset);

    highlights.forEach((highlight) => {
        const range = createRangeFromOffsets(container, highlight.startOffset, highlight.endOffset);
        if (range) {
            // Se le adosa el ID como propiedad custom para identificarlo en clicks
            range.highlightId = highlight.id;
            range.highlightColor = highlight.color;
            range.highlightText = highlight.text;

            if (activeHighlightRanges[highlight.color]) {
                activeHighlightRanges[highlight.color].add(range);
            }
        }
    });

    updateCSSHighlights();
}

/**
 * Renderiza los rangos directamente a la CSS API
 */
function updateCSSHighlights() {
    CSS.highlights.set('color-sun', new Highlight(...activeHighlightRanges.sun));
    CSS.highlights.set('color-mint', new Highlight(...activeHighlightRanges.mint));
    CSS.highlights.set('color-sky', new Highlight(...activeHighlightRanges.sky));
}


let ignoreSelectionUntil = 0;

function bindSelectionHandlers() {
    const container = elements.pageWrapper;
    
    // Delay selection grab to allow OS native selection routines to complete on touch
    container.addEventListener('mouseup', () => {
        clearTimeout(selectionTimeoutId);
        selectionTimeoutId = setTimeout(handleSelection, 50);
    });
    container.addEventListener('touchend', () => {
        clearTimeout(selectionTimeoutId);
        selectionTimeoutId = setTimeout(handleSelection, 100);
    });
    container.addEventListener('scroll', hideTooltip, { passive: true });

    document.addEventListener('click', (event) => {
        // Clicks outside the tooltip or highlight text should close menus
        if (event.target.closest('#highlight-tooltip-wrapper')) return;
        if (event.target.closest('.highlight-panel')) return;
        if (event.target.closest('.highlight-panel-toggle')) return;
        hideTooltip();
    });

    document.addEventListener('selectionchange', () => {
        // En móviles y desktop, la selección a veces colapsa o cambia antes/durante el click.
        // Siempre retrasamos handleSelection para permitir que el click sobre Cita lo cancele.
        clearTimeout(selectionTimeoutId);
        selectionTimeoutId = setTimeout(handleSelection, 50);
    });
}

/**
 * Handle clicks specifically over HIGHLIGHTED CSS RANGES.
 * Since CSS.highlights don't emit events directly, we have to check mouse coordinates 
 * against the Rects of our stored ranges on click.
 */
function bindHighlightInteractions() {
    elements.pageWrapper.addEventListener('click', (event) => {
        // If there's an active text selection we don't interfere
        const sel = window.getSelection();
        if (!sel.isCollapsed && sel.toString().trim().length > 0) return;

        // Check if user clicked inside ANY active highlight range rectangle
        const x = event.clientX;
        const y = event.clientY;

        let clickedRange = null;

        // Iterate all active sets directly
        for (const color of ['sun', 'mint', 'sky']) {
            for (const range of activeHighlightRanges[color]) {
                const rects = range.getClientRects();
                for (let i = 0; i < rects.length; i++) {
                    const rect = rects[i];
                    // Add a tiny tolerance for touch interactions
                    const tolerance = 5;
                    if (x >= rect.left - tolerance && x <= rect.right + tolerance && 
                        y >= rect.top - tolerance && y <= rect.bottom + tolerance) {
                        clickedRange = range;
                        break;
                    }
                }
                if (clickedRange) break;
            }
            if (clickedRange) break;
        }

        if (clickedRange) {
            event.stopPropagation();
            // Evitamos que cualquier revisión de selección purgue nuestro tooltip de edición
            clearTimeout(selectionTimeoutId);
            ignoreSelectionUntil = Date.now() + 400; // Bloqueamos selección fantasma generada por el tap
            showTooltipForEditMode(clickedRange);
        }
    });
}

function handleSelection() {
    if (Date.now() < ignoreSelectionUntil) return;
    
    if (!state.currentBook) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
        hideTooltip();
        return;
    }

    const range = selection.getRangeAt(0);
    const container = elements.pageWrapper.querySelector('.content-centerer');
    if (!container || !container.contains(range.commonAncestorContainer)) {
        hideTooltip();
        return;
    }

    if (range.toString().trim().length === 0) {
        hideTooltip();
        return;
    }

    // Abort if selection intersects UI elements
    if (range.commonAncestorContainer.parentElement?.closest('.choices, button, .audio-controls-container')) {
        hideTooltip();
        return;
    }

    activeRange = range;
    showTooltipForCreateMode(range);
}


/* ================= TOOLTIP GUI ================= */

function showTooltipForCreateMode(range) {
    if (!tooltipFlotante) return;
    
    // Switch modes
    tooltipFlotante.querySelector('.create-mode').style.display = 'flex';
    tooltipFlotante.querySelector('.edit-mode').style.display = 'none';
    
    // Clean dataset
    tooltipFlotante.removeAttribute('data-highlight-id');
    tooltipFlotante.removeAttribute('data-highlight-text');

    positionAndShowTooltip(range);
}

function showTooltipForEditMode(highlightRange) {
    if (!tooltipFlotante) return;
    
    // Switch modes
    tooltipFlotante.querySelector('.create-mode').style.display = 'none';
    tooltipFlotante.querySelector('.edit-mode').style.display = 'flex';
    
    // Adose data for actions
    tooltipFlotante.dataset.highlightId = highlightRange.highlightId;
    tooltipFlotante.dataset.highlightText = highlightRange.highlightText;

    positionAndShowTooltip(highlightRange);
}

function positionAndShowTooltip(range) {
    const rect = range.getBoundingClientRect();
    
    // Wait a frame for UI rendering if it changed mode
    requestAnimationFrame(() => {
        const offset = 15;
        const tooltipWidth = tooltipFlotante.offsetWidth || 150; // estimate if unrendered
        const tooltipHeight = tooltipFlotante.offsetHeight || 50;
        
        // Calculate Top (preferably above the text, otherwise below to stay onscreen)
        const topPreferred = (rect.top + window.scrollY) - tooltipHeight - offset;
        const topFallback = (rect.bottom + window.scrollY) + offset;
        const safeAreaTop = window.scrollY + 20; // 20px padding from absolute top
        
        let finalTop = topPreferred;
        if (topPreferred < safeAreaTop) {
            finalTop = topFallback; // Drop it below if colliding with notch or top edge
        }

        // Calculate Left (centered with text segment)
        let finalLeft = rect.left + (rect.width / 2);
        
        // Apply rendering
        tooltipFlotante.style.top = `${finalTop}px`;
        tooltipFlotante.style.left = `${finalLeft}px`;
        tooltipFlotante.style.pointerEvents = 'auto';
        tooltipFlotante.style.opacity = '1';
        tooltipFlotante.style.transform = 'translateY(0) translateX(-50%)';
        tooltipIsVisible = true;
    });
}

function hideTooltip() {
    if (tooltipFlotante && tooltipIsVisible) {
        tooltipFlotante.style.opacity = '0';
        tooltipFlotante.style.pointerEvents = 'none';
        tooltipFlotante.style.transform = 'translateY(10px) translateX(-50%)';
        tooltipIsVisible = false;
    }
}

function clearSelection() {
    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
    activeRange = null;
}


/* ================= HIGHLIGHT ENGINES ================= */

function createHighlightFromSelection(range, colorId) {
    const container = elements.pageWrapper.querySelector('.content-centerer');
    if (!container) return null;

    const selectedText = range.toString().trim();
    if (!selectedText) return null;

    // Calculamos el offset abosoluto basado en todo el texto crudo del textContent de #content-centerer
    const offsets = getAbsoluteOffsetsFromRange(container, range);
    if (!offsets) return null;

    const highlightId = generateHighlightId();
    const highlight = {
        id: highlightId,
        bookId: state.currentBook.id,
        pageId: state.currentStoryId,
        pageNumber: getPageNumber(state.currentStoryId),
        text: selectedText,
        color: colorId,
        className: `color-${colorId}`, // For backward compat rendering in sidepanel
        createdAt: new Date().toISOString(),
        startOffset: offsets.startOffset,
        endOffset: offsets.endOffset
    };

    // Push into Active Ranges directly for instant feedback
    range.highlightId = highlight.id;
    range.highlightColor = highlight.color;
    range.highlightText = highlight.text;
    activeHighlightRanges[colorId].add(range);
    updateCSSHighlights();

    // Persist
    persistHighlight(highlight);
    renderHighlightPanel(); // Re-render sidepanel
    return highlight;
}

function removeHighlight(highlightId) {
    // 1. Remove from local storage
    const highlights = loadHighlights(state.currentBook.id).filter((item) => item.id !== highlightId);
    saveHighlights(state.currentBook.id, highlights);

    // 2. Erase from Memory Set
    for (const color of ['sun', 'mint', 'sky']) {
         for (const range of activeHighlightRanges[color]) {
             if (range.highlightId === highlightId) {
                 activeHighlightRanges[color].delete(range);
                 break;
             }
         }
    }
    
    // 3. Inform browser to garbage collect
    updateCSSHighlights();
    
    // 4. Update UI panel
    renderHighlightPanel();
}


/* ================= SERIALIZATION ENGINE (Range <-> Offsets) ================= */

/**
 * Recorremos iterativamente con NodeFilter.SHOW_TEXT y contamos caracteres 
 * para establecer una huella absoluta independiente de elementos contenedores <p> o <br>
 */
function getAbsoluteOffsetsFromRange(container, range) {
    let startOffset = 0;
    let endOffset = 0;
    let currentOffset = 0;
    
    // Walk through all text nodes to find absolute positions
    const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let startFound = false;
    let endFound = false;

    while (treeWalker.nextNode()) {
        const node = treeWalker.currentNode;
        
        if (!startFound) {
            if (node === range.startContainer) {
                startOffset = currentOffset + range.startOffset;
                startFound = true;
            }
        }
        
        if (!endFound) {
            if (node === range.endContainer) {
                endOffset = currentOffset + range.endOffset;
                endFound = true;
            }
        }
        
        currentOffset += node.nodeValue.length;
        if (startFound && endFound) break;
    }
    
    return { startOffset, endOffset };
}

/**
 * Rehidratamos un obj Range desde desplazamientos absolutos.
 */
function createRangeFromOffsets(container, startAbs, endAbs) {
    const range = document.createRange();
    let currentOffset = 0;
    let startNode = null;
    let startNodeOffset = 0;
    let endNode = null;
    let endNodeOffset = 0;

    const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);

    while (treeWalker.nextNode()) {
        const node = treeWalker.currentNode;
        const nodeLength = node.nodeValue.length;

        if (!startNode && (currentOffset + nodeLength >= startAbs)) {
            startNode = node;
            startNodeOffset = startAbs - currentOffset;
        }

        if (!endNode && (currentOffset + nodeLength >= endAbs)) {
            endNode = node;
            endNodeOffset = endAbs - currentOffset;
            break;
        }

        currentOffset += nodeLength;
    }

    if (startNode && endNode) {
        try {
            range.setStart(startNode, startNodeOffset);
            range.setEnd(endNode, endNodeOffset);
            return range;
        } catch (e) {
            console.error("No se pudo reconstruir el Range: La estructura del DOM muto demasiado", e);
            return null;
        }
    }
    return null;
}

function persistHighlight(highlight) {
    const highlights = loadHighlights(state.currentBook.id);
    highlights.push(highlight);
    saveHighlights(state.currentBook.id, highlights);
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


/* ================= PANEL ACTIONS & RENDER ================= */

function bindPanelActions() {
    if (!elements?.highlightPanelToggle || !elements?.highlightPanel) return;

    elements.highlightPanelToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        hideTooltip(); // Hide floating tooltip if user touches panel
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

/**
 * Nueva versión de RenderPanel: Quote Cards Premium UI.
 * Nota: El diseño se completará en reader.css en la fase UI & UX.
 */
function renderHighlightPanel() {
    if (!elements?.highlightList || !state.currentBook) return;
    const highlights = loadHighlights(state.currentBook.id)
        .slice()
        .sort((a, b) => a.pageNumber - b.pageNumber || new Date(b.createdAt) - new Date(a.createdAt));

    elements.highlightList.innerHTML = '';

    if (!highlights.length) {
        elements.highlightList.innerHTML = `
        <div class="empty-quote-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
               <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p>Aún no has coleccionado fragmentos memorables.</p>
        </div>`;
        return;
    }

    highlights.forEach((highlight) => {
        const article = document.createElement('article');
        article.className = 'quote-card';
        
        // Strip prefix "color-" from className to match border-color logic (e.g., 'sun', 'mint')
        const colorName = highlight.color || highlight.className.replace('color-', '');

        article.innerHTML = `
            <div class="quote-card-content" style="border-left-color: var(--color-highlight-${colorName})">
                <p class="quote-text">"${escapeHtml(highlight.text)}"</p>
                <div class="quote-meta">Página ${highlight.pageNumber}</div>
            </div>
            <div class="quote-action-bar">
                <button class="quote-action-btn quote-goto-btn" aria-label="Ir a la página" title="Ir a la página">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
                <button class="quote-action-btn quote-share-btn" aria-label="Compartir" title="Compartir">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                </button>
                <button class="quote-action-btn quote-delete-btn" aria-label="Eliminar" title="Eliminar cita">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;

        // Acciones Event listeners
        article.querySelector('.quote-goto-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            elements.highlightPanel.classList.remove('open');
            elements.highlightPanelToggle.classList.remove('active');
            if (goToPageRef) goToPageRef(highlight.pageId);
        });

        const shareBtn = article.querySelector('.quote-share-btn');
        shareBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            ShareManager.shareQuote(highlight.text, state.currentBook.title, state.currentBook.id);
        });

        const deleteBtn = article.querySelector('.quote-delete-btn');
        deleteBtn.addEventListener('click', (e) => {
             e.stopPropagation();
             removeHighlight(highlight.id);
             // CSS transition trick to vanish smoothly
             article.style.opacity = '0';
             article.style.transform = 'scale(0.95)';
             setTimeout(() => renderHighlightPanel(), 300); // re-render layout post animation
        });

        elements.highlightList.appendChild(article);
    });
}
