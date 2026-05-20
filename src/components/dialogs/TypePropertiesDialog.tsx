import { useProjectStore } from '../../store/projectStore'

export function TypePropertiesDialog() {
  const open = useProjectStore((s) => s.typePropertiesOpen)
  const setOpen = useProjectStore((s) => s.setTypePropertiesOpen)
  const model = useProjectStore((s) => s.model)
  const selectedIds = useProjectStore((s) => s.selectedIds)

  if (!open) return null

  const wall =
    selectedIds.length === 1 ? model.walls.find((w) => w.id === selectedIds[0]) : null
  const wallType = wall ? model.wallTypes.find((t) => t.id === wall.typeId) : null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-[480px] -translate-x-1/2 -translate-y-1/2 rounded border shadow-xl"
        style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-panel)' }}
      >
        <header
          className="flex items-center justify-between border-b px-4 py-2"
          style={{ borderColor: 'var(--border-panel)' }}
        >
          <span className="font-semibold">Type Properties</span>
          <button type="button" onClick={() => setOpen(false)}>
            ✕
          </button>
        </header>
        <div className="space-y-3 p-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span style={{ color: 'var(--text-secondary)' }}>Family:</span>
            <span>{wallType?.family ?? '—'}</span>
            <span style={{ color: 'var(--text-secondary)' }}>Type:</span>
            <span>{wallType?.name ?? '—'}</span>
          </div>
          <div className="border-t pt-2" style={{ borderColor: 'var(--border-panel)' }}>
            <p className="mb-2 text-xs font-bold">Construction</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Thickness — {wallType?.thickness ?? '—'} mm
            </p>
          </div>
        </div>
        <footer
          className="flex justify-end gap-2 border-t px-4 py-2"
          style={{ borderColor: 'var(--border-panel)' }}
        >
          <button
            type="button"
            className="rounded px-3 py-1 text-xs"
            style={{ background: 'var(--btn-active)', border: '1px solid var(--btn-active-border)' }}
            onClick={() => setOpen(false)}
          >
            OK
          </button>
        </footer>
      </div>
    </>
  )
}
