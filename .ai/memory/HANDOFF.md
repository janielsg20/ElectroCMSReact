# HANDOFF.md

## Current state
F04 is closed. Active phase: **F05 — Dynamic Content** on the current Studio Pro `main` line.

Use `agent/f05-dynamic-content` only as a historical contract/test source. **Never merge it wholesale** and never reintroduce its retired UI/CSS. Port each F05 microphase onto a fresh branch from current `main`.

## F05 modern integration state
- **MF-037 — Content Types: DONE.** PR #34, merge `748c6e61af114640a176665903b5f3bc0336ca07`, Quality Gate #1515 PASS.
- **MF-038 — Taxonomies: DONE.** PR #41, merge `7cf28bb23d2825fd6174f90720fd80cbe0314666`, Quality Gate #1517 PASS.
- **MF-039 — Field Type Registry: DONE.** PR #42, merge `0db52d1c8db88b70a6ce5c6275f14803397c9691`, Quality Gate #1519 PASS.
- **MF-040 — Custom Field Groups: DONE.** PR #44, merge `dcef1c3302c2520a1911884624fb059eef09f4c0`, Quality Gate #1524 PASS.
- **MF-041 — Records CRUD: NEXT.** Recover its historical core/tests, port to current `main`, expose mutations through `ProjectSession`, adapt to Studio Pro and prove local persistence with E2E.

## Durable MF-040 facts
- `FieldGroupDefinition` and `CustomFieldDefinition` are versioned, portable and React-free.
- Field Group IDs are immutable after creation.
- Fields preserve explicit order and require unique IDs and storage names.
- Field config/defaults validate through the MF-039 registry at stored `type@version`.
- MF-040 instantiates only the 20 field types marked `available`; Relation, User, Taxonomy, Repeater, Group, Calculated and Conditional remain unavailable until their dedicated microphases.
- Deleting a Field Group referenced by a Taxonomy is blocked.
- All UI mutations enter through `ProjectSession`; `project.fieldGroups` is never directly mutated by the UI.
- `FieldGroupsCrudPanel` provides Studio Pro CRUD, field ordering, field-type library, basic registry-driven config/default controls and explicit modeled-type messaging.
- E2E proves create with Text/Currency fields → autosave → reload → order/config/default persistence → group edit → reload → delete → reload.

## F05 invariants
- Core content runtime remains React-free.
- `CanonicalProject` collections are the sole persistent source of truth; no parallel stores.
- UI mutations use public core APIs exposed by `ProjectSession`, preserving validation/autosave/persistence atomically.
- Runtime behavior resolves by `type@version`, never by type name alone.
- A `modeled` contract is not silently promoted to functional behavior.
- Do not weaken tests to pass a port.
- Studio Pro is the only editor visual system; project frontend/backend themes remain separate.
- Vercel deployments remain manual-only.

## Quality gate
Every microphase requires a real GitHub Actions run with PASS for repository verification, zero-warning lint, TypeScript strict, unit/integration, coverage, production build and Playwright E2E. Historical evidence alone never marks a modern port DONE.

## Resume protocol
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `MEMORY.md`, `TRACKING.md`, this file, `QUALITY_GATES.md`, `.ai/memory/DECISIONS_LOG.md`, `.ai/memory/IMPLEMENTATION_MEMORY.md` and `.ai/memory/KNOWN_ISSUES.md`.
2. Start **MF-041** from fresh current `main`.
3. Use the historical F05 branch only to recover the exact Records domain/test contract.
4. Port core first, then `ProjectSession`, then Studio Pro UI, then IndexedDB/reload E2E.
5. Require a full green quality gate before merge.
6. Update living documentation before moving to MF-042.

## Next action
**Implement MF-041 — Records CRUD on top of current Studio Pro main.**
