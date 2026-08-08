# ElectroCMS UI/UX Redesign — Fases de implementación

Este plan ejecuta `.ai/UI_UX_REDESIGN_MASTER.md` sin mezclar ni alterar el tracking funcional del CMS.

## Regla de avance
Cada fase UI debe cerrar con el gate completo del repositorio en verde antes de comenzar la siguiente.

## UI-01 — Foundation / Product Shell
**Objetivo:** establecer desde cero el lenguaje visual definitivo y la arquitectura base del Studio.

### Alcance
- Auditoría del chrome actual y dependencias visuales.
- Inventario de lógica funcional embebida en componentes de presentación.
- Nuevo sistema de tokens Tailwind: color, surface, type, spacing, radius, elevation, controls, focus, motion y z-index.
- Application Shell definitivo.
- Global project bar.
- Navegación principal y agrupación de dominios.
- Responsive shell desktop/tablet/mobile.
- Drawer accesible en layouts compactos.
- Preservar ProjectSession, routing, save state, undo/redo, document, breakpoint y zoom.
- Eliminar dependencias del chrome visual anterior una vez migradas.

### Criterio de cierre
Editor, Preview, Backend y Export comparten un shell coherente, responsive y accesible sin pérdida funcional.

## UI-02 — Builder Workspace
**Objetivo:** convertir Builder en el entorno de autoría visual definitivo.

### Alcance
- Canvas-first layout.
- Insert Library profesional.
- Search, categories, favorites/recent architecture preparada.
- Layers/Navigator.
- Inspector contextual.
- Context toolbar.
- Breakpoint/viewport controls.
- Zoom, rulers/guides/snapping presentation.
- Selection/hover/drop states.
- Split/resizable panels cuando aporte valor.

### Preservar
EditorCanvas, WidgetRegistry, WidgetInspector, command engine, history, selection, geometry y snapping.

## UI-03 — Pages / Templates / Assets
**Objetivo:** unificar navegación de documentos y recursos reutilizables.

- Pages.
- Templates.
- Global components.
- Saved widgets.
- Media Library.
- Search/filter/sort patterns compartidos.
- Data tables y grid/list modes.

## UI-04 — Dynamic Content Studio
**Objetivo:** rediseñar todas las superficies F05 bajo un patrón de administración de datos profesional.

- Content Types.
- Taxonomies.
- Field Groups.
- Records.
- Relations.
- Queries cuando existan.
- Schema/detail panes.
- Dense tables.
- Bulk actions.
- Validation/error presentation.

No crear comportamiento F05 que todavía no exista.

## UI-05 — Forms / Filters / Workflow
**Objetivo:** preparar la experiencia visual F06.

- Form Builder.
- Field library.
- Conditional UX.
- Post-submit actions.
- Smart Filters.
- Query connections.
- Workflow-style visual composition donde corresponda.

## UI-06 — Backend Builder / Roles
**Objetivo:** diseñar el builder administrativo generado.

- Dashboards.
- CRUD tables.
- Admin navigation.
- Metrics/charts surfaces.
- Roles & permissions.
- Field-level visibility/access.
- Generated backend preview.

## UI-07 — Themes / Blueprints / Settings
**Objetivo:** consolidar sistemas globales del producto.

- Theme Studio.
- Frontend themes.
- Backend themes.
- Editor appearance.
- Theme packages.
- Project Blueprints.
- General settings.
- Storage/recovery.
- Import/export settings.
- Project health.

## UI-08 — Preview / Publish / Final Polish
**Objetivo:** cerrar la experiencia end-to-end.

- Live Preview.
- Device preview.
- Compatibility diagnostics.
- Publishing Center.
- Local / React / LAMP / WordPress destinations.
- Status/result feedback.
- Command palette.
- Shortcuts discoverability.
- Empty/loading/error/success states.
- Full responsive audit.
- Accessibility audit.
- Removal of remaining legacy visual code.

## Gate obligatorio por fase

```bash
npm run verify:repo
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e
npm run build
```

## Tracking
- [ ] UI-01 Foundation / Product Shell
- [ ] UI-02 Builder Workspace
- [ ] UI-03 Pages / Templates / Assets
- [ ] UI-04 Dynamic Content Studio
- [ ] UI-05 Forms / Filters / Workflow
- [ ] UI-06 Backend Builder / Roles
- [ ] UI-07 Themes / Blueprints / Settings
- [ ] UI-08 Preview / Publish / Final Polish
