import type { ProjectModel } from '../engine/types'
import { getWallBBox } from '../engine/geometry'

export type ASCIIMode = 'dense' | 'lightweight' | 'training' | 'symbolic'

export interface ASCIIEngineOptions {
  mode: ASCIIMode
  cellSizeMm: number
  width: number
  height: number
}

export interface ASCIIEngineResult {
  text: string
  lines: number
  chars: number
  tokens: number
}

function charForMode(mode: ASCIIMode, base: string): string {
  switch (mode) {
    case 'lightweight':
      return base === '#' ? '|' : base === '+' ? '.' : ' '
    case 'training':
      return base === '#' ? 'WALL' : base === '+' ? 'GRID' : '.'
    case 'symbolic':
      return base === '#' ? '█' : base === '+' ? '┼' : '·'
    default:
      return base
  }
}

/**
 * Isolated ASCII export — reads geometry model only.
 */
export function runASCIIEngine(
  model: ProjectModel,
  options: ASCIIEngineOptions,
): ASCIIEngineResult {
  const { mode, cellSizeMm, width, height } = options
  const grid: string[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ' '),
  )

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const wall of model.walls) {
    const b = getWallBBox(wall)
    minX = Math.min(minX, b.minX)
    minY = Math.min(minY, b.minY)
    maxX = Math.max(maxX, b.maxX)
    maxY = Math.max(maxY, b.maxY)
  }
  if (!Number.isFinite(minX)) {
    minX = 0
    minY = 0
    maxX = width * cellSizeMm
    maxY = height * cellSizeMm
  }
  const pad = cellSizeMm

  const toCell = (x: number, y: number): [number, number] => {
    const cx = Math.floor((x - minX + pad) / cellSizeMm)
    const cy = Math.floor((maxY + pad - y) / cellSizeMm)
    return [cx, cy]
  }

  const stamp = (x: number, y: number, ch: string) => {
    const [gx, gy] = toCell(x, y)
    if (gy >= 0 && gy < height && gx >= 0 && gx < width) {
      const c = charForMode(mode, ch)
      if (mode === 'training' && c.length > 1) {
        grid[gy][gx] = 'W'
      } else {
        grid[gy][gx] = c[0] ?? ' '
      }
    }
  }

  const fillLine = (a: { x: number; y: number }, b: { x: number; y: number }, ch: string) => {
    const steps = Math.max(
      Math.abs(Math.round((b.x - a.x) / cellSizeMm)),
      Math.abs(Math.round((b.y - a.y) / cellSizeMm)),
      1,
    )
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      stamp(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, ch)
    }
  }

  for (const wall of model.walls) {
    fillLine(wall.start, wall.end, '#')
  }
  for (const g of model.grids) {
    fillLine(g.start, g.end, '+')
  }
  for (const door of model.doors) {
    const wall = model.walls.find((w) => w.id === door.hostWallId)
    if (wall) {
      const mid = {
        x: wall.start.x + (wall.end.x - wall.start.x) * 0.5,
        y: wall.start.y + (wall.end.y - wall.start.y) * 0.5,
      }
      stamp(mid.x, mid.y, 'D')
    }
  }

  const text =
    mode === 'symbolic'
      ? grid.map((row) => row.join('')).join('\n')
      : grid.map((row) => row.join('')).join('\n')

  const chars = text.replace(/\n/g, '').replace(/ /g, '').length
  return { text, lines: grid.length, chars, tokens: Math.ceil(chars / 4) }
}
