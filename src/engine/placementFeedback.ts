import type { Point2D, SnapCandidate, SnapConfig } from './types'
import { constrainAngle, constrainOrthogonal } from './geometry'

export function angleDegrees(start: Point2D, end: Point2D): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI
  if (deg < 0) deg += 360
  return deg
}

export function formatAngleLabel(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360
  const nearCardinal = [0, 90, 180, 270].find((c) => Math.abs(normalized - c) < 0.05)
  if (nearCardinal !== undefined) return `${nearCardinal.toFixed(2)}°`
  return `${normalized.toFixed(2)}°`
}

/** Revit-style tooltip for active snap while placing grids/walls. */
export function placementSnapLabel(
  start: Point2D,
  end: Point2D,
  candidate?: SnapCandidate,
): string | null {
  if (!candidate) return null

  const deg = angleDegrees(start, end)
  const near90 = Math.abs(deg - 90) < 4 || Math.abs(deg - 270) < 4
  const near0 = deg < 4 || Math.abs(deg - 180) < 4

  if (candidate.type === 'parallel' || candidate.type === 'nearest') {
    if (near90) return 'Vertical and Extension'
    if (near0) return 'Horizontal and Extension'
    if (candidate.type === 'parallel') return 'Extension'
  }

  if (candidate.type === 'perpendicular') {
    if (near90) return 'Vertical'
    if (near0) return 'Horizontal'
    return 'Perpendicular'
  }

  const labels: Partial<Record<SnapCandidate['type'], string>> = {
    endpoint: 'Endpoint',
    midpoint: 'Midpoint',
    intersection: 'Intersection',
    'angle-snap': 'Angle',
  }
  return labels[candidate.type] ?? null
}

export function resolveGridPlacementEnd(
  start: Point2D,
  cursor: Point2D,
  options: {
    shiftOrthogonal: boolean
    snapConfig: SnapConfig
    angleSnapEnabled: boolean
  },
): Point2D {
  let end = cursor
  if (options.shiftOrthogonal) {
    return constrainOrthogonal(start, end)
  }
  if (options.angleSnapEnabled && options.snapConfig.angleIncrements.length > 0) {
    end = constrainAngle(start, end, options.snapConfig.angleIncrements)
  }
  return end
}

export function isNearCardinalAngle(start: Point2D, end: Point2D, thresholdDeg = 3): boolean {
  const deg = angleDegrees(start, end)
  return (
    deg < thresholdDeg ||
    Math.abs(deg - 90) < thresholdDeg ||
    Math.abs(deg - 180) < thresholdDeg ||
    Math.abs(deg - 270) < thresholdDeg
  )
}

export function extensionAlignmentLines(
  start: Point2D,
  end: Point2D,
): { start: Point2D; end: Point2D }[] {
  const lines: { start: Point2D; end: Point2D }[] = []
  const extent = 50000
  const deg = angleDegrees(start, end)
  const THRESH = 4

  if (deg < THRESH || Math.abs(deg - 180) < THRESH) {
    lines.push({ start: { x: -extent, y: start.y }, end: { x: extent, y: start.y } })
  }
  if (Math.abs(deg - 90) < THRESH || Math.abs(deg - 270) < THRESH) {
    lines.push({ start: { x: start.x, y: -extent }, end: { x: start.x, y: extent } })
  }
  return lines
}
