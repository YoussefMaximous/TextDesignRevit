import type { ProjectModel } from './types'
import type { RenderOverlay } from '../renderer/ViewportRenderer'
import {
  computeWallSelectionDims,
  selectionGrips,
} from './tempDimensions'

export function buildSelectionOverlay(
  model: ProjectModel,
  selectedIds: string[],
  highlightDimId?: string,
): Partial<RenderOverlay> {
  if (selectedIds.length !== 1) return {}
  const wall = model.walls.find((w) => w.id === selectedIds[0])
  if (!wall) return {}
  return {
    selectionTempDims: computeWallSelectionDims(wall, model),
    selectionGrips: selectionGrips(wall),
    highlightDimId,
  }
}
