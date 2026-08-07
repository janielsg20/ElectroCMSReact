# MF-019 — Document node tree engine

## Estado
`DONE`

## Objetivo cumplido
CRUD puro, inmutable y serializable sobre `CanonicalDocument`, con parent/children invariants y traversals derivados.

## Implementación
- `inspectDocumentTree` diagnostica root ausente, key/id mismatch, missing/duplicate child, múltiples padres, root como child, ciclos y orphans.
- `assertDocumentTree` produce índice runtime de parent, depth, preorder y postorder.
- Queries: parent, ancestors, descendants, preorder/postorder/breadth-first.
- `insertDocumentNode`: inserción leaf controlada por parent/index.
- `updateDocumentNode`: actualiza contenido sin permitir mutaciones estructurales implícitas.
- `removeDocumentNode`: elimina subárbol completo y lo desacopla de su parent.
- `project-validator` refuerza `MULTIPLE_PARENTS` y `ROOT_HAS_PARENT` para payloads externos/persistidos.

## Decisión de modelo
No se añade `parentId` al nodo persistido. La relación padre se deriva del array `children`, evitando doble fuente de verdad y divergencias durante DnD/migraciones.

## Validación
- Casos unitarios explícitos de invariantes y operaciones.
- Test determinista tipo property con 240 operaciones CRUD aleatorias.
- Serialización JSON validada tras cada operación.
- GitHub Actions run #195 — PASS completo.
