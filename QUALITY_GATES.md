# QUALITY_GATES.md

Una fase o microfase no se cierra con gates rojos, cancelados o no ejecutados.

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

## Política de ejecución eficiente
GitHub Actions es un recurso de validación, no un watcher por archivo.

- Los commits normales de desarrollo en `agent/**` **no** disparan el gate pesado.
- Cada microfase acumula código + tests + documentación sobre su rama de fase.
- Para pedir un gate, se mueve la rama `quality/<fase>` al **HEAD exacto** que se quiere validar.
- Se abre/reabre el PR técnico de quality hacia `main`; el evento `pull_request: opened/reopened/ready_for_review` dispara **un único workflow**.
- El PR técnico de quality **nunca se fusiona**. Después de inspeccionar el resultado se vuelve a cerrar.
- Al siguiente gate se mueve de nuevo `quality/<fase>` al nuevo HEAD y se reabre el mismo PR.
- `main` conserva gate en push como defensa final.
- `workflow_dispatch` permanece disponible para ejecución manual desde GitHub cuando corresponda.

### F05
- Rama de fase: `agent/f05-dynamic-content`.
- Rama de gate: `quality/f05`.
- PR técnico de gate: #7 `quality/f05 -> main`.
- PR #7 existe únicamente para CI y no debe mergearse.

## Qué cuenta como evidencia
Un gate solo cuenta si los jobs ejecutan realmente sus steps y finalizan con éxito.

No cuentan como PASS ni como FAIL de código:
- runs cancelados por un commit nuevo antes de completar;
- jobs que terminan antes de `Set up job`;
- jobs con `steps=null` / cero steps ejecutados;
- fallos de runner, quota/billing o infraestructura sin logs del proyecto.

Si la infraestructura impide ejecutar el gate, la microfase permanece `IN_PROGRESS` y la siguiente sigue bloqueada.

## Reglas
- Con `package-lock.json` presente, CI instala mediante `npm ci`.
- No usar `skip`, `@ts-ignore`, `eslint-disable` general ni exclusiones de cobertura para esconder fallos.
- E2E valida el flujo en navegador real; unit/integration no reemplaza E2E.
- El build de producción forma parte del criterio de salida.
- Los artefactos `dist` y coverage se generan en GitHub Actions cuando el gate ejecuta.
- No usar un deployment de preview como sustituto de CI. Vercel permanece manual-only y se despliega solo por petición explícita del usuario.
