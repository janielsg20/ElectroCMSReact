# MF-017 — Workspace preferences

## Estado
`DONE`

## Objetivo cumplido
Layout y apariencia del editor sobreviven reload sin contaminar project data.

## Implementación
`WorkspacePreferences` schema v1 guarda navegación, widths, collapse, display mode, order, density, last workspace y editor theme mode en `electrocms:workspace-preferences:v1`.

El repositorio Browser/Memory está separado de `ProjectRepository` y del modelo canónico.

## Validación
Unit/integration + Playwright reload — PASS en run #150.
