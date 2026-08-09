# HANDOFF.md

## Current state
F04 is fully closed and merged into `main` by squash at `57798d9e00f4a3bb87867a847c3bccfccc82f764` after GitHub Actions run #712 PASS.

F05 — Contenido dinámico is active on `agent/f05-dynamic-content` / draft PR #6.

Completed with executable gate evidence:
- MF-037 CPT — run #730; docs #740.
- MF-038 Taxonomy — run #766; docs #776.
- MF-039 Field type registry — run #786; docs #800.
- MF-040 Custom field groups — run #834; docs #850.
- MF-041 Records CRUD — run #901; docs #915; evidence-sync #921.

Current closure state:
- **MF-042 — Advanced fields: IMPLEMENTED / UNVERIFIED.** Implementation and hardening are present, but it MUST NOT be marked DONE until a real full quality gate executes.
- **MF-043 — Relations: IMPLEMENTED / UNVERIFIED.** Implementation has been recovered, audited and further hardened, but it also MUST NOT be marked DONE without an executable full gate.
- **MF-044 — Dynamic bindings: BLOCKED.** Do not begin it until the current gate blocker is resolved and MF-042/MF-043 can be closed honestly.

## MF-042 implemented state
- `core/repeater`, `core/group`, `core/calculated`, `core/conditional` have v2 `available` definitions; v1 historical definitions remain modeled contracts.
- `advanced-field-runtime.ts`: React-free portable runtime, safe calculation tokenizer/parser/evaluator, conditional operators, nested Group/Repeater normalization/validation, max depth 8 and max Repeater items 100.
- `isMf042AdvancedField()` makes runtime activation version-aware so historical modeled definitions are not silently interpreted as MF-042 runtime.
- Nested Group/Repeater payloads normalize canonically before persistence; nested Calculated values are recomputed and nested Conditional values resolve after sibling defaults are available.
- Calculated expressions may reference sibling Number/Currency only. Calculated→Calculated chaining is rejected so output is independent of schema order.
- Conditional sources must be non-advanced siblings. Numeric operators require Number/Currency sources and finite numeric `compareValue`; equality operators require `compareValue`.
- Field Group authoring remains one path: Field Library → Stored Order → Inspector. There is no duplicate Advanced Fields top-level editor.
- Records uses `AdvancedRecordFieldControl` for nested Group, Repeater rows, Calculated read-only and Conditional reactive UI.
- Field Group update/delete integrity protects direct and transitive Record dependencies.
- `e2e/advanced-fields.spec.ts` and unit/safety/version/integrity tests cover the durable runtime.

## MF-043 recovered + hardened state
Canonical model and runtime:
- `src/core/content/relation.ts`: `RelationDefinition` v1 with source/target CPT, one/many cardinality, bidirectional flag, CRUD and stable ID validation.
- `src/core/content/reference-field-types.ts`: `core/relation`, `core/user`, `core/taxonomy` v2 are `available`; v1 historical contracts remain modeled.
- Relation values are unique Record ID arrays; User is one user ID or null; Taxonomy stores unique term IDs scoped to one configured taxonomy.
- Reference runtime is version-aware through `isMf043ReferenceField()`.
- Relation contextual validation checks relation existence, owner endpoint, cardinality, referenced Record existence and opposite CPT.
- User contextual validation checks `CanonicalProject.users`.
- Taxonomy contextual validation checks taxonomy existence and CPT applicability; taxonomy-term catalog CRUD is still outside current scope.

Referential integrity:
- `reference-content-record.ts` validates MF-043 references recursively through MF-042 Group/Repeater/Conditional structures and blocks deletion of referenced Records.
- `reference-field-group.ts` validates relation/taxonomy references while authoring/updating Field Groups and protects Records from incompatible schema changes.
- `relation-integrity.ts` rejects Relation updates that would invalidate existing Field Groups or Records.
- `relation-content-type-integrity.ts` blocks deletion of CPTs used as Relation endpoints.
- `reference-taxonomy-integrity.ts` blocks deletion of taxonomies referenced by v2 Taxonomy fields.
- Public exports in `src/core/content/index.ts` route Relation/CPT/Taxonomy/Field Group/Record mutations through integrity-aware wrappers.
- **MF-042→MF-043 registry hardening:** `advanced-field-group-integrity.ts` now defaults to the full registry from `reference-field-types`, not the MF-042-only registry. This prevents deletion of an otherwise unassigned Field Group containing Relation/User/Taxonomy v2 fields from failing as an apparently invalid historical schema.

