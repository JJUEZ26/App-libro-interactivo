# Audio externo opcional (SISIFO)

Este directorio permite reemplazar parcialmente el audio procedural.

## Archivos sugeridos
- `wind-loop.ogg` (loop limpio de viento)
- `rock-friction-loop.ogg` (friccion rugosa de roca)

## Como activarlo
En `src/games/sisyphus/game.js`, en `createAudioCueProfile(...)`:
- `enableSampleLayer: true`
- `sampleBlend: 0.35` (ejemplo)
- `samples.wind: './assets/audio/wind-loop.ogg'`
- `samples.friction: './assets/audio/rock-friction-loop.ogg'`

Si faltan archivos, el sistema cae automaticamente al audio procedural.
