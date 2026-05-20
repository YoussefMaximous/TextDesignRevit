import { create } from 'zustand'
import type {
  Column,
  DimEditState,
  Door,
  Floor,
  FloorToolState,
  Grid,
  GridToolState,
  HostedToolState,
  Point2D,
  ProjectModel,
  ReferencePlane,
  RefPlaneToolState,
  Room,
  SectionToolState,
  SnapConfig,
  Stair,
  ToolId,
  Wall,
  WallToolState,
  Window,
  View,
  WorkingSection,
} from '../engine/types'
import {
  ApplyModelCommand,
  CommandStack,
  DeleteElementsCommand,
  PlaceColumnCommand,
  PlaceDoorCommand,
  PlaceFloorCommand,
  PlaceGridCommand,
  PlaceRefPlaneCommand,
  PlaceRoomCommand,
  PlaceStairCommand,
  PlaceWallCommand,
  PlaceWindowCommand,
  PlaceWorkingSectionCommand,
  UpdateWallEndCommand,
} from '../engine/CommandStack'
import {
  createElevationViewForMarker,
  createSectionViewForWorkingSection,
} from '../engine/datumGeometry'
import { downloadTdx, openTdxFile } from '../engine/fileIO'
import {
  createModifyPhase,
  modifyStatusMessage,
  type ModifyToolPhase,
} from '../engine/modifyToolState'
import { createDefaultProject } from './defaults'
import { SpatialIndex } from '../engine/SpatialIndex'
import { DEFAULT_TRANSFORM, type ViewTransform } from '../renderer/transform'
import type { PickHit, SelectionFilters } from '../engine/selection'

const DEFAULT_SELECTION_FILTERS: SelectionFilters = {
  walls: true,
  doors: true,
  windows: true,
  grids: true,
  datums: true,
  columns: true,
  floors: true,
  stairs: true,
}

const commandStack = new CommandStack()
const spatialIndex = new SpatialIndex()

interface ProjectState {
  model: ProjectModel
  transform: ViewTransform
  spatialIndex: SpatialIndex
  selectedIds: string[]
  activeTool: ToolId
  wallTool: WallToolState
  doorTool: HostedToolState
  windowTool: HostedToolState
  gridTool: GridToolState
  sectionTool: SectionToolState
  refPlaneTool: RefPlaneToolState
  floorTool: FloorToolState
  dimEdit: DimEditState | null
  modifyPhase: ModifyToolPhase | null
  typePropertiesOpen: boolean
  snapDialogOpen: boolean
  typedDistance: string
  tabCycleHits: PickHit[]
  tabCycleIndex: number
  statusMessage: string
  cursorModel: Point2D
  snapEnabled: boolean
  snapConfig: SnapConfig
  chainWalls: boolean
  wallHeight: number
  shortcutBuffer: string
  asciiPanelOpen: boolean
  leftPanelWidth: number
  ribbonCollapsed: boolean
  activeRibbonTab: string
  viewScale: number
  detailLevel: 'coarse' | 'medium' | 'fine'
  selectionFilters: SelectionFilters

