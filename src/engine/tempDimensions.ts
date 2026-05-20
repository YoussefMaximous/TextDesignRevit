import type { Point2D, ProjectModel, Wall } from './types'
import {
  distance,
  formatLength,
  midpoint,
  nearestPointOnWall,
  projectPointOnSegment,
  wallDirection,
  wallLength,
} from './geometry'

export interface SelectionTempDim {
  id: string
  startPoint: Point2D
  endPoint: Point2D
  witnessPoint: Point2D
  valueText: string
  valueMm: number
  kind: 'length' | 'offset'
  editable: boolean
}

function angleBetween(w1: Wall, w2: Wall): number {
  const d1 = wallDirection(w1)
  const d2 = wallDirection(w2)
  const dot = Math.abs(d1.x * d2.x + d1.y * d2.y)
  return Math.acos(Math.min(1, dot)) * (180 / Math.PI)
}

function perpDistanceToWall(wall: Wall, point: Point2D): number {
  const nearest = nearestPointOnWall(wall, point)
  const { t } = projectPointOnSegment(point, wall.start, wall.end)
  if (t > 0.01 && t < 0.99) {
    return distance(point, nearest)
  }
  return Infinity
}

export function computeWallSelectionDims(
  wall: Wall,
  model: ProjectModel,
): SelectionTempDim[] {
  const dims: SelectionTempDim[] = []
  const len = wallLength(wall)
  const mid = midpoint(wall.start, wall.end)

  dims.push({
    id: 'length',
    startPoint: wall.start,
    endPoint: wall.end,
    witnessPoint: mid,
    valueText: formatLength(len),
    valueMm: len,
    kind: 'length',
    editable: true,
  })

  const others = model.walls.filter(
    (w) => w.id !== wall.id && w.levelId === wall.levelId,
  )

  for (const ref of others) {
    if (angleBetween(wall, ref) > 15) continue
    const dStart = perpDistanceToWall(ref, wall.start)
    const dEnd = perpDistanceToWall(ref, wall.end)
    if (dStart < 15000) {
      const foot = nearestPointOnWall(ref, wall.start)
      dims.push({
        id: `off-start-${ref.id}`,
        startPoint: wall.start,
        endPoint: foot,
        witnessPoint: midpoint(wall.start, foot),
        valueText: formatLength(dStart),
        valueMm: dStart,
        kind: 'offset',
        editable: false,
      })
    }
    if (dEnd < 15000) {
      const foot = nearestPointOnWall(ref, wall.end)
      dims.push({
        id: `off-end-${ref.id}`,
        startPoint: wall.end,
        endPoint: foot,
        witnessPoint: midpoint(wall.end, foot),
        valueText: formatLength(dEnd),
        valueMm: dEnd,
        kind: 'offset',
        editable: false,
      })
    }
  }

  return dims.slice(0, 5)
}

export function wallEndFromLength(wall: Wall, newLengthMm: number): Point2D {
  const dir = wallDirection(wall)
  return {
    x: wall.start.x + dir.x * newLengthMm,
    y: wall.start.y + dir.y * newLengthMm,
  }
}

export function parseLengthInput(text: string): number | null {
  const trimmed = text.trim().replace(/,/g, '')
  const mMatch = trimmed.match(/^([\d.]+)\s*m$/i)
  if (mMatch) return parseFloat(mMatch[1]) * 1000
  const mmMatch = trimmed.match(/^([\d.]+)\s*mm?$/i)
  if (mmMatch) return parseFloat(mmMatch[1])
  const num = parseFloat(trimmed)
  if (!Number.isFinite(num)) return null
  return num >= 100 ? num : num * 1000
}

export function selectionGrips(wall: Wall): Point2D[] {
  return [wall.start, wall.end, midpoint(wall.start, wall.end)]
}

export function hitTestSelectionDim(
  dims: SelectionTempDim[],
  cursor: Point2D,
  toCanvasFn: (pt: Point2D) => [number, number],
  tolerancePx = 12,
): SelectionTempDim | null {
  const [cx, cy] = toCanvasFn(cursor)
  for (const dim of dims) {
    if (!dim.editable) continue
    const mid = midpoint(dim.startPoint, dim.endPoint)
    const [mx, my] = toCanvasFn(mid)
    if (Math.hypot(cx - mx, cy - my) < tolerancePx) return dim
  }
  return null
}
