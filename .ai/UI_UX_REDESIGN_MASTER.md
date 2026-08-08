# ElectroCMS — UI/UX Redesign Master Contract

> Estado: **regla permanente del proyecto**.
> Esta especificación gobierna todo trabajo futuro relacionado con UI/UX, layout, navegación, chrome del editor, sistema visual y experiencia de usuario.
> La funcionalidad, arquitectura y contratos canónicos existentes tienen prioridad y no deben romperse durante el rediseño.

## Objetivo principal

Rediseñar completamente desde cero toda la UI/UX, apariencia visual, layout y sistema de diseño de ElectroCMS, utilizando como fuente funcional y arquitectónica principal el `PROMPT_MAESTRO` y toda la documentación `.md` del proyecto.

ElectroCMS debe concebirse específicamente como un **No-Code / Low-Code Visual CMS & Website Builder profesional**.

No mejorar ni retocar el diseño heredado. La nueva interfaz debe diseñarse conceptualmente desde una hoja en blanco.

## Qué puede reemplazarse por completo

- UI y UX actuales.
- Layout y distribución visual.
- Colores, surfaces y themes del editor.
- CSS/estilos exclusivamente visuales.
- Paneles, sidebars, topbars y toolbars.
- Navegación visual.
- Cards, boxes, bordes, sombras y radios.
- Espaciado y tipografía.
- Iconografía.
- Jerarquía visual.
- Estados hover/focus/active/selected.
- Responsive presentation.
- Inspector, Insert Library y Layers como presentación.
- Apariencia del canvas y sus overlays.
- Menús, popovers, dropdowns, modales, context menus y sheets.

**No conservar el diseño anterior como base visual.**

## Regla crítica: preservar funcionalidad

El rediseño es de presentación, interacción, composición visual y experiencia de usuario.

No eliminar, duplicar, sustituir por mocks ni romper funcionalidades reales ya implementadas, incluyendo:

- Arquitectura Domain → Application → Infrastructure → Presentation.
- CanonicalProject y estado canónico.
- Stores y repositorios.
- IndexedDB.
- Autosave y Recovery.
- Routing.
- Historial, Undo/Redo.
- Canvas funcional.
- Selección/multiselección.
- Drag & Drop.
- Move/resize/geometry/snapping/guides.
- Breakpoints y responsive engine.
- Widget Registry.
- Theme Registry.
- Field Registry.
- Inspector Schema.
- Custom Fields.
- Content Types.
- Taxonomies.
- Records.
- Advanced Fields.
- Relations y Dynamic Bindings cuando estén implementados.
- Theme system.
- Exporters.
- APIs y contratos existentes.
- Tests y accesibilidad funcional.

Debe existir **una sola fuente de verdad**. Nunca crear una implementación funcional paralela solo para servir al nuevo diseño.

## Fuente de verdad obligatoria

Antes de una fase de UI leer como mínimo:

- `PROMPT_MAESTRO_ELECTROCMS_REACT.md`
- `README.md`
- `RULES.md`
- `MEMORY.md`
- `PHASES.md`
- `DETAILED_EXECUTION_PHASES.md`
- `TRACKING.md`
- `.ai/`
- decisiones arquitectónicas y known issues relevantes.

El Prompt Maestro define qué debe ser ElectroCMS al finalizar. La UI debe contemplar la visión completa, no solo la funcionalidad ya terminada.

## Referencias de producto

Analizar patrones profesionales de herramientas No-Code, CMS visuales, design tools, IDEs y SaaS de productividad, usando como inspiración conceptual —sin copiar literalmente— productos como:

- Webflow
- Framer
- Figma
- Penpot
- Elementor
- Bricks Builder
- Breakdance
- Wix Studio
- Plasmic
- Builder.io
- Bubble
- WeWeb
- Retool
- Linear
- Vercel
- VS Code
- JetBrains IDEs
- Notion

