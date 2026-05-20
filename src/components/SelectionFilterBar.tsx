import { useProjectStore } from '../store/projectStore'
import type { SelectionFilters } from '../engine/selection'

const FILTERS: { key: keyof SelectionFilters; label: string; title: string }[] = [
  { key: 'walls', label: 'W', title: 'Walls' },
  { key: 'doors', label: 'D', title: 'Doors' },
  { key: 'windows', label: 'WN', title: 'Windows' },
  { key: 'columns', label: 'C', title: 'Columns' },
  { key: 'floors', label: 'FL', title: 'Floors' },
  { key: 'stairs', label: 'ST', title: 'Stairs' },
  { key: 'grids', label: 'G', title: 'Grids' },
  { key: 'datums', label: 'DT', title: 'Datums (ref planes, sections, markers)' },
]

export function SelectionFilterBar() {
  const filters = useProjectStore((s) => s.selectionFilters)
  const setSelectionFilter = useProjectStore((s) => s.setSelectionFilter)

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 border-l pl-2"
      style={{ borderColor: 'var(--border-panel)' }}
      title="Selection filter (Revit status bar)"
    >
      {FILTERS.map(({ key, label, title }) => {
        const on = filters[key]
        return (
          <button
            key={key}
            type="button"
            title={title}
            className="min-w-[22px] rounded px-1 py-0.5 text-[10px] font-semibold"
            style={{
              background: on ? 'var(--bg-ribbon)' : 'transparent',
              color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
              opacity: on ? 1 : 0.45,
              border: on ? '1px solid var(--border-panel)' : '1px solid transparent',
            }}
            onClick={() => setSelectionFilter(key, !on)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
