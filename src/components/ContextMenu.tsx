import { useEffect, useRef } from 'react'

export interface ContextMenuItem {
  id: string
  label: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
  onClick?: () => void
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const menuW = 220
  const menuH = items.length * 26 + 8
  const left = Math.min(x, window.innerWidth - menuW - 8)
  const top = Math.min(y, window.innerHeight - menuH - 8)

  return (
    <div
      ref={ref}
      className="fixed z-[9999] min-w-[200px] rounded border py-1 shadow-lg"
      style={{
        left,
        top,
        background: 'var(--bg-panel)',
        borderColor: 'var(--border-panel)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
      }}
      role="menu"
    >
      {items.map((item) =>
        item.separator ? (
          <div
            key={item.id}
            className="my-0.5 h-px"
            style={{ background: 'var(--border-panel)' }}
          />
        ) : (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className="flex w-full items-center justify-between px-3 py-1 text-left text-xs hover:bg-[var(--btn-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => {
              if (!item.disabled) {
                item.onClick?.()
                onClose()
              }
            }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="ml-4 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                {item.shortcut}
              </span>
            )}
          </button>
        ),
      )}
    </div>
  )
}
