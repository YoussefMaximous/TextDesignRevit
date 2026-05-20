import type { Point2D, ProjectModel, Wall } from './types'
import { distance, getWallBBox, wallLength } from './geometry'

const CELL_MM = 150

function cellKey(ix: number, iy: number): string {
  return `${ix},${iy}`
}

function wallBlocksCell(wall: Wall, ix: number, iy: number): boolean {
  const cx = ix * CELL_MM + CELL_MM / 2
  const cy = iy * CELL_MM + CELL_MM / 2
  const pt = { x: cx, y: cy }
  const len = wallLength(wall)
  if (len < 1) return false
  const ab = { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y }
  const len2 = ab.x * ab.x + ab.y * ab.y
  const t = Math.max(
    0,
    Math.min(1, ((pt.x - wall.start.x) * ab.x + (pt.y - wall.start.y) * ab.y) / len2),
  )
  const proj = { x: wall.start.x + ab.x * t, y: wall.start.y + ab.y * t }
  const dist = distance(pt, proj)
  return dist < wall.thickness / 2 + CELL_MM * 0.4
}

function polygonArea(pts: Point2D[]): number {
  let sum = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    sum += pts[i].x * pts[j].y - pts[j].x * pts[i].y
  }
  return Math.abs(sum) / 2
}

export interface RoomDetectionResult {
  boundaryWallIds: string[]
  area: number
  perimeter: number
  tagPosition: Point2D
  polygon: Point2D[]
}

export function detectRoomAtPoint(
  model: ProjectModel,
  point: Point2D,
  levelId: string,
): RoomDetectionResult | null {
  const walls = model.walls.filter((w) => w.levelId === levelId)
  if (walls.length < 3) return null

  const startIx = Math.floor(point.x / CELL_MM)
  const startIy = Math.floor(point.y / CELL_MM)
  const maxCells = 8000

  const isBlocked = (ix: number, iy: number): boolean => {
    for (const wall of walls) {
      if (wallBlocksCell(wall, ix, iy)) return true
    }
    return false
  }

  if (isBlocked(startIx, startIy)) return null

  const visited = new Set<string>()
  const queue: [number, number][] = [[startIx, startIy]]
  visited.add(cellKey(startIx, startIy))

  let minIx = startIx
  let maxIx = startIx
  let minIy = startIy
  let maxIy = startIy

  while (queue.length > 0 && visited.size < maxCells) {
    const [ix, iy] = queue.shift()!
    minIx = Math.min(minIx, ix)
    maxIx = Math.max(maxIx, ix)
    minIy = Math.min(minIy, iy)
    maxIy = Math.max(maxIy, iy)

    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = ix + dx
      const ny = iy + dy
      const key = cellKey(nx, ny)
      if (visited.has(key)) continue
      if (isBlocked(nx, ny)) continue
      visited.add(key)
      queue.push([nx, ny])
    }
  }

  if (visited.size < 4) return null

  let touchesOpen = false
  for (const key of visited) {
    const [ix, iy] = key.split(',').map(Number)
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = ix + dx
      const ny = iy + dy
      if (!visited.has(cellKey(nx, ny)) && !isBlocked(nx, ny)) {
        touchesOpen = true
        break
      }
    }
    if (touchesOpen) break
  }

  if (touchesOpen) return null

  let sumX = 0
  let sumY = 0
  for (const key of visited) {
    const [ix, iy] = key.split(',').map(Number)
    sumX += ix * CELL_MM + CELL_MM / 2
    sumY += iy * CELL_MM + CELL_MM / 2
  }
  const tagPosition = {
    x: sumX / visited.size,
    y: sumY / visited.size,
  }

  const boundaryWallIds: string[] = []
  for (const wall of walls) {
    const bbox = getWallBBox(wall)
    if (
      bbox.maxX >= minIx * CELL_MM &&
      bbox.minX <= (maxIx + 1) * CELL_MM &&
      bbox.maxY >= minIy * CELL_MM &&
      bbox.minY <= (maxIy + 1) * CELL_MM
    ) {
      boundaryWallIds.push(wall.id)
    }
  }

  if (boundaryWallIds.length < 3) return null

  const polygon: Point2D[] = [
    { x: minIx * CELL_MM, y: minIy * CELL_MM },
    { x: (maxIx + 1) * CELL_MM, y: minIy * CELL_MM },
    { x: (maxIx + 1) * CELL_MM, y: (maxIy + 1) * CELL_MM },
    { x: minIx * CELL_MM, y: (maxIy + 1) * CELL_MM },
  ]

  const areaMm2 = visited.size * CELL_MM * CELL_MM
  const area = areaMm2 / 1_000_000
  const perimeter = polygonArea(polygon) > 0 ? polygon.reduce((p, pt, i) => {
    const n = polygon[(i + 1) % polygon.length]
    return p + distance(pt, n)
  }, 0) : 0

  return {
    boundaryWallIds,
    area,
    perimeter,
    tagPosition,
    polygon,
  }
}

export function nextRoomNumber(model: ProjectModel): string {
  const nums = model.rooms
    .map((r) => parseInt(r.number, 10))
    .filter((n) => !Number.isNaN(n))
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return String(next)
}
