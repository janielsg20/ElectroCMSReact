# HANDOFF.md

## Current state
F04 is fully closed and merged into `main` by squash at `57798d9e00f4a3bb87867a847c3bccfccc82f764` after GitHub Actions run #712 PASS.

F05 — Contenido dinámico is active on `agent/f05-dynamic-content` / draft PR #6.

Completed:
- MF-037 CPT — run #730; docs #740.
- MF-038 Taxonomy — run #766; docs #776.
- MF-039 Field type registry — run #786; docs #800.
- MF-040 Custom field groups — run #834; docs #850.
- MF-041 Records CRUD — run #901; docs #915; evidence-sync #921.

**MF-042 — Advanced fields is IN_PROGRESS.** Core + authoring UI + record runtime + unit/E2E tests are implemented, but it MUST NOT be marked DONE yet because GitHub Actions is currently failing before any step starts. Runs #986/#990/#994/#1000/#1002 show both jobs as failure with zero steps and no logs. MF-043 remains BLOCKED.

## MF-042 implemented state
- `core/repeater`, `core/group`, `core/calculated`, `core/conditional` have v2 `available` definitions in `createContentFieldTypeRegistry()`; v1 historical definitions remain registered.
- `core/relation`, `core/user`, `core/taxonomy` remain v1 `modeled` for MF-043.
- `advanced-field-runtime.ts`: portable advanced runtime, safe calculation tokenizer/parser/evaluator, conditional operators, nested group/repeater validation, max depth 8, max repeater items 100.
- `advanced-field-types.ts`: v2 definitions/config/value contracts.
- `advanced-field-group.ts`: contextual refs, sibling-source rules, calculated source rules, cycles and reference-depth protection.
- `advanced-field-group-integrity.ts`: Field Group deletion blocked while another advanced field references it.
- `advanced-content-record.ts`: advanced record normalization layered over MF-041 CRUD; normalization is staged structural → calculated → conditional.
- Calculated expressions may reference sibling Number/Currency only. Calculated→Calculated chaining is deliberately rejected to keep output independent of field order.
- Conditional inactive values normalize canonically to `null`.
- Field Group authoring remains one path: Field Library → Stored Order → Inspector. Repeater/Group/Calculated/Conditional settings are configured there; no separate AdvancedFieldEditor surface remains.
- Records uses `AdvancedRecordFieldControl` for nested Group, Repeater rows, Calculated read-only and Conditional reactive group UI.
- `e2e/advanced-fields.spec.ts` exercises reusable child groups, schema configuration, calculated output, conditional activation/deactivation, repeater rows and durable IndexedDB payload/reload.
- `advanced-fields.test.ts` + `advanced-field-safety.test.ts` cover v2 activation, cycles, nested values, conditional/repeater validation, safe expression syntax, runtime caps and order-independent calculation rules.
- Orphaned `AdvancedFieldEditor` TSX/CSS and its unused reference sentinel were removed to avoid parallel architecture.

## Current blocker
- GitHub Actions jobs are not reaching `Set up job`; connector reports completed failures with `steps=null` and log download returns BlobNotFound.
- Local container has no repository checkout and cannot resolve `github.com` or `registry.npmjs.org`, so it cannot replace `npm ci`/Playwright.
- Vercel Sandbox is only exposed through documentation in the connected tooling; using deployment as CI is prohibited because deployments are manual-only by user rule.
- Do not infer code failure from these zero-step runs and do not infer success either.

## Durable F05 facts
- Canonical collections remain the only persistence source: `contentTypes`, `taxonomies`, `fieldGroups`, `records`; `relations` begins only in MF-043.
- No React below app/presentation layers.
- Field behavior resolves via versioned `FieldTypeRegistry`; callbacks/definitions are never serialized into `CanonicalProject`.
- Advanced nested fields reference reusable Field Groups by ID rather than duplicating schemas.
- Field Group deletion is guarded against taxonomy, record and advanced-schema references.
- Project mutations go through `ProjectSession`/`projectRef.current` and existing autosave/recovery.
- Durable persistence E2E polls IndexedDB before reload when correctness depends on storage visibility.

## Editor design direction
- Source: `design-system/electrocms-editor/MASTER.md` + `pages/editor.md`.
- Visual builder anatomy: top commands + left Insert/Elements Library + dominant canvas + right inspector.
- Backend data CRUD may use dense master-detail.
- Advanced fields are integrated in Field Groups + Records, not as a duplicate top-level editor.
- References adapted from `nextlevelbuilder/ui-ux-pro-max-skill`: `ui-ux-pro-max`, `design-system`, `ui-styling`; no forced Tailwind/shadcn migration.

## Resume protocol
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `MEMORY.md`, `TRACKING.md`, this handoff, `DECISIONS.md` and `.ai/memory/DECISIONS_LOG.md`.
2. Resolve the GitHub Actions runner/quota/initialization problem or obtain a real equivalent gate that does NOT deploy the app.
3. Re-run MF-042 HEAD and inspect actual steps/logs.
4. Fix any real lint/type/unit/E2E/build failures. Do not suppress rules.
5. Once verify + lint + TypeScript + unit + coverage + Playwright + build all PASS, update MEMORY/IMPLEMENTATION_MEMORY/DECISIONS/TRACKING/HANDOFF with the exact gate and mark MF-042 DONE.
6. Only then recover MF-043 Relations contract and begin it.

## Phase sequence
- MF-037 — DONE
- MF-038 — DONE
- MF-039 — DONE
- MF-040 — DONE
- MF-041 — DONE
- MF-042 — IN_PROGRESS; implementation present, executable gate blocked externally
- MF-043 — BLOCKED
- MF-044 — BLOCKED