  setModel: (model: ProjectModel) => void
  setTransform: (tx: ViewTransform) => void
  setSelectedIds: (ids: string[]) => void
  setActiveTool: (tool: ToolId) => void
  setWallTool: (state: WallToolState) => void
  setDoorTool: (state: HostedToolState) => void
  setWindowTool: (state: HostedToolState) => void
  setGridTool: (state: GridToolState) => void
  setSectionTool: (state: SectionToolState) => void
  setRefPlaneTool: (state: RefPlaneToolState) => void
  setFloorTool: (state: FloorToolState) => void
  setDimEdit: (state: DimEditState | null) => void
  clearDimEdit: () => void
  setModifyPhase: (phase: ModifyToolPhase | null) => void
  setTypePropertiesOpen: (open: boolean) => void
  setSnapDialogOpen: (open: boolean) => void
  setSnapConfig: (config: SnapConfig) => void
  setSnapEnabled: (on: boolean) => void
  setTypedDistance: (s: string) => void
  setTabCycleHits: (hits: PickHit[]) => void
  setTabCycleIndex: (index: number) => void
  setStatusMessage: (msg: string) => void
  setCursorModel: (pt: Point2D) => void
  setShortcutBuffer: (buf: string) => void
  setAsciiPanelOpen: (open: boolean) => void
  setLeftPanelWidth: (w: number) => void
  setRibbonCollapsed: (c: boolean) => void
  setActiveRibbonTab: (tab: string) => void
  setViewScale: (scale: number) => void
  setDetailLevel: (level: 'coarse' | 'medium' | 'fine') => void
  setSelectionFilter: (key: keyof SelectionFilters, on: boolean) => void
  setChainWalls: (chain: boolean) => void
  setWallHeight: (h: number) => void
  setActiveView: (viewId: string) => void
  openElevationFromMarker: (markerId: string) => void
  openWorkingSection: (sectionId: string) => void

  rebuildSpatialIndex: () => void
  placeWall: (wall: Wall) => void
  placeDoor: (door: Door) => void
  placeWindow: (window: Window) => void
  placeGrid: (grid: Grid) => void
  placeRefPlane: (plane: ReferencePlane) => void
  placeWorkingSection: (section: WorkingSection, view: View) => void
  placeColumn: (column: Column) => void
  placeFloor: (floor: Floor) => void
  placeStair: (stair: Stair) => void
  placeRoom: (room: Room) => void
  placeLevel: (point: Point2D) => void
  updateRoomFields: (roomId: string, fields: Partial<Pick<Room, 'name' | 'number'>>) => void
  updateWallLength: (wallId: string, newEnd: Point2D) => void
  applyModel: (model: ProjectModel, description: string) => void
  newProject: () => void
  openProject: () => Promise<void>
  saveProject: () => void
  deleteSelected: () => void
  undo: () => void
  redo: () => void
}

const MODIFY_TOOL_IDS: ToolId[] = [
  'move',
  'copy',
  'rotate',
  'mirror',
  'align',
  'trim',
  'split',
]

function rebuildIndex(model: ProjectModel): void {
  spatialIndex.rebuild(model)
}

const initialModel = createDefaultProject()
rebuildIndex(initialModel)

const HOSTED_IDLE: HostedToolState = { phase: 'idle' }

