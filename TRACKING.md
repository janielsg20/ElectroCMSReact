# TRACKING.md — Estado de ejecución

## Estado global
- Estado: IN_PROGRESS
- Fase completada: F03 — Canvas, nodos, DnD e historial
- Fase actual: F04 — Widgets, inspector, responsive y themes
- Microfase actual: MF-034 — Editor theme presets
- Último quality gate completo: GitHub Actions run #529 PASS (MF-033)
- Último build válido: GitHub Actions run #553 PASS en verify/lint/types/unit/coverage/build; E2E pendiente por regresión DnD de reorder
- Repositorio oficial: `janielsg20/ElectroCMSReact`
- PR de fase: #5 `agent/f04-widgets-inspector-themes -> main`
- Preview deployment: MANUAL ONLY. `vercel.json` usa `git.deploymentEnabled: false`; no desplegar por push/PR.

## F00
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-000 | DONE | Inventario del proyecto completado |
| MF-001 | DONE | Gap analysis completado |
| MF-002 | DONE | Arquitectura React/TypeScript definida |
| MF-003 | DONE | Modelo canónico y versionado definido |
| MF-004 | DONE | Contratos de registries/renderers/exporters definidos |
| MF-005 | DONE | CI base con lint, types, tests, coverage, build y E2E |

## F01
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-006 | DONE | React/TypeScript strict, `package-lock.json`, CI reproducible con `npm ci` |
| MF-007 | DONE | Core domain independiente de React/DOM: JSON, errores, Result e IDs tipados |
| MF-008 | DONE | `CanonicalProject` schema v1, factory, seis breakpoints y validación de integridad del árbol |
| MF-009 | DONE | `ProjectRepository` + adapter in-memory con clones defensivos y conflicto en create duplicado |
| MF-010 | DONE | CRUD IndexedDB transaccional + recovery store + Playwright reload E2E |
| MF-011 | DONE | Migration registry ordenado, v0→v1, rechazo de schemas futuros e integración desde IndexedDB |
| MF-012 | DONE | Autosave debounced/serializado, revisión incremental y recovery snapshots limitados |

## F02
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-013 | DONE | History API router para Editor/Preview/Backend/Export y `ProjectSessionProvider`; E2E conserva zoom/estado |
| MF-014 | DONE | Header conectado a project/save/document/breakpoint/zoom y routing Preview/Export |
| MF-015 | DONE | Navegación izquierda/derecha, collapse, resize, reorder, icon/text modes y density |
| MF-016 | DONE | Estrategias desktop/tablet/mobile, drawer accesible y Playwright sin overflow raíz |
| MF-017 | DONE | Workspace preferences schema v1 separado de `CanonicalProject`; reload E2E |
| MF-018 | DONE | Editor light/dark/auto persistente e independiente de frontend/backend themes |

## F03
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-019 | DONE | Motor inmutable de árbol, indexes/traversals/invariants; run #195 PASS |
| MF-020 | DONE | Renderer recursivo del modelo canónico y overlay separado; run #211 PASS |
| MF-021 | DONE | Inserción, reorder/nesting y DnD semántico; run #256 PASS |
| MF-022 | DONE | Selección simple/múltiple transitoria y convivencia con DnD; run #276 PASS |
| MF-023 | DONE | `DocumentCommand` reversible, Undo/Redo y atajos; run #296 PASS |
| MF-024 | DONE | Copy/Cut/Paste, Group/Ungroup, Lock/Hide reversibles; run #320 PASS |
| MF-025 | DONE | Geometría responsive, snapping, guías y Undo; run #348 PASS |
| MF-026 | DONE | Autosave/hydration/recovery IndexedDB integrado; run #368 PASS y cierre final #396 PASS |

## F04
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-027 | DONE | Registry framework-neutral + binding React, factories, validation, child policies, capabilities, migrations y plugin preview sin branching del editor; run #424 PASS |
| MF-028 | DONE | Container/Group/Section/Grid/Flex/Stack/Divider/Spacer/Tabs/Accordion registrados, inserción genérica y factories registry-driven; run #434 PASS |
| MF-029 | DONE | 16 widgets básicos/contenido con defaults, validación, previews e inserción registry-driven; run #446 PASS |
| MF-030 | DONE | 19 contratos dynamic/commerce/form/filter con capacidad `modeled`, previews honestos y validación; run #456 PASS |
| MF-031 | DONE | Inspector schema engine, controles generados, validación, edición canónica y Undo/Redo; run #479 PASS |
| MF-032 | DONE | Style engine responsive, resolución explicit/inherited/unset, renderer seguro, inspector y Undo; run #505 PASS |
| MF-033 | DONE | Breakpoint engine, cadena wider/narrower, herencia desde breakpoint superior y E2E; run #529 PASS |
| MF-034 | IN_PROGRESS | Editor theme presets implementados; preset E2E pasa. Cerrando regresión E2E de reorder DnD y alineando editor con design system no-code. |
| MF-035 | TODO | Frontend/backend theme system |
| MF-036 | TODO | Theme packages import/export |

## Design system del editor
- Fuente de verdad: `design-system/electrocms-editor/MASTER.md`.
- Override del workspace principal: `design-system/electrocms-editor/pages/editor.md`.
- Referencias externas seleccionadas: `ui-ux-pro-max`, `design-system` y `ui-styling` de `nextlevelbuilder/ui-ux-pro-max-skill`.
- Arquetipo: productivity tool + design-system tooling + data-dense SaaS.
- Base visual: Minimal/Flat + Data-Dense + Accessible, con micro-interacciones funcionales.
- El editor debe sentirse como un no-code builder profesional: header global, canvas dominante, navegación/paleta lateral y inspector contextual.
- No forzar migración a Tailwind/shadcn; adaptar las reglas al React/CSS actual salvo que una fase futura justifique explícitamente esa migración.

## Invariantes consolidadas
- El DOM nunca es fuente de verdad; el canvas es una proyección de `CanonicalDocument`.
- Los widgets se resuelven por `type@version` mediante registries explícitos.
- El editor core no contiene branching por cada tipo de widget.
- Factories producen `DocumentNode` canónicos y las props se validan antes de aceptar el nodo.
- Inserción de widgets estructurales usa el registry; Container y Group ya no dependen de factories locales paralelas.
- Widgets dinámicos/commerce/form/filter de F04 permanecen `modeled` hasta que F05/F06 implementen comportamiento real.
- Inspector UI es transitorio; solo los patches de props validados entran al modelo mediante comandos reversibles.
- Selección, clipboard UI, guides y estado de interacción son transitorios y no entran al proyecto.
- Undo/Redo usa comandos canónicos reversibles por documento.
- Geometría usa `ResponsiveStyleSet` por breakpoint.
- Autosave reutiliza repositorios F01 y no reemplaza contenido nuevo con callbacks stale.
- Editor theme/preset vive en workspace preferences; frontend/backend theme IDs viven en `CanonicalProject`.
- Los deployments de preview son manuales y solo se ejecutan bajo petición explícita del usuario.

## Regla de salida
F04 solo puede marcarse DONE cuando MF-027…MF-036 estén implementadas y el gate completo final esté verde. No avanzar a F05 con ningún gate rojo.
