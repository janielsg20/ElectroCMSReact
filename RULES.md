# RULES.md — Reglas no negociables de desarrollo

## R-01 Fuente de verdad
`PROMPT_MAESTRO_ELECTROCMS_REACT.md` define el alcance funcional. Ninguna microfase puede reducirlo silenciosamente.

## R-02 React/TypeScript
Todo el núcleo se implementa en React + TypeScript estricto. JavaScript sin tipado solo se admite en tooling externo cuando exista razón documentada.

## R-03 Local-first
La edición, persistencia, preview y exportación principal deben funcionar sin Internet después de instalar recursos necesarios. Ninguna API/SaaS es requisito del núcleo.

## R-04 Arquitectura modular
Separar dominio, aplicación, infraestructura y UI. Evitar archivos monolíticos, dependencias circulares y acceso directo de componentes a almacenamiento/exportadores.

## R-05 Modelo canónico
El documento/nodo canónico es independiente del DOM y del formato final exportado. Preview y exportadores consumen el mismo modelo.

## R-06 Persistencia versionada
Todo proyecto serializado incluye `schemaVersion`. Toda ruptura requiere migración y tests de ida/compatibilidad.

## R-07 Editor ≠ renderer
La UI del editor no puede convertirse en el código exportado por simple copia del DOM. Los renderers son adaptadores explícitos.

## R-08 No placeholders engañosos
No marcar `DONE` un botón, pantalla o feature sin implementación real. Los estados `planned`, `modeled`, `interactive-demo` y `production-ready` deben distinguirse.

## R-09 Tests con cada módulo
Todo comportamiento de dominio y bug importante debe incorporar cobertura automatizada adecuada.

## R-10 Quality gates
Una fase no cierra con fallos en lint, typecheck, unit/integration tests, E2E o build.

## R-11 Sin supresión como solución
No usar `@ts-ignore`, `eslint-disable`, exclusiones de cobertura o `skip` permanente como forma de cerrar errores salvo excepción mínima documentada.

## R-12 Responsive completo
Desktop, laptop, tablet landscape/portrait y mobile large/small forman parte del modelo; no son solo CSS posterior.

## R-13 Accesibilidad
Teclado, focus visible, semántica, ARIA cuando corresponda, contraste, reduced motion y targets táctiles se validan desde la implementación.

## R-14 Seguridad
Todo import/export valida paths, nombres, tipos, esquemas y payloads. Código personalizado se trata como contenido no confiable.

## R-15 Integridad exportada
Si una función no puede representarse fielmente en un destino, el diagnóstico debe bloquear pérdida silenciosa.

## R-16 Determinismo
La misma versión de proyecto + configuración debe producir output exportado equivalente, excluyendo metadata explícitamente variable.

## R-17 Performance del editor
Cambiar una propiedad pequeña no debe reconstruir todo el canvas. Selectores, memoización, virtualización y workers se usan donde aporten valor medible.

## R-18 Estado
Separar persistent state, session/editor state, derived state y transient interaction state.

## R-19 Dependencias
Preferir contratos propios alrededor de librerías que afecten DnD, storage, export, parsing o editor. Evitar lock-in innecesario.

## R-20 Documentación viva
Cada microfase actualiza tracking/memory/decisions relevantes. La documentación desactualizada se trata como defecto.

## R-21 Compatibilidad
No romper proyectos existentes sin migración explícita y test.

## R-22 Código generado
Debe ser legible, mantenible, sin secretos, rutas temporales ni dependencias ocultas de ElectroCMS.

## R-23 Paquetes limpios
Los exportadores se prueban desde directorios temporales limpios; no dependen de `node_modules` del CMS.

## R-24 Alcance de fase
No adelantar features de fases futuras salvo infraestructura mínima inevitable. Registrar cualquier adelanto.

## R-25 Handoff obligatorio
Antes de detener trabajo, actualizar `.ai/memory/HANDOFF.md` con estado verificable y siguiente acción.
