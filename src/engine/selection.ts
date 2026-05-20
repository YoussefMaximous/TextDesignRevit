import type { BBox, Point2D, ProjectModel, View } from './types'
import {
  getElevationMarkerBBox,
  getGridBBox,
  getRefPlaneBBox,
  getScopeBoxBBox,
  getViewAnnotationBBox,
  getWorkingSectionBBox,
  isDatumVisibleInView,
  pickElevationMarker,
  pickLineDatum,
  pickScopeBox,
  pickViewCrop,
  pickViewAnnotation,
  pickWorkingSection,
} from './datumGeometry'
import {
  getColumnBBox,
  getFloorBBox,
  getStairBBox,
  pickColumn,
  pickFloor,
  pickStair,
} from './buildingElements'
import { getWallBBox } from './geometry'
import { getLevelLineBBox, pickLevelLine } from '../renderer/levelRenderer'
import type { SpatialItem } from './SpatialIndex'
export interface SelectionFilters {
  walls: boolean
  doors: boolean
  windows: boolean
  grids: boolean
  datums: boolean
  columns: boolean
  floors: boolean
  stairs: boolean
}

export type ElementType =
  | 'wall'
  | 'door'
  | 'window'
  | 'grid'
  | 'reference-plane'
  | 'scope-box'
  | 'elevation-marker'
  | 'working-section'
  | 'view-annotation'
  | 'view-crop'
  | 'column'
  | 'floor'
  | 'stair'
  | 'level'

export interface PickHit {
  elementId: string
  elementType: ElementType
  distance: number
}

function bboxFullyContains(outer: BBox, inner: BBox): boolean {
  return (
    inner.minX >= outer.minX &&
    inner.maxX <= outer.maxX &&
    inner.minY >= outer.minY &&
    inner.maxY <= outer.maxY
  )
}

function bboxIntersects(a: BBox, b: BBox): boolean {
  return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY)
}

function elementBBox(
  model: ProjectModel,
  item: SpatialItem,
): BBox | null {
  if (item.elementType === 'wall') {
    const wall = model.walls.find((w) => w.id === item.elementId)
    return wall ? getWallBBox(wall) : null
  }
  if (item.elementType === 'grid') {
    const grid = model.grids.find((g) => g.id === item.elementId)
    return grid ? getGridBBox(grid) : null
  }
  if (item.elementType === 'reference-plane') {
    const rp = model.referencePlanes.find((r) => r.id === item.elementId)
    return rp ? getRefPlaneBBox(rp) : null
  }
  if (item.elementType === 'scope-box') {
    const sb = model.scopeBoxes.find((s) => s.id === item.elementId)
    return sb ? getScopeBoxBBox(sb) : null
  }
  if (item.elementType === 'elevation-marker') {
    const em = model.elevationMarkers.find((e) => e.id === item.elementId)
    return em ? getElevationMarkerBBox(em) : null
  }
  if (item.elementType === 'working-section') {
    const ws = model.workingSections?.find((w) => w.id === item.elementId)
    return ws ? getWorkingSectionBBox(ws) : null
  }
  if (item.elementType === 'view-annotation') {
    const ann = model.viewAnnotations?.find((a) => a.id === item.elementId)
    return ann ? getViewAnnotationBBox(ann) : null
  }
  if (item.elementType === 'column') {
    const col = model.columns.find((c) => c.id === item.elementId)
    return col ? getColumnBBox(col) : null
  }
  if (item.elementType === 'floor') {
    const floor = model.floors?.find((f) => f.id === item.elementId)
    return floor ? getFloorBBox(floor) : null
  }
  if (item.elementType === 'stair') {
    const stair = model.stairs?.find((s) => s.id === item.elementId)
    return stair ? getStairBBox(stair) : null
  }
  if (item.elementType === 'level') {
    const level = model.levels.find((l) => l.id === item.elementId)
    return level ? getLevelLineBBox(level) : null
  }
  if (item.elementType === 'door' || item.elementType === 'window') {
    const wallId =
      item.elementType === 'door'
        ? model.doors.find((d) => d.id === item.elementId)?.hostWallId
        : model.windows.find((w) => w.id === item.elementId)?.hostWallId
    const wall = model.walls.find((w) => w.id === wallId)
    return wall ? getWallBBox(wall) : null
  }
  return null
}

