import type { DeviceType } from '../types/network'

interface SidebarProps {
  onAddDevice: (type: DeviceType) => void
}

export function Sidebar({ onAddDevice }: SidebarProps) {
  return (
    <aside className="sidebar">
      <h2>Palette</h2>
      <button onClick={() => onAddDevice('pc')}>PC hinzufügen</button>
      <button onClick={() => onAddDevice('server')}>Server hinzufügen</button>
      <button onClick={() => onAddDevice('switch')}>Switch hinzufügen</button>
      <button onClick={() => onAddDevice('router')}>Router hinzufügen</button>
      <button onClick={() => onAddDevice('firewall')}>Firewall hinzufügen</button>
      <button onClick={() => onAddDevice('switchpanel')}>Patchpanel hinzufügen</button>
      <button onClick={() => onAddDevice('printer')}>Drucker hinzufügen</button>
      <button onClick={() => onAddDevice('bonndrucker')}>Bondrucker hinzufügen</button>
      <button onClick={() => onAddDevice('kasse')}>Kasse hinzufügen</button>
      <button onClick={() => onAddDevice('kassenschublade')}>Kassenschublade hinzufügen</button>
    </aside>
  )
}
