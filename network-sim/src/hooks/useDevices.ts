import { useEffect, useRef, useState } from 'react'
import type React from 'react'
import type { CableType, Connection, Device, DeviceType } from '../types/network'

function parseIpv4(address: string | undefined): number[] | null {
  if (!address) return null
  const parts = address.split('.')
  if (parts.length !== 4) return null
  const nums = parts.map((p) => Number(p))
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null
  return nums
}

function ipv4ToInt(parts: number[]): number {
  return (
    (parts[0] << 24) +
    (parts[1] << 16) +
    (parts[2] << 8) +
    parts[3]
  ) >>> 0
}

function intToIpv4(value: number): string {
  const a = (value >>> 24) & 0xff
  const b = (value >>> 16) & 0xff
  const c = (value >>> 8) & 0xff
  const d = value & 0xff
  return `${a}.${b}.${c}.${d}`
}

function getNetworkAddress(ip: string | undefined, mask: string | undefined): number | null {
  const ipParts = parseIpv4(ip)
  const maskParts = parseIpv4(mask)
  if (!ipParts || !maskParts) return null
  const ipInt = ipv4ToInt(ipParts)
  const maskInt = ipv4ToInt(maskParts)
  return (ipInt & maskInt) >>> 0
}

function getBroadcastAddress(ip: string | undefined, mask: string | undefined): number | null {
  const ipParts = parseIpv4(ip)
  const maskParts = parseIpv4(mask)
  if (!ipParts || !maskParts) return null
  const ipInt = ipv4ToInt(ipParts)
  const maskInt = ipv4ToInt(maskParts)
  const invertedMask = (~maskInt) >>> 0
  return (ipInt | invertedMask) >>> 0
}

