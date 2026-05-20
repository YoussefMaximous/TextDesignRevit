# Report back to Cursor — collector template

**For:** GitHub developer / Copilot working on TextDesignRevit  
**Send completed report to:** project owner → they paste it into **Cursor** chat for fixes.

Use **any Autodesk Revit year** (2020–2025+). The 2D architecture base is the same.

---

## How to use this document

1. Install and run TextDesign: `npm install` → `npm run dev` → `Ctrl+N`.
2. Open **Revit** (metric architectural template) → empty floor plan (e.g. *L1 - Architectural*).
3. Compare **side-by-side**. Every mismatch → one row in the tables below.
4. If you **fixed it in code**, note the PR/commit; if **not fixed yet**, mark `OPEN` so Cursor can fix it.
5. When done, copy **this entire file** (filled in) and send it to the owner. They will paste it into Cursor.

**Rule:** If it is not **EXACTLY** like Revit (length, button, click, label, anything) — **list it**. Do not skip “small” issues.

---

## Your environment (fill in)

| Field | Your answer |
|-------|-------------|
| Revit version | e.g. 2024 |
| Revit template | e.g. Metric, Architectural |
| TextDesign commit / branch | e.g. `abc123` on `main` |
| OS / browser | e.g. Windows 11, Chrome |
| Date | YYYY-MM-DD |

---

## Summary counts (fill at end)

| Status | Count |
|--------|-------|
| Fixed by you (in repo) | |
| OPEN — needs Cursor | |
| Question / needs owner decision | |

---

# 1. Landing plan layout (`Ctrl+N` fresh project)

Compare Revit empty plan vs TextDesign. Measure in Revit if possible; note TextDesign mm in `revitLandingLayout.ts` if known.

| # | Element | Revit (correct) | TextDesign (wrong) | Severity | Status | Notes / file to fix |
|---|---------|-----------------|---------------------|----------|--------|---------------------|
| 1 | Plan crop outer border (size) | | | | OPEN / FIXED | |
| 2 | Annotation crop (grey dashed inset) | | | | | |
| 3 | Annotation crop inset distance | | | | | |
| 4 | Reference plane H position (Y) | | | | | |
| 5 | Reference plane V position (X) | | | | | |
| 6 | Ref plane extent (full crop vs shorter) | | | | | |
| 7 | Scope box visible on landing? | | | | | |
| 8 | Section line Y (center vs offset) | | | | | |
| 9 | Section line length / end bubbles | | | | | |
| 10 | Section bubble label ("1", etc.) | | | | | |
| 11 | Elevation marker distance from crop | | | | | |
| 12 | Elevation marker size / triangle | | | | | |
| 13 | North arrow position | | | | | |
| 14 | Scale bar position + style | | | | | |
| 15 | Zoom to fit (`ZE` / `ZA`) framing | | | | | |
| 16 | Plan background color (white/grey) | | | | | |
| 17 | Other: | | | | | |

---

# 2. Selection, delete, move (landing elements)

| # | Action | Revit behavior | TextDesign behavior | Status | Fixed in |
|---|--------|----------------|---------------------|--------|----------|
| 1 | Click north arrow → select | | | | |
| 2 | Click scale bar → select | | | | |
| 3 | Delete north / scale | | | | |
| 4 | Click elevation marker → select | | | | |
| 5 | Delete elevation marker | | | | |
| 6 | Double-click elevation → view | | | | |
| 7 | Click section → select | | | | |
| 8 | Double-click section → view | | | | |
| 9 | Click ref plane → select | | | | |
| 10 | Click crop border → select | | | | |
| 11 | Box select window vs crossing | | | | |
| 12 | Ctrl+click add selection | | | | |
| 13 | Shift+click remove selection | | | | |
| 14 | Tab cycle at overlap | | | | |
| 15 | Other: | | | | |

---

# 3. Tools — placement & usage

For each tool: **Revit steps** vs **TextDesign steps**, clicks, Esc cancel, result.

### Wall (WA)
| Item | Revit | TextDesign | Status |
|------|-------|------------|--------|
| Activation (ribbon / shortcut) | | | |
| Clicks to place | | | |
| Shift orthogonal | | | |
| Chain / height options bar | | | |
| Typed length | | | |
| Esc cancel | | | |
| Other | | | |

### Door (DR) / Window (WN)
| Item | Revit | TextDesign | Status |
|------|-------|------------|--------|
| Host wall required | | | |
| Space flip handedness | | | |
| Preview on hover | | | |
| Other | | | |