export const useProjectStore = create<ProjectState>((set, get) => ({
  model: initialModel,
  transform: { ...DEFAULT_TRANSFORM },
  spatialIndex,
  selectedIds: [],
  activeTool: 'modify',
  wallTool: { phase: 'idle' },
  doorTool: HOSTED_IDLE,
  windowTool: HOSTED_IDLE,
  gridTool: { phase: 'idle' },
  sectionTool: { phase: 'idle' },
  refPlaneTool: { phase: 'idle' },
  floorTool: { phase: 'idle' },
  dimEdit: null,
  modifyPhase: null,
  typePropertiesOpen: false,
  snapDialogOpen: false,
  typedDistance: '',
  tabCycleHits: [],
  tabCycleIndex: 0,
  statusMessage: 'Ready',
  cursorModel: { x: 0, y: 0 },
  snapEnabled: true,
  snapConfig: {
    endpoints: true,
    midpoints: true,
    intersections: true,
    perpendicular: true,
    nearest: false,
    centers: true,
    lengthIncrements: [100, 500, 1000],
    angleIncrements: [15, 30, 45, 90],
  },
  chainWalls: false,
  wallHeight: 3000,
  shortcutBuffer: '',
  asciiPanelOpen: false,
  leftPanelWidth: 240,
  ribbonCollapsed: false,
  activeRibbonTab: 'architecture',
  viewScale: 100,
  detailLevel: 'coarse',
  selectionFilters: { ...DEFAULT_SELECTION_FILTERS },

  setModel: (model) => {
    rebuildIndex(model)
    set({ model })
  },
  setTransform: (transform) => set({ transform }),
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  setActiveTool: (activeTool) => {
    const updates: Partial<ProjectState> = {
      activeTool,
      tabCycleHits: [],
      tabCycleIndex: 0,
    }
    if (activeTool === 'wall') {
      updates.wallTool = { phase: 'active' }
      updates.doorTool = HOSTED_IDLE
      updates.windowTool = HOSTED_IDLE
      updates.statusMessage = 'Click to place wall start point'
    } else if (activeTool === 'door') {
      updates.wallTool = { phase: 'idle' }
      updates.doorTool = { phase: 'active' }
      updates.windowTool = HOSTED_IDLE
      updates.statusMessage = 'Click on a wall to place door'
    } else if (activeTool === 'window') {
      updates.wallTool = { phase: 'idle' }
      updates.doorTool = HOSTED_IDLE
      updates.windowTool = { phase: 'active' }
      updates.statusMessage = 'Click on a wall to place window'
    } else if (activeTool === 'grid') {
      updates.wallTool = { phase: 'idle' }
      updates.doorTool = HOSTED_IDLE
      updates.windowTool = HOSTED_IDLE
      updates.gridTool = { phase: 'active' }
      updates.sectionTool = { phase: 'idle' }
      updates.refPlaneTool = { phase: 'idle' }
      updates.statusMessage = 'Click to place grid start point'
    } else if (activeTool === 'section') {
      updates.wallTool = { phase: 'idle' }
      updates.doorTool = HOSTED_IDLE
      updates.windowTool = HOSTED_IDLE
      updates.gridTool = { phase: 'idle' }
      updates.sectionTool = { phase: 'active' }
      updates.refPlaneTool = { phase: 'idle' }
      updates.statusMessage = 'Click to place section line start'
    } else if (activeTool === 'reference-plane') {
      updates.wallTool = { phase: 'idle' }
      updates.doorTool = HOSTED_IDLE
      updates.windowTool = HOSTED_IDLE
      updates.gridTool = { phase: 'idle' }
      updates.sectionTool = { phase: 'idle' }
      updates.floorTool = { phase: 'idle' }
      updates.refPlaneTool = { phase: 'active' }
      updates.statusMessage = 'Click to place reference plane start'
    } else if (activeTool === 'column') {
      updates.wallTool = { phase: 'idle' }
      updates.doorTool = HOSTED_IDLE
      updates.windowTool = HOSTED_IDLE
      updates.gridTool = { phase: 'idle' }
      updates.sectionTool = { phase: 'idle' }
      updates.refPlaneTool = { phase: 'idle' }
      updates.floorTool = { phase: 'idle' }
      updates.statusMessage = 'Click to place column'
    } else if (activeTool === 'floor') {
      updates.wallTool = { phase: 'idle' }
      updates.doorTool = HOSTED_IDLE
      updates.windowTool = HOSTED_IDLE
      updates.gridTool = { phase: 'idle' }
      updates.sectionTool = { phase: 'idle' }
      updates.refPlaneTool = { phase: 'idle' }
      updates.floorTool = { phase: 'active' }
      updates.statusMessage = 'Click first corner of floor'
    } else if (activeTool === 'stair') {
      updates.wallTool = { phase: 'idle' }
      updates.doorTool = HOSTED_IDLE
      updates.windowTool = HOSTED_IDLE
      updates.gridTool = { phase: 'idle' }
      updates.sectionTool = { phase: 'idle' }
      updates.refPlaneTool = { phase: 'idle' }
      updates.floorTool = { phase: 'idle' }
      updates.statusMessage = 'Click to place stair'
    } else if (activeTool === 'room') {
      updates.wallTool = { phase: 'idle' }
      updates.doorTool = HOSTED_IDLE
      updates.windowTool = HOSTED_IDLE
      updates.gridTool = { phase: 'idle' }
      updates.sectionTool = { phase: 'idle' }
      updates.refPlaneTool = { phase: 'idle' }
      updates.statusMessage = 'Click inside enclosed area to place room'
    } else if (activeTool === 'level') {
      updates.wallTool = { phase: 'idle' }
      updates.doorTool = HOSTED_IDLE
      updates.windowTool = HOSTED_IDLE
      updates.gridTool = { phase: 'idle' }
      updates.sectionTool = { phase: 'idle' }
      updates.refPlaneTool = { phase: 'idle' }
      updates.statusMessage = 'Click to add a new level'
    } else if (activeTool === 'modify') {
      updates.wallTool = { phase: 'idle' }
      updates.doorTool = HOSTED_IDLE
      updates.windowTool = HOSTED_IDLE
      updates.gridTool = { phase: 'idle' }
      updates.sectionTool = { phase: 'idle' }
      updates.refPlaneTool = { phase: 'idle' }
      updates.floorTool = { phase: 'idle' }
      updates.modifyPhase = null
      updates.statusMessage = 'Click to select element · Click blue dim to edit'
    } else if (MODIFY_TOOL_IDS.includes(activeTool)) {
      const { selectedIds } = get()
      if (selectedIds.length === 0) {
        updates.activeTool = 'modify'
        updates.statusMessage = 'Select elements before using modify tools'
      } else {
        updates.modifyPhase = createModifyPhase(activeTool)
        updates.statusMessage = modifyStatusMessage(updates.modifyPhase!)
      }
    } else if (activeTool === 'delete') {
      get().deleteSelected()
      updates.activeTool = 'modify'
      updates.statusMessage = 'Elements deleted'
    }
    set(updates)
  },
  setWallTool: (wallTool) => set({ wallTool }),
  setDoorTool: (doorTool) => set({ doorTool }),
  setWindowTool: (windowTool) => set({ windowTool }),
  setGridTool: (gridTool) => set({ gridTool }),
  setSectionTool: (sectionTool) => set({ sectionTool }),
  setRefPlaneTool: (refPlaneTool) => set({ refPlaneTool }),
  setFloorTool: (floorTool) => set({ floorTool }),
  setDimEdit: (dimEdit) => set({ dimEdit }),
  clearDimEdit: () => set({ dimEdit: null }),
  setModifyPhase: (modifyPhase) => set({ modifyPhase }),
  setTypePropertiesOpen: (typePropertiesOpen) => set({ typePropertiesOpen }),
  setSnapDialogOpen: (snapDialogOpen) => set({ snapDialogOpen }),
  setSnapConfig: (snapConfig) => set({ snapConfig }),
  setSnapEnabled: (snapEnabled) => set({ snapEnabled }),
  setTypedDistance: (typedDistance) => set({ typedDistance }),
  setTabCycleHits: (tabCycleHits) => set({ tabCycleHits, tabCycleIndex: 0 }),
  setTabCycleIndex: (tabCycleIndex) => set({ tabCycleIndex }),
  setStatusMessage: (statusMessage) => set({ statusMessage }),
  setCursorModel: (cursorModel) => set({ cursorModel }),
  setShortcutBuffer: (shortcutBuffer) => set({ shortcutBuffer }),
  setAsciiPanelOpen: (asciiPanelOpen) => set({ asciiPanelOpen }),
  setLeftPanelWidth: (leftPanelWidth) => set({ leftPanelWidth }),
  setRibbonCollapsed: (ribbonCollapsed) => set({ ribbonCollapsed }),
  setActiveRibbonTab: (activeRibbonTab) => set({ activeRibbonTab }),
  setViewScale: (viewScale) => set({ viewScale }),
  setDetailLevel: (detailLevel) => set({ detailLevel }),
  setChainWalls: (chainWalls) => set({ chainWalls }),
  setWallHeight: (wallHeight) => set({ wallHeight }),
  setActiveView: (viewId) => {
    const { model } = get()
    const view = model.views.find((v) => v.id === viewId)
    if (!view) return
    set({
      model: { ...model, activeViewId: viewId },
      viewScale: view.scale,
      detailLevel: view.detailLevel,
      statusMessage: `View: ${view.name}`,
    })
    window.dispatchEvent(new Event('td-zoom-all'))
  },

  openElevationFromMarker: (markerId) => {
    const { model } = get()
    const marker = model.elevationMarkers.find((m) => m.id === markerId)
    if (!marker?.linkedViewId) return
    let views = model.views
    if (!views.some((v) => v.id === marker.linkedViewId)) {
      views = [...views, createElevationViewForMarker(model, marker)]
    }
    const view = views.find((v) => v.id === marker.linkedViewId)
    rebuildIndex({ ...model, views })
    set({
      model: { ...model, views, activeViewId: marker.linkedViewId },
      viewScale: view?.scale ?? 100,
      detailLevel: view?.detailLevel ?? 'coarse',
      statusMessage: `Opened ${marker.name}`,
    })
    window.dispatchEvent(new Event('td-zoom-all'))
  },

  openWorkingSection: (sectionId) => {
    const { model } = get()
    const ws = (model.workingSections ?? []).find((w) => w.id === sectionId)
    if (!ws?.linkedViewId) return
    let views = model.views
    if (!views.some((v) => v.id === ws.linkedViewId)) {
      views = [...views, createSectionViewForWorkingSection(model, ws)]
    }
    const view = views.find((v) => v.id === ws.linkedViewId)
    rebuildIndex({ ...model, views })
    set({
      model: { ...model, views, activeViewId: ws.linkedViewId },
      viewScale: view?.scale ?? 100,
      detailLevel: view?.detailLevel ?? 'coarse',
      statusMessage: `Opened ${ws.name} — section cut view`,
    })
    window.dispatchEvent(new Event('td-zoom-all'))
  },

  rebuildSpatialIndex: () => {
    rebuildIndex(get().model)
  },

  placeWall: (wall) => {
    const { model } = get()
    const cmd = new PlaceWallCommand(wall)
    const next = commandStack.push(cmd, model)
    rebuildIndex(next)
    set({ model: next })
  },

  placeDoor: (door) => {
    const { model } = get()
    const cmd = new PlaceDoorCommand(door)
    const next = commandStack.push(cmd, model)
    rebuildIndex(next)
    set({ model: next })
  },

  placeWindow: (window) => {
    const { model } = get()
    const cmd = new PlaceWindowCommand(window)
    const next = commandStack.push(cmd, model)
    rebuildIndex(next)
    set({ model: next })
  },

  placeGrid: (grid) => {
    const { model } = get()
    const cmd = new PlaceGridCommand(grid)
    const next = commandStack.push(cmd, model)
    rebuildIndex(next)
    set({ model: next })
  },

  placeRefPlane: (plane) => {
    const { model } = get()
    const cmd = new PlaceRefPlaneCommand(plane)
    const next = commandStack.push(cmd, model)
    rebuildIndex(next)
    set({ model: next })
  },

  placeWorkingSection: (section, view) => {
    const { model } = get()
    const cmd = new PlaceWorkingSectionCommand(section, view)
    const next = commandStack.push(cmd, model)
    rebuildIndex(next)
    set({ model: next })
  },

  placeColumn: (column) => {
    const { model } = get()
    const cmd = new PlaceColumnCommand(column)
    const next = commandStack.push(cmd, model)
    rebuildIndex(next)
    set({ model: next })
  },

  placeFloor: (floor) => {
    const { model } = get()
    const cmd = new PlaceFloorCommand(floor)
    const next = commandStack.push(cmd, model)
    rebuildIndex(next)
    set({ model: next })
  },

  placeStair: (stair) => {
    const { model } = get()
    const cmd = new PlaceStairCommand(stair)
    const next = commandStack.push(cmd, model)
    rebuildIndex(next)
    set({ model: next })
  },

  placeRoom: (room) => {
    const { model } = get()
    const cmd = new PlaceRoomCommand(room)
    const next = commandStack.push(cmd, model)
    rebuildIndex(next)
    set({ model: next })
  },

  setSelectionFilter: (key, on) => {
    set((s) => ({
      selectionFilters: { ...s.selectionFilters, [key]: on },
    }))
  },

  placeLevel: (point) => {
    const { model } = get()
    const n = model.levels.length + 1
    const elevation = model.levels.length > 0
      ? Math.max(...model.levels.map((l) => l.elevation)) + 3000
      : 0
    const level = {
      id: `lvl-${Date.now()}`,
      name: `Level ${n}`,
      elevation,
      headBubble: true,
      tailBubble: true,
      planLineY: point.y,
    }
    const next = { ...model, levels: [...model.levels, level] }
    get().applyModel(next, 'Place Level')
    set({ statusMessage: `Level placed — ${level.name} @ ${elevation} mm` })
  },

  updateRoomFields: (roomId, fields) => {
    const { model } = get()
    const next = {
      ...model,
      rooms: model.rooms.map((r) =>
        r.id === roomId ? { ...r, ...fields } : r,
      ),
    }
    get().applyModel(next, 'Edit Room')
  },

  updateWallLength: (wallId, newEnd) => {
    const { model } = get()
    const wall = model.walls.find((w) => w.id === wallId)
    if (!wall) return
    const cmd = new UpdateWallEndCommand(wallId, wall.end, newEnd)
    const next = commandStack.push(cmd, model)
    rebuildIndex(next)
    set({ model: next, statusMessage: 'Edit Wall Length' })
  },

  applyModel: (next, description) => {
    const { model } = get()
    const cmd = new ApplyModelCommand(model, next, description)
    const result = commandStack.push(cmd, model)
    rebuildIndex(result)
    set({ model: result })
  },

  newProject: () => {
    const model = createDefaultProject()
    rebuildIndex(model)
    set({
      model,
      selectedIds: [],
      activeTool: 'modify',
      statusMessage: 'New project',
      transform: { ...DEFAULT_TRANSFORM },
    })
    window.dispatchEvent(new Event('td-zoom-all'))
  },

  openProject: async () => {
    const model = await openTdxFile()
    if (!model) return
    rebuildIndex(model)
    set({ model, selectedIds: [], statusMessage: `Opened ${model.name}` })
    window.dispatchEvent(new Event('td-zoom-all'))
  },

  saveProject: () => {
    const { model } = get()
    downloadTdx(model, model.name === 'Untitled' ? 'project.tdx' : `${model.name}.tdx`)
    set({ statusMessage: 'Project saved' })
  },

  deleteSelected: () => {
    const { model, selectedIds } = get()
    if (selectedIds.length === 0) return
    const cmd = new DeleteElementsCommand(model, selectedIds)
    const next = commandStack.push(cmd, model)
    rebuildIndex(next)
    set({ model: next, selectedIds: [], statusMessage: 'Delete' })
  },

  undo: () => {
    const { model } = get()
    const result = commandStack.undo(model)
    if (result.description) {
      rebuildIndex(result.model)
      set({ model: result.model, statusMessage: `Undo: ${result.description}` })
    }
  },

  redo: () => {
    const { model } = get()
    const result = commandStack.redo(model)
    if (result.description) {
      rebuildIndex(result.model)
      set({ model: result.model, statusMessage: `Redo: ${result.description}` })
    }
  },
}))

export { generateId } from '../utils/id'

export function activeLevelId(model: ProjectModel): string {
  return (
    model.views.find((v) => v.id === model.activeViewId)?.levelId ?? 'lvl-1'
  )
}
