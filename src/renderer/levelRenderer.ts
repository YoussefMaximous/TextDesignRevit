import type { Level, Point2D } from '../engine/types'
import { REVIT_CROP_BOX } from '../engine/revitLandingLayout'
import { getCssColor, toCanvas, type ViewTransform } from './transform'

export function renderLevelLine(
  ctx: CanvasRenderingContext2D,
  level: Level,
  tx: ViewTransform,
  crop = REVIT_CROP_BOX,
  selected = false,
): void {
  const y = level.planLineY
  if (y === undefined) return
  const start: Point2D = { x: crop.minX, y }
  const end: Point2D = { x: crop.maxX, y }
  const [x1, y1] = toCanvas(start, tx)
  const [x2, y2] = toCanvas(end, tx)
  const color = selected ? getCssColor('--sel-element') : getCssColor('--el-level')
  ctx.strokeStyle = color
  ctx.lineWidth = selected ? 1.5 : 1
  ctx.setLineDash([12 / Math.max(tx.scale, 0.02), 4 / Math.max(tx.scale, 0.02)])
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.setLineDash([])

  const drawBubble = (bx: number, by: number) => {
    const r = 10
    ctx.strokeStyle = color
    ctx.fillStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(bx, by, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = color
    ctx.font = 'bold 9px Segoe UI, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const label = level.name.replace('Level ', '') || '1'
    ctx.fillText(label, bx, by)
  }

  if (level.headBubble) drawBubble(x1, y1)
  if (level.tailBubble) drawBubble(x2, y2)
}

export function getLevelLineBBox(level: Level, crop = REVIT_CROP_BOX, pad = 400) {
  const y = level.planLineY ?? 0
  return {
    minX: crop.minX - pad,
    minY: y - pad,
    maxX: crop.maxX + pad,
    maxY: y + pad,
  }
}

export function pickLevelLine(
  point: Point2D,
  level: Level,
): { elementId: string; elementType: 'level'; distance: number } | null {
  if (level.planLineY === undefined) return null
  const d = Math.abs(point.y - level.planLineY)
  if (d > 500) return null
  return { elementId: level.id, elementType: 'level', distance: d }
}
