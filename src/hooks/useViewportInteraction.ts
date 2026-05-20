import { useCallback, useEffect, useRef, useState } from 'react'
import type { Column, Door, Grid, Point2D, Room, Stair, Wall, Window } from '../engine/types'
import {
  DEFAULT_COLUMN_SIZE,
  DEFAULT_STAIR_DEPTH,
  DEFAULT_STAIR_WIDTH,
  floorFromPoints,
  nextColumnName,
  rectFromPoints,
} from '../engine/buildingElements'
import { buildSelectionOverlay } from '../engine/overlayHelpers'
import { detectRoomAtPoint, nextRoomNumber } from '../engine/roomDetection'
import {
  angleDegrees,
  extensionAlignmentLines,
  formatAngleLabel,
  placementSnapLabel,
  resolveGridPlacementEnd,
} from '../engine/placementFeedback'
import {
  buildRefPlaneFromPoints,
  buildWorkingSectionFromPoints,
  clipLineToScopeBox,
  resolveSectionPreviewLine,
} from '../engine/datumGeometry'
import { revitAnnotationCrop } from '../engine/revitLandingLayout'
import {
  extendGridToView,
  isGridVertical,
  nextGridName,
} from '../engine/gridNaming'
import {
  computeWallSelectionDims,
  hitTestSelectionDim,
} from '../engine/tempDimensions'
import { toCanvas } from '../renderer/transform'
import {
  constrainOrthogonal,
  distance,
  formatLength,
  getModelBBox,
  wallLength,
} from '../engine/geometry'
import {
  createDoorOnWall,
  createWindowOnWall,
  findHostWall,
} from '../engine/hosting'
import { resolveSnap } from '../engine/SnapResolver'
import { modelBoxFromScreen, pickAtPoint, selectInBox } from '../engine/selection'
import type { RenderOverlay } from '../renderer/ViewportRenderer'
import { fitTransformToBBox, toModel } from '../renderer/transform'
import { useModifyTools, isModifyTool } from './useModifyTools'
import { useWallDistanceCommit } from '../components/DistanceInputOverlay'
import {
  activeLevelId,
  generateId,
  useProjectStore,
} from '../store/projectStore'

const DRAG_THRESHOLD_PX = 4

