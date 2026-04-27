# Pipeline de Assets Externos (SISIFO)

Este directorio permite integrar recursos cinematograficos sin tocar fisicas.

## Estructura
- `overlays/manifest.json`: manifiesto de capas 2D superpuestas.
- `overlays/*`: texturas PNG/SVG para cielo, haze, grano, flare, etc.
- `anim/`: secuencias o animaciones exportadas (Lottie/Rive/spritesheet).
- `audio/`: loops opcionales para mezclar con motor procedural.

## Contrato de overlay (`overlays/manifest.json`)
Cada entrada debe incluir:
- `id`: identificador unico.
- `kind`: `image` (default) o `sequence`.
- `src`: ruta relativa al manifiesto (si `kind=image`).
- `frames`: lista de rutas relativas (si `kind=sequence`).
- `fps`: velocidad de animacion para secuencia (si `kind=sequence`).
- `loop`: `true/false` para secuencia.
- `startOffsetMs`: desfase inicial de la secuencia.
- `layer`: `grade`, `distant`, etc.
- `blendMode`: composicion Canvas2D (`screen`, `overlay`, `soft-light`, etc.).
- `opacity`: 0-1.
- `mobileOpacityMultiplier`: factor para mobile.
- `parallaxX`, `parallaxY`: desplazamiento por camara.
- `pulseStrength`: respiracion suave opcional.
- `widthRatio`, `heightRatio`: escala del recurso.

## Flujo recomendado
1. Exporta recurso de AE/Blender/Rive.
2. Copialo a `overlays/` o `anim/`.
3. Agrega entrada en `manifest.json`.
4. Ejecuta `npm run build` y prueba en movil + desktop.

## Ejemplo integrado
- Secuencia de haze poetico:
  - `anim/ascent-haze-00.svg ... ascent-haze-07.svg`
  - id: `ascent_haze_sequence`
