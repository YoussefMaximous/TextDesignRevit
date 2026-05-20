import { useCallback, useEffect, useRef } from 'react'
import { renderViewport } from '../renderer/ViewportRenderer'
import { ContextMenu } from './ContextMenu'
import { DimEditOverlay } from './DimEditOverlay'
import { DistanceInputOverlay } from './DistanceInputOverlay'
import { useViewportContextMenu } from '../hooks/useViewportContextMenu'
import { useViewportInteraction } from '../hooks/useViewportInteraction'
import { useProjectStore } from '../store/projectStore'
import { toModel } from '../renderer/transform'

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  const model = useProjectStore((s) => s.model)
  const transform = useProjectStore((s) => s.transform)
  const setTransform = useProjectStore((s) => s.setTransform)
  const { menu, openViewportMenu, closeMenu } = useViewportContextMenu()

  const {
    overlay,
    selectedIds,
    cursorStyle,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handlePanMove,
    handleClick,
    handleDoubleClick,
  } = useViewportInteraction(canvasRef, containerRef)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = container.clientWidth
    const h = container.clientHeight
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }

    renderViewport(ctx, model, transform, w, h, {
      ...overlay,
      selectedIds,
    })
  }, [model, transform, overlay, selectedIds])

  useEffect(() => {
    const loop = () => {
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  return (
    <div ref={containerRef} className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ cursor: cursorStyle, background: 'var(--vp-background)' }}
        onMouseMove={(e) => {
          handleMouseMove(e)
          handlePanMove(e)
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => {
          e.preventDefault()
          openViewportMenu(e.clientX, e.clientY)
        }}
        onWheel={(e) => {
          e.preventDefault()
          const canvas = canvasRef.current
          if (!canvas) return
          const rect = canvas.getBoundingClientRect()
          const cx = e.clientX - rect.left
          const cy = e.clientY - rect.top
          const before = toModel(cx, cy, transform)
          const factor = e.deltaY > 0 ? 0.9 : 1.1
          const scale = Math.max(0.002, Math.min(2, transform.scale * factor))
          setTransform({
            originX: cx - before.x * scale,
            originY: cy + before.y * scale,
            scale,
          })
        }}
      />
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={closeMenu} />
      )}
      <DimEditOverlay />
      <DistanceInputOverlay />
    </div>
  )
}
