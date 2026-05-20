import type { ReactNode } from 'react'
import { useProjectStore } from '../store/projectStore'
import {
  IconCeiling,
  IconColumn,
  IconComponent,
  IconCopy,
  IconDelete,
  IconDoor,
  IconFloor,
  IconGrid,
  IconGridLarge,
  IconLevel,
  IconModify,
  IconMove,
  IconRamp,
  IconRailing,
  IconRefPlane,
  IconRefPlaneLarge,
  IconRoof,
  IconRoom,
  IconSection,
  IconStair,
  IconWall,
  IconWindow,
} from './ribbon/RibbonIcons'

const TABS = [
  'architecture',
  'structure',
  'insert',
  'annotate',
  'analyze',
  'view',
  'manage',
  'modify',
] as const

const TAB_LABELS: Record<string, string> = {
  architecture: 'Architecture',
  structure: 'Structure',
  insert: 'Insert',
  annotate: 'Annotate',
  analyze: 'Analyze',
  view: 'View',
  manage: 'Manage',
  modify: 'Modify',
}

interface RibbonButtonProps {
  label: string
  icon?: ReactNode
  large?: boolean
  active?: boolean
  disabled?: boolean
  title?: string
  onClick?: () => void
}

function RibbonButton({
  label,
  icon,
  large = false,
  active = false,
  disabled = false,
  title,
  onClick,
}: RibbonButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title ?? label}
      className={`flex shrink-0 items-center rounded transition-colors ${
        large
          ? 'h-[72px] min-w-[52px] flex-col justify-center px-1'
          : 'h-[22px] min-w-0 gap-1 px-1'
      } ${disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-[var(--btn-hover)]'} ${
        active ? 'border-b-2 border-[var(--btn-active-border)] bg-[var(--btn-active)]' : ''
      }`}
    >
      <span className={`flex shrink-0 items-center justify-center ${large ? '' : 'w-5'}`}>
        {icon}
      </span>
      <span
        className={`truncate leading-tight ${
          large ? 'mt-0.5 max-w-[52px] text-center text-[10px]' : 'text-[10px]'
        }`}
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
    </button>
  )
}

function RibbonSmallStack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-px py-0.5">{children}</div>
}

function PanelGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div
      className="flex min-w-0 flex-col border-r px-0.5"
      style={{ borderColor: 'var(--border-panel)' }}
    >
      <div className="flex flex-1 items-start gap-0.5 px-1 pt-1">{children}</div>
      <span
        className="pb-0.5 text-center text-[9px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
    </div>
  )
}

