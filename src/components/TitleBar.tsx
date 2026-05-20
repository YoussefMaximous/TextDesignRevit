import { useProjectStore } from '../store/projectStore'
import {
  IconFileNew,
  IconFileOpen,
  IconFileSave,
  IconRedo,
  IconUndo,
} from './ribbon/RibbonIcons'

export function TitleBar() {
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)
  const newProject = useProjectStore((s) => s.newProject)
  const openProject = useProjectStore((s) => s.openProject)
  const saveProject = useProjectStore((s) => s.saveProject)
  const model = useProjectStore((s) => s.model)
  const activeView = model.views.find((v) => v.id === model.activeViewId)

  const btnClass =
    'flex h-6 w-7 items-center justify-center rounded hover:bg-[var(--btn-hover)]'

  return (
    <header
      className="flex h-8 shrink-0 items-center border-b px-2"
      style={{
        background: 'var(--bg-ribbon)',
        borderColor: 'var(--border-panel)',
      }}
    >
      <span className="mr-2 font-semibold" style={{ color: 'var(--accent)' }}>
        TD
      </span>
      <span className="mr-4 text-sm" style={{ color: 'var(--text-primary)' }}>
        {model.name}
      </span>
      <span className="mr-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {activeView?.name ?? 'View'} — TextDesign (2D)
      </span>
      <div className="flex items-center gap-0.5">
        <button type="button" className={btnClass} title="New (Ctrl+N)" onClick={newProject}>
          <IconFileNew />
        </button>
        <button
          type="button"
          className={btnClass}
          title="Open (Ctrl+O)"
          onClick={() => void openProject()}
        >
          <IconFileOpen />
        </button>
        <button type="button" className={btnClass} title="Save (Ctrl+S)" onClick={saveProject}>
          <IconFileSave />
        </button>
        <span className="mx-1 w-px self-stretch bg-[var(--border-panel)]" />
        <button type="button" className={btnClass} title="Undo (Ctrl+Z)" onClick={undo}>
          <IconUndo />
        </button>
        <button type="button" className={btnClass} title="Redo (Ctrl+Y)" onClick={redo}>
          <IconRedo />
        </button>
      </div>
      <div className="flex-1" />
      <div className="flex items-center">
        <button
          type="button"
          className="flex h-6 w-8 items-center justify-center text-xs hover:bg-[var(--btn-hover)]"
          aria-label="Minimize"
        >
          ─
        </button>
        <button
          type="button"
          className="flex h-6 w-8 items-center justify-center text-xs hover:bg-[var(--btn-hover)]"
          aria-label="Maximize"
        >
          □
        </button>
        <button
          type="button"
          className="flex h-6 w-8 items-center justify-center text-xs hover:bg-[var(--btn-hover)]"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </header>
  )
}
