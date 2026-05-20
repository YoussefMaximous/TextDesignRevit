import type {
  Door,
  Grid,
  Point2D,
  ProjectModel,
  ReferencePlane,
  Room,
  View,
  Wall,
  Window,
  WorkingSection,
  Column,
  Floor,
  Stair,
} from './types'

export interface Command {
  execute(model: ProjectModel): ProjectModel
  undo(model: ProjectModel): ProjectModel
  description: string
}

const MAX_DEPTH = 100

export class CommandStack {
  private undoStack: Command[] = []
  private redoStack: Command[] = []

  push(cmd: Command, model: ProjectModel): ProjectModel {
    const next = cmd.execute(model)
    this.undoStack.push(cmd)
    if (this.undoStack.length > MAX_DEPTH) {
      this.undoStack.shift()
    }
    this.redoStack = []
    return next
  }

  undo(model: ProjectModel): { model: ProjectModel; description: string | null } {
    const cmd = this.undoStack.pop()
    if (!cmd) return { model, description: null }
    const next = cmd.undo(model)
    this.redoStack.push(cmd)
    return { model: next, description: cmd.description }
  }

  redo(model: ProjectModel): { model: ProjectModel; description: string | null } {
    const cmd = this.redoStack.pop()
    if (!cmd) return { model, description: null }
    const next = cmd.execute(model)
    this.undoStack.push(cmd)
    return { model: next, description: cmd.description }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  peekUndoDescription(): string | null {
    const cmd = this.undoStack[this.undoStack.length - 1]
    return cmd?.description ?? null
  }
}

export class PlaceWallCommand implements Command {
  description = 'Place Wall'
  private wall: Wall

  constructor(wall: Wall) {
    this.wall = wall
  }

  execute(model: ProjectModel): ProjectModel {
    return { ...model, walls: [...model.walls, this.wall] }
  }

  undo(model: ProjectModel): ProjectModel {
    return { ...model, walls: model.walls.filter((w) => w.id !== this.wall.id) }
  }
}

export class PlaceDoorCommand implements Command {
  description = 'Place Door'
  private door: Door

  constructor(door: Door) {
    this.door = door
  }

  execute(model: ProjectModel): ProjectModel {
    return {
      ...model,
      doors: [...model.doors, this.door],
      walls: model.walls.map((w) =>
        w.id === this.door.hostWallId
          ? { ...w, hostedIds: [...w.hostedIds, this.door.id] }
          : w,
      ),
    }
  }

  undo(model: ProjectModel): ProjectModel {
    return {
      ...model,
      doors: model.doors.filter((d) => d.id !== this.door.id),
      walls: model.walls.map((w) =>
        w.id === this.door.hostWallId
          ? { ...w, hostedIds: w.hostedIds.filter((id) => id !== this.door.id) }
          : w,
      ),
    }
  }
}

export class PlaceWindowCommand implements Command {
  description = 'Place Window'
  private window: Window

  constructor(window: Window) {
    this.window = window
  }

  execute(model: ProjectModel): ProjectModel {
    return {
      ...model,
      windows: [...model.windows, this.window],
      walls: model.walls.map((w) =>
        w.id === this.window.hostWallId
          ? { ...w, hostedIds: [...w.hostedIds, this.window.id] }
          : w,
      ),
    }
  }

  undo(model: ProjectModel): ProjectModel {
    return {
      ...model,
      windows: model.windows.filter((w) => w.id !== this.window.id),
      walls: model.walls.map((w) =>
        w.id === this.window.hostWallId
          ? { ...w, hostedIds: w.hostedIds.filter((id) => id !== this.window.id) }
          : w,
      ),
    }
  }
}

export class DeleteElementsCommand implements Command {
  description: string
  private wallIds: string[]
  private doorIds: string[]
  private windowIds: string[]
  private gridIds: string[]
  private roomIds: string[]
  private refPlaneIds: string[]
  private scopeBoxIds: string[]
  private elevationIds: string[]
  private workingSectionIds: string[]
  private viewAnnotationIds: string[]
  private columnIds: string[]
  private floorIds: string[]
  private stairIds: string[]
  private levelIds: string[]
  private prev: ProjectModel

