export interface Point2D {
  x: number
  y: number
}

export interface BBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface Wall {
  id: string
  typeId: string
  levelId: string
  start: Point2D
  end: Point2D
  thickness: number
  height: number
  locationLine: LocationLine
  baseOffset: number
  topOffset: number
  hostedIds: string[]
  joinStatus: 'allow' | 'disallow'
  flipped: boolean
}

export type LocationLine =
  | 'wall-centerline'
  | 'core-centerline'
  | 'finish-face-exterior'
  | 'finish-face-interior'
  | 'core-face-exterior'
  | 'core-face-interior'

export interface Door {
  id: string
  typeId: string
  levelId: string
  hostWallId: string
  offsetFromStart: number
  width: number
  height: number
  handedness: 'left' | 'right'
  swingAngle: number
  sillHeight: number
}

export interface Window {
  id: string
  typeId: string
  levelId: string
  hostWallId: string
  offsetFromStart: number
  width: number
  height: number
  sillHeight: number
}

export interface Room {
  id: string
  name: string
  number: string
  levelId: string
  area: number
  perimeter: number
  tagPosition: Point2D
  boundaryWallIds: string[]
}

export interface Column {
  id: string
  typeId: string
  levelId: string
  position: Point2D
  rotation: number
  /** Plan footprint width (mm). */
  width: number
  /** Plan footprint depth (mm). */
  depth: number
}