function ArchitecturePanels() {
  const activeTool = useProjectStore((s) => s.activeTool)
  const setActiveTool = useProjectStore((s) => s.setActiveTool)

  return (
    <>
      <PanelGroup label="Select">
        <RibbonButton
          label="Modify"
          icon={<IconModify size={32} />}
          large
          active={activeTool === 'modify'}
          onClick={() => setActiveTool('modify')}
        />
      </PanelGroup>

      <PanelGroup label="Build">
        <RibbonButton
          label="Wall"
          icon={<IconWall size={32} />}
          large
          active={activeTool === 'wall'}
          onClick={() => setActiveTool('wall')}
        />
        <RibbonButton
          label="Door"
          icon={<IconDoor size={32} />}
          large
          active={activeTool === 'door'}
          onClick={() => setActiveTool('door')}
        />
        <RibbonButton
          label="Window"
          icon={<IconWindow size={32} />}
          large
          active={activeTool === 'window'}
          onClick={() => setActiveTool('window')}
        />
        <RibbonSmallStack>
          <RibbonButton label="Component" icon={<IconComponent />} disabled title="2D plan only — later" />
          <RibbonButton
            label="Column"
            icon={<IconColumn size={20} />}
            active={activeTool === 'column'}
            onClick={() => setActiveTool('column')}
          />
          <RibbonButton label="Roof" icon={<IconRoof />} disabled title="No 3D — roof not in 2D plan scope" />
        </RibbonSmallStack>
        <RibbonSmallStack>
          <RibbonButton label="Ceiling" icon={<IconCeiling />} disabled title="Ceiling plan view — later" />
          <RibbonButton
            label="Floor"
            icon={<IconFloor size={20} />}
            active={activeTool === 'floor'}
            onClick={() => setActiveTool('floor')}
          />
        </RibbonSmallStack>
      </PanelGroup>

      <PanelGroup label="Circulation">
        <RibbonButton
          label="Stair"
          icon={<IconStair size={32} />}
          large
          active={activeTool === 'stair'}
          onClick={() => setActiveTool('stair')}
        />
        <RibbonSmallStack>
          <RibbonButton label="Ramp" icon={<IconRamp />} disabled />
          <RibbonButton label="Railing" icon={<IconRailing />} disabled />
        </RibbonSmallStack>
      </PanelGroup>

      <PanelGroup label="Room & Area">
        <RibbonButton
          label="Room"
          icon={<IconRoom size={32} />}
          large
          active={activeTool === 'room'}
          onClick={() => setActiveTool('room')}
        />
        <RibbonSmallStack>
          <RibbonButton label="Room Separator" disabled />
          <RibbonButton label="Tag Room" disabled />
        </RibbonSmallStack>
      </PanelGroup>

      <PanelGroup label="Datum">
        <RibbonButton
          label="Grid"
          icon={<IconGridLarge size={32} />}
          large
          active={activeTool === 'grid'}
          onClick={() => setActiveTool('grid')}
        />
        <RibbonSmallStack>
          <RibbonButton
            label="Level"
            icon={<IconLevel />}
            active={activeTool === 'level'}
            onClick={() => setActiveTool('level')}
          />
          <RibbonButton
            label="Grid"
            icon={<IconGrid />}
            active={activeTool === 'grid'}
            onClick={() => setActiveTool('grid')}
          />
        </RibbonSmallStack>
      </PanelGroup>

      <PanelGroup label="Work Plane">
        <RibbonButton label="Set" disabled title="Work plane — later" />
        <RibbonSmallStack>
          <RibbonButton label="Show" disabled />
          <RibbonButton
            label="Ref Plane"
            icon={<IconRefPlane />}
            active={activeTool === 'reference-plane'}
            onClick={() => setActiveTool('reference-plane')}
          />
          <RibbonButton label="Viewer" disabled />
        </RibbonSmallStack>
        <RibbonButton
          label="Ref Plane"
          icon={<IconRefPlaneLarge size={32} />}
          large
          active={activeTool === 'reference-plane'}
          onClick={() => setActiveTool('reference-plane')}
        />
      </PanelGroup>
    </>
  )
}

function ViewPanels() {
  const activeTool = useProjectStore((s) => s.activeTool)
  const setActiveTool = useProjectStore((s) => s.setActiveTool)

  return (
    <>
      <PanelGroup label="Create">
        <RibbonButton
          label="Section"
          icon={<IconSection />}
          active={activeTool === 'section'}
          onClick={() => setActiveTool('section')}
        />
        <RibbonButton label="3D View" disabled title="No 3D in TextDesign" />
        <RibbonButton label="Elevation" disabled title="Use plan elevation markers" />
        <RibbonButton label="Plan View" disabled title="Use Project Browser" />
      </PanelGroup>
      <PanelGroup label="Sheet Composition">
        <RibbonButton label="Sheet" disabled />
        <RibbonButton label="Place View" disabled />
      </PanelGroup>
    </>
  )
}

function AnnotatePanels() {
  return (
    <PanelGroup label="Text & Dimensions">
      <RibbonButton label="Text" disabled />
      <RibbonButton label="Tag" disabled />
      <RibbonButton label="Dim" disabled />
      <RibbonButton label="Spot" disabled />
    </PanelGroup>
  )
}

function StructurePanels() {
  return (
    <PanelGroup label="Structure">
      <RibbonButton label="Beam" disabled />
      <RibbonButton label="Column" icon={<IconColumn size={20} />} disabled title="Use Architecture tab" />
      <RibbonButton label="Truss" disabled />
      <RibbonButton label="Brace" disabled />
    </PanelGroup>
  )
}

function ManagePanels() {
  const setSnapDialogOpen = useProjectStore((s) => s.setSnapDialogOpen)
  const setAsciiPanelOpen = useProjectStore((s) => s.setAsciiPanelOpen)

  return (
    <PanelGroup label="Settings">
      <RibbonButton label="Snaps SS" onClick={() => setSnapDialogOpen(true)} />
      <RibbonButton label="ASCII Export" onClick={() => setAsciiPanelOpen(true)} />
    </PanelGroup>
  )
}

