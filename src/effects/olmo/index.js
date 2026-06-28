/**
 * Escena cinemática para "Peras del olmo".
 *
 * Una única ilustración SVG permanece montada durante las tres páginas para que
 * los estados lush → withering → withered sean una transformación real y no tres
 * imágenes desconectadas. Las transiciones y el flujo continuo de hojas usan CSS,
 * sin timers ni trabajo continuo en el hilo principal.
 */

const STAGES = new Set(['lush', 'withering', 'withered']);
const MOBILE_READER_QUERY = '(max-width: 700px)';
const DEFAULT_PRESERVE_ASPECT_RATIO = 'xMidYMax meet';
const MOBILE_PRESERVE_ASPECT_RATIO = 'xMidYMid slice';
const OLMO_LAYOUT_STYLE_ID = 'olmo-layout-style';

const OLMO_LAYOUT_STYLES = `
  body.olmo-reader-active #page-wrapper {
    background: #111a20;
  }

  body.olmo-reader-active #page-wrapper .poem-title-display,
  body.olmo-reader-active #page-wrapper .poem-author-display,
  body.olmo-reader-active #page-wrapper .verse-line {
    color: rgba(244, 241, 231, .96);
    text-shadow:
      0 1px 4px rgba(4, 9, 13, .72),
      0 0 16px rgba(4, 9, 13, .42);
  }

  @media (max-width: 700px) {
    body.olmo-reader-active #page-wrapper > .page-content,
    body.olmo-reader-active #page-wrapper > .page-content .content-centerer {
      position: relative;
      z-index: 2;
    }

    body.olmo-reader-active #page-wrapper .poem-title-display,
    body.olmo-reader-active #page-wrapper .poem-author-display,
    body.olmo-reader-active #page-wrapper .poem-layout,
    body.olmo-reader-active #page-wrapper .choices {
      position: relative;
      z-index: 3;
    }
  }

  @media (max-width: 380px) {
    body.olmo-reader-active #main-title {
      font-size: 1.1rem !important;
      letter-spacing: -.02em !important;
      white-space: nowrap !important;
    }

    body.olmo-reader-active #app-version {
      display: none !important;
    }
  }

  body.olmo-reader-active.fullscreen-mode {
    overflow: hidden !important;
  }

  body.olmo-reader-active.fullscreen-mode #app-container {
    width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    min-height: 100vh !important;
    min-height: 100dvh !important;
    overflow: hidden !important;
  }

  body.olmo-reader-active.fullscreen-mode #app-footer {
    display: none !important;
  }

  body.olmo-reader-active.fullscreen-mode #app-header {
    position: fixed !important;
    inset: 0 0 auto !important;
    z-index: 10020 !important;
    display: block !important;
    width: 100% !important;
    height: 0 !important;
    min-height: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    pointer-events: none !important;
  }

  body.olmo-reader-active.fullscreen-mode #app-header .header-left,
  body.olmo-reader-active.fullscreen-mode #header-avatar-slot,
  body.olmo-reader-active.fullscreen-mode #nav-toggle {
    display: none !important;
  }

  body.olmo-reader-active.fullscreen-mode #settings-controls {
    position: fixed !important;
    top: calc(env(safe-area-inset-top) + 12px) !important;
    right: calc(env(safe-area-inset-right) + 12px) !important;
    display: block !important;
    pointer-events: none !important;
  }

  body.olmo-reader-active.fullscreen-mode #fullscreen-btn {
    display: inline-flex !important;
    width: 44px !important;
    height: 44px !important;
    border: 1px solid rgba(244, 241, 231, .2) !important;
    background: rgba(10, 17, 22, .42) !important;
    color: rgba(244, 241, 231, .82) !important;
    opacity: .72 !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    pointer-events: auto !important;
  }

  body.olmo-reader-active.fullscreen-mode #main-content,
  body.olmo-reader-active.fullscreen-mode #reader-view,
  body.olmo-reader-active.fullscreen-mode #book-container,
  body.olmo-reader-active.fullscreen-mode #book,
  body.olmo-reader-active.fullscreen-mode #page-wrapper {
    min-height: 0 !important;
  }

  body.olmo-reader-active.fullscreen-mode #main-content,
  body.olmo-reader-active.fullscreen-mode #reader-view {
    display: flex !important;
    flex: 1 1 auto !important;
    height: 100% !important;
  }

  body.olmo-reader-active.fullscreen-mode #book-container {
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding:
      env(safe-area-inset-top)
      env(safe-area-inset-right)
      env(safe-area-inset-bottom)
      env(safe-area-inset-left) !important;
  }

  body.olmo-reader-active.fullscreen-mode #book,
  body.olmo-reader-active.fullscreen-mode #page-wrapper,
  body.olmo-reader-active.fullscreen-mode .page-content {
    width: 100% !important;
    height: 100% !important;
  }

  body.olmo-reader-active.fullscreen-mode #page-wrapper {
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
`;