  constructor(
    model: ProjectModel,
    ids: string[],
    description = 'Delete',
  ) {
    this.description = description
    this.prev = model
    this.wallIds = ids.filter((id) => model.walls.some((w) => w.id === id))
    this.doorIds = ids.filter((id) => model.doors.some((d) => d.id === id))
    this.windowIds = ids.filter((id) => model.windows.some((w) => w.id === id))
    this.gridIds = ids.filter((id) => model.grids.some((g) => g.id === id))
    this.roomIds = ids.filter((id) => model.rooms.some((r) => r.id === id))
    this.refPlaneIds = ids.filter((id) => model.referencePlanes.some((r) => r.id === id))
    this.scopeBoxIds = ids.filter((id) => model.scopeBoxes.some((s) => s.id === id))
    this.elevationIds = ids.filter((id) => model.elevationMarkers.some((e) => e.id === id))
    this.workingSectionIds = ids.filter((id) =>
      (model.workingSections ?? []).some((w) => w.id === id),
    )
    this.viewAnnotationIds = ids.filter((id) =>
      (model.viewAnnotations ?? []).some((a) => a.id === id),
    )
    this.columnIds = ids.filter((id) => model.columns.some((c) => c.id === id))
    this.floorIds = ids.filter((id) => (model.floors ?? []).some((f) => f.id === id))
    this.stairIds = ids.filter((id) => (model.stairs ?? []).some((s) => s.id === id))
    this.levelIds = ids.filter((id) => model.levels.some((l) => l.id === id))
  }

  execute(model: ProjectModel): ProjectModel {
    const removedDatum = new Set([
      ...this.gridIds,
      ...this.refPlaneIds,
    ])
    return {
      ...model,
      walls: model.walls.filter((w) => !this.wallIds.includes(w.id)),
      doors: model.doors.filter(
        (d) =>
          !this.doorIds.includes(d.id) && !this.wallIds.includes(d.hostWallId),
      ),
      windows: model.windows.filter(
        (w) =>
          !this.windowIds.includes(w.id) && !this.wallIds.includes(w.hostWallId),
      ),
      rooms: model.rooms.filter((r) => !this.roomIds.includes(r.id)),
      grids: model.grids.filter((g) => !this.gridIds.includes(g.id)),
      referencePlanes: model.referencePlanes.filter((r) => !this.refPlaneIds.includes(r.id)),
      scopeBoxes: model.scopeBoxes
        .filter((s) => !this.scopeBoxIds.includes(s.id))
        .map((s) => ({
          ...s,
          datumIds: s.datumIds.filter((id) => !removedDatum.has(id)),
        })),
      elevationMarkers: model.elevationMarkers.filter((e) => !this.elevationIds.includes(e.id)),
      workingSections: (model.workingSections ?? []).filter(
        (w) => !this.workingSectionIds.includes(w.id),
      ),
      viewAnnotations: (model.viewAnnotations ?? []).filter(
        (a) => !this.viewAnnotationIds.includes(a.id),
      ),
      columns: model.columns.filter((c) => !this.columnIds.includes(c.id)),
      floors: (model.floors ?? []).filter((f) => !this.floorIds.includes(f.id)),
      stairs: (model.stairs ?? []).filter((s) => !this.stairIds.includes(s.id)),
      levels: model.levels.filter((l) => !this.levelIds.includes(l.id)),
    }
  }

  undo(_model: ProjectModel): ProjectModel {
    return this.prev
  }
}

export class PlaceRefPlaneCommand implements Command {
  description = 'Place Reference Plane'
  private plane: ReferencePlane

  constructor(plane: ReferencePlane) {
    this.plane = plane
  }

  execute(model: ProjectModel): ProjectModel {
    return {
      ...model,
      referencePlanes: [...model.referencePlanes, this.plane],
    }
  }

  undo(model: ProjectModel): ProjectModel {
    return {
      ...model,
      referencePlanes: model.referencePlanes.filter((r) => r.id !== this.plane.id),
    }
  }
}

export class PlaceWorkingSectionCommand implements Command {
  description = 'Place Section'
  private section: WorkingSection
  private view: View

  constructor(section: WorkingSection, view: View) {
    this.section = section
    this.view = view
  }

