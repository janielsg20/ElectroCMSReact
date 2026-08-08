# F04 — Widgets, inspector, responsive y themes

## Objetivo
Completar widgets, inspector, responsive y themes mediante slices pequeñas y verificables.

## Microfases
- MF-027 — Widget registry runtime
- MF-028 — Structural widgets
- MF-029 — Basic/content widgets
- MF-030 — Dynamic/commerce/form/filter widget contracts
- MF-031 — Inspector schema engine
- MF-032 — Style engine
- MF-033 — Breakpoint engine
- MF-034 — Editor theme presets
- MF-035 — Frontend/backend theme system
- MF-036 — Theme packages import/export

## Gate de fase
```bash
npm run verify:repo
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e
npm run build
```

Todos deben pasar antes de marcar F04 `DONE`. Cada microfase debe respetar el modelo canónico y los contratos F03 ya cerrados.
