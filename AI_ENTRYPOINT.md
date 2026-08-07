# AI_ENTRYPOINT.md

## Cómo iniciar o reanudar ElectroCMS

Lee en este orden y no omitas pasos:

1. `PROMPT_MAESTRO_ELECTROCMS_REACT.md` — primera sesión o cuando cambien requisitos.
2. `RULES.md` — siempre.
3. `MEMORY.md` — siempre.
4. `TRACKING.md` — siempre.
5. `.ai/memory/HANDOFF.md` — siempre al reanudar.
6. `PHASES.md` — para entender la secuencia.
7. El archivo de la **fase actual** dentro de `phases/`.
8. Solo las microfases necesarias para la tarea actual.
9. Los documentos de subsistema enlazados desde esa microfase.

## Protocolo de trabajo

Antes de editar código:

- Confirma la fase/microfase activa leyendo `TRACKING.md`.
- Revisa `KNOWN_ISSUES.md` y decisiones relacionadas.
- Inspecciona el código existente antes de diseñar un reemplazo.
- No implementes una segunda arquitectura paralela.
- Define o confirma tests que prueban el criterio de salida.

Durante la implementación:

- Haz cambios mínimos coherentes con la arquitectura objetivo.
- Mantén modelos serializables y versionados.
- Mantén el editor desacoplado de los renderers/exportadores.
- Añade tests junto con el comportamiento.
- Corrige warnings relevantes; no los ocultes.

Al terminar una microfase:

1. Ejecuta los checks aplicables.
2. Actualiza el archivo de microfase con evidencia/resumen si el workflow lo permite.
3. Actualiza `TRACKING.md`.
4. Actualiza `MEMORY.md` con hechos duraderos, no con narrativa extensa.
5. Registra decisiones nuevas en `DECISIONS.md` y `.ai/memory/DECISIONS_LOG.md`.
6. Actualiza `.ai/memory/HANDOFF.md` con el próximo paso exacto.

## Prohibición crítica

No declares funcionalidades completas basándote únicamente en UI visible, mocks o placeholders. Una capacidad se considera implementada cuando el flujo real, persistencia, preview/export cuando aplique y tests asociados funcionan.
