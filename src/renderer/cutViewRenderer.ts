import type { ProjectModel, View } from '../engine/types'
import { wallLength } from '../engine/geometry'
import { getWallCorners } from '../engine/geometry'
import { getCssColor, toCanvas, type ViewTransform } from './transform'

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  tx: ViewTransform,
  fill: string,
  stroke: string,
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
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = 1
  ctx.stroke()
}

/** 2D section cut — walls intersecting the section line appear as vertical cuts. */
export function renderSectionCutView(
  ctx: CanvasRenderingContext2D,
  model: ProjectModel,
  view: View,
  tx: ViewTransform,
): void {
  const ws = model.workingSections?.find((w) => w.id === view.workingSectionId)
  if (!ws) return
  const cutY = ws.orientation === 'horizontal' ? ws.start.y : (ws.start.y + ws.end.y) / 2
  const cutX = ws.orientation === 'vertical' ? ws.start.x : (ws.start.x + ws.end.x) / 2

  const fill = getCssColor('--el-wall-fill')
  const stroke = getCssColor('--el-wall')

  for (const wall of model.walls) {
    const minY = Math.min(wall.start.y, wall.end.y)
    const maxY = Math.max(wall.start.y, wall.end.y)
    const minX = Math.min(wall.start.x, wall.end.x)
    const maxX = Math.max(wall.start.x, wall.end.x)

    if (ws.orientation === 'horizontal') {
      if (cutY < minY || cutY > maxY) continue
      const t = wallLength(wall) < 1 ? 0.5 : (cutY - wall.start.y) / (wall.end.y - wall.start.y)
      const clampT = Math.max(0, Math.min(1, t))
      const cx = wall.start.x + (wall.end.x - wall.start.x) * clampT
      const half = wall.thickness / 2
      const h = wall.height
      const rect = [
        { x: cx - half, y: 0 },
        { x: cx + half, y: 0 },
        { x: cx + half, y: h },
        { x: cx - half, y: h },
      ]
      drawPolygon(ctx, rect, tx, fill, stroke)
    } else {
      if (cutX < minX || cutX > maxX) continue
      const t = wallLength(wall) < 1 ? 0.5 : (cutX - wall.start.x) / (wall.end.x - wall.start.x)
      const clampT = Math.max(0, Math.min(1, t))
      const cy = wall.start.y + (wall.end.y - wall.start.y) * clampT
      const half = wall.thickness / 2
      const h = wall.height
      const rect = [
        { x: 0, y: cy - half },
        { x: h, y: cy - half },
        { x: h, y: cy + half },
        { x: 0, y: cy + half },
      ]
      drawPolygon(ctx, rect, tx, fill, stroke)
    }
  }
}

/** 2D elevation — walls projected onto vertical plane facing marker direction. */
export function renderElevationCutView(
  ctx: CanvasRenderingContext2D,
  model: ProjectModel,
  view: View,
  tx: ViewTransform,
): void {
  const marker = model.elevationMarkers.find((m) => m.id === view.elevationMarkerId)
  if (!marker) return

  const fill = getCssColor('--el-wall-fill')
  const stroke = getCssColor('--el-wall')

  for (const wall of model.walls) {
    if (wall.levelId !== marker.levelId && model.levels.length > 1) continue
    const corners = getWallCorners(wall)
    let depth = 0
    let spanStart = 0
    let spanEnd = 0
    let baseZ = 0
    const h = wall.height

    switch (marker.direction) {
      case 'north':
      case 'south':
        depth = (corners[0].y + corners[2].y) / 2
        spanStart = Math.min(wall.start.x, wall.end.x)
        spanEnd = Math.max(wall.start.x, wall.end.x)
        break
      case 'east':
      case 'west':
        depth = (corners[0].x + corners[2].x) / 2
        spanStart = Math.min(wall.start.y, wall.end.y)
        spanEnd = Math.max(wall.start.y, wall.end.y)
        break
    }

    const rect = [
      { x: spanStart, y: baseZ },
      { x: spanEnd, y: baseZ },
      { x: spanEnd, y: baseZ + h },
      { x: spanStart, y: baseZ + h },
    ]
    void depth
    drawPolygon(ctx, rect, tx, fill, stroke)
  }

  const [mx, my] = toCanvas(marker.position, tx)
  ctx.strokeStyle = getCssColor('--el-elevation-marker')
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(mx, my - 2000)
  ctx.lineTo(mx, my + 2000)
  ctx.stroke()
  ctx.setLineDash([])
}
