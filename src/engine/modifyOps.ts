import type { Point2D, ProjectModel, Wall } from './types'
import { nearestPointOnWall, projectPointOnSegment, wallLength } from './geometry'
import { generateId } from '../utils/id'

export function translatePoint(p: Point2D, dx: number, dy: number): Point2D {
  return { x: p.x + dx, y: p.y + dy }
}

export function moveElements(
  model: ProjectModel,
  ids: string[],
  delta: Point2D,
): ProjectModel {
  const idSet = new Set(ids)
  return {
    ...model,
    walls: model.walls.map((w) =>
      idSet.has(w.id)
        ? {
            ...w,
            start: translatePoint(w.start, delta.x, delta.y),
            end: translatePoint(w.end, delta.x, delta.y),
          }
        : w,
    ),
    doors: model.doors.map((d) => (idSet.has(d.id) ? d : d)),
    windows: model.windows.map((w) => (idSet.has(w.id) ? w : w)),
    rooms: model.rooms.map((r) =>
      idSet.has(r.id)
        ? { ...r, tagPosition: translatePoint(r.tagPosition, delta.x, delta.y) }
        : r,
    ),
    grids: model.grids.map((g) =>
      idSet.has(g.id)
        ? {
            ...g,
            start: translatePoint(g.start, delta.x, delta.y),
            end: translatePoint(g.end, delta.x, delta.y),
          }
        : g,
    ),
    referencePlanes: model.referencePlanes.map((rp) =>
      idSet.has(rp.id)
        ? {
            ...rp,
            start: translatePoint(rp.start, delta.x, delta.y),
            end: translatePoint(rp.end, delta.x, delta.y),
          }
        : rp,
    ),
    scopeBoxes: model.scopeBoxes.map((sb) =>
      idSet.has(sb.id)
        ? {
            ...sb,
            minX: sb.minX + delta.x,
            minY: sb.minY + delta.y,
            maxX: sb.maxX + delta.x,
            maxY: sb.maxY + delta.y,
          }
        : sb,
    ),
    elevationMarkers: model.elevationMarkers.map((em) =>
      idSet.has(em.id)
        ? {
            ...em,
            position: translatePoint(em.position, delta.x, delta.y),
            lookTarget: translatePoint(em.lookTarget, delta.x, delta.y),
          }
        : em,
    ),
    workingSections: (model.workingSections ?? []).map((ws) =>
      idSet.has(ws.id)
        ? {
            ...ws,
            start: translatePoint(ws.start, delta.x, delta.y),
            end: translatePoint(ws.end, delta.x, delta.y),
          }
        : ws,
    ),
    viewAnnotations: (model.viewAnnotations ?? []).map((ann) =>
      idSet.has(ann.id)
        ? { ...ann, position: translatePoint(ann.position, delta.x, delta.y) }
        : ann,
    ),
    columns: model.columns.map((c) =>
      idSet.has(c.id)
        ? { ...c, position: translatePoint(c.position, delta.x, delta.y) }
        : c,
    ),
    floors: (model.floors ?? []).map((f) =>
      idSet.has(f.id)
        ? {
            ...f,
            minX: f.minX + delta.x,
            minY: f.minY + delta.y,
            maxX: f.maxX + delta.x,
            maxY: f.maxY + delta.y,
          }
        : f,
    ),
    stairs: (model.stairs ?? []).map((s) =>
      idSet.has(s.id)
        ? { ...s, position: translatePoint(s.position, delta.x, delta.y) }
        : s,
    ),
  }
}

export function copyElements(model: ProjectModel, ids: string[], delta: Point2D): ProjectModel {
  const idSet = new Set(ids)
  let next = { ...model }
  const wallIdMap = new Map<string, string>()

  for (const wall of model.walls) {
    if (!idSet.has(wall.id)) continue
    const newId = generateId('wall')
    wallIdMap.set(wall.id, newId)
    next = {
      ...next,
      walls: [
        ...next.walls,
        {
          ...wall,
          id: newId,
          start: translatePoint(wall.start, delta.x, delta.y),
          end: translatePoint(wall.end, delta.x, delta.y),
          hostedIds: [],
        },
      ],
    }
  }

  for (const door of model.doors) {
    if (!idSet.has(door.id)) continue
    const newWallId = wallIdMap.get(door.hostWallId)
    if (!newWallId) continue
    next = {
      ...next,
      doors: [
        ...next.doors,
        { ...door, id: generateId('door'), hostWallId: newWallId },
      ],
    }
  }

  for (const win of model.windows) {
    if (!idSet.has(win.id)) continue
    const newWallId = wallIdMap.get(win.hostWallId)
    if (!newWallId) continue
    next = {
      ...next,
      windows: [
        ...next.windows,
        { ...win, id: generateId('window'), hostWallId: newWallId },
      ],
    }
  }

  for (const room of model.rooms) {
    if (!idSet.has(room.id)) continue
    next = {
      ...next,
      rooms: [
        ...next.rooms,
        {
          ...room,
          id: generateId('room'),
          tagPosition: translatePoint(room.tagPosition, delta.x, delta.y),
        },
      ],
    }
  }

  for (const grid of model.grids) {
    if (!idSet.has(grid.id)) continue
    next = {
      ...next,
      grids: [
        ...next.grids,
        {
          ...grid,
          id: generateId('grid'),
          start: translatePoint(grid.start, delta.x, delta.y),
          end: translatePoint(grid.end, delta.x, delta.y),
        },
      ],
    }
  }

  return next
}

