import type { BBox, Point2D } from '../engine/types'

export interface ViewTransform {
  originX: number
  originY: number
  scale: number
}

export function toCanvas(pt: Point2D, tx: ViewTransform): [number, number] {
  return [tx.originX + pt.x * tx.scale, tx.originY - pt.y * tx.scale]
}

export function toModel(cx: number, cy: number, tx: ViewTransform): Point2D {
  return {
    x: (cx - tx.originX) / tx.scale,
    y: (tx.originY - cy) / tx.scale,
  }
}

export function getCssColor(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

export function fitTransformToBBox(
  bbox: BBox,
  width: number,
  height: number,
  padding = 80,
): ViewTransform {
  const modelW = bbox.maxX - bbox.minX || 1000
  const modelH = bbox.maxY - bbox.minY || 1000
  const scaleX = (width - padding * 2) / modelW
  const scaleY = (height - padding * 2) / modelH
  const scale = Math.min(scaleX, scaleY)
  const cx = (bbox.minX + bbox.maxX) / 2
  const cy = (bbox.minY + bbox.maxY) / 2
  return {
    originX: width / 2 - cx * scale,
    originY: height / 2 + cy * scale,
    scale,
  }
}

export const DEFAULT_TRANSFORM: ViewTransform = {
  originX: 400,
  originY: 400,
  scale: 0.05,
}
