# ElectroCMS Editor Design System — MASTER

## Purpose
This document is the source of truth for the ElectroCMS **authoring chrome**. It does not define frontend/backend project themes.

ElectroCMS is a professional local-first no-code/low-code builder. The editor prioritizes canvas space, predictable navigation, information density, accessible interaction and confidence while editing.

## One visual system: Studio Pro
ElectroCMS exposes one editor UI/UX system: **Studio Pro** (`studio-pro`). `light`, `dark` and `auto` are appearance states of the same system. Frontend/backend project themes remain independent.

Do not introduce selectable editor visual presets or parallel chrome skins. Improve the shared system at the component/source level.

## Product reference
The primary composition reference is the supplied professional visual-builder screenshot.

Required composition:
- continuous compact application toolbar;
- narrow global icon rail on desktop;
- persistent Pages/Components navigator on desktop;
- dominant central canvas;
- persistent contextual Properties inspector on desktop;
- explicit responsive-breakpoint editing;
- mobile authoring as a dedicated canvas-first interaction mode rather than compressed desktop chrome.

## Visual character
Studio Pro is a precision authoring tool, not a dashboard.

Use:
- continuous work surfaces;
- 1px separators;
- neutral white/light-gray chrome in light mode;
- restrained dark surfaces in dark mode;
- precision radii of approximately 2–6px for authoring chrome;
- minimal elevation except floating menus, dialogs and authored-document separation;
- compact but readable typography;
- strong spatial alignment;
- one restrained blue accent family.

Avoid:
- decorative mosaic layouts;
- oversized cards;
- stacked card-on-card compositions;
- heavy gradients;
- unrelated accent colors;
- colored icon palettes by module/category;
- persistent decorative animation;
- rounded containers around every control group.

## Color contract — monochrome chrome
The supplied reference is predominantly neutral. ElectroCMS follows that rule.

### Neutral by default
These remain monochrome/neutral:
- Studio rail icons;
- Pages/Components navigation icons;
- Components library icons and tiles;
- Preview and secondary header actions;
- breakpoint/zoom/history/appearance controls;
- Settings icon;
- Layers and other secondary canvas commands;
- mobile Pages/Add/Layers/Properties dock icons;
- sheet Close icons and secondary inspector icons.

### Where saturated color is allowed
Use saturated blue mainly for:
- primary Publish/Export CTA;
- primary Insert Widget action;
- precise canvas selection outline;
- focus-visible ring;
- thin current/active indicators when needed.

Selected/current secondary controls should prefer neutral surface/weight changes and, when useful, a thin blue underline/edge rather than a filled colored button.

### Semantic-status exception
Save/error/warning/success indicators may retain semantic colors when color communicates real state rather than decoration. Never rely on color alone; pair with text/iconography/state semantics.

### Prohibited pattern
Do not assign violet, cyan, green, amber, rose or other hues to navigation modules, widget categories or mobile dock destinations simply to differentiate them.

## Desktop layout contract
For widths above the compact-shell breakpoint:

1. **Application toolbar** — approximately 64px high.
2. **Studio rail** — approximately 60px wide, icon-first.
3. **Builder navigator** — approximately 300px.
4. **Canvas** — flexible and receives the largest remaining area.
5. **Properties inspector** — approximately 336px.

Pages/Components tabs, canvas toolbar and inspector start on the same vertical line. Avoid redundant rows that duplicate document/breakpoint information already present elsewhere.

The desktop rail must not repeat the application logo already shown in the top toolbar.

## Application toolbar
Hierarchy:
1. project/navigation identity;
2. active document + breakpoint;
3. zoom/history/appearance;
4. Preview;
5. primary Publish/Export action.

Rules:
- primary CTA uses solid blue;
- Preview and other secondary actions remain neutral;
- controls are compact with fine borders;
- avoid large shadows and decorative color blocks;
- save state stays readable but visually quiet;
- the header exposes only three primary responsive shortcuts: Desktop, Tablet and Mobile;
- responsive shortcuts are icon-only in the visible chrome and retain accessible names/tooltips with their canonical resolutions.

