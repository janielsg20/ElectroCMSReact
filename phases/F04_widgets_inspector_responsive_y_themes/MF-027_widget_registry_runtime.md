# MF-027 — Widget registry runtime

## Estado inicial
`TODO`

## Objetivo
Registro extensible y factories.

## Alcance obligatorio
- Reutilizar contratos existentes; no crear arquitectura paralela.
- Mantener compatibilidad con schema/modelos persistidos.
- El registro debe resolver widget type/version, metadata, default-node factory, prop validation, inspector schema, child policy, renderers/capabilities y migration hooks.
- Añadir un widget no debe requerir editar el editor core.
- Añadir tests unitarios del registry y factories.

## Entregable
Widgets pueden añadirse sin editar editor core.

## Validación mínima
Unit + lint + typecheck, además del workflow completo de regresión del repositorio antes de marcar DONE.
