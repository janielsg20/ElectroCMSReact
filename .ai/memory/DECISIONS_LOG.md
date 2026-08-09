# DECISIONS_LOG.md

This compact log mirrors durable architectural decisions from `DECISIONS.md` for fast session recovery. `DECISIONS.md` remains authoritative.

## Through F03
- ADR-001…005: IndexedDB/repositories, independent schemas, migration-before-edit, separate recovery, reproducible npm.
- ADR-006…011: History API routing, persistent project session, workspace preferences separation, editor-only compact breakpoint, honest history controls, contained compact header.
- ADR-012…018: derived parent/depth, DOM as projection, canonical command history, paste ID remap, responsive geometry, semantic snapping priority, metadata-only autosave completion.

## F04
- ADR-019: widget definitions/factories are framework-neutral; React previews bind separately by `type@version`.
- ADR-020: inspector is schema-generated and writes validated reversible commands.
- ADR-021: responsive visual styles remain in `ResponsiveStyleSet`; no parallel style store.
- ADR-022: DnD uses stable hit areas and no React structural rerender during native `dragstart`; ephemeral data attributes may drive paint-only feedback.
- ADR-023: editor appearance, editor visual system, frontend theme and backend theme are separate concerns.
- ADR-024: project theme definitions live in an extensible framework-neutral registry; project stores selected IDs.
- ADR-025: imported theme definitions are local editor-library data, not duplicated inside canonical projects.
- ADR-026: theme package format is versioned, max 256 KB, deep portable JSON validated and collision-safe.
- ADR-027: adapt professional UX/design-system principles without forcing an unrelated framework rewrite.
- ADR-028: Vercel Git auto-deploy is disabled; previews deploy only on explicit user request.

## Studio UI
- ADR-029 (superseded): the first unified editor system used `bento-high-density` after selectable UI presets were retired.
- ADR-030: `studio-pro` supersedes Bento as the only editor visual system. It is Tailwind-first, preserves light/dark/auto as appearance modes, keeps project themes independent, and uses persistent desktop panels but a canvas-first mobile dock with accessible Pages/Add/Layers/Properties sheets. Legacy Bento preference IDs normalize to `studio-pro` without a workspace schema bump.