function pickLevelsAtPoint(model: ProjectModel, point: Point2D, view?: View): PickHit[] {
  if (view?.type !== 'floor-plan') return []
  const hits: PickHit[] = []
  for (const level of model.levels) {
    const h = pickLevelLine(point, level)
    if (h) hits.push(h)
  }
  return hits
}

function pickDatumsAtPoint(model: ProjectModel, point: Point2D, view?: View): PickHit[] {
  const hits: PickHit[] = []

  if (view?.cropRegion) {
    const cropHit = pickViewCrop(point, view)
    if (cropHit) hits.push(cropHit)
  }

  for (const em of model.elevationMarkers) {
    if (!isDatumVisibleInView(em.scopeBoxId, view)) continue
    const h = pickElevationMarker(point, em)
    if (h) hits.push(h)
  }

  for (const ws of model.workingSections ?? []) {
    if (!isDatumVisibleInView(ws.scopeBoxId, view)) continue
    const h = pickWorkingSection(point, ws)
    if (h) hits.push(h)
  }

  if (view) {
    for (const ann of model.viewAnnotations ?? []) {
      if (ann.viewId !== view.id) continue
      const h = pickViewAnnotation(point, ann)
      if (h) hits.push(h)
    }
  }

  for (const grid of model.grids) {
    if (!isDatumVisibleInView(grid.scopeBoxId, view)) continue
    const h = pickLineDatum(point, grid.id, 'grid', grid.start, grid.end)
    if (h) hits.push(h)
  }

  for (const rp of model.referencePlanes) {
    if (!isDatumVisibleInView(rp.scopeBoxId, view)) continue
    const h = pickLineDatum(point, rp.id, 'reference-plane', rp.start, rp.end)
    if (h) hits.push(h)
  }

  for (const sb of model.scopeBoxes) {
    const h = pickScopeBox(point, sb)
    if (h) hits.push(h)
  }

  return hits
}

const DATUM_TYPES = new Set<ElementType>([
  'grid',
  'reference-plane',
  'scope-box',
  'elevation-marker',
  'working-section',
  'view-annotation',
  'view-crop',
  'level',
])

export function applySelectionFilters(
  hits: PickHit[],
  filters: SelectionFilters,
): PickHit[] {
  return hits.filter((h) => {
    if (h.elementType === 'wall') return filters.walls
    if (h.elementType === 'door') return filters.doors
    if (h.elementType === 'window') return filters.windows
    if (h.elementType === 'grid') return filters.grids
    if (h.elementType === 'column') return filters.columns
    if (h.elementType === 'floor') return filters.floors
    if (h.elementType === 'stair') return filters.stairs
    if (DATUM_TYPES.has(h.elementType)) return filters.datums
    return true
  })
}

export function pickAtPoint(
  model: ProjectModel,
  nearby: SpatialItem[],
  point: Point2D,
  activeView?: View,
  filters?: SelectionFilters,
): PickHit[] {
  const hits: PickHit[] = []

  for (const item of nearby) {
    const bbox = elementBBox(model, item)
    if (!bbox) continue
    if (
      item.elementType === 'wall' ||
      item.elementType === 'door' ||
      item.elementType === 'window'
    ) {
      if (
        point.x >= bbox.minX &&
        point.x <= bbox.maxX &&
        point.y >= bbox.minY &&
        point.y <= bbox.maxY
      ) {
        const cx = (bbox.minX + bbox.maxX) / 2
        const cy = (bbox.minY + bbox.maxY) / 2
        hits.push({
          elementId: item.elementId,
          elementType: item.elementType as ElementType,
          distance: Math.hypot(point.x - cx, point.y - cy),
        })
      }
    }
  }

  for (const col of model.columns) {
    const h = pickColumn(point, col)
    if (h) hits.push(h)
  }
  for (const floor of model.floors ?? []) {
    const h = pickFloor(point, floor)
    if (h) hits.push(h)
  }
  for (const stair of model.stairs ?? []) {
    const h = pickStair(point, stair)
    if (h) hits.push(h)
  }

  hits.push(...pickLevelsAtPoint(model, point, activeView))
  hits.push(...pickDatumsAtPoint(model, point, activeView))
  hits.sort((a, b) => a.distance - b.distance)
  return filters ? applySelectionFilters(hits, filters) : hits
}

