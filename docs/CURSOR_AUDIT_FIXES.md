# Cursor audit fixes (2026-05-20)

Automated Revit parity pass after GitHub Copilot handoff. Build: `npm run build` **PASS**.

## Fixed in this session

| Area | Fix |
|------|-----|
| Level tool | Click sets `planLineY`; horizontal level lines with bubbles on floor plans |
| Landing levels | Default L1/L2 plan lines at scope center ± 3500 mm |
| Section / elevation views | 2D wall cut graphics (`cutViewRenderer.ts`) |
| Properties (no selection) | Revit-style **Views (1)** panel with scale, detail, crop |
| Properties (level) | Level elevation and bubble fields |
| Selection filters | Status bar toggles (W, D, WN, C, FL, ST, G, DT) filter picks |
| Context menu | Delete + Repeat/Hide/Isolate stubs + Zoom Region / Pan stubs |
| Double-click empty | Zoom to fit (`td-zoom-all`) |
| Delete | Levels removable via Delete |

## Still OPEN (needs Revit side-by-side or owner priority)

- Ribbon tab parity for every Revit year variant
- Full modify tools (mirror, align, trim, split) behavior vs Revit
- Hide in View / Isolate / Repeat commands (menu stubs only)
- Zoom Region / Pan from context menu
- View control bar sun/lighting (intentionally disabled — no 3D)
- Exact mm constants vs your Revit template screenshot
- Move/copy for datums and levels

Send remaining OPEN rows via `docs/REPORT_BACK_TO_CURSOR.md` after manual Revit compare.
