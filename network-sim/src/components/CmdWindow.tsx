import { useState, useRef, type MouseEvent, type ReactNode } from 'react'

interface CmdWindowProps {
  title?: string
  children: ReactNode
  onClose?: () => void
}

export function CmdWindow({ title = 'Eingabeaufforderung', children, onClose }: CmdWindowProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ width: 640, height: 320 })
  const draggingRef = useRef<{ offsetX: number; offsetY: number } | null>(null)
  const resizingRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null)

  const handleMouseDownTitle = (event: MouseEvent<HTMLDivElement>) => {
    const rect = (event.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect()
    draggingRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    }
    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
  }

  const handleWindowMouseMove = (event: MouseEvent | globalThis.MouseEvent) => {
    if (draggingRef.current) {
      const { offsetX, offsetY } = draggingRef.current
      setPosition({ x: event.clientX - offsetX, y: event.clientY - offsetY })
      return
    }

    if (resizingRef.current) {
      const { startX, startY, startW, startH } = resizingRef.current
      const deltaX = event.clientX - startX
      const deltaY = event.clientY - startY
      const newWidth = Math.max(360, startW + deltaX)
      const newHeight = Math.max(180, startH + deltaY)
      setSize({ width: newWidth, height: newHeight })
    }
  }

  const handleWindowMouseUp = () => {
    draggingRef.current = null
    resizingRef.current = null
    window.removeEventListener('mousemove', handleWindowMouseMove)
    window.removeEventListener('mouseup', handleWindowMouseUp)
  }

  const handleResizeMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    const rect = (event.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect()
    resizingRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startW: rect.width,
      startH: rect.height,
    }
    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
  }

  return (
    <div
      className="cmd-window"
      style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
    >
      <div className="cmd-window-titlebar" onMouseDown={handleMouseDownTitle}>
        <span className="cmd-window-title">{title}</span>
        {onClose && (
          <button
            type="button"
            className="cmd-window-close"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          >
            ×
          </button>
        )}
      </div>
      <div className="cmd-window-body">{children}</div>
      <div className="cmd-window-resize-handle" onMouseDown={handleResizeMouseDown} />
    </div>
  )
}
