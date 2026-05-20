import { useCallback } from 'react'
import type { Point2D } from '../engine/types'
import {
  alignWallToReference,
  copyElements,
  mirrorElements,
  moveElements,
  rotateElements,
  splitWallAtPoint,
  trimWallToPoint,
} from '../engine/modifyOps'
import { modifyStatusMessage } from '../engine/modifyToolState'
import { pickAtPoint } from '../engine/selection'
import { distance } from '../engine/geometry'
import { useProjectStore } from '../store/projectStore'

const MODIFY_TOOLS = new Set([
  'move',
  'copy',
  'rotate',
  'mirror',
  'align',
  'trim',
  'split',
])

export function isModifyTool(tool: string): boolean {
  return MODIFY_TOOLS.has(tool)
}

export function useModifyTools() {
  const model = useProjectStore((s) => s.model)
  const activeTool = useProjectStore((s) => s.activeTool)
  const selectedIds = useProjectStore((s) => s.selectedIds)
  const modifyPhase = useProjectStore((s) => s.modifyPhase)
  const setModifyPhase = useProjectStore((s) => s.setModifyPhase)
  const applyModel = useProjectStore((s) => s.applyModel)
  const setActiveTool = useProjectStore((s) => s.setActiveTool)
  const setStatusMessage = useProjectStore((s) => s.setStatusMessage)
  const spatialIndex = useProjectStore((s) => s.spatialIndex)

  const handleModifyClick = useCallback(
    (pt: Point2D): boolean => {
      if (!isModifyTool(activeTool) || !modifyPhase) return false

      const phase = modifyPhase

      if (phase.tool === 'move' || phase.tool === 'copy') {
        if (phase.step === 0) {
          setModifyPhase({ ...phase, step: 1, pointA: pt })
          setStatusMessage(modifyStatusMessage({ ...phase, step: 1 }))
          return true
        }
        if (phase.step === 1 && phase.pointA) {
          const delta = { x: pt.x - phase.pointA.x, y: pt.y - phase.pointA.y }
          const next =
            phase.tool === 'move'
              ? moveElements(model, selectedIds, delta)
              : copyElements(model, selectedIds, delta)
          applyModel(next, phase.tool === 'move' ? 'Move' : 'Copy')
          setModifyPhase(null)
          setActiveTool('modify')
          return true
        }
      }

      if (phase.tool === 'rotate') {
        if (phase.step === 0) {
          setModifyPhase({ ...phase, step: 1, pointA: pt })
          setStatusMessage(modifyStatusMessage({ ...phase, step: 1 }))
          return true
        }
        if (phase.step === 1) {
          setModifyPhase({ ...phase, step: 2, pointB: pt })
          setStatusMessage(modifyStatusMessage({ ...phase, step: 2 }))
          return true
        }
        if (phase.step === 2 && phase.pointA && phase.pointB) {
          const a1 = Math.atan2(phase.pointB.y - phase.pointA.y, phase.pointB.x - phase.pointA.x)
          const a2 = Math.atan2(pt.y - phase.pointA.y, pt.x - phase.pointA.x)
          const next = rotateElements(model, selectedIds, phase.pointA, a2 - a1)
          applyModel(next, 'Rotate')
          setModifyPhase(null)
          setActiveTool('modify')
          return true
        }
      }

      if (phase.tool === 'mirror') {
        if (phase.step === 0) {
          setModifyPhase({ ...phase, step: 1, pointA: pt })
          setStatusMessage(modifyStatusMessage({ ...phase, step: 1 }))
          return true
        }
        if (phase.step === 1 && phase.pointA) {
          const next = mirrorElements(model, selectedIds, phase.pointA, pt)
          applyModel(next, 'Mirror')
          setModifyPhase(null)
          setActiveTool('modify')
          return true
        }
      }

      if (phase.tool === 'align') {
        const nearby = spatialIndex.queryRadius(pt, 200)
        const activeView = model.views.find((v) => v.id === model.activeViewId)
        const hits = pickAtPoint(model, nearby, pt, activeView)
        if (phase.step === 0 && hits.length > 0) {
          setModifyPhase({ ...phase, step: 1, referenceId: hits[0].elementId })
          setStatusMessage(modifyStatusMessage({ ...phase, step: 1 }))
          return true
        }
        if (phase.step === 1 && phase.referenceId) {
          const nearby2 = spatialIndex.queryRadius(pt, 200)
          const hits2 = pickAtPoint(model, nearby2, pt, activeView)
          if (hits2.length === 0) return true
          const targetId = hits2[0].elementId
          const next = alignWallToReference(model, targetId, phase.referenceId)
          if (next) applyModel(next, 'Align')
          setModifyPhase(null)
          setActiveTool('modify')
          return true
        }
      }

      if (phase.tool === 'trim') {
        const nearby = spatialIndex.queryRadius(pt, 200)
        const activeView = model.views.find((v) => v.id === model.activeViewId)
        const hits = pickAtPoint(model, nearby, pt, activeView)
        const wallHit = hits.find((h) => h.elementType === 'wall')
        if (!wallHit) return true
        if (phase.step === 0) {
          setModifyPhase({ ...phase, step: 1, referenceId: wallHit.elementId })
          setStatusMessage(modifyStatusMessage({ ...phase, step: 1 }))
          return true
        }
        if (phase.step === 1 && phase.referenceId) {
          const wall = model.walls.find((w) => w.id === wallHit.elementId)
          const boundary = model.walls.find((w) => w.id === phase.referenceId)
          if (wall && boundary) {
            const keepStart =
              distance(pt, wall.start) < distance(pt, wall.end)
            const next = trimWallToPoint(model, wall.id, pt, keepStart)
            if (next) applyModel(next, 'Trim/Extend')
          }
          setModifyPhase(null)
          setActiveTool('modify')
          return true
        }
      }

      if (phase.tool === 'split') {
        const nearby = spatialIndex.queryRadius(pt, 200)
        const activeView = model.views.find((v) => v.id === model.activeViewId)
        const hits = pickAtPoint(model, nearby, pt, activeView)
        const wallHit = hits.find((h) => h.elementType === 'wall')
        if (wallHit) {
          const next = splitWallAtPoint(model, wallHit.elementId, pt)
          if (next) applyModel(next, 'Split Element')
        }
        setModifyPhase(null)
        setActiveTool('modify')
        return true
      }

      return true
    },
    [
      activeTool,
      modifyPhase,
      model,
      selectedIds,
      setModifyPhase,
      setStatusMessage,
      applyModel,
      setActiveTool,
      spatialIndex,
    ],
  )

  return { handleModifyClick, isModifyTool: isModifyTool(activeTool) }
}
