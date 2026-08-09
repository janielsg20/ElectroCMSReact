# MEMORY.md — Memoria técnica durable

## Proyecto y quality contract
ElectroCMS es un CMS visual local-first construido en React 19 + TypeScript strict + Vite. Tailwind CSS v4 está disponible para Studio Pro. Vitest cubre unit/integration y Playwright cubre E2E. GitHub Actions es el entorno oficial de verificación. No cerrar ni mergear trabajo con verify/lint/types/tests/coverage/E2E/build en rojo.

## Arquitectura durable
- Domain → Application → Infrastructure → Presentation.
- `CanonicalProject.schemaVersion = 1`.
- El modelo canónico no depende de React/DOM.
- Canvas/renderer es proyección, nunca fuente de verdad.
- IndexedDB es el adapter web principal de persistencia local-first.
- Widgets, project themes y Field Types se resuelven mediante registries explícitos y versionados.
- Mutaciones de documentos usan comandos reversibles; mutaciones F05 usan APIs públicas de core expuestas por `ProjectSession`.
- No crear stores paralelos para colecciones canónicas del proyecto.

## Routing y shell
- Workspaces: Editor, Preview, Backend, Export.
- `ProjectSessionProvider` permanece por encima del routing lógico.
- El shell compacto se activa a 960px y es independiente de los breakpoints del proyecto generado.
- Root horizontal overflow está prohibido.

## Editor visual system vigente — Studio Pro
ElectroCMS usa un único sistema visual para el editor: **`studio-pro`**.

- `light` / `dark` / `auto` son modos de apariencia del mismo Studio Pro.
- Frontend/backend project themes siguen siendo independientes y exportables.
- Desktop: toolbar, rail compacto, Pages/Components, canvas dominante e inspector Properties/Design.
- Compact/mobile: canvas-first con dock Pages/Add/Layers/Properties y sheets accesibles.
- Browser zoom permanece habilitado.
- UI legacy Bento/F05 no debe reintroducirse.

## Canvas e inspector
- `CanonicalDocument.nodes + children` es la única estructura persistente del canvas.
- DnD hit geometry permanece estable durante el gesto.
- Selection, guides, sheets y clipboard UI son transitorios.
- Inspector es schema-driven y no duplica estado persistente.
- `DocumentNode.styles` es la fuente responsive; herencia de breakpoints es nearest-first.

## F05 — Dynamic Content
La fase actual se integra microfase por microfase sobre el `main` moderno. `agent/f05-dynamic-content` es solo fuente histórica de contratos/tests.

### MF-037 Content Types — DONE
- Canonical `project.contentTypes` es la única fuente.
- CRUD validado por core y expuesto por `ProjectSession`.
- Studio Pro CRUD + autosave + IndexedDB reload E2E.
- PR #34; Quality Gate #1515 PASS; merge `748c6e61af114640a176665903b5f3bc0336ca07`.

### MF-038 Taxonomies — DONE
- Taxonomy v1: id/labels/slug/description/hierarchy, Content Type associations, optional Field Groups/archive template.
- Referencias validadas antes de mutar; IDs inmutables; duplicate IDs/slugs rechazados.
- Studio Pro CRUD + autosave/reload E2E.
- PR #41; Quality Gate #1517 PASS; merge `7cf28bb23d2825fd6174f90720fd80cbe0314666`.

### MF-039 Field Type Registry — DONE
- Core React-free por `type@version` con clones defensivos y migraciones explícitas.
- 27 contratos builtin; 20 `available`, 7 `modeled` para runtime posterior.
- Plugins externos pueden registrar tipos sin modificar el registry.
- PR #42; Quality Gate #1519 PASS; merge `0db52d1c8db88b70a6ce5c6275f14803397c9691`.

### MF-040 Custom Field Groups — DONE
- `FieldGroupDefinition`/`CustomFieldDefinition` versionados y portables.
- Orden de campos explícito; IDs y storage names únicos; Group ID inmutable.
- Config/default values validados por el registry MF-039 usando `type@version`.
- Solo los 20 tipos `available` son instanciables en MF-040; los 7 `modeled` siguen bloqueados.
- Borrado bloqueado si una Taxonomy referencia el Field Group.
- `ProjectSession` concentra create/update/remove y autosave.
- Studio Pro `FieldGroupsCrudPanel` permite CRUD, ordenar campos, elegir tipos, editar metadatos/config/defaults y muestra límites de tipos modeled.
- E2E demuestra persistencia completa entre recargas.
- PR #44; Quality Gate #1524 PASS; merge `dcef1c3302c2520a1911884624fb059eef09f4c0`.

## Invariantes F05
- Core content siempre React-free.
- Colecciones de `CanonicalProject` son la única fuente persistente.
- UI nunca muta directamente maps canónicos.
- Validación + mutación + autosave deben permanecer atómicos a través de `ProjectSession`.
- Comportamiento de Field Types se resuelve por `type@version`.
- `modeled` no significa funcional.
- No importar UI/CSS histórica de la rama legacy.
- No avanzar de microfase con un gate rojo.

## Accesibilidad durable
- WCAG AA baseline.
- focus-visible en controles keyboard-operable.
- icon-only controls con accessible names.
- no hover-only ni gesture-only functionality.
- touch targets compactos >=48px.
- reduced motion / increased contrast / forced colors soportados.
- browser zoom habilitado.

## Trabajo actual
- Fase: **F05 — Dynamic Content**.
- Completado en la línea moderna: MF-037, MF-038, MF-039, MF-040.
- Próxima microfase: **MF-041 — Records CRUD**.
- Iniciar MF-041 desde un branch fresco de `main`; recuperar únicamente su contrato/tests históricos antes de adaptar la UI a Studio Pro.
- Deployments de preview continúan siendo manual-only.