  execute(model: ProjectModel): ProjectModel {
    const views = model.views.some((v) => v.id === this.view.id)
      ? model.views
      : [...model.views, this.view]
    return {
      ...model,
      workingSections: [...(model.workingSections ?? []), this.section],
      views,
    }
  }

  undo(model: ProjectModel): ProjectModel {
    return {
      ...model,
      workingSections: (model.workingSections ?? []).filter((w) => w.id !== this.section.id),
      views: model.views.filter((v) => v.id !== this.view.id),
    }
  }
}

export class PlaceColumnCommand implements Command {
  description = 'Place Column'
  private column: Column

  constructor(column: Column) {
    this.column = column
  }

  execute(model: ProjectModel): ProjectModel {
    return { ...model, columns: [...model.columns, this.column] }
  }

  undo(model: ProjectModel): ProjectModel {
    return { ...model, columns: model.columns.filter((c) => c.id !== this.column.id) }
  }
}

export class PlaceFloorCommand implements Command {
  description = 'Place Floor'
  private floor: Floor

  constructor(floor: Floor) {
    this.floor = floor
  }

  execute(model: ProjectModel): ProjectModel {
    return { ...model, floors: [...(model.floors ?? []), this.floor] }
  }

  undo(model: ProjectModel): ProjectModel {
    return { ...model, floors: (model.floors ?? []).filter((f) => f.id !== this.floor.id) }
  }
}

export class PlaceStairCommand implements Command {
  description = 'Place Stair'
  private stair: Stair

  constructor(stair: Stair) {
    this.stair = stair
  }

  execute(model: ProjectModel): ProjectModel {
    return { ...model, stairs: [...(model.stairs ?? []), this.stair] }
  }

  undo(model: ProjectModel): ProjectModel {
    return { ...model, stairs: (model.stairs ?? []).filter((s) => s.id !== this.stair.id) }
  }
}

export class PlaceGridCommand implements Command {
  description = 'Place Grid'
  private grid: Grid

  constructor(grid: Grid) {
    this.grid = grid
  }

  execute(model: ProjectModel): ProjectModel {
    return { ...model, grids: [...model.grids, this.grid] }
  }

  undo(model: ProjectModel): ProjectModel {
    return { ...model, grids: model.grids.filter((g) => g.id !== this.grid.id) }
  }
}

export class PlaceRoomCommand implements Command {
  description = 'Place Room'
  private room: Room

  constructor(room: Room) {
    this.room = room
  }

  execute(model: ProjectModel): ProjectModel {
    return { ...model, rooms: [...model.rooms, this.room] }
  }

  undo(model: ProjectModel): ProjectModel {
    return { ...model, rooms: model.rooms.filter((r) => r.id !== this.room.id) }
  }
}

export class UpdateWallEndCommand implements Command {
  description = 'Edit Wall Length'
  private wallId: string
  private prevEnd: Point2D
  private nextEnd: Point2D

  constructor(wallId: string, prevEnd: Point2D, nextEnd: Point2D) {
    this.wallId = wallId
    this.prevEnd = prevEnd
    this.nextEnd = nextEnd
  }

  execute(model: ProjectModel): ProjectModel {
    return {
      ...model,
      walls: model.walls.map((w) =>
        w.id === this.wallId ? { ...w, end: this.nextEnd } : w,
      ),
    }
  }

  undo(model: ProjectModel): ProjectModel {
    return {
      ...model,
      walls: model.walls.map((w) =>
        w.id === this.wallId ? { ...w, end: this.prevEnd } : w,
      ),
    }
  }
}

export class ApplyModelCommand implements Command {
  description: string
  private prev: ProjectModel
  private next: ProjectModel

  constructor(prev: ProjectModel, next: ProjectModel, description: string) {
    this.prev = prev
    this.next = next
    this.description = description
  }

  execute(_model: ProjectModel): ProjectModel {
    return this.next
  }

  undo(_model: ProjectModel): ProjectModel {
    return this.prev
  }
}

export class ReplaceModelCommand implements Command {
  description: string
  private prev: ProjectModel
  private next: ProjectModel

  constructor(prev: ProjectModel, next: ProjectModel, description: string) {
    this.prev = prev
    this.next = next
    this.description = description
  }

  execute(_model: ProjectModel): ProjectModel {
    return this.next
  }

  undo(_model: ProjectModel): ProjectModel {
    return this.prev
  }
}