export function useViewportInteraction(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [overlay, setOverlay] = useState<RenderOverlay>({ selectedIds: [] })
  const [shiftHeld, setShiftHeld] = useState(false)
  const panRef = useRef({ active: false, lastX: 0, lastY: 0 })
  const selectDragRef = useRef({
    active: false,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    moved: false,
  })

  const model = useProjectStore((s) => s.model)
  const transform = useProjectStore((s) => s.transform)
  const setTransform = useProjectStore((s) => s.setTransform)
  const activeTool = useProjectStore((s) => s.activeTool)
  const wallTool = useProjectStore((s) => s.wallTool)
  const doorTool = useProjectStore((s) => s.doorTool)
  const windowTool = useProjectStore((s) => s.windowTool)
  const setWallTool = useProjectStore((s) => s.setWallTool)
  const setDoorTool = useProjectStore((s) => s.setDoorTool)
  const setWindowTool = useProjectStore((s) => s.setWindowTool)
  const setActiveTool = useProjectStore((s) => s.setActiveTool)
  const placeWall = useProjectStore((s) => s.placeWall)
  const placeDoor = useProjectStore((s) => s.placeDoor)
  const placeWindow = useProjectStore((s) => s.placeWindow)
  const deleteSelected = useProjectStore((s) => s.deleteSelected)
  const setCursorModel = useProjectStore((s) => s.setCursorModel)
  const setStatusMessage = useProjectStore((s) => s.setStatusMessage)
  const selectedIds = useProjectStore((s) => s.selectedIds)
  const selectionFilters = useProjectStore((s) => s.selectionFilters)
  const setSelectedIds = useProjectStore((s) => s.setSelectedIds)
  const spatialIndex = useProjectStore((s) => s.spatialIndex)
  const snapConfig = useProjectStore((s) => s.snapConfig)
  const snapEnabled = useProjectStore((s) => s.snapEnabled)
  const chainWalls = useProjectStore((s) => s.chainWalls)
  const wallHeight = useProjectStore((s) => s.wallHeight)
  const tabCycleHits = useProjectStore((s) => s.tabCycleHits)
  const tabCycleIndex = useProjectStore((s) => s.tabCycleIndex)
  const setTabCycleHits = useProjectStore((s) => s.setTabCycleHits)
  const setTabCycleIndex = useProjectStore((s) => s.setTabCycleIndex)
  const gridTool = useProjectStore((s) => s.gridTool)
  const setGridTool = useProjectStore((s) => s.setGridTool)
  const sectionTool = useProjectStore((s) => s.sectionTool)
  const setSectionTool = useProjectStore((s) => s.setSectionTool)
  const refPlaneTool = useProjectStore((s) => s.refPlaneTool)
  const setRefPlaneTool = useProjectStore((s) => s.setRefPlaneTool)
  const placeGrid = useProjectStore((s) => s.placeGrid)
  const placeRefPlane = useProjectStore((s) => s.placeRefPlane)
  const placeWorkingSection = useProjectStore((s) => s.placeWorkingSection)
  const floorTool = useProjectStore((s) => s.floorTool)
  const setFloorTool = useProjectStore((s) => s.setFloorTool)
  const placeColumn = useProjectStore((s) => s.placeColumn)
  const placeFloor = useProjectStore((s) => s.placeFloor)
  const placeStair = useProjectStore((s) => s.placeStair)
  const placeRoom = useProjectStore((s) => s.placeRoom)
  const setDimEdit = useProjectStore((s) => s.setDimEdit)
  const dimEdit = useProjectStore((s) => s.dimEdit)
  const modifyPhase = useProjectStore((s) => s.modifyPhase)
  const setModifyPhase = useProjectStore((s) => s.setModifyPhase)
  const typedDistance = useProjectStore((s) => s.typedDistance)
  const setTypedDistance = useProjectStore((s) => s.setTypedDistance)
  const placeLevel = useProjectStore((s) => s.placeLevel)
  const cursorModel = useProjectStore((s) => s.cursorModel)

  const { handleModifyClick } = useModifyTools()
  const commitWallDistance = useWallDistanceCommit()

  const levelId = activeLevelId(model)
  const activeView = model.views.find((v) => v.id === model.activeViewId)
  const openElevationFromMarker = useProjectStore((s) => s.openElevationFromMarker)
  const openWorkingSection = useProjectStore((s) => s.openWorkingSection)
  const defaultDoorType = model.doorTypes[0]
  const defaultWindowType = model.windowTypes[0]

  const getModelPoint = useCallback(
    (clientX: number, clientY: number): Point2D => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      return toModel(clientX - rect.left, clientY - rect.top, transform)
    },
    [canvasRef, transform],
  )

  const buildAlignmentLines = useCallback((start: Point2D, cursor: Point2D) => {
    const lines: { start: Point2D; end: Point2D }[] = []
    const angle = (Math.atan2(cursor.y - start.y, cursor.x - start.x) * 180) / Math.PI
    const THRESH = 3
    const extent = 50000
    if (Math.abs(angle) < THRESH || Math.abs(angle - 180) < THRESH) {
      lines.push({ start: { x: -extent, y: start.y }, end: { x: extent, y: start.y } })
    }
    if (Math.abs(angle - 90) < THRESH || Math.abs(angle + 90) < THRESH) {
      lines.push({ start: { x: start.x, y: -extent }, end: { x: start.x, y: extent } })
    }
    return lines
  }, [])

  const hostedOffsetDims = useCallback((wall: Wall, offset: number) => {
    const len = wallLength(wall)
    const dir = {
      x: (wall.end.x - wall.start.x) / len,
      y: (wall.end.y - wall.start.y) / len,
    }
    const center = {
      x: wall.start.x + dir.x * offset,
      y: wall.start.y + dir.y * offset,
    }
    return [
      { start: wall.start, end: center, text: formatLength(offset) },
      { start: center, end: wall.end, text: formatLength(len - offset) },
    ]
  }, [])

  const buildPreviewDoor = useCallback(
    (wall: Wall, offset: number, handedness: 'left' | 'right'): Door => {
      const door = createDoorOnWall(
        wall,
        offset,
        defaultDoorType?.id ?? 'door-single-flush-900x2100',
        handedness,
        {
          width: defaultDoorType?.width ?? 900,
          height: defaultDoorType?.height ?? 2100,
        },
      )
      return { ...door, id: 'preview-door' }
    },
    [defaultDoorType],
  )

  const buildPreviewWindow = useCallback(
    (wall: Wall, offset: number): Window => {
      const win = createWindowOnWall(
        wall,
        offset,
        defaultWindowType?.id ?? 'window-fixed-915x1220',
        {
          width: defaultWindowType?.width ?? 915,
          height: defaultWindowType?.height ?? 1220,
          sillHeight: 900,
        },
      )
      return { ...win, id: 'preview-window' }
    },
    [defaultWindowType],
  )

  const updateHostedHover = useCallback(
    (cursor: Point2D, tool: 'door' | 'window') => {
      const tolerance = Math.max(150, 10 / transform.scale)
      const hit = findHostWall(model, cursor, tolerance, levelId)
      if (!hit) {
        if (tool === 'door') setDoorTool({ phase: 'active' })
        else setWindowTool({ phase: 'active' })
        setOverlay({ selectedIds })
        return
      }

      const handedness: 'left' | 'right' =
        tool === 'door' && doorTool.phase === 'hovering'
          ? doorTool.handedness
          : 'right'

      const state = {
        phase: 'hovering' as const,
        hostWallId: hit.wall.id,
        offsetFromStart: hit.offsetFromStart,
        handedness,
      }

      if (tool === 'door') setDoorTool(state)
      else setWindowTool(state)

      const dims = hostedOffsetDims(hit.wall, hit.offsetFromStart)
      const overlayBase: RenderOverlay = {
        hoverElementId: hit.wall.id,
        selectedIds,
        hostedTempDims: dims,
      }

      if (tool === 'door') {
        setOverlay({
          ...overlayBase,
          previewDoor: buildPreviewDoor(hit.wall, hit.offsetFromStart, state.handedness),
        })
      } else {
        setOverlay({
          ...overlayBase,
          previewWindow: buildPreviewWindow(hit.wall, hit.offsetFromStart),
        })
      }
    },
    [
      model,
      transform.scale,
      levelId,
      doorTool,
      windowTool,
      selectedIds,
      setDoorTool,
      setWindowTool,
      hostedOffsetDims,
      buildPreviewDoor,
      buildPreviewWindow,
    ],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const cursor = getModelPoint(e.clientX, e.clientY)
      setCursorModel(cursor)

      if (selectDragRef.current.active) {
        selectDragRef.current.x2 = e.clientX
        selectDragRef.current.y2 = e.clientY
        const dx = selectDragRef.current.x2 - selectDragRef.current.x1
        const dy = selectDragRef.current.y2 - selectDragRef.current.y1
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) selectDragRef.current.moved = true
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        setOverlay({
          selectedIds,
          selectionBox: {
            x1: selectDragRef.current.x1 - rect.left,
            y1: selectDragRef.current.y1 - rect.top,
            x2: selectDragRef.current.x2 - rect.left,
            y2: selectDragRef.current.y2 - rect.top,
            crossing: selectDragRef.current.x2 < selectDragRef.current.x1,
          },
        })
        return
      }

      const toleranceMM = 10 / transform.scale
      const nearby = spatialIndex.queryRadius(cursor, toleranceMM * 2)

      let snappedPoint = cursor
      let snapCandidate = undefined
      if (snapEnabled) {
        const drawingStart =
          wallTool.phase === 'placing'
            ? wallTool.start
            : gridTool.phase === 'placing'
              ? gridTool.start
              : sectionTool.phase === 'placing'
                ? sectionTool.start
                : refPlaneTool.phase === 'placing'
                  ? refPlaneTool.start
                  : floorTool.phase === 'placing'
                    ? floorTool.start
                    : undefined
        const snap = resolveSnap(cursor, model, nearby, transform, snapConfig, {
          activeTool,
          wall: wallTool,
          drawingStart,
        })
        if (snap.snapped) {
          snappedPoint = snap.point
          snapCandidate = snap.candidate
        }
      }

      if (activeTool === 'door') {
        updateHostedHover(snappedPoint, 'door')
        return
      }

      if (activeTool === 'window') {
        updateHostedHover(snappedPoint, 'window')
        return
      }

      if (wallTool.phase === 'placing') {
        let end = snappedPoint
        if (shiftHeld) end = constrainOrthogonal(wallTool.start, end)
        const preview: Wall = {
          id: 'preview',
          typeId: 'basic-wall-200',
          levelId,
          start: wallTool.start,
          end,
          thickness: 200,
          height: wallHeight,
          locationLine: 'wall-centerline',
          baseOffset: 0,
          topOffset: 0,
          hostedIds: [],
          joinStatus: 'allow',
          flipped: false,
        }
        setOverlay({
          previewWall: preview,
          snapCandidate,
          alignmentLines: buildAlignmentLines(wallTool.start, end),
          tempDimension: {
            start: wallTool.start,
            end,
            text: formatLength(wallLength(preview)),
          },
          selectedIds,
        })
        return
      }

      if (gridTool.phase === 'placing') {
        let end = snappedPoint
        end = resolveGridPlacementEnd(gridTool.start, end, {
          shiftOrthogonal: shiftHeld,
          snapConfig,
          angleSnapEnabled: snapEnabled && !shiftHeld,
        })
        const angleLabel = formatAngleLabel(angleDegrees(gridTool.start, end))
        const snapText = placementSnapLabel(gridTool.start, end, snapCandidate)
        setOverlay({
          selectedIds,
          snapCandidate,
          previewGridLine: { start: gridTool.start, end },
          alignmentLines: extensionAlignmentLines(gridTool.start, end),
          angleArc: { vertex: gridTool.start, end, label: angleLabel },
          snapTooltip: snapText ? { position: end, text: snapText } : undefined,
        })
        return
      }

      if (sectionTool.phase === 'placing') {
        const ann =
          activeView?.annotationCropRegion ??
          (activeView?.cropRegion ? revitAnnotationCrop(activeView.cropRegion) : undefined)
        let end = snappedPoint
        if (shiftHeld) end = constrainOrthogonal(sectionTool.start, end)
        const line = resolveSectionPreviewLine(sectionTool.start, end, ann)
        setOverlay({
          selectedIds,
          snapCandidate,
          previewDatumLine: { start: line.start, end: line.end, kind: 'working-section' },
          tempDimension: {
            start: line.start,
            end: line.end,
            text: formatLength(distance(line.start, line.end)),
          },
        })
        return
      }

      if (floorTool.phase === 'placing') {
        let end = snappedPoint
        if (shiftHeld) end = constrainOrthogonal(floorTool.start, end)
        const rect = rectFromPoints(floorTool.start, end)
        setOverlay({
          selectedIds,
          snapCandidate,
          previewFloor: rect,
          tempDimension: {
            start: { x: rect.minX, y: rect.minY },
            end: { x: rect.maxX, y: rect.maxY },
            text: formatLength(
              Math.max(rect.maxX - rect.minX, rect.maxY - rect.minY),
            ),
          },
        })
        return
      }

      if (activeTool === 'column') {
        setOverlay({
          selectedIds,
          snapCandidate,
          previewColumn: {
            id: 'preview-col',
            typeId: 'col-rect',
            levelId,
            position: snappedPoint,
            rotation: 0,
            width: DEFAULT_COLUMN_SIZE,
            depth: DEFAULT_COLUMN_SIZE,
          },
        })
        return
      }

      if (activeTool === 'stair') {
        setOverlay({
          selectedIds,
          snapCandidate,
          previewStair: {
            id: 'preview-stair',
            levelId,
            position: snappedPoint,
            rotation: 0,
            width: DEFAULT_STAIR_WIDTH,
            depth: DEFAULT_STAIR_DEPTH,
          },
        })
        return
      }

      if (refPlaneTool.phase === 'placing') {
        let end = snappedPoint
        if (shiftHeld) end = constrainOrthogonal(refPlaneTool.start, end)
        const clipped = clipLineToScopeBox(refPlaneTool.start, end)
        setOverlay({
          selectedIds,
          snapCandidate,
          previewDatumLine: {
            start: clipped.start,
            end: clipped.end,
            kind: 'reference-plane',
          },
        })
        return
      }

      if (activeTool === 'room') {
        const detected = detectRoomAtPoint(model, snappedPoint, levelId)
        setOverlay({
          selectedIds,
          snapCandidate,
          previewRoomPolygon: detected?.polygon,
        })
        return
      }

      if (modifyPhase) {
        const guideLines: { start: Point2D; end: Point2D }[] = []
        if (modifyPhase.pointA) {
          guideLines.push({ start: modifyPhase.pointA, end: snappedPoint })
        }
        if (
          modifyPhase.tool === 'rotate' &&
          modifyPhase.step >= 2 &&
          modifyPhase.pointA &&
          modifyPhase.pointB
        ) {
          guideLines.push({ start: modifyPhase.pointA, end: modifyPhase.pointB })
        }
        setOverlay({
          selectedIds,
          snapCandidate,
          alignmentLines: guideLines,
          ...buildSelectionOverlay(model, selectedIds),
        })
        return
      }

      if (activeTool === 'modify') {
        const hits = pickAtPoint(model, nearby, cursor, activeView, selectionFilters)
        setTabCycleHits(hits)
        const hoverId = hits[0]?.elementId
        setOverlay({
          hoverElementId: hoverId,
          selectedIds,
          snapCandidate,
          ...buildSelectionOverlay(model, selectedIds),
        })
        return
      }

      setOverlay({ selectedIds, snapCandidate })
    },
    [
      getModelPoint,
      setCursorModel,
      canvasRef,
      transform,
      spatialIndex,
      snapEnabled,
      wallTool,
      model,
      snapConfig,
      activeTool,
      shiftHeld,
      wallHeight,
      selectedIds,
      buildAlignmentLines,
      updateHostedHover,
      levelId,
      setTabCycleHits,
      gridTool,
      sectionTool,
      refPlaneTool,
      floorTool,
      activeView,
      modifyPhase,
    ],
  )

  const commitColumn = useCallback(
    (pt: Point2D) => {
      const column: Column = {
        id: generateId('col'),
        typeId: 'col-rect',
        levelId,
        position: pt,
        rotation: 0,
        width: DEFAULT_COLUMN_SIZE,
        depth: DEFAULT_COLUMN_SIZE,
      }
      placeColumn(column)
      setStatusMessage(`Column ${nextColumnName(model)} placed`)
      setOverlay({ selectedIds })
    },
    [levelId, model, placeColumn, setStatusMessage, selectedIds],
  )

  const commitFloor = useCallback(
    (start: Point2D, end: Point2D) => {
      const rect = rectFromPoints(start, end)
      if (rect.maxX - rect.minX < 500 || rect.maxY - rect.minY < 500) return
      const floor = floorFromPoints(start, end, levelId, generateId('floor'))
      placeFloor(floor)
      setFloorTool({ phase: 'active' })
      setStatusMessage('Click first corner of floor')
      setOverlay({ selectedIds })
    },
    [levelId, placeFloor, setFloorTool, setStatusMessage, selectedIds],
  )

  const commitStair = useCallback(
    (pt: Point2D) => {
      const stair: Stair = {
        id: generateId('stair'),
        levelId,
        position: pt,
        rotation: 0,
        width: DEFAULT_STAIR_WIDTH,
        depth: DEFAULT_STAIR_DEPTH,
      }
      placeStair(stair)
      setStatusMessage('Click to place stair')
      setOverlay({ selectedIds })
    },
    [levelId, placeStair, setStatusMessage, selectedIds],
  )

  const commitRefPlane = useCallback(
    (start: Point2D, end: Point2D) => {
      if (distance(start, end) < 100) return
      const plane = buildRefPlaneFromPoints(start, end, model)
      placeRefPlane(plane)
      setRefPlaneTool({ phase: 'active' })
      setStatusMessage('Click to place reference plane start')
      setOverlay({ selectedIds })
    },
    [model, placeRefPlane, setRefPlaneTool, setStatusMessage, selectedIds],
  )

  const commitSection = useCallback(
    (start: Point2D, end: Point2D) => {
      if (distance(start, end) < 100) return
      const ann =
        activeView?.annotationCropRegion ??
        (activeView?.cropRegion ? revitAnnotationCrop(activeView.cropRegion) : undefined)
      const { section, view } = buildWorkingSectionFromPoints(
        start,
        end,
        levelId,
        model,
        ann,
      )
      placeWorkingSection(section, view)
      setSectionTool({ phase: 'active' })
      setStatusMessage('Click to place section line start')
      setOverlay({ selectedIds })
    },
    [
      activeView?.cropRegion,
      levelId,
      model,
      placeWorkingSection,
      setSectionTool,
      setStatusMessage,
      selectedIds,
    ],
  )

  const commitGrid = useCallback(
    (start: Point2D, end: Point2D) => {
      if (distance(start, end) < 100) return
      const vertical = isGridVertical(start, end)
      const bbox = getModelBBox(model)
      const viewMin = bbox
        ? { x: bbox.minX, y: bbox.minY }
        : { x: -5000, y: -5000 }
      const viewMax = bbox
        ? { x: bbox.maxX, y: bbox.maxY }
        : { x: 15000, y: 15000 }
      const extended = extendGridToView(start, end, viewMin, viewMax)
      const grid: Grid = {
        id: generateId('grid'),
        name: nextGridName(model, vertical),
        start: extended.start,
        end: extended.end,
        bubbleEnd: 'end',
        extentStart: 0,
        extentEnd: 500,
      }
      placeGrid(grid)
      setGridTool({ phase: 'active' })
      setStatusMessage('Click to place grid start point')
      setOverlay({ selectedIds })
    },
    [model, placeGrid, setGridTool, setStatusMessage, selectedIds],
  )

  const commitRoom = useCallback(
    (point: Point2D) => {
      const detected = detectRoomAtPoint(model, point, levelId)
      if (!detected) {
        setStatusMessage('No enclosed area found — click inside a closed boundary')
        return
      }
      const room: Room = {
        id: generateId('room'),
        name: 'Room',
        number: nextRoomNumber(model),
        levelId,
        area: detected.area,
        perimeter: detected.perimeter,
        tagPosition: detected.tagPosition,
        boundaryWallIds: detected.boundaryWallIds,
      }
      placeRoom(room)
      setStatusMessage(`Room placed — ${detected.area.toFixed(1)} m²`)
      setOverlay({ selectedIds })
    },
    [model, levelId, placeRoom, setStatusMessage, selectedIds],
  )

  const commitWall = useCallback(
    (start: Point2D, end: Point2D) => {
      if (distance(start, end) < 50) return
      const wall: Wall = {
        id: generateId('wall'),
        typeId: 'basic-wall-200',
        levelId,
        start,
        end,
        thickness: 200,
        height: wallHeight,
        locationLine: 'wall-centerline',
        baseOffset: 0,
        topOffset: 0,
        hostedIds: [],
        joinStatus: 'allow',
        flipped: false,
      }
      placeWall(wall)
      if (chainWalls) {
        setWallTool({ phase: 'placing', start: end, chain: true })
        setStatusMessage('Click to place wall end point')
      } else {
        setWallTool({ phase: 'active' })
        setStatusMessage('Click to place wall start point')
      }
      setOverlay({ selectedIds })
    },
    [
      levelId,
      placeWall,
      chainWalls,
      setWallTool,
      setStatusMessage,
      wallHeight,
      selectedIds,
    ],
  )

  const commitHosted = useCallback(
    (tool: 'door' | 'window') => {
      const state = tool === 'door' ? doorTool : windowTool
      if (state.phase !== 'hovering') return
      const wall = model.walls.find((w) => w.id === state.hostWallId)
      if (!wall) return

      if (tool === 'door') {
        const door = buildPreviewDoor(wall, state.offsetFromStart, state.handedness)
        placeDoor({ ...door, id: generateId('door') })
        setDoorTool({ phase: 'active' })
        setStatusMessage('Click on a wall to place door')
      } else {
        const win = buildPreviewWindow(wall, state.offsetFromStart)
        placeWindow({ ...win, id: generateId('window') })
        setWindowTool({ phase: 'active' })
        setStatusMessage('Click on a wall to place window')
      }
      setOverlay({ selectedIds })
    },
    [
      doorTool,
      windowTool,
      model.walls,
      buildPreviewDoor,
      buildPreviewWindow,
      placeDoor,
      placeWindow,
      setDoorTool,
      setWindowTool,
      setStatusMessage,
      selectedIds,
    ],
  )

  const applySelection = useCallback(
    (ids: string[], e: { ctrlKey: boolean; shiftKey: boolean }) => {
      if (e.shiftKey) {
        setSelectedIds(selectedIds.filter((id) => !ids.includes(id)))
        return
      }
      if (e.ctrlKey) {
        const merged = [...selectedIds]
        for (const id of ids) {
          if (merged.includes(id)) merged.splice(merged.indexOf(id), 1)
          else merged.push(id)
        }
        setSelectedIds(merged)
        return
      }
      setSelectedIds(ids)
    },
    [selectedIds, setSelectedIds],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return
      if (selectDragRef.current.moved) {
        selectDragRef.current.moved = false
        return
      }

      let pt = getModelPoint(e.clientX, e.clientY)

      if (isModifyTool(activeTool) && handleModifyClick(pt)) {
        return
      }

      if (activeTool === 'level') {
        placeLevel(pt)
        setActiveTool('modify')
        return
      }

      if (activeTool === 'door') {
        commitHosted('door')
        return
      }
      if (activeTool === 'window') {
        commitHosted('window')
        return
      }

      if (activeTool === 'room') {
        commitRoom(pt)
        return
      }

      if (activeTool === 'grid') {
        if (gridTool.phase === 'active' || gridTool.phase === 'idle') {
          setGridTool({ phase: 'placing', start: pt })
          setStatusMessage('Click to place grid end point')
          return
        }
        if (gridTool.phase === 'placing') {
          commitGrid(gridTool.start, pt)
          return
        }
      }

      if (activeTool === 'section') {
        if (sectionTool.phase === 'active' || sectionTool.phase === 'idle') {
          setSectionTool({ phase: 'placing', start: pt })
          setStatusMessage('Click to place section line end')
          return
        }
        if (sectionTool.phase === 'placing') {
          commitSection(sectionTool.start, pt)
          return
        }
      }

      if (activeTool === 'column') {
        commitColumn(pt)
        return
      }

      if (activeTool === 'stair') {
        commitStair(pt)
        return
      }

      if (activeTool === 'floor') {
        if (floorTool.phase === 'active' || floorTool.phase === 'idle') {
          setFloorTool({ phase: 'placing', start: pt })
          setStatusMessage('Click opposite corner of floor')
          return
        }
        if (floorTool.phase === 'placing') {
          commitFloor(floorTool.start, pt)
          return
        }
      }

      if (activeTool === 'reference-plane') {
        if (refPlaneTool.phase === 'active' || refPlaneTool.phase === 'idle') {
          setRefPlaneTool({ phase: 'placing', start: pt })
          setStatusMessage('Click to place reference plane end')
          return
        }
        if (refPlaneTool.phase === 'placing') {
          commitRefPlane(refPlaneTool.start, pt)
          return
        }
      }

      if (snapEnabled && wallTool.phase === 'placing') {
        const nearby = spatialIndex.queryRadius(pt, 10 / transform.scale)
        const snap = resolveSnap(pt, model, nearby, transform, snapConfig, {
          activeTool,
          wall: wallTool,
          drawingStart: wallTool.start,
        })
        if (snap.snapped) pt = snap.point
      }
      if (shiftHeld && wallTool.phase === 'placing') {
        pt = constrainOrthogonal(wallTool.start, pt)
      }

      if (activeTool === 'wall') {
        if (wallTool.phase === 'active' || wallTool.phase === 'idle') {
          setWallTool({ phase: 'placing', start: pt, chain: chainWalls })
          setStatusMessage('Click to place wall end point')
          return
        }
        if (wallTool.phase === 'placing') {
          const distEnd = commitWallDistance(pt)
          commitWall(wallTool.start, distEnd ?? pt)
          return
        }
      }

      if (isModifyTool(activeTool)) {
        return
      }

      if (activeTool === 'modify' && !dimEdit) {
        const wall =
          selectedIds.length === 1
            ? model.walls.find((w) => w.id === selectedIds[0])
            : undefined
        if (wall) {
          const dims = computeWallSelectionDims(wall, model)
          const hitDim = hitTestSelectionDim(dims, pt, (p) => toCanvas(p, transform))
          if (hitDim?.editable) {
            const canvas = canvasRef.current
            if (canvas) {
              const rect = canvas.getBoundingClientRect()
              const mid = {
                x: (wall.start.x + wall.end.x) / 2,
                y: (wall.start.y + wall.end.y) / 2,
              }
              const [sx, sy] = toCanvas(mid, transform)
              setDimEdit({
                wallId: wall.id,
                dimId: hitDim.id,
                screenX: sx + rect.left - 48,
                screenY: sy + rect.top - 24,
                currentValue: hitDim.valueText,
              })
            }
            return
          }
        }

        const nearby = spatialIndex.queryRadius(pt, 10 / transform.scale)
        const hits = pickAtPoint(model, nearby, pt, activeView, selectionFilters)
        if (hits.length > 0) {
          applySelection([hits[0].elementId], e)
        } else if (!e.ctrlKey) {
          setSelectedIds([])
        }
      }
    },
    [
      getModelPoint,
      activeTool,
      handleModifyClick,
      placeLevel,
      commitWallDistance,
      commitHosted,
      commitRoom,
      gridTool,
      commitGrid,
      setGridTool,
      sectionTool,
      commitSection,
      setSectionTool,
      refPlaneTool,
      commitRefPlane,
      setRefPlaneTool,
      floorTool,
      commitFloor,
      setFloorTool,
      commitColumn,
      commitStair,
      dimEdit,
      setDimEdit,
      canvasRef,
      snapEnabled,
      wallTool,
      spatialIndex,
      transform,
      model,
      snapConfig,
      activeTool,
      shiftHeld,
      setWallTool,
      setStatusMessage,
      chainWalls,
      commitWall,
      tabCycleHits,
      tabCycleIndex,
      applySelection,
      setSelectedIds,
    ],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button === 1) {
        e.preventDefault()
        panRef.current = { active: true, lastX: e.clientX, lastY: e.clientY }
        return
      }
      if (e.button === 0 && activeTool === 'modify' && !isModifyTool(activeTool)) {
        selectDragRef.current = {
          active: true,
          x1: e.clientX,
          y1: e.clientY,
          x2: e.clientX,
          y2: e.clientY,
          moved: false,
        }
      }
    },
    [activeTool],
  )

  const finishSelectDrag = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!selectDragRef.current.active) return
      selectDragRef.current.active = false
      if (!selectDragRef.current.moved) return

      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x1 = selectDragRef.current.x1 - rect.left
      const y1 = selectDragRef.current.y1 - rect.top
      const x2 = selectDragRef.current.x2 - rect.left
      const y2 = selectDragRef.current.y2 - rect.top
      const crossing = selectDragRef.current.x2 < selectDragRef.current.x1
      const box = modelBoxFromScreen(x1, y1, x2, y2, (cx, cy) =>
        toModel(cx, cy, transform),
      )
      const items = spatialIndex.queryBox(box)
      const ids = selectInBox(model, items, box, crossing, activeView)
      applySelection(ids, e)
      setOverlay({ selectedIds: ids, selectionBox: undefined })
      selectDragRef.current.moved = false
    },
    [canvasRef, transform, spatialIndex, model, applySelection, activeView],
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return
      const pt = getModelPoint(e.clientX, e.clientY)
      const nearby = spatialIndex.queryRadius(pt, 800 / transform.scale)
      const hits = pickAtPoint(model, nearby, pt, activeView, selectionFilters)
      const elevHit = hits.find((h) => h.elementType === 'elevation-marker')
      if (elevHit) {
        openElevationFromMarker(elevHit.elementId)
        return
      }
      const wsHit = hits.find((h) => h.elementType === 'working-section')
      if (wsHit) {
        openWorkingSection(wsHit.elementId)
        return
      }
      if (hits.length === 0) {
        window.dispatchEvent(new Event('td-zoom-all'))
      }
    },
    [
      getModelPoint,
      spatialIndex,
      transform,
      model,
      activeView,
      openElevationFromMarker,
      openWorkingSection,
    ],
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      panRef.current.active = false
      finishSelectDrag(e)
    },
    [finishSelectDrag],
  )

  const handlePanMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!panRef.current.active) return
      const dx = e.clientX - panRef.current.lastX
      const dy = e.clientY - panRef.current.lastY
      panRef.current.lastX = e.clientX
      panRef.current.lastY = e.clientY
      setTransform({
        ...transform,
        originX: transform.originX + dx,
        originY: transform.originY + dy,
      })
    },
    [transform, setTransform],
  )

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const before = toModel(cx, cy, transform)
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      const newScale = Math.max(0.001, Math.min(2, transform.scale * factor))
      setTransform({
        scale: newScale,
        originX: cx - before.x * newScale,
        originY: cy + before.y * newScale,
      })
    },
    [canvasRef, transform, setTransform],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [canvasRef, handleWheel])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (e.key === 'Shift') setShiftHeld(true)

      if (e.key === ' ' && (activeTool === 'door' || activeTool === 'window')) {
        e.preventDefault()
        if (activeTool === 'door' && doorTool.phase === 'hovering') {
          setDoorTool({
            ...doorTool,
            handedness: doorTool.handedness === 'left' ? 'right' : 'left',
          })
        }
      }

      if (e.key === 'Tab' && activeTool === 'modify') {
        e.preventDefault()
        if (tabCycleHits.length > 0) {
          const next = (tabCycleIndex + 1) % tabCycleHits.length
          setTabCycleIndex(next)
          setSelectedIds([tabCycleHits[next].elementId])
        }
      }

      if (wallTool.phase === 'placing') {
        if (e.key === 'Enter') {
          e.preventDefault()
          const distEnd = commitWallDistance(cursorModel)
          if (distEnd) {
            commitWall(wallTool.start, distEnd)
          }
          return
        }
        if (e.key.length === 1 && /[0-9.'"]/.test(e.key)) {
          e.preventDefault()
          setTypedDistance(typedDistance + e.key)
          return
        }
        if (e.key === 'Backspace' && typedDistance) {
          e.preventDefault()
          setTypedDistance(typedDistance.slice(0, -1))
          return
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelected()
      }

      if (e.key === 'Escape') {
        if (wallTool.phase === 'placing') {
          setWallTool({ phase: 'active' })
          setStatusMessage('Click to place wall start point')
        } else if (doorTool.phase === 'hovering') {
          setDoorTool({ phase: 'active' })
          setStatusMessage('Click on a wall to place door')
        } else if (windowTool.phase === 'hovering') {
          setWindowTool({ phase: 'active' })
          setStatusMessage('Click on a wall to place window')
        } else if (gridTool.phase === 'placing') {
          setGridTool({ phase: 'active' })
          setStatusMessage('Click to place grid start point')
        } else if (modifyPhase) {
          setModifyPhase(null)
          setActiveTool('modify')
          setStatusMessage('Modify cancelled')
        } else {
          setTypedDistance('')
          setActiveTool('modify')
          setWallTool({ phase: 'idle' })
          setDoorTool({ phase: 'idle' })
          setWindowTool({ phase: 'idle' })
          setStatusMessage('Click to select element')
        }
        setOverlay({ selectedIds })
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [
    activeTool,
    wallTool,
    doorTool,
    windowTool,
    gridTool,
    setGridTool,
    tabCycleHits,
    tabCycleIndex,
    selectedIds,
    setWallTool,
    setDoorTool,
    setWindowTool,
    setStatusMessage,
    setActiveTool,
    setTabCycleIndex,
    setSelectedIds,
    deleteSelected,
    modifyPhase,
    setModifyPhase,
    typedDistance,
    setTypedDistance,
    commitWallDistance,
    commitWall,
    cursorModel,
  ])

  useEffect(() => {
    if (activeTool === 'door' && doorTool.phase === 'hovering') {
      const wall = model.walls.find((w) => w.id === doorTool.hostWallId)
      if (wall) {
        setOverlay((o) => ({
          ...o,
          previewDoor: buildPreviewDoor(
            wall,
            doorTool.offsetFromStart,
            doorTool.handedness,
          ),
        }))
      }
    }
  }, [doorTool, activeTool, model.walls, buildPreviewDoor])

  useEffect(() => {
    const fit = () => {
      const container = containerRef.current
      if (!container) return
      const bbox = getModelBBox(model)
      if (!bbox) return
      setTransform(
        fitTransformToBBox(bbox, container.clientWidth, container.clientHeight),
      )
    }
    fit()
    window.addEventListener('td-zoom-all', fit)
    return () => window.removeEventListener('td-zoom-all', fit)
  }, [model, setTransform, containerRef])

  const cursorStyle =
    activeTool === 'wall' ||
    activeTool === 'door' ||
    activeTool === 'window' ||
    activeTool === 'grid' ||
    activeTool === 'section' ||
    activeTool === 'reference-plane' ||
    activeTool === 'column' ||
    activeTool === 'floor' ||
    activeTool === 'stair' ||
    activeTool === 'room' ||
    isModifyTool(activeTool)
      ? 'crosshair'
      : activeTool === 'modify'
        ? 'default'
        : 'crosshair'

  return {
    overlay,
    selectedIds,
    cursorStyle,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handlePanMove,
    handleClick,
    handleDoubleClick,
  }
}
