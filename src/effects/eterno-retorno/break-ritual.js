import { getEternoCycle } from './cycle-state.js';

export function mountBreakRitual(container, onBreak) {
    if (getEternoCycle() < 3) {
        return () => {};
    }

    const ritualEl = document.createElement('div');
    ritualEl.className = 'eterno-break-ritual';
    ritualEl.innerHTML = `
        <div class="eterno-break-label">Romper el ciclo</div>
        <div class="eterno-break-ring">
            <div class="eterno-break-progress"></div>
        </div>
    `;
    container.appendChild(ritualEl);

    const progressEl = ritualEl.querySelector('.eterno-break-progress');
    let holding = false;
    let startTime = 0;
    let reqId = null;
    let audioCtx = null;
    let oscillator = null;
    let gainNode = null;
    let broken = false;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function startAudio() {
        if (!audioCtx) return;
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(110, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 3);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 1);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
    }

    function stopAudio() {
        if (oscillator) {
            try { oscillator.stop(); } catch(e){}
            oscillator.disconnect();
            oscillator = null;
        }
        if (gainNode) {
            gainNode.disconnect();
            gainNode = null;
        }
    }

    function cancel() {
        if (broken) return;
        holding = false;
        if (reqId) cancelAnimationFrame(reqId);
        if (progressEl) progressEl.style.width = '0%';
        if (ritualEl) ritualEl.style.transform = 'translateX(-50%) scale(1)';
        stopAudio();
    }

    function update(time) {
        if (!holding || broken) return;
        
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / 3000, 1);
        if (progressEl) progressEl.style.width = `${progress * 80}%`;
        
        // Efecto de vibración
        if (progress > 0.5 && ritualEl) {
            const shake = (Math.random() - 0.5) * progress * 4;
            ritualEl.style.transform = `translateX(calc(-50% + ${shake}px)) scale(${1 + progress * 0.1})`;
        } else if (ritualEl) {
            ritualEl.style.transform = `translateX(-50%) scale(${1 + progress * 0.1})`;
        }

        if (progress >= 1) {
            broken = true;
            stopAudio();
            
            // White flash
            const flash = document.createElement('div');
            flash.style.cssText = 'position:fixed;inset:0;background:white;z-index:9999;opacity:1;transition:opacity 1s ease;';
            document.body.appendChild(flash);
            
            if (ritualEl) ritualEl.style.opacity = '0';
            
            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => {
                    flash.remove();
                    onBreak();
                }, 1000);
            }, 100);
            return;
        }

        reqId = requestAnimationFrame(update);
    }

    function onPointerDown(e) {
        if (broken) return;
        // Solo click izquierdo o touch
        if (e.type === 'mousedown' && e.button !== 0) return;
        
        initAudio();
        holding = true;
        startTime = performance.now();
        startAudio();
        reqId = requestAnimationFrame(update);
    }

    ritualEl.addEventListener('mousedown', onPointerDown);
    ritualEl.addEventListener('touchstart', (e) => {
        onPointerDown(e);
    }, { passive: true });

    window.addEventListener('mouseup', cancel);
    window.addEventListener('touchend', cancel);
    window.addEventListener('touchcancel', cancel);

    return () => {
        cancel();
        window.removeEventListener('mouseup', cancel);
        window.removeEventListener('touchend', cancel);
        window.removeEventListener('touchcancel', cancel);
        if (ritualEl && ritualEl.parentNode) {
            ritualEl.remove();
        }
        if (audioCtx && audioCtx.state !== 'closed') {
            audioCtx.close().catch(()=>{});
        }
    };
}
