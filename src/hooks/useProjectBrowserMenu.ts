import { useCallback, useState } from 'react'
import type { ContextMenuItem } from '../components/ContextMenu'
import { useProjectStore } from '../store/projectStore'

export function useProjectBrowserMenu() {
  const [menu, setMenu] = useState<{
    x: number
    y: number
    items: ContextMenuItem[]
  } | null>(null)

  const closeMenu = useCallback(() => setMenu(null), [])

  const openViewMenu = useCallback((clientX: number, clientY: number, viewId: string, viewName: string) => {
    const items: ContextMenuItem[] = [
      {
        id: 'open',
        label: 'Open View',
        onClick: () => {
          useProjectStore.getState().setActiveView(viewId)
          window.dispatchEvent(new Event('td-zoom-all'))
        },
      },
      {
        id: 'zoom',
        label: 'Zoom to View',
        onClick: () => {
          useProjectStore.getState().setActiveView(viewId)
          window.dispatchEvent(new Event('td-zoom-all'))
        },
      },
      { id: 'sep', label: '', separator: true },
      {
        id: 'rename',
        label: 'Rename…',
        disabled: true,
        onClick: () => undefined,
      },
      {
        id: 'dup',
        label: 'Duplicate View',
        disabled: true,
        onClick: () => undefined,
      },
    ]
    void viewName
    setMenu({ x: clientX, y: clientY, items })
  }, [])

  return { menu, openViewMenu, closeMenu }
}
