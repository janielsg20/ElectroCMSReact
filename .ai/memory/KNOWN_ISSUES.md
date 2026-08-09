# KNOWN_ISSUES.md

## Blocking
Ningún defecto funcional conocido bloquea el `main` actual después de MF-041. Último gate funcional completo: GitHub Actions #1528 PASS.

## Environment
- GitHub Actions es la autoridad para `npm ci`, lint, types, tests, coverage, build y Playwright.
- Restricciones de red del sandbox/local no se interpretan automáticamente como defectos del proyecto.
- Vercel auto-deploy está desactivado; desplegar solo por petición explícita.
- Un runner cancelado no cuenta como evidencia verde.

## Current F05 scope boundaries
- MF-037 Content Types, MF-038 Taxonomies, MF-039 Field Type Registry, MF-040 Custom Field Groups y MF-041 Records CRUD están integrados en Studio Pro.
- MF-042 Advanced Fields es el próximo trabajo.
- MF-043 Relations/reference fields sigue bloqueada hasta que MF-042 pase gate y merge.
- No promover Relation/User/Taxonomy reference behavior durante MF-042 si el contrato histórico lo reserva a MF-043.
- Dynamic Bindings MF-044 sigue bloqueado por MF-042/MF-043.
- Widgets dynamic/commerce/form/filter de F04 conservan estado modeled donde sus motores aún no existen.
- Preview/Backend/Export deben mantener estados honestos para capacidades no implementadas.

## Data integrity boundaries
- Content Type deletion está bloqueado mientras Records o Taxonomies lo referencien.
- Field Group deletion está bloqueado mientras Records o Taxonomies lo referencien.
- Records solo pueden persistir valores de Field Groups seleccionados y campos conocidos; validation delega al FieldTypeRegistry.
- El E2E de MF-041 verifica persistencia real en IndexedDB, no solo estado visual.

## Studio Pro
- `studio-pro` es el único sistema visual del editor.
- No reintroducir Bento ni UI/CSS de `agent/f05-dynamic-content`.
- `light`/`dark`/`auto` son modos de apariencia; frontend/backend project themes son independientes.
- Root horizontal overflow sigue prohibido; browser zoom habilitado.

## Non-blocking maintenance
- Lint oficial es zero-warning.
- Algunas versiones de `actions/*` pueden mostrar warnings de runtime Node interno; ElectroCMS ejecuta sus comandos con Node 22.
- PR #39 es histórico/divergente y no debe usarse como base para F05.
