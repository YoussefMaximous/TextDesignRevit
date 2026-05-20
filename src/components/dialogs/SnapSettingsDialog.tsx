import { useProjectStore } from '../../store/projectStore'

export function SnapSettingsDialog() {
  const open = useProjectStore((s) => s.snapDialogOpen)
  const setOpen = useProjectStore((s) => s.setSnapDialogOpen)
  const snapConfig = useProjectStore((s) => s.snapConfig)
  const snapEnabled = useProjectStore((s) => s.snapEnabled)
  const setSnapConfig = useProjectStore((s) => s.setSnapConfig)
  const setSnapEnabled = useProjectStore((s) => s.setSnapEnabled)

  if (!open) return null

  const toggle = (key: keyof typeof snapConfig) => {
    if (typeof snapConfig[key] === 'boolean') {
      setSnapConfig({ ...snapConfig, [key]: !snapConfig[key] })
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-[400px] -translate-x-1/2 -translate-y-1/2 rounded border p-4 shadow-xl"
        style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-panel)' }}
      >
        <h2 className="mb-3 font-semibold">Snaps</h2>
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={snapEnabled}
            onChange={(e) => setSnapEnabled(e.target.checked)}
          />
          Snapping enabled (SS)
        </label>
        <div className="space-y-1 text-sm">
          {(
            [
              ['endpoints', 'Endpoints (SE)'],
              ['midpoints', 'Midpoints (SM)'],
              ['intersections', 'Intersections (SI)'],
              ['perpendicular', 'Perpendicular (SP)'],
              ['nearest', 'Nearest (SN)'],
              ['centers', 'Centers (SC)'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={snapConfig[key]}
                onChange={() => toggle(key)}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="rounded px-3 py-1 text-xs"
            style={{
              background: 'var(--btn-active)',
              border: '1px solid var(--btn-active-border)',
            }}
            onClick={() => setOpen(false)}
          >
            OK
          </button>
        </div>
      </div>
    </>
  )
}


