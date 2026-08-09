# ElectroCMS Editor Design System — MASTER

## Purpose
This is the source of truth for the ElectroCMS **authoring chrome**. It does not define frontend/backend project themes.

ElectroCMS is a professional local-first no-code/low-code builder. The editor prioritizes canvas space, predictable navigation, information density, accessible interaction and confidence while editing.

## One visual system: Studio Pro
ElectroCMS exposes one editor UI/UX system: **Studio Pro** (`studio-pro`). It is implemented Tailwind-first. `light`, `dark` and `auto` are appearance modes of the same system. Project frontend/backend themes remain independent.

The previous Bento editor layer is retired. Do not restore `bento-high-density`, Bento-specific stylesheets, or a selectable editor preset UI.

## Product reference
Studio Pro follows the interaction model of professional visual builders such as FlutterFlow, Webflow and Wix Studio without copying their proprietary implementation:

- compact application toolbar;
- narrow global icon rail on desktop;
- persistent Pages/Components navigator on desktop;
- dominant canvas;
- persistent contextual Properties inspector on desktop;
- explicit responsive breakpoints;
- compact controls with clear selected/focus states;
- mobile authoring designed as a separate interaction mode instead of compressed desktop chrome.

## Desktop layout contract
For widths above the compact-shell breakpoint:

1. **Application toolbar** — about 60px high.
2. **Studio rail** — about 60px wide, icon-first.
3. **Builder navigator** — approximately 276–304px.
4. **Canvas** — flexible and always receives the largest remaining area.
5. **Properties inspector** — approximately 318–344px.

Pages/Components tabs, canvas toolbar and inspector start on the same vertical line. Avoid redundant rows that duplicate document/breakpoint information already present elsewhere.

Use 1px separators, restrained 6–12px radii and minimal elevation. This is a production editor, not a dashboard made of cards.

## Mobile and compact layout contract
At `<= 960px`, ElectroCMS switches to a **canvas-first authoring mode**.

Persistent desktop side panels are removed from layout flow. The default view is:

- compact application header;
- visual canvas occupying the available workspace;
- contextual command strip only when a selection requires it;
- bottom dock with four stable destinations: **Pages, Add, Layers, Properties**.

Pages/Add/Layers/Properties open as temporary bottom sheets. Sheets:

- use `role="dialog"` + `aria-modal="true"`;
- expose a visible close action;
- close with `Escape` and backdrop activation;
- autofocus the close action when opened;
- never leave hidden focusable controls in the document flow;
- keep the canvas state/model intact while open;
- cap height so the interaction still feels spatially connected to the canvas.

Critical touch targets are at least 48px in compact layouts. Do not depend on swipe/drag gestures as the only way to dismiss or operate a surface.

## Mobile header
At phone widths the header is one row, not a compressed desktop toolbar:

- menu trigger: 48px;
- active document: flexible center region;
- primary preview/publish action area: touch-safe controls;
- secondary zoom/history/theme controls may be hidden from the phone header when the same task remains reachable elsewhere.

The root document must not horizontally scroll.

## Tailwind implementation rules
Studio Pro is authored primarily through Tailwind utilities and `@apply` in `src/app/ui/studio-pro-tailwind.css`.

Rules:

- prefer Tailwind layout/spacing/typography/state utilities;
- use CSS custom properties for semantic color/elevation roles and canvas-specific values;
- keep one final Studio Pro layer rather than accumulating patch stylesheets;
- use media queries only for actual interaction-mode changes that Tailwind utilities alone do not express cleanly;
- do not create a second visual theme to fix a component locally;
- component behavior belongs in React; appearance belongs in Tailwind/CSS;
- never use DOM layout as project/canvas source of truth.

## Canvas
The canvas is always the dominant working surface.

- workspace and authored document must remain visually distinguishable;
- document boundary stays visible at supported zoom levels;
- canvas pan/scroll is locally contained;
- browser zoom remains enabled;
- scaled document uses stable top-center transform origin;
- guides/snapping/layers are transient editor state only;
- drag hit areas must not move because of decorative hover animation;
- structural edits go through canonical commands.

On compact layouts, stage bottom padding accounts for the mobile dock and safe-area inset.

## Navigation
Desktop navigation is an icon-first rail with accessible names. Compact navigation is an accessible drawer.

- icons never replace `aria-label`/visible names where needed;
- current destination is not communicated by color alone;
- drawer controls are at least 48px on touch layouts;
- settings stay contained in the drawer;
- drawer/backdrop cannot create root overflow.

## Inspector
Desktop uses a persistent right inspector. Compact mode uses the Properties sheet.

- schema-driven property controls remain the same in both modes;
- long schemas use disclosures;
- labels stay associated with inputs;
- responsive inheritance remains explicit;
- canonical reversible commands remain the only mutation path;
- no parallel mobile project state is allowed.

## Element library
Desktop: persistent Pages/Components navigator.
Compact: Pages and Add sheets.

The Components view retains search, categories and canonical widget insertion. After inserting a component from the mobile Add sheet, the sheet closes to return the user to the canvas.

## Interaction states
Every applicable control defines default, hover, focus-visible, pressed, selected/current and disabled states. Loading/saving/error/drag/locked/hidden states must also be explicit where relevant. Color is never the sole status signal.

## Motion
Motion explains state and must not move precision hit areas.

- hover/press: roughly 80–140ms;
- sheet/drawer reveal: roughly 160–220ms;
- favor transform/opacity;
- honor `prefers-reduced-motion`;
- avoid decorative looping motion in the editor.

## Accessibility baseline

- WCAG AA contrast target;
- visible `:focus-visible`;
- keyboard path for primary commands;
- semantic labels for inputs/selects;
- icon-only controls have accessible names;
- no hover-only functions;
- browser zoom remains available;
- no root horizontal overflow;
- compact touch targets >=48px;
- `prefers-reduced-motion` and increased/forced contrast are supported;
- modal sheets have explicit non-gesture dismissal.

## Responsive philosophy
Editor responsiveness is separate from the breakpoints of the site/app being authored.

- **Wide desktop:** persistent rail + navigator + canvas + inspector.
- **Laptop:** same architecture with constrained fixed panel widths.
- **Tablet/compact:** canvas-first with bottom dock and sheets; richer header may remain where space permits.
- **Phone:** single-row header + canvas + bottom dock + sheets.

Do not stack Pages, canvas and a large inspector permanently on a phone; doing so destroys the working area and is not considered a valid responsive implementation.

## Project theme separation
Keep these independent:

1. Studio Pro editor UI (`studio-pro`).
2. Editor appearance (`light` / `dark` / `auto`).
3. Frontend/backend project themes used by generated output.

## Quality checklist
Before completing an editor UI change:

- [ ] Studio Pro is the only editor visual system.
- [ ] No Bento stylesheet/preset is imported or selectable.
- [ ] Tailwind is the primary styling mechanism for new chrome.
- [ ] Desktop proportions preserve a dominant canvas.
- [ ] Phone default view is canvas-first.
- [ ] Pages/Add/Layers/Properties are reachable from the mobile dock.
- [ ] Mobile sheets are keyboard-dismissable and have visible close actions.
- [ ] Touch targets are >=48px in compact mode.
- [ ] No root horizontal overflow exists.
- [ ] Focus/selected/disabled states are explicit.
- [ ] Reduced-motion/high-contrast behavior is preserved.
- [ ] Canonical data/commands remain unchanged by presentation work.
- [ ] Lint, typecheck, unit, coverage, build and E2E gates pass.