export function useDevices() {
  const hasLoadedFromStorageRef = useRef(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [nextId, setNextId] = useState(1)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null)
  const [contextMenu, setContextMenu] = useState<
    | { deviceId: number; x: number; y: number }
    | null
  >(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [wiringMode, setWiringMode] = useState(false)
  const [wiringSourceId, setWiringSourceId] = useState<number | null>(null)
  const [currentCableType, setCurrentCableType] = useState<CableType>('ethernet')

  // Initial laden aus localStorage (falls vorhanden)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem('networkTopology')
    if (raw) {
      try {
        const parsed: { devices?: Device[]; connections?: Connection[] } = JSON.parse(raw)
        if (parsed.devices && Array.isArray(parsed.devices)) {
          // Migration: fehlende Default-IP-Konfiguration für Router/Server nachziehen
          let routerCounter = 0
          const migratedDevices = parsed.devices.map((d) => {
            if (d.type === 'router') {
              const baseThirdOctet = routerCounter * 20
              const lanIp = d.lanIp ?? `192.168.${baseThirdOctet}.1`
              const wanIp = d.wanIp ?? `192.168.${baseThirdOctet + 10}.1`
              routerCounter += 1
              return {
                lanIp,
                lanSubnetMask: d.lanSubnetMask ?? '255.255.255.0',
                wanIp,
                wanSubnetMask: d.wanSubnetMask ?? '255.255.255.0',
                // Haupt-IP des Geräts als LAN-IP spiegeln, falls nicht gesetzt
                ipAddress: d.ipAddress ?? lanIp,
                subnetMask: d.subnetMask ?? '255.255.255.0',
                ...d,
              }
            }
            if (d.type === 'server') {
              return {
                ipAddress: d.ipAddress ?? '192.168.0.10',
                subnetMask: d.subnetMask ?? '255.255.255.0',
                gateway: d.gateway ?? '192.168.0.1',
                ...d,
              }
            }
            return d
          })

          setDevices(migratedDevices)
          const maxId = migratedDevices.reduce((max, d) => (d.id > max ? d.id : max), 0)
          setNextId(maxId + 1)
        }
        if (parsed.connections && Array.isArray(parsed.connections)) {
          setConnections(parsed.connections)
        }
      } catch {
        // Ignorieren, falls JSON korrupt ist
      }
    }

    hasLoadedFromStorageRef.current = true
  }, [])

  // Änderungen an Geräten/Verbindungen in localStorage speichern
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!hasLoadedFromStorageRef.current) return
    if (devices.length === 0 && connections.length === 0) return
    const payload = JSON.stringify({ devices, connections })
    window.localStorage.setItem('networkTopology', payload)
  }, [devices, connections])

  const resetTopology = () => {
    setDevices([])
    setConnections([])
    setNextId(1)
    setSelectedDeviceId(null)
    setContextMenu(null)
    setWiringSourceId(null)
    setWiringMode(false)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('networkTopology')
    }
  }

  const addDevice = (type: DeviceType) => {
    const id = nextId
    setNextId(id + 1)
    const existingServers = devices.filter((d) => d.type === 'server').length
    const serverHostOffset = 10 + existingServers // 10, 11, 12, ...
    const serverIp = `192.168.0.${serverHostOffset}`

    const existingRouters = devices.filter((d) => d.type === 'router').length
    const routerBaseThirdOctet = existingRouters * 20 // 0, 20, 40, ...
    const routerLanIp = `192.168.${routerBaseThirdOctet}.1`
    const routerWanIp = `192.168.${routerBaseThirdOctet + 10}.1`
    const newDevice: Device = {
      id,
      type,
      name: `${type}-${id}`,
      x: 80 + id * 20,
      y: 140 + id * 20,
      // Standard-IP-Konfiguration für typische Kernkomponenten
      ...(type === 'router'
        ? {
            // LAN als Haupt-IP spiegeln, damit bestehende Logik weiter funktioniert
            ipAddress: routerLanIp,
            subnetMask: '255.255.255.0',
            lanIp: routerLanIp,
            lanSubnetMask: '255.255.255.0',
            wanIp: routerWanIp,
            wanSubnetMask: '255.255.255.0',
          }
        : {}),
      ...(type === 'server'
        ? {
            ipAddress: serverIp,
            subnetMask: '255.255.255.0',
            gateway: '192.168.0.1',
          }
        : {}),
    }
    setDevices((prev) => [...prev, newDevice])
  }

  const handleDeviceMouseDown = (
    event: React.MouseEvent<HTMLDivElement>,
    device: Device,
  ) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const offsetX = event.clientX - rect.left - device.x
    const offsetY = event.clientY - rect.top - device.y

    setDraggingId(device.id)
    setDragOffset({ x: offsetX, y: offsetY })
    setSelectedDeviceId(device.id)
    setContextMenu(null)
  }

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || draggingId === null || !dragOffset) return

    const rect = canvasRef.current.getBoundingClientRect()
    const newX = event.clientX - rect.left - dragOffset.x
    const newY = event.clientY - rect.top - dragOffset.y

    setDevices((prev) =>
      prev.map((d) => (d.id === draggingId ? { ...d, x: newX, y: newY } : d)),
    )
  }

  const handleCanvasMouseUp = () => {
    setDraggingId(null)
    setDragOffset(null)
  }

  const handleDeviceContextMenu = (
    event: React.MouseEvent<HTMLDivElement>,
    device: Device,
  ) => {
    event.preventDefault()
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setSelectedDeviceId(device.id)
    setContextMenu({ deviceId: device.id, x, y })
  }

  const handleDeviceClick = (device: Device) => {
    if (!wiringMode) return

    // Falls noch keine Quelle gewählt ist, dieses Gerät als Start setzen
    if (wiringSourceId === null) {
      setWiringSourceId(device.id)
      return
    }

    // Klick auf das gleiche Gerät: Auswahl zurücksetzen
    if (wiringSourceId === device.id) {
      setWiringSourceId(null)
      return
    }

    const newId = connections.length > 0 ? Math.max(...connections.map((c) => c.id)) + 1 : 1
    const newConnection: Connection = {
      id: newId,
      fromId: wiringSourceId,
      toId: device.id,
      type: currentCableType,
    }

    setConnections((prev) => [...prev, newConnection])
    setWiringSourceId(null)
  }

  const handleCanvasClick = () => {
    if (contextMenu) {
      setContextMenu(null)
    }

    if (wiringMode && wiringSourceId !== null) {
      setWiringSourceId(null)
    }
  }

  const handleRemoveDevice = () => {
    if (!contextMenu) return
    const id = contextMenu.deviceId
    setDevices((prev) => prev.filter((d) => d.id !== id))
    setConnections((prev) => prev.filter((c) => c.fromId !== id && c.toId !== id))
    if (selectedDeviceId === id) {
      setSelectedDeviceId(null)
    }
    setContextMenu(null)
  }

  const handleDuplicateDevice = () => {
    if (!contextMenu) return
    const original = devices.find((d) => d.id === contextMenu.deviceId)
    if (!original) return

    const id = nextId
    setNextId(id + 1)

    const duplicate: Device = {
      ...original,
      id,
      x: original.x + 20,
      y: original.y + 20,
      name: `${original.name}-copy`,
    }

    setDevices((prev) => [...prev, duplicate])
    setSelectedDeviceId(id)
    setContextMenu(null)
  }

  const selectedDevice =
    selectedDeviceId !== null
      ? devices.find((d) => d.id === selectedDeviceId) ?? null
      : null

  const handleBonPrinterModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    if (!selectedDevice || (selectedDevice.type !== 'bonndrucker' && selectedDevice.type !== 'kasse'))
      return

    setDevices((prev) =>
      prev.map((d) =>
        d.id === selectedDevice.id
          ? {
              ...d,
              model: value,
              name: value ? `${value} (${d.id})` : `${d.type}-${d.id}`,
            }
          : d,
      ),
    )
  }

  const updateSelectedDeviceIpConfig = (
    changes: Partial<
      Pick<
        Device,
        'ipAddress' | 'subnetMask' | 'gateway' | 'lanIp' | 'lanSubnetMask' | 'wanIp' | 'wanSubnetMask'
      >
    >,
  ) => {
    if (selectedDeviceId == null) return
    setDevices((prev) =>
      prev.map((d) => (d.id === selectedDeviceId ? { ...d, ...changes } : d)),
    )
  }

  const updateSelectedDeviceRoutes = (routes: Device['routes']) => {
    if (selectedDeviceId == null) return
    setDevices((prev) =>
      prev.map((d) => (d.id === selectedDeviceId ? { ...d, routes } : d)),
    )
  }

  const validateNetwork = (): string[] => {
    const errors: string[] = []

    // R1: doppelte IPs
    const ipMap = new Map<string, Device[]>()
    for (const d of devices) {
      if (!d.ipAddress) continue
      const ip = d.ipAddress
      const list = ipMap.get(ip) ?? []
      list.push(d)
      ipMap.set(ip, list)
    }
    for (const [ip, list] of ipMap.entries()) {
      if (list.length > 1) {
        const names = list.map((dev) => dev.name).join(', ')
        errors.push(
          `Doppelte IP ${ip} bei Geräten: ${names}. Tipp: Vergib für jedes Gerät eine eindeutige IP-Adresse im gleichen Netz.`,
        )
      }
    }

    // R2: ungültige IP / Maske
    for (const d of devices) {
      if (d.ipAddress && !parseIpv4(d.ipAddress)) {
        errors.push(
          `Ungültige IP-Adresse bei ${d.name}: ${d.ipAddress}. Tipp: Verwende das Format x.x.x.x mit Werten von 0 bis 255.`,
        )
      }
      if (d.subnetMask && !parseIpv4(d.subnetMask)) {
        errors.push(
          `Ungültige Subnetzmaske bei ${d.name}: ${d.subnetMask}. Tipp: Typische Maske ist z.B. 255.255.255.0.`,
        )
      }
    }

    // R3: Gateway nicht im gleichen Netz
    for (const d of devices) {
      if (!d.ipAddress || !d.subnetMask || !d.gateway) continue
      const netIp = getNetworkAddress(d.ipAddress, d.subnetMask)
      const netGw = getNetworkAddress(d.gateway, d.subnetMask)
      if (netIp !== null && netGw !== null && netIp !== netGw) {
        errors.push(
          `Gateway ${d.gateway} liegt nicht im gleichen Netz wie IP ${d.ipAddress}/${d.subnetMask} bei ${d.name}. Tipp: Wähle ein Gateway aus demselben IP-Netz wie das Gerät.`,
        )
      }
    }

    // R3b: IP darf nicht Netzwerk- oder Broadcastadresse sein
    for (const d of devices) {
      if (!d.ipAddress || !d.subnetMask) continue
      const ipParts = parseIpv4(d.ipAddress)
      const maskParts = parseIpv4(d.subnetMask)
      if (!ipParts || !maskParts) continue

      const ipInt = ipv4ToInt(ipParts)
      const net = getNetworkAddress(d.ipAddress, d.subnetMask)
      const broadcast = getBroadcastAddress(d.ipAddress, d.subnetMask)
      if (net === null || broadcast === null) continue

      const firstHost = net + 1
      const lastHost = broadcast - 1

      if (ipInt === net) {
        errors.push(
          `IP-Adresse von ${d.name} ist die Netzwerkadresse (${d.ipAddress}/${d.subnetMask}). Tipp: Verwende eine Host-Adresse zwischen ${intToIpv4(firstHost)} und ${intToIpv4(lastHost)}.`,
        )
      } else if (ipInt === broadcast) {
        errors.push(
          `IP-Adresse von ${d.name} ist die Broadcast-Adresse (${d.ipAddress}/${d.subnetMask}). Tipp: Verwende eine Host-Adresse zwischen ${intToIpv4(firstHost)} und ${intToIpv4(lastHost)}.`,
        )
      }
    }

    // R3c: Reservierter Bereich der ersten Host-Adressen (z.B. .1-.9) für Infrastrukturgeräte
    for (const d of devices) {
      if (!d.ipAddress || !d.subnetMask) continue
      const ipParts = parseIpv4(d.ipAddress)
      const maskParts = parseIpv4(d.subnetMask)
      if (!ipParts || !maskParts) continue

      const ipInt = ipv4ToInt(ipParts)
      const net = getNetworkAddress(d.ipAddress, d.subnetMask)
      const broadcast = getBroadcastAddress(d.ipAddress, d.subnetMask)
      if (net === null || broadcast === null) continue

      const hostPart = ipInt - net
      if (hostPart >= 1 && hostPart <= 9) {
        const infraTypes: DeviceType[] = ['router', 'server', 'switch', 'switchpanel', 'firewall']
        if (!infraTypes.includes(d.type)) {
          const suggestedStartHost = net + 10
          const lastHost = broadcast - 1
          errors.push(
            `IP-Adresse von ${d.name} (${d.ipAddress}) liegt im reservierten Infrastrukturbereich des Netzes (Host-Adressen 1-9). Tipp: Verwende für Endgeräte Host-Adressen ab ${intToIpv4(suggestedStartHost)} bis ${intToIpv4(lastHost)}.`,
          )
        }
      }
    }

    // R4: IP gesetzt, aber keine Subnetzmaske
    for (const d of devices) {
      if (d.ipAddress && !d.subnetMask) {
        errors.push(
          `Fehlende Subnetzmaske bei ${d.name} (IP: ${d.ipAddress}). Tipp: Trage eine passende Subnetzmaske ein, z.B. 255.255.255.0.`,
        )
      }
    }

    // R5: Gateway gesetzt, aber keine IP oder Maske
    for (const d of devices) {
      if (d.gateway && (!d.ipAddress || !d.subnetMask)) {
        errors.push(
          `Gateway ${d.gateway} bei ${d.name} gesetzt, aber IP-Adresse oder Subnetzmaske fehlen. Tipp: Vergib zuerst IP-Adresse und Subnetzmaske für das Gerät.`,
        )
      }
    }

    // R5b: Router-LAN und -WAN dürfen nicht im gleichen Netz liegen
    for (const d of devices) {
      if (d.type !== 'router') continue
      const lanNet = getNetworkAddress(d.lanIp ?? d.ipAddress, d.lanSubnetMask ?? d.subnetMask)
      const wanNet = getNetworkAddress(d.wanIp, d.wanSubnetMask)
      if (lanNet !== null && wanNet !== null && lanNet === wanNet) {
        errors.push(
          `Router ${d.name} hat LAN und WAN im gleichen Netz konfiguriert. Tipp: Verwende für LAN und WAN unterschiedliche IP-Netze (z.B. 192.168.0.0/24 und 192.168.10.0/24).`,
        )
      }
    }

    // R6: typische Endgeräte ohne IP-Konfiguration
    for (const d of devices) {
      if ((d.type === 'pc' || d.type === 'server') && !d.ipAddress) {
        errors.push(
          `Endgerät ${d.name} (${d.type}) hat keine IP-Konfiguration. Tipp: Vergib IP-Adresse, Subnetzmaske und ggf. Gateway, damit es im Netz kommunizieren kann.`,
        )
      }
    }

    return errors
  }

  return {
    devices,
    connections,
    wiringMode,
    wiringSourceId,
    currentCableType,
    contextMenu,
    canvasRef,
    selectedDevice,
    resetTopology,
    addDevice,
    setWiringMode,
    setCurrentCableType,
    handleDeviceMouseDown,
    handleDeviceClick,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleDeviceContextMenu,
    handleCanvasClick,
    handleRemoveDevice,
    handleDuplicateDevice,
    handleRemoveConnections: () => {
      if (!contextMenu) return
      const id = contextMenu.deviceId
      setConnections((prev) => prev.filter((c) => c.fromId !== id && c.toId !== id))
      setContextMenu(null)
    },
    handleBonPrinterModelChange,
    updateSelectedDeviceIpConfig,
    updateSelectedDeviceRoutes,
    validateNetwork,
  }
}