export function rotatePoint(p: Point2D, center: Point2D, angleRad: number): Point2D {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  const dx = p.x - center.x
  const dy = p.y - center.y
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

export function rotateElements(
  model: ProjectModel,
  ids: string[],
  center: Point2D,
  angleRad: number,
): ProjectModel {
  const idSet = new Set(ids)
  return {
    ...model,
    walls: model.walls.map((w) =>
      idSet.has(w.id)
        ? {
            ...w,
            start: rotatePoint(w.start, center, angleRad),
            end: rotatePoint(w.end, center, angleRad),
          }
        : w,
    ),
    grids: model.grids.map((g) =>
      idSet.has(g.id)
        ? {
            ...g,
            start: rotatePoint(g.start, center, angleRad),
            end: rotatePoint(g.end, center, angleRad),
          }
        : g,
    ),
    rooms: model.rooms.map((r) =>
      idSet.has(r.id)
        ? { ...r, tagPosition: rotatePoint(r.tagPosition, center, angleRad) }
        : r,
    ),
  }
}

export function mirrorPoint(p: Point2D, a: Point2D, b: Point2D): Point2D {
  const ab = { x: b.x - a.x, y: b.y - a.y }
  const len2 = ab.x * ab.x + ab.y * ab.y
  if (len2 < 1e-9) return p
  const ap = { x: p.x - a.x, y: p.y - a.y }
  const t = (ap.x * ab.x + ap.y * ab.y) / len2
  const proj = { x: a.x + ab.x * t, y: a.y + ab.y * t }
  return { x: 2 * proj.x - p.x, y: 2 * proj.y - p.y }
}

export function mirrorElements(
  model: ProjectModel,
  ids: string[],
  axisA: Point2D,
  axisB: Point2D,
): ProjectModel {
  const idSet = new Set(ids)
  const mapWall = (w: Wall) =>
    idSet.has(w.id)
      ? {
          ...w,
          start: mirrorPoint(w.start, axisA, axisB),
          end: mirrorPoint(w.end, axisA, axisB),
        }
      : w
  return {
    ...model,
    walls: model.walls.map(mapWall),
    grids: model.grids.map((g) =>
      idSet.has(g.id)
        ? {
            ...g,
            start: mirrorPoint(g.start, axisA, axisB),
            end: mirrorPoint(g.end, axisA, axisB),
          }
        : g,
    ),
  }
}

export function splitWallAtPoint(model: ProjectModel, wallId: string, point: Point2D): ProjectModel | null {
  const wall = model.walls.find((w) => w.id === wallId)
  if (!wall) return null
  const split = nearestPointOnWall(wall, point)
  const { t } = projectPointOnSegment(split, wall.start, wall.end)
  if (t < 0.05 || t > 0.95) return null
  const w1: Wall = { ...wall, id: generateId('wall'), end: split }
  const w2: Wall = {
    ...wall,
    id: generateId('wall'),
    start: split,
    hostedIds: [],
  }
  const doors = model.doors.filter((d) => d.hostWallId !== wallId)
  const windows = model.windows.filter((w) => w.hostWallId !== wallId)
  return {
    ...model,
    walls: [...model.walls.filter((w) => w.id !== wallId), w1, w2],
    doors,
    windows,
  }
}

export function trimWallToPoint(
  model: ProjectModel,
  wallId: string,
  trimPoint: Point2D,
  keepStart: boolean,
): ProjectModel | null {
  const wall = model.walls.find((w) => w.id === wallId)
  if (!wall) return null
  const on = nearestPointOnWall(wall, trimPoint)
  const updated: Wall = keepStart ? { ...wall, end: on } : { ...wall, start: on }
  if (wallLength(updated) < 50) return null
  return {
    ...model,
    walls: model.walls.map((w) => (w.id === wallId ? updated : w)),
  }
}

export function alignWallToReference(
  model: ProjectModel,
  targetId: string,
  referenceId: string,
): ProjectModel | null {
  const target = model.walls.find((w) => w.id === targetId)
  const ref = model.walls.find((w) => w.id === referenceId)
  if (!target || !ref) return null
  const refMid = {
    x: (ref.start.x + ref.end.x) / 2,
    y: (ref.start.y + ref.end.y) / 2,
  }
  const tgtMid = {
    x: (target.start.x + target.end.x) / 2,
    y: (target.start.y + target.end.y) / 2,
  }
  const delta = { x: refMid.x - tgtMid.x, y: refMid.y - tgtMid.y }
  return moveElements(model, [targetId], delta)
}