Combinar buenas decisiones de navegación, jerarquía, densidad, toolbars, inspector, layers, command palette, propiedades, drag/drop, responsive editing, estados y accesibilidad.

ElectroCMS debe mantener identidad propia.

## Filosofía de diseño

ElectroCMS debe sentirse como **software profesional especializado**, no como landing page, dashboard SaaS genérico, colección de cards, demo o prototipo.

### High Density profesional
- Máxima información útil sin caos.
- Paneles y controles compactos.
- Jerarquía fuerte.
- Cero espacio muerto innecesario.

### Progressive Disclosure
- Acciones principales visibles.
- Opciones avanzadas mediante inspector, tabs, accordions, popovers, context menus y command palette.

### Canvas First
- El canvas es el protagonista del editor visual.
- Paneles ocupan únicamente el espacio necesario.
- Colapsables/redimensionables cuando aporte productividad.

### Contextual UI
- Herramientas cambian según selección, widget, breakpoint, documento y contexto.
- Preferir toolbars contextuales y controles flotantes cuando reduzcan fricción.

## Arquitectura visual objetivo

### 1. Application Shell
Shell permanente profesional con proyecto activo, navegación global, documento, estado de guardado, Preview, Backend, Export/Publish y configuración.

Evitar barras duplicadas y jerarquías confusas.

### 2. Navegación principal
Organizar profesionalmente:
- Builder
- Pages
- Templates
- Content
- Content Types
- Taxonomies
- Fields
- Records
- Relations
- Queries
- Forms
- Filters
- Media
- Themes
- Users
- Roles
- Backend Builder
- Blueprints
- Settings
- Preview
- Export

Agrupar por dominios; no convertir cada capacidad en un botón permanente sin contexto.

### 3. Editor Visual

#### Canvas
Debe sentirse como una herramienta de diseño profesional y mostrar correctamente zoom, viewport, breakpoint, rulers cuando correspondan, guides, snapping, selection bounds, resize handles, hover outlines, drop zones, nesting y responsive states.

#### Insert Library
Debe contemplar categorías, búsqueda, recientes, favoritos, filtros, miniaturas útiles, drag/drop e inserción rápida.

#### Layers
Jerarquía, nesting, visibility, lock, selection, groups y nombres personalizados.

#### Inspector
Organizar propiedades mediante Content, Layout, Size, Position, Spacing, Typography, Background, Border, Effects, Responsive, Dynamic y Advanced.

Usar tabs, segmented controls, inputs compactos, linked values, icon controls, popovers, color pickers y sliders donde tenga sentido.

Evitar formularios verticales interminables sin jerarquía.

## Responsive

Diseñar específicamente para:
- Desktop ultrawide
- Desktop
- Laptop
- Tablet landscape
- Tablet portrait
- Mobile

No escalar desktop mecánicamente.

Desktop prioriza productividad; tablet conserva la mayor capacidad posible; móvil usa drawers, sheets, bottom/context navigation cuando corresponda.

Nunca permitir overflow horizontal accidental del documento raíz.

## Design System

Definir y mantener:
- primitive tokens
- semantic tokens
- component tokens
- color roles
- surface hierarchy
- typography scale
- spacing scale
- border/radius/elevation system
- icon sizes
- control heights
- density rules
- interaction states
- motion tokens
- z-index layers

Evitar valores arbitrarios repetidos.

## Color

Crear una paleta profesional propia, diferenciada del diseño anterior, compatible con Light/Dark/Auto.

Usar acento con moderación para selección, foco y acciones primarias.

Evitar exceso de gradientes, saturación, apariencia gaming/infantil y glassmorphism indiscriminado.

## Tailwind CSS

Tailwind CSS es la base del nuevo sistema visual.

Usar:
- variables CSS y theme tokens
- utilities
- componentes/primitives reutilizables
- variantes claras

CSS tradicional queda reservado a canvas técnico, geometría, overlays, rendering especializado o casos donde Tailwind reduzca claridad.

No crear otro stylesheet monolítico del chrome.

