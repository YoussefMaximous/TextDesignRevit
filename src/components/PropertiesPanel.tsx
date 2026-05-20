import { elevationDirectionLabel } from '../engine/datumGeometry'
import { formatLength, wallLength } from '../engine/geometry'
import { useProjectStore } from '../store/projectStore'

export function PropertiesPanel() {
  const model = useProjectStore((s) => s.model)
  const selectedIds = useProjectStore((s) => s.selectedIds)
  const setTypePropertiesOpen = useProjectStore((s) => s.setTypePropertiesOpen)
  const updateRoomFields = useProjectStore((s) => s.updateRoomFields)

  if (selectedIds.length === 0) {
    const activeView = model.views.find((v) => v.id === model.activeViewId)
    if (!activeView) return <EmptyPanel message="No selection" />
    return (
      <PanelShell family="Views (1)" typeName={activeView.name}>
        <PropSection title="GRAPHICS">
          <PropRow label="View Scale" value={`1 : ${activeView.scale}`} />
          <PropRow label="Detail Level" value={activeView.detailLevel} />
          <PropRow
            label="Crop Region Visible"
            value={activeView.cropRegion ? 'Yes' : 'No'}
          />
          <PropRow
            label="Annotation Crop"
            value={activeView.annotationCropRegion ? 'Yes' : 'No'}
          />
        </PropSection>
        <PropSection title="IDENTITY DATA">
          <PropRow label="View Type" value={activeView.type.replace('-', ' ')} />
          {activeView.levelId && (
            <PropRow
              label="Associated Level"
              value={model.levels.find((l) => l.id === activeView.levelId)?.name ?? '—'}
            />
          )}
        </PropSection>
        <PropSection title="OTHER">
          <PropRow
            label="Function"
            value="Double-click empty canvas to zoom to fit. Double-click elevation or section to open linked view."
          />
        </PropSection>
      </PanelShell>
    )
  }

  if (selectedIds.length > 1) {
    return <EmptyPanel message={`${selectedIds.length} elements selected`} />
  }

  const id = selectedIds[0]
  const wall = model.walls.find((w) => w.id === id)
  const door = model.doors.find((d) => d.id === id)
  const window = model.windows.find((w) => w.id === id)
  const room = model.rooms.find((r) => r.id === id)

  if (wall) {
    const wallType = model.wallTypes.find((t) => t.id === wall.typeId)
    if (!wallType) return <EmptyPanel />
    const len = wallLength(wall)
    return (
      <PanelShell
        family={wallType.family}
        typeName={wallType.name}
        onEditType={() => setTypePropertiesOpen(true)}
      >
        <PropSection title="CONSTRAINTS">
          <PropRow label="Location Line" value="Wall Centerline" />
          <PropRow label="Base Constraint" value="Level 1" />
          <PropRow label="Unconnected Height" value={`${wall.height}`} />
        </PropSection>
        <PropSection title="DIMENSIONS">
          <PropRow label="Length" value={formatLength(len)} computed />
        </PropSection>
        <PropSection title="IDENTITY DATA">
          <PropRow label="Mark" value={wall.id.slice(-4).toUpperCase()} />
        </PropSection>
      </PanelShell>
    )
  }

  if (door) {
    const doorType = model.doorTypes.find((t) => t.id === door.typeId)
    return (
      <PanelShell
        family={doorType?.family ?? 'Door'}
        typeName={doorType?.name ?? '—'}
        onEditType={() => setTypePropertiesOpen(true)}
      >
        <PropSection title="CONSTRAINTS">
          <PropRow label="Host" value={door.hostWallId.slice(-8)} />
          <PropRow label="Sill Height" value={`${door.sillHeight} mm`} />
        </PropSection>
        <PropSection title="GRAPHICS">
          <PropRow label="Handedness" value={door.handedness} />
          <PropRow label="Swing Angle" value={`${door.swingAngle}°`} />
        </PropSection>
        <PropSection title="DIMENSIONS">
          <PropRow label="Width" value={formatLength(door.width)} />
          <PropRow label="Height" value={formatLength(door.height)} />
        </PropSection>
      </PanelShell>
    )
  }

  if (window) {
    const winType = model.windowTypes.find((t) => t.id === window.typeId)
    return (
      <PanelShell
        family={winType?.family ?? 'Window'}
        typeName={winType?.name ?? '—'}
        onEditType={() => setTypePropertiesOpen(true)}
      >
        <PropSection title="CONSTRAINTS">
          <PropRow label="Host" value={window.hostWallId.slice(-8)} />
          <PropRow label="Sill Height" value={`${window.sillHeight} mm`} />
        </PropSection>
        <PropSection title="DIMENSIONS">
          <PropRow label="Width" value={formatLength(window.width)} />
          <PropRow label="Height" value={formatLength(window.height)} />
        </PropSection>
      </PanelShell>
    )
  }

  if (id.startsWith('view-crop:')) {
    const viewId = id.replace('view-crop:', '')
    const view = model.views.find((v) => v.id === viewId)
    const crop = view?.cropRegion
    return (
      <PanelShell family="Views" typeName={view?.name ?? 'Floor Plan'}>
        <PropSection title="VIEW">
          <PropRow label="Type" value="Floor Plan Crop" />
          <PropRow label="Scale" value={`1:${view?.scale ?? 100}`} />
        </PropSection>
        {crop && (
          <PropSection title="CROP REGION">
            <PropRow label="Width" value={formatLength(crop.maxX - crop.minX)} computed />
            <PropRow label="Height" value={formatLength(crop.maxY - crop.minY)} computed />
          </PropSection>
        )}
        <PropSection title="OTHER">
          <PropRow
            label="Purpose"
            value="Defines printable sheet extent for this floor plan view."
          />
        </PropSection>
      </PanelShell>
    )
  }

  const scopeBox = model.scopeBoxes.find((s) => s.id === id)
  if (scopeBox) {
    return (
      <PanelShell family="Datum" typeName={scopeBox.name}>
        <PropSection title="SCOPE BOX">
          <PropRow label="Width" value={formatLength(scopeBox.maxX - scopeBox.minX)} computed />
          <PropRow label="Depth" value={formatLength(scopeBox.maxY - scopeBox.minY)} computed />
          <PropRow label="Height" value={`${scopeBox.maxZ - scopeBox.minZ} mm`} computed />
        </PropSection>
        <PropSection title="OTHER">
          <PropRow
            label="Purpose"
            value="Controls which grids, levels, and reference planes appear in associated views."
          />
          <PropRow label="Linked Datums" value={`${scopeBox.datumIds.length}`} computed />
        </PropSection>
      </PanelShell>
    )
  }

  const refPlane = model.referencePlanes.find((r) => r.id === id)
  if (refPlane) {
    return (
      <PanelShell family="Datum" typeName={refPlane.name}>
        <PropSection title="REFERENCE PLANE">
          <PropRow label="Display" value={refPlane.tint === 'red' ? 'Red (long dash)' : 'Green (long dash)'} />
          <PropRow label="Purpose" value={refPlane.purpose ?? 'work-plane'} />
          <PropRow label="Scope Box" value={refPlane.scopeBoxId ?? '—'} />
        </PropSection>
        <PropSection title="OTHER">
          <PropRow
            label="Function"
            value="Non-structural infinite plane — no grid bubbles. Used for align, offset, and sketch work planes."
          />
        </PropSection>
      </PanelShell>
    )
  }

  const ws = (model.workingSections ?? []).find((w) => w.id === id)
  if (ws) {
    const len = Math.hypot(ws.end.x - ws.start.x, ws.end.y - ws.start.y)
    return (
      <PanelShell family="Sections" typeName={ws.name}>
        <PropSection title="WORKING SECTION">
          <PropRow label="Orientation" value={ws.orientation} />
          <PropRow label="Length" value={formatLength(len)} computed />
          <PropRow label="Level" value={ws.levelId} />
          <PropRow label="Linked View" value={ws.linkedViewId ?? '—'} />
        </PropSection>
        <PropSection title="OTHER">
          <PropRow
            label="Function"
            value="Section cut line on plan — opens a section view through the building. Not a reference plane."
          />
          <PropRow label="Hint" value="Double-click to open section view" />
        </PropSection>
      </PanelShell>
    )
  }

  const ann = (model.viewAnnotations ?? []).find((a) => a.id === id)
  if (ann) {
    const kindLabel = ann.kind === 'north-arrow' ? 'North Arrow' : 'Scale Bar'
    return (
      <PanelShell family="View" typeName={kindLabel}>
        <PropSection title="ANNOTATION">
          <PropRow label="Kind" value={kindLabel} />
          <PropRow label="View" value={ann.viewId} />
          <PropRow label="Scale" value={`1:${ann.scaleRatio}`} />
        </PropSection>
        <PropSection title="OTHER">
          <PropRow
            label="Function"
            value="Plan sheet annotation — selectable and deletable like Revit view symbols."
          />
        </PropSection>
      </PanelShell>
    )
  }

  const elev = model.elevationMarkers.find((e) => e.id === id)
  if (elev) {
    return (
      <PanelShell family="Elevation Marker" typeName={elev.name}>
        <PropSection title="ELEVATION">
          <PropRow label="Direction" value={elevationDirectionLabel(elev.direction)} />
          <PropRow label="Level" value={elev.levelId} />
          <PropRow label="Linked View" value={elev.linkedViewId ?? '—'} />
        </PropSection>
        <PropSection title="OTHER">
          <PropRow
            label="Function"
            value="Double-click to open the elevation view generated from this marker."
          />
        </PropSection>
      </PanelShell>
    )
  }

  const col = model.columns.find((c) => c.id === id)
  if (col) {
    return (
      <PanelShell family="Structural Columns" typeName={col.typeId}>
        <PropSection title="COLUMN">
          <PropRow label="Width" value={formatLength(col.width)} />
          <PropRow label="Depth" value={formatLength(col.depth)} />
          <PropRow label="Level" value={col.levelId} />
        </PropSection>
      </PanelShell>
    )
  }

  const floor = model.floors?.find((f) => f.id === id)
  if (floor) {
    const w = floor.maxX - floor.minX
    const d = floor.maxY - floor.minY
    return (
      <PanelShell family="Floors" typeName="Floor">
        <PropSection title="FLOOR">
          <PropRow label="Width" value={formatLength(w)} computed />
          <PropRow label="Depth" value={formatLength(d)} computed />
          <PropRow label="Level" value={floor.levelId} />
        </PropSection>
      </PanelShell>
    )
  }

  const stair = model.stairs?.find((s) => s.id === id)
  if (stair) {
    return (
      <PanelShell family="Stairs" typeName="Stair">
        <PropSection title="STAIR">
          <PropRow label="Width" value={formatLength(stair.width)} />
          <PropRow label="Run depth" value={formatLength(stair.depth)} />
          <PropRow label="Level" value={stair.levelId} />
        </PropSection>
      </PanelShell>
    )
  }

  const level = model.levels.find((l) => l.id === id)
  if (level) {
    return (
      <PanelShell family="Levels" typeName={level.name}>
        <PropSection title="CONSTRAINTS">
          <PropRow label="Elevation" value={`${level.elevation} mm`} />
        </PropSection>
        <PropSection title="GRAPHICS">
          <PropRow label="Head Bubble" value={level.headBubble ? 'Yes' : 'No'} />
          <PropRow label="Tail Bubble" value={level.tailBubble ? 'Yes' : 'No'} />
        </PropSection>
      </PanelShell>
    )
  }

  const grid = model.grids.find((g) => g.id === id)
  if (grid) {
    return (
      <PanelShell family="Datum" typeName={`Grid ${grid.name}`}>
        <PropSection title="GRID">
          <PropRow label="Name" value={grid.name} />
          <PropRow label="Scope Box" value={grid.scopeBoxId ?? '—'} />
        </PropSection>
        <PropSection title="OTHER">
          <PropRow
            label="Function"
            value="Structural column layout — dash-dot line with numbered bubble (not a reference plane)."
          />
        </PropSection>
      </PanelShell>
    )
  }

  if (room) {
    return (
      <PanelShell family="Room" typeName={room.name}>
        <PropSection title="IDENTITY DATA">
          <EditablePropRow
            label="Name"
            value={room.name}
            onCommit={(v) => updateRoomFields(room.id, { name: v })}
          />
          <EditablePropRow
            label="Number"
            value={room.number}
            onCommit={(v) => updateRoomFields(room.id, { number: v })}
          />
        </PropSection>
        <PropSection title="DIMENSIONS">
          <PropRow label="Area" value={`${room.area.toFixed(2)} m²`} computed />
          <PropRow label="Perimeter" value={formatLength(room.perimeter)} computed />
        </PropSection>
      </PanelShell>
    )
  }

  return <EmptyPanel />
}

