import type {
  BBox,
  ElevationDirection,
  ElevationMarker,
  Grid,
  Point2D,
  ProjectModel,
  ReferencePlane,
  ScopeBox,
  View,
  WorkingSection,
} from './types'
import { distance } from './geometry'
import { generateId } from '../utils/id'

import {
  REVIT_ANNOTATION_BOX,
  REVIT_CROP_BOX,
  REVIT_ELEVATION_OUTWARD,
  REVIT_SCOPE_BOX,
  REVIT_SCOPE_CENTER,
  REVIT_SCOPE_ID,
  REVIT_SECTION_END_INSET,
  REVIT_VIEW_FP_ID,
  revitNorthArrowPosition,
  revitScaleBarPosition,
  revitWorkingSectionY,
} from './revitLandingLayout'
import type { ViewAnnotation } from './types'

export const LANDING_FLOOR_PLAN_BOX = REVIT_CROP_BOX
export const LANDING_SCOPE_BOX = REVIT_SCOPE_BOX
export const LANDING_SCOPE_ID = REVIT_SCOPE_ID
export const LANDING_VIEW_FP_ID = REVIT_VIEW_FP_ID

const PICK_LINE_TOL_MM = 400
const PICK_ELEVATION_R_MM = 380
const PICK_ANNOTATION_R_MM = 500
const PICK_SCOPE_EDGE_MM = 350

export function getScopeBoxBBox(sb: ScopeBox): BBox {
  return { minX: sb.minX, minY: sb.minY, maxX: sb.maxX, maxY: sb.maxY }
}

export function getLandingBBox(): BBox {
  return { ...LANDING_FLOOR_PLAN_BOX }
}

export function distanceToSegment(point: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  if (lenSq < 1e-6) return distance(point, a)
  const t = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq),
  )
  const proj = { x: a.x + t * dx, y: a.y + t * dy }
  return distance(point, proj)
}

export function getLineBBox(start: Point2D, end: Point2D, pad = 200): BBox {
  return {
    minX: Math.min(start.x, end.x) - pad,
    minY: Math.min(start.y, end.y) - pad,
    maxX: Math.max(start.x, end.x) + pad,
    maxY: Math.max(start.y, end.y) + pad,
  }
}

export function getGridBBox(grid: Grid): BBox {
  return getLineBBox(grid.start, grid.end, 500)
}

export function getRefPlaneBBox(rp: ReferencePlane): BBox {
  return getLineBBox(rp.start, rp.end, 300)
}

export function getElevationMarkerBBox(em: ElevationMarker): BBox {
  const r = PICK_ELEVATION_R_MM
  return {
    minX: em.position.x - r,
    minY: em.position.y - r,
    maxX: em.position.x + r,
    maxY: em.position.y + r,
  }
}

/** Scope box controls which datums appear in views that share its id. */
export function isDatumVisibleInView(
  datumScopeBoxId: string | undefined,
  view: View | undefined,
): boolean {
  if (!datumScopeBoxId) return true
  if (!view) return true
  return view.scopeBoxId === datumScopeBoxId
}

export function pickLineDatum(
  point: Point2D,
  id: string,
  type: 'grid' | 'reference-plane',
  start: Point2D,
  end: Point2D,
  tol = PICK_LINE_TOL_MM,
): { elementId: string; elementType: typeof type; distance: number } | null {
  const d = distanceToSegment(point, start, end)
  if (d > tol) return null
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
  return { elementId: id, elementType: type, distance: distance(point, mid) }
}

export function pickScopeBox(
  point: Point2D,
  sb: ScopeBox,
): { elementId: string; elementType: 'scope-box'; distance: number } | null {
  const bbox = getScopeBoxBBox(sb)
  const cx = (bbox.minX + bbox.maxX) / 2
  const cy = (bbox.minY + bbox.maxY) / 2

  const nearEdge =
    Math.abs(point.x - bbox.minX) < PICK_SCOPE_EDGE_MM ||
    Math.abs(point.x - bbox.maxX) < PICK_SCOPE_EDGE_MM ||
    Math.abs(point.y - bbox.minY) < PICK_SCOPE_EDGE_MM ||
    Math.abs(point.y - bbox.maxY) < PICK_SCOPE_EDGE_MM

  const inside =
    point.x >= bbox.minX &&
    point.x <= bbox.maxX &&
    point.y >= bbox.minY &&
    point.y <= bbox.maxY

  if (!nearEdge && !inside) return null
  const edgeDist = Math.min(
    Math.abs(point.x - bbox.minX),
    Math.abs(point.x - bbox.maxX),
    Math.abs(point.y - bbox.minY),
    Math.abs(point.y - bbox.maxY),
  )
  return {
    elementId: sb.id,
    elementType: 'scope-box',
    distance: inside && !nearEdge ? distance(point, { x: cx, y: cy }) + 5000 : edgeDist,
  }
}

