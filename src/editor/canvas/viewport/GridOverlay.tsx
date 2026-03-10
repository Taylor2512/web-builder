import type { CSSProperties } from 'react'

type GridOverlayProps = {
  size: number
  visible: boolean
  zoom: number
}

export default function GridOverlay({ size, visible, zoom }: GridOverlayProps) {
  if (!visible) return null

  const scaled = Math.max(4, size * zoom)
  const style: CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage: `linear-gradient(to right, rgba(99, 102, 241, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px)`,
    backgroundSize: `${scaled}px ${scaled}px`,
    borderRadius: 16,
  }

  return <div aria-hidden style={style} />
}
