import { SelectionFilterBar } from './SelectionFilterBar'
import { useProjectStore } from '../store/projectStore'

export function StatusBar() {
  const statusMessage = useProjectStore((s) => s.statusMessage)
  const cursorModel = useProjectStore((s) => s.cursorModel)
  const selectedIds = useProjectStore((s) => s.selectedIds)
  const shortcutBuffer = useProjectStore((s) => s.shortcutBuffer)
  const activeTool = useProjectStore((s) => s.activeTool)

  const selectionText =
    selectedIds.length > 1
      ? `${selectedIds.length} elements selected`
      : selectedIds.length === 1
        ? '1 element selected'
        : null

  const defaultHint =
    selectedIds.length === 0 && activeTool === 'modify'
      ? 'Click to select · TAB for alternates · CTRL adds · SHIFT unselects · Right-click for menu'
      : null

  return (
    <footer
      className="flex h-[22px] shrink-0 items-center border-t px-2 text-[11px]"
      style={{
        background: 'var(--bg-ribbon-tab)',
        borderColor: 'var(--border-panel)',
        color: 'var(--text-secondary)',
      }}
    >
      <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
        {shortcutBuffer ? `${shortcutBuffer}  —` : ''}
        {selectionText ?? defaultHint ?? statusMessage}
      </span>
      <span className="mx-3 shrink-0">
        X: {Math.round(cursorModel.x)}&nbsp;&nbsp;Y: {Math.round(cursorModel.y)}
      </span>
      <span className="shrink-0">Workset: Local</span>
      <span className="mx-2 shrink-0">|</span>
      <span className="shrink-0">Design Option: Main Model</span>
      <SelectionFilterBar />
    </footer>
  )
}
