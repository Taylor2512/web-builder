import { useCallback, useState } from 'react'

export type ViewportState = { zoom: number; panX: number; panY: number }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const useViewport = () => {
  const [viewport, setViewport] = useState<ViewportState>({ zoom: 1, panX: 0, panY: 0 })

  const setZoom = useCallback((zoom: number) => {
    setViewport((prev) => ({ ...prev, zoom: clamp(zoom, 0.25, 2) }))
  }, [])

  const zoomIn = useCallback(() => setZoom(viewport.zoom + 0.1), [setZoom, viewport.zoom])
  const zoomOut = useCallback(() => setZoom(viewport.zoom - 0.1), [setZoom, viewport.zoom])
  const resetViewport = useCallback(() => setViewport({ zoom: 1, panX: 0, panY: 0 }), [])

  const panBy = useCallback((dx: number, dy: number) => {
    setViewport((prev) => ({ ...prev, panX: prev.panX + dx, panY: prev.panY + dy }))
  }, [])

  return { viewport, setZoom, zoomIn, zoomOut, panBy, resetViewport }
}
