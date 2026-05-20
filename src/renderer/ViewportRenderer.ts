import type { Door, Grid, Point2D, ProjectModel, Wall, Window } from '../engine/types'
import {
  getDoorsOnWall,
  getWallCorners,
  getWindowsOnWall,
  midpoint,
  perpendicular,
  wallDirection,
} from '../engine/geometry'
import type { SelectionTempDim } from '../engine/tempDimensions'
import type { SnapCandidate } from '../engine/types'
import { renderColumn, renderFloor, renderStair } from './buildingRenderer'
import { renderSectionCutView, renderElevationCutView } from './cutViewRenderer'
import { renderDatums, renderDatumLinePreview, renderGridLine } from './datumRenderer'
import { renderLevelLine } from './levelRenderer'
import { getCssColor, toCanvas, type ViewTransform } from './transform'

export interface RenderOverlay {
  previewWall?: Wall
  previewDoor?: Door
  previewWindow?: Window
  hoverElementId?: string
  selectedIds: string[]
  snapCandidate?: SnapCandidate
  alignmentLines?: { start: Point2D; end: Point2D }[]
  tempDimension?: { start: Point2D; end: Point2D; text: string }
  hostedTempDims?: { start: Point2D; end: Point2D; text: string }[]
  selectionTempDims?: SelectionTempDim[]
  selectionGrips?: Point2D[]
  highlightDimId?: string
  previewGridLine?: { start: Point2D; end: Point2D }
  previewDatumLine?: {
    start: Point2D
    end: Point2D
    kind: 'reference-plane' | 'working-section'
  }
  angleArc?: { vertex: Point2D; end: Point2D; label: string }
  snapTooltip?: { position: Point2D; text: string }
  previewRoomPolygon?: Point2D[]
  previewFloor?: { minX: number; minY: number; maxX: number; maxY: number }
  previewColumn?: import('../engine/types').Column
  previewStair?: import('../engine/types').Stair
  selectionBox?: {
    x1: number
    y1: number
    x2: number
    y2: number
    crossing: boolean
  }
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  tx: ViewTransform,
  fill?: string,
  stroke?: string,
  lineWidth = 1,
): void {
  if (points.length < 2) return
  const [fx, fy] = toCanvas(points[0], tx)
  ctx.beginPath()
  ctx.moveTo(fx, fy)
  for (let i = 1; i < points.length; i++) {
    const [x, y] = toCanvas(points[i], tx)
    ctx.lineTo(x, y)
  }
  ctx.closePath()
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = lineWidth
    ctx.stroke()
  }
}

function renderBackgroundGrid(
  ctx: CanvasRenderingContext2D,
  tx: ViewTransform,
  width: number,
  height: number,
): void {
  const topLeft = { x: (0 - tx.originX) / tx.scale, y: (tx.originY - 0) / tx.scale }
  const bottomRight = {
    x: (width - tx.originX) / tx.scale,
    y: (tx.originY - height) / tx.scale,
  }
  const minX = Math.floor(Math.min(topLeft.x, bottomRight.x) / 100) * 100
  const maxX = Math.ceil(Math.max(topLeft.x, bottomRight.x) / 100) * 100
  const minY = Math.floor(Math.min(topLeft.y, bottomRight.y) / 100) * 100
  const maxY = Math.ceil(Math.max(topLeft.y, bottomRight.y) / 100) * 100

  ctx.fillStyle = getCssColor('--vp-grid-line')
  for (let mx = minX; mx <= maxX; mx += 100) {
    for (let my = minY; my <= maxY; my += 100) {
      const [cx, cy] = toCanvas({ x: mx, y: my }, tx)
      ctx.fillRect(cx - 0.5, cy - 0.5, 1, 1)
    }
  }
}

function renderWallBody(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  model: ProjectModel,
  tx: ViewTransform,
  alpha = 1,
): void {
  const corners = getWallCorners(wall)
  const fillColor = getCssColor('--el-wall-fill')
  const strokeColor = getCssColor('--el-wall')

  ctx.globalAlpha = alpha
  drawPolygon(ctx, corners, tx, fillColor, strokeColor, 1)
  ctx.globalAlpha = 1

  for (const door of getDoorsOnWall(model, wall.id)) {
    renderDoorOpening(ctx, wall, door, tx)
  }
  for (const win of getWindowsOnWall(model, wall.id)) {
    renderWindowOpening(ctx, wall, win, tx)
  }
}

