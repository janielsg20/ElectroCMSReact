# MF-018 — Theme mode del editor

## Estado
`DONE`

## Objetivo cumplido
Light/dark/auto para ElectroCMS, persistente y separado de los themes generados.

## Implementación
- `EditorThemeMode`: `light | dark | auto`.
- Auto sigue `prefers-color-scheme` mediante `useSyncExternalStore`.
- Tokens CSS de shell resuelven apariencia del editor.
- `frontendThemeId` y `backendThemeId` no son modificados por estos controles.

## Validación
Component tests + Playwright reload — PASS en run #150.
