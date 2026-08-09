# KNOWN_ISSUES.md

## Blocking
Ningún defecto funcional conocido bloquea el `main` actual después de MF-040. El último gate funcional completo es GitHub Actions #1524 PASS.

## Environment
- GitHub Actions es el entorno oficial para `npm ci`, lint, types, tests, coverage, build y Playwright.
- El sandbox/local tooling puede tener restricciones de red; no se interpreta automáticamente como defecto del proyecto.
- Vercel auto-deploy está desactivado con `git.deploymentEnabled=false`; desplegar solo bajo petición explícita.
- Una cancelación de hosted runner no cuenta como evidencia verde; se requiere ejecución completa.

## Current F05 scope boundaries
- MF-037 Content Types, MF-038 Taxonomies, MF-039 Field Type Registry y MF-040 Custom Field Groups están integrados en Studio Pro.
- MF-041 Records CRUD es el próximo trabajo y aún no debe presentarse como integrado.
- Los 7 Field Types `modeled` — Relation, User, Taxonomy, Repeater, Group, Calculated y Conditional — siguen sin poder instanciarse en MF-040; se habilitan solo en sus microfases posteriores.
- Advanced Fields, Relations y Dynamic Bindings siguen bloqueados hasta completar las microfases previas de F05.
- Widgets dynamic/commerce/form/filter de F04 mantienen contratos `modeled` hasta que sus motores correspondientes estén realmente implementados.
- Preview/Backend/Export deben seguir mostrando estados honestos para capacidades no implementadas.

## Studio Pro
- `studio-pro` es el único sistema visual del editor.
- No reintroducir presets Bento ni UI/CSS de la rama histórica `agent/f05-dynamic-content`.
- `light` / `dark` / `auto` son modos de apariencia de Studio Pro; frontend/backend themes del proyecto son independientes.
- Root horizontal overflow sigue prohibido y browser zoom permanece habilitado.

## Non-blocking maintenance
- Lint oficial es zero-warning; cualquier warning nuevo bloquea el gate.
- Algunas versiones de `actions/*` pueden mostrar warnings de transición de runtime Node interno. ElectroCMS continúa configurando Node 22 para sus comandos de proyecto.
- PR #39 es una rama UI histórica abierta y divergente; no usarla como base para F05 ni mezclarla con el port secuencial actual.
