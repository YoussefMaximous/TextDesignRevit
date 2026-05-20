import { useCallback, useState } from 'react'
import type { ContextMenuItem } from '../components/ContextMenu'
import { useProjectStore } from '../store/projectStore'

export function useViewportContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(
    null,
  )

  const closeMenu = useCallback(() => setMenu(null), [])

  const openViewportMenu = useCallback(
    (clientX: number, clientY: number) => {
      const selectedIds = useProjectStore.getState().selectedIds
      const activeTool = useProjectStore.getState().activeTool
      const hasSelection = selectedIds.length > 0
      const placing =
        activeTool !== 'modify' &&
        activeTool !== 'delete' &&
        !['move', 'copy', 'rotate', 'mirror', 'align', 'trim', 'split'].includes(activeTool)

      const items: ContextMenuItem[] = []

      if (hasSelection) {
        items.push({
          id: 'delete',
          label: 'Delete',
          shortcut: 'DE',
          onClick: () => useProjectStore.getState().deleteSelected(),
        })
        items.push({
          id: 'repeat',
          label: 'Repeat Last Command',
          shortcut: 'RP',
          disabled: true,
        })
        items.push({
          id: 'hide',
          label: 'Hide in View',
          shortcut: 'EH',
          disabled: true,
        })
        items.push({
          id: 'isolate',
          label: 'Isolate Element',
          disabled: true,
        })
        items.push({ id: 'sep1', label: '', separator: true })
      }

      if (placing) {
        items.push({
          id: 'cancel',
          label: 'Cancel',
          shortcut: 'Esc',
          onClick: () => useProjectStore.getState().setActiveTool('modify'),
        })
        items.push({ id: 'sep2', label: '', separator: true })
      }

      items.push({
        id: 'zoom-fit',
        label: 'Zoom to Fit',
        shortcut: 'ZE',
        onClick: () => window.dispatchEvent(new Event('td-zoom-all')),
      })
      items.push({
        id: 'zoom-region',
        label: 'Zoom in Region',
        shortcut: 'ZR',
        disabled: true,
      })
      items.push({
        id: 'pan',
        label: 'Pan Active View',
        shortcut: 'PAN',
        disabled: true,
      })
      items.push({
        id: 'deselect',
        label: 'Clear Selection',
        disabled: !hasSelection,
        onClick: () => useProjectStore.getState().setSelectedIds([]),
      })
      items.push({ id: 'sep3', label: '', separator: true })
      items.push({
        id: 'snaps',
        label: 'Snap Settings…',
        shortcut: 'SS',
        onClick: () => useProjectStore.getState().setSnapDialogOpen(true),
      })

      setMenu({ x: clientX, y: clientY, items })
    },
    [],
  )

  return { menu, openViewportMenu, closeMenu }
}
