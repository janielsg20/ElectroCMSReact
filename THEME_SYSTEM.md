# THEME_SYSTEM.md

## Tres dominios de apariencia
ElectroCMS mantiene separados:
1. **Editor UI theme** — apariencia del CMS.
2. **Frontend theme** — diseño del sitio generado.
3. **Backend theme** — diseño del administrador generado.

Nunca se debe aplicar un cambio del editor a frontend/backend de forma implícita.

## Editor theme mode
`WorkspacePreferences.editorThemeMode` admite:
- `light`
- `dark`
- `auto`

`auto` sigue `prefers-color-scheme` y solo resuelve la apariencia de ElectroCMS.

## Editor theme presets — F04
`WorkspacePreferences.editorThemePresetId` controla la personalidad visual del chrome del editor, separada del mode claro/oscuro.

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

Un preset del editor puede cambiar tokens de color, elevación, radius, énfasis tipográfico y densidad dentro de límites soportados. No puede cambiar:
- datos de `CanonicalProject`;
- comportamiento de widgets;
- semántica de Undo/Redo;
- nombres accesibles;
- contratos de routing;
- estructura canónica del canvas.

## Design system del editor
Fuentes de verdad:
- `design-system/electrocms-editor/MASTER.md`
- `design-system/electrocms-editor/pages/editor.md`

Principios externos adaptados desde `nextlevelbuilder/ui-ux-pro-max-skill`:
- `ui-ux-pro-max`
- `design-system`
- `ui-styling`

ElectroCMS usa arquitectura de tokens de tres capas:

```text
Primitive → Semantic → Component
```

Los componentes deben consumir tokens semánticos/de componente cuando sea práctico. El editor conserva un lenguaje Minimal/Flat + Data-Dense + Accessible orientado a productividad no-code.

## Project themes — F04
`CanonicalProject` persiste:
- `frontendThemeId`
- `backendThemeId`

Estos IDs son independientes y se modifican mediante `ProjectSession.setProjectTheme(scope, id)`, con validación y autosave real.

### ProjectThemeRegistry
`src/core/themes/theme-system.ts` define un registry framework-neutral.

Cada `ProjectThemeDefinition` contiene:
- `id`
- `version`
- `scope` (`frontend` / `backend`)
- `label`
- `description`
- `tokens`

Reglas:
- IDs frontend: `frontend.*`.
- IDs backend: `backend.*`.
- versión positiva.
- tokens deben ser JSON portable plano/recursivo.
- se rechazan `Date`, `Map`, class instances y otros prototipos no JSON, incluso anidados.
- el registry devuelve clones defensivos.
- IDs duplicados no se registran.

## Built-in project themes
### Frontend
- `frontend.minimal-clean`
- `frontend.bento-grid`
- `frontend.elegant-editorial`
- `frontend.sophisticated-dark`
- `frontend.material-neutral`
- `frontend.neobrutalist-modern`
- `frontend.corporate-pro`
- `frontend.glassmorphism`

### Backend
- `backend.high-density`
- `backend.saas-dashboard`
- `backend.enterprise-corporate`
- `backend.developer-console`
- `backend.monochrome-pro`
- `backend.material-neutral`
- `backend.sophisticated-dark`

## Theme package format — MF-036
Formato exportable/importable:

```json
{
  "schemaVersion": 1,
  "kind": "electrocms-theme-package",
  "theme": {
    "id": "frontend.example",
    "version": 1,
    "scope": "frontend",
    "label": "Example",
    "description": "...",
    "tokens": {}
  }
}
```

### Reglas de seguridad/portabilidad
- Máximo 256 KB por paquete.
- JSON inválido se rechaza antes de registrar.
- Schema futuro se rechaza.
- Kind incorrecto se rechaza.
- Theme inválido se rechaza.
- Colisiones con built-ins o paquetes ya instalados se rechazan.
- El import nunca modifica silenciosamente el theme activo: instala primero y el usuario selecciona después.

## Biblioteca local de themes importados
Los paquetes importados se guardan en:

`electrocms:project-theme-packages:v1`

La biblioteca pertenece al editor/browser, no a `CanonicalProject`.

Motivo:
- un theme instalado puede reutilizarse en varios proyectos;
- evita duplicar definitions completas dentro de cada proyecto;
- permite evolucionar la librería de themes sin migrar el schema canónico por cada instalación.

El proyecto guarda únicamente el ID seleccionado. Los exporters futuros deberán resolver/bundlear la definición activa mediante el registry/package library.

## UI de gestión F04
Los shells Preview y Backend exponen:
- selector de theme compatible con el scope;
- preview visual de semantic tokens;
- indicador Built-in / Imported;
- Import package;
- Export selected;
- estado accesible de éxito/error mediante `aria-live`.

Estos shells siguen siendo shells hasta sus fases de renderer/export; F04 no debe presentarlos como output final.

## Persistencia y tests
Playwright valida:
- frontend/backend cambian independientemente;
- cambiar project theme no cambia editor preset;
- selección sobrevive autosave/reload;
- import agrega el paquete al catálogo;
- imported theme sobrevive reload;
- export produce `*.electrocms-theme.json`;
- colisiones se rechazan.

Evidencia funcional F04: GitHub Actions run #622 PASS.
