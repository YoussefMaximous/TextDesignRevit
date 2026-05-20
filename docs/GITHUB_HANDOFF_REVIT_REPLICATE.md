# GitHub Handoff: TextDesign → Revit Replicate (2D Only)

Use this document as the **single source of truth** for continuing this repository. Copy it into a GitHub Issue, Project description, or pin it in the wiki.

---

## Instructions for GitHub Copilot / all contributors (read first)

**You are not building a “similar” CAD app. You are closing the gap to Revit until there is no gap.**

If you find **anything** in this repo that is **not EXACTLY like Revit** — in **any** category below — you **must change the code** in this PR or a follow-up PR. Do **not** leave it as-is, do **not** add a TODO and walk away, do **not** argue that “close enough” is acceptable, and do **not** only update documentation.

| Category | Examples of “wrong” that you must fix |
|----------|----------------------------------------|
| **Lengths & positions** | Crop size, annotation crop inset, section line Y, elevation offset from crop, north arrow / scale bar placement, wall default height, grid bubble spacing, column size |
| **How the user uses it** | Click count to place a tool, what happens on Esc / right-click / Tab / Ctrl / Shift, when a command cancels, double-click to open a view |
| **Buttons & ribbon** | Missing button, wrong tab, wrong group label, disabled when Revit enables it, enabled when Revit disables it, wrong keyboard shortcut |
| **Labels & UI text** | Status bar message, options bar fields, properties panel rows, project browser tree names, context menu item names |
| **Selection & modify** | What can be selected, delete, move, copy; box select direction; grip behavior |
| **Visual behavior (2D only)** | Line style (dash vs dash-dot), bubble on grid not on ref plane, section through center not at north edge, grey annotation crop present |
| **Views & browser** | View name, scale default, opening elevation/section from marker, zoom to fit framing |

**How to work:**

1. Open **any Autodesk Revit** you have installed (2020, 2021, 2022, 2023, 2024, 2025, etc.) — **the base is the same** across years for 2D architecture workflow. Use a metric architectural template side-by-side with `npm run dev`.
2. Press **`Ctrl+N`** in TextDesign and compare the empty plan **element by element**.
3. Run each tool you touch in Revit and repeat the same steps in TextDesign — behavior must match.
4. If you are unsure whether Revit does X: **assume Revit is correct** and match it.
5. Constants belong in `src/engine/revitLandingLayout.ts` (or typed defaults) — not magic numbers scattered in renderers.

**Definition of done for your change:** A Revit-trained user would not notice a functional difference for the feature you touched (2D only; 3D stays out of scope).

**This project will be thrown away and rebuilt** if cumulative drift from Revit is too large. Your job is to **reduce** drift, not add features that increase it.

---

## Mission

Turn **TextDesign** (`TextDesignRevit`) into a **functional 2D replica of Autodesk Revit’s architecture workflow** — same tools, same landing layout, same interaction patterns, same project structure — **without 3D, without rendering quality goals, and without graphics/sun/shadow options**.

This is **not** a visual clone or a game engine. It is a **browser-based BIM shell** where geometry lives in **HTML5 Canvas 2D** and behavior must match Revit closely enough that a user trained on Revit can work without relearning the product.

**Failure mode to avoid:** If crop positions, section line placement, datum behavior, or tool flows diverge from Revit, downstream automation and training built on this replica will fail and the project will be redone from scratch.

---

## Prime directives (non-negotiable)

1. **Canvas 2D is the only renderer** for plan/section/elevation views. Walls, doors, datums, annotations = real model entities drawn on canvas.
2. **ASCII Engine is export-only** (`src/ascii-engine/`). It must never become the viewport renderer.
3. **No 3D** — no ViewCube navigation, no orbit, no mesh, no materials, no sun path, no realistic lighting. Disable or stub 3D UI with clear tooltips.
4. **No graphics fidelity goals** — no photorealism, no RTX, no “make it prettier.” Simple Revit-like SVG ribbon icons and readable linework are enough.
5. **Functional parity over visuals** — match **positions, lengths, usage, selection, deletion, shortcuts, and view behavior**; not pixel-perfect icons or anti-aliasing.
6. **All landing elements are model objects** — north arrow, scale bar, elevation markers, section line, ref planes, crop — selectable, movable, deletable (not canvas decorations).
7. **Reference planes ≠ grids** — ref planes: long green/red dash, no bubbles. Grids: blue dash-dot + numbered bubbles.
8. **Undo/redo** via command stack; **`.tdx` JSON** is the project file format.

