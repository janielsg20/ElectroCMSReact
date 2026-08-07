# TRACKING.md — Estado de ejecución

## Estado global
- Estado: READY
- Fase completada: F01 — Foundation, estado y persistencia
- Siguiente fase: F02 — Editor shell y workspace responsive
- Siguiente microfase: MF-013 — App shell y routing interno
- Último quality gate completo: GitHub Actions run #72 PASS
- Último build válido: GitHub Actions run #72 PASS
- Repositorio oficial: `janielsg20/ElectroCMSReact`
- PR de fase: #2 `agent/f01-foundation -> main`

## F00
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-000 | DONE | Inventario del proyecto completado |
| MF-001 | DONE | Gap analysis completado |
| MF-002 | DONE | Arquitectura React/TypeScript definida |
| MF-003 | DONE | Modelo canónico y versionado definido |
| MF-004 | DONE | Contratos de registries/renderers/exporters definidos |
| MF-005 | DONE | CI base con lint, types, tests, coverage, build y E2E |

## F01
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-006 | DONE | React/TypeScript strict, `package-lock.json`, CI reproducible con `npm ci` |
| MF-007 | DONE | Core domain independiente de React/DOM: JSON, errores, Result e IDs tipados |
| MF-008 | DONE | `CanonicalProject` schema v1, factory, seis breakpoints y validación de integridad del árbol |
| MF-009 | DONE | `ProjectRepository` + adapter in-memory con clones defensivos y conflicto en create duplicado |
| MF-010 | DONE | CRUD IndexedDB transaccional + recovery store + Playwright reload E2E |
| MF-011 | DONE | Migration registry ordenado, v0→v1, rechazo de schemas futuros e integración desde IndexedDB |
| MF-012 | DONE | Autosave debounced/serializado, revisión incremental y recovery snapshots limitados |

## Quality gates F01
- `npm run verify:repo` — PASS
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS
- `npm run test:coverage` — PASS
- `npm run test:e2e` — PASS
- `npm run build` — PASS

## Incidencias resueltas en F01
- El sandbox no accede al registry npm: GitHub Actions es el entorno oficial de instalación/validación.
- `package-lock.json` generado una sola vez en GitHub y versionado; workflow final vuelve a `contents: read` y usa `npm ci`.
- Error de constraint de IndexedDB preservado como `CONFLICT` en vez de `PERSISTENCE_ERROR` genérico.
- Listeners de finalización de transacciones de lectura registrados antes de esperar requests para evitar carreras.
- Errores de validación/migración preservados por el adapter y no ocultados por la capa de persistencia.

## Evidencia de cierre
GitHub Actions `ElectroCMS Quality Gates`, run #72, commit `12dab9991e44d571889714f75b53200d14abaf8e`: `success`.

## Regla de salida
F01 queda completada funcionalmente con sus gates verdes. El commit de cierre documental debe volver a pasar el mismo workflow antes de integrar PR #2. Después puede comenzar F02/MF-013.