export function selectInBox(
  model: ProjectModel,
  items: SpatialItem[],
  box: BBox,
  crossing: boolean,
  activeView?: View,
): string[] {
  const ids: string[] = []
  for (const item of items) {
    const bbox = elementBBox(model, item)
    if (!bbox) continue
    const match = crossing ? bboxIntersects(box, bbox) : bboxFullyContains(box, bbox)
    if (match) ids.push(item.elementId)
  }

  for (const sb of model.scopeBoxes) {
    const bbox = getScopeBoxBBox(sb)
    const match = crossing ? bboxIntersects(box, bbox) : bboxFullyContains(box, bbox)
    if (match) ids.push(sb.id)
  }

  for (const em of model.elevationMarkers) {
    if (!isDatumVisibleInView(em.scopeBoxId, activeView)) continue
    const bbox = getElevationMarkerBBox(em)
    const match = crossing ? bboxIntersects(box, bbox) : bboxFullyContains(box, bbox)
    if (match) ids.push(em.id)
  }

  for (const ws of model.workingSections ?? []) {
    if (!isDatumVisibleInView(ws.scopeBoxId, activeView)) continue
    const bbox = getWorkingSectionBBox(ws)
    const match = crossing ? bboxIntersects(box, bbox) : bboxFullyContains(box, bbox)
    if (match) ids.push(ws.id)
  }

  if (activeView) {
    for (const ann of model.viewAnnotations ?? []) {
      if (ann.viewId !== activeView.id) continue
      const bbox = getViewAnnotationBBox(ann)
      const match = crossing ? bboxIntersects(box, bbox) : bboxFullyContains(box, bbox)
      if (match) ids.push(ann.id)
    }
  }

  for (const rp of model.referencePlanes) {
    if (!isDatumVisibleInView(rp.scopeBoxId, activeView)) continue
    const bbox = getRefPlaneBBox(rp)
    const match = crossing ? bboxIntersects(box, bbox) : bboxFullyContains(box, bbox)
    if (match) ids.push(rp.id)
  }

  for (const grid of model.grids) {
    if (!isDatumVisibleInView(grid.scopeBoxId, activeView)) continue
    const bbox = getGridBBox(grid)
    const match = crossing ? bboxIntersects(box, bbox) : bboxFullyContains(box, bbox)
    if (match) ids.push(grid.id)
  }

  for (const col of model.columns) {
    const bbox = getColumnBBox(col)
    const match = crossing ? bboxIntersects(box, bbox) : bboxFullyContains(box, bbox)
    if (match) ids.push(col.id)
  }

  for (const floor of model.floors ?? []) {
    const bbox = getFloorBBox(floor)
    const match = crossing ? bboxIntersects(box, bbox) : bboxFullyContains(box, bbox)
    if (match) ids.push(floor.id)
  }

  for (const stair of model.stairs ?? []) {
    const bbox = getStairBBox(stair)
    const match = crossing ? bboxIntersects(box, bbox) : bboxFullyContains(box, bbox)
    if (match) ids.push(stair.id)
  }

  if (activeView?.type === 'floor-plan') {
    for (const level of model.levels) {
      if (level.planLineY === undefined) continue
      const bbox = getLevelLineBBox(level)
      const match = crossing ? bboxIntersects(box, bbox) : bboxFullyContains(box, bbox)
      if (match) ids.push(level.id)
    }
  }

  return ids
}

export function modelBoxFromScreen(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  toModelFn: (cx: number, cy: number) => Point2D,
): BBox {
  const p1 = toModelFn(x1, y1)
  const p2 = toModelFn(x2, y2)
  return {
    minX: Math.min(p1.x, p2.x),
    minY: Math.min(p1.y, p2.y),
    maxX: Math.max(p1.x, p2.x),
    maxY: Math.max(p1.y, p2.y),
  }
}