function EmptyPanel({ message = '—' }: { message?: string }) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b p-2" style={{ borderColor: 'var(--border-panel)' }}>
        <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          Properties
        </p>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  )
}

function PanelShell({
  family,
  typeName,
  children,
  onEditType,
}: {
  family: string
  typeName: string
  children: React.ReactNode
  onEditType?: () => void
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b p-2" style={{ borderColor: 'var(--border-panel)' }}>
        <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          {family}
        </p>
        <p className="text-sm">{typeName}</p>
        {onEditType && (
          <button
            type="button"
            className="mt-2 w-full rounded border py-1 text-xs hover:bg-[var(--btn-hover)]"
            style={{ borderColor: 'var(--border-panel)' }}
            onClick={onEditType}
          >
            Edit Type
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

function PropSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="px-2 py-1 text-[10px] font-bold"
        style={{ background: '#1a1a1a', color: 'var(--text-primary)' }}
      >
        {title}
      </div>
      <table className="w-full text-xs">{children}</table>
    </div>
  )
}

function PropRow({
  label,
  value,
  computed = false,
}: {
  label: string
  value: string
  computed?: boolean
}) {
  return (
    <tbody>
      <tr className="border-b" style={{ borderColor: 'var(--border-panel)' }}>
        <td className="w-1/2 px-2 py-0.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </td>
        <td
          className={`px-2 py-0.5 ${computed ? 'italic' : ''}`}
          style={{ color: computed ? 'var(--text-secondary)' : 'var(--text-primary)' }}
        >
          {value}
        </td>
      </tr>
    </tbody>
  )
}

function EditablePropRow({
  label,
  value,
  onCommit,
}: {
  label: string
  value: string
  onCommit: (value: string) => void
}) {
  return (
    <tbody>
      <tr className="border-b" style={{ borderColor: 'var(--border-panel)' }}>
        <td className="w-1/2 px-2 py-0.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </td>
        <td className="px-1 py-0.5">
          <input
            type="text"
            className="w-full rounded border bg-transparent px-1 py-0.5 text-xs"
            style={{ borderColor: 'var(--border-panel)' }}
            defaultValue={value}
            onBlur={(e) => {
              if (e.target.value !== value) onCommit(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
            }}
          />
        </td>
      </tr>
    </tbody>
  )
}