export function pickElevationMarker(
  point: Point2D,
  em: ElevationMarker,
): { elementId: string; elementType: 'elevation-marker'; distance: number } | null {
  const d = distance(point, em.position)
  if (d > PICK_ELEVATION_R_MM) return null
  return { elementId: em.id, elementType: 'elevation-marker', distance: d }
}

export function pickViewCrop(
  point: Point2D,
  view: View,
): { elementId: string; elementType: 'view-crop'; distance: number } | null {
  if (!view.cropRegion) return null
  const c = view.cropRegion
  const nearEdge =
    Math.abs(point.x - c.minX) < PICK_SCOPE_EDGE_MM ||
    Math.abs(point.x - c.maxX) < PICK_SCOPE_EDGE_MM ||
    Math.abs(point.y - c.minY) < PICK_SCOPE_EDGE_MM ||
    Math.abs(point.y - c.maxY) < PICK_SCOPE_EDGE_MM
  if (!nearEdge) return null
  const edgeDist = Math.min(
    Math.abs(point.x - c.minX),
    Math.abs(point.x - c.maxX),
    Math.abs(point.y - c.minY),
    Math.abs(point.y - c.maxY),
  )
  return {
    elementId: `view-crop:${view.id}`,
    elementType: 'view-crop',
    distance: edgeDist,
  }
}

export function elevationDirectionLabel(dir: ElevationDirection): string {
  const map: Record<ElevationDirection, string> = {
    north: 'North',
    south: 'South',
    east: 'East',
    west: 'West',
  }
  return map[dir]
}

export function createElevationViewForMarker(
  model: ProjectModel,
  marker: ElevationMarker,
): View {
  const label = elevationDirectionLabel(marker.direction)
  const existing = model.views.find((v) => v.id === marker.linkedViewId)
  if (existing) return existing
  return {
    id: marker.linkedViewId ?? `elevation-${marker.direction}-${marker.id.slice(-4)}`,
    name: `${label} Elevation`,
    type: 'elevation',
    levelId: marker.levelId,
    scale: 100,
    detailLevel: 'coarse',
    hiddenElementIds: [],
    elevationMarkerId: marker.id,
    scopeBoxId: marker.scopeBoxId,
  }
}

export function createLandingScopeBox(): ScopeBox {
  const b = LANDING_SCOPE_BOX
  return {
    id: LANDING_SCOPE_ID,
    name: 'Scope Box 1',
    minX: b.minX,
    minY: b.minY,
    maxX: b.maxX,
    maxY: b.maxY,
    minZ: 0,
    maxZ: 6000,
    datumIds: ['rp-landing-h', 'rp-landing-v'],
  }
}

export function createLandingReferencePlanes(): ReferencePlane[] {
  const crop = LANDING_FLOOR_PLAN_BOX
  const cx = REVIT_SCOPE_CENTER.x
  const cy = REVIT_SCOPE_CENTER.y
  return [
    {
      id: 'rp-landing-h',
      name: 'Reference Plane',
      start: { x: crop.minX, y: cy },
      end: { x: crop.maxX, y: cy },
      scopeBoxId: LANDING_SCOPE_ID,
      purpose: 'work-plane',
      tint: 'green',
    },
    {
      id: 'rp-landing-v',
      name: 'Reference Plane',
      start: { x: cx, y: crop.minY },
      end: { x: cx, y: crop.maxY },
      scopeBoxId: LANDING_SCOPE_ID,
      purpose: 'work-plane',
      tint: 'green',
    },
  ]
}

export function createLandingViewAnnotations(viewId: string, scale = 100): ViewAnnotation[] {
  return [
    {
      id: 'ann-north-arrow',
      viewId,
      kind: 'north-arrow',
      position: revitNorthArrowPosition(),
      scaleRatio: scale,
    },
    {
      id: 'ann-scale-bar',
      viewId,
      kind: 'scale-bar',
      position: revitScaleBarPosition(),
      scaleRatio: scale,
    },
  ]
}

