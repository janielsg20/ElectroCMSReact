# THEME_SYSTEM.md

## Tres dominios de apariencia
ElectroCMS mantiene separados:
1. **Editor UI theme** — apariencia del CMS.
2. **Frontend theme** — diseño del sitio generado.
3. **Backend theme** — diseño del administrador generado.

Nunca se debe aplicar un cambio del editor a frontend/backend de forma implícita.

## Editor theme mode y presets
`WorkspacePreferences.editorThemeMode` admite `light`, `dark`, `auto`.
`WorkspacePreferences.editorThemePresetId` controla solo la personalidad visual del chrome de ElectroCMS.

Presets incluidos:
- High Density
- Bento Grid
- Minimal Clean
- Material Expressive
- SaaS Dashboard
- Enterprise / Corporate
- Glassmorphism
- Sophisticated Dark
- Monochrome Pro
- Developer Console

Un preset del editor puede cambiar tokens de color, elevación, radius, énfasis tipográfico y densidad; nunca datos de `CanonicalProject`, comportamiento de widgets, Undo/Redo, accesibilidad o estructura del canvas.

## Design system del editor
Fuentes de verdad:
- `design-system/electrocms-editor/MASTER.md`
- `design-system/electrocms-editor/pages/editor.md`

Principios adaptados desde `nextlevelbuilder/ui-ux-pro-max-skill`:
- `ui-ux-pro-max`
- `design-system`
- `ui-styling`

Arquitectura visual: `Primitive → Semantic → Component`.
El editor usa lenguaje Minimal/Flat + Data-Dense + Accessible orientado a productividad no-code.

## Project themes — F04
`CanonicalProject` persiste `frontendThemeId` y `backendThemeId` de forma independiente.
`ProjectSession.setProjectTheme(scope,id)` valida contra `ProjectThemeRegistry` y encola autosave.

### ProjectThemeRegistry
Cada `ProjectThemeDefinition` contiene:
- `id`
- `version`
- `scope` (`frontend` / `backend`)
- `label`
- `description`
- `tokens`

Reglas:
- IDs `frontend.*` o `backend.*` según scope.
- versión positiva.
- tokens JSON portables profundos.
- objetos con prototipos no JSON se rechazan.
- clones defensivos.
- IDs duplicados no se registran.

### Built-ins
Frontend: `minimal-clean`, `bento-grid`, `elegant-editorial`, `sophisticated-dark`, `material-neutral`, `neobrutalist-modern`, `corporate-pro`, `glassmorphism`.

Backend: `high-density`, `saas-dashboard`, `enterprise-corporate`, `developer-console`, `monochrome-pro`, `material-neutral`, `sophisticated-dark`.

Built-ins son inmutables. `Duplicate to edit` crea una copia local collision-safe en v1. El editor local permite modificar metadata y semantic tokens; cada guardado incrementa versión automáticamente.

## Theme package format — MF-036
Envelope:

```json
{
  "schemaVersion": 1,
  "kind": "electrocms-theme-package",
  "theme": {},
  "resources": {}
}
```

Límite: 256 KB.

### Recursos opcionales
- Pages & templates: documents + order.
- Content models: contentTypes, taxonomies, fieldGroups, relations.
- Queries, forms & filters.
- Roles, dashboards & backend configuration.
- Demo content records.

El paquete F04 no transfiere usuarios ni binarios de media.

### Export selectivo
El usuario elige categorías antes de exportar. Demo Data está desactivada por defecto.

### Import seguro en dos pasos
1. Elegir archivo → parsear, validar schema/theme/resources y mostrar review.
2. `Apply selected import` → instalar definición seleccionada y/o fusionar categorías seleccionadas.

Elegir un archivo nunca modifica el proyecto por sí solo.

### Merge no destructivo
- Un ID/key existente nunca se sobrescribe.
- Nuevos IDs se añaden.
- Conflictos se cuentan como `skippedConflicts` y se preserva el valor actual.
- Demo records solo entran si `demoData=true`.
- El proyecto resultante se valida con `validateCanonicalProject` antes de commit/autosave.

## Biblioteca local de themes
Clave: `electrocms:project-theme-packages:v1`.

La biblioteca pertenece al editor/browser, no a `CanonicalProject`. El proyecto guarda solo el ID activo y el registry resuelve la definición instalada.

## UI F04
Preview/Backend exponen:
- selector por scope;
- token preview;
- Built-in/Imported + versión;
- Duplicate to edit;
- editor de tokens para copies/imports locales;
- Export contents selectivo;
- Import validate → review → merge;
- estado accesible `aria-live`.

Los workspaces siguen siendo shells hasta sus fases dedicadas.

## Evidencia definitiva
- MF-034: run #568 PASS.
- MF-035 editable/duplicable/versionada: run #662 PASS.
- MF-036 selective import/demo option/non-destructive merge: run #688 PASS.
