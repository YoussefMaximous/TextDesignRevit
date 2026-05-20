import { getLandingBBox, getScopeBoxBBox } from './datumGeometry'
import type { BBox, Door, Grid, Point2D, ProjectModel, Wall, WallType, Window } from './types'

export function distance(a: Point2D, b: Point2D): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.hypot(dx, dy)
}

export function midpoint(a: Point2D, b: Point2D): Point2D {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export function normalize(v: Point2D): Point2D {
  const len = Math.hypot(v.x, v.y)
  if (len < 1e-9) return { x: 1, y: 0 }
  return { x: v.x / len, y: v.y / len }
}

export function perpendicular(dir: Point2D): Point2D {
  return { x: -dir.y, y: dir.x }
}

export function wallDirection(wall: Wall): Point2D {
  return normalize({ x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y })
}

export function getWallCorners(wall: Wall): [Point2D, Point2D, Point2D, Point2D] {
  const dir = wallDirection(wall)
  const normal = perpendicular(dir)
  const half = wall.thickness / 2
  const offset = { x: normal.x * half, y: normal.y * half }
  return [
    { x: wall.start.x + offset.x, y: wall.start.y + offset.y },
    { x: wall.end.x + offset.x, y: wall.end.y + offset.y },
    { x: wall.end.x - offset.x, y: wall.end.y - offset.y },
    { x: wall.start.x - offset.x, y: wall.start.y - offset.y },
  ]
}

export function getWallBBox(wall: Wall): BBox {
  const corners = getWallCorners(wall)
  const xs = corners.map((c) => c.x)
  const ys = corners.map((c) => c.y)
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  }
}

export function getGridBBox(grid: Grid): BBox {
  return {
    minX: Math.min(grid.start.x, grid.end.x),
    minY: Math.min(grid.start.y, grid.end.y),
    maxX: Math.max(grid.start.x, grid.end.x),
    maxY: Math.max(grid.start.y, grid.end.y),
  }
}

export function projectPointOnSegment(
  p: Point2D,
  a: Point2D,
  b: Point2D,
): { point: Point2D; t: number } {
  const ab = { x: b.x - a.x, y: b.y - a.y }
  const len2 = ab.x * ab.x + ab.y * ab.y
  if (len2 < 1e-9) return { point: { ...a }, t: 0 }
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / len2),
  )
  return {
    point: { x: a.x + ab.x * t, y: a.y + ab.y * t },
    t,
  }
}

export function nearestPointOnWall(wall: Wall, p: Point2D): Point2D {
  return projectPointOnSegment(p, wall.start, wall.end).point
}

export function wallLength(wall: Wall): number {
  return distance(wall.start, wall.end)
}

export function doorCenterOnWall(wall: Wall, door: Door): Point2D {
  const dir = wallDirection(wall)
  return {
    x: wall.start.x + dir.x * door.offsetFromStart,
    y: wall.start.y + dir.y * door.offsetFromStart,
  }
}

export function formatLength(mm: number): string {
  if (mm >= 1000) {
    const m = mm / 1000
    return m % 1 === 0 ? `${m} m` : `${m.toFixed(2)} m`
  }
  return `${Math.round(mm)} mm`
}

export function constrainOrthogonal(
  start: Point2D,
  cursor: Point2D,
): Point2D {
  const dx = cursor.x - start.x
  const dy = cursor.y - start.y
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: cursor.x, y: start.y }
  }
  return { x: start.x, y: cursor.y }
}

export function constrainAngle(
  start: Point2D,
  cursor: Point2D,
  increments: number[],
): Point2D {
  const dx = cursor.x - start.x
  const dy = cursor.y - start.y
  const len = Math.hypot(dx, dy)
  if (len < 1e-9) return cursor
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI
  if (angle < 0) angle += 360
  let best = increments[0] ?? 90
  let bestDiff = 360
  for (const inc of increments) {
    const snapped = Math.round(angle / inc) * inc
    const diff = Math.abs(angle - snapped)
    if (diff < bestDiff) {
      bestDiff = diff
      best = snapped
    }
  }
  const rad = (best * Math.PI) / 180
  return {
    x: start.x + Math.cos(rad) * len,
    y: start.y + Math.sin(rad) * len,
  }
}

export function pointAtDistance(start: Point2D, end: Point2D, dist: number): Point2D {
  const dir = normalize({ x: end.x - start.x, y: end.y - start.y })
  return { x: start.x + dir.x * dist, y: start.y + dir.y * dist }
}

export function getModelBBox(model: ProjectModel): BBox | null {
  const boxes: BBox[] = []
  for (const wall of model.walls) boxes.push(getWallBBox(wall))
  for (const grid of model.grids) boxes.push(getGridBBox(grid))
  for (const sb of model.scopeBoxes ?? []) boxes.push(getScopeBoxBBox(sb))
  const view = model.views.find((v) => v.id === model.activeViewId)
  if (view?.type === 'floor-plan' && view.cropRegion) {
    return { ...view.cropRegion }
  }
  if (view?.cropRegion) boxes.push(view.cropRegion)
  if (boxes.length === 0) {
    if (view?.type === 'floor-plan') return getLandingBBox()
    return null
  }
  return {
    minX: Math.min(...boxes.map((b) => b.minX)),
    minY: Math.min(...boxes.map((b) => b.minY)),
    maxX: Math.max(...boxes.map((b) => b.maxX)),
    maxY: Math.max(...boxes.map((b) => b.maxY)),
  }
}

export function getWallType(model: ProjectModel, typeId: string): WallType | undefined {
  return model.wallTypes.find((t) => t.id === typeId)
}

export function getDoorsOnWall(model: ProjectModel, wallId: string): Door[] {
  return model.doors.filter((d) => d.hostWallId === wallId)
}

export function getWindowsOnWall(model: ProjectModel, wallId: string): Window[] {
  return model.windows.filter((w) => w.hostWallId === wallId)
}

export function segmentIntersects(
  a1: Point2D,
  a2: Point2D,
  b1: Point2D,
  b2: Point2D,
): Point2D | null {
  const d1x = a2.x - a1.x
  const d1y = a2.y - a1.y
  const d2x = b2.x - b1.x
  const d2y = b2.y - b1.y
  const denom = d1x * d2y - d1y * d2x
  if (Math.abs(denom) < 1e-9) return null
  const t = ((b1.x - a1.x) * d2y - (b1.y - a1.y) * d2x) / denom
  const u = ((b1.x - a1.x) * d1y - (b1.y - a1.y) * d1x) / denom
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: a1.x + t * d1x, y: a1.y + t * d1y }
  }
  return null
}
