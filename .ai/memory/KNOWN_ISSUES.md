# KNOWN_ISSUES.md

## Blocking
Ningún defecto funcional de código conocido en el head actual. El PR #36 permanece bloqueado para merge hasta obtener un quality gate completo verde del último commit.

## Environment
- El sandbox actual no resuelve `registry.npmjs.org`; no es un defecto de ElectroCMS.
- GitHub Actions continúa siendo el entorno oficial de `npm ci`, tests y build.
- Vercel auto-deploy está desactivado con `git.deploymentEnabled=false`; desplegar solo bajo petición explícita.
- GitHub hosted runners pueden cancelar ocasionalmente una operación en curso sin reportar fallo de aserción (`The operation was canceled`). Una cancelación no se acepta como evidencia verde; se requiere una ejecución completa.

## Known scope boundaries
- Widgets dynamic/commerce/form/filter de F04 son contratos `modeled`; su comportamiento real pertenece a fases posteriores.
- Preview/Backend/Export conservan sus contratos honestos; capacidades no implementadas no deben presentarse como funcionales.
- La biblioteca local de themes resuelve definiciones instaladas; el bundling final dentro de exporters pertenece a fases de export/publish.
- Los paquetes F04 transfieren solo los grupos modelados explícitamente soportados por `ProjectThemePackageResources`.
- El clipboard de MF-024 sigue siendo transitorio a la sesión del editor; integración con System Clipboard no fue requisito de F03/F04.

## Resolved during Bento UI hardening
- Los presets UI seleccionables quedaron retirados; el editor usa únicamente `bento-high-density` con modos light/dark/auto.
- El selector residual de preset en Settings fue retirado.
- El popover de Workspace Settings queda contenido dentro del drawer compacto.
- El header móvil se reorganizó en dos filas para evitar competencia horizontal entre identidad, acciones y controles del editor.
- El trigger móvil de navegación declara explícitamente 44×44px en <=720px; un E2E dedicado evita regresiones del touch target.
- Capability labels se distinguen visual y semánticamente de acciones deshabilitadas.
- Header commands exponen toolbar/group semantics y el save state usa live status.
- Focusables usan scroll margin para reducir riesgo de foco oculto por chrome denso/sticky.
- El warning React de `GridPreview` propagando props internas al DOM quedó corregido durante el cierre F04.

## Non-blocking maintenance
- El lint oficial es zero-warning; cualquier nuevo warning inesperado bloquea el gate.
- GitHub hosted runners muestran advertencias de transición del runtime interno Node usado por algunas versiones de `actions/*`; Node 22 configurado para ElectroCMS sigue funcionando correctamente.