/** 2D floor slab footprint on plan (no 3D). */
export interface Floor {
  id: string
  levelId: string
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** 2D stair plan symbol (no 3D). */
export interface Stair {
  id: string
  levelId: string
  position: Point2D
  rotation: number
  width: number
  depth: number
}

export interface Grid {
  id: string
  name: string
  start: Point2D
  end: Point2D
  bubbleEnd: 'start' | 'end' | 'both'
  extentStart: number
  extentEnd: number
  /** When set, grid only displays in views tied to this scope box. */
  scopeBoxId?: string
}

/** 3D volume (2D footprint in plan) that clips datum visibility per view. */
export interface ScopeBox {
  id: string
  name: string
  minX: number
  minY: number
  maxX: number
  maxY: number
  minZ: number
  maxZ: number
  datumIds: string[]
}

export type ElevationDirection = 'north' | 'south' | 'east' | 'west'

/** Plan symbol that defines where an elevation view is generated from. */
export interface ElevationMarker {
  id: string
  name: string
  position: Point2D
  lookTarget: Point2D
  direction: ElevationDirection
  scopeBoxId?: string
  linkedViewId?: string
  levelId: string
}

export type WorkingSectionOrientation = 'horizontal' | 'vertical'

/**
 * Working section — a section cut line on plan (dotted blue), not a reference plane.
 * Defines where a section view cuts through the building for design/analysis.
 */
export interface WorkingSection {
  id: string
  name: string
  start: Point2D
  end: Point2D
  orientation: WorkingSectionOrientation
  levelId: string
  scopeBoxId?: string
  linkedViewId?: string
  /** When true, section tail/flip is on the opposite side. */
  flipped: boolean
}

export interface Level {
  id: string
  name: string
  elevation: number
  headBubble: boolean
  tailBubble: boolean
  /** Plan symbol Y (mm) — horizontal level line with bubbles on floor plans. */
  planLineY?: number
}

export type ReferencePlanePurpose = 'work-plane' | 'alignment' | 'elevation-anchor'

/** Revit displays ref planes as colored long-dashed lines (no bubbles). */
export type ReferencePlaneTint = 'green' | 'red'

export interface ReferencePlane {
  id: string
  name: string
  start: Point2D
  end: Point2D
  scopeBoxId?: string
  purpose?: ReferencePlanePurpose
  tint?: ReferencePlaneTint
}

export interface Dimension {
  id: string
  references: DimReference[]
  offsetDistance: number
  segments: DimSegment[]
}

export interface DimReference {
  elementId: string
  face: 'start' | 'end' | 'center' | 'face1' | 'face2'
  point?: Point2D
}

export interface DimSegment {
  startPoint: Point2D
  endPoint: Point2D
  valueText: string
  locked: boolean
  equalityConstrained: boolean
}

export interface TextNote {
  id: string
  position: Point2D
  text: string
  rotation: number
  width: number
}

export interface WallType {
  id: string
  family: string
  name: string
  thickness: number
  layers: WallLayer[]
}

export interface WallLayer {
  function: 'finish1' | 'thermal' | 'substrate' | 'structure' | 'finish2'
  material: string
  thickness: number
}

export interface DoorType {
  id: string
  family: string
  name: string
  width: number
  height: number
}

export interface WindowType {
  id: string
  family: string
  name: string
  width: number
  height: number
}

export type ViewType = 'floor-plan' | 'ceiling-plan' | 'elevation' | 'section'

export type ViewAnnotationKind = 'north-arrow' | 'scale-bar'

/** Plan annotation (north arrow, scale bar) — selectable, deletable, per view. */
export interface ViewAnnotation {
  id: string
  viewId: string
  kind: ViewAnnotationKind
  position: Point2D
  scaleRatio: number
}

export interface View {
  id: string
  name: string
  type: ViewType
  levelId?: string
  scale: number
  detailLevel: 'coarse' | 'medium' | 'fine'
  /** View crop boundary (floor plan sheet outline). */
  cropRegion?: BBox
  /** Annotation crop — dashed grey inner (Revit). */
  annotationCropRegion?: BBox
  scopeBoxId?: string
  /** @deprecated Use viewAnnotations */
  northArrowPosition?: Point2D
  hiddenElementIds: string[]
  /** Elevation view created from a plan marker. */
  elevationMarkerId?: string
  /** Section view created from a working section line. */
  workingSectionId?: string
}

export interface ProjectModel {
  name: string
  activeViewId: string
  levels: Level[]
  scopeBoxes: ScopeBox[]
  elevationMarkers: ElevationMarker[]
  workingSections: WorkingSection[]
  viewAnnotations: ViewAnnotation[]
  grids: Grid[]
  walls: Wall[]
  doors: Door[]
  windows: Window[]
  rooms: Room[]
  columns: Column[]
  floors: Floor[]
  stairs: Stair[]
  referencePlanes: ReferencePlane[]
  dimensions: Dimension[]
  textNotes: TextNote[]
  views: View[]
  wallTypes: WallType[]
  doorTypes: DoorType[]
  windowTypes: WindowType[]
}

export type SnapType =
  | 'endpoint'
  | 'midpoint'
  | 'intersection'
  | 'center'
  | 'perpendicular'
  | 'parallel'
  | 'tangent'
  | 'quadrant'
  | 'nearest'
  | 'workplane-grid'
  | 'length-snap'
  | 'angle-snap'

export interface SnapCandidate {
  point: Point2D
  type: SnapType
  elementId?: string
  distance: number
}

export interface SnapResult {
  snapped: boolean
  point: Point2D
  candidate?: SnapCandidate
}

export interface SnapConfig {
  endpoints: boolean
  midpoints: boolean
  intersections: boolean
  perpendicular: boolean
  nearest: boolean
  centers: boolean
  lengthIncrements: number[]
  angleIncrements: number[]
}

export type ToolId =
  | 'modify'
  | 'wall'
  | 'door'
  | 'window'
  | 'room'
  | 'grid'
  | 'column'
  | 'floor'
  | 'stair'
  | 'section'
  | 'level'
  | 'reference-plane'
  | 'move'
  | 'copy'
  | 'rotate'
  | 'mirror'
  | 'align'
  | 'trim'
  | 'split'
  | 'delete'

export type WallToolState =
  | { phase: 'idle' }
  | { phase: 'active' }
  | {
      phase: 'placing'
      start: Point2D
      chain: boolean
    }

export type HostedToolState =
  | { phase: 'idle' }
  | { phase: 'active' }
  | {
      phase: 'hovering'
      hostWallId: string
      offsetFromStart: number
      handedness: 'left' | 'right'
    }

export type GridToolState =
  | { phase: 'idle' }
  | { phase: 'active' }
  | { phase: 'placing'; start: Point2D }

export type SectionToolState =
  | { phase: 'idle' }
  | { phase: 'active' }
  | { phase: 'placing'; start: Point2D }

export type RefPlaneToolState =
  | { phase: 'idle' }
  | { phase: 'active' }
  | { phase: 'placing'; start: Point2D }

export type FloorToolState =
  | { phase: 'idle' }
  | { phase: 'active' }
  | { phase: 'placing'; start: Point2D }

export interface DimEditState {
  wallId: string
  dimId: string
  screenX: number
  screenY: number
  currentValue: string
}

export interface ToolState {
  activeTool: ToolId
  wall: WallToolState
  drawingStart?: Point2D
}
