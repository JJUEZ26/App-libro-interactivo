/**
 * Utility to manage the Screen Wake Lock API.
 * Prevents the device screen from turning off while reading or listening to karaoke.
 */

let wakeLock = null;

/**
 * Requests a screen wake lock.
 * If the page is hidden, it will automatically try to re-acquire the lock when it becomes visible again.
 */
export async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock released.');
            });
            console.log('Wake Lock acquired successfully.');
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    } else {
        console.warn('Wake Lock API not supported by this browser.');
    }
}

/**
 * Releases the active screen wake lock.
 */
export function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release()
            .then(() => {
                wakeLock = null;
            });
    }
}

// Re-acquire the wake lock if the document becomes visible again
// and we are supposed to hold it (for example, if audio was playing).
// This requires coordination, but basic re-acquisition can be done
// if the wake lock was released due to visibility change.
document.addEventListener('visibilitychange', async () => {
    // If the wakeLock object exists but was released (or we just want to re-request)
    // we should rely on the audio.js logic to call requestWakeLock() again if still playing.
    // So we don't automatically re-acquire here without knowing the state, 
    // it's better handled by the audio playing state, but we can re-acquire if we had one.
    if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
    }
});
