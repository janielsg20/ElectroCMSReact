# HANDOFF.md

## Current state
F04 is closed and merged. The active development phase is **F05 — Dynamic Content** on the current Studio Pro `main` line.

The historical branch `agent/f05-dynamic-content` remains useful as a contract/evidence source only. **Do not merge it wholesale**: it is based on the pre-hardening UI and would reintroduce retired editor surfaces. Port F05 microphases sequentially onto fresh branches from current `main`.

## Active UI rule
One editor visual system only: **Studio Pro (`studio-pro`)**.

- No selectable editor visual presets.
- `light` / `dark` / `auto` are appearance modes of Studio Pro.
- Frontend/backend project themes remain independent.
- Do not reintroduce legacy F05 UI/CSS while porting domain capabilities.

## F05 modern integration state
Completed on the current Studio Pro line with executable GitHub Actions evidence:

- **MF-037 — Content Types: DONE.** PR #34 merged as `748c6e61af114640a176665903b5f3bc0336ca07`. Quality Gate #1515 PASS.
- **MF-038 — Taxonomies: DONE.** PR #41 merged as `7cf28bb23d2825fd6174f90720fd80cbe0314666`. Quality Gate #1517 PASS.
- **MF-039 — Field Type Registry: DONE.** PR #42 merged as `0db52d1c8db88b70a6ce5c6275f14803397c9691`. Quality Gate #1519 PASS.
- **MF-040 — Custom Field Groups: NEXT.** Port its historical validated core/runtime contract onto current `main`, then adapt the editor to Studio Pro.

Historical F05 work beyond MF-039 exists on `agent/f05-dynamic-content`, but it is **not considered integrated into current `main`** until each microphase is ported, validated and merged separately.

## Recovery findings that must not be repeated
- The old F05 branch ended up dozens of commits behind the current editor and was non-mergeable against Studio Pro.
- GitHub Actions hosted runners recovered; the previous zero-step/zero-run infrastructure incident is no longer the active blocker.
- Temporary quality PRs used to diagnose the legacy branch were closed without merge.
- The correct integration strategy is a clean sequential port from historical F05 contracts into current `main`.

## MF-037 durable facts
- Content Types use the canonical `project.contentTypes` map only.
- Mutations route through `ProjectSession` and autosave; no direct UI map mutations.
- The Studio Pro CRUD panel supports create/edit/delete and explicit selection.
- Deletion feedback remains visible even when the final Content Type is removed.
- Persistence E2E proves create → save → reload → edit → reload → delete → reload.

## MF-038 durable facts
- Taxonomy schema version 1 includes id, labels, slug, description, hierarchical mode, content type associations, optional field groups and optional archive template.
- At least one unique Content Type association is required.
- Referenced Content Types, Field Groups and Archive Templates are validated before mutation.
- Taxonomy IDs are immutable after creation; duplicate IDs/slugs are rejected.
- Mutations route through `ProjectSession` and the same local-first autosave path.
- Studio Pro Taxonomies CRUD is enabled; Field Groups/Records/Relations/Queries remain read-only until their microphases.

## MF-039 durable facts
- Core registry is React-free and resolves field types by **`type@version`**.
- The registry is extensible; external plugin field definitions register without modifying registry implementation.
- Definitions are defensively cloned so consumers cannot mutate registry state.
- Config migration is explicit and one version step at a time.
- The master-prompt minimum is represented by 27 builtin field contracts.
- **20 types are `available`; 7 later-runtime types remain `modeled`.** Do not mark modeled types functional early.
- Modeled types include later F05 behavior such as Relation, User, Taxonomy-term references, Repeater, Group, Calculated and Conditional.

## F05 invariants
- Core content runtime remains React-free.
- Canonical Project collections are the only project source of truth; no parallel stores.
- UI mutations must enter through public core APIs exposed by `ProjectSession` so validation, autosave and persistence remain atomic.
- Runtime behavior resolves by type + version, never by type name alone.
- Historical modeled v1 contracts are not silently promoted to later runtime semantics.
- Never weaken tests to make a port pass; fix the implementation or update genuinely obsolete UI selectors while preserving behavioral coverage.
- Do not import historical UI/CSS from the legacy F05 branch.

## Quality gate
GitHub Actions is authoritative. Every port must pass:

1. repository contract verification;
2. zero-warning lint;
3. TypeScript strict check;
4. unit/integration tests;
5. coverage gate;
6. production build;
7. Playwright E2E.

A microphase is not DONE until a real workflow executes all required steps successfully against the current `main` merge ref.

## Resume protocol
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `TRACKING.md`, this handoff, `QUALITY_GATES.md`, `.ai/memory/DECISIONS_LOG.md`, `.ai/memory/IMPLEMENTATION_MEMORY.md` and `.ai/memory/KNOWN_ISSUES.md`.
2. Treat older F04/PR #38 instructions in stale memory as superseded by this F05 handoff.
3. Start **MF-040** from fresh current `main`, using historical `agent/f05-dynamic-content` only to recover its validated contract/tests.
4. Port core domain first, then `ProjectSession`, then Studio Pro UI, then persistence E2E.
5. Open a PR to current `main`, require a full green quality gate, merge only after PASS.
6. Update this handoff and `TRACKING.md` with exact PR/commit/run evidence before moving to MF-041.

## Next action
**Implement MF-040 — Custom Field Groups on top of current Studio Pro main.**
