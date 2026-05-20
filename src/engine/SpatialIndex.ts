import RBush from 'rbush'
import type { BBox, Point2D, ProjectModel } from './types'
import {
  getElevationMarkerBBox,
  getGridBBox,
  getRefPlaneBBox,
  getScopeBoxBBox,
  getViewAnnotationBBox,
  getWorkingSectionBBox,
} from './datumGeometry'
import { getColumnBBox, getFloorBBox, getStairBBox } from './buildingElements'
import { getWallBBox } from './geometry'
import { getLevelLineBBox } from '../renderer/levelRenderer'

export interface SpatialItem {
  minX: number
  minY: number
  maxX: number
  maxY: number
  elementId: string
  elementType: string
}

export class SpatialIndex {
  private tree = new RBush<SpatialItem>()

  rebuild(model: ProjectModel): void {
    this.tree.clear()
    const items: SpatialItem[] = []

    for (const wall of model.walls) {
      const bbox = getWallBBox(wall)
      items.push({ ...bbox, elementId: wall.id, elementType: 'wall' })
    }

    for (const grid of model.grids) {
      const bbox = getGridBBox(grid)
      items.push({ ...bbox, elementId: grid.id, elementType: 'grid' })
    }

    for (const rp of model.referencePlanes) {
      const bbox = getRefPlaneBBox(rp)
      items.push({ ...bbox, elementId: rp.id, elementType: 'reference-plane' })
    }

    for (const sb of model.scopeBoxes) {
      const bbox = getScopeBoxBBox(sb)
      items.push({ ...bbox, elementId: sb.id, elementType: 'scope-box' })
    }

    for (const em of model.elevationMarkers) {
      const bbox = getElevationMarkerBBox(em)
      items.push({ ...bbox, elementId: em.id, elementType: 'elevation-marker' })
    }

    for (const ws of model.workingSections ?? []) {
      const bbox = getWorkingSectionBBox(ws)
      items.push({ ...bbox, elementId: ws.id, elementType: 'working-section' })
    }

    for (const ann of model.viewAnnotations ?? []) {
      const bbox = getViewAnnotationBBox(ann)
      items.push({ ...bbox, elementId: ann.id, elementType: 'view-annotation' })
    }

    for (const col of model.columns) {
      const bbox = getColumnBBox(col)
      items.push({ ...bbox, elementId: col.id, elementType: 'column' })
    }

    for (const floor of model.floors ?? []) {
      const bbox = getFloorBBox(floor)
      items.push({ ...bbox, elementId: floor.id, elementType: 'floor' })
    }

    for (const stair of model.stairs ?? []) {
      const bbox = getStairBBox(stair)
      items.push({ ...bbox, elementId: stair.id, elementType: 'stair' })
    }

    for (const door of model.doors) {
      const wall = model.walls.find((w) => w.id === door.hostWallId)
      if (!wall) continue
      const bbox = getWallBBox(wall)
      items.push({ ...bbox, elementId: door.id, elementType: 'door' })
    }

    for (const win of model.windows) {
      const wall = model.walls.find((w) => w.id === win.hostWallId)
      if (!wall) continue
      const bbox = getWallBBox(wall)
      items.push({ ...bbox, elementId: win.id, elementType: 'window' })
    }

    for (const level of model.levels) {
      if (level.planLineY === undefined) continue
      const bbox = getLevelLineBBox(level)
      items.push({ ...bbox, elementId: level.id, elementType: 'level' })
    }

    if (items.length > 0) {
      this.tree.load(items)
    }
  }

  queryRadius(center: Point2D, radiusMM: number): SpatialItem[] {
    return this.tree.search({
      minX: center.x - radiusMM,
      minY: center.y - radiusMM,
      maxX: center.x + radiusMM,
      maxY: center.y + radiusMM,
    })
  }

  queryBox(bbox: BBox): SpatialItem[] {
    return this.tree.search(bbox)
  }
}
