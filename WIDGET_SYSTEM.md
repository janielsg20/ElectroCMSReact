# WIDGET_SYSTEM.md

## Registry
Cada widget registra:
- `type`
- `version`
- metadata (name/category/icon/description)
- default node factory
- prop schema + validation
- inspector schema
- child policy
- renderer React preview
- capability matrix por export target
- migration hooks

## Categorías mínimas
Estructurales, básicos, contenido, dinámicos, e-commerce, formularios y filtros, exactamente según el Prompt Maestro.

## Regla de terminado
Un widget no es `production-ready` hasta tener:
1. modelo,
2. inspector,
3. canvas/preview,
4. responsive,
5. accessibility aplicable,
6. serialization,
7. tests,
8. implementación o diagnóstico explícito en cada export target.

## Regla F04
MF-027 implementa el runtime/registry y factories. Las categorías concretas se incorporan secuencialmente en MF-028…030; el inspector y style engine llegan después. El registry no debe convertir funcionalidades futuras en falsos estados `production-ready`.