---

## Tech stack

| Layer | Choice |
|--------|--------|
| UI | React 18+, TypeScript, Vite, Tailwind |
| State | Zustand (`src/store/projectStore.ts`) |
| Geometry / picks | `src/engine/*` (rbush spatial index) |
| Drawing | `src/renderer/*` (Canvas 2D only) |
| Commands | `src/engine/CommandStack.ts` |

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # must pass before PR merge
```

---

## What is already implemented (baseline)

### Shell (Revit-like)
- Title bar, ribbon tabs (Architecture, View, Modify, Manage, …), options bar, properties + project browser, view control bar, status bar
- Context menu: canvas (zoom fit, cancel, delete, snaps) + project browser views
- Wheel zoom toward cursor; box select (window/crossing); Tab cycle; Ctrl add / Shift remove

### Landing floor plan (`Ctrl+N`)
Calibrated layout in `src/engine/revitLandingLayout.ts`:
- **Plan crop** — solid black outer (~30×22 m model mm at 1:100)
- **Annotation crop** — grey dashed inner inset
- **Reference planes** — green cross through crop center
- **Four elevation markers** — outside annotation crop; double-click opens elevation view (2D stub)
- **Working section** — blue dotted line through center; bubbles “1”; double-click opens section view (2D stub)
- **North arrow + scale bar** — `viewAnnotations[]`, bottom-right inside annotation crop

### Architecture tools (2D)
- Wall, door, window, room, grid, level, ref plane, section, column, floor, stair (MVP footprints)
- Modify: move, copy, rotate, mirror, align, trim, split, delete
- Snaps, temp dimensions, wall chain, typed distance, file I/O `.tdx`

### Intentionally stubbed / disabled
- 3D view, roof, ceiling (in plan), ramp, railing, openings, many MEP/structure tools — ribbon present, disabled with “no 3D” / “later” tooltips

---

## Key files map

| Area | Path |
|------|------|
| Layout constants | `src/engine/revitLandingLayout.ts` |
| Datum CRUD / picks | `src/engine/datumGeometry.ts` |
| Types / model | `src/engine/types.ts` |
| Default project | `src/store/defaults.ts` |
| Canvas datums | `src/renderer/datumRenderer.ts` |
| Building symbols | `src/renderer/buildingRenderer.ts` |
| Viewport draw loop | `src/renderer/ViewportRenderer.ts` |
| Interaction | `src/hooks/useViewportInteraction.ts` |
| Shortcuts | `src/hooks/useKeyboard.ts` |
| Ribbon + icons | `src/components/Ribbon.tsx`, `src/components/ribbon/RibbonIcons.tsx` |
| Context menus | `src/components/ContextMenu.tsx`, `src/hooks/useViewportContextMenu.ts` |

---

## Definition of “Revit replicate” (acceptance tests)

Before claiming a milestone done, verify on a **fresh project (`Ctrl+N`)**:

1. **Landing layout** matches Revit empty plan: black crop, grey annotation crop inside, green ref cross at center, elevations outside grey box, section through center (not at north edge), north + scale bottom-right inside grey area.
2. **Zoom to fit (`ZE` / `ZA`)** frames the plan crop with sensible margin (not tiny in corner).
3. **Select + Delete** works on: north elevation marker, north arrow, scale bar, section line, ref plane, scope (when selected).
4. **Grid tool** shows angle arc + snap labels (e.g. vertical / extension) like Revit feedback.
5. **Ref plane** ≠ grid visually and in properties.
6. **Right-click** canvas shows general menu; right-click view in browser opens view.
7. **No 3D** code path draws meshes or enables orbit — section/elevation views are labeled 2D stubs only.
8. **`npm run build`** passes with zero TypeScript errors.

---

## Priority roadmap (suggested order)

### Phase A — Landing & datums (highest risk)
- [ ] Fine-tune `revitLandingLayout.ts` against Revit screenshot (any year — mm constants only — no new renderer)
- [ ] Properties panel: view graphics (scale 1:100, detail level, crop on/off) when nothing selected
- [ ] Level lines in plan (currently level adds to model only — draw level heads/tails in 2D)
- [ ] Elevation / section 2D views: show cut graphics (simple projection of walls), not empty grid + text

### Phase B — General Revit interaction (all tabs)
- [ ] Expand context menus (Repeat, Zoom Previous, Select All Instances, Hide in View, Isolate)
- [ ] Middle-mouse pan (if not complete), double-click empty = zoom fit
- [ ] Filter selection bar (bottom-right stubs → functional filter by category)
- [ ] Clipboard: cut/copy/paste 2D elements with offset
- [ ] In-canvas tooltip / status messages matching active command (Revit status bar style)

### Phase C — Architecture ribbon completion (2D MVP only)
- [ ] Component, room separator, tag room (minimal 2D symbols)
- [ ] Opening tools (wall opening rectangle on plan only)
- [ ] Curtain grid / mullion as 2D lines (optional, low priority)
- [ ] Wire Annotate tab: text, dimensions (linear only), tags

### Phase D — Views & browser
- [ ] Project browser parity: discipline grouping, view templates, right-click full set
- [ ] View control bar: crop region toggle, thin lines, reveal hidden (functional)
- [ ] Sheet placeholders in browser (no sheet layout engine required yet)

### Phase E — Data & robustness
- [ ] `.tdx` schema version migrations
- [ ] Regression checklist in `docs/` or CI smoke script
- [ ] Unit tests for `datumGeometry`, `revitLandingLayout`, snap resolver

---

## Explicit out of scope (do not implement unless asked)

- Autodesk Revit file import (`.rvt`)
- Real 3D model, ViewCube, walkthrough, rendering, shadows, lighting analysis
- Full MEP/Structure/Fabrication discipline tools
- Cloud worksharing, central model, worksets (UI label only is OK)
- Photorealistic materials or GPU pipelines
- Replacing Canvas with WebGL/Three.js for the main viewport

---

## Implementation rules for contributors

1. **Fix every Revit mismatch you see** — see “Instructions for GitHub Copilot” above. “Works” ≠ “matches Revit.”
2. **Read before changing** `revitLandingLayout.ts` — one constant tweak is better than a new drawing hack in the renderer.
3. **Extend `ProjectModel` + CommandStack** for new elements; don’t draw “fake” overlays that aren’t selectable.
4. **Match existing patterns**: `placeX` in `projectStore`, pick in `selection.ts`, index in `SpatialIndex.ts`, draw in `renderer/`.
5. **Keep PRs small** — one ribbon group or one tool per PR when possible.
6. **No drive-by refactors** — minimal diff, same naming style as surrounding code.
7. **Document new shortcuts** in `README.md` when adding tools.
8. **PR description must list** what you compared to Revit and what you fixed (e.g. “section line was 1200 mm below center; Revit has it through center — fixed in `revitLandingLayout.ts`”).

---

## Reference

- Compare behavior to **any Revit** empty metric architectural plan (e.g. *Floor Plan: L1 - Architectural*) — year does not matter for the base layout and tools
- User reference screenshots may be in workspace `assets/` (crop, annotation crop, datums, section, north, scale)
- Original product name: **TextDesign**; repo folder: `TextDesignRevit`

---

## Copy-paste block for GitHub Copilot / Issue body

```
@copilot / contributors:

