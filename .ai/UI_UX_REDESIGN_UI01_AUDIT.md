# UI-01 — Auditoría de Foundation / Product Shell

## Estado
**IN_PROGRESS**

## Objetivo
Reemplazar la foundation visual y el shell del producto sin alterar contratos funcionales ni estado canónico.

## Hallazgos del shell actual

### Correcto y debe preservarse
- `ProjectSession` permanece por encima de la navegación.
- Rutas oficiales `/editor`, `/preview`, `/backend`, `/export`.
- Documento, breakpoint, zoom y save-state reales.
- Undo/Redo real.
- `EditorCanvas` canónico.
- `WidgetRegistry` real como fuente de Insert Library.
- `WidgetInspector` generado desde schema.
- Workspace preferences separadas del proyecto.
- Drawer accesible para layout compacto.
- Tailwind CSS v4 ya forma parte del toolchain.
- `prefers-reduced-motion` disponible.

### Debe sustituirse visualmente
- Paleta hardcodeada principalmente `blue/slate` en componentes.
- Rail oscuro demasiado dominante y cercano a un developer console genérico.
- Jerarquía basada en múltiples bloques con bordes similares.
- Varias acciones y superficies usan clases Tailwind largas directamente en componentes sin primitives semánticas suficientes.
- Canvas/Inspector tienen bridge styles correctos funcionalmente, pero requieren un lenguaje visual nuevo y más sistemático.
- Application shell necesita mejor separación entre navegación global, contexto del proyecto y herramientas del documento.

### Violaciones del nuevo contrato
- `ProductionStudio.tsx` contiene `ImplementationState`.
- `ProductionStudio.tsx` contiene `ImplementationDot` y estados `ready/partial/planned` usados visualmente.
- La nueva especificación prohíbe puntos rojos/badges/estado visual de desarrollo.
- Esos indicadores deben eliminarse; una función futura debe mostrarse integrada, deshabilitarse discretamente cuando corresponda o mantenerse estructural sin fingir runtime.

## Foundation V2 propuesta

### Identidad visual
ElectroCMS V2 utilizará una identidad profesional sobria basada en:
- **Graphite** para chrome y navegación.
- **Porcelain/Warm neutral** para surfaces y canvas surroundings.
- **Teal/Aqua** como acento de selección/foco/product action.
- **Violet** únicamente como acento secundario contextual, nunca compitiendo con el teal.

La UI no debe parecer clon de Vercel/Linear/Figma; toma sus principios de claridad y densidad, pero mantiene identidad ElectroCMS.

### Surface hierarchy
1. App background.
2. Navigation chrome.
3. Workspace surface.
4. Raised/interactive panels.
5. Floating popovers/sheets.
6. Canvas/document surface.

### Densidad
- Desktop: 30–36px controles estándar.
- Toolbars: 28–32px.
- Touch layouts: >=44px para controles críticos.
- Base spacing: 4/8px.

### Layout base
Desktop:
`Global bar → Domain rail → Context panel → Canvas/workspace → Inspector`

Tablet:
`Global bar → compact domain navigation → workspace → contextual sheets`

Mobile:
`Global bar → workspace → bottom/context actions + drawers/sheets`

## Cambios UI-01

### Foundation
- [ ] Nuevos semantic tokens Tailwind/CSS.
- [ ] Nuevo color system Light/Dark.
- [ ] Elevation/radius/control tokens.
- [ ] Focus ring system.
- [ ] Motion tokens.

### Shell
- [ ] Eliminar `ImplementationState` y `ImplementationDot` del chrome.
- [ ] Eliminar dependencia visual de estado de desarrollo.
- [ ] Separar Primary Workspaces de Studio Domains sin duplicar navegación.
- [ ] Reequilibrar rail/global bar/canvas para maximizar área útil.
- [ ] Mantener workspace preference contracts.

### Responsive
- [ ] 1440×900
- [ ] 1280×800
- [ ] 1024×768
- [ ] 768×1024
- [ ] 430×932
- [ ] 390×844
- [ ] 360×800

## Criterios de aceptación
- Cero pérdida funcional.
- Cero puntos/badges de estado de desarrollo.
- Un solo shell oficial.
- Canvas mantiene prioridad visual.
- Root sin overflow horizontal.
- Navegación completa por teclado.
- Gate completo GREEN antes de UI-02.
