import type React from 'react'
import type { Device } from '../types/network'

interface DeviceNodeProps {
  device: Device
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>, device: Device) => void
  onClick?: (device: Device) => void
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>, device: Device) => void
}

export function DeviceNode({ device, onMouseDown, onClick, onContextMenu }: DeviceNodeProps) {
  return (
    <div
      className={`device device-${device.type}`}
      style={{ left: device.x, top: device.y }}
      onMouseDown={(event) => onMouseDown(event, device)}
      onClick={() => onClick?.(device)}
      onContextMenu={(event) => onContextMenu(event, device)}
    >
      <span className="device-icon" aria-hidden="true" />
      <span className="device-label">{device.name}</span>
    </div>
  )
}
