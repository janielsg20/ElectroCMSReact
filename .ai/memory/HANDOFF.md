# HANDOFF.md

## Current state
F04 is closed. Active phase: **F05 — Dynamic Content** on current Studio Pro `main`.

Use `agent/f05-dynamic-content` only as a historical contract/test source. Never merge it wholesale and never reintroduce its retired UI/CSS.

## F05 modern integration state
- MF-037 Content Types: DONE — PR #34, Gate #1515, merge `748c6e61af114640a176665903b5f3bc0336ca07`.
- MF-038 Taxonomies: DONE — PR #41, Gate #1517, merge `7cf28bb23d2825fd6174f90720fd80cbe0314666`.
- MF-039 Field Type Registry: DONE — PR #42, Gate #1519, merge `0db52d1c8db88b70a6ce5c6275f14803397c9691`.
- MF-040 Custom Field Groups: DONE — PR #44, Gate #1524, merge `dcef1c3302c2520a1911884624fb059eef09f4c0`.
- MF-041 Records CRUD: DONE — PR #46, Gate #1528, merge `2aa05132b7c8303071ec33936fff9ca1d1c14fa1`.
- MF-042 Advanced Fields: DONE — PR #48, Gate #1533, merge `899a4fdc2d3ad65ced9f3086c43e7fc8d4b859ad`.
- **MF-043 Relations: NEXT.** Recover only the exact historical relation/reference runtime and tests; port onto fresh current `main`, preserve MF-042 behavior, then adapt Studio Pro and prove persistence/integrity before MF-044.

## Durable MF-042 facts
- `createContentFieldTypeRegistry()` preserves v1 modeled definitions and adds v2 available runtime for `core/group`, `core/repeater`, `core/calculated` and `core/conditional`.
- `core/relation`, `core/user` and `core/taxonomy` remain modeled at the MF-042 boundary.
- Advanced Field Groups validate reusable-group references, direct/indirect cycles and a maximum reference depth of 8.
- Repeater runtime hard cap is 100 rows.
- Calculated expressions support sibling Number/Currency names, numbers, `+ - * /`, unary minus and parentheses; no `eval`, `Function` or dynamic code execution.
- Conditional source must be a non-advanced sibling; numeric comparison operators require Number/Currency sources.
- Record normalization resolves Group/Repeater first, Calculated second and Conditional last so behavior is independent of schema order.
- Field Group deletion is blocked while advanced fields reference it.
- Field Group updates revalidate reusable-group ancestors and affected direct/nested Records before commit; destructive schema updates are rejected atomically.
- Studio Pro Field Groups exposes 24 available latest field types after MF-042 and keeps 3 reference types modeled.
- Studio Pro Records recursively edits Group/Repeater/Conditional values and displays Calculated results live.
- E2E proves nested values and calculations persist in IndexedDB, conditional false normalizes to null, and a child schema change that would invalidate an existing nested Record is rejected and not persisted.

## F05 invariants
- Core content runtime remains React-free.
- `CanonicalProject` collections are the sole persistent source of truth.
- UI mutations enter through public core APIs exposed by `ProjectSession`.
- Runtime behavior resolves by `type@version`; modeled contracts are not silently promoted.
- Never weaken tests to make a port pass.
- Studio Pro is the only editor visual system; frontend/backend themes remain independent.
- Vercel deployment remains manual-only.

## MF-043 boundary
MF-043 owns Relations/reference behavior. Do not pull MF-044 Dynamic Bindings forward. Preserve all MF-042 safety and schema-integrity rules while enabling only the reference contracts explicitly present in the historical MF-043 scope.

## Quality gate
Every modern port requires an executed PASS for repository verification, zero-warning lint, TypeScript strict, unit/integration, coverage, production build and Playwright E2E.

## Resume protocol
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `MEMORY.md`, `TRACKING.md`, this file, `QUALITY_GATES.md`, `.ai/memory/DECISIONS_LOG.md`, `.ai/memory/IMPLEMENTATION_MEMORY.md` and `.ai/memory/KNOWN_ISSUES.md`.
2. Start **MF-043** from fresh current `main`.
3. Recover exact historical relation domain/runtime/tests before designing modern UI.
4. Port core/integrity first, then public APIs/ProjectSession as needed, then Studio Pro, then E2E.
5. Require a full green quality gate before merge.
6. Update living documentation before moving to MF-044.

## Next action
**Implement MF-043 — Relations on top of current Studio Pro main.**
