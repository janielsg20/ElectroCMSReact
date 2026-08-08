# UI-08 Status

Status: **DONE — MERGED**

Scope: Preview / Publish / Final Polish.

Implemented:
- Replaced the static Preview mock with `LivePreviewWorkspace`.
- Live Preview renders the active canonical document through the existing `CanvasRenderer` in read-only mode; selection, drag and mutation callbacks are not supplied.
- Preview device selection writes through the existing ProjectSession breakpoint setter and displays the actual canonical breakpoint widths.
- Preview diagnostics are derived from real facts only: `inspectDocumentTree`, canonical node count, registered widget preview count, ProjectSession save state and active breakpoint.
- Preserved the real frontend `ProjectThemeControls` inside Preview.
- Replaced the generic export cards with `PublishingWorkspace` / Publishing Center.
- Publishing readiness reads canonical document/theme/history data and ProjectSession save state.
- Local, React, LAMP and WordPress destinations are represented in the final information architecture, but Configure remains disabled because validated exporter runtimes are not implemented.
- Added explicit “No simulated publishing” behavior; the UI never reports a package/deployment success without a real exporter.
- Added `StudioCommandPalette` with Ctrl/Cmd+K, Escape close behavior, search and navigation to existing workspaces/modules.
- Added shortcut discoverability for palette, undo and redo.
- Removed the non-functional Share control from the permanent Studio chrome.
- Removed the old static browser preview composition and its decorative browser-status dots.
- Refactored `ProductionStudio` to use the final Preview, Publishing and command surfaces while preserving the permanent rail, responsive drawer, Builder and all canonical module integrations.
- Refined command palette semantics to use normal navigation/button semantics rather than a mismatched listbox contract.
- Added unit coverage for canonical Preview, breakpoint mutation, publishing safeguards and command navigation.
- Added dedicated Playwright E2E coverage for live preview, publishing safeguards and command palette routing.
- Existing tablet/mobile workspace-shell E2E continues to pass, preserving no-root-overflow and accessible compact navigation behavior.

Validation history:
- Quality Gate #1176 stopped at lint because query reset used synchronous `setState` inside an effect. The reset was moved to explicit close actions.
- Quality Gate #1177 passed lint and stopped at TypeScript because an unregistered `info` icon was used. Replaced with the registered `code` icon.
- Quality Gate #1178 passed lint/TypeScript and stopped at Unit because the test queried two legitimate Export controls ambiguously. The test was scoped to the header CTA without changing product behavior.
- Corrected implementation validation: Quality Gate #1179 PASS.
- Final accessibility/E2E audit validation: Quality Gate #1181 PASS.
- Final documented-HEAD validation: Quality Gate #1183 PASS.
  - verify:repo ✅
  - lint ✅
  - TypeScript ✅
  - unit ✅
  - coverage ✅
  - production build ✅
  - Playwright ✅

Merge:
- PR #22 merged into `main`.
- Squash merge SHA: `95d0dc79206af1aa623b2ac37e47599391b2d9d7`.

Result: **UI/UX redesign phases UI-01 through UI-08 are complete. There is no UI-09.**
