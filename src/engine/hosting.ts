import type { Door, Point2D, ProjectModel, Wall, Window } from './types'
import {
  distance,
  nearestPointOnWall,
  projectPointOnSegment,
  wallLength,
} from './geometry'

export interface WallHostHit {
  wall: Wall
  offsetFromStart: number
  distance: number
}

export function offsetOnWall(wall: Wall, point: Point2D): number {
  const { t } = projectPointOnSegment(point, wall.start, wall.end)
  return t * wallLength(wall)
}

export function findHostWall(
  model: ProjectModel,
  point: Point2D,
  toleranceMM: number,
  levelId?: string,
): WallHostHit | null {
  let best: WallHostHit | null = null

  for (const wall of model.walls) {
    if (levelId && wall.levelId !== levelId) continue
    const nearest = nearestPointOnWall(wall, point)
    const dist = distance(nearest, point)
    if (dist > toleranceMM + wall.thickness / 2) continue

    const offset = offsetOnWall(wall, nearest)
    const hit: WallHostHit = { wall, offsetFromStart: offset, distance: dist }
    if (!best || dist < best.distance) best = hit
  }

  return best
}

export function clampDoorOffset(wall: Wall, doorWidth: number, offset: number): number {
  const len = wallLength(wall)
  const margin = doorWidth / 2 + 50
  return Math.max(margin, Math.min(len - margin, offset))
}

export function clampWindowOffset(wall: Wall, winWidth: number, offset: number): number {
  return clampDoorOffset(wall, winWidth, offset)
}

export function createDoorOnWall(
  wall: Wall,
  offsetFromStart: number,
  typeId: string,
  handedness: 'left' | 'right',
  defaults: { width: number; height: number },
): Door {
  const offset = clampDoorOffset(wall, defaults.width, offsetFromStart)
  return {
    id: '',
    typeId,
    levelId: wall.levelId,
    hostWallId: wall.id,
    offsetFromStart: offset,
    width: defaults.width,
    height: defaults.height,
    handedness,
    swingAngle: 90,
    sillHeight: 0,
  }
}

export function createWindowOnWall(
  wall: Wall,
  offsetFromStart: number,
  typeId: string,
  defaults: { width: number; height: number; sillHeight: number },
): Window {
  const offset = clampWindowOffset(wall, defaults.width, offsetFromStart)
  return {
    id: '',
    typeId,
    levelId: wall.levelId,
    hostWallId: wall.id,
    offsetFromStart: offset,
    width: defaults.width,
    height: defaults.height,
    sillHeight: defaults.sillHeight,
  }
}
