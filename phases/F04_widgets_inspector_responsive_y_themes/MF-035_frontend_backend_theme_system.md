# MF-035 — Frontend/backend theme system

## Estado
DONE — GitHub Actions run #662 PASS.

## Objetivo original
Temas separados, editables, duplicables y versionados.

## Contexto obligatorio
- `/01_objective.md`
- `/02_architecture.md`
- `/THEME_SYSTEM.md`
- `design-system/electrocms-editor/MASTER.md`

## Entregable original
Tres domains sin contaminación:
1. Editor appearance.
2. Frontend project theme.
3. Backend project theme.

## Implementación
- `ProjectThemeRegistry` framework-neutral con IDs por scope, versiones y tokens JSON portables.
- 8 built-ins frontend y 7 built-ins backend.
- `frontendThemeId` y `backendThemeId` viven en `CanonicalProject` y autosavean de forma independiente.
- Editor mode/preset continúa en workspace preferences y no cambia con project themes.
- Built-ins son inmutables.
- `Duplicate to edit` crea una copia local editable y collision-safe.
- El editor local permite modificar label, description, semantic colors, radius y base spacing.
- Cada guardado incrementa `version` automáticamente.
- Copias locales/versionadas persisten en la biblioteca del browser y sobreviven reload.

## Validación mínima original
Unit + integration tests.

## Evidencia
- Registry scope/clone/portable-token unit tests.
- Frontend/backend independence + autosave/reload E2E.
- Duplicate built-in → select local copy → edit tokens → save v2 → reload E2E.
- Editor preset permanece intacto durante todos los cambios.
- GitHub Actions run #662 PASS completo.
