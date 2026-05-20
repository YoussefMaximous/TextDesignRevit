import { useCallback, useRef } from 'react'
import { PropertiesPanel } from './PropertiesPanel'
import { ProjectBrowser } from './ProjectBrowser'
import { useProjectStore } from '../store/projectStore'

export function LeftPanel() {
  const width = useProjectStore((s) => s.leftPanelWidth)
  const setWidth = useProjectStore((s) => s.setLeftPanelWidth)
  const dragging = useRef(false)

  const onMouseDown = useCallback(() => {
    dragging.current = true
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const next = Math.max(180, Math.min(480, e.clientX))
      setWidth(next)
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [setWidth])

  return (
    <div className="relative flex shrink-0" style={{ width }}>
      <div
        className="flex h-full flex-col border-r"
        style={{
          width,
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-panel)',
        }}
      >
        <div
          className="min-h-0 flex-[55] overflow-hidden border-b"
          style={{ borderColor: 'var(--border-panel)' }}
        >
          <PropertiesPanel />
        </div>
        <div className="min-h-0 flex-[45] overflow-hidden">
          <ProjectBrowser />
        </div>
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize"
        onMouseDown={onMouseDown}
      />
    </div>
  )
}
