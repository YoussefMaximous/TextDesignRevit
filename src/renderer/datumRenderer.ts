import type {
  ElevationMarker,
  Grid,
  Point2D,
  ProjectModel,
  ReferencePlane,
  ReferencePlaneTint,
  ScopeBox,
  View,
  WorkingSection,
} from '../engine/types'
import { isDatumVisibleInView, LANDING_FLOOR_PLAN_BOX } from '../engine/datumGeometry'
import { revitAnnotationCrop } from '../engine/revitLandingLayout'
import { getCssColor, toCanvas, type ViewTransform } from './transform'

/** Long dash — Revit reference plane (not dash-dot like grids). */
const REF_PLANE_DASH: Record<ReferencePlaneTint, number[]> = {
  green: [14, 6],
  red: [14, 6],
}

/** Dash-dot centerline — Revit structural grid. */
const GRID_DASH = [10, 3, 2, 3]

function drawStyledLine(
  ctx: CanvasRenderingContext2D,
  start: Point2D,
  end: Point2D,
  tx: ViewTransform,
  color: string,
  dash: number[],
  lineWidth: number,
): void {
  const [x1, y1] = toCanvas(start, tx)
  const [x2, y2] = toCanvas(end, tx)
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.setLineDash(dash.map((d) => d / Math.max(tx.scale, 0.02)))
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawSolidRect(
  ctx: CanvasRenderingContext2D,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  tx: ViewTransform,
  color: string,
  lineWidth: number,
  selected = false,
): void {
  const corners: Point2D[] = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ]
  ctx.strokeStyle = selected ? getCssColor('--sel-element') : color
  ctx.lineWidth = selected ? lineWidth + 0.5 : lineWidth
  ctx.setLineDash([])
  ctx.beginPath()
  const [fx, fy] = toCanvas(corners[0], tx)
  ctx.moveTo(fx, fy)
  for (let i = 1; i < corners.length; i++) {
    const [x, y] = toCanvas(corners[i], tx)
    ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.stroke()
}

function refPlaneColor(tint: ReferencePlaneTint = 'green'): string {
  return tint === 'red'
    ? getCssColor('--el-ref-plane-red')
    : getCssColor('--el-ref-plane-green')
}

function renderElevationMarkerGraphic(
  ctx: CanvasRenderingContext2D,
  em: ElevationMarker,
  tx: ViewTransform,
  selected: boolean,
): void {
  const [cx, cy] = toCanvas(em.position, tx)
  const [txx, tyy] = toCanvas(em.lookTarget, tx)
  const dx = txx - cx
  const dy = tyy - cy
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const r = 13
  const color = selected ? getCssColor('--sel-element') : getCssColor('--el-elevation-marker')

  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = selected ? 2 : 1
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  const tipX = cx + ux * r * 1.35
  const tipY = cy + uy * r * 1.35
  const baseX = cx + ux * r * 0.35
  const baseY = cy + uy * r * 0.35
  const px = -uy
  const py = ux
  const half = r * 0.55
  ctx.beginPath()
  ctx.moveTo(tipX, tipY)
  ctx.lineTo(baseX + px * half, baseY + py * half)
  ctx.lineTo(baseX - px * half, baseY - py * half)
  ctx.closePath()
  ctx.fill()
}

function renderNorthArrow(
  ctx: CanvasRenderingContext2D,
  anchor: Point2D,
  tx: ViewTransform,
  selected = false,
): void {
  const [ax, ay] = toCanvas(anchor, tx)
  const r = 16
  const color = selected ? getCssColor('--sel-element') : getCssColor('--el-floor-plan-border')
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = selected ? 1.5 : 1
  ctx.font = 'bold 10px Segoe UI, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.beginPath()
  ctx.arc(ax, ay, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(ax, ay - r * 0.55)
  ctx.lineTo(ax - r * 0.35, ay + r * 0.2)
  ctx.lineTo(ax + r * 0.35, ay + r * 0.2)
  ctx.closePath()
  ctx.fill()
  ctx.fillText('N', ax, ay + r * 0.15)
}

function renderScaleBar(
  ctx: CanvasRenderingContext2D,
  anchor: Point2D,
  tx: ViewTransform,
  scaleLabel: string,
  selected = false,
): void {
  const [ax, ay] = toCanvas(anchor, tx)
  const barLen = 88
  const color = selected ? getCssColor('--sel-element') : getCssColor('--el-floor-plan-border')
  const y = ay + 32
  const seg = barLen / 4
  for (let i = 0; i < 4; i++) {
    const x = ax + seg * i
    ctx.fillStyle = i % 2 === 0 ? '#1a1a1a' : '#ffffff'
    ctx.fillRect(x, y - 5, seg, 5)
    ctx.strokeStyle = color
    ctx.lineWidth = 0.75
    ctx.strokeRect(x, y - 5, seg, 5)
  }
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(ax, y)
  ctx.lineTo(ax + barLen, y)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.font = '9px Segoe UI, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(scaleLabel, ax, y + 6)
}

/** Scope box outline — only when selected (Revit default view hides it). */
function renderScopeBox(
  ctx: CanvasRenderingContext2D,
  sb: ScopeBox,
  tx: ViewTransform,
  selected: boolean,
): void {
  if (!selected) return
  const dash = [10 / Math.max(tx.scale, 0.02), 6 / Math.max(tx.scale, 0.02)]
  const corners: Point2D[] = [
    { x: sb.minX, y: sb.minY },
    { x: sb.maxX, y: sb.minY },
    { x: sb.maxX, y: sb.maxY },
    { x: sb.minX, y: sb.maxY },
  ]
  const color = getCssColor('--sel-element')
  for (let i = 0; i < corners.length; i++) {
    drawStyledLine(ctx, corners[i], corners[(i + 1) % corners.length], tx, color, dash, 1.5)
  }
}

const WORKING_SECTION_DASH = [4, 6]

/** Working section — dotted blue section cut line on plan (not a reference plane). */
function renderWorkingSection(
  ctx: CanvasRenderingContext2D,
  ws: WorkingSection,
  tx: ViewTransform,
  selected: boolean,
): void {
  const color = selected ? getCssColor('--sel-element') : getCssColor('--el-working-section')
  drawStyledLine(ctx, ws.start, ws.end, tx, color, WORKING_SECTION_DASH, selected ? 1.5 : 1.1)

  const drawEndHandle = (pt: Point2D, flipSide: boolean, label: string) => {
    const [bx, by] = toCanvas(pt, tx)
    const r = 12
    const handleColor = getCssColor('--el-working-section-handle')
    ctx.strokeStyle = handleColor
    ctx.fillStyle = 'rgba(33, 150, 243, 0.2)'
    ctx.lineWidth = 1.25
    ctx.beginPath()
    ctx.arc(bx, by, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = handleColor
    ctx.font = 'bold 10px Segoe UI, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, bx, by)

    const arcR = r + 5
    const arcStart = flipSide ? Math.PI * 0.25 : Math.PI * 1.25
    const arcEnd = flipSide ? Math.PI * 1.75 : Math.PI * 0.75
    ctx.strokeStyle = handleColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(bx, by, arcR, arcStart, arcEnd)
    ctx.stroke()
  }

  drawEndHandle(ws.start, ws.flipped, '1')
  drawEndHandle(ws.end, !ws.flipped, '1')
}

/** Reference plane: long dashed line, no bubbles (unlike grids). */
function renderReferencePlane(
  ctx: CanvasRenderingContext2D,
  rp: ReferencePlane,
  tx: ViewTransform,
  selected: boolean,
): void {
  const tint = rp.tint ?? 'green'
  const color = selected ? getCssColor('--sel-element') : refPlaneColor(tint)
  drawStyledLine(ctx, rp.start, rp.end, tx, color, REF_PLANE_DASH[tint], selected ? 1.5 : 1)
}

/** Structural grid: dash-dot line + circular bubble with name at end. */
export function renderGridLine(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  tx: ViewTransform,
  selected: boolean,
  preview = false,
): void {
  const lineColor = selected
    ? getCssColor('--sel-element')
    : getCssColor('--el-grid-line')
  drawStyledLine(
    ctx,
    grid.start,
    grid.end,
    tx,
    lineColor,
    preview ? [6, 4] : GRID_DASH,
    selected || preview ? 1.25 : 0.85,
  )

  const drawBubble = (pt: Point2D) => {
    const [bx, by] = toCanvas(pt, tx)
    const BUBBLE_R = 13
    ctx.fillStyle = getCssColor('--el-grid-bubble-fill')
    ctx.strokeStyle = selected ? getCssColor('--sel-element') : getCssColor('--el-grid-bubble-fill')
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(bx, by, BUBBLE_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = getCssColor('--el-grid-bubble-text')
    ctx.font = 'bold 11px "Roboto Mono", Consolas, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(grid.name, bx, by)
  }

  if (grid.bubbleEnd === 'start' || grid.bubbleEnd === 'both') drawBubble(grid.start)
  if (grid.bubbleEnd === 'end' || grid.bubbleEnd === 'both') drawBubble(grid.end)
}

/** Placement preview for reference plane or working section tools. */
export function renderDatumLinePreview(
  ctx: CanvasRenderingContext2D,
  start: Point2D,
  end: Point2D,
  tx: ViewTransform,
  kind: 'reference-plane' | 'working-section',
): void {
  if (kind === 'reference-plane') {
    renderReferencePlane(
      ctx,
      {
        id: 'preview-rp',
        name: 'Reference Plane',
        start,
        end,
        tint: 'green',
      },
      tx,
      false,
    )
  } else {
    const horizontal = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y)
    renderWorkingSection(
      ctx,
      {
        id: 'preview-ws',
        name: 'Section',
        start,
        end,
        orientation: horizontal ? 'horizontal' : 'vertical',
        levelId: 'lvl-1',
        flipped: false,
      },
      tx,
      false,
    )
  }
}

export function renderDatums(
  ctx: CanvasRenderingContext2D,
  model: ProjectModel,
  tx: ViewTransform,
  activeView: View | undefined,
  selectedIds: string[],
  hoverElementId?: string,
): void {
  const isFloorPlan = activeView?.type === 'floor-plan'
  if (!isFloorPlan) return

  const border = getCssColor('--el-floor-plan-border')
  const crop = activeView?.cropRegion ?? LANDING_FLOOR_PLAN_BOX
  const ann =
    activeView?.annotationCropRegion ?? revitAnnotationCrop(crop)
  const cropSelected = selectedIds.includes(`view-crop:${activeView?.id}`)

  drawSolidRect(ctx, crop.minX, crop.minY, crop.maxX, crop.maxY, tx, border, 2, cropSelected)

  const annColor = getCssColor('--el-annotation-crop')
  const annDash = [8 / Math.max(tx.scale, 0.02), 5 / Math.max(tx.scale, 0.02)]
  drawStyledLine(
    ctx,
    { x: ann.minX, y: ann.minY },
    { x: ann.maxX, y: ann.minY },
    tx,
    annColor,
    annDash,
    1,
  )
  drawStyledLine(
    ctx,
    { x: ann.maxX, y: ann.minY },
    { x: ann.maxX, y: ann.maxY },
    tx,
    annColor,
    annDash,
    1,
  )
  drawStyledLine(
    ctx,
    { x: ann.maxX, y: ann.maxY },
    { x: ann.minX, y: ann.maxY },
    tx,
    annColor,
    annDash,
    1,
  )
  drawStyledLine(
    ctx,
    { x: ann.minX, y: ann.maxY },
    { x: ann.minX, y: ann.minY },
    tx,
    annColor,
    annDash,
    1,
  )

  for (const sb of model.scopeBoxes) {
    const sel = selectedIds.includes(sb.id) || hoverElementId === sb.id
    renderScopeBox(ctx, sb, tx, sel)
  }

  for (const rp of model.referencePlanes) {
    if (!isDatumVisibleInView(rp.scopeBoxId, activeView)) continue
    const sel = selectedIds.includes(rp.id) || hoverElementId === rp.id
    renderReferencePlane(ctx, rp, tx, sel)
  }

  for (const ws of model.workingSections ?? []) {
    if (!isDatumVisibleInView(ws.scopeBoxId, activeView)) continue
    const sel = selectedIds.includes(ws.id) || hoverElementId === ws.id
    renderWorkingSection(ctx, ws, tx, sel)
  }

  for (const grid of model.grids) {
    if (!isDatumVisibleInView(grid.scopeBoxId, activeView)) continue
    const sel = selectedIds.includes(grid.id) || hoverElementId === grid.id
    renderGridLine(ctx, grid, tx, sel)
  }

  for (const em of model.elevationMarkers) {
    if (!isDatumVisibleInView(em.scopeBoxId, activeView)) continue
    const sel = selectedIds.includes(em.id) || hoverElementId === em.id
    renderElevationMarkerGraphic(ctx, em, tx, sel)
  }

  for (const ann of model.viewAnnotations ?? []) {
    if (activeView && ann.viewId !== activeView.id) continue
    const sel = selectedIds.includes(ann.id) || hoverElementId === ann.id
    if (ann.kind === 'north-arrow') {
      renderNorthArrow(ctx, ann.position, tx, sel)
    } else if (ann.kind === 'scale-bar') {
      renderScaleBar(ctx, ann.position, tx, `1:${ann.scaleRatio}`, sel)
    }
  }
}
