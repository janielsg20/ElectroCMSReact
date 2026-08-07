# QUALITY_GATES.md

Una fase no se cierra con gates rojos.

## Gate obligatorio
```bash
npm run verify:repo
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e
npm run build
```

## Reglas
- Con `package-lock.json` presente, CI debe instalar mediante `npm ci`.
- No usar `skip`, `@ts-ignore`, `eslint-disable` general ni exclusiones de cobertura para esconder fallos.
- E2E valida el flujo en navegador real; unit/integration no reemplaza E2E.
- El build de producción forma parte del criterio de salida.
- Los artefactos `dist` y coverage se generan en GitHub Actions para inspección.
