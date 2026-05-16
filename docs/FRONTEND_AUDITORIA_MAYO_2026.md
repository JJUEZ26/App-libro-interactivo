# Auditoria Frontend Mayo 2026

## Principio rector

La auditoria parte de la filosofia del proyecto: una biblioteca inmersiva, contemplativa y escalable. La prioridad es corregir friccion visible sin cambiar la identidad visual, la paleta, la arquitectura vanilla ni la logica de backend futura.

## Hallazgos principales

1. **Navegacion rota en historias largas**
   - `frankenstein.json`: la pagina `33` apuntaba a la pagina inexistente `34`.
   - `ivan_ilich.json`: la pagina `p105` apuntaba a la pagina inexistente `p106`.
   - `meditaciones.json`: habia IDs duplicados entre `p85` y `p107`, saltos de numeracion y una ultima decision hacia `p270` inexistente.

2. **Finales con ruido visual**
   - El renderer agregaba automaticamente un boton extra de reinicio cuando una decision apuntaba a `-1`. Esto duplicaba acciones en paginas finales donde solo se esperaba volver a la biblioteca.

3. **Biografias con fechas vulnerables al mal encuadre**
   - Las fechas (`bio-badge`) estaban ancladas a la derecha del retrato. En retratos estrechos o composiciones circulares esto podia verse descentrado.

4. **Biblioteca con listeners globales repetidos**
   - Cada render de cards agregaba nuevos `document.addEventListener('click', ...)` para cerrar menus kebab. Al volver muchas veces del lector a la biblioteca, esto podia acumular listeners y degradar fluidez.

5. **Perfil insuficiente para una app social de lectura**
   - El drawer de perfil existia, pero no mostraba galeria, estante, citas, ni configuracion editable. La galeria de dibujos ya existia en almacenamiento local, pero no tenia superficie visible.

## Planes de ataque

### Plan A - Integridad de lectura (P0)

- Corregir enlaces finales que apuntan a paginas inexistentes.
- Renumerar `meditaciones.json` de forma lineal y consistente.
- Garantizar que las historias largas puedan llegar a su final sin quedarse en una pantalla sin avance.

### Plan B - Pulido de interfaz visible (P1)

- Centrar las fechas de biografia bajo cada retrato sin alterar colores ni tratamiento visual por autor.
- Reducir botones finales redundantes.
- Mantener el silencio visual: acciones claras, sin popups estridentes.

### Plan C - Fluidez y mantenimiento (P1)

- Reemplazar listeners globales por card por un solo listener global de cierre de menus.
- Usar IDs unicos en anillos SVG de progreso para evitar colisiones.
- Mantener la logica encapsulada en modulos vanilla existentes.

### Plan D - Ecosistema social local (P1)

- Agregar un estante personal local desde el menu de cada obra.
- Exponer la galeria de dibujos guardados dentro del perfil.
- Agregar resumen de lectura local: obras iniciadas, paginas recorridas, citas y huellas.
- Agregar configuracion de cuenta local para nombre visible, preparada para backend posterior mediante `AuthService`.

### Plan E - Backend futuro (P2, no implementar ahora)

- Sustituir localStorage por persistencia real manteniendo las fachadas actuales.
- Sincronizar estante, galeria, citas y estadisticas por usuario.
- Agregar perfiles publicos y actividad compartida con permisos claros.

## Verificacion esperada

- `npm run build` debe pasar.
- Auditoria de historias debe quedar sin enlaces de decisiones hacia IDs inexistentes.
- El perfil debe funcionar tanto en sesion real mock como en modo invitado.
- No se deben introducir frameworks ni cambios de paleta.
