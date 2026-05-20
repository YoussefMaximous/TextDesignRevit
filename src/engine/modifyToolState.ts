import type { Point2D, ToolId } from './types'

export type ModifyStep = 0 | 1 | 2

export interface ModifyToolPhase {
  tool: ToolId
  step: ModifyStep
  pointA?: Point2D
  pointB?: Point2D
  referenceId?: string
}

export function createModifyPhase(tool: ToolId): ModifyToolPhase {
  return { tool, step: 0 }
}

export function modifyStatusMessage(phase: ModifyToolPhase): string {
  switch (phase.tool) {
    case 'move':
      return phase.step === 0 ? 'Click move base point' : 'Click move destination'
    case 'copy':
      return phase.step === 0 ? 'Click copy base point' : 'Click copy destination'
    case 'rotate':
      if (phase.step === 0) return 'Click rotation center'
      if (phase.step === 1) return 'Click start angle point'
      return 'Click end angle point'
    case 'mirror':
      return phase.step === 0 ? 'Click mirror axis start' : 'Click mirror axis end'
    case 'align':
      return phase.step === 0 ? 'Click reference element' : 'Click element to align'
    case 'trim':
      return phase.step === 0 ? 'Click trim boundary wall' : 'Click wall segment to trim'
    case 'split':
      return 'Click point on wall to split'
    default:
      return ''
  }
}
