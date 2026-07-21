import type React from 'react'
import type { Connection, Device } from '../types/network'
import { DeviceNode } from './DeviceNode'

interface CanvasProps {
  devices: Device[]
  connections: Connection[]
  wiringMode: boolean
  wiringSourceId: number | null
  contextMenu: { deviceId: number; x: number; y: number } | null
  canvasRef: React.RefObject<HTMLDivElement>
  onMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void
  onMouseUp: () => void
  onMouseLeave: () => void
  onCanvasClick: () => void
  onDeviceMouseDown: (event: React.MouseEvent<HTMLDivElement>, device: Device) => void
  onDeviceClick: (device: Device) => void
  onDeviceContextMenu: (event: React.MouseEvent<HTMLDivElement>, device: Device) => void
  onDuplicateDevice: () => void
  onRemoveDevice: () => void
  onRemoveConnections: () => void
}

export function Canvas({
  devices,
  connections,
  wiringMode,
  wiringSourceId,
  contextMenu,
  canvasRef,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onCanvasClick,
  onDeviceMouseDown,
   onDeviceClick,
  onDeviceContextMenu,
  onDuplicateDevice,
  onRemoveDevice,
  onRemoveConnections,
}: CanvasProps) {
  const getDeviceById = (id: number) => devices.find((d) => d.id === id)

  const getCableColor = (type: Connection['type']) => {
    switch (type) {
      case 'ethernet':
        return '#22c55e'
      case 'fiber':
        return '#f97316'
      case 'serial':
        return '#38bdf8'
      case 'wireless':
        return '#eab308'
      default:
        return '#e5e7eb'
    }
  }

  return (
    <div
      className="canvas"
      ref={canvasRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onClick={onCanvasClick}
    >
      <svg className="canvas-connections">
        {connections.map((conn) => {
          const from = getDeviceById(conn.fromId)
          const to = getDeviceById(conn.toId)
          if (!from || !to) return null

          const x1 = from.x + 40
          const y1 = from.y + 20
          const x2 = to.x + 40
          const y2 = to.y + 20

          return (
            <line
              key={conn.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={getCableColor(conn.type)}
              strokeWidth={2}
              strokeLinecap="round"
              className="canvas-connection-line"
            />
          )
        })}
      </svg>

      {devices.map((d) => (
        <DeviceNode
          key={d.id}
          device={d}
          onMouseDown={onDeviceMouseDown}
          onClick={onDeviceClick}
          onContextMenu={onDeviceContextMenu}
        />
      ))}

      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button type="button" onClick={onDuplicateDevice}>
            Duplizieren
          </button>
          <button type="button" onClick={onRemoveDevice}>
            Entfernen
          </button>
          <button type="button" onClick={onRemoveConnections}>
            Verkabelungen entfernen
          </button>
        </div>
      )}
    </div>
  )
}