function renderDoorOpening(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  door: Door,
  tx: ViewTransform,
): void {
  const dir = wallDirection(wall)
  const normal = perpendicular(dir)
  const center = {
    x: wall.start.x + dir.x * door.offsetFromStart,
    y: wall.start.y + dir.y * door.offsetFromStart,
  }
  const halfW = door.width / 2
  const halfT = wall.thickness / 2

  const openingStart = { x: center.x - dir.x * halfW, y: center.y - dir.y * halfW }
  const openingEnd = { x: center.x + dir.x * halfW, y: center.y + dir.y * halfW }

  const bg = getCssColor('--vp-background')
  ctx.fillStyle = bg
  const gapCorners = [
    { x: openingStart.x + normal.x * halfT, y: openingStart.y + normal.y * halfT },
    { x: openingEnd.x + normal.x * halfT, y: openingEnd.y + normal.y * halfT },
    { x: openingEnd.x - normal.x * halfT, y: openingEnd.y - normal.y * halfT },
    { x: openingStart.x - normal.x * halfT, y: openingStart.y - normal.y * halfT },
  ]
  drawPolygon(ctx, gapCorners, tx, bg)

  const hinge =
    door.handedness === 'left'
      ? { x: openingStart.x, y: openingStart.y }
      : { x: openingEnd.x, y: openingEnd.y }

  const wallAngle = Math.atan2(dir.y, dir.x)
  const swingRad = (door.swingAngle * Math.PI) / 180
  const openDir = door.handedness === 'left' ? wallAngle + Math.PI / 2 : wallAngle - Math.PI / 2
  const panelEnd = {
    x: hinge.x + Math.cos(openDir) * door.width * 0.92,
    y: hinge.y + Math.sin(openDir) * door.width * 0.92,
  }

  const doorColor = getCssColor('--el-door')
  const arcColor = getCssColor('--el-door-arc')

  ctx.strokeStyle = doorColor
  ctx.lineWidth = 1
  const [hx, hy] = toCanvas(hinge, tx)
  const [px, py] = toCanvas(panelEnd, tx)
  ctx.beginPath()
  ctx.moveTo(hx, hy)
  ctx.lineTo(px, py)
  ctx.stroke()

  ctx.strokeStyle = arcColor
  const arcStart = wallAngle + (door.handedness === 'left' ? Math.PI : 0)
  const arcEnd = door.handedness === 'left' ? arcStart + swingRad : arcStart - swingRad
  ctx.beginPath()
  ctx.arc(hx, hy, door.width * tx.scale * 0.92, arcStart, arcEnd, door.handedness === 'right')
  ctx.stroke()

  const threshLen = wall.thickness * 0.4
  for (const pt of [openingStart, openingEnd]) {
    const t1 = { x: pt.x + normal.x * halfT, y: pt.y + normal.y * halfT }
    const t2 = { x: pt.x + normal.x * (halfT - threshLen * 0.3), y: pt.y + normal.y * (halfT - threshLen * 0.3) }
    const [x1, y1] = toCanvas(t1, tx)
    const [x2, y2] = toCanvas(t2, tx)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
}

function renderWindowOpening(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  win: Window,
  tx: ViewTransform,
): void {
  const dir = wallDirection(wall)
  const normal = perpendicular(dir)
  const center = {
    x: wall.start.x + dir.x * win.offsetFromStart,
    y: wall.start.y + dir.y * win.offsetFromStart,
  }
  const halfW = win.width / 2
  const halfT = wall.thickness / 2

  const openingStart = { x: center.x - dir.x * halfW, y: center.y - dir.y * halfW }
  const openingEnd = { x: center.x + dir.x * halfW, y: center.y + dir.y * halfW }

  const bg = getCssColor('--vp-background')
  drawPolygon(
    ctx,
    [
      { x: openingStart.x + normal.x * halfT, y: openingStart.y + normal.y * halfT },
      { x: openingEnd.x + normal.x * halfT, y: openingEnd.y + normal.y * halfT },
      { x: openingEnd.x - normal.x * halfT, y: openingEnd.y - normal.y * halfT },
      { x: openingStart.x - normal.x * halfT, y: openingStart.y - normal.y * halfT },
    ],
    tx,
    bg,
  )

  const winColor = getCssColor('--el-window')
  const glassColor = getCssColor('--el-window-glass')
  ctx.strokeStyle = winColor
  ctx.lineWidth = 0.75

  for (const edge of [-1, 1] as const) {
    const off = edge * halfT * 0.85
    const s = { x: openingStart.x + normal.x * off, y: openingStart.y + normal.y * off }
    const e = { x: openingEnd.x + normal.x * off, y: openingEnd.y + normal.y * off }
    const [x1, y1] = toCanvas(s, tx)
    const [x2, y2] = toCanvas(e, tx)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  const innerOff = halfT * 0.35
  const outerOff = halfT * 0.85
  for (let i = 1; i <= 3; i++) {
    const t = i / 4
    const along = {
      x: openingStart.x + (openingEnd.x - openingStart.x) * t,
      y: openingStart.y + (openingEnd.y - openingStart.y) * t,
    }
    const p1 = { x: along.x + normal.x * innerOff, y: along.y + normal.y * innerOff }
    const p2 = { x: along.x + normal.x * outerOff, y: along.y + normal.y * outerOff }
    const [x1, y1] = toCanvas(p1, tx)
    const [x2, y2] = toCanvas(p2, tx)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  const glassPoly = [
    { x: openingStart.x + normal.x * innerOff, y: openingStart.y + normal.y * innerOff },
    { x: openingEnd.x + normal.x * innerOff, y: openingEnd.y + normal.y * innerOff },
    { x: openingEnd.x - normal.x * innerOff, y: openingEnd.y - normal.y * innerOff },
    { x: openingStart.x - normal.x * innerOff, y: openingStart.y - normal.y * innerOff },
  ]
  ctx.globalAlpha = 0.35
  drawPolygon(ctx, glassPoly, tx, glassColor)
  ctx.globalAlpha = 1
}

function renderGrid(ctx: CanvasRenderingContext2D, grid: Grid, tx: ViewTransform): void {
  renderGridLine(ctx, grid, tx, false)
}

function renderSnapIndicator(
  ctx: CanvasRenderingContext2D,
  candidate: SnapCandidate,
  tx: ViewTransform,
): void {
  const [x, y] = toCanvas(candidate.point, tx)
  const size = 6

  const colorMap: Record<string, string> = {
    endpoint: '--snap-endpoint',
    midpoint: '--snap-midpoint',
    intersection: '--snap-intersection',
    perpendicular: '--snap-perpendicular',
    nearest: '--snap-nearest',
    center: '--snap-center',
    parallel: '--snap-parallel',
  }
  ctx.strokeStyle = getCssColor(colorMap[candidate.type] ?? '--snap-nearest')
  ctx.fillStyle = ctx.strokeStyle
  ctx.lineWidth = 1.5

  switch (candidate.type) {
    case 'endpoint':
      ctx.strokeRect(x - size / 2, y - size / 2, size, size)
      break
    case 'midpoint': {
      ctx.beginPath()
      ctx.moveTo(x, y - size / 2)
      ctx.lineTo(x + size / 2, y + size / 2)
      ctx.lineTo(x - size / 2, y + size / 2)
      ctx.closePath()
      ctx.stroke()
      break
    }
    case 'intersection':
    case 'nearest':
      ctx.beginPath()
      ctx.moveTo(x - size / 2, y - size / 2)
      ctx.lineTo(x + size / 2, y + size / 2)
      ctx.moveTo(x + size / 2, y - size / 2)
      ctx.lineTo(x - size / 2, y + size / 2)
      ctx.stroke()
      break
    default:
      ctx.beginPath()
      ctx.arc(x, y, size / 2, 0, Math.PI * 2)
      ctx.stroke()
  }
}

function renderAlignmentLines(
  ctx: CanvasRenderingContext2D,
  lines: { start: Point2D; end: Point2D }[],
  tx: ViewTransform,
): void {
  ctx.setLineDash([6, 4])
  ctx.strokeStyle = getCssColor('--align-line')
  ctx.lineWidth = 0.75
  for (const line of lines) {
    const [x1, y1] = toCanvas(line.start, tx)
    const [x2, y2] = toCanvas(line.end, tx)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  ctx.setLineDash([])
}

/** Revit-style angle arc at the start point while placing a grid. */
function renderAngleArc(
  ctx: CanvasRenderingContext2D,
  vertex: Point2D,
  end: Point2D,
  label: string,
  tx: ViewTransform,
): void {
  const [vx, vy] = toCanvas(vertex, tx)
  const [ex, ey] = toCanvas(end, tx)
  const baseAngle = 0
  const endAngle = Math.atan2(-(ey - vy), ex - vx)
  const radius = Math.min(56, Math.max(28, Math.hypot(ex - vx, ey - vy) * 0.35))
  const anticlockwise = endAngle < 0

  ctx.strokeStyle = getCssColor('--angle-arc')
  ctx.fillStyle = getCssColor('--angle-arc-text')
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(vx, vy, radius, baseAngle, endAngle, anticlockwise)
  ctx.stroke()

  const labelAngle = endAngle / 2
  const lx = vx + Math.cos(labelAngle) * (radius + 14)
  const ly = vy - Math.sin(labelAngle) * (radius + 14)
  ctx.font = '11px Segoe UI, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, lx, ly)
}

function renderSnapTooltip(
  ctx: CanvasRenderingContext2D,
  position: Point2D,
  text: string,
  tx: ViewTransform,
): void {
  const [x, y] = toCanvas(position, tx)
  ctx.font = '11px Segoe UI, sans-serif'
  const padX = 8
  const tw = ctx.measureText(text).width
  const boxW = tw + padX * 2
  const boxH = 20
  const left = x + 12
  const top = y - boxH - 8

  ctx.fillStyle = getCssColor('--snap-tooltip-bg')
  ctx.strokeStyle = '#999'
  ctx.lineWidth = 1
  ctx.fillRect(left, top, boxW, boxH)
  ctx.strokeRect(left, top, boxW, boxH)
  ctx.fillStyle = getCssColor('--snap-tooltip-text')
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, left + padX, top + boxH / 2)
}

function renderTempDimension(
  ctx: CanvasRenderingContext2D,
  start: Point2D,
  end: Point2D,
  text: string,
  tx: ViewTransform,
  highlighted = false,
): void {
  const [x1, y1] = toCanvas(start, tx)
  const [x2, y2] = toCanvas(end, tx)
  const mid = midpoint(start, end)
  const [mx, my] = toCanvas(mid, tx)

  ctx.strokeStyle = getCssColor('--temp-dim-line')
  ctx.fillStyle = getCssColor('--temp-dim-text')
  ctx.lineWidth = highlighted ? 1.5 : 1
  ctx.setLineDash([])

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  const offset = 14
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const nx = -Math.sin(angle) * offset
  const ny = Math.cos(angle) * offset

  if (highlighted) {
    ctx.fillStyle = 'rgba(64, 128, 255, 0.2)'
    const pad = 4
    const tw = ctx.measureText(text).width + pad * 2
    ctx.fillRect(mx + nx - tw / 2, my + ny - 14, tw, 16)
    ctx.fillStyle = getCssColor('--temp-dim-text')
  }

  ctx.font = '11px Segoe UI, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(text, mx + nx, my + ny)
}

function renderSelectionTempDim(
  ctx: CanvasRenderingContext2D,
  dim: SelectionTempDim,
  tx: ViewTransform,
  highlighted: boolean,
): void {
  const [wx, wy] = toCanvas(dim.witnessPoint, tx)
  const [x1, y1] = toCanvas(dim.startPoint, tx)
  const [x2, y2] = toCanvas(dim.endPoint, tx)

  ctx.strokeStyle = getCssColor('--temp-dim-witness')
  ctx.lineWidth = 0.5
  ctx.setLineDash([2, 2])
  ctx.beginPath()
  ctx.moveTo(wx, wy)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(wx, wy)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.setLineDash([])

  renderTempDimension(
    ctx,
    dim.startPoint,
    dim.endPoint,
    dim.valueText,
    tx,
    highlighted,
  )

  ctx.fillStyle = getCssColor('--temp-dim-grip')
  for (const pt of [dim.startPoint, dim.endPoint]) {
    const [gx, gy] = toCanvas(pt, tx)
    ctx.beginPath()
    ctx.arc(gx, gy, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

function renderSelectionGrips(
  ctx: CanvasRenderingContext2D,
  grips: Point2D[],
  tx: ViewTransform,
): void {
  ctx.fillStyle = getCssColor('--sel-element')
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  grips.forEach((pt, i) => {
    const [gx, gy] = toCanvas(pt, tx)
    const size = i === 1 ? 5 : 6
    if (i === 1) {
      ctx.beginPath()
      ctx.moveTo(gx, gy - size)
      ctx.lineTo(gx + size, gy + size)
      ctx.lineTo(gx - size, gy + size)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else {
      ctx.fillRect(gx - size / 2, gy - size / 2, size, size)
      ctx.strokeRect(gx - size / 2, gy - size / 2, size, size)
    }
  })
}

function renderSelectionHighlight(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  tx: ViewTransform,
  color: string,
): void {
  const corners = getWallCorners(wall)
  ctx.globalAlpha = 0.35
  drawPolygon(ctx, corners, tx, color)
  ctx.globalAlpha = 1
}

export function renderViewport(
  ctx: CanvasRenderingContext2D,
  model: ProjectModel,
  tx: ViewTransform,
  width: number,
  height: number,
  overlay: RenderOverlay = { selectedIds: [] },
): void {
  ctx.clearRect(0, 0, width, height)

  const activeView = model.views.find((v) => v.id === model.activeViewId)
  const isFloorPlan = activeView?.type === 'floor-plan'
  const isSection = activeView?.type === 'section'
  const isElevation = activeView?.type === 'elevation'
  const isCutView = isSection || isElevation
  ctx.fillStyle = isFloorPlan
    ? getCssColor('--vp-floor-plan-bg')
    : getCssColor('--vp-background')
  ctx.fillRect(0, 0, width, height)

  if (!isFloorPlan) {
    renderBackgroundGrid(ctx, tx, width, height)
    ctx.fillStyle = getCssColor('--text-primary')
    ctx.font = 'bold 14px Segoe UI, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(activeView?.name ?? 'View', width / 2, 28)
    ctx.font = '11px Segoe UI, sans-serif'
    ctx.fillStyle = getCssColor('--text-secondary')
    const hint =
      activeView?.type === 'section'
        ? '2D section view (no 3D) — cut line on plan defines this view'
        : activeView?.type === 'elevation'
          ? '2D elevation view (no 3D) — marker on plan defines this view'
          : '2D view'
    ctx.fillText(hint, width / 2, 48)
  }

  const levelId = activeView?.levelId

  renderDatums(ctx, model, tx, activeView, overlay.selectedIds, overlay.hoverElementId)

  if (isFloorPlan) {
    for (const level of model.levels) {
      const sel =
        overlay.selectedIds.includes(level.id) || overlay.hoverElementId === level.id
      renderLevelLine(ctx, level, tx, undefined, sel)
    }
  }

  if (!isFloorPlan) {
    for (const grid of model.grids) {
      renderGrid(ctx, grid, tx)
    }
  }

  if (isSection && activeView) {
    renderSectionCutView(ctx, model, activeView, tx)
  } else if (isElevation && activeView) {
    renderElevationCutView(ctx, model, activeView, tx)
  }

  for (const wall of model.walls) {
    if (isCutView) continue
    if (levelId && wall.levelId !== levelId) continue
    if (overlay.hoverElementId === wall.id) {
      renderSelectionHighlight(ctx, wall, tx, getCssColor('--hover-highlight'))
    }
    if (overlay.selectedIds.includes(wall.id)) {
      renderSelectionHighlight(ctx, wall, tx, 'rgba(79, 195, 247, 0.25)')
    }
    renderWallBody(ctx, wall, model, tx)
  }

  if (overlay.previewWall) {
    renderWallBody(ctx, overlay.previewWall, model, tx, 0.65)
  }

  if (overlay.previewDoor) {
    const host = model.walls.find((w) => w.id === overlay.previewDoor?.hostWallId)
    if (host) {
      ctx.globalAlpha = 0.75
      renderDoorOpening(ctx, host, overlay.previewDoor, tx)
      ctx.globalAlpha = 1
    }
  }

  if (overlay.previewWindow) {
    const host = model.walls.find((w) => w.id === overlay.previewWindow?.hostWallId)
    if (host) {
      ctx.globalAlpha = 0.75
      renderWindowOpening(ctx, host, overlay.previewWindow, tx)
      ctx.globalAlpha = 1
    }
  }

  for (const floor of model.floors ?? []) {
    if (levelId && floor.levelId !== levelId) continue
    const sel = overlay.selectedIds.includes(floor.id) || overlay.hoverElementId === floor.id
    renderFloor(ctx, floor, tx, sel)
  }

  for (const col of model.columns) {
    if (levelId && col.levelId !== levelId) continue
    const sel = overlay.selectedIds.includes(col.id) || overlay.hoverElementId === col.id
    renderColumn(ctx, col, tx, sel)
  }

  for (const stair of model.stairs ?? []) {
    if (levelId && stair.levelId !== levelId) continue
    const sel = overlay.selectedIds.includes(stair.id) || overlay.hoverElementId === stair.id
    renderStair(ctx, stair, tx, sel)
  }

  for (const room of model.rooms) {
    const [txx, tyy] = toCanvas(room.tagPosition, tx)
    ctx.fillStyle = getCssColor('--el-room-tag')
    ctx.font = 'bold 11px Segoe UI, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(room.name, txx, tyy - 6)
    ctx.font = '10px Segoe UI, sans-serif'
    ctx.fillText(`${room.number} — ${room.area.toFixed(1)} m²`, txx, tyy + 8)
  }

  if (overlay.alignmentLines) {
    renderAlignmentLines(ctx, overlay.alignmentLines, tx)
  }

  if (overlay.tempDimension) {
    renderTempDimension(
      ctx,
      overlay.tempDimension.start,
      overlay.tempDimension.end,
      overlay.tempDimension.text,
      tx,
    )
  }

  if (overlay.hostedTempDims) {
    for (const dim of overlay.hostedTempDims) {
      renderTempDimension(ctx, dim.start, dim.end, dim.text, tx)
    }
  }

  if (overlay.selectionTempDims) {
    for (const dim of overlay.selectionTempDims) {
      renderSelectionTempDim(ctx, dim, tx, overlay.highlightDimId === dim.id)
    }
  }

  if (overlay.selectionGrips) {
    renderSelectionGrips(ctx, overlay.selectionGrips, tx)
  }

  if (overlay.previewDatumLine) {
    const p = overlay.previewDatumLine
    renderDatumLinePreview(ctx, p.start, p.end, tx, p.kind)
  }

  if (overlay.previewFloor) {
    renderFloor(
      ctx,
      { id: 'preview-floor', levelId: levelId ?? 'lvl-1', ...overlay.previewFloor },
      tx,
      false,
      true,
    )
  }

  if (overlay.previewColumn) {
    renderColumn(ctx, overlay.previewColumn, tx, false, true)
  }

  if (overlay.previewStair) {
    renderStair(ctx, overlay.previewStair, tx, false, true)
  }

  if (overlay.previewGridLine) {
    const g = overlay.previewGridLine
    renderGridLine(
      ctx,
      {
        id: 'preview-grid',
        name: '?',
        start: g.start,
        end: g.end,
        bubbleEnd: 'end',
        extentStart: 0,
        extentEnd: 0,
      },
      tx,
      false,
      true,
    )
  }

  if (overlay.angleArc) {
    renderAngleArc(ctx, overlay.angleArc.vertex, overlay.angleArc.end, overlay.angleArc.label, tx)
  }

  if (overlay.snapTooltip) {
    renderSnapTooltip(ctx, overlay.snapTooltip.position, overlay.snapTooltip.text, tx)
  }

  if (overlay.previewRoomPolygon && overlay.previewRoomPolygon.length >= 3) {
    const pts = overlay.previewRoomPolygon
    const [fx, fy] = toCanvas(pts[0], tx)
    ctx.beginPath()
    ctx.moveTo(fx, fy)
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = toCanvas(pts[i], tx)
      ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(64, 160, 255, 0.12)'
    ctx.fill()
    ctx.strokeStyle = getCssColor('--el-room-tag')
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])
  }

  if (overlay.snapCandidate) {
    renderSnapIndicator(ctx, overlay.snapCandidate, tx)
  }

  if (overlay.selectionBox) {
    const { x1, y1, x2, y2, crossing } = overlay.selectionBox
    const left = Math.min(x1, x2)
    const top = Math.min(y1, y2)
    const w = Math.abs(x2 - x1)
    const h = Math.abs(y2 - y1)
    if (crossing) {
      ctx.fillStyle = getCssColor('--sel-box-cross-fill')
      ctx.strokeStyle = getCssColor('--sel-box-cross-stroke')
      ctx.setLineDash([4, 4])
    } else {
      ctx.fillStyle = getCssColor('--sel-box-fill')
      ctx.strokeStyle = getCssColor('--sel-box-stroke')
      ctx.setLineDash([])
    }
    ctx.fillRect(left, top, w, h)
    ctx.lineWidth = 1
    ctx.strokeRect(left, top, w, h)
    ctx.setLineDash([])
  }
}
