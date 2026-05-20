import type {
  Point2D,
  ProjectModel,
  SnapCandidate,
  SnapConfig,
  SnapResult,
  SnapType,
  ToolState,
} from './types'
import { distanceToSegment } from './datumGeometry'
import {
  distance,
  midpoint,
  normalize,
  nearestPointOnWall,
  perpendicular,
  projectPointOnSegment,
  segmentIntersects,
} from './geometry'
import type { SpatialItem } from './SpatialIndex'
import type { ViewTransform } from '../renderer/transform'

const SNAP_PRIORITY: Record<SnapType, number> = {
  endpoint: 1,
  intersection: 2,
  midpoint: 3,
  center: 4,
  perpendicular: 5,
  parallel: 6,
  tangent: 7,
  quadrant: 8,
  nearest: 9,
  'workplane-grid': 10,
  'length-snap': 11,
  'angle-snap': 12,
}

const TOLERANCE_PX = 10

function pushCandidate(
  candidates: SnapCandidate[],
  point: Point2D,
  type: SnapType,
  cursor: Point2D,
  tx: ViewTransform,
  elementId?: string,
): void {
  const [cx, cy] = [
    tx.originX + point.x * tx.scale,
    tx.originY - point.y * tx.scale,
  ]
  const [px, py] = [
    tx.originX + cursor.x * tx.scale,
    tx.originY - cursor.y * tx.scale,
  ]
  const distPx = Math.hypot(cx - px, cy - py)
  if (distPx <= TOLERANCE_PX) {
    candidates.push({ point, type, elementId, distance: distPx })
  }
}

export function resolveSnap(
  cursorModel: Point2D,
  model: ProjectModel,
  nearbyItems: SpatialItem[],
  tx: ViewTransform,
  config: SnapConfig,
  toolState: ToolState,
): SnapResult {
  const toleranceMM = TOLERANCE_PX / tx.scale
  const candidates: SnapCandidate[] = []

  for (const item of nearbyItems) {
    if (item.elementType === 'wall') {
      const wall = model.walls.find((w) => w.id === item.elementId)
      if (!wall) continue

      if (config.endpoints) {
        pushCandidate(candidates, wall.start, 'endpoint', cursorModel, tx, wall.id)
        pushCandidate(candidates, wall.end, 'endpoint', cursorModel, tx, wall.id)
      }

      if (config.midpoints) {
        pushCandidate(
          candidates,
          midpoint(wall.start, wall.end),
          'midpoint',
          cursorModel,
          tx,
          wall.id,
        )
      }

      if (config.nearest) {
        const nearest = nearestPointOnWall(wall, cursorModel)
        if (distance(nearest, cursorModel) <= toleranceMM) {
          pushCandidate(candidates, nearest, 'nearest', cursorModel, tx, wall.id)
        }
      }

      if (toolState.drawingStart && config.perpendicular) {
        const perp = projectPointOnSegment(cursorModel, wall.start, wall.end)
        if (distance(perp.point, cursorModel) <= toleranceMM) {
          pushCandidate(candidates, perp.point, 'perpendicular', cursorModel, tx, wall.id)
        }
      }
    }

    if (item.elementType === 'grid') {
      const grid = model.grids.find((g) => g.id === item.elementId)
      if (!grid) continue
      if (config.endpoints) {
        pushCandidate(candidates, grid.start, 'endpoint', cursorModel, tx, grid.id)
        pushCandidate(candidates, grid.end, 'endpoint', cursorModel, tx, grid.id)
      }
      if (config.nearest && distanceToSegment(cursorModel, grid.start, grid.end) <= toleranceMM) {
        const mid = midpoint(grid.start, grid.end)
        pushCandidate(candidates, mid, 'nearest', cursorModel, tx, grid.id)
      }
    }

    if (item.elementType === 'reference-plane') {
      const rp = model.referencePlanes.find((r) => r.id === item.elementId)
      if (!rp) continue
      if (config.nearest && distanceToSegment(cursorModel, rp.start, rp.end) <= toleranceMM) {
        const dx = rp.end.x - rp.start.x
        const dy = rp.end.y - rp.start.y
        const lenSq = dx * dx + dy * dy
        const t = Math.max(
          0,
          Math.min(1, ((cursorModel.x - rp.start.x) * dx + (cursorModel.y - rp.start.y) * dy) / lenSq),
        )
        const pt = { x: rp.start.x + t * dx, y: rp.start.y + t * dy }
        pushCandidate(candidates, pt, 'nearest', cursorModel, tx, rp.id)
      }
      if (config.endpoints) {
        pushCandidate(candidates, rp.start, 'endpoint', cursorModel, tx, rp.id)
        pushCandidate(candidates, rp.end, 'endpoint', cursorModel, tx, rp.id)
      }
    }
  }

  if (toolState.drawingStart && config.intersections) {
    for (const wall of model.walls) {
      const hit = segmentIntersects(
        toolState.drawingStart,
        cursorModel,
        wall.start,
        wall.end,
      )
      if (hit) {
        pushCandidate(candidates, hit, 'intersection', cursorModel, tx, wall.id)
      }
    }
  }

  if (toolState.drawingStart) {
    const start = toolState.drawingStart
    const extendDist = 1e7

    const addParallelExtension = (a: Point2D, b: Point2D, elementId: string) => {
      const dir = normalize({ x: b.x - a.x, y: b.y - a.y })
      const far = { x: start.x + dir.x * extendDist, y: start.y + dir.y * extendDist }
      const proj = projectPointOnSegment(cursorModel, start, far)
      if (distance(proj.point, cursorModel) <= toleranceMM) {
        pushCandidate(candidates, proj.point, 'parallel', cursorModel, tx, elementId)
      }
      const perpDir = perpendicular(dir)
      const farPerp = {
        x: start.x + perpDir.x * extendDist,
        y: start.y + perpDir.y * extendDist,
      }
      const projPerp = projectPointOnSegment(cursorModel, start, farPerp)
      if (distance(projPerp.point, cursorModel) <= toleranceMM) {
        pushCandidate(candidates, projPerp.point, 'perpendicular', cursorModel, tx, elementId)
      }
    }

    for (const rp of model.referencePlanes) {
      addParallelExtension(rp.start, rp.end, rp.id)
    }
    for (const grid of model.grids) {
      addParallelExtension(grid.start, grid.end, grid.id)
    }
    for (const ws of model.workingSections ?? []) {
      addParallelExtension(ws.start, ws.end, ws.id)
    }
  }

  if (candidates.length === 0) {
    return { snapped: false, point: cursorModel }
  }

  candidates.sort((a, b) => {
    const priorityDiff = SNAP_PRIORITY[a.type] - SNAP_PRIORITY[b.type]
    if (priorityDiff !== 0) return priorityDiff
    return a.distance - b.distance
  })

  return {
    snapped: true,
    point: candidates[0].point,
    candidate: candidates[0],
  }
}