Backend authoring:
- `DynamicContentManager` has an accessible Relations tab next to Content Types, Taxonomies, Field Groups and Records.
- `RelationEditor.tsx` provides dense master-detail Relation CRUD against the canonical ProjectSession.
- `ReferenceRecordFieldControl.tsx` renders User, Taxonomy and Relation Record controls without parallel stores.
- `FieldGroupEditor.tsx` uses contextual registry descriptors instead of manual ID text entry:
  - `relation-id` → select an existing canonical Relation;
  - `relation-side` → source/target selector;
  - `taxonomy-id` → select an existing canonical Taxonomy.
- `reference-field-types.ts` publishes those contextual config descriptors while retaining core validation as the authority.

MF-043 tests added/hardened:
- `src/core/content/reference-integrity.test.ts` covers relation cardinality/opposite-endpoint validation, referenced Record deletion protection, Relation deletion protection, endpoint CPT deletion protection and atomic Relation-update rejection.
- The same suite now covers deletion of an unassigned Field Group containing MF-043 fields, exercising the full-registry deletion fix.
- The suite now exercises **User + Taxonomy through the full ContentRecord validation/mutation path**, including unknown user rejection, wrong taxonomy/CPT scope rejection and taxonomy-delete protection while referenced by a Field Group.
- Strict TypeScript guards were added before spreading indexed Record/Relation values; `expect(...).toBeDefined()` is not treated as a narrowing primitive under `strict + noUncheckedIndexedAccess`.
- `src/core/content/reference-field-types.test.ts` covers v1/v2 boundary, contextual reference validation and regression assertions for `relation-id` / `relation-side` / `taxonomy-id` config descriptors.
- `e2e/relations.spec.ts`: Products/Brands → Relation → Relation Field Group → Records → durable IndexedDB assertion → reload → referenced Record delete guard → incompatible Relation update guard → Relation delete guard → reload/persistence proof.
- The E2E uses deterministic Record IDs and the contextual Relation selectors.

## Critical F05 invariants
- Core content runtime remains React-free.
- No parallel stores: canonical Project collections remain authoritative.
- Advanced/reference behavior resolves by type + version, never by type name alone.
- Public F05 mutation paths that validate Field Groups/Records must use the **full current F05 registry** once MF-043 fields are available; MF-042-only registries remain valid only inside explicitly internal MF-042 primitives that receive the full registry from their MF-043 wrapper.
- Historical modeled v1 contracts are not automatically migrated or executed as v2.
- Repeater hard cap is 100 rows; nested reference depth is 8.
- Calculated never uses `eval`, `Function` or dynamic code execution.
- Record values derived from Field Groups must remain valid after schema/Relation changes; incompatible mutations are rejected before commit.
- Relation fields may reference only Records on the opposite configured endpoint and must obey side cardinality.
- Destructive operations do not silently cascade through Relations/references.
- Durable persistence E2E polls IndexedDB before reload when correctness depends on storage visibility.

## Quality-gate strategy
Normal `agent/**` development commits do not run the expensive workflow. `main` retains the final gate and dedicated quality PRs are used for microphase checks.

Primary manual gate:
- branch: `quality/f05`;
- PR #7 `quality/f05 -> main`;
- move `quality/f05` to the exact F05 HEAD, inspect a real workflow, then close #7 without merge.

Diagnostic gate used in the latest recovery pass:
- fresh branch `quality/f05-fresh-20260808` from the exact F05 HEAD;
- fresh PR #37 → `main` to force a new `pull_request.opened` event;
- later synchronized repeatedly to the new hardening HEADs;
- PR #37 was closed without merge after it still produced zero workflow runs.

