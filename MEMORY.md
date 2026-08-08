# MEMORY.md — Memoria técnica durable

## Proyecto
ElectroCMS es un CMS visual local-first construido en React + TypeScript. El proyecto se desarrolla con quality gates estrictos y ninguna capacidad se considera cerrada con lint, tipos, tests, E2E o build en rojo.

## Toolchain confirmado
- React 19 + TypeScript strict + Vite.
- Tailwind CSS v4 está disponible en la capa Studio, junto con CSS semántico propio.
- Vitest para unit/integration.
- Playwright para E2E en navegador real.
- GitHub Actions es el entorno oficial de instalación/test/build porque el sandbox de ChatGPT no alcanza el registry npm público.
- `package-lock.json` está versionado y CI usa `npm ci`.
- Vercel es solo para previews manuales bajo petición explícita; `vercel.json` mantiene auto-deploy desactivado.

## Arquitectura durable
- Dependencias: Domain → Application → Infrastructure → Presentation.
- El modelo canónico no depende de React ni del DOM.
- UI/editor, renderer y exporters permanecen desacoplados.
- Persistencia se consume mediante contratos; componentes no acceden directamente a IndexedDB.
- Registries explícitos resuelven widgets y themes de proyecto; el core no debe crecer mediante `switch` por cada tipo.
- El DOM del canvas es proyección, nunca fuente de verdad.

## Modelo, persistencia y recovery
- `CanonicalProject.schemaVersion = 1`.
- `DocumentNode.version = 1`.
- Breakpoints canónicos: desktop, laptop, tablet landscape, tablet portrait, mobile large y mobile small.
- Responsive distingue `explicit`, `inherited` y `unset`.
- Web primary adapter: IndexedDB nativo.
- Stores iniciales: `projects` y `recoverySnapshots`.
- `load` pasa por hydration/migration antes de exponer datos editables.
- Autosave es debounced y serializado, con revisiones monotónicas y recovery snapshots limitados.
- Callbacks de save fusionan metadata y nunca sustituyen contenido editor más nuevo.

## Editor shell y routing
- Routing interno usa History API + `useSyncExternalStore`, sin dependencia de router externa.
- Workspaces estables: Editor, Preview, Backend y Export.
- El Studio dispone además de deep links para módulos de editor.
- `ProjectSessionProvider` vive por encima del outlet lógico; cambiar workspace no remonta proyecto, documento, breakpoint ni zoom.
- El threshold compacto del shell es 960px y es independiente de los breakpoints canónicos del proyecto generado.
- Desktop usa navegación persistente/resizable; tablet/móvil usan drawer accesible.
- Scroll horizontal denso se contiene localmente; el root no debe desbordar horizontalmente.

## Workspace preferences
- `WorkspacePreferences.schemaVersion = 1`.
- Se persisten separadas de `CanonicalProject`.
- Incluyen posición/ancho/collapse/display de navegación, orden de workspaces, density, last workspace, appearance mode y el identificador del editor visual system.
- Apariencia/layout del editor nunca altera frontend/backend generado.

## Regla UI/UX vigente — Bento High Density único
Desde la revisión de UI del 2026-08-08, ElectroCMS usa **un único tema UI/UX para el editor: `bento-high-density`**.

- Los antiguos presets seleccionables (High Density, Bento, Minimal, Material Expressive, SaaS, Enterprise, Glassmorphism, Sophisticated Dark, Monochrome y Developer Console) están retirados del producto.
- `EDITOR_THEME_PRESET_IDS` contiene solo `bento-high-density`.
- Payloads legacy de workspace preferences con IDs antiguos normalizan automáticamente al nuevo identificador único.
- La UI ya no expone selector de preset.
- `light` / `dark` / `auto` permanecen como **modos de apariencia del mismo tema**, no como temas distintos.
- Themes frontend/backend del proyecto siguen siendo un sistema independiente y exportable.

## Design system del editor
Fuentes de verdad:
- `design-system/electrocms-editor/MASTER.md`.
- `design-system/electrocms-editor/pages/editor.md` para el workspace Builder.
- Override final de implementación: `src/app/ui/bento-high-density.css`, cargado después del CSS V2 existente.

Arquetipo vigente:
- professional no-code builder;
- Bento Grid workspace;
- high-density productivity tool;
- design-system tooling;
- responsive/accessibility first.

Reglas visuales durables:
- gaps principales 6–8px;
- superficies principales agrupadas como módulos Bento, no cada fila como card;
- navegación con iconografía compartida en todos los workspaces/módulos principales;
- estados hover/focus/pressed/selected/disabled explícitos;
- micro-motion funcional en botones, iconos, drawers y popovers;
- motion basado preferentemente en transform/opacity;
- `prefers-reduced-motion` elimina motion no esencial;
- `prefers-contrast: more` fortalece límites;
- controles críticos touch >=44px;
- dense desktop no implica texto ilegible.

