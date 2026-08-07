# STATE_MANAGEMENT.md

## Clases de estado
1. Persistent project state.
2. Session/workspace preferences.
3. Editor transient state: selection, hover, active tool, drag.
4. Derived state/selectors.
5. Async task state: import, export, indexing y migraciones largas.

## Reglas
- F01 implementa únicamente la frontera de persistent project state; el store del editor se incorpora en fases posteriores.
- Los componentes no acceden directamente a IndexedDB.
- Los repositorios son la frontera de persistencia.
- Las mutaciones persistentes futuras se encapsularán en commands/use cases.
- Persistence no depende del lifecycle de componentes React.
- Un control pequeño del inspector no debe suscribirse al proyecto completo.
- Async tasks largas deberán ser cancelables/progress-aware cuando se incorporen.
