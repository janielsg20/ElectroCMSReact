# MF-036 — Theme packages import/export

## Estado
DONE — GitHub Actions run #688 PASS.

## Objetivo original
Selective import, demo data option, non-destructive merge.

## Contexto obligatorio
- `/01_objective.md`
- `/02_architecture.md`
- `/THEME_SYSTEM.md`
- `/SECURITY.md`

## Entregable original
Round-trip theme package.

## Implementación
- Formato versionado `kind=electrocms-theme-package`, `schemaVersion=1`.
- Límite máximo de 256 KB.
- Validación profunda de JSON portable; objetos/prototipos no JSON se rechazan.
- Recursos opcionales por paquete:
  - Pages & templates.
  - Content models: content types, taxonomies, field groups, relations.
  - Queries, forms & filters.
  - Roles, dashboards & backend configuration.
  - Demo content records.
- Export selectivo por categoría.
- Demo data está desactivada por defecto.
- Import en dos pasos: seleccionar archivo solo valida/previsualiza; ningún cambio ocurre hasta `Apply selected import`.
- Import selectivo por categoría.
- Merge no destructivo: un ID existente nunca se sobrescribe; conflictos se reportan como preservados.
- Theme definition puede instalarse independientemente de los recursos y no se auto-selecciona.
- IDs de themes instalados no pueden colisionar.
- La biblioteca local se guarda en `electrocms:project-theme-packages:v1`.
- Usuarios, credenciales y binarios de media quedan explícitamente fuera del formato F04.

## Validación mínima original
Integration tests.

## Evidencia
- Package parse/version/size/resource validation unit tests.
- Selective non-destructive merge unit tests.
- Demo data opt-in unit tests.
- Browser E2E: validate → review → deselect Pages → apply selective merge → select theme → autosave/reload → export.
- Browser E2E de colisión: definición existente se preserva.
- GitHub Actions run #688 PASS completo.
