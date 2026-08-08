# Editor workspace override

This file overrides `../MASTER.md` only for the main visual editor workspace.

## Primary task
Build and manipulate a page visually while preserving exact canonical structure and responsive behavior.

## Visual hierarchy
1. Canvas/document is the dominant surface.
2. Current selection is the strongest local signal.
3. Contextual commands and inspector are secondary to the selected object.
4. Navigation and global project controls remain visually quieter than editing state.

## Desktop composition target
Use the mental model of professional no-code tools such as visual website/page builders:

```text
┌───────────────────────────────────────────────────────────┐
│ Global header / project / breakpoint / history / preview │
├──────────┬───────────────────────────────┬────────────────┤
│ Nav /    │                               │ Inspector      │
│ Insert   │        Visual canvas          │ properties     │
│ library  │                               │ styles         │
│ / layers │                               │ responsive     │
├──────────┴───────────────────────────────┴────────────────┤
│ Optional status / context surfaces                       │
└───────────────────────────────────────────────────────────┘
```

The exact panel system may evolve by phase, but do not turn the editor into a generic dashboard of cards. It is an **authoring environment**.

## Canvas rules
- Preserve a neutral workspace around the document so project design is not confused with editor chrome.
- Document boundary must remain obvious at every zoom level.
- Grid/guides/snapping are functional overlays, never persisted decoration.
- Selection outline must remain legible over light, dark and colorful content.
- Locked and hidden states require text/icon/shape signals beyond opacity.
- Empty state should teach the next action without consuming excessive canvas area.

## DnD rules
- While dragging, valid insertion zones become visible before pointer entry.
- Root/sibling insertion zones receive larger hit areas than idle layout spacers.
- Drag source receives reduced-emphasis styling but remains identifiable.
- Do not animate hit-area geometry during precision drag.
- Exact target index remains expressed by semantic `parentId + index`, never DOM position inference.

## Command bar
- Prioritize high-frequency structural actions.
- Group commands by meaning: insert, clipboard, grouping, visibility/lock, geometry.
- Use dividers sparingly.
- Horizontal local scrolling is acceptable when necessary; never cause document-root overflow.
- On touch layouts, expand primary buttons to at least 44px height/width where applicable.

## Inspector
- Prefer a persistent right-side panel on wide desktop when the layout phase supports it.
- On narrower layouts, use a drawer/sheet/panel that does not cover primary commands.
- Common fields should stay visible; advanced groups may collapse.
- Keep responsive source/inherited/unset state adjacent to each responsive property.
- A failed validation never silently mutates the canonical node.

## Information density
Dense does not mean cramped.
- Use 8px default gaps, 12px panel padding, 32–36px rows.
- Reduce repeated headings before reducing interaction hit areas.
- Use icon + tooltip/accessible name for well-known actions, but do not hide uncommon actions behind unexplained icons.
- Prefer progressive disclosure over showing every advanced property simultaneously.

## Motion
- Selection: immediate or ≤100ms.
- Hover/press feedback: 80–120ms.
- Panel reveal: 120–200ms.
- DnD insertion feedback: immediate; no delayed hover prerequisite.
- Respect reduced-motion.

## Acceptance signals
A professional user should be able to answer instantly:
- What document am I editing?
- What breakpoint am I viewing?
- What is selected?
- Where will this dragged node be inserted?
- Is this element locked or hidden?
- Are changes saved?
- Can I undo this operation?
