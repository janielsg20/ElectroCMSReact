# MEMORY.md — Memoria técnica durable

## Proyecto y quality contract
ElectroCMS es un CMS visual local-first construido en React 19 + TypeScript strict + Vite. Tailwind CSS v4 está disponible para el Studio. Vitest cubre unit/integration y Playwright cubre E2E. GitHub Actions es el entorno oficial de verificación. No cerrar ni mergear trabajo con verify/lint/types/tests/coverage/E2E/build en rojo.

## Arquitectura durable
- Domain → Application → Infrastructure → Presentation.
- `CanonicalProject.schemaVersion = 1`.
- El modelo canónico no depende de React/DOM.
- Canvas/renderer es proyección, nunca fuente de verdad.
- Persistencia se consume mediante contratos; IndexedDB es el adapter web principal.
- Widgets y project themes se resuelven por registries explícitos.
- Mutaciones estructurales/props/styles pasan por comandos canónicos reversibles.

## Routing y shell
- Workspaces: Editor, Preview, Backend, Export.
- Studio modules tienen deep links.
- `ProjectSessionProvider` permanece por encima del outlet lógico.
- El shell compacto se activa a 960px y es independiente de los breakpoints del proyecto generado.
- Desktop usa rail persistente; compact usa drawer accesible.
- Root horizontal overflow está prohibido.

## Editor visual system vigente — Studio Pro
Desde 2026-08-08/09, ElectroCMS usa un único visual system para el editor: **`studio-pro`**.

- El anterior `bento-high-density` está retirado.
- No existen hojas `bento-high-density.css`, `bento-modern-polish.css` ni las capas `reference-builder-*` anteriores en el bundle.
- `EDITOR_THEME_PRESET_IDS` contiene únicamente `studio-pro`.
- Workspace preferences legacy con Bento u otros preset IDs normalizan automáticamente a `studio-pro` sin cambiar `WorkspacePreferences.schemaVersion = 1`.
- No existe selector de visual preset en UI.
- `light` / `dark` / `auto` son modos de apariencia del mismo Studio Pro.
- Frontend/backend project themes siguen siendo independientes y exportables.

## Implementación visual
Fuente de verdad:
- `design-system/electrocms-editor/MASTER.md`.
- `design-system/electrocms-editor/pages/editor.md`.
- `src/app/ui/studio-pro-tailwind.css` como única capa visual final de Studio Pro.

Studio Pro es **Tailwind-first**: layout/spacing/typography/states usan utilities y `@apply`; custom properties quedan para roles semánticos, canvas/elevation y casos que no deben convertirse en clases ad-hoc. No acumular nuevas hojas “polish/fix/fidelity”; corregir el sistema o componente fuente.

## Desktop Builder
Composición objetivo inspirada en constructores visuales profesionales:
- app toolbar ≈60px;
- icon rail ≈60px;
- Pages/Components navigator ≈276–304px;
- canvas flexible/dominante;
- Properties inspector ≈318–344px.

Pages/Components tabs, canvas toolbar e inspector comparten origen vertical. `studio-context-bar` y `builder-document-bar` se ocultan en desktop Builder porque duplican contexto. El toolbar V2 neutraliza offsets legacy del canvas.

## Compact/mobile Builder — canvas-first
En `compactLayout` no se renderizan persistentemente Pages/Components ni Inspector.

Vista default:
- header compacto;
- canvas ocupando el workspace;
- contextual command bar solo cuando hay selección;
- bottom dock: **Pages / Add / Layers / Properties**.

Panels:
- Pages → sheet con documentos + Widget Tree canónico.
- Add → sheet con búsqueda/categorías/widget insertion; se cierra tras insertar.
- Layers → sheet reutilizando `LayersNavigator` canónico.
- Properties → sheet reutilizando `WidgetInspector` schema-driven.

Los sheets usan `role=dialog`, `aria-modal`, Close visible, `Escape`, backdrop dismissal y autofocus en Close. Hidden desktop panels no quedan focusables en móvil. Touch targets compactos usan floor 48px y el dock respeta `env(safe-area-inset-bottom)`.

A <=720px el header se reduce a una sola fila de ~60px: navegación + documento + primary action area. Secondary desktop chrome puede ocultarse para proteger el canvas siempre que no se convierta en la única ruta a una función crítica.

## Canvas
- `CanonicalDocument.nodes + children` es la única estructura persistente.
- DnD usa `{nodeId,parentId,index}`.
- Hit areas permanecen geométricamente estables durante drag.
- Stage tiene scroll local, overscroll containment y stable top-center transform origin.
- Browser zoom permanece habilitado.
- Grid/guides/snapping son overlays transitorios.
- Compact stage reserva padding inferior para el dock.
- Compact command bar se oculta cuando `data-selection-count=0`; cuando aparece, controles touch son >=48px y el strip puede scrollear localmente.

## Inspector / Layers / Widgets
- Widget registry core es framework-neutral.
- Inspector se genera desde schema; no duplica props persistentes.
- Layers search/rename/lock/hide/reorder ejecutan acciones canónicas.
- Mobile sheets solo cambian presentación, no introducen estado persistente paralelo.

## Responsive styles y breakpoints
- `DocumentNode.styles` es la única fuente responsive.
- Estados: `explicit`, `inherited`, `unset`.
- Breakpoint inheritance nearest-first.
- Geometría X/Y/W/H usa el mismo `ResponsiveStyleSet` sin mezclar responsabilidades.
- Breakpoints del proyecto y breakpoint del shell del editor son conceptos separados.

## Project themes frontend/backend
- `frontendThemeId` / `backendThemeId` permanecen en `CanonicalProject`.
- ProjectThemeRegistry valida scope/id/version/tokens.
- Built-ins son inmutables; se duplican para editar.
- Theme packages siguen schema portable y no incluyen credenciales/usuarios/binarios.
- Nunca usar editor appearance/Studio Pro para mutar output themes.

## Accesibilidad durable
- WCAG AA baseline.
- focus-visible en controles keyboard-operable.
- icon-only controls con accessible names.
- no hover-only functionality.
- no gesture-only dismissal.
- touch targets compactos >=48px.
- reduced motion / increased contrast / forced colors soportados.
- browser zoom habilitado.
- no root horizontal overflow.
- E2E debe cubrir dock/sheets/drawer y geometría desktop.

## Trabajo actual
Rama: `agent/unified-bento-high-density-ui` / draft PR #36 (nombre histórico de rama; el producto ya no usa Bento).

Objetivo actual: reemplazar completamente la UI Bento por Studio Pro Tailwind, mantener el desktop similar a la referencia de visual builder y convertir móvil/tablet en canvas-first con dock y sheets accesibles. Antes de mergear, el quality gate del último head debe quedar completamente verde.
