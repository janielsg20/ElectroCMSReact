# MF-016 — Responsive workspace

## Estado
`DONE`

## Objetivo cumplido
Desktop/tablet/mobile conservan funciones principales sin overflow crítico.

## Implementación
- Desktop: navegación lateral simultánea.
- ≤960px: layout compacto y drawer de navegación.
- Drawer con foco inicial, Escape y cierre exterior.
- Controles táctiles ampliados en móvil.
- Header secundario con scroll horizontal local para conservar controles.
- `contain: inline-size paint` evita que el scroll interno amplíe el documento raíz.
- `prefers-reduced-motion` reduce transiciones/animaciones.

## Validación
Playwright: 820×1180 y 390×844 sin overflow raíz — PASS en run #150.