const EDGE_LEAVES = [
    [285, 356, -34, 1.05], [306, 324, -12, .86], [272, 292, -58, .92],
    [302, 258, -22, .82], [326, 222, -38, .92], [350, 186, -22, .88],
    [388, 151, -42, .88], [428, 126, -22, .82], [471, 104, -12, .92],
    [516, 91, 12, .9], [565, 80, -8, .86], [616, 80, 13, .92],
    [666, 88, 28, .88], [713, 104, 16, .94], [758, 124, 38, .88],
    [801, 151, 22, .9], [839, 181, 45, .94], [870, 218, 24, .86],
    [900, 258, 52, .94], [918, 301, 18, .88], [915, 345, 48, .92],
    [898, 386, 28, .86], [868, 423, 50, .9], [825, 452, 32, .94],
    [778, 470, 58, .84], [728, 485, 24, .9], [676, 492, 42, .82],
    [624, 496, 10, .9], [570, 494, -14, .88], [518, 489, -34, .92],
    [468, 477, -18, .86], [420, 460, -48, .9], [378, 438, -28, .84],
    [341, 410, -54, .92], [310, 383, -24, .86],
    [356, 278, 25, .66], [392, 216, -12, .7], [446, 168, 35, .68],
    [508, 142, -24, .68], [578, 126, 18, .66], [649, 132, -16, .7],
    [716, 151, 30, .68], [775, 184, -24, .7], [824, 231, 34, .66],
    [849, 292, -18, .7], [846, 352, 28, .68], [811, 404, -28, .7],
    [753, 435, 18, .68], [687, 452, -16, .7], [616, 459, 24, .66],
    [548, 454, -18, .7], [483, 439, 28, .68], [427, 410, -24, .7],
    [386, 365, 18, .66], [365, 320, -16, .68]
];

const FALLING_LEAVES = [
    [325, 250, -70, 7.4, .1, .95], [388, 188, 55, 8.6, .8, .75],
    [452, 142, -40, 9.1, 1.4, .85], [520, 116, 78, 8.2, .3, .7],
    [586, 102, -62, 10.2, 1.9, .9], [655, 112, 42, 7.8, 1.1, .72],
    [722, 137, -76, 9.8, 2.3, .82], [786, 172, 64, 8.8, .5, .92],
    [838, 218, -52, 7.6, 1.6, .74], [872, 276, 70, 10.4, 2.7, .88],
    [885, 338, -45, 8.4, .9, .7], [852, 392, 56, 9.6, 2.0, .9],
    [796, 430, -66, 7.9, .4, .78], [730, 454, 46, 10.1, 1.3, .86],
    [658, 462, -58, 8.7, 2.4, .72], [580, 458, 65, 9.4, .7, .92],
    [508, 447, -48, 7.7, 1.8, .76], [444, 424, 70, 10.5, 2.8, .88],
    [390, 390, -58, 8.3, .2, .7], [348, 344, 50, 9.8, 1.2, .9],
    [316, 298, -42, 8.9, 2.1, .8], [474, 246, 62, 7.5, 1.0, .68],
    [620, 210, -70, 9.2, 2.6, .82], [758, 282, 54, 8.1, 1.5, .72]
];

const FOLIAGE_CLUSTERS = [
    [238, 430, 78, 44, 14], [286, 342, 92, 60, 17], [319, 275, 100, 66, 18],
    [365, 213, 104, 66, 18], [425, 158, 98, 59, 17],
    [497, 125, 105, 56, 18], [577, 112, 104, 58, 18],
    [656, 119, 104, 59, 18], [732, 144, 103, 62, 18],
    [800, 188, 104, 66, 18], [856, 247, 98, 68, 17],
    [884, 319, 94, 65, 17], [860, 381, 94, 61, 16], [957, 420, 78, 44, 14],
    [802, 426, 98, 56, 16], [727, 452, 98, 54, 16],
    [645, 456, 102, 52, 16], [560, 455, 105, 54, 17],
    [478, 439, 101, 56, 16], [405, 409, 98, 58, 16],
    [392, 462, 82, 42, 15], [808, 462, 82, 42, 15],
    [345, 369, 94, 60, 16], [462, 324, 96, 62, 17],
    [553, 294, 105, 65, 18], [647, 296, 105, 65, 18],
    [739, 326, 100, 62, 17]
];

const edgeLeafMarkup = EDGE_LEAVES.map(([x, y, rotation, scale], index) => (
    `<use class="olmo-edge-leaf leaf-delay-${index % 6}" href="#olmo-leaf"
          transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})" />`
)).join('');

function createFoliageMarkup() {
    let seed = 19071983;
    const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };

    return FOLIAGE_CLUSTERS.flatMap(([cx, cy, rx, ry, count], clusterIndex) => {
        const renderedCount = Math.ceil(count * .9);
        return Array.from({ length: renderedCount }, (_, leafIndex) => {
            const angle = leafIndex * 2.399963 + random() * .52;
            const radius = Math.sqrt((leafIndex + .55) / renderedCount);
            const x = cx + Math.cos(angle) * rx * radius + (random() - .5) * 9;
            const y = cy + Math.sin(angle) * ry * radius + (random() - .5) * 7;
            const rotation = angle * 180 / Math.PI + (random() - .5) * 48;
            const scale = .66 + random() * .48;
            const tone = (clusterIndex + leafIndex) % 4;
            const drop = (clusterIndex * 2 + leafIndex) % 6;
            return `<use class="olmo-foliage-leaf foliage-tone-${tone} foliage-drop-${drop}"
                         href="#olmo-leaf"
                         transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rotation.toFixed(1)}) scale(${scale.toFixed(2)})" />`;
        });
    }).join('');
}

