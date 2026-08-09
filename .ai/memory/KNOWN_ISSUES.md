# KNOWN_ISSUES.md

## Blocking
Ningún defecto funcional conocido bloquea el `main` actual después de MF-042. Último gate funcional completo: GitHub Actions #1533 PASS.

## Environment
- GitHub Actions es la autoridad para `npm ci`, lint, types, tests, coverage, build y Playwright.
- Restricciones de red del sandbox/local no se interpretan automáticamente como defectos del proyecto.
- Vercel auto-deploy está desactivado; desplegar solo por petición explícita.
- Un runner cancelado no cuenta como evidencia verde.

## Current F05 scope boundaries
- MF-037 a MF-042 están integrados en Studio Pro.
- MF-043 Relations/reference fields es el próximo trabajo.
- `core/relation`, `core/user` y `core/taxonomy` siguen modeled en el head actual; no presentarlos como funcionales hasta MF-043.
- MF-044 Dynamic Bindings sigue bloqueado hasta que Relations esté verde e integrado.
- Widgets dynamic/commerce/form/filter de F04 conservan estado modeled donde sus motores aún no existen.
- Preview/Backend/Export deben mantener estados honestos para capacidades no implementadas.

## Advanced Field safety/integrity
- Group/Repeater/Calculated/Conditional runtime usa v2; v1 histórico permanece modeled.
- Profundidad reusable/nested máxima 8 y Repeater máximo 100 filas.
- Calculated no ejecuta código; usa parser aritmético limitado.
- Field Group deletion se bloquea por Taxonomy, Record o advanced group reference.
- Field Group update se bloquea si invalida ancestors reusable o Records existentes directos/anidados.
- E2E MF-042 verifica persistencia real en IndexedDB y rechazo atómico de cambio destructivo.

## Studio Pro
- `studio-pro` es el único sistema visual del editor.
- No reintroducir Bento ni UI/CSS de `agent/f05-dynamic-content`.
- `light`/`dark`/`auto` son modos de apariencia; frontend/backend project themes son independientes.
- Root horizontal overflow sigue prohibido; browser zoom habilitado.

## Non-blocking maintenance
- Lint oficial es zero-warning.
- Algunas versiones de `actions/*` pueden mostrar warnings de runtime Node interno; ElectroCMS ejecuta sus comandos con Node 22.
- PR #39 es histórico/divergente y no debe usarse como base para F05.
