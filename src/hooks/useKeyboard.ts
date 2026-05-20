import { useEffect } from 'react'
import { useProjectStore } from '../store/projectStore'

const TOOL_SHORTCUTS: Record<string, import('../engine/types').ToolId> = {
  WA: 'wall',
  DR: 'door',
  WN: 'window',
  RM: 'room',
  GR: 'grid',
  SN: 'section',
  FL: 'floor',
  ST: 'stair',
  LL: 'level',
  RP: 'reference-plane',
  MD: 'modify',
  MV: 'move',
  CO: 'copy',
  RO: 'rotate',
  MM: 'mirror',
  AL: 'align',
  TR: 'trim',
  SL: 'split',
  DE: 'delete',
}

export function useKeyboard() {
  const setActiveTool = useProjectStore((s) => s.setActiveTool)
  const setShortcutBuffer = useProjectStore((s) => s.setShortcutBuffer)
  const shortcutBuffer = useProjectStore((s) => s.shortcutBuffer)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)
  const newProject = useProjectStore((s) => s.newProject)
  const openProject = useProjectStore((s) => s.openProject)
  const saveProject = useProjectStore((s) => s.saveProject)
  const setSnapDialogOpen = useProjectStore((s) => s.setSnapDialogOpen)
  const deleteSelected = useProjectStore((s) => s.deleteSelected)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase()
        if (k === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
          return
        }
        if (k === 'y' || (k === 'z' && e.shiftKey)) {
          e.preventDefault()
          redo()
          return
        }
        if (k === 'n') {
          e.preventDefault()
          newProject()
          return
        }
        if (k === 'o') {
          e.preventDefault()
          void openProject()
          return
        }
        if (k === 's') {
          e.preventDefault()
          saveProject()
          return
        }
        if (k === 'x') {
          e.preventDefault()
          deleteSelected()
          return
        }
        return
      }

      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key

      if (key === 'Z' && shortcutBuffer === '') {
        setShortcutBuffer('Z')
        return
      }
      if (shortcutBuffer === 'Z' && (key === 'A' || key === 'E')) {
        e.preventDefault()
        setShortcutBuffer('')
        window.dispatchEvent(new Event('td-zoom-all'))
        return
      }

      if (key.length === 1 && /[A-Z]/.test(key)) {
        const next = (shortcutBuffer + key).slice(-2)
        setShortcutBuffer(next)
        if (next === 'SS') {
          e.preventDefault()
          setSnapDialogOpen(true)
          setShortcutBuffer('')
          return
        }
        const tool = TOOL_SHORTCUTS[next]
        if (tool) {
          e.preventDefault()
          setActiveTool(tool)
          setShortcutBuffer('')
        } else if (next.length === 2) {
          setTimeout(() => setShortcutBuffer(''), 800)
        }
        return
      }

      if (key === 'Escape') {
        setShortcutBuffer('')
        setActiveTool('modify')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    setActiveTool,
    setShortcutBuffer,
    shortcutBuffer,
    undo,
    redo,
    newProject,
    openProject,
    saveProject,
    setSnapDialogOpen,
    deleteSelected,
  ])
}
