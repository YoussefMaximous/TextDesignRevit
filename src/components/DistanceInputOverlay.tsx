import { parseLengthInput } from '../engine/tempDimensions'
import { pointAtDistance } from '../engine/geometry'
import { useProjectStore } from '../store/projectStore'

export function DistanceInputOverlay() {
  const typedDistance = useProjectStore((s) => s.typedDistance)
  const wallTool = useProjectStore((s) => s.wallTool)
  const cursorModel = useProjectStore((s) => s.cursorModel)
  const transform = useProjectStore((s) => s.transform)
  if (wallTool.phase !== 'placing' || !typedDistance) return null

  const mm = parseLengthInput(typedDistance)
  const label = mm !== null ? `${Math.round(mm)} mm` : typedDistance

  const [cx, cy] = [
    transform.originX + cursorModel.x * transform.scale,
    transform.originY - cursorModel.y * transform.scale,
  ]

  return (
    <div
      className="pointer-events-none absolute z-20 rounded border px-2 py-0.5 text-xs font-mono"
      style={{
        left: cx + 12,
        top: cy - 24,
        background: 'var(--bg-panel)',
        borderColor: 'var(--btn-active-border)',
        color: 'var(--temp-dim-text)',
      }}
    >
      {label} — Enter to place
    </div>
  )
}

export function useWallDistanceCommit() {
  const wallTool = useProjectStore((s) => s.wallTool)
  const typedDistance = useProjectStore((s) => s.typedDistance)
  const setTypedDistance = useProjectStore((s) => s.setTypedDistance)

  return (cursor: { x: number; y: number }): { x: number; y: number } | null => {
    if (wallTool.phase !== 'placing' || !typedDistance) return null
    const mm = parseLengthInput(typedDistance)
    if (mm === null || mm < 50) return null
    const end = pointAtDistance(wallTool.start, cursor, mm)
    setTypedDistance('')
    return end
  }
}
