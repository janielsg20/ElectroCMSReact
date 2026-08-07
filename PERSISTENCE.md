# PERSISTENCE.md

## Objetivos
Persistencia local-first, incremental, recuperable, versionada y transaccional cuando el destino lo permita.

## Adapters F01
- `MemoryProjectRepository`: tests y casos de uso sin navegador.
- `IndexedDbProjectRepository`: persistencia web primaria para proyectos.
- `MemoryRecoveryRepository`: recovery determinista en tests.
- `IndexedDbRecoveryRepository`: snapshots de recuperación separados del proyecto principal.

## IndexedDB
- Database: `electrocms`.
- DB version inicial: `1`.
- Stores: `projects` y `recoverySnapshots`.
- El versionado interno de IndexedDB es independiente de `CanonicalProject.schemaVersion`.

## Reglas
- `create` no sobrescribe proyectos existentes silenciosamente.
- `save` valida el modelo canónico antes de persistir.
- `load` hidrata mediante el registro de migraciones antes de entregar datos editables.
- Las lecturas/escrituras esperan la finalización de la transacción, no solo del request individual.
- El adapter no expone referencias mutables internas.
- Autosave es debounced y serializado.
- Antes del save principal se crea un recovery snapshot.
- Los recovery snapshots están acotados por configuración.
- Selection, hover, drag y otros estados transitorios nunca forman parte del proyecto persistido.
