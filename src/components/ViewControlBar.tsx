import { useProjectStore } from '../store/projectStore'

const SCALES = [50, 100, 200, 500, 1000]

export function ViewControlBar() {
  const viewScale = useProjectStore((s) => s.viewScale)
  const setViewScale = useProjectStore((s) => s.setViewScale)
  const detailLevel = useProjectStore((s) => s.detailLevel)
  const setDetailLevel = useProjectStore((s) => s.setDetailLevel)
  const setAsciiPanelOpen = useProjectStore((s) => s.setAsciiPanelOpen)

  const btn =
    'rounded px-1.5 py-0.5 text-xs hover:bg-[var(--btn-hover)] disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div
      className="flex h-[26px] shrink-0 items-center gap-2 border-t px-2"
      style={{
        background: 'var(--bg-panel)',
        borderColor: 'var(--border-panel)',
      }}
    >
      <select
        className="rounded border px-1 py-0 text-xs"
        style={{ background: 'var(--bg-ribbon)', borderColor: 'var(--border-panel)' }}
        value={viewScale}
        onChange={(e) => setViewScale(Number(e.target.value))}
      >
        {SCALES.map((s) => (
          <option key={s} value={s}>
            1:{s}
          </option>
        ))}
      </select>
      <select
        className="rounded border px-1 py-0 text-xs"
        style={{ background: 'var(--bg-ribbon)', borderColor: 'var(--border-panel)' }}
        value={detailLevel}
        onChange={(e) =>
          setDetailLevel(e.target.value as 'coarse' | 'medium' | 'fine')
        }
      >
        <option value="coarse">Coarse</option>
        <option value="medium">Medium</option>
        <option value="fine">Fine</option>
      </select>
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Wireframe
      </span>
      <button type="button" className={btn} disabled title="Sun">
        ☀
      </button>
      <button type="button" className={btn} disabled title="Lighting">
        💡
      </button>
      <button type="button" className={btn} disabled title="Shadows">
        🌫
      </button>
      <button type="button" className={btn} title="Crop Region">
        ▣
      </button>
      <button type="button" className={btn} title="Reveal Hidden">
        ◎
      </button>
      <button type="button" className={btn} title="Temporary Hide/Isolate">
        ⊞
      </button>
      <button type="button" className={btn} title="Thin Lines">
        ↔
      </button>
      <button
        type="button"
        className={`${btn} ml-auto border`}
        style={{ borderColor: 'var(--border-panel)' }}
        onClick={() => setAsciiPanelOpen(true)}
      >
        ASCII Engine ▾
      </button>
    </div>
  )
}
