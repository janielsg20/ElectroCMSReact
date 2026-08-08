# ElectroCMS Editor — Redesign V2

## Product archetype
Professional No-Code CMS / Visual Website & Backend Builder.

## Design goals
- Canvas-first productivity.
- High-density without visual noise.
- Progressive disclosure.
- Contextual controls.
- Professional, tool-like character rather than dashboard aesthetics.
- One visual language across Builder, Content, Backend and Publish.

## Identity
- Graphite chrome.
- Porcelain/warm-neutral work surfaces.
- Teal primary interaction accent.
- Restrained violet secondary accent.
- Minimal use of gradients.
- SVG iconography only.

## Core composition
### Desktop
Global project bar → domain navigation → contextual library/navigation → dominant workspace/canvas → contextual inspector.

### Tablet
Global bar → compact navigation/drawer → workspace → contextual sheets/panels.

### Mobile
Global bar → workspace → drawer/sheet driven secondary controls. Critical actions remain >=44px.

## Density
- 4px micro-grid.
- 8px primary rhythm.
- Tool controls 28–32px desktop.
- Critical touch controls >=44px.

## Surface hierarchy
- App environment.
- Global navigation chrome.
- Workspace surface.
- Inspector/library panels.
- Floating surfaces.
- Document/canvas surface.

## Interaction
- Accent is reserved for focus, selection, active context and primary action.
- Hover is a subtle surface/border change, not decorative animation.
- Focus must always be visible.
- Disabled actions remain legible but visually quiet.
- No development-state badges/dots in product UI.

## Implementation
Semantic foundation lives in `src/app/ui/ui-foundation.css`.
Tailwind utilities compose product surfaces. Technical canvas/geometry CSS remains specialized where appropriate.
