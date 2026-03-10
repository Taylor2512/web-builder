import { useEffect, useRef } from 'react'

type GridOverlayProps = {
  size: number
  visible: boolean
  zoom: number
}

export default function GridOverlay({ size, visible, zoom }: GridOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !visible) return

    const parent = canvas.parentElement
    if (!parent) return

    const context = canvas.getContext('2d')
    if (!context) return

    const draw = () => {
      const ratio = window.devicePixelRatio || 1
      const width = parent.clientWidth
      const height = parent.clientHeight
      canvas.width = Math.max(1, Math.floor(width * ratio))
      canvas.height = Math.max(1, Math.floor(height * ratio))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, width, height)

      const step = Math.max(4, Math.round(size * zoom))
      context.strokeStyle = 'rgba(99, 102, 241, 0.17)'
      context.lineWidth = 1

      for (let x = 0; x <= width; x += step) {
        context.beginPath()
        context.moveTo(x + 0.5, 0)
        context.lineTo(x + 0.5, height)
        context.stroke()
      }

      for (let y = 0; y <= height; y += step) {
        context.beginPath()
        context.moveTo(0, y + 0.5)
        context.lineTo(width, y + 0.5)
        context.stroke()
      }
    }

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(parent)
    window.addEventListener('resize', draw)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', draw)
    }
  }, [size, visible, zoom])

  if (!visible) return null
  return <canvas ref={canvasRef} aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 16 }} />
}
