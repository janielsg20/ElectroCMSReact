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
- **MF-042 Advanced Fields: NEXT.** Recover only its historical domain/runtime/test contract, port onto fresh current `main`, adapt Studio Pro and prove persistence/runtime behavior before MF-043.

## Durable MF-041 facts
- `ContentRecordDefinition` v1 is React-free and portable.
- Statuses: `draft`, `published`, `archived`.
- Record IDs and `createdAt` are immutable; slugs are unique per Content Type.
- Records reference an existing Content Type and optional existing Field Groups.
- Missing field values normalize from Field Group defaults; required values remain enforced.
- Custom field values validate through `FieldTypeRegistry` at stored `type@version`.
- Unknown/unselected groups and unknown field storage names are rejected.
- Field Group deletion is blocked while any canonical Record references that group, while the underlying taxonomy-aware deletion rule remains intact.
- Record create/update/remove goes through `ProjectSession` and the existing autosave/recovery runtime.
- `RecordsCrudPanel` provides Studio Pro search, CPT/status filters, supports-aware core fields, Field Group assignment, registry-driven value controls, validation and two-step deletion.
- E2E proves actual IndexedDB create → reload → filter → edit/archive → durable write → delete → durable removal.

## F05 invariants
- Core content runtime remains React-free.
- `CanonicalProject` collections are the sole persistent source of truth.
- UI mutations enter through public core APIs exposed by `ProjectSession`.
- Runtime behavior resolves by `type@version`; modeled contracts are not silently promoted.
- Do not weaken tests to make a port pass.
- Studio Pro is the only editor visual system; frontend/backend themes remain independent.
- Vercel deployment remains manual-only.

## MF-042 boundary
MF-042 may enable advanced non-relation field runtime only as defined by its historical contract. Do **not** pull MF-043 Relations/reference semantics forward. Reference/Relation/User/Taxonomy behavior that belongs to MF-043 must remain unavailable until that microphase.

## Quality gate
Every modern port requires an executed PASS for repository verification, zero-warning lint, TypeScript strict, unit/integration, coverage, production build and Playwright E2E.

## Resume protocol
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `MEMORY.md`, `TRACKING.md`, this file, `QUALITY_GATES.md`, `.ai/memory/DECISIONS_LOG.md`, `.ai/memory/IMPLEMENTATION_MEMORY.md` and `.ai/memory/KNOWN_ISSUES.md`.
2. Start **MF-042** from fresh current `main`.
3. Recover exact historical MF-042 core/runtime/tests before designing modern UI changes.
4. Port core first, then integrate Field Groups/Records/Public core APIs, then Studio Pro UI, then E2E.
5. Require a full green quality gate before merge.
6. Update living documentation before moving to MF-043.

## Next action
**Implement MF-042 — Advanced Fields on top of current Studio Pro main.**
