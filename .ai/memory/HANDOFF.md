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

**MF-042 — Advanced fields is IN_PROGRESS.** Core + authoring UI + record runtime + unit/E2E tests are implemented, but it MUST NOT be marked DONE until a real full quality gate executes. MF-043 remains BLOCKED.

## MF-042 implemented state
- `core/repeater`, `core/group`, `core/calculated`, `core/conditional` have v2 `available` definitions in `createContentFieldTypeRegistry()`; v1 historical definitions remain registered.
- `core/relation`, `core/user`, `core/taxonomy` remain v1 `modeled` for MF-043.
- `advanced-field-runtime.ts`: portable advanced runtime, safe calculation tokenizer/parser/evaluator, conditional operators, nested group/repeater validation, max depth 8, max repeater items 100.
- `advanced-field-types.ts`: v2 definitions/config/value contracts.
- `advanced-field-group.ts`: contextual refs, sibling-source rules, calculated source rules, cycles and reference-depth protection.
- Calculated expressions may reference sibling Number/Currency only. Calculated→Calculated chaining is rejected so result cannot depend on field order.
- Conditional source fields must be non-advanced siblings. This prevents Conditional defaults/runtime from depending on whether another advanced field appears before/after it in stored schema order.
- `advanced-field-group-integrity.ts`: Field Group deletion blocked while another advanced field references it.
- `advanced-content-record.ts`: advanced record normalization layered over MF-041 CRUD; top-level normalization is staged structural → calculated → conditional.
- Conditional inactive values normalize canonically to `null`.
- Field Group authoring remains one path: Field Library → Stored Order → Inspector. Repeater/Group/Calculated/Conditional settings are configured there; no separate AdvancedFieldEditor surface remains.
- Records uses `AdvancedRecordFieldControl` for nested Group, Repeater rows, Calculated read-only and Conditional reactive group UI.
- `e2e/advanced-fields.spec.ts` exercises reusable child groups, schema configuration, calculated output, conditional activation/deactivation, repeater rows and durable IndexedDB payload/reload.
- `advanced-fields.test.ts` + `advanced-field-safety.test.ts` cover v2 activation, cycles, nested values, conditional/repeater validation, safe expression syntax, runtime caps, calculated-source restrictions and conditional-source order independence.
- Orphaned `AdvancedFieldEditor` TSX/CSS and its unused reference sentinel were removed to avoid parallel architecture.

## Quality-gate strategy after Actions overuse
The old workflow ran on every `agent/**` push AND every PR synchronize event, effectively running the expensive gate twice for each connector file-write commit. This has been replaced.

Current `.github/workflows/quality.yml`:
- normal `agent/**` commits do **not** run the expensive gate;
- `main` push keeps the final defense;
- PR gate runs only for `opened`, `reopened`, `ready_for_review`;
- `workflow_dispatch` remains available from GitHub UI/API when supported.

Dedicated manual gate:
- branch: `quality/f05`;
- PR: #7 `quality/f05 -> main`;
- PR #7 is quality-only and must NEVER be merged;
- to request a gate: move `quality/f05` to the exact MF HEAD, reopen #7 once, inspect the single workflow, then close #7.
- PR #7 is currently CLOSED.
- `QUALITY_GATES.md` documents this procedure.

## Current Actions blocker
- Earlier runs #986/#990/#994/#1000/#1002 completed as failures before any step started (`steps=null`, no usable logs).
- A first manual gate on PR #7 (#1014) also ended before any steps started.
- A later reopen after moving `quality/f05` to the latest HEAD did not create a workflow/check at all; PR #7 was closed again.
- GitHub Status currently reports Actions operational and no incident today; the Aug 6–7 Actions incident is resolved. The remaining account/repository-specific blocker is therefore likely quota/billing/runner allocation, but connector tooling does not expose Actions billing to confirm it directly.
- Local container has no source checkout/dependency cache and cannot resolve `github.com`/`registry.npmjs.org`, so it cannot replace `npm ci`/Playwright.
- Vercel Sandbox is documentation-only in the connected tooling. Do NOT use deployment as CI; deployments are manual-only by user rule.
- Zero-step/no-run attempts are neither PASS nor FAIL evidence for MF-042.

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
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `MEMORY.md`, `TRACKING.md`, this handoff, `DECISIONS.md`, `.ai/memory/DECISIONS_LOG.md` and `QUALITY_GATES.md`.
2. Check whether GitHub Actions hosted runners are usable for the repo/account.
3. When ready for one attempt, move `quality/f05` to the exact current `agent/f05-dynamic-content` HEAD and reopen PR #7 once.
4. Require actual executed steps/logs. Fix any real lint/type/unit/E2E/build failures; do not suppress rules.
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
