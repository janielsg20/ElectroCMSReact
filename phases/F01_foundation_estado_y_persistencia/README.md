# F01 — Foundation, estado y persistencia

## Objetivo
Construir el núcleo durable de ElectroCMS antes del editor visual: bootstrap reproducible, dominio independiente de React, schema canónico validado, persistencia local, migraciones y recuperación.

## Microfases
- MF-006 — Bootstrap React TypeScript.
- MF-007 — Core domain package.
- MF-008 — Project model y validators.
- MF-009 — Repository contracts + memory adapter.
- MF-010 — IndexedDB persistence adapter.
- MF-011 — Migrations registry.
- MF-012 — Autosave y recovery.

## Criterios concretos
- El core no importa React/ReactDOM.
- `CanonicalProject` v1 tiene factory y validator.
- Repositorio en memoria y IndexedDB comparten contrato.
- IndexedDB soporta create/save/load/list/delete.
- Datos antiguos pasan por migration registry antes de editarse.
- Autosave es debounced, serializado y crea recovery snapshots limitados.
- Una prueba Playwright demuestra persistencia tras reload.

## Gate de fase
`verify:repo`, lint, typecheck, unit/integration, coverage, E2E y build deben estar verdes. CI debe usar `npm ci` cuando el lockfile quede incorporado.
