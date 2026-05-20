import type { BBox, Column, Floor, Point2D, ProjectModel, Stair } from './types'
import { distance } from './geometry'

export const DEFAULT_COLUMN_SIZE = 450
export const DEFAULT_STAIR_WIDTH = 1200
export const DEFAULT_STAIR_DEPTH = 3000

export function getColumnBBox(col: Column, pad = 80): BBox {
  const hw = col.width / 2
  const hd = col.depth / 2
  return {
    minX: col.position.x - hw - pad,
    minY: col.position.y - hd - pad,
    maxX: col.position.x + hw + pad,
    maxY: col.position.y + hd + pad,
  }
}

export function getFloorBBox(floor: Floor, pad = 50): BBox {
  return {
    minX: floor.minX - pad,
    minY: floor.minY - pad,
    maxX: floor.maxX + pad,
    maxY: floor.maxY + pad,
  }
}

export function getStairBBox(stair: Stair, pad = 80): BBox {
  const hw = stair.width / 2
  const hd = stair.depth / 2
  return {
    minX: stair.position.x - hw - pad,
    minY: stair.position.y - hd - pad,
    maxX: stair.position.x + hw + pad,
    maxY: stair.position.y + hd + pad,
  }
}

export function pickColumn(
  point: Point2D,
  col: Column,
): { elementId: string; elementType: 'column'; distance: number } | null {
  const hw = col.width / 2
  const hd = col.depth / 2
  const inside =
    point.x >= col.position.x - hw &&
    point.x <= col.position.x + hw &&
    point.y >= col.position.y - hd &&
    point.y <= col.position.y + hd
  if (!inside) return null
  return {
    elementId: col.id,
    elementType: 'column',
    distance: distance(point, col.position),
  }
}

export function pickFloor(
  point: Point2D,
  floor: Floor,
): { elementId: string; elementType: 'floor'; distance: number } | null {
  const inside =
    point.x >= floor.minX &&
    point.x <= floor.maxX &&
    point.y >= floor.minY &&
    point.y <= floor.maxY
  if (!inside) return null
  const cx = (floor.minX + floor.maxX) / 2
  const cy = (floor.minY + floor.maxY) / 2
  return {
    elementId: floor.id,
    elementType: 'floor',
    distance: distance(point, { x: cx, y: cy }),
  }
}

export function pickStair(
  point: Point2D,
  stair: Stair,
): { elementId: string; elementType: 'stair'; distance: number } | null {
  const hw = stair.width / 2
  const hd = stair.depth / 2
  const inside =
    point.x >= stair.position.x - hw &&
    point.x <= stair.position.x + hw &&
    point.y >= stair.position.y - hd &&
    point.y <= stair.position.y + hd
  if (!inside) return null
  return {
    elementId: stair.id,
    elementType: 'stair',
    distance: distance(point, stair.position),
  }
}

export function rectFromPoints(a: Point2D, b: Point2D): Pick<Floor, 'minX' | 'minY' | 'maxX' | 'maxY'> {
  return {
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
  }
}

export function floorFromPoints(
  start: Point2D,
  end: Point2D,
  levelId: string,
  id: string,
): Floor {
  return { id, levelId, ...rectFromPoints(start, end) }
}

export function nextColumnName(model: ProjectModel): string {
  return `C${model.columns.length + 1}`
}

export function nextStairName(model: ProjectModel): string {
  return `Stair ${model.stairs.length + 1}`
}