### Grid (GR)
| Item | Revit | TextDesign | Status |
|------|-------|------------|--------|
| Two-click place | | | |
| Angle arc + label | | | |
| Snap tooltip text | | | |
| Bubble numbering | | | |
| Line style (dash-dot) | | | |
| Other | | | |

### Reference plane (RP)
| Item | Revit | TextDesign | Status |
|------|-------|------------|--------|
| Ribbon location (Work Plane) | | | |
| Two-click / extent | | | |
| Clip to scope | | | |
| Line style (long dash green) | | | |
| Other | | | |

### Section (SN / View tab)
| Item | Revit | TextDesign | Status |
|------|-------|------------|--------|
| Ribbon tab / group | | | |
| Span full width | | | |
| Creates linked view | | | |
| Other | | | |

### Level (LL) / Room (RM) / Column / Floor / Stair
| Tool | Revit | TextDesign | Status |
|------|-------|------------|--------|
| Level | | | |
| Room | | | |
| Column | | | |
| Floor | | | |
| Stair | | | |

### Modify (MV, CO, RO, MM, AL, TR, SL, DE)
| Tool | Revit | TextDesign | Status |
|------|-------|------------|--------|
| Move | | | |
| Copy | | | |
| Rotate | | | |
| Mirror | | | |
| Align | | | |
| Trim | | | |
| Split | | | |
| Delete | | | |

---

# 4. Ribbon & UI shell

| # | Area | Revit | TextDesign | Status |
|---|------|-------|------------|--------|
| 1 | Tab names & order | | | |
| 2 | Architecture groups (Build, Datum, …) | | | |
| 3 | Missing buttons | | | |
| 4 | Wrong disabled/enabled | | | |
| 5 | Wrong shortcuts shown | | | |
| 6 | Options bar per tool | | | |
| 7 | Properties panel fields | | | |
| 8 | Project browser tree labels | | | |
| 9 | View control bar buttons | | | |
| 10 | Status bar default text | | | |
| 11 | Title bar / file menu | | | |
| 12 | Other: | | | |

---

# 5. Right-click & general interaction (all departments)

| # | Context | Revit menu / behavior | TextDesign | Status |
|---|---------|----------------------|------------|--------|
| 1 | Canvas empty | | | |
| 2 | Canvas with selection | | | |
| 3 | During place command | | | |
| 4 | Project browser view | | | |
| 5 | Wheel zoom | | | |
| 6 | Middle mouse pan | | | |
| 7 | Double-click empty | | | |
| 8 | Other: | | | |

---

# 6. Views (section / elevation)

| # | View type | Revit | TextDesign | Status |
|---|-----------|-------|------------|--------|
| 1 | Open from marker | | | |
| 2 | Open from section line | | | |
| 3 | Content shown (2D cut) | | | |
| 4 | Browser name | | | |
| 5 | Switch back to plan | | | |
| 6 | Other: | | | |

---

# 7. File & shortcuts

| # | Feature | Revit | TextDesign | Status |
|---|---------|-------|------------|--------|
| 1 | New project | | | |
| 2 | Save / open | | | |
| 3 | Undo / redo | | | |
| 4 | Keyboard shortcuts list | | | |
| 5 | Other: | | | |

---

# 8. Bugs / crashes

| # | Steps to reproduce | Expected | Actual | Status |
|---|-------------------|----------|--------|--------|
| 1 | | | | |
| 2 | | | | |

---

# 9. What you already fixed (for Cursor context)

List PRs or commits so Cursor does not redo work.

| # | Issue | Fix summary | Commit / PR |
|---|-------|-------------|-------------|
| 1 | | | |
| 2 | | | |

---

# 10. Screenshots & attachments (optional)

List files you attach or paths in repo:

- [ ] Revit empty plan screenshot  
- [ ] TextDesign `Ctrl+N` screenshot  
- [ ] Side-by-side annotated image  
- [ ] Other:  

---

# 11. Questions for project owner

| # | Question | Your suggestion |
|---|----------|-----------------|
| 1 | | |
| 2 | | |

---

# 12. Free-form — anything else for Cursor

```
Paste anything that did not fit above: odd behaviors, ideas, constants you changed,
files you touched, build errors, etc.




```

---

## Final checklist before sending to owner

- [ ] Ran `npm run build` — result: PASS / FAIL  
- [ ] Tested fresh `Ctrl+N`  
- [ ] Compared to Revit (any year)  
- [ ] Listed **all** mismatches (including “small” ones)  
- [ ] Marked each row FIXED or OPEN  
- [ ] Filled summary counts at top  

**Owner:** Copy this whole document into Cursor and say: “Implement all OPEN items from the report.”