const foliageMarkup = createFoliageMarkup();

const fallingLeafMarkup = FALLING_LEAVES.map(
    ([x, y, drift, duration, delay, scale], index) => {
        const fallDuration = duration * 1.75;
        const fallOffset = -((delay + index * 1.37) % fallDuration);

        return `<use class="olmo-falling-leaf fall-tone-${index % 4}" href="#olmo-leaf"
                     transform="translate(${x} ${y}) scale(${scale})"
                     style="--drift:${drift}px;--drift-mid:${drift * .52}px;--drift-back:${drift * -.2}px;--fall-duration:${fallDuration.toFixed(1)}s;--fall-offset:${fallOffset.toFixed(1)}s" />`;
    }
).join('');

function createFallenLeafMarkup(count, seed, yStart, yDepth) {
    let state = seed;
    const random = () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };

    return Array.from({ length: count }, (_, index) => {
        const x = 205 + random() * 790;
        const y = yStart + Math.pow(random(), .72) * yDepth;
        const rotation = -75 + random() * 150;
        const scale = .62 + random() * .52;
        const leaf = index % 4 === 0 ? 'olmo-small-leaf' : 'olmo-leaf';

        return `<use class="olmo-ground-leaf ground-tone-${index % 5}"
                     href="#${leaf}"
                     transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rotation.toFixed(1)}) scale(${scale.toFixed(2)})" />`;
    }).join('');
}

const fallenLeafMarkup = createFallenLeafMarkup(76, 271828, 754, 76);
const fallenDenseMarkup = createFallenLeafMarkup(54, 314159, 770, 74);

