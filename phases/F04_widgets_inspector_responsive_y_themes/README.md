# F04 — Widgets, inspector, responsive y themes

## Estado
FUNCTIONALLY DONE — cierre documental/final gate pendiente antes de merge.

## Objetivo
Completar widgets, inspector, responsive y themes mediante slices pequeñas y verificables, preservando el modelo canónico F03 y convirtiendo el editor en una base coherente de no-code builder profesional.

## Microfases
- MF-027 — Widget registry runtime — DONE — run #424 PASS
- MF-028 — Structural widgets — DONE — run #434 PASS
- MF-029 — Basic/content widgets — DONE — run #446 PASS
- MF-030 — Dynamic/commerce/form/filter widget contracts — DONE — run #456 PASS
- MF-031 — Inspector schema engine — DONE — run #479 PASS
- MF-032 — Style engine — DONE — run #505 PASS
- MF-033 — Breakpoint engine — DONE — run #529 PASS
- MF-034 — Editor theme presets — DONE — run #568 PASS
- MF-035 — Frontend/backend theme system — DONE — run #662 PASS
- MF-036 — Theme packages import/export — DONE — run #688 PASS

## Resultados durables
- Widget registry framework-neutral por `type@version` + binding React separado.
- 45 built-in widget contracts: 10 structural, 16 basic/content y 19 dynamic/commerce/form/filter `modeled`.
- Inspector generado desde schema con validación y Undo/Redo real.
- Style engine y breakpoint inheritance sobre `ResponsiveStyleSet`, sin almacenamiento paralelo.
- DnD no-code con hit areas estables y feedback transitorio sin rerender React durante gesto nativo.
- 10 presets visuales del editor separados del proyecto.
- `ProjectThemeRegistry` con 8 themes frontend + 7 backend.
- Built-ins inmutables; duplicación local editable y versionado automático.
- Frontend/backend theme selection independiente y autosave real.
- Theme package schema v1, 256 KB, portable JSON validation y biblioteca local.
- Export/import selectivo por Pages/Templates, Content Models, Query Tools, Roles/Backend y Demo Data.
- Demo Data opt-in y desactivada por defecto.
- Import en dos pasos: validate/review → apply.
- Merge no destructivo: IDs existentes se preservan y reportan, nunca se sobrescriben.
- Editor design system persistido en `design-system/electrocms-editor/`.
- Auto-deploy Vercel desactivado; deployment solo manual.

## Design system obligatorio desde F04
Antes de modificar UI del editor, leer:
1. `design-system/electrocms-editor/MASTER.md`
2. `design-system/electrocms-editor/pages/editor.md` cuando se trabaje en el workspace visual.

El estándar adapta principios relevantes del repo público `nextlevelbuilder/ui-ux-pro-max-skill`, especialmente `ui-ux-pro-max`, `design-system` y `ui-styling`.

No se debe forzar una migración a Tailwind/shadcn solo porque esas referencias lo mencionan. ElectroCMS conserva su arquitectura React/CSS salvo decisión explícita posterior.

## Invariantes de salida
- DOM = proyección, nunca fuente de verdad.
- Widget core sin React.
- Canvas core sin `switch` por widget type.
- Inspector escribe commands canónicos validados.
- Responsive styles permanecen en `DocumentNode.styles`.
- Editor theme/preset no modifica frontend/backend project themes.
- Project themes built-in no se editan directamente; se duplican antes de editar/versionar.
- Imported theme definitions no se duplican dentro de `CanonicalProject`.
- Elegir un package file nunca muta el proyecto; requiere revisión y apply explícito.
- Merge de package resources nunca sobrescribe IDs existentes.
- Preview/Backend/Export siguen siendo shells hasta sus fases dedicadas.
- Widgets dynamic/forms/filters no se presentan como engines funcionales todavía.

## Gate de fase
```bash
npm run verify:repo
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e
npm run build
```

Todos deben pasar de nuevo después del cierre documental/higiene antes de marcar F04 `DONE` y mergear PR #5.