This repo must match Autodesk Revit (any year — same base; 2D architecture workflow) EXACTLY in function —
lengths, positions, tool usage, buttons, ribbon, shortcuts, context menus, properties,
selection, and landing plan layout. NOT “similar”. NOT “inspired by”. EXACT for 2D behavior.

If you find ANYTHING wrong (even one button label, one mm offset, one click too many):
→ UPDATE THE CODE to match Revit. Do not skip. Do not defer. Do not only comment.

Compare side-by-side: Revit empty plan “L1 - Architectural” vs TextDesign Ctrl+N.
Reference: docs/GITHUB_HANDOFF_REVIT_REPLICATE.md

No 3D. No graphics engine. Canvas 2D only. Functional parity is mandatory or the project fails.
```

## Suggested GitHub Issue title

```
[Epic] Complete 2D Revit replicate — EXACT functional parity (fix any mismatch), no 3D
```

## Suggested labels

`epic`, `revit-parity`, `2d-only`, `good first issue` (for isolated tools), `help wanted`

---

## Questions for maintainers (resolve in Issues)

1. Imperial vs metric default template?
2. Is ASCII export still required for production, or dev-only?
3. Minimum browser support (Chrome-only OK?)?

---

*Last updated from development session: landing layout v2, context menus, architecture tools MVP, annotation crop, white plan background.*