const SVG_SCENE = `
<svg id="olmo-scene" class="olmo-scene" viewBox="0 0 1200 900"
     preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-labelledby="olmo-title olmo-description">
  <title id="olmo-title">Un olmo bajo la luna</title>
  <desc id="olmo-description">El olmo pierde lentamente sus hojas mientras el paisaje conserva una luz suave de otoño.</desc>

  <defs>
    <radialGradient id="olmo-day-sky" cx="52%" cy="43%" r="75%">
      <stop offset="0" stop-color="#d4d9df" />
      <stop offset=".62" stop-color="#aeb8c5" />
      <stop offset="1" stop-color="#7c8998" />
    </radialGradient>
    <radialGradient id="olmo-night-sky" cx="27%" cy="19%" r="92%">
      <stop offset="0" stop-color="#3a4351" />
      <stop offset=".5" stop-color="#222833" />
      <stop offset="1" stop-color="#10141b" />
    </radialGradient>
    <radialGradient id="olmo-moon-glow">
      <stop offset="0" stop-color="#f4f0db" stop-opacity=".48" />
      <stop offset=".32" stop-color="#e8e8e0" stop-opacity=".14" />
      <stop offset="1" stop-color="#e8e8e0" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="olmo-ground-paint" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#26313a" />
      <stop offset="1" stop-color="#12171d" />
    </linearGradient>
    <linearGradient id="olmo-trunk-paint" x1="0" x2="1">
      <stop offset="0" stop-color="#111820" />
      <stop offset=".46" stop-color="#263039" />
      <stop offset=".72" stop-color="#182129" />
      <stop offset="1" stop-color="#0d131a" />
    </linearGradient>

    <path id="olmo-leaf" d="M0 0 C7 -9 17 -8 22 -1 C16 7 7 10 0 0 Z" />
    <path id="olmo-small-leaf" d="M0 0 C5 -6 12 -6 16 0 C11 5 5 7 0 0 Z" />

    <filter id="olmo-soft-glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="11" />
    </filter>
  </defs>

  <style>
    .olmo-scene {
      --fall-stream-opacity: .2;
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
      opacity: .60;
      transition: opacity 5s ease;
    }

    .olmo-sky-day,
    .olmo-sky-night,
    .olmo-horizon,
    .olmo-moon,
    .olmo-moon-halo,
    .olmo-ground,
    .olmo-ground-light,
    .olmo-grass,
    .olmo-wood,
    .olmo-wood-detail,
    .olmo-crown-back,
    .olmo-crown-middle,
    .olmo-crown-front,
    .olmo-foliage,
    .olmo-edge-leaves,
    .olmo-fallen-leaves,
    .olmo-fallen-dense,
    .olmo-fall-stream {
      transition-duration: 7s;
      transition-timing-function: cubic-bezier(.37, 0, .2, 1);
      transition-property: opacity, fill, stroke, transform, filter;
    }

    .olmo-sky-day { opacity: 1; }
    .olmo-sky-night { opacity: 0; }
    .olmo-horizon { opacity: .34; transform-origin: 600px 530px; }
    .olmo-moon { fill: #eeecdc; opacity: .82; }
    .olmo-moon-halo { opacity: .68; }

    .olmo-ground { fill: url(#olmo-ground-paint); }
    .olmo-ground-light { fill: #61705e; opacity: .24; }
    .olmo-grass { fill: none; stroke: #657561; opacity: .52; }
    .olmo-wood { fill: url(#olmo-trunk-paint); stroke: #0d141a; }
    .olmo-wood-detail { fill: none; }
    .olmo-branch-detail {
      stroke: #151e25;
      opacity: .94;
    }
    .olmo-bark-detail {
      stroke: #465259;
      opacity: .38;
    }

    .olmo-crown-back {
      fill: #263b36;
      opacity: .82;
      transform-origin: 598px 318px;
      transition-delay: .4s;
    }
    .olmo-crown-middle {
      fill: #314b3b;
      opacity: .72;
      transform-origin: 600px 330px;
      transition-delay: .15s;
    }
    .olmo-crown-front {
      fill: #1c332f;
      opacity: .58;
      transform-origin: 600px 350px;
      transition-delay: 0s;
    }
    .olmo-edge-leaves {
      fill: #536b4b;
      opacity: .94;
      transform-origin: 600px 330px;
    }
    .olmo-foliage {
      opacity: 1;
      filter: none;
      transform-origin: 600px 330px;
    }
    .olmo-foliage-leaf {
      transform-box: fill-box;
      transform-origin: center;
      transition: opacity 8s cubic-bezier(.37, 0, .2, 1);
    }
    .foliage-tone-0 { fill: #203b32; }
    .foliage-tone-1 { fill: #31513d; }
    .foliage-tone-2 { fill: #496247; }
    .foliage-tone-3 { fill: #263f36; }
    .olmo-edge-leaf {
      transform-box: fill-box;
      transform-origin: center;
      transition: opacity 8s cubic-bezier(.37, 0, .2, 1);
    }

    .olmo-falling-leaf {
      fill: #9b7d43;
      stroke: #4a351f;
      stroke-width: .8;
      filter: drop-shadow(0 2px 2px rgba(20, 13, 7, .35));
      opacity: 0;
      transform-box: fill-box;
      transform-origin: center;
      animation: olmo-leaf-fall var(--fall-duration) var(--fall-offset)
                 cubic-bezier(.34, .15, .58, .92) infinite;
    }
    .fall-tone-1 { fill: #795a36; }
    .fall-tone-2 { fill: #c49342; }
    .fall-tone-3 { fill: #76513a; }
    .olmo-fallen-leaves,
    .olmo-fallen-dense {
      opacity: 0;
      filter: drop-shadow(0 2px 1px rgba(8, 9, 9, .38));
    }
    .olmo-ground-leaf {
      stroke: rgba(48, 33, 20, .82);
      stroke-width: .7;
    }
    .ground-tone-0 { fill: #b98235; }
    .ground-tone-1 { fill: #84502f; }
    .ground-tone-2 { fill: #c29a4c; }
    .ground-tone-3 { fill: #6f5936; }
    .ground-tone-4 { fill: #9a6a36; }
    .olmo-fall-stream { opacity: var(--fall-stream-opacity); }

    .foliage-drop-0 { transition-delay: .3s; }
    .foliage-drop-1 { transition-delay: 1s; }
    .foliage-drop-2 { transition-delay: 1.8s; }
    .foliage-drop-3 { transition-delay: 2.5s; }
    .foliage-drop-4 { transition-delay: 3.2s; }
    .foliage-drop-5 { transition-delay: 4s; }
    .leaf-delay-0 { transition-delay: .4s; }
    .leaf-delay-1 { transition-delay: 1.2s; }
    .leaf-delay-2 { transition-delay: 2s; }
    .leaf-delay-3 { transition-delay: 2.8s; }
    .leaf-delay-4 { transition-delay: 3.4s; }
    .leaf-delay-5 { transition-delay: 4.2s; }

    /* La frustración: el follaje se calienta y adelgaza sin apagar el paisaje. */
    .olmo-scene.olmo-withering {
      --fall-stream-opacity: .92;
      opacity: .56;
    }
    .olmo-withering .olmo-sky-day { opacity: .94; }
    .olmo-withering .olmo-sky-night { opacity: .12; }
    .olmo-withering .olmo-horizon {
      opacity: .27;
      transform: translateY(6px) scale(.99);
    }
    .olmo-withering .olmo-moon { fill: #e4dcc5; opacity: .76; }
    .olmo-withering .olmo-moon-halo { opacity: .56; }
    .olmo-withering .olmo-ground-light { fill: #756c4e; opacity: .21; }
    .olmo-withering .olmo-grass { stroke: #7d704f; opacity: .42; }
    .olmo-withering .olmo-crown-back {
      fill: #53513a;
      opacity: .58;
      transform: translateY(10px) scale(.98);
    }
    .olmo-withering .olmo-crown-middle {
      fill: #6e5f3d;
      opacity: .52;
      transform: translateY(7px) scale(.985);
    }
    .olmo-withering .olmo-crown-front {
      fill: #494535;
      opacity: .42;
      transform: translateY(4px) scale(.99);
    }
    .olmo-withering .olmo-foliage {
      opacity: .92;
      filter: sepia(.7) saturate(.9) hue-rotate(-10deg);
      transform: translateY(4px) scale(.99);
    }
    .olmo-withering .foliage-drop-0 { opacity: .2; }
    .olmo-withering .foliage-drop-1 { opacity: .34; }
    .olmo-withering .foliage-drop-2 { opacity: .48; }
    .olmo-withering .foliage-drop-3 { opacity: .62; }
    .olmo-withering .foliage-drop-4 { opacity: .72; }
    .olmo-withering .foliage-drop-5 { opacity: .82; }
    .olmo-withering .olmo-edge-leaves { fill: #a17b40; opacity: .68; }
    .olmo-withering .leaf-delay-0,
    .olmo-withering .leaf-delay-3 { opacity: .28; }
    .olmo-withering .leaf-delay-1,
    .olmo-withering .leaf-delay-4 { opacity: .46; }
    .olmo-withering .leaf-delay-2,
    .olmo-withering .leaf-delay-5 { opacity: .62; }
    .olmo-withering .olmo-fallen-leaves { opacity: .56; transition-delay: 1.2s; }
    .olmo-withering .olmo-fallen-dense { opacity: .28; transition-delay: 3s; }

    /* La aceptación: solo queda el esqueleto — ramas desnudas y hojas en el suelo. */
    .olmo-scene.olmo-withered {
      --fall-stream-opacity: .12;
      opacity: .56;
    }
    .olmo-withered .olmo-sky-day { opacity: .72; }
    .olmo-withered .olmo-sky-night { opacity: .38; }
    .olmo-withered .olmo-horizon {
      opacity: .14;
      transform: translateY(10px) scale(.98);
    }
    .olmo-withered .olmo-moon { fill: #ded9ca; opacity: .62; }
    .olmo-withered .olmo-moon-halo { opacity: .38; }
    .olmo-withered .olmo-ground { fill: #141a20; }
    .olmo-withered .olmo-ground-light { fill: #5d5744; opacity: .08; }
    .olmo-withered .olmo-grass { stroke: #625a45; opacity: .22; }
    .olmo-withered .olmo-wood { filter: saturate(.72) brightness(.92); }
    .olmo-withered .olmo-branch-detail {
      stroke: #172027;
      opacity: 1;
    }
    .olmo-withered .olmo-bark-detail {
      stroke: #4b575d;
      opacity: .44;
    }
    .olmo-withered .olmo-crown-back {
      fill: #494538;
      opacity: 0;
      transform: translateY(24px) scale(.94);
    }
    .olmo-withered .olmo-crown-middle {
      fill: #5e5038;
      opacity: 0;
      transform: translateY(18px) scale(.95);
    }
    .olmo-withered .olmo-crown-front {
      fill: #413d34;
      opacity: 0;
      transform: translateY(12px) scale(.96);
    }
    .olmo-withered .olmo-edge-leaves {
      fill: #8e7140;
      opacity: 0;
      transform: translateY(18px) scale(.95);
    }
    .olmo-withered .olmo-foliage {
      opacity: 0;
      filter: sepia(.85) saturate(.58) brightness(.92);
      transform: translateY(18px) scale(.95);
    }
    .olmo-withered .foliage-drop-0 { opacity: 0; }
    .olmo-withered .foliage-drop-1 { opacity: 0; }
    .olmo-withered .foliage-drop-2 { opacity: 0; }
    .olmo-withered .foliage-drop-3 { opacity: 0; }
    .olmo-withered .foliage-drop-4 { opacity: 0; }
    .olmo-withered .foliage-drop-5 { opacity: 0; }
    .olmo-withered .leaf-delay-0,
    .olmo-withered .leaf-delay-3 { opacity: 0; }
    .olmo-withered .leaf-delay-1,
    .olmo-withered .leaf-delay-4 { opacity: 0; }
    .olmo-withered .leaf-delay-2,
    .olmo-withered .leaf-delay-5 { opacity: 0; }
    .olmo-withered .olmo-fallen-leaves { opacity: .94; }
    .olmo-withered .olmo-fallen-dense { opacity: .88; transition-delay: .7s; }

    @keyframes olmo-leaf-fall {
      0% {
        opacity: 0;
        translate: 0 -18px;
        rotate: -8deg;
      }
      10% { opacity: .9; }
      28% {
        translate: var(--drift-mid) 145px;
        rotate: 104deg;
      }
      57% {
        translate: var(--drift-back) 332px;
        rotate: 226deg;
      }
      84% { opacity: .62; }
      100% {
        opacity: 0;
        translate: var(--drift) 610px;
        rotate: 392deg;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .olmo-scene *,
      .olmo-scene {
        animation: none !important;
        transition-duration: .01ms !important;
        transition-delay: 0s !important;
      }
      .olmo-fall-stream { opacity: .18; }
      .olmo-falling-leaf { opacity: .32; }
    }
  </style>

  <!-- Cielo de dos exposiciones; el fundido conserva la continuidad tonal. -->
  <rect class="olmo-sky-day" width="1200" height="900" fill="url(#olmo-day-sky)" />
  <rect class="olmo-sky-night" width="1200" height="900" fill="url(#olmo-night-sky)" />
  <path class="olmo-horizon" fill="#d8cab0" d="
    M0 522 C142 478 260 502 366 480 C485 456 574 486 690 463
    C824 438 944 468 1200 430 L1200 706 L0 706 Z" />

  <!-- Luna alta, parcialmente invadida por la rama izquierda. -->
  <circle class="olmo-moon-halo" cx="248" cy="164" r="112" fill="url(#olmo-moon-glow)"
          filter="url(#olmo-soft-glow)" />
  <path class="olmo-moon" d="
    M293 164 C293 190 273 211 248 211 C222 211 202 190 202 164
    C202 139 222 118 248 118 C273 118 293 139 293 164 Z
    M270 136 C257 130 242 132 232 141 C246 139 258 146 264 157
    C269 151 272 143 270 136 Z" fill-rule="evenodd" />

  <!-- Fondo lejano y pradera. -->
  <g opacity=".17" fill="#33434a">
    <path d="M0 617 C90 574 146 583 213 619 C279 653 341 637 397 600
             C313 606 246 584 178 558 C115 535 58 551 0 579 Z" />
    <path d="M760 603 C842 553 915 565 978 598 C1044 631 1112 621 1200 565
             L1200 684 C1092 655 991 665 905 684 Z" />
  </g>
  <path class="olmo-ground" d="
    M0 759 C158 729 306 739 448 724 C604 707 760 711 900 730
    C1010 745 1097 735 1200 711 L1200 900 L0 900 Z" />
  <path class="olmo-ground-light" d="
    M0 775 C173 746 301 758 448 742 C624 722 779 729 906 746
    C1025 762 1101 749 1200 728 L1200 782
    C1083 792 1014 796 892 782 C731 764 589 765 447 783
    C291 803 150 786 0 811 Z" />

  <!-- La hojarasca queda bajo las raíces para que el árbol conserve peso y apoyo. -->
  <g class="olmo-fallen-leaves" aria-hidden="true">${fallenLeafMarkup}</g>
  <g class="olmo-fallen-dense" aria-hidden="true">${fallenDenseMarkup}</g>

  <!-- Esqueleto completo: tronco y ramas permanecen visibles en los tres estados. -->
  <g class="olmo-wood" stroke-linejoin="round">
    <path stroke-width="3" d="
      M470 824 C493 795 507 760 511 716 C515 665 506 615 517 567
      C527 523 549 487 555 444 C561 408 554 374 563 337
      C572 301 591 272 607 239
      C618 275 625 306 627 341 C629 376 620 410 631 447
      C643 487 668 522 674 566 C682 617 669 665 675 716
      C680 760 695 793 727 824
      C699 818 673 823 650 835 C631 846 618 855 603 862
      C586 855 570 846 551 837 C529 825 502 821 470 824 Z" />

    <!-- Grandes ramas con dos bordes: gruesas en la unión y finas en la punta. -->
    <path d="M548 494 C509 459 464 433 407 412 C371 399 342 387 314 369
             C350 381 383 389 419 400 C474 418 523 440 567 466 Z" />
    <path d="M533 561 C489 529 444 508 400 498 C381 493 365 488 351 482
             C382 486 409 486 438 492 C483 502 520 516 551 535 Z" />
    <path d="M560 413 C533 370 500 334 456 303 C418 277 380 254 346 219
             C386 247 425 263 466 289 C514 319 549 353 577 392 Z" />
    <path d="M570 353 C552 307 535 271 503 231 C479 201 455 174 434 139
             C463 171 493 194 517 222 C550 260 570 298 587 337 Z" />
    <path d="M587 307 C577 260 581 218 590 181 C596 154 603 130 611 109
             C614 139 612 159 608 185 C603 227 607 266 603 307 Z" />

    <path d="M653 494 C692 458 738 432 795 411 C830 398 860 384 887 365
             C854 381 824 391 790 404 C741 423 695 453 634 525 Z" />
    <path d="M667 561 C711 528 757 507 801 497 C820 492 836 487 849 481
             C819 485 791 485 763 492 C718 502 681 516 650 596 Z" />
    <path d="M641 413 C669 369 702 333 747 302 C785 276 826 252 865 217
             C837 253 797 282 756 311 C711 343 674 378 624 443 Z" />
    <path d="M631 353 C650 307 669 270 702 231 C729 200 758 173 784 139
             C760 178 733 206 711 236 C680 277 660 313 614 379 Z" />

    <!-- Raíces que anclan el volumen a la pradera. -->
    <path d="M552 760 C522 772 493 791 459 810 C437 822 415 831 391 836
             C420 845 448 838 468 827 C499 811 524 797 551 791
             C560 782 560 771 552 760 Z" />
    <path d="M535 804 C514 817 495 830 470 839 C449 847 431 849 411 846
             C436 857 463 855 484 848 C511 839 533 829 553 818 Z" />
    <path d="M650 757 C681 770 710 788 744 804 C769 816 794 824 821 826
             C793 838 765 833 741 822 C711 808 683 795 650 789
             C642 779 642 767 650 757 Z" />
    <path d="M667 801 C688 813 708 826 733 835 C754 842 774 844 795 840
             C771 852 744 852 721 845 C695 836 673 826 648 814 Z" />
  </g>

  <!-- Ramas secundarias y ramillas: ritmo irregular, bifurcaciones naturales. -->
  <g class="olmo-wood-detail" stroke-linecap="round" stroke-linejoin="round">
    <path class="olmo-branch-detail" d="
             M410 416 C373 384 342 350 316 315
             M390 492 C371 499 356 508 344 517
             M458 299 C421 300 389 291 356 275
             M404 278 C385 251 367 230 348 211" stroke-width="10" />
    <path class="olmo-branch-detail" d="
             M316 315 C293 286 278 258 266 231
             M316 315 C292 309 272 301 255 290
             M356 275 C330 251 309 224 294 198
             M348 211 C332 189 321 168 313 144" stroke-width="5" />
    <path class="olmo-branch-detail" d="
             M794 413 C831 381 861 347 886 312
             M810 489 C829 496 844 505 857 514
             M746 298 C784 299 817 290 850 273
             M798 278 C817 251 835 229 855 210" stroke-width="10" />
    <path class="olmo-branch-detail" d="
             M886 312 C910 283 925 255 938 228
             M886 312 C910 306 930 297 947 286
             M850 273 C876 248 896 221 911 195
             M855 210 C872 188 883 166 891 142" stroke-width="5" />
    <path class="olmo-branch-detail" d="
             M506 224 C478 212 451 208 423 211
             M587 174 C563 157 546 136 532 115
             M702 227 C731 212 759 207 789 210
             M615 172 C638 154 654 134 668 112" stroke-width="7" />

    <!-- Surcos de corteza; pocos, largos y quebrados. -->
    <path class="olmo-bark-detail" d="M535 741 C551 681 542 620 552 565 C560 518 578 475 581 428
             M575 824 C566 753 577 687 572 629 C568 584 579 544 590 508
             M626 815 C643 745 632 677 639 616 C645 566 630 521 621 481
             M604 736 C596 682 609 625 600 573" stroke-width="4" />
    <path class="olmo-bark-detail" d="M548 602 C564 608 575 607 588 598 M617 676 C631 681 643 679 652 670
             M568 520 C580 526 591 525 601 516" stroke-width="3" opacity=".72" />
  </g>

  <!-- Sombras discontinuas bajo el follaje. Los huecos siguen el dibujo de las ramas. -->
  <g class="olmo-crown-back">
    <path d="M219 359 C217 320 246 293 281 299 C273 263 305 237 341 247
             C359 267 351 299 329 317 C299 344 264 362 219 359 Z" />
    <path d="M312 236 C307 199 340 174 377 187 C384 145 426 125 461 149
             C471 179 445 204 414 217 C379 233 347 239 312 236 Z" />
    <path d="M423 145 C440 102 485 84 520 110 C548 75 599 74 624 108
             C618 139 583 154 544 158 C497 164 459 156 423 145 Z" />
    <path d="M602 112 C637 79 688 88 705 124 C741 101 785 124 785 161
             C766 187 731 185 694 172 C656 160 626 144 602 112 Z" />
    <path d="M759 180 C797 155 838 178 839 216 C880 205 913 237 902 275
             C878 296 842 282 813 260 C787 240 769 214 759 180 Z" />
    <path d="M841 288 C879 279 910 310 897 346 C935 359 941 398 912 420
             C874 419 847 395 833 362 C822 335 826 309 841 288 Z" />
    <path d="M704 406 C735 378 780 387 794 421 C829 411 859 442 845 472
             C816 492 779 478 747 459 C724 445 709 427 704 406 Z" />
    <path d="M478 402 C449 375 408 386 396 419 C361 410 332 439 344 469
             C377 487 411 475 441 455 C462 441 475 423 478 402 Z" />
  </g>
  <g class="olmo-crown-middle">
    <path d="M275 349 C270 316 300 295 329 307 C342 276 379 269 401 294
             C408 323 382 344 350 353 C322 361 295 359 275 349 Z" />
    <path d="M353 254 C360 218 395 205 423 225 C443 193 484 196 500 227
             C492 257 460 269 426 269 C397 270 372 264 353 254 Z" />
    <path d="M473 185 C492 154 530 151 550 178 C577 151 618 162 627 197
             C608 224 570 227 537 216 C509 208 488 198 473 185 Z" />
    <path d="M619 199 C637 165 677 162 698 190 C726 165 765 177 773 211
             C751 236 714 239 680 228 C652 220 632 210 619 199 Z" />
    <path d="M743 269 C763 237 803 238 821 268 C854 248 886 271 887 304
             C863 328 825 326 794 313 C769 302 751 285 743 269 Z" />
    <path d="M731 367 C755 342 791 349 802 380 C833 371 860 398 849 427
             C821 445 788 433 761 414 C742 401 732 383 731 367 Z" />
    <path d="M455 362 C431 338 396 347 386 377 C354 370 330 397 340 425
             C367 443 401 430 428 411 C447 397 455 379 455 362 Z" />
  </g>
  <g class="olmo-crown-front">
    <path d="M399 325 C401 294 431 278 458 296 C478 269 515 276 526 307
             C512 335 478 345 445 339 C424 336 407 331 399 325 Z" />
    <path d="M495 265 C507 233 544 228 565 254 C588 226 628 232 643 263
             C629 292 593 301 558 293 C530 288 509 277 495 265 Z" />
    <path d="M633 277 C649 245 687 244 706 272 C734 250 768 264 776 296
             C756 322 719 325 685 313 C660 304 642 291 633 277 Z" />
    <path d="M525 376 C539 346 575 340 596 365 C619 338 658 344 671 376
             C655 404 620 413 586 404 C558 398 538 388 525 376 Z" />
  </g>
  <g class="olmo-foliage">${foliageMarkup}</g>
  <g class="olmo-edge-leaves">${edgeLeafMarkup}</g>

  <!-- Hojas que se desprenden: todas existen desde el inicio, sin crear nodos en runtime. -->
  <g class="olmo-fall-stream" aria-hidden="true">${fallingLeafMarkup}</g>

  <!-- Hierba de primer plano, discreta para no competir con el poema. -->
  <g class="olmo-grass" stroke-width="4" stroke-linecap="round">
    <path d="M92 792 Q94 758 110 742 M106 789 Q124 761 144 754 M174 776 Q179 743 192 727
             M196 773 Q218 749 235 744 M299 758 Q306 729 321 718 M332 753 Q350 728 367 722
             M431 747 Q435 716 450 702 M455 744 Q475 719 491 714
             M792 748 Q800 718 815 708 M826 754 Q846 726 862 721
             M931 758 Q940 730 954 717 M963 765 Q984 740 1002 733
             M1080 778 Q1087 748 1103 739 M1112 786 Q1130 758 1148 753" />
  </g>

</svg>
`;

