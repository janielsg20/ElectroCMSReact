# F02 — Editor shell y workspace responsive

## Estado
`DONE` — evidencia funcional GitHub Actions run #150.

## Objetivo
Completar el editor shell y workspace responsive con estado de sesión continuo, navegación configurable y preferencias de UI independientes del proyecto generado.

## Microfases
- [MF-013 — App shell y routing interno](MF-013_app_shell_y_routing_interno.md) — DONE
- [MF-014 — Header superior](MF-014_header_superior.md) — DONE
- [MF-015 — Navegación principal configurable](MF-015_navegaci_n_principal_configurable.md) — DONE
- [MF-016 — Responsive workspace](MF-016_responsive_workspace.md) — DONE
- [MF-017 — Workspace preferences](MF-017_workspace_preferences.md) — DONE
- [MF-018 — Theme mode del editor](MF-018_theme_mode_del_editor.md) — DONE

## Evidencia
- History API routing Editor/Preview/Backend/Export sin reset de sesión.
- Header conectado a proyecto, documento, breakpoint, zoom y rutas reales.
- Navegación izquierda/derecha, collapse, resize, reorder, icon/text y density.
- Drawer accesible en tablet/móvil.
- Preferencias sobreviven reload sin entrar en `CanonicalProject`.
- Editor light/dark/auto separado de themes generados.
- Playwright valida desktop, tablet 820×1180 y móvil 390×844 sin overflow raíz.

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

Todos pasaron en run #150. El commit documental de cierre debe repetir el gate antes del merge.
