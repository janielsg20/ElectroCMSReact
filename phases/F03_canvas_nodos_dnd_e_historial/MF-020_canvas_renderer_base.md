# MF-020 — Canvas renderer base

## Estado
`DONE`

## Objetivo cumplido
La superficie Editor proyecta el `CanonicalDocument` de forma recursiva y determinista sin usar el DOM como fuente de verdad.

## Implementación
- `CanvasRenderer`: render recursivo por `rootNodeId` + `children`.
- `EditorCanvas`: compone renderer y overlay como capas hermanas.
- `CanvasOverlayLayer`: capa separada y `pointer-events:none`, preparada para MF-022/MF-025.
- Viewport utiliza breakpoint activo y zoom del `ProjectSession`.
- Empty root se representa sin inventar nodos.
- Árbol inválido produce una superficie segura de diagnóstico en lugar de render parcial silencioso.
- Workspace Preview/Backend/Export no comparte ni muta la implementación interna del canvas Editor.

## Validación
- Orden directo y nesting canónico.
- Renderer/overlay como siblings.
- Empty root.
- Invalid-tree fallback.
- Input document permanece inmutable.
- GitHub Actions run #211 — PASS completo.
