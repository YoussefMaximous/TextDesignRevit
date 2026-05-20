# TextDesign

A lightweight Revit-like **2D architectural drafting** application in the browser.

- **Real Canvas 2D geometry** — walls as filled rectangles, doors with swing arcs, grids as vector lines
- **Not** an ASCII renderer — the ASCII Engine is a separate export panel only
- Revit 2026–inspired shell: ribbon, properties, project browser, view control bar, status bar

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Keyboard shortcuts

| Keys | Action |
|------|--------|
| `WA` | Wall tool |
| `DR` | Door tool (click wall to place) |
| `WN` | Window tool (click wall to place) |
| `MD` | Modify / select |
| `MV` `CO` `RO` `MM` `AL` `TR` `SL` `DE` | Modify tools (selection required) |
| `LL` | Place level |
| `SS` | Snap settings dialog |
| `ZA` | Zoom to fit |
| `Ctrl+N` / `Ctrl+O` / `Ctrl+S` | New / open / save `.tdx` |
| `Ctrl+Z` / `Ctrl+Y` | Undo / redo |
| `Delete` / `Ctrl+X` | Delete selection |
| Digits + `Enter` | Typed wall length while placing |
| `Tab` | Cycle overlapping elements at cursor |
| `Space` | Flip door handedness (door tool) |
| `Esc` | Cancel tool / deselect |
| `Shift` (while drawing walls) | Orthogonal constraint |

**Modify tool:** drag left→right for window select (blue), right→left for crossing select (orange). `Ctrl+Click` adds to selection; `Shift+Click` removes. Click a **blue length dimension** on a selected wall to edit its length inline.

| `GR` | Grid (two-click, auto-named A/B or 1/2) |
| `RM` | Room (click inside enclosed walls) |

**Manage tab:** Snaps (SS), ASCII Export panel (dense / lightweight / training / symbolic modes, download `.txt`).

**Properties:** Edit Type opens type dialog; room name/number are editable inline.

## Architecture

```
src/engine/     Geometry types, spatial index (rbush), snap resolver, commands
src/renderer/   ViewportRenderer — HTML5 Canvas 2D only
src/store/      Zustand project state
src/ascii-engine/  Isolated ASCII export (never touches renderer)
src/components/ React UI shell
```

## Sample project

New projects open with a **Revit-style landing floor plan** — every item is a real model element you can **click, box-select, move (MV), and delete (Delete / Ctrl+X)**:

| Element | Revit role | In TextDesign |
|---------|------------|---------------|
| **View crop** (solid border) | Sheet / view extent | Click border → Properties; defines printable area |
| **Scope box** (dashed green) | Clips datum visibility per view | Select → Move; linked datums share its id |
| **Reference planes** (green cross) | Work planes for align/sketch | Select → snap when drawing walls (GR/WA) |
| **Elevation markers** (4 arrows) | Create elevation views | **Double-click** → opens North/South/East/West elevation |
| **Grids** (GR tool) | Structural column layout | Place with GR; snaps to endpoints |

North arrow and scale bar are view annotations (tied to the active floor plan view).

## Contributing / GitHub handoff

Anyone continuing this project (including **GitHub Copilot**) must treat **Autodesk Revit** (any year — same base) as the spec: if anything differs in **length, position, buttons, usage, shortcuts, or workflow** — **fix it in code**, do not leave drift. See **[docs/GITHUB_HANDOFF_REVIT_REPLICATE.md](docs/GITHUB_HANDOFF_REVIT_REPLICATE.md)**.

## Build

```bash
npm run build
npm run preview
```
