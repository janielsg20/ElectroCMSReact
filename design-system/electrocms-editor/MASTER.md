# ElectroCMS Editor Design System — MASTER

## Purpose
This is the source of truth for the ElectroCMS **authoring chrome**. It does not define frontend/backend project themes.

ElectroCMS is a professional local-first no-code/low-code builder. The editor prioritizes canvas space, predictable navigation, information density, accessible interaction and confidence while editing.

## One visual system: Studio Pro
ElectroCMS exposes one editor UI/UX system: **Studio Pro** (`studio-pro`). It is Tailwind-first. `light`, `dark` and `auto` are appearance modes of the same system. Project frontend/backend themes remain independent.

Do not introduce selectable editor visual presets or parallel visual skins. Improve the shared system at the component/source level.

## Product reference
The primary composition reference is the supplied professional visual-builder screenshot. Studio Pro follows the same class of interaction model used by mature visual builders such as FlutterFlow, Webflow and Wix Studio without copying proprietary implementation.

Required composition:
- continuous compact application toolbar;
- narrow global icon rail on desktop;
- persistent Pages/Components navigator on desktop;
- dominant canvas;
- persistent contextual Properties inspector on desktop;
- explicit responsive breakpoints;
- mobile authoring as a dedicated interaction mode rather than compressed desktop chrome.

## Visual character
Studio Pro is a precision authoring tool, not a dashboard.

Use:
- continuous work surfaces;
- 1px separators;
- neutral white/light-gray chrome in light mode;
- restrained dark surfaces in dark mode;
- modest 6–12px radii;
- minimal elevation except floating menus, dialogs and authored-document separation;
- compact but readable typography;
- strong spatial alignment.

Avoid:
- decorative mosaic layouts;
- oversized cards;
- stacked card-on-card compositions;
- heavy gradients;
- unrelated accent colors;
- persistent decorative animation;
- rounded containers around every control group.

## Functional color system
Color must communicate purpose and state, never visual noise.

Suggested roles:
- **Blue:** active navigation, editing, selection, primary canvas actions.
- **Violet/indigo:** creation, publishing and preview-adjacent actions.
- **Cyan/green:** data, workflows, forms and positive actions.
- **Amber:** settings, warnings and workspace state.
- **Rose:** exceptional/secondary specialist tools only.
- **Slate/neutral:** secondary and inactive controls.

Rules:
- default chrome remains predominantly neutral;
- use soft tinted backgrounds for hover/current states;
- use saturated color mainly for icon, indicator or primary CTA;
- selected/current state must not rely on color alone;
- maintain WCAG AA contrast.

## Desktop layout contract
For widths above the compact-shell breakpoint:

1. **Application toolbar** — approximately 64px high.
2. **Studio rail** — approximately 60px wide, icon-first.
3. **Builder navigator** — approximately 300px.
4. **Canvas** — flexible and always receives the largest remaining area.
5. **Properties inspector** — approximately 336px.

Pages/Components tabs, canvas toolbar and inspector start on the same vertical line. Avoid redundant rows that duplicate document/breakpoint information already present elsewhere.

The desktop rail must not repeat the application logo already shown in the top toolbar.

## Application toolbar
The toolbar establishes the editor hierarchy.

Order of importance:
1. project/navigation identity;
2. active document + breakpoint;
3. zoom/history/appearance;
4. preview;
5. primary publish/export action.

Primary CTA uses solid blue. Secondary actions stay neutral with small functional color cues. Avoid large shadows.

## Studio rail
Desktop navigation is a 60px icon rail.

- controls are about 44px square;
- current item uses a soft tinted background plus a visible edge indicator;
- icons may use restrained semantic color by function;
- hover animation is subtle and must not move the hit area;
- labels remain accessible through `aria-label`/title/tooltips even when visually hidden;
- settings remain anchored at the bottom.

Compact navigation becomes an accessible drawer and may show labels.

## Builder navigator
Desktop uses a persistent Pages/Components navigator.

- width target ≈300px;
- Pages/Components tabs use flat segmented navigation;
- active page is stronger by weight/background plus a thin blue edge;
- Widget Tree hierarchy may use subtle guide lines;
- Components uses search, categories and compact insertion tiles;
- insertion tiles may vary icon tint by category but retain neutral surfaces.

Do not make the navigator look like a separate dashboard card.

## Canvas
The canvas is always the dominant working surface.

- neutral dotted stage background;
- authored document has a clear 1px boundary and restrained shadow;
- selected nodes use a precise blue outline and subtle outer halo;
- canvas pan/scroll is locally contained;
- browser zoom remains enabled;
- scaled document uses stable top-center transform origin;
- guides/snapping/layers are transient editor state only;
- drag hit areas must not move because of decorative hover animation;
- structural edits go through canonical commands.

On compact layouts, stage bottom padding accounts for the mobile dock and safe-area inset.

## Canvas command toolbar
Desktop toolbar aligns with Builder navigator tabs and top of the inspector.

