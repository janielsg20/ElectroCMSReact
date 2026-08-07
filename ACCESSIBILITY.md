# ACCESSIBILITY.md

## Baseline
ElectroCMS debe ser operable por teclado, táctil y tecnologías de asistencia. La accesibilidad se valida tanto en el editor como, en fases posteriores, en los proyectos generados.

## F02 — Editor shell
- Focus visible global para botones, selects, summaries, links y controles con `tabIndex`.
- Skip link `Skip to workspace` hacia el contenido principal.
- Navegación primaria usa `aria-current="page"` para el workspace activo.
- Drawer compacto usa `role="dialog"`, `aria-modal="true"`, foco inicial en Close y cierre con Escape/click exterior.
- El resizer de navegación usa `role="separator"`, valores ARIA y ArrowLeft/ArrowRight como alternativa al puntero.
- Botones icon-only conservan nombre accesible/título.
- Inputs/selects compactos tienen labels accesibles aunque el texto visual sea mínimo.
- Estados no disponibles como Undo/Redo se exponen realmente `disabled` en vez de simular interacción.
- En móvil los targets críticos aumentan hasta ~36–44px y ninguna función principal desaparece.
- La segunda fila del header puede desplazarse horizontalmente de forma local en pantallas pequeñas; el documento raíz no crea overflow accidental.
- `prefers-reduced-motion: reduce` minimiza transiciones/animaciones.

## Validación F02
Playwright cubre:
- navegación y controles en desktop;
- disponibilidad de funciones en tablet 820×1180;
- drawer accesible y ausencia de root overflow en móvil 390×844;
- navegación en modo iconos/collapsed después de reload.

## Pendiente por fases
- Auditoría axe/ARIA más amplia cuando existan canvas, inspector, widgets y formularios reales.
- Estrategia completa de focus management para menús contextuales, modales y DnD en fases posteriores.
- Semántica de widgets exportados se valida en F04+ y exportadores en F09+.