export function getViewAnnotationBBox(
  ann: ViewAnnotation,
  pad = PICK_ANNOTATION_R_MM,
): BBox {
  return {
    minX: ann.position.x - pad,
    minY: ann.position.y - pad,
    maxX: ann.position.x + pad,
    maxY: ann.position.y + pad,
  }
}

export function pickViewAnnotation(
  point: Point2D,
  ann: ViewAnnotation,
): { elementId: string; elementType: 'view-annotation'; distance: number } | null {
  const d = distance(point, ann.position)
  if (d > PICK_ANNOTATION_R_MM) return null
  return {
    elementId: ann.id,
    elementType: 'view-annotation',
    distance: d,
  }
}

/** Section line on plan — through view center, annotation crop width (Revit default). */
export function createLandingWorkingSection(levelId: string): WorkingSection {
  const ann = REVIT_ANNOTATION_BOX
  const y = revitWorkingSectionY()
  return {
    id: 'ws-landing-1',
    name: 'Working Section 1',
    start: { x: ann.minX - REVIT_SECTION_END_INSET, y },
    end: { x: ann.maxX + REVIT_SECTION_END_INSET, y },
    orientation: 'horizontal',
    levelId,
    scopeBoxId: LANDING_SCOPE_ID,
    linkedViewId: 'section-view-ws-1',
    flipped: false,
  }
}

export function getWorkingSectionBBox(ws: WorkingSection, pad = 400): BBox {
  return getLineBBox(ws.start, ws.end, pad)
}

export function pickWorkingSection(
  point: Point2D,
  ws: WorkingSection,
): { elementId: string; elementType: 'working-section'; distance: number } | null {
  const d = distanceToSegment(point, ws.start, ws.end)
  if (d > 500) return null
  const mid = {
    x: (ws.start.x + ws.end.x) / 2,
    y: (ws.start.y + ws.end.y) / 2,
  }
  return {
    elementId: ws.id,
    elementType: 'working-section',
    distance: Math.hypot(point.x - mid.x, point.y - mid.y),
  }
}

export function createSectionViewForWorkingSection(
  model: ProjectModel,
  ws: WorkingSection,
): View {
  const existing = model.views.find((v) => v.id === ws.linkedViewId)
  if (existing) return existing
  return {
    id: ws.linkedViewId ?? `section-${ws.id}`,
    name: ws.name,
    type: 'section',
    levelId: ws.levelId,
    scale: 100,
    detailLevel: 'coarse',
    hiddenElementIds: [],
    workingSectionId: ws.id,
    scopeBoxId: ws.scopeBoxId,
  }
}

export function createLandingElevationMarkers(levelId: string): ElevationMarker[] {
  const ann = REVIT_ANNOTATION_BOX
  const cx = (ann.minX + ann.maxX) / 2
  const cy = (ann.minY + ann.maxY) / 2
  const outward = REVIT_ELEVATION_OUTWARD
  const defs: {
    direction: ElevationDirection
    position: Point2D
    lookTarget: Point2D
  }[] = [
    {
      direction: 'north',
      position: { x: cx, y: ann.maxY + outward },
      lookTarget: { x: cx, y: ann.maxY },
    },
    {
      direction: 'south',
      position: { x: cx, y: ann.minY - outward },
      lookTarget: { x: cx, y: ann.minY },
    },
    {
      direction: 'east',
      position: { x: ann.maxX + outward, y: cy },
      lookTarget: { x: ann.maxX, y: cy },
    },
    {
      direction: 'west',
      position: { x: ann.minX - outward, y: cy },
      lookTarget: { x: ann.minX, y: cy },
    },
  ]
  return defs.map((d) => ({
    id: `elev-marker-${d.direction}`,
    name: `${elevationDirectionLabel(d.direction)} Elevation`,
    position: d.position,
    lookTarget: d.lookTarget,
    direction: d.direction,
    scopeBoxId: LANDING_SCOPE_ID,
    linkedViewId: `elevation-view-${d.direction}`,
    levelId,
  }))
}

