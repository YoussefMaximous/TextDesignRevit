import type { Column, Floor, Point2D, Stair } from '../engine/types'
import { getCssColor, toCanvas, type ViewTransform } from './transform'

function drawRectModel(
  ctx: CanvasRenderingContext2D,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  tx: ViewTransform,
  fill: string,
  stroke: string,
  lineWidth = 1,
  alpha = 1,
): void {
  const [x1, y1] = toCanvas({ x: minX, y: minY }, tx)
  const [x2, y2] = toCanvas({ x: maxX, y: maxY }, tx)
  const left = Math.min(x1, x2)
  const top = Math.min(y1, y2)
  const w = Math.abs(x2 - x1)
  const h = Math.abs(y2 - y1)
  ctx.globalAlpha = alpha
  ctx.fillStyle = fill
  ctx.fillRect(left, top, w, h)
  ctx.strokeStyle = stroke
  ctx.lineWidth = lineWidth
  ctx.strokeRect(left, top, w, h)
  ctx.globalAlpha = 1
}

export function renderColumn(
  ctx: CanvasRenderingContext2D,
  col: Column,
  tx: ViewTransform,
  selected = false,
  preview = false,
): void {
  const hw = col.width / 2
  const hd = col.depth / 2
  const fill = preview
    ? 'rgba(107, 107, 107, 0.35)'
    : selected
      ? 'rgba(79, 195, 247, 0.35)'
      : getCssColor('--el-column-fill')
  const stroke = selected ? getCssColor('--sel-element') : getCssColor('--el-column')
  drawRectModel(
    ctx,
    col.position.x - hw,
    col.position.y - hd,
    col.position.x + hw,
    col.position.y + hd,
    tx,
    fill,
    stroke,
    selected ? 1.5 : 1,
    preview ? 0.75 : 1,
  )
  const [cx, cy] = toCanvas(col.position, tx)
  ctx.strokeStyle = stroke
  ctx.lineWidth = 0.75
  ctx.beginPath()
  ctx.moveTo(cx - 4, cy - 4)
  ctx.lineTo(cx + 4, cy + 4)
  ctx.moveTo(cx + 4, cy - 4)
  ctx.lineTo(cx - 4, cy + 4)
  ctx.stroke()
}

export function renderFloor(
  ctx: CanvasRenderingContext2D,
  floor: Floor,
  tx: ViewTransform,
  selected = false,
  preview = false,
): void {
  const fill = preview
    ? 'rgba(154, 139, 122, 0.25)'
    : selected
      ? 'rgba(79, 195, 247, 0.2)'
      : getCssColor('--el-floor-fill')
  const stroke = selected ? getCssColor('--sel-element') : getCssColor('--el-floor')
  drawRectModel(
    ctx,
    floor.minX,
    floor.minY,
    floor.maxX,
    floor.maxY,
    tx,
    fill,
    stroke,
    selected ? 1.5 : 1,
    preview ? 0.7 : 1,
  )
}

export function renderStair(
  ctx: CanvasRenderingContext2D,
  stair: Stair,
  tx: ViewTransform,
  selected = false,
  preview = false,
): void {
  const hw = stair.width / 2
  const hd = stair.depth / 2
  const minX = stair.position.x - hw
  const minY = stair.position.y - hd
  const maxX = stair.position.x + hw
  const maxY = stair.position.y + hd
  const stroke = selected ? getCssColor('--sel-element') : getCssColor('--el-stair')
  const fill = preview ? 'rgba(122, 107, 85, 0.2)' : 'transparent'

  drawRectModel(ctx, minX, minY, maxX, maxY, tx, fill, stroke, selected ? 1.5 : 1, preview ? 0.7 : 1)

  const steps = 6
  const stepDepth = (maxY - minY) / steps
  ctx.strokeStyle = stroke
  ctx.lineWidth = 1
  for (let i = 1; i < steps; i++) {
    const y = minY + stepDepth * i
    const [x1, py] = toCanvas({ x: minX, y }, tx)
    const [x2] = toCanvas({ x: maxX, y }, tx)
    ctx.beginPath()
    ctx.moveTo(x1, py)
    ctx.lineTo(x2, py)
    ctx.stroke()
  }

  const arrow: Point2D[] = [
    { x: minX + (maxX - minX) * 0.15, y: maxY },
    { x: minX + (maxX - minX) * 0.15, y: minY + stepDepth },
  ]
  const [ax1, ay1] = toCanvas(arrow[0], tx)
  const [ax2, ay2] = toCanvas(arrow[1], tx)
  ctx.beginPath()
  ctx.moveTo(ax1, ay1)
  ctx.lineTo(ax2, ay2)
  ctx.stroke()
}
