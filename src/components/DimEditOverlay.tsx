import { useEffect, useRef } from 'react'
import { parseLengthInput, wallEndFromLength } from '../engine/tempDimensions'
import { useProjectStore } from '../store/projectStore'

export function DimEditOverlay() {
  const dimEdit = useProjectStore((s) => s.dimEdit)
  const setDimEdit = useProjectStore((s) => s.setDimEdit)
  const clearDimEdit = useProjectStore((s) => s.clearDimEdit)
  const updateWallLength = useProjectStore((s) => s.updateWallLength)
  const model = useProjectStore((s) => s.model)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (dimEdit) inputRef.current?.focus()
  }, [dimEdit])

  if (!dimEdit) return null

  const wall = model.walls.find((w) => w.id === dimEdit.wallId)
  if (!wall) return null

  const commit = () => {
    const mm = parseLengthInput(dimEdit.currentValue)
    if (mm !== null && mm > 50) {
      updateWallLength(wall.id, wallEndFromLength(wall, mm))
    }
    clearDimEdit()
  }

  return (
    <div
      className="pointer-events-auto absolute z-20"
      style={{ left: dimEdit.screenX, top: dimEdit.screenY }}
    >
      <input
        ref={inputRef}
        type="text"
        value={dimEdit.currentValue}
        onChange={(e) =>
          setDimEdit({ ...dimEdit, currentValue: e.target.value })
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            clearDimEdit()
          }
        }}
        onBlur={commit}
        className="w-24 rounded border px-1 py-0.5 text-xs"
        style={{
          background: 'var(--bg-panel)',
          borderColor: 'var(--btn-active-border)',
          color: 'var(--temp-dim-text)',
        }}
      />
    </div>
  )
}
