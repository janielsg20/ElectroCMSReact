# MF-034 — Editor theme presets

## Estado
DONE — GitHub Actions run #568 PASS.

## Objetivo original
Implementar 9 presets de UI via design tokens.

## Contexto obligatorio
- `/01_objective.md`
- `/02_architecture.md`
- `/THEME_SYSTEM.md`
- `design-system/electrocms-editor/MASTER.md`
- `design-system/electrocms-editor/pages/editor.md`

## Entregable original
El preset debe cambiar la experiencia visual completa del editor y no limitarse a cambiar colores.

## Implementación
ElectroCMS incluye 10 presets del editor:
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

Los presets operan exclusivamente sobre el chrome de ElectroCMS mediante tokens/CSS y se mantienen separados de `frontendThemeId` y `backendThemeId`.

El trabajo de MF-034 también consolidó el comportamiento DnD requerido por un no-code builder profesional:
- hit areas de inserción estables;
- feedback visible de source/target;
- no re-render estructural de React durante el gesto nativo;
- targets móviles ampliados;
- `prefers-reduced-motion` respetado.

## Validación mínima original
Visual/component/E2E.

## Evidencia
- Editor preset persistence E2E.
- DnD nesting/reorder regresión completa.
- Light/dark/auto permanece independiente del preset.
- GitHub Actions run #568 PASS: verify, lint, typecheck, unit, coverage, Playwright y build.
