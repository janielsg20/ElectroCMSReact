# HANDOFF.md

## Current state
F04 is closed. Active phase: **F05 — Dynamic Content** on current Studio Pro.

Use `agent/f05-dynamic-content` only as a historical contract/test source. Never merge it wholesale and never reintroduce its retired UI/CSS.

## F05 modern integration state
- MF-037 Content Types: DONE — PR #34, Gate #1515, merge `748c6e61af114640a176665903b5f3bc0336ca07`.
- MF-038 Taxonomies: DONE — PR #41, Gate #1517, merge `7cf28bb23d2825fd6174f90720fd80cbe0314666`.
- MF-039 Field Type Registry: DONE — PR #42, Gate #1519, merge `0db52d1c8db88b70a6ce5c6275f14803397c9691`.
- MF-040 Custom Field Groups: DONE — PR #44, Gate #1524, merge `dcef1c3302c2520a1911884624fb059eef09f4c0`.
- MF-041 Records CRUD: DONE — PR #46, Gate #1528, merge `2aa05132b7c8303071ec33936fff9ca1d1c14fa1`.
- MF-042 Advanced Fields: DONE — PR #48, Gate #1533, merge `899a4fdc2d3ad65ced9f3086c43e7fc8d4b859ad`.
- **MF-043 Relations: DONE in PR #51 — Gate #1569 PASS.** Integrate PR #51 if it is still open; only then begin MF-044 from current `main`.

## Durable MF-043 facts
- `RelationDefinition` lives canonically in `CanonicalProject.relations` and is React-free.
- Relation cardinality is explicit per source/target: `one` or `many`; `bidirectional` is canonical metadata.
- `createContentFieldTypeRegistry()` preserves v1 modeled contracts and promotes `core/relation`, `core/user` and `core/taxonomy` to v2 `available`.
- Relation v2 config: `relationId` + `side`; its runtime stores Record ids and validates owner endpoint, target Content Type and cardinality.
- User v2 references an existing canonical user id or `null`.
- Taxonomy v2 config: `taxonomyId`; runtime validates Taxonomy existence and Content Type applicability. A new term catalog is not part of MF-043.
- Reference validation is recursive through MF-042 Group/Repeater/Conditional values.
- Record deletion is blocked while referenced by Relation fields.
- Relation update/delete is blocked if it would invalidate Field Groups or Records.
- Content Type deletion is blocked while used as a Relation endpoint.
- Taxonomy deletion is blocked while referenced by a v2 taxonomy field.
- Field Group delete/update integrity must use the MF-043 registry so reference fields remain valid during destructive checks.
- `ProjectSession` owns Relation mutations and autosave; Studio Pro does not mutate canonical maps directly.
- Studio Pro Relations is real CRUD; Field Groups author reference config; Records edit reference values top-level and inside advanced nested structures.
- E2E proves Product→Brand creation, IndexedDB persistence/reload and rejection of destructive Record/Relation mutations.
- Gate #1569 PASS: verify repo, lint zero-warning, TypeScript strict, 181 unit/integration tests, coverage, production build and Playwright E2E.

## Preserved MF-042 facts
- Advanced Field Groups validate reusable-group references, direct/indirect cycles and maximum depth 8.
- Repeater hard cap is 100 rows.
- Calculated uses a safe arithmetic parser; no `eval`, `Function` or dynamic code execution.
- Conditional source must be a non-advanced sibling; numeric comparison operators require Number/Currency sources.
- Record normalization resolves nested advanced values deterministically.

## F05 invariants
- Core content runtime remains React-free.
- `CanonicalProject` collections are the sole persistent source of truth.
- UI mutations enter through public core APIs exposed by `ProjectSession`.
- Runtime behavior resolves by `type@version`; modeled contracts are not silently promoted.
- Never weaken tests to make a port pass.
- Studio Pro is the only editor visual system; frontend/backend themes remain independent.
- Vercel deployment remains manual-only.
- Do not implement MF-044 on the MF-043 branch.

## MF-044 boundary
MF-044 owns Dynamic Bindings. Begin only from `main` after PR #51 is integrated and re-read its own microphase contract before editing code. Do not infer MF-044 scope from the historical branch without checking the current `.md` files.

## Quality gate
Every modern port requires an executed PASS for repository verification, zero-warning lint, TypeScript strict, unit/integration, coverage, production build and Playwright E2E.

## Resume protocol
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `MEMORY.md`, `TRACKING.md`, this file, `QUALITY_GATES.md`, `.ai/memory/DECISIONS_LOG.md`, `.ai/memory/IMPLEMENTATION_MEMORY.md` and `.ai/memory/KNOWN_ISSUES.md`.
2. If PR #51 is still open, integrate it; do not start MF-044 beforehand.
3. Start MF-044 from fresh current `main` only after MF-043 is integrated.
4. Recover the exact MF-044 contract/tests before designing UI.
5. Port core/integrity first, then public APIs/ProjectSession as needed, then Studio Pro, then E2E.
6. Require a full green quality gate before merge.
7. Update living documentation before moving beyond MF-044.

## Next action
**Integrate PR #51 if still open. After integration, begin MF-044 — Dynamic Bindings from current `main`.**
