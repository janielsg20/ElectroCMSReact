# MEMORY.md — Memoria técnica durable

## Proyecto y quality contract
ElectroCMS es un CMS visual local-first en React 19 + TypeScript strict + Vite. Studio Pro usa Tailwind CSS v4 donde corresponde. Vitest cubre unit/integration y Playwright E2E. GitHub Actions es la autoridad: no cerrar ni mergear con verify/lint/types/tests/coverage/E2E/build en rojo.

## Arquitectura durable
- Domain → Application → Infrastructure → Presentation.
- `CanonicalProject.schemaVersion = 1`; modelo canónico independiente de React/DOM.
- IndexedDB es el adapter web principal local-first.
- Widgets, themes y Field Types se resuelven mediante registries explícitos/versionados.
- Document edits usan comandos reversibles; recursos F05 usan APIs públicas de core a través de `ProjectSession`.
- Colecciones canónicas del proyecto nunca tienen stores paralelos.

## Studio Pro
- Único sistema visual del editor: `studio-pro`.
- `light`/`dark`/`auto` son modos del mismo Studio Pro; frontend/backend project themes son independientes.
- Desktop conserva toolbar + rail + navegador + canvas + inspector; compact/mobile es canvas-first con dock/sheets accesibles.
- No importar Bento ni UI/CSS histórica F05.

## F05 — Dynamic Content
`agent/f05-dynamic-content` es fuente histórica de contratos/tests, nunca base de merge.

### MF-037 Content Types — DONE
PR #34; Gate #1515; merge `748c6e61af114640a176665903b5f3bc0336ca07`.

### MF-038 Taxonomies — DONE
PR #41; Gate #1517; merge `7cf28bb23d2825fd6174f90720fd80cbe0314666`.

### MF-039 Field Type Registry — DONE
- Registry React-free por `type@version`, migraciones explícitas, plugins externos.
- 27 built-ins: 20 `available`, 7 `modeled` antes de microfases avanzadas.
- PR #42; Gate #1519; merge `0db52d1c8db88b70a6ce5c6275f14803397c9691`.

### MF-040 Custom Field Groups — DONE
- Field Groups/Custom Fields versionados, portables, ordenados y registry-driven.
- Group ID inmutable; field IDs/storage names únicos.
- Borrado bloqueado por Taxonomy.
- Studio Pro CRUD + autosave/reload.
- PR #44; Gate #1524; merge `dcef1c3302c2520a1911884624fb059eef09f4c0`.

### MF-041 Records CRUD — DONE
- `ContentRecordDefinition` v1: Content Type, status draft/published/archived, title/slug/excerpt/content, Field Groups/values, createdAt/updatedAt.
- Record id y `createdAt` inmutables; slug único dentro del Content Type.
- Defaults de Field Groups se normalizan; `required` sigue siendo obligatorio.
- Valores custom se validan por `FieldTypeRegistry` usando `type@version` y config del campo.
- Payloads de grupos no seleccionados/campos desconocidos se rechazan.
- Field Group deletion se bloquea tanto por Taxonomy como por Record.
- `ProjectSession` concentra Records CRUD + autosave.
- Studio Pro `RecordsCrudPanel`: búsqueda, filtros CPT/status, supports-aware core fields, grupos, value controls y validación.
- E2E comprueba IndexedDB real a través de create/reload/edit/archive/delete.
- PR #46; Gate #1528; merge `2aa05132b7c8303071ec33936fff9ca1d1c14fa1`.

## Invariantes F05
- Core content React-free.
- `CanonicalProject` es la única fuente persistente; UI no muta maps directamente.
- Mutación + validación + autosave pasan por `ProjectSession`.
- Field Types resuelven por `type@version`; `modeled` no significa funcional.
- Content Type deletion se bloquea mientras Records/Taxonomies lo usen.
- Field Group deletion se bloquea mientras Records/Taxonomies lo usen.
- No adelantar Relations/reference fields de MF-043 durante MF-042.
- No avanzar con un gate rojo.

## Accesibilidad durable
WCAG AA baseline, focus-visible, nombres accesibles en icon-only controls, sin hover/gesture-only, touch targets compactos >=48px, reduced motion/contrast/forced colors, browser zoom habilitado y sin root horizontal overflow.

## Trabajo actual
- Fase: **F05 — Dynamic Content**.
- Integrado: MF-037 a MF-041.
- Próxima microfase: **MF-042 — Advanced Fields**.
- Recuperar solo contrato/runtime/tests históricos de MF-042; mantener MF-043 Relations bloqueada.
- Deployments de preview son manual-only.
