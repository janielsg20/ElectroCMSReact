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
ElectroCMS usa un único sistema visual para el editor: **`studio-pro`**.

- `EDITOR_THEME_PRESET_IDS` contiene únicamente `studio-pro`.
- Preferencias de workspace con un preset no reconocido normalizan automáticamente a `studio-pro` sin cambiar `WorkspacePreferences.schemaVersion = 1`.
- No existe selector de visual presets del editor.
- `light` / `dark` / `auto` son modos de apariencia del mismo Studio Pro.
- Frontend/backend project themes siguen siendo independientes y exportables.

## Dirección visual vigente
La referencia principal del shell es un visual builder profesional: toolbar superior continua, rail de iconos estrecho, navegador Pages/Components, canvas dominante e inspector Properties persistente en desktop.

Principios:
- superficies continuas y separadores de 1px;
- radios contenidos, sin mosaicos decorativos ni tarjetas flotantes innecesarias;
- color usado como señal funcional, no como decoración;
- azul = navegación/edición principal;
- violeta = creación/publicación;
- cian/verde = datos/acciones;
- ámbar = ajustes/estado;
- microanimaciones de 140–180ms en iconos/botones;
- `prefers-reduced-motion` desactiva animaciones no esenciales.

Fuente visual final:
- `src/app/ui/studio-pro-tailwind.css` para la base Tailwind-first.
- `src/app/ui/studio-pro.css` como entrypoint final y autoridad de compatibilidad/fidelidad visual.
- `design-system/electrocms-editor/MASTER.md`.
- `design-system/electrocms-editor/pages/editor.md`.

## Desktop Builder
Composición objetivo:
- app toolbar ≈64px;
- icon rail ≈60px;
- Pages/Components navigator ≈300px;
- canvas flexible/dominante;
- Properties inspector ≈336px.

Pages/Components tabs, canvas toolbar e inspector comparten origen vertical. El rail desktop no repite el logo del application header. El toolbar V2 neutraliza offsets legacy del canvas.

## Compact/mobile Builder — canvas-first
En `compactLayout` no se renderizan persistentemente Pages/Components ni Inspector.

Vista default:
- header de una fila ≈60px;
- canvas ocupando el workspace;
- contextual command bar solo cuando hay selección;
- bottom dock: **Pages / Add / Layers / Properties**.

Panels:
- Pages → sheet con documentos + Widget Tree canónico.
- Add → sheet con búsqueda/categorías/widget insertion; se cierra tras insertar.
- Layers → sheet reutilizando `LayersNavigator` canónico.
- Properties → sheet reutilizando `WidgetInspector` schema-driven.

Los sheets usan `role=dialog`, `aria-modal`, Close visible, `Escape`, backdrop dismissal y autofocus en Close. Touch targets compactos usan floor 48px y el dock respeta `env(safe-area-inset-bottom)`.

## Canvas
- `CanonicalDocument.nodes + children` es la única estructura persistente.
- DnD usa `{nodeId,parentId,index}`.
- Hit areas permanecen geométricamente estables durante drag.
- Stage tiene scroll local, overscroll containment y stable top-center transform origin.
- Browser zoom permanece habilitado.
- Grid/guides/snapping son overlays transitorios.
- Compact stage reserva padding inferior para el dock.

## Inspector / Layers / Widgets
- Widget registry core es framework-neutral.
- Inspector se genera desde schema; no duplica props persistentes.
- Tabs visibles del inspector: `Properties` y `Design`.
- Layers search/rename/lock/hide/reorder ejecutan acciones canónicas.
- Mobile sheets solo cambian presentación, no introducen estado persistente paralelo.

## Responsive styles y breakpoints
- `DocumentNode.styles` es la única fuente responsive.
- Estados: `explicit`, `inherited`, `unset`.
- Breakpoint inheritance nearest-first.
- Geometría X/Y/W/H usa el mismo `ResponsiveStyleSet` sin mezclar responsabilidades.
- Breakpoints del proyecto y breakpoint del shell del editor son conceptos separados.

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
Rama: `agent/studio-reference-ui-polish` / draft PR #38.

Objetivo actual: acercar toda la interfaz Studio Pro a la referencia visual proporcionada, incluyendo desktop y móvil, con color funcional moderado, microanimaciones y sin degradar el canvas-first mobile layout. Antes de mergear, el quality gate del último head debe quedar completamente verde.
