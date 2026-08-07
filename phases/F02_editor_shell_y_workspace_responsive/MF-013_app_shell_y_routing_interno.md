# MF-013 — App shell y routing interno

## Estado
`DONE`

## Objetivo cumplido
Workspaces Editor/Preview/Backend/Export con routing interno y project session estable.

## Implementación
- History API + `useSyncExternalStore`.
- Rutas `/editor`, `/preview`, `/backend`, `/export`.
- `ProjectSessionProvider` por encima del outlet lógico.
- El cambio de workspace conserva documento activo, breakpoint y zoom.

## Validación
Component tests + Playwright navigation continuity — PASS en run #150.