/** Clip a datum line to scope box edges (Revit ref plane extent). */
export function clipLineToScopeBox(
  start: Point2D,
  end: Point2D,
  scope: BBox = LANDING_SCOPE_BOX,
): { start: Point2D; end: Point2D } {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (Math.abs(dx) < 50) {
    const x = (start.x + end.x) / 2
    return { start: { x, y: scope.minY }, end: { x, y: scope.maxY } }
  }
  if (Math.abs(dy) < 50) {
    const y = (start.y + end.y) / 2
    return { start: { x: scope.minX, y }, end: { x: scope.maxX, y } }
  }
  const mx = (start.x + end.x) / 2
  const my = (start.y + end.y) / 2
  const scale = 1e6
  const a = { x: mx - dx * scale, y: my - dy * scale }
  const b = { x: mx + dx * scale, y: my + dy * scale }
  const hits: Point2D[] = []
  const edges: [Point2D, Point2D][] = [
    [{ x: scope.minX, y: scope.minY }, { x: scope.maxX, y: scope.minY }],
    [{ x: scope.maxX, y: scope.minY }, { x: scope.maxX, y: scope.maxY }],
    [{ x: scope.maxX, y: scope.maxY }, { x: scope.minX, y: scope.maxY }],
    [{ x: scope.minX, y: scope.maxY }, { x: scope.minX, y: scope.minY }],
  ]
  for (const [e0, e1] of edges) {
    const hit = segmentIntersection(a, b, e0, e1)
    if (hit) hits.push(hit)
  }
  if (hits.length < 2) {
    return { start, end }
  }
  hits.sort((p, q) => p.x - q.x || p.y - q.y)
  return { start: hits[0], end: hits[hits.length - 1] }
}

function segmentIntersection(
  a1: Point2D,
  a2: Point2D,
  b1: Point2D,
  b2: Point2D,
): Point2D | null {
  const dxa = a2.x - a1.x
  const dya = a2.y - a1.y
  const dxb = b2.x - b1.x
  const dyb = b2.y - b1.y
  const denom = dxa * dyb - dya * dxb
  if (Math.abs(denom) < 1e-9) return null
  const t = ((b1.x - a1.x) * dyb - (b1.y - a1.y) * dxb) / denom
  const u = ((b1.x - a1.x) * dya - (b1.y - a1.y) * dxa) / denom
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  return { x: a1.x + t * dxa, y: a1.y + t * dya }
}

export function nextRefPlaneName(model: ProjectModel): string {
  return `Reference Plane ${model.referencePlanes.length + 1}`
}

export function nextWorkingSectionName(model: ProjectModel): string {
  return `Working Section ${(model.workingSections ?? []).length + 1}`
}

export function buildRefPlaneFromPoints(
  start: Point2D,
  end: Point2D,
  model: ProjectModel,
  scopeBoxId = LANDING_SCOPE_ID,
): ReferencePlane {
  const clipped = clipLineToScopeBox(start, end)
  return {
    id: generateId('ref'),
    name: nextRefPlaneName(model),
    start: clipped.start,
    end: clipped.end,
    scopeBoxId,
    purpose: 'work-plane',
    tint: 'green',
  }
}

export function resolveSectionPreviewLine(
  start: Point2D,
  end: Point2D,
  ann: BBox = REVIT_ANNOTATION_BOX,
): { start: Point2D; end: Point2D; orientation: 'horizontal' | 'vertical' } {
  const horizontal = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y)
  if (horizontal) {
    const y = (start.y + end.y) / 2
    return {
      start: { x: ann.minX - REVIT_SECTION_END_INSET, y },
      end: { x: ann.maxX + REVIT_SECTION_END_INSET, y },
      orientation: 'horizontal',
    }
  }
  const x = (start.x + end.x) / 2
  return {
    start: { x, y: ann.minY - REVIT_SECTION_END_INSET },
    end: { x, y: ann.maxY + REVIT_SECTION_END_INSET },
    orientation: 'vertical',
  }
}

export function buildWorkingSectionFromPoints(
  start: Point2D,
  end: Point2D,
  levelId: string,
  model: ProjectModel,
  ann: BBox = REVIT_ANNOTATION_BOX,
  scopeBoxId = LANDING_SCOPE_ID,
): { section: WorkingSection; view: View } {
  const { start: s, end: e, orientation } = resolveSectionPreviewLine(start, end, ann)
  const id = generateId('ws')
  const viewId = `section-view-${id}`
  const section: WorkingSection = {
    id,
    name: nextWorkingSectionName(model),
    start: s,
    end: e,
    orientation,
    levelId,
    scopeBoxId,
    linkedViewId: viewId,
    flipped: false,
  }
  const view = createSectionViewForWorkingSection(model, section)
  return { section, view }
}