## UI primitives

Construir una biblioteca interna coherente de primitives reutilizables cuando sea necesario:

- Button / IconButton
- Input / NumberInput
- Select / Combobox
- Checkbox / Switch
- Slider
- Tabs
- Tooltip
- Popover
- Dropdown
- ContextMenu
- Accordion
- Dialog / Sheet
- CommandPalette
- SplitPane / ResizablePanel
- Tree
- DataTable
- EmptyState
- Badge
- Toast

Un mismo control no debe tener diseños distintos en cada módulo.

## Iconografía

- SVG consistente.
- No emojis como iconos de producto.
- Misma familia visual de stroke, tamaño, proporción y alineación.
- Priorizar iconos para reconocimiento rápido, sin sacrificar labels accesibles.

## Microinteracciones

Añadir transiciones discretas para hover, pressed, focus, drag/drop, resize, selección, paneles y feedback.

No usar animaciones decorativas innecesarias.

Respetar `prefers-reduced-motion`.

## Accesibilidad

Mantener o mejorar:
- teclado
- focus visible
- ARIA
- contraste WCAG
- touch targets adecuados
- labels accesibles
- orden DOM lógico
- reduced motion

La estética nunca justifica romper accesibilidad.

## Funciones todavía no implementadas

No mostrar puntos rojos, badges de desarrollo o mensajes persistentes de `coming soon`.

Las superficies finales pueden existir desde ahora. Cuando una acción todavía no tenga runtime seguro:
- deshabilitarla discretamente,
- ocultar solo la acción imposible,
- o mostrar la estructura final sin fingir que ejecuta una función real.

No crear funcionalidad falsa.

## Eliminación del diseño anterior

Después de migrar una superficie:
1. identificar código puramente visual heredado;
2. extraer cualquier lógica funcional mezclada;
3. conectar esa lógica a la nueva superficie;
4. comprobar tests;
5. eliminar visual legacy y estilos duplicados.

Nunca borrar lógica funcional solo porque esté alojada dentro de un componente visual antiguo.

## No crear demos paralelas

No crear `NewUIDemo`, `RedesignPreview`, `FinalProductDemo`, query params temporales ni una segunda aplicación.

La nueva UI se implementa directamente como interfaz oficial del producto.

## Calidad de código

Mantener React 19, TypeScript strict, componentes divididos por responsabilidades, hooks especializados, mínima duplicación y la arquitectura existente.

No introducir lógica de dominio en componentes visuales.

## Tests

Actualizar tests solo cuando dependan legítimamente de estructura visual antigua.

Nunca cambiar tests para ocultar bugs.

Añadir cobertura para navegación, responsive, drawers, paneles, inspector, accesibilidad, persistencia de preferencias, ausencia de overflow e interacciones críticas.

## Validación obligatoria por fase

Cada fase UI debe cerrar con:

```bash
npm run verify:repo
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e
npm run build
```

Todo debe quedar GREEN antes de avanzar.

## Viewports mínimos de revisión

- 1920×1080
- 1440×900
- 1280×800
- 1024×768
- 768×1024
- 430×932
- 390×844
- 360×800

Revisar alignment, spacing, proporciones, panel widths, scroll, overflow, truncation, icon alignment, legibilidad, contraste, selected states, drawers, inspector y canvas disponible.

## Resultado esperado

El producto debe sentirse creado por un equipo senior de Product Design + UX + Frontend Engineering.

Debe ser inmediatamente reconocible como un **Professional No-Code CMS / Visual Website & Backend Builder**: sólido, moderno, rápido, compacto, escalable, preciso y coherente.

La nueva UI debe sostener el resto del desarrollo sin requerir otro rediseño total.

## Regla final

**No adaptar el nuevo diseño al diseño existente. Adaptar las funciones existentes al nuevo diseño.**

Preservar el producto y su arquitectura. Reemplazar completamente su presentación basándose en el Prompt Maestro y en prácticas modernas de editores profesionales No-Code.
