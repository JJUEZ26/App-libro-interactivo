export function startFacadeEffect() {
    const container = document.getElementById('app-container') || document.body;

    let bgOverlay = document.getElementById('facade-dirty-bg');
    if (bgOverlay) return () => {};

    // 1. The dirty reality background (bottom layer, z-index 1)
    bgOverlay = document.createElement('div');
    bgOverlay.id = 'facade-dirty-bg';
    bgOverlay.style.position = 'fixed';
    bgOverlay.style.top = '0';
    bgOverlay.style.left = '0';
    bgOverlay.style.width = '100vw';
    bgOverlay.style.height = '100vh';
    bgOverlay.style.zIndex = '1';
    bgOverlay.style.pointerEvents = 'none';
    bgOverlay.style.backgroundImage = "url('/images/antes_dirty.png')";
    bgOverlay.style.backgroundSize = 'cover';
    bgOverlay.style.backgroundPosition = 'center';
    
    // Slight dark tint to ensure text readability
    const darkTint = document.createElement('div');
    darkTint.style.position = 'absolute';
    darkTint.style.top = '0';
    darkTint.style.left = '0';
    darkTint.style.width = '100%';
    darkTint.style.height = '100%';
    darkTint.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
    bgOverlay.appendChild(darkTint);
    
    container.appendChild(bgOverlay);

    // 2. The clean canvas (middle layer, z-index 2)
    const canvasOverlay = document.createElement('div');
    canvasOverlay.id = 'facade-canvas-overlay';
    canvasOverlay.style.position = 'fixed';
    canvasOverlay.style.top = '0';
    canvasOverlay.style.left = '0';
    canvasOverlay.style.width = '100vw';
    canvasOverlay.style.height = '100vh';
    canvasOverlay.style.zIndex = '2';
    canvasOverlay.style.pointerEvents = 'auto'; // Captures the scratch events

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.cursor = 'crosshair';

    canvasOverlay.appendChild(canvas);
    container.appendChild(canvasOverlay);

    // 3. Make the reader transparent so we can see the layers and scratch through it
    const readerView = document.getElementById('reader-view');
    const pageWrapper = document.getElementById('page-wrapper');
    
    // Store original styles to restore them later
    const originalStyles = {
        readerView: {
            position: readerView ? readerView.style.position : '',
            zIndex: readerView ? readerView.style.zIndex : '',
            backgroundColor: readerView ? readerView.style.backgroundColor : '',
            pointerEvents: readerView ? readerView.style.pointerEvents : ''
        },
        pageWrapper: {
            backgroundColor: pageWrapper ? pageWrapper.style.backgroundColor : '',
            boxShadow: pageWrapper ? pageWrapper.style.boxShadow : '',
            border: pageWrapper ? pageWrapper.style.border : '',
            pointerEvents: pageWrapper ? pageWrapper.style.pointerEvents : ''
        }
    };
    
    if (readerView) {
        readerView.style.position = 'relative';
        readerView.style.zIndex = '10'; // Above canvasOverlay (2)
        readerView.style.backgroundColor = 'transparent';
        readerView.style.pointerEvents = 'none'; // Let events fall through to canvas
    }
    
    if (pageWrapper) {
        pageWrapper.style.backgroundColor = 'transparent';
        pageWrapper.style.boxShadow = 'none';
        pageWrapper.style.border = 'none';
        pageWrapper.style.pointerEvents = 'none'; 
        
        // Re-enable pointer events for the buttons so the user can continue
        const choices = pageWrapper.querySelectorAll('.choices button');
        choices.forEach(btn => {
            btn.style.pointerEvents = 'auto';
            // Give buttons a solid background so they stand out against the imagery
            btn.style.backgroundColor = 'rgba(25, 25, 30, 0.9)';
            btn.style.color = '#fff';
            btn.style.borderColor = 'rgba(255,255,255,0.2)';
            btn.style.position = 'relative'; // Ensure z-index context
            btn.style.zIndex = '20';
        });
    }

    // 4. Hide the top header to maximize immersion
    const appHeader = document.getElementById('app-header');
    if (appHeader) {
        appHeader.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        appHeader.style.transform = 'translateY(-100%)';
        appHeader.style.opacity = '0';
        appHeader.style.pointerEvents = 'none';
    }

    // Canvas Logic
    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    // Load the clean image onto the canvas
    const cleanImg = new Image();
    cleanImg.src = '/images/antes_clean.png';
    cleanImg.onload = () => {
        resizeCanvas();
        drawCleanImage();
    };

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function drawCleanImage() {
        const imgRatio = cleanImg.width / cleanImg.height;
        const canvasRatio = canvas.width / canvas.height;
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

        if (canvasRatio > imgRatio) {
            drawWidth = canvas.width;
            drawHeight = canvas.width / imgRatio;
            offsetY = 0; // Align to top to keep pillows in view!
        } else {
            drawWidth = canvas.height * imgRatio;
            drawHeight = canvas.height;
            offsetX = (canvas.width - drawWidth) / 2;
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(cleanImg, offsetX, offsetY, drawWidth, drawHeight);
        
        // Add a slight dark tint over the clean image so white text reads well
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function scratch(x, y) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        
        const radius = 60 + Math.random() * 15; 
        const radGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        radGrad.addColorStop(0, 'rgba(0,0,0,1)');
        radGrad.addColorStop(0.6, 'rgba(0,0,0,0.8)');
        radGrad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = radGrad;
        ctx.arc(x, y, radius, 0, Math.PI * 2, false);
        ctx.fill();
    }

    function getPointerPos(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    let lastY = 0;

    function handleStart(e) {
        isDrawing = true;
        const pos = getPointerPos(e);
        lastY = pos.y;
        scratch(pos.x, pos.y);
    }

    function handleMove(e) {
        if (!isDrawing) return;
        if (e.cancelable) e.preventDefault(); 
        const pos = getPointerPos(e);
        
        // Programmatic scroll: allows the user to scroll the text by dragging the canvas
        const pageContent = document.querySelector('.page-content');
        if (pageContent) {
            const dy = pos.y - lastY;
            pageContent.scrollTop -= dy;
        }
        lastY = pos.y;

        scratch(pos.x, pos.y);
    }

    function handleEnd() {
        isDrawing = false;
    }

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);

    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);
    canvas.addEventListener('touchcancel', handleEnd);

    window.addEventListener('resize', () => {
        resizeCanvas();
        drawCleanImage();
    });

    return () => {
        const bgEl = document.getElementById('facade-dirty-bg');
        if (bgEl) bgEl.remove();
        const canvasEl = document.getElementById('facade-canvas-overlay');
        if (canvasEl) canvasEl.remove();
        
        // Restore reader styles
        if (readerView) {
            readerView.style.position = originalStyles.readerView.position;
            readerView.style.zIndex = originalStyles.readerView.zIndex;
            readerView.style.backgroundColor = originalStyles.readerView.backgroundColor;
            readerView.style.pointerEvents = originalStyles.readerView.pointerEvents;
        }
        if (pageWrapper) {
            pageWrapper.style.backgroundColor = originalStyles.pageWrapper.backgroundColor;
            pageWrapper.style.boxShadow = originalStyles.pageWrapper.boxShadow;
            pageWrapper.style.border = originalStyles.pageWrapper.border;
            pageWrapper.style.pointerEvents = originalStyles.pageWrapper.pointerEvents;
            const choices = pageWrapper.querySelectorAll('.choices button');
            choices.forEach(btn => {
                btn.style.pointerEvents = '';
                btn.style.backgroundColor = '';
                btn.style.color = '';
                btn.style.borderColor = '';
                btn.style.position = '';
                btn.style.zIndex = '';
            });
        }
        
        if (appHeader) {
            appHeader.style.transform = '';
            appHeader.style.opacity = '';
            appHeader.style.pointerEvents = '';
        }
    };
}
