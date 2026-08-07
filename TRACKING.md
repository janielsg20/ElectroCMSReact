# TRACKING.md — Estado de ejecución

## Estado global
- Estado: BLOCKED
- Fase actual: F00 — Discovery y arquitectura
- Microfase actual: MF-005 — Tooling y quality gates
- Último quality gate completo: `npm run verify:repo` local PASS
- Último build válido: N/A
- Repositorio oficial: `janielsg20/ElectroCMSReact`
- PR de validación: #1 `agent/f00-validation -> main`

## F00
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-000 | DONE | Inventario del proyecto completado |
| MF-001 | DONE | Gap analysis completado |
| MF-002 | DONE | Arquitectura React/TypeScript definida |
| MF-003 | DONE | Modelo canónico y versionado definido |
| MF-004 | DONE | Contratos de registries/renderers/exporters definidos |
| MF-005 | BLOCKED | Baseline React y workflow publicados; GitHub aún no crea runs de Actions |

## Quality gates requeridos para cerrar F00
- `npm run verify:repo`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:coverage`
- `npm run test:e2e`
- `npm run build`

## Bloqueo activo
`INFRA-002`: `.github/workflows/quality.yml` existe en `main` y PR #1 está abierto/mergeable, pero GitHub API devuelve cero workflow runs para los commits del PR. Revisar `Settings > Actions > General > Actions permissions` y permitir GitHub Actions y acciones de GitHub (`actions/checkout`, `actions/setup-node`, `actions/upload-artifact`).

## Regla de salida
F00 no puede marcarse DONE ni iniciar F01 hasta que los jobs `quality` y `e2e` estén verdes.
