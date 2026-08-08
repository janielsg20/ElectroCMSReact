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

**MF-042 — Advanced fields is IN_PROGRESS.** Implementation is substantially complete and has received additional static hardening, but it MUST NOT be marked DONE until a real full quality gate executes. MF-043 remains BLOCKED.

## MF-042 implemented state
- `core/repeater`, `core/group`, `core/calculated`, `core/conditional` have v2 `available` definitions in `createContentFieldTypeRegistry()`; v1 historical definitions remain registered as modeled contracts.
- `core/relation`, `core/user`, `core/taxonomy` remain v1 `modeled` for MF-043.
- `advanced-field-runtime.ts`: React-free portable runtime, safe calculation tokenizer/parser/evaluator, conditional operators, nested Group/Repeater normalization/validation, max depth 8 and max Repeater items 100.
- `isMf042AdvancedField()` makes runtime activation version-aware so historical modeled definitions are not silently interpreted as the MF-042 runtime.
- Nested Group/Repeater payloads normalize canonically before persistence; nested Calculated values are recomputed and nested Conditional values resolve after sibling defaults are available.
- Calculated expressions may reference sibling Number/Currency only. Calculated→Calculated chaining is rejected so output is independent of schema order.
- Conditional sources must be non-advanced siblings. `greaterThan`/`lessThan` additionally require Number/Currency sources and finite numeric `compareValue`; `equals`/`notEquals` require `compareValue`; `truthy`/`falsy` do not.
- `advanced-field-group.ts`: contextual references, calculation source rules, condition source rules, cycle protection and reference-depth protection.
- `advanced-field-group-integrity.ts`: deleting a Field Group is blocked while another advanced field references it.
- `field-group-update-integrity.ts`: updating a Field Group is blocked when the candidate schema would invalidate an existing Record. Dependency detection is transitive through nested Group/Repeater/Conditional references, preventing persisted Records from disappearing from list views after an incompatible schema edit.
- Public `updateFieldGroup` is routed through the record-integrity wrapper; low-level `updateAdvancedFieldGroup` remains the schema mutation primitive.
- `advanced-content-record.ts`: advanced record normalization is version-aware and staged structural → calculated → conditional.
- Field Group authoring remains one path: Field Library → Stored Order → Inspector. There is no duplicate Advanced Fields top-level editor.
- Records uses `AdvancedRecordFieldControl` for nested Group, Repeater rows, Calculated read-only and Conditional reactive UI. The control refuses to execute modeled/historical field versions as MF-042 runtime.
- `e2e/advanced-fields.spec.ts` covers reusable groups, schema configuration, calculation, condition activation/deactivation, Repeater rows and durable IndexedDB reload.
- Unit/safety coverage now includes registry caps, safe expression syntax, compare-value rules, numeric conditional-source compatibility, nested canonical normalization, runtime version boundary, direct record-integrity during schema updates and transitive nested record-integrity.

## Critical MF-042 invariants
- Core content runtime remains React-free.
- No parallel stores: `CanonicalProject.fieldGroups` and `CanonicalProject.records` remain authoritative.
- Advanced field behavior must resolve by type + version, never by type name alone.
- Historical modeled v1 contracts are not automatically migrated or executed as v2.
- Repeater hard cap is 100 rows; nested reference depth is 8.
- Calculated never uses `eval`, `Function` or dynamic code execution.
- Record values derived from a Field Group must remain valid after schema updates. Incompatible schema updates are rejected instead of hiding invalid records.
- Field Group deletion guards remain chained: advanced references → record assignments → taxonomy assignments.
- `relation`, `user`, `taxonomy` must remain modeled until MF-043.

## Quality-gate strategy
Normal `agent/**` development commits do not run the expensive workflow. `main` retains the final gate and dedicated quality PRs are used for microphase checks.

Primary manual gate:
- branch: `quality/f05`;
- PR #7 `quality/f05 -> main`;
- move `quality/f05` to the exact MF HEAD, reopen #7 once, inspect, then close without merge.

Additional diagnostic gate:
- fresh PR #8 was created from a fresh quality branch specifically to test `pull_request.opened`.
- PR #8 triggered run #1018, but both jobs failed before executing any step (`steps=[]`) and job log download returned `BlobNotFound`.
- This proves the failure is not caused by reusing PR #7 or by a missing opened/reopened event.

## Current Actions blocker
- Earlier runs #986/#990/#994/#1000/#1002 failed before any job step.
- Manual run #1014 also failed before any step.
- Fresh opened-event run #1018 also failed before any step; no usable job log exists.
- A later attempt on the newest MF-042 HEAD again produced zero workflow/check status at inspection time.
- Zero-step/no-run attempts are neither PASS nor FAIL evidence for code.
- Local execution cannot replace CI: the container cannot resolve `github.com`, and its npm mirror does not contain the project dependencies.
- Vercel Sandbox is not exposed as an executable connected runner here. Do not turn a deployment into CI; deployments remain manual-only by user rule.

## Durable F05 facts
- Canonical persistence collections remain `contentTypes`, `taxonomies`, `fieldGroups`, `records`; `relations` begins only in MF-043.
- Field behavior resolves through versioned `FieldTypeRegistry`; callbacks/definitions are not serialized into `CanonicalProject`.
- Advanced nested fields reference reusable Field Groups by ID rather than duplicating schemas.
- Project mutations go through `ProjectSession` / `projectRef.current` and existing autosave/recovery.
- Durable persistence E2E polls IndexedDB before reload when correctness depends on storage visibility.

## Editor design direction
- Source: `design-system/electrocms-editor/MASTER.md` + `pages/editor.md`.
- Visual builder anatomy: top commands + left Insert/Elements Library + dominant canvas + right inspector.
- Backend data CRUD may use dense master-detail.
- Advanced fields are integrated in Field Groups + Records, not a duplicate top-level editor.
- No forced Tailwind/shadcn migration.

## Resume protocol
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `MEMORY.md`, `TRACKING.md`, this handoff, `DECISIONS.md`, `.ai/memory/DECISIONS_LOG.md`, `KNOWN_ISSUES.md` and `QUALITY_GATES.md`.
2. Resolve the exact current `agent/f05-dynamic-content` HEAD before any gate attempt.
3. Check whether GitHub Actions hosted runners are usable for the repo/account.
4. For one gate attempt, move `quality/f05` to that exact HEAD, reopen PR #7 once, require actual executed steps/logs, then close #7 without merge.
5. Fix any real verify/lint/TypeScript/unit/coverage/Playwright/build failure; never infer code failure from zero-step jobs.
6. Only after all required checks PASS, update MEMORY/IMPLEMENTATION_MEMORY/DECISIONS/TRACKING/HANDOFF with the exact gate and mark MF-042 DONE.
7. Only then recover the exact MF-043 Relations contract and begin it.

## Phase sequence
- MF-037 — DONE
- MF-038 — DONE
- MF-039 — DONE
- MF-040 — DONE
- MF-041 — DONE
- MF-042 — IN_PROGRESS; implementation + hardening present, executable gate blocked externally
- MF-043 — BLOCKED
- MF-044 — BLOCKED