function normalizeStage(stage) {
    return STAGES.has(stage) ? stage : 'lush';
}

function applyStage(svg, stage) {
    svg.classList.toggle('olmo-withering', stage === 'withering');
    svg.classList.toggle('olmo-withered', stage === 'withered');
}

function ensureLayoutStyles() {
    const existingStyle = document.getElementById(OLMO_LAYOUT_STYLE_ID);
    if (existingStyle) {
        if (existingStyle.textContent !== OLMO_LAYOUT_STYLES) {
            existingStyle.textContent = OLMO_LAYOUT_STYLES;
        }
        return;
    }

    const style = document.createElement('style');
    style.id = OLMO_LAYOUT_STYLE_ID;
    style.textContent = OLMO_LAYOUT_STYLES;
    document.head.appendChild(style);
}

function syncOverlayLayout(overlay, svg, mediaQuery) {
    const pageWrapper = document.getElementById('page-wrapper');
    const isFullscreen = document.body.classList.contains('fullscreen-mode') ||
        document.body.classList.contains('virtual-fullscreen') ||
        Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    const useReaderCanvas = (mediaQuery.matches || isFullscreen) && pageWrapper;

    if (useReaderCanvas) {
        if (overlay.parentElement !== pageWrapper) pageWrapper.appendChild(overlay);
        Object.assign(overlay.style, {
            position: 'absolute',
            inset: '0',
            width: '100%',
            height: '100%',
            zIndex: '1'
        });
        svg.setAttribute(
            'preserveAspectRatio',
            mediaQuery.matches ? MOBILE_PRESERVE_ASPECT_RATIO : DEFAULT_PRESERVE_ASPECT_RATIO
        );
        return;
    }

    const appContainer = document.getElementById('app-container') || document.body;
    if (overlay.parentElement !== appContainer) appContainer.appendChild(overlay);
    Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '1'
    });
    svg.setAttribute('preserveAspectRatio', DEFAULT_PRESERVE_ASPECT_RATIO);
}