function ModifyPanels() {
  const selectedIds = useProjectStore((s) => s.selectedIds)
  const setActiveTool = useProjectStore((s) => s.setActiveTool)
  const activeTool = useProjectStore((s) => s.activeTool)
  const hasSelection = selectedIds.length > 0

  return (
    <>
      <PanelGroup label="Modify">
        <RibbonButton
          label="Move"
          icon={<IconMove />}
          disabled={!hasSelection}
          active={activeTool === 'move'}
          onClick={() => setActiveTool('move')}
        />
        <RibbonButton
          label="Copy"
          icon={<IconCopy />}
          disabled={!hasSelection}
          active={activeTool === 'copy'}
          onClick={() => setActiveTool('copy')}
        />
        <RibbonButton label="Align" disabled={!hasSelection} active={activeTool === 'align'} onClick={() => setActiveTool('align')} />
        <RibbonButton label="Rotate" disabled={!hasSelection} active={activeTool === 'rotate'} onClick={() => setActiveTool('rotate')} />
        <RibbonButton label="Mirror" disabled={!hasSelection} active={activeTool === 'mirror'} onClick={() => setActiveTool('mirror')} />
        <RibbonButton label="Trim" disabled={!hasSelection} active={activeTool === 'trim'} onClick={() => setActiveTool('trim')} />
        <RibbonButton label="Split" disabled={!hasSelection} active={activeTool === 'split'} onClick={() => setActiveTool('split')} />
        <RibbonButton
          label="Delete"
          icon={<IconDelete />}
          disabled={!hasSelection}
          onClick={() => setActiveTool('delete')}
        />
      </PanelGroup>
    </>
  )
}

function InsertPanels() {
  return (
    <PanelGroup label="Insert">
      <RibbonButton label="Link Revit" disabled />
      <RibbonButton label="Link CAD" disabled />
      <RibbonButton label="Import" disabled />
    </PanelGroup>
  )
}

function AnalyzePanels() {
  return (
    <PanelGroup label="Analyze">
      <RibbonButton label="Spaces" disabled />
      <RibbonButton label="Report" disabled />
    </PanelGroup>
  )
}

export function Ribbon() {
  const activeTab = useProjectStore((s) => s.activeRibbonTab)
  const setActiveTab = useProjectStore((s) => s.setActiveRibbonTab)
  const collapsed = useProjectStore((s) => s.ribbonCollapsed)
  const setCollapsed = useProjectStore((s) => s.setRibbonCollapsed)
  const selectedIds = useProjectStore((s) => s.selectedIds)
  const activeTool = useProjectStore((s) => s.activeTool)

  const showModify = selectedIds.length > 0
  const contextualLabel =
    selectedIds.length > 0
      ? `Modify | ${selectedIds.length} selected`
      : activeTool !== 'modify'
        ? `Create | ${activeTool}`
        : null

  return (
    <div style={{ background: 'var(--bg-ribbon)' }}>
      <div
        className="flex h-7 shrink-0 border-b"
        style={{ borderColor: 'var(--border-panel)', background: 'var(--bg-ribbon-tab)' }}
      >
        {TABS.map((tab) => {
          if (tab === 'modify' && !showModify) return null
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              className="relative px-3 text-xs transition-colors hover:bg-[var(--btn-hover)]"
              style={{
                background: isActive ? 'var(--bg-ribbon)' : undefined,
                borderTop: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
              onClick={() => setActiveTab(tab)}
              onDoubleClick={() => setCollapsed(!collapsed)}
            >
              {TAB_LABELS[tab]}
            </button>
          )
        })}
        {contextualLabel && (
          <span
            className="ml-auto flex items-center px-3 text-[10px] font-medium"
            style={{
              background: 'var(--accent-muted, rgba(0,120,212,0.15))',
              color: 'var(--accent)',
              borderLeft: '1px solid var(--border-panel)',
            }}
          >
            {contextualLabel}
          </span>
        )}
      </div>

      {!collapsed && (
        <div
          className="flex h-[88px] shrink-0 overflow-x-auto border-b"
          style={{ borderColor: 'var(--border-panel)', background: 'var(--bg-ribbon)' }}
        >
          {activeTab === 'architecture' && <ArchitecturePanels />}
          {activeTab === 'view' && <ViewPanels />}
          {activeTab === 'annotate' && <AnnotatePanels />}
          {activeTab === 'structure' && <StructurePanels />}
          {activeTab === 'insert' && <InsertPanels />}
          {activeTab === 'analyze' && <AnalyzePanels />}
          {activeTab === 'modify' && <ModifyPanels />}
          {activeTab === 'manage' && <ManagePanels />}
        </div>
      )}
    </div>
  )
}
