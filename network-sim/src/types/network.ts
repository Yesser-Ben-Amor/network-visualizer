export type DeviceType =
  | 'router'
  | 'switch'
  | 'pc'
  | 'server'
  | 'firewall'
  | 'switchpanel'
  | 'printer'
  | 'bonndrucker'
  | 'kasse'
  | 'kassenschublade'
 
export type CableType = 'ethernet' | 'fiber' | 'serial' | 'wireless'

export interface Connection {
  id: number
  fromId: number
  toId: number
  type: CableType
}

export interface RouteEntry {
  destination: string
  subnetMask: string
  nextHop: string
}

export interface Device {
  id: number
  type: DeviceType
  name: string
  x: number
  y: number
  model?: string
  ipAddress?: string
  subnetMask?: string
  gateway?: string
  // Spezielle Felder für Router-Interfaces (LAN/WAN)
  lanIp?: string
  lanSubnetMask?: string
  wanIp?: string
  wanSubnetMask?: string
  // DHCP-Server-Konfiguration (typischerweise bei Server-Geräten genutzt)
  isDhcpServer?: boolean
  dhcpPoolStart?: string
  dhcpPoolEnd?: string
  // Einfache Routingtabelle (insbesondere für Router)
  routes?: RouteEntry[]
}