- target height ≈52px;
- controls are compact 32–36px high;
- Quick Add / primary insert action receives the strongest emphasis;
- other editing commands remain neutral;
- selected/toggled tools may use a soft semantic tint;
- horizontal overflow is local, never root-level.

## Inspector
Desktop uses a persistent right inspector. Compact mode uses the Properties sheet.

Visible top-level tabs are **Properties** and **Design**.

- schema-driven property controls remain the same in desktop/mobile modes;
- active tab uses a blue underline/current state rather than a large filled card;
- long schemas use disclosures;
- disclosure rows are separated by fine lines;
- labels stay associated with inputs;
- focus uses a visible blue ring/border;
- responsive inheritance remains explicit;
- canonical reversible commands remain the only mutation path;
- no parallel mobile project state is allowed.

## Mobile and compact layout contract
At `<= 960px`, ElectroCMS switches to a **canvas-first authoring mode**.

Persistent desktop side panels are removed from layout flow. The default view is:
- one-row compact application header;
- visual canvas occupying the available workspace;
- contextual command strip only when a selection requires it;
- bottom dock with four stable destinations: **Pages, Add, Layers, Properties**.

Pages/Add/Layers/Properties open as temporary bottom sheets.

Sheets:
- use `role="dialog"` + `aria-modal="true"`;
- expose a visible close action;
- close with `Escape` and backdrop activation;
- autofocus the close action when opened;
- never leave hidden focusable controls in the document flow;
- keep the canvas model intact while open;
- cap height so the user retains spatial context.

Critical touch targets are at least 48px. Do not depend on swipe/drag gestures as the only way to dismiss or operate a surface.

## Mobile header
Phone header is a single row of approximately 60px:
- menu trigger: 48px;
- active document: flexible center region;
- primary publish/export action: 48px;
- preview may be removed from the smallest header when another route exists;
- secondary zoom/history/theme controls may be omitted from the phone header when they remain reachable elsewhere.

The root document must not horizontally scroll.

## Mobile dock
The bottom dock is the primary phone navigation for builder context.

- Pages = blue cue;
- Add = violet cue;
- Layers = cyan cue;
- Properties = amber cue;
- surfaces remain mostly neutral;
- each control is at least 52px high on phone;
- active state combines tint, icon color and `aria-pressed`;
- dock respects `env(safe-area-inset-bottom)`.

## Motion
Motion explains interaction and must not disturb precision.

Target timings:
- hover/press/icon response: 120–160ms;
- active icon pop: about 180ms one-shot;
- bottom sheet reveal: 160–200ms;
- favor transform/opacity/color;
- no looping decorative animation;
- never animate canvas hit geometry;
- honor `prefers-reduced-motion` completely.

Typical icon behavior:
- hover: translateY(-1px) + scale about 1.05;
- press: scale about .94–.98;
- active destination: short one-shot pop;
- settings may rotate slightly when open.

## Tailwind implementation rules
Studio Pro is authored primarily through Tailwind utilities and `@apply` in `src/app/ui/studio-pro-tailwind.css`.

`src/app/ui/studio-pro.css` is the final Studio Pro entrypoint and may contain narrowly scoped unlayered rules where older unlayered canvas CSS would otherwise override the Tailwind cascade layer.

Rules:
- prefer Tailwind layout/spacing/typography/state utilities for component source;
- use CSS custom properties for semantic color/elevation roles and canvas-specific values;
- keep one Studio Pro entrypoint rather than accumulating unrelated fix stylesheets;
- component behavior belongs in React; appearance belongs in Tailwind/CSS;
- never use DOM layout as project/canvas source of truth.

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

- **Wide desktop:** toolbar + rail + navigator + canvas + inspector.
- **Laptop:** same architecture with fixed panel widths and flexible canvas.
- **Tablet/compact:** canvas-first with bottom dock and sheets.
- **Phone:** one-row header + canvas + dock + sheets.

Do not stack Pages, canvas and a large inspector permanently on a phone.

## Project theme separation
Keep these independent:
1. Studio Pro editor UI (`studio-pro`).
2. Editor appearance (`light` / `dark` / `auto`).
3. Frontend/backend project themes used by generated output.

## Quality checklist
Before completing an editor UI change:
- [ ] Studio Pro remains the only editor visual system.
- [ ] Desktop composition matches the professional builder contract.
- [ ] Canvas remains the largest working surface.
- [ ] Color is functional and restrained.
- [ ] Buttons/icons have consistent hover/press/current states.
- [ ] Motion respects reduced-motion and does not alter precision hit geometry.
- [ ] Phone default view is canvas-first.
- [ ] Pages/Add/Layers/Properties are reachable from the mobile dock.
- [ ] Mobile sheets are keyboard-dismissable and have visible close actions.
- [ ] Touch targets are >=48px in compact mode.
- [ ] No root horizontal overflow exists.
- [ ] Focus/selected/disabled states are explicit.
- [ ] Canonical data/commands remain unchanged by presentation work.
- [ ] Lint, typecheck, unit, coverage, build and E2E gates pass.
