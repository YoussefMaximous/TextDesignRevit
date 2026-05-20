import { useProjectStore } from '../store/projectStore'
import type { ToolId } from '../engine/types'

const barClass = 'flex h-7 shrink-0 items-center gap-4 border-b px-3'
const barStyle = {
  background: 'var(--bg-panel)',
  borderColor: 'var(--border-panel)',
}

const TOOL_HINTS: Partial<Record<ToolId, string>> = {
  modify: 'Modify | Select elements · Box select · Tab cycle · Delete',
  wall: 'Architecture | Wall — click start, click end · Chain · Shift = orthogonal',
  door: 'Architecture | Door — click on wall · Spacebar flips handedness',
  window: 'Architecture | Window — click on wall',
  room: 'Architecture | Room — click inside enclosed boundary',
  grid: 'Architecture | Grid — click start, click end · Shift = orthogonal',
  level: 'Architecture | Level — click to add level to project',
  section: 'View | Section — click start, click end (full crop span)',
  'reference-plane': 'Work Plane | Reference Plane — clipped to scope box',
  column: 'Architecture | Column — click to place (450×450 mm)',
  floor: 'Architecture | Floor — click two corners (min 500 mm)',
  stair: 'Architecture | Stair — click to place plan symbol',
  move: 'Modify | Move — click base point, then destination',
  copy: 'Modify | Copy — click base point, then destination',
  rotate: 'Modify | Rotate — click center, then angle point',
  mirror: 'Modify | Mirror — pick mirror axis',
  align: 'Modify | Align — pick reference then target',
  trim: 'Modify | Trim — click trim line',
  split: 'Modify | Split — click on element to split',
}

export function OptionsBar() {
  const activeTool = useProjectStore((s) => s.activeTool)
  const chainWalls = useProjectStore((s) => s.chainWalls)
  const setChainWalls = useProjectStore((s) => s.setChainWalls)
  const wallHeight = useProjectStore((s) => s.wallHeight)
  const setWallHeight = useProjectStore((s) => s.setWallHeight)

  if (activeTool === 'wall') {
    return (
      <div className={barClass} style={barStyle}>
        <label className="flex items-center gap-1 text-xs">
          Height:
          <input
            type="number"
            value={wallHeight}
            onChange={(e) => setWallHeight(Number(e.target.value))}
            className="w-16 rounded border px-1 py-0.5"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-panel)',
            }}
          />
          mm
        </label>
        <label className="flex items-center gap-1 text-xs">
          Location Line:
          <select
            className="rounded border px-1 py-0.5"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-panel)',
            }}
            defaultValue="wall-centerline"
          >
            <option value="wall-centerline">Wall Centerline</option>
            <option value="core-centerline">Core Centerline</option>
            <option value="finish-face-exterior">Finish Face: Exterior</option>
          </select>
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={chainWalls}
            onChange={(e) => setChainWalls(e.target.checked)}
          />
          Chain
        </label>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Draw: Line · Shift orthogonal
        </span>
      </div>
    )
  }

  return (
    <div className={barClass} style={barStyle}>
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        {TOOL_HINTS[activeTool] ?? `${activeTool} tool`}
      </span>
    </div>
  )
}
