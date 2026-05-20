/**
 * Revit 2024 empty architectural floor plan layout (2D mm at 1:100).
 * Calibrated to match crop / annotation crop / symbol proportions on default template.
 */
import type { BBox, Point2D } from './types'

/** Floor plan crop — solid black outer border (~30×22 m typical metric sheet at 1:100). */
export const REVIT_CROP_BOX: BBox = {
  minX: 0,
  minY: 0,
  maxX: 30000,
  maxY: 22000,
}

/** Annotation crop inset from plan crop (dashed grey inner). */
export const REVIT_ANNOTATION_INSET_MM = 1800

export function revitAnnotationCrop(crop: BBox = REVIT_CROP_BOX): BBox {
  return {
    minX: crop.minX + REVIT_ANNOTATION_INSET_MM,
    minY: crop.minY + REVIT_ANNOTATION_INSET_MM,
    maxX: crop.maxX - REVIT_ANNOTATION_INSET_MM,
    maxY: crop.maxY - REVIT_ANNOTATION_INSET_MM,
  }
}

export const REVIT_ANNOTATION_BOX = revitAnnotationCrop()

/** Datum extent / scope visibility matches annotation crop (Revit default). */
export const REVIT_SCOPE_BOX: BBox = { ...REVIT_ANNOTATION_BOX }

export const REVIT_SCOPE_ID = 'scope-landing'
export const REVIT_VIEW_FP_ID = 'view-fp-level-1'

export const REVIT_SCOPE_CENTER: Point2D = {
  x: (REVIT_SCOPE_BOX.minX + REVIT_SCOPE_BOX.maxX) / 2,
  y: (REVIT_SCOPE_BOX.minY + REVIT_SCOPE_BOX.maxY) / 2,
}

/** Elevation marker center — outside annotation crop, inside plan crop. */
export const REVIT_ELEVATION_OUTWARD = 1100

/** Section line inset from annotation crop edge (bubble sits outside). */
export const REVIT_SECTION_END_INSET = 400

/** Working section on default template — through view center (horizontal ref plane). */
export function revitWorkingSectionY(): number {
  return REVIT_SCOPE_CENTER.y
}

export function revitNorthArrowPosition(): Point2D {
  const a = REVIT_ANNOTATION_BOX
  return {
    x: a.maxX - 2200,
    y: a.minY + 2000,
  }
}

export function revitScaleBarPosition(): Point2D {
  const n = revitNorthArrowPosition()
  return { x: n.x - 3800, y: n.y - 150 }
}

export function getRevitLandingBBox(): BBox {
  return { ...REVIT_CROP_BOX }
}
