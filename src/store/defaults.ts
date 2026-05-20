import type { ProjectModel } from '../engine/types'
import {
  createLandingElevationMarkers,
  createLandingReferencePlanes,
  createLandingScopeBox,
  createLandingViewAnnotations,
  createLandingWorkingSection,
  LANDING_FLOOR_PLAN_BOX,
  LANDING_SCOPE_ID,
  LANDING_VIEW_FP_ID,
} from '../engine/datumGeometry'
import { REVIT_ANNOTATION_BOX, REVIT_SCOPE_CENTER } from '../engine/revitLandingLayout'

export function createDefaultProject(): ProjectModel {
  const levelId = 'lvl-1'
  const scopeBox = createLandingScopeBox()
  const referencePlanes = createLandingReferencePlanes()
  const elevationMarkers = createLandingElevationMarkers(levelId)
  const workingSection = createLandingWorkingSection(levelId)
  const viewAnnotations = createLandingViewAnnotations(LANDING_VIEW_FP_ID, 100)

  return {
    name: 'Untitled',
    activeViewId: LANDING_VIEW_FP_ID,
    levels: [
      {
        id: 'lvl-1',
        name: 'Level 1',
        elevation: 0,
        headBubble: true,
        tailBubble: true,
        planLineY: REVIT_SCOPE_CENTER.y - 3500,
      },
      {
        id: 'lvl-2',
        name: 'Level 2',
        elevation: 3000,
        headBubble: true,
        tailBubble: true,
        planLineY: REVIT_SCOPE_CENTER.y + 3500,
      },
    ],
    scopeBoxes: [scopeBox],
    elevationMarkers,
    workingSections: [workingSection],
    viewAnnotations,
    grids: [],
    walls: [],
    doors: [],
    windows: [],
    rooms: [],
    columns: [],
    floors: [],
    stairs: [],
    referencePlanes,
    dimensions: [],
    textNotes: [],
    views: [
      {
        id: LANDING_VIEW_FP_ID,
        name: 'L1 - Architectural',
        type: 'floor-plan',
        levelId,
        scale: 100,
        detailLevel: 'coarse',
        cropRegion: { ...LANDING_FLOOR_PLAN_BOX },
        annotationCropRegion: { ...REVIT_ANNOTATION_BOX },
        scopeBoxId: LANDING_SCOPE_ID,
        hiddenElementIds: [],
      },
      {
        id: 'view-fp-level-2',
        name: 'L2 - Architectural',
        type: 'floor-plan',
        levelId: 'lvl-2',
        scale: 100,
        detailLevel: 'coarse',
        hiddenElementIds: [],
      },
      {
        id: 'elevation-view-north',
        name: 'North Elevation',
        type: 'elevation',
        levelId,
        scale: 100,
        detailLevel: 'coarse',
        elevationMarkerId: 'elev-marker-north',
        scopeBoxId: LANDING_SCOPE_ID,
        hiddenElementIds: [],
      },
      {
        id: 'elevation-view-south',
        name: 'South Elevation',
        type: 'elevation',
        levelId,
        scale: 100,
        detailLevel: 'coarse',
        elevationMarkerId: 'elev-marker-south',
        scopeBoxId: LANDING_SCOPE_ID,
        hiddenElementIds: [],
      },
      {
        id: 'elevation-view-east',
        name: 'East Elevation',
        type: 'elevation',
        levelId,
        scale: 100,
        detailLevel: 'coarse',
        elevationMarkerId: 'elev-marker-east',
        scopeBoxId: LANDING_SCOPE_ID,
        hiddenElementIds: [],
      },
      {
        id: 'elevation-view-west',
        name: 'West Elevation',
        type: 'elevation',
        levelId,
        scale: 100,
        detailLevel: 'coarse',
        elevationMarkerId: 'elev-marker-west',
        scopeBoxId: LANDING_SCOPE_ID,
        hiddenElementIds: [],
      },
      {
        id: 'section-view-ws-1',
        name: 'Working Section 1',
        type: 'section',
        levelId,
        scale: 100,
        detailLevel: 'coarse',
        workingSectionId: workingSection.id,
        scopeBoxId: LANDING_SCOPE_ID,
        hiddenElementIds: [],
      },
    ],
    wallTypes: [
      {
        id: 'basic-wall-200',
        family: 'Basic Wall',
        name: 'Generic - 200mm',
        thickness: 200,
        layers: [
          { function: 'finish1', material: 'Gypsum', thickness: 15 },
          { function: 'structure', material: 'Concrete', thickness: 170 },
          { function: 'finish2', material: 'Gypsum', thickness: 15 },
        ],
      },
      {
        id: 'basic-wall-150',
        family: 'Basic Wall',
        name: 'Generic - 150mm',
        thickness: 150,
        layers: [{ function: 'structure', material: 'Concrete', thickness: 150 }],
      },
      {
        id: 'basic-wall-100',
        family: 'Basic Wall',
        name: 'Generic - 100mm',
        thickness: 100,
        layers: [{ function: 'structure', material: 'Concrete', thickness: 100 }],
      },
    ],
    doorTypes: [
      {
        id: 'door-single-flush-900x2100',
        family: 'Single Flush',
        name: '0915 x 2134mm',
        width: 900,
        height: 2100,
      },
    ],
    windowTypes: [
      {
        id: 'window-fixed-915x1220',
        family: 'Fixed',
        name: '0915 x 1220mm',
        width: 915,
        height: 1220,
      },
    ],
  }
}
