# DECISIONS.md

## ADR-F05-040-01 — Custom field groups persist only in CanonicalProject
**Status:** Accepted

`FieldGroupDefinition` and `CustomFieldDefinition` are versioned portable JSON stored exclusively in `CanonicalProject.fieldGroups`. Registry callbacks, React components and duplicated field-type definitions are never serialized into project data.

Reason: one canonical source of truth preserves local-first persistence, exportability and deterministic validation.

## ADR-F05-040-02 — Field behavior resolves through FieldTypeRegistry
**Status:** Accepted

Custom fields persist `type + typeVersion`; type-specific config/default validation is delegated to `FieldTypeRegistry`. The group model and UI must not grow hardcoded validation switches per type.

Advanced definitions with `availability=modeled` cannot be instantiated during MF-040. MF-042/MF-043 own those runtimes.

## ADR-F05-040-03 — Field order is canonical array order
**Status:** Accepted

The order of `FieldGroupDefinition.fields[]` is the persisted field order. Reorder operations update that array directly; no separate ordering store is permitted.

## ADR-F05-040-04 — Referential delete safety
**Status:** Accepted

A field group cannot be deleted while a taxonomy references its ID through `fieldGroupIds`. Future known references must receive equivalent explicit guards rather than silent cascade deletion.

## ADR-UI-001 — Elementor-like visual-builder anatomy, original ElectroCMS implementation
**Status:** Accepted

The primary ElectroCMS visual editor must use the interaction anatomy of a professional page builder:

1. top command/header bar;
2. left **Insert / Elements Library**;
3. dominant central visual canvas;
4. right contextual inspector.

The left panel is a first-class insertion surface with search, categories, icon+label discovery, click-to-insert and drag-to-canvas as applicable. It may later expose modes such as Elements, Layers/Navigator and Templates/Blocks.

This decision uses tools such as Elementor only as an interaction-model reference. ElectroCMS must keep its own identity, terminology, assets, architecture, code and visual composition and must not copy proprietary implementation.

Backend CRUD tasks that are primarily list/edit workflows may use dense master-detail layouts. That exception must not transform the main visual editor into a generic card dashboard.

Responsive variants may move Insert Library and Inspector into drawers/sheets, but access to insertion and inspection cannot be removed.