## Production Studio
- Navegación principal vive en `ProductionStudio`/`StudioRail`.
- Rail soporta left/right, resize accesible, collapse y modes icons/labels/both.
- Módulos principales usan shared `Icon` system.
- Builder combina insert library + editor/canvas dominante.
- Otras superficies Studio (Pages, Dynamic Content, Forms/Filters, Backend/Roles, Themes/Blueprints/Settings, Preview/Publishing) reutilizan el mismo sistema visual.
- Capacidades aún no implementadas se presentan con estado honesto, no CTAs engañosos.

## Canvas y árbol
- `CanonicalDocument.nodes + children` es la única fuente estructural persistente.
- `parentId`, depth y traversals se derivan runtime.
- Validator/tree engine rechazan missing/duplicate children, multiple parents, cycles y orphans.
- `CanvasRenderer` es proyección recursiva; overlays/drop targets no son datos del proyecto.
- DnD usa semántica `{nodeId,parentId,index}` y nunca reordena DOM como fuente de verdad.
- No usar React state que provoque rerender estructural durante `dragstart`; transient paint puede usar `data-*`.
- Hit areas deben permanecer geométricamente estables durante native drag.

## Canvas compatibility / responsive vigente
- Canvas sigue siendo la superficie dominante.
- Stage usa scroll local contenido y `overscroll-behavior` intencional.
- Documento escalado conserva transform origin estable `top center`.
- Padding del stage se reduce progresivamente en tablet/móvil.
- En layouts estrechos, inspector baja debajo del canvas y mantiene altura acotada.
- Insert library se convierte en strip horizontal en tablet/móvil.
- Command bars pueden usar scroll horizontal local.
- Nunca deshabilitar browser zoom.
- Root document no debe producir overflow horizontal.

## Selección, historial y geometría
- Selección simple/múltiple es estado transitorio y accesible por teclado.
- `DocumentCommand` guarda before/after de `CanonicalDocument`, nunca snapshots DOM.
- History es por documento; nuevo command limpia redo.
- Copy/Cut/Paste, Group/Ungroup, Lock/Hide y geometry edits son reversibles.
- Paste remapea IDs antes de insertar.
- X/Y/W/H usan `ResponsiveStyleSet` con `layout.x/y/width/height`.
- Grid snapping por defecto: 8px; threshold: 4px.
- Viewport edges/center tienen prioridad sobre grid dentro del threshold.
- Guides son transitorias.

## Widget system e inspector
- `WidgetRegistry` core es framework-neutral y resuelve `type@version`.
- Binding React vive en `EditorWidgetRegistry`; core no importa React.
- Inspector se genera desde schema y no mantiene copia persistente de props.
- Patch → nodo candidato → validación registry → command reversible.
- Campos/errores viven en UI transitoria.
- Inspector admite secciones colapsables para schemas largos.
- Layers navigator profesional permite search/rename/lock/hide/reorder mediante acciones canónicas.

## Style + breakpoint engine
- `DocumentNode.styles` es la única fuente de estilo responsive.
- Style engine resuelve `explicit`, `inherited`, `unset`.
- Renderer convierte solo subset seguro a `CSSProperties`.
- Breakpoint engine resuelve wider/narrower e inheritance chain nearest-first.
- Geometría y estilo visual comparten `ResponsiveStyleSet` sin mezclar responsabilidades.

## Project themes frontend/backend
Estos permanecen separados del editor Bento:
- `frontendThemeId` y `backendThemeId` viven en `CanonicalProject` y autosavean.
- `ProjectThemeRegistry` es framework-neutral y valida scope, ID, versión y tokens JSON portables.
- Built-ins siguen siendo inmutables y se duplican para editar.
- Copias locales incrementan versión en cada save.
- Theme packages usan `kind=electrocms-theme-package`, `schemaVersion=1`, máximo 256 KB.
- Imports/duplicados viven en librería local del editor; el proyecto referencia IDs.
- Import review precede apply.
- Merge de recursos es no destructivo.
- Demo data permanece opt-in.
- Usuarios, credenciales y binarios de media quedan fuera de los paquetes de theme.

## Accesibilidad durable
- WCAG AA como baseline.
- Focus visible para controles keyboard-operable.
- ARIA en icon-only controls.
- Labels semánticos en inputs/selects.
- No hover-only functionality.
- Status usa más que color.
- Reduced motion y increased contrast se respetan.
- Touch floor 44px en móvil.

## Quality gates
No cerrar/mergear trabajo con fallos en:
- repository verification;
- lint con cero warnings inesperados;
- TypeScript;
- unit/integration tests;
- coverage gate;
- Playwright E2E;
- production build.

## Trabajo actual
Rama: `agent/unified-bento-high-density-ui`.

Objetivo: consolidar definitivamente el editor en Bento High Density único, retirar selector/presets antiguos, mejorar motion/estados, layout responsive y compatibilidad del canvas, preservando arquitectura canónica y themes frontend/backend.

Antes de mergear, el quality gate completo de GitHub Actions debe estar verde.
