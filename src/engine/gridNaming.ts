import type { Point2D, ProjectModel } from './types'

export function isGridVertical(start: Point2D, end: Point2D): boolean {
  const dx = Math.abs(end.x - start.x)
  const dy = Math.abs(end.y - start.y)
  return dy >= dx
}

export function nextGridName(model: ProjectModel, vertical: boolean): string {
  const existing = model.grids.filter((g) => isGridVertical(g.start, g.end) === vertical)
  if (vertical) {
    const letters = existing
      .map((g) => g.name)
      .filter((n) => /^[A-Z]$/.test(n))
      .map((n) => n.charCodeAt(0))
    const next = letters.length > 0 ? Math.max(...letters) + 1 : 65
    return String.fromCharCode(Math.min(next, 90))
  }
  const nums = existing
    .map((g) => parseInt(g.name, 10))
    .filter((n) => !Number.isNaN(n))
  return String((nums.length > 0 ? Math.max(...nums) : 0) + 1)
}

export function extendGridToView(
  start: Point2D,
  end: Point2D,
  viewMin: Point2D,
  viewMax: Point2D,
): { start: Point2D; end: Point2D } {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const len = Math.hypot(dx, dy)
  if (len < 1e-9) return { start, end }
  const dir = { x: dx / len, y: dy / len }
  const margin = 2000

  if (Math.abs(dir.x) > Math.abs(dir.y)) {
    const t0 = (viewMin.x - margin - start.x) / dir.x
    const t1 = (viewMax.x + margin - start.x) / dir.x
    return {
      start: { x: viewMin.x - margin, y: start.y + dir.y * t0 },
      end: { x: viewMax.x + margin, y: start.y + dir.y * t1 },
    }
  }
  if (Math.abs(dir.y) < 1e-9) return { start, end }
  const t0 = (viewMin.y - margin - start.y) / dir.y
  const t1 = (viewMax.y + margin - start.y) / dir.y
  return {
    start: { x: start.x + dir.x * t0, y: viewMin.y - margin },
    end: { x: start.x + dir.x * t1, y: viewMax.y + margin },
  }
}
