import { useState } from 'react'
import { ContextMenu } from './ContextMenu'
import { useProjectBrowserMenu } from '../hooks/useProjectBrowserMenu'
import { useProjectStore } from '../store/projectStore'

function TreeItem({
  label,
  active,
  onDoubleClick,
  onContextMenu,
  children,
  defaultOpen = false,
}: {
  label: string
  active?: boolean
  onDoubleClick?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  children?: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const hasChildren = Boolean(children)

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-1 px-1 py-0.5 text-left text-xs hover:bg-[var(--btn-hover)]"
        style={{
          fontWeight: active ? 600 : 400,
          color: active ? 'var(--accent)' : 'var(--text-primary)',
        }}
        onClick={() => hasChildren && setOpen(!open)}
        onDoubleClick={onDoubleClick}
        onContextMenu={(e) => {
          if (onContextMenu) {
            e.preventDefault()
            onContextMenu(e)
          }
        }}
      >
        {hasChildren && <span className="w-3 text-[10px]">{open ? '▼' : '▶'}</span>}
        {!hasChildren && <span className="w-3" />}
        {label}
      </button>
      {open && children && <div className="pl-3">{children}</div>}
    </div>
  )
}

export function ProjectBrowser() {
  const model = useProjectStore((s) => s.model)
  const setActiveView = useProjectStore((s) => s.setActiveView)
  const { menu, openViewMenu, closeMenu } = useProjectBrowserMenu()
  const floorPlans = model.views.filter((v) => v.type === 'floor-plan')
  const elevations = model.views.filter((v) => v.type === 'elevation')
  const sections = model.views.filter((v) => v.type === 'section')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className="border-b px-2 py-1 text-xs font-semibold"
        style={{ borderColor: 'var(--border-panel)', background: '#1a1a1a' }}
      >
        Project Browser
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        <TreeItem label="Views (Discipline)" defaultOpen>
          <TreeItem label="Floor Plans" defaultOpen>
            {floorPlans.map((v) => (
              <TreeItem
                key={v.id}
                label={v.name}
                active={model.activeViewId === v.id}
                onDoubleClick={() => setActiveView(v.id)}
                onContextMenu={(e) => openViewMenu(e.clientX, e.clientY, v.id, v.name)}
              />
            ))}
          </TreeItem>
          <TreeItem label="Reflected Ceiling Plans" />
          <TreeItem label="Elevations (Building Elevation)" defaultOpen>
            {elevations.map((v) => (
              <TreeItem
                key={v.id}
                label={v.name}
                active={model.activeViewId === v.id}
                onDoubleClick={() => setActiveView(v.id)}
                onContextMenu={(e) => openViewMenu(e.clientX, e.clientY, v.id, v.name)}
              />
            ))}
          </TreeItem>
          <TreeItem label="Sections" defaultOpen>
            {sections.map((v) => (
              <TreeItem
                key={v.id}
                label={v.name}
                active={model.activeViewId === v.id}
                onDoubleClick={() => setActiveView(v.id)}
                onContextMenu={(e) => openViewMenu(e.clientX, e.clientY, v.id, v.name)}
              />
            ))}
          </TreeItem>
          <TreeItem label="3D Views" />
        </TreeItem>
        <TreeItem label="Legends" />
        <TreeItem label="Schedules/Quantities" />
        <TreeItem label="Sheets (all)" />
        <TreeItem label="Families" defaultOpen>
          <TreeItem label="Doors" defaultOpen>
            <TreeItem label="Single Flush" defaultOpen>
              {model.doorTypes.map((d) => (
                <TreeItem key={d.id} label={d.name} />
              ))}
            </TreeItem>
          </TreeItem>
          <TreeItem label="Walls" defaultOpen>
            <TreeItem label="Basic Wall" defaultOpen>
              {model.wallTypes.map((w) => (
                <TreeItem key={w.id} label={w.name} />
              ))}
            </TreeItem>
          </TreeItem>
          <TreeItem label="Windows" />
        </TreeItem>
        <TreeItem label="Groups" />
      </div>
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={closeMenu} />
      )}
    </div>
  )
}