## Studio rail
Desktop navigation is a 60px icon rail.

- controls are about 44px square;
- all module icons use the same neutral icon color;
- hover may increase contrast but must not introduce a module-specific hue;
- current item uses neutral surface/weight plus one thin blue edge indicator;
- icon motion is subtle and never moves the hit area;
- labels remain accessible through `aria-label`/title/tooltips even when visually hidden;
- Settings remains anchored at the bottom.

Compact navigation becomes an accessible drawer and may show labels.

## Builder navigator
Desktop uses a persistent Pages/Components navigator.

- width target ≈300px;
- Pages/Components tabs use flat navigation;
- active page is stronger by weight/background plus a thin blue edge when useful;
- Widget Tree hierarchy may use subtle guide lines;
- Components uses search, categories and compact insertion tiles;
- component tiles and icons remain neutral across categories;
- hover uses border/background/elevation changes rather than category colors.

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

On compact layouts, stage padding accounts for the mobile dock and safe-area insets. Short landscape layouts move builder destinations to a compact right-side rail so the dock does not consume the canvas height.

## Canvas command toolbar
Desktop toolbar aligns with Builder navigator tabs and top of the inspector.

- target height ≈52px;
- controls are compact 32–36px high;
- primary Insert Widget receives solid blue emphasis;
- all other editing commands remain neutral;
- toggled secondary tools prefer neutral selected surfaces;
- horizontal overflow is local, never root-level.

## Inspector
Desktop uses a persistent right inspector. Compact mode uses the Properties sheet.

Visible top-level tabs are **Properties** and **Design**.

- schema-driven property controls remain the same in desktop/mobile modes;
- active tab may use one blue underline/current indicator;
- long schemas use disclosures;
- disclosure rows are separated by fine lines;
- disclosure/chevron icons remain neutral;
- labels stay associated with inputs;
- focus uses a visible blue ring/border;
- responsive inheritance remains explicit;
- canonical reversible commands remain the only mutation path;
- no parallel mobile project state is allowed.

## Mobile and compact layout contract
At `<= 1024px`, ElectroCMS switches to a **canvas-first authoring mode**.

Persistent desktop side panels are removed from layout flow. Default view:
- one-row compact application header;
- visual canvas occupying available workspace;
- contextual command strip only when a selection requires it;
- bottom dock with four stable destinations: **Pages, Add, Layers, Properties**.

Pages/Add/Layers/Properties open as temporary bottom sheets.

Sheets and drawers:
- use `role="dialog"` + `aria-modal="true"`;
- expose a visible Close action;
- close with `Escape` and backdrop activation;
- autofocus the Close action when opened;
- contain keyboard focus while open and return focus to the opener when dismissed;
- never leave hidden focusable controls in document flow;
- keep canvas/model state intact while open;
- cap height so spatial context remains clear;
- respect top/bottom/left/right safe-area insets where applicable.

General compact touch targets are at least **44×44px**. The persistent phone builder dock remains at least **52px high per destination**.

## Tablet header
Tablet/compact keeps these responsive-authoring controls visible:
- Active document;
- the three Desktop / Tablet / Mobile breakpoint icons;
- Zoom;
- Light / Dark appearance;
- Publish/Export.

History is hidden from the compact row to protect workspace. Preview may become icon-only or move out at smaller widths.

## Phone header
Phone header is a single row of approximately 60px:
- menu trigger: 44px;
- custom page selector: icon-only 44px on normal phones;
- Desktop / Tablet / Mobile breakpoint icons: 44px each;
- Light / Dark controls: 44px each;
- primary Publish/Export action: 44px;
- Preview is removed from the smallest header because it remains available through workspace navigation.

At extremely narrow widths (`<=360px`) the duplicated header page trigger may be hidden because **Pages** remains permanently reachable from the bottom dock.

The root document must not horizontally scroll. Mobile editable inputs/selects/textareas use a 16px text floor to avoid browser auto-zoom and preserve readability.

