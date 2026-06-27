/**
 * Escena cinemática para "Peras del olmo".
 *
 * Una única ilustración SVG permanece montada durante las tres páginas para que
 * los estados lush → withering → withered sean una transformación real y no tres
 * imágenes desconectadas. La animación usa únicamente CSS (transform + opacity),
 * sin timers ni trabajo continuo en el hilo principal.
 */

const STAGES = new Set(['lush', 'withering', 'withered']);

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
        const renderedCount = Math.ceil(count * .72);
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

const fallingLeafMarkup = FALLING_LEAVES.map(([x, y, drift, duration, delay, scale], index) => (
    `<use class="olmo-falling-leaf fall-tone-${index % 4}" href="#olmo-leaf"
          transform="translate(${x} ${y}) scale(${scale})"
          style="--drift:${drift}px;--drift-mid:${drift * .52}px;--drift-back:${drift * -.2}px;--fall-duration:${duration}s;--fall-delay:${delay}s" />`
)).join('');

const SVG_SCENE = `
<svg id="olmo-scene" class="olmo-scene" viewBox="0 0 1200 900"
     preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-labelledby="olmo-title olmo-description">
  <title id="olmo-title">Un olmo bajo la luna</title>
  <desc id="olmo-description">El olmo pierde lentamente sus hojas mientras el paisaje se transforma en noche.</desc>

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
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
      opacity: .45;
      transition: opacity 5.8s ease;
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
    .olmo-fallen-leaves {
      transition-duration: 6.4s;
      transition-timing-function: cubic-bezier(.22, .61, .36, 1);
      transition-property: opacity, fill, stroke, transform;
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
    .olmo-wood-detail { fill: none; stroke: #3b474b; opacity: .42; }

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
      transform-origin: 600px 330px;
    }
    .olmo-foliage-leaf {
      transform-box: fill-box;
      transform-origin: center;
      transition: opacity 5.4s ease, fill 5.8s ease;
    }
    .foliage-tone-0 { fill: #203b32; }
    .foliage-tone-1 { fill: #31513d; }
    .foliage-tone-2 { fill: #496247; }
    .foliage-tone-3 { fill: #263f36; }
    .olmo-edge-leaf {
      transform-box: fill-box;
      transform-origin: center;
      transition: opacity 4.8s ease, fill 5.4s ease;
    }

    .olmo-falling-leaf {
      fill: #9b7d43;
      opacity: 0;
      transform-box: fill-box;
      transform-origin: center;
      will-change: transform, opacity;
    }
    .fall-tone-1 { fill: #795a36; }
    .fall-tone-2 { fill: #ad8845; }
    .fall-tone-3 { fill: #60523a; }
    .olmo-fallen-leaves { fill: #665038; opacity: 0; }

    /* La frustración: el volumen se rompe por capas y deja ver la anatomía. */
    .olmo-scene.olmo-withering { opacity: .38; }
    .olmo-withering .olmo-sky-day { opacity: .5; }
    .olmo-withering .olmo-sky-night { opacity: .58; }
    .olmo-withering .olmo-horizon {
      opacity: .14;
      transform: translateY(18px) scale(.97);
    }
    .olmo-withering .olmo-moon { fill: #d7d0bc; opacity: .58; }
    .olmo-withering .olmo-moon-halo { opacity: .38; }
    .olmo-withering .olmo-ground-light { fill: #655f49; opacity: .16; }
    .olmo-withering .olmo-grass { stroke: #6f644d; opacity: .3; }
    .olmo-withering .olmo-crown-back {
      fill: #4e4937;
      opacity: .34;
      transform: translateY(34px) scale(.91);
    }
    .olmo-withering .olmo-crown-middle {
      fill: #66563a;
      opacity: .48;
      transform: translateY(22px) scale(.94);
    }
    .olmo-withering .olmo-crown-front {
      fill: #3f3c30;
      opacity: .42;
      transform: translateY(15px) scale(.96);
    }
    .olmo-withering .olmo-foliage {
      opacity: .72;
      transform: translateY(13px) scale(.97);
    }
    .olmo-withering .olmo-foliage-leaf { fill: #8b713f; }
    .olmo-withering .foliage-tone-1 { fill: #6d5b39; }
    .olmo-withering .foliage-tone-2 { fill: #a47d3f; }
    .olmo-withering .foliage-tone-3 { fill: #514a36; }
    .olmo-withering .foliage-drop-0 { opacity: .04; }
    .olmo-withering .foliage-drop-1 { opacity: .16; }
    .olmo-withering .foliage-drop-2 { opacity: .28; }
    .olmo-withering .foliage-drop-3 { opacity: .42; }
    .olmo-withering .foliage-drop-4 { opacity: .56; }
    .olmo-withering .foliage-drop-5 { opacity: .68; }
    .olmo-withering .olmo-edge-leaves { fill: #9a7740; opacity: .5; }
    .olmo-withering .leaf-delay-0,
    .olmo-withering .leaf-delay-3 { opacity: .1; }
    .olmo-withering .leaf-delay-1 { opacity: .32; }
    .olmo-withering .olmo-fallen-leaves { opacity: .38; transition-delay: 3.4s; }
    .olmo-withering .olmo-falling-leaf {
      animation: olmo-leaf-fall var(--fall-duration) var(--fall-delay)
                 cubic-bezier(.28, .45, .52, .96) both;
    }

    /* La aceptación: quedan la estructura desnuda del olmo y la noche. */
    .olmo-scene.olmo-withered { opacity: .25; }
    .olmo-withered .olmo-sky-day { opacity: 0; }
    .olmo-withered .olmo-sky-night { opacity: 1; }
    .olmo-withered .olmo-horizon {
      opacity: .04;
      transform: translateY(32px) scale(.94);
    }
    .olmo-withered .olmo-moon { fill: #d9dbe0; opacity: .42; }
    .olmo-withered .olmo-moon-halo { opacity: .2; }
    .olmo-withered .olmo-ground { fill: #0c1117; }
    .olmo-withered .olmo-ground-light { opacity: .04; }
    .olmo-withered .olmo-grass { stroke: #2e3740; opacity: .14; }
    .olmo-withered .olmo-wood { filter: saturate(.45) brightness(.72); }
    .olmo-withered .olmo-wood-detail { stroke: #48505a; opacity: .26; }
    .olmo-withered .olmo-crown-back {
      opacity: 0;
      transform: translateY(92px) scale(.7);
    }
    .olmo-withered .olmo-crown-middle {
      opacity: 0;
      transform: translateY(78px) scale(.75);
    }
    .olmo-withered .olmo-crown-front {
      opacity: 0;
      transform: translateY(62px) scale(.8);
    }
    .olmo-withered .olmo-edge-leaves {
      opacity: 0;
      transform: translateY(70px) scale(.82);
    }
    .olmo-withered .olmo-foliage {
      opacity: 0;
      transform: translateY(76px) scale(.82);
    }
    .olmo-withered .olmo-fallen-leaves { opacity: .58; }

    @keyframes olmo-leaf-fall {
      0% {
        opacity: 0;
        translate: 0 0;
        rotate: 0deg;
      }
      8% { opacity: .92; }
      28% {
        translate: var(--drift-mid) 155px;
        rotate: 112deg;
      }
      57% {
        translate: var(--drift-back) 340px;
        rotate: 238deg;
      }
      84% { opacity: .72; }
      100% {
        opacity: 0;
        translate: var(--drift) 590px;
        rotate: 410deg;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .olmo-scene *,
      .olmo-scene {
        animation: none !important;
        transition-duration: .01ms !important;
        transition-delay: 0s !important;
      }
      .olmo-withering .olmo-falling-leaf { opacity: .38; }
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

  <!-- Esqueleto completo: tronco y ramas permanecen visibles en los tres estados. -->
  <g class="olmo-wood" stroke-linejoin="round">
    <path stroke-width="3" d="
      M470 824 C493 795 507 760 511 716 C515 665 506 615 517 567
      C527 523 549 487 555 444 C561 408 554 374 563 337
      C572 301 591 272 607 239
      C618 275 625 306 627 341 C629 376 620 410 631 447
      C643 487 668 522 674 566 C682 617 669 665 675 716
      C680 760 695 793 727 824
      C694 818 667 823 646 842 C628 858 615 872 601 888
      C589 870 571 853 550 840 C526 824 500 818 470 824 Z" />

    <!-- Grandes ramas con dos bordes: gruesas en la unión y finas en la punta. -->
    <path d="M548 494 C509 459 464 433 407 412 C357 393 310 374 266 344
             C315 363 362 375 415 392 C473 411 523 436 567 466 Z" />
    <path d="M533 561 C487 526 437 504 376 492 C323 482 273 474 225 452
             C278 464 329 462 382 472 C445 482 501 505 551 535 Z" />
    <path d="M560 413 C533 370 500 334 456 303 C418 277 380 254 346 219
             C386 247 425 263 466 289 C514 319 549 353 577 392 Z" />
    <path d="M570 353 C552 307 535 271 503 231 C479 201 455 174 434 139
             C463 171 493 194 517 222 C550 260 570 298 587 337 Z" />
    <path d="M587 307 C577 260 581 216 590 175 C598 143 607 116 615 88
             C617 122 613 151 609 181 C603 225 607 265 603 307 Z" />

    <path d="M653 494 C692 458 738 432 795 411 C845 392 892 371 940 337
             C895 373 849 391 803 409 C745 431 696 458 634 525 Z" />
    <path d="M667 561 C714 525 765 502 826 490 C879 479 930 468 980 441
             C934 474 885 490 833 508 C775 527 720 551 650 596 Z" />
    <path d="M641 413 C669 369 702 333 747 302 C785 276 826 252 865 217
             C837 253 797 282 756 311 C711 343 674 378 624 443 Z" />
    <path d="M631 353 C650 307 669 270 702 231 C729 200 758 173 784 139
             C760 178 733 206 711 236 C680 277 660 313 614 379 Z" />

    <!-- Raíces que anclan el volumen a la pradera. -->
    <path d="M540 814 C502 829 457 838 400 837 C359 836 326 831 290 819
             C340 818 383 808 427 796 C471 784 507 786 552 801 Z" />
    <path d="M650 809 C694 821 737 828 789 824 C833 821 865 812 901 797
             C857 803 814 797 769 787 C721 777 687 782 646 797 Z" />
  </g>

  <!-- Ramas secundarias y ramillas: ritmo irregular, bifurcaciones naturales. -->
  <g class="olmo-wood-detail" stroke-linecap="round" stroke-linejoin="round">
    <path d="M410 416 C365 377 331 337 303 290 M342 359 C300 340 270 316 238 282
             M375 494 C330 518 294 539 247 546 M319 484 C279 458 247 436 214 402
             M458 299 C415 302 377 296 336 280 M404 278 C381 246 360 220 334 195" stroke-width="11" />
    <path d="M303 290 C276 259 260 226 244 190 M303 290 C265 282 229 269 194 243
             M238 282 C215 249 200 220 188 185 M247 546 C211 565 178 575 139 581
             M214 402 C177 386 148 363 117 330 M336 280 C300 251 274 217 253 179
             M334 195 C313 168 303 140 292 111" stroke-width="6" />
    <path d="M794 413 C839 373 874 334 905 288 M853 365 C890 343 925 315 955 279
             M826 488 C870 506 911 527 958 531 M888 476 C922 451 951 425 982 389
             M746 298 C788 302 829 295 867 275 M799 278 C825 245 848 216 875 184" stroke-width="11" />
    <path d="M905 288 C932 254 950 221 965 183 M905 288 C944 278 978 260 1011 235
             M955 279 C979 247 994 215 1006 180 M958 531 C999 546 1032 553 1073 555
             M982 389 C1019 370 1048 346 1078 312 M867 275 C901 245 926 211 946 174
             M875 184 C897 155 909 128 920 99" stroke-width="6" />
    <path d="M506 224 C478 210 449 206 418 209 M587 173 C558 151 538 128 520 96
             M702 227 C732 210 761 205 795 207 M615 171 C642 148 659 124 676 91" stroke-width="7" />

    <!-- Surcos de corteza; pocos, largos y quebrados. -->
    <path d="M535 741 C551 681 542 620 552 565 C560 518 578 475 581 428
             M575 824 C566 753 577 687 572 629 C568 584 579 544 590 508
             M626 815 C643 745 632 677 639 616 C645 566 630 521 621 481
             M604 736 C596 682 609 625 600 573" stroke-width="4" opacity=".72" />
    <path d="M548 602 C564 608 575 607 588 598 M617 676 C631 681 643 679 652 670
             M568 520 C580 526 591 525 601 516" stroke-width="3" opacity=".48" />
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
  <g aria-hidden="true">${fallingLeafMarkup}</g>
  <g class="olmo-fallen-leaves" aria-hidden="true">
    <use href="#olmo-leaf" transform="translate(270 768) rotate(12) scale(.7)" />
    <use href="#olmo-leaf" transform="translate(328 755) rotate(-18) scale(.62)" />
    <use href="#olmo-leaf" transform="translate(389 768) rotate(29) scale(.72)" />
    <use href="#olmo-leaf" transform="translate(462 748) rotate(-6) scale(.56)" />
    <use href="#olmo-leaf" transform="translate(714 751) rotate(18) scale(.62)" />
    <use href="#olmo-leaf" transform="translate(817 766) rotate(-22) scale(.68)" />
    <use href="#olmo-leaf" transform="translate(892 749) rotate(32) scale(.58)" />
    <use href="#olmo-leaf" transform="translate(958 762) rotate(-8) scale(.65)" />
  </g>

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

/**
 * Monta o actualiza la escena.
 *
 * @param {'lush'|'withering'|'withered'} stage
 * @returns {() => void} cleanup
 */
export function startOlmoEffect(stage = 'lush') {
    const nextStage = normalizeStage(stage);
    const container = document.getElementById('app-container') || document.body;
    let overlay = document.getElementById('olmo-overlay');
    let isNew = false;

    if (!overlay) {
        isNew = true;
        overlay = document.createElement('div');
        overlay.id = 'olmo-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        Object.assign(overlay.style, {
            position: 'fixed',
            inset: '0',
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: '1',
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
        const current = document.getElementById('olmo-overlay');
        if (current) current.remove();
    };
}
