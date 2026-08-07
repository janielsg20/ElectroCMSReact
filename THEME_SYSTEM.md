# THEME_SYSTEM.md

## Tres dominios de apariencia
ElectroCMS mantiene separados:
1. Editor UI theme — apariencia del CMS.
2. Frontend theme — diseño del sitio generado.
3. Backend theme — diseño del administrador generado.

Nunca se debe aplicar un cambio del editor a frontend/backend de forma implícita.

## F02 — Editor theme base
`WorkspacePreferences.editorThemeMode` admite:
- `light`
- `dark`
- `auto`

`auto` sigue `prefers-color-scheme` y solo resuelve la apariencia de ElectroCMS. La selección se guarda en el workspace preferences repository y no modifica `CanonicalProject.frontendThemeId` ni `CanonicalProject.backendThemeId`.

## Tokens base
La shell usa variables CSS para:
- superficies;
- texto fuerte/normal/muted/faint;
- bordes;
- acento;
- estados success/warning/danger;
- sombras;
- grid del workspace;
- focus ring.

El sistema completo de presets profesionales, tokens editables, paquetes de theme y frontend/backend themes pertenece a F04. F02 únicamente establece la separación y el modo base del editor.