## Current Actions blocker
Historical evidence:
- Runs #986/#990/#994/#1000/#1002/#1014 failed before any job step.
- Fresh opened-event PR #8 produced run #1018, but both jobs had `steps=[]`; log download returned `BlobNotFound`.
- Later MF-042 attempts also produced zero workflow/check status.

Latest evidence:
- `main` currently contains `.github/workflows/quality.yml` with `pull_request: branches: [main]`, so the base branch still defines the expected PR trigger.
- PR #37 was created fresh from the current F05 lineage and later synchronized through hardening head `f5ab202e8aba0ec222fd3bd9f4dbd25cd2759575`.
- `fetch_commit_workflow_runs` returned **zero workflow runs** for that synchronized HEAD.
- Therefore verify/lint/TypeScript/unit/coverage/Playwright/build still did not execute; this is neither PASS nor FAIL evidence for the code.
- Container recheck: Node 22 and a global TypeScript compiler are present, but `git ls-remote https://github.com/janielsg20/ElectroCMSReact.git` still fails because `github.com` cannot be resolved. The container therefore cannot clone/install the full project and cannot replace the official gate.
- Static TypeScript reasoning was still used to catch the `noUncheckedIndexedAccess` spread issue described above, but this is not a substitute for `npm run typecheck`.
- Do not use a deployment as a CI substitute; `QUALITY_GATES.md` remains authoritative.

## Durable F05 facts
- Canonical persistence collections are `contentTypes`, `taxonomies`, `fieldGroups`, `records`, `relations`, plus existing `users` and other project collections; no feature-specific duplicate stores.
- Field behavior resolves through the versioned `FieldTypeRegistry`; callbacks/definitions are never serialized into `CanonicalProject`.
- Advanced nested fields reference reusable Field Groups by ID rather than duplicating schemas.
- Project mutations go through `ProjectSession` / `projectRef.current` and existing autosave/recovery.
- Reference-integrity wrappers must remain the public mutation surface exposed by `src/core/content/index.ts`.

## Editor design direction
- Source: `design-system/electrocms-editor/MASTER.md` + `pages/editor.md`.
- Visual builder anatomy: top commands + left Insert/Elements Library + dominant canvas + right inspector.
- Backend data CRUD may use dense master-detail.
- Advanced/reference fields are integrated in Field Groups + Records, not duplicate top-level editors.
- No forced Tailwind/shadcn migration.

## Resume protocol
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `MEMORY.md`, `TRACKING.md`, this handoff, `DECISIONS.md`, `.ai/memory/DECISIONS_LOG.md`, `KNOWN_ISSUES.md` and `QUALITY_GATES.md`.
2. Resolve the exact current `agent/f05-dynamic-content` HEAD before any gate attempt; documentation commits may move it beyond the last code head recorded here.
3. Check whether GitHub Actions hosted runners are actually producing jobs/steps for the repo/account.
4. Move `quality/f05` to that exact HEAD and inspect the technical PR/workflow; require actual executed steps/logs, then close #7 without merge.
5. Fix any real verify/lint/TypeScript/unit/coverage/Playwright/build failure; never infer code failure from zero-step/no-run attempts.
6. Re-audit any public mutation path that still instantiates an MF-042-only registry after MF-043 activation; internal MF-042 primitives are allowed only when the MF-043 wrapper passes the full registry explicitly.
7. Only after all required checks PASS, update MEMORY/IMPLEMENTATION_MEMORY/DECISIONS/TRACKING/HANDOFF with exact evidence and close MF-042/MF-043 in sequence.
8. Only then begin MF-044 Dynamic bindings.

## Phase sequence
- MF-037 — DONE
- MF-038 — DONE
- MF-039 — DONE
- MF-040 — DONE
- MF-041 — DONE
- MF-042 — IMPLEMENTED / UNVERIFIED; executable gate blocked externally
- MF-043 — IMPLEMENTED / UNVERIFIED; recovered + hardened, executable gate blocked externally
- MF-044 — BLOCKED