/**
 * Monta o actualiza la escena.
 *
 * @param {'lush'|'withering'|'withered'} stage
 * @returns {() => void} cleanup
 */
export function startOlmoEffect(stage = 'lush') {
    const nextStage = normalizeStage(stage);
    ensureLayoutStyles();
    document.body.classList.add('olmo-reader-active');

    const container = document.getElementById('app-container') || document.body;
    let overlay = document.getElementById('olmo-overlay');
    let isNew = false;

    if (!overlay) {
        isNew = true;
        overlay = document.createElement('div');
        overlay.id = 'olmo-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        Object.assign(overlay.style, {
            inset: '0',
            pointerEvents: 'none',
            opacity: '0',
            overflow: 'hidden',
            transition: 'opacity 2.2s ease-out',
            contain: 'layout paint style'
        });
        overlay.innerHTML = SVG_SCENE;
        container.appendChild(overlay);
    }

    const svg = overlay.querySelector('#olmo-scene');
    if (!svg) return () => overlay?.remove();

    if (overlay._removeOlmoLayoutListener) {
        overlay._removeOlmoLayoutListener();
    }

    const mediaQuery = window.matchMedia(MOBILE_READER_QUERY);
    const handleLayoutChange = () => syncOverlayLayout(overlay, svg, mediaQuery);
    handleLayoutChange();

    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleLayoutChange);
    } else {
        mediaQuery.addListener(handleLayoutChange);
    }

    overlay._removeOlmoLayoutListener = () => {
        if (mediaQuery.removeEventListener) {
            mediaQuery.removeEventListener('change', handleLayoutChange);
        } else {
            mediaQuery.removeListener(handleLayoutChange);
        }
        delete overlay._removeOlmoLayoutListener;
    };

    const previousStage = overlay.dataset.stage;
    overlay.dataset.stage = nextStage;

    if (isNew) {
        applyStage(svg, 'lush');
        // Dos frames garantizan que el navegador pinte el estado inicial antes
        // de interpolar una carga directa a withering/withered.
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            requestAnimationFrame(() => applyStage(svg, nextStage));
        });
    } else if (previousStage !== nextStage) {
        requestAnimationFrame(() => applyStage(svg, nextStage));
    }

    return () => {
        overlay._removeOlmoLayoutListener?.();
        document.body.classList.remove('olmo-reader-active');
        const current = document.getElementById('olmo-overlay');
        if (current) current.remove();
    };
}