## Mobile dock
The bottom dock is the primary phone navigation for Builder context.

- Pages/Add/Layers/Properties icons use one neutral color;
- no per-destination color palette;
- active state uses neutral background/weight and `aria-pressed` semantics;
- each control is at least 52px high on phone;
- dock respects `env(safe-area-inset-bottom)` and horizontal safe areas;
- short landscape switches to a vertical right-side rail so canvas height remains useful.

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
- Settings may rotate slightly when open while retaining neutral color.

## Tailwind / CSS implementation rules
Studio Pro is authored primarily through Tailwind utilities and `@apply` in `src/app/ui/studio-pro-tailwind.css`.

`src/app/ui/studio-pro.css` owns reference geometry/interaction compatibility. `src/app/ui/studio-pro-compact.css` contains the final monochrome reference overrides. `src/app/ui/studio-pro-header.css` and `studio-pro-header-responsive.css` own the supplied-header fidelity contract. `src/app/ui/studio-pro-ux-audit.css` is the final responsive/accessibility hardening layer. All belong to the same Studio Pro system; none is a selectable parallel theme.

Rules:
- prefer Tailwind layout/spacing/typography/state utilities for component source;
- use CSS custom properties for semantic color/elevation roles and canvas-specific values;
- do not create a second visual theme to fix a local component;
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
- compact touch targets >=44px;
- phone builder-dock destinations >=52px high;
- mobile form text floor 16px;
- `prefers-reduced-motion` and increased/forced contrast are supported;
- modal sheets and drawer have explicit non-gesture dismissal and focus containment;
- safe areas are respected by fixed navigation and modal surfaces.

## Responsive philosophy
Editor responsiveness is separate from the breakpoints of the site/app being authored.

- **Wide desktop:** toolbar + rail + navigator + canvas + inspector.
- **Laptop:** same architecture with fixed panel widths and flexible canvas.
- **Tablet/compact (`<=1024px`):** canvas-first with bottom dock and sheets, plus document/breakpoint/zoom/appearance in header.
- **Phone:** one-row header + canvas + neutral dock + sheets.
- **Short landscape:** canvas-first + right-side vertical builder rail.

Do not stack Pages, canvas and a large inspector permanently on a phone.

## Project theme separation
Keep these independent:
1. Studio Pro editor UI (`studio-pro`).
2. Editor appearance (`light` / `dark` / `auto` internally; Light/Dark are the direct header controls).
3. Frontend/backend project themes used by generated output.

## Quality checklist
Before completing an editor UI change:
- [ ] Studio Pro remains the only editor visual system.
- [ ] Desktop composition matches the professional builder reference.
- [ ] Canvas remains the largest working surface.
- [ ] Rail, component-library and mobile-dock icons are monochrome/neutral.
- [ ] Solid saturated color is concentrated in primary actions.
- [ ] Current/selected secondary controls avoid large colored fills.
- [ ] Buttons/icons have consistent hover/press/current states.
- [ ] Motion respects reduced-motion and does not alter precision hit geometry.
- [ ] Exactly three primary breakpoint shortcuts are shown in the header: Desktop, Tablet, Mobile.
- [ ] `1024×768` enters compact canvas-first mode cleanly.
- [ ] Common phone width (`375px`) has no root horizontal overflow.
- [ ] Phone editable controls use a 16px text floor.
- [ ] Short landscape preserves useful canvas height.
- [ ] Pages/Add/Layers/Properties are reachable from the mobile dock.
- [ ] Mobile sheets/drawer are keyboard-dismissable, focus-contained and have visible Close actions.
- [ ] General compact touch targets are >=44px; phone dock targets are >=52px high.
- [ ] Safe-area insets are honored by fixed/mobile chrome.
- [ ] Focus/selected/disabled states are explicit.
- [ ] Canonical data/commands remain unchanged by presentation work.
- [ ] Lint, typecheck, unit, coverage, build and E2E gates pass.
