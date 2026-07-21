import type { LessonScenario } from '../types/scenario'
import type { Device } from '../types/network'

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

export const basicLanDhcpScenario: LessonScenario = {
  id: 'basic-lan-dhcp',
  title: 'Einfaches LAN mit DHCP',
  description:
    'Baue ein einfaches LAN: Ein Router, ein Server als DHCP-Server und mindestens ein PC im gleichen Netz. Der PC soll per DHCP eine IP bekommen und den Server anpingen können.',
  validate(devices, connections) {
    const messages: string[] = []

    const routers = devices.filter((d) => d.type === 'router')
    const servers = devices.filter((d) => d.type === 'server')
    const pcs = devices.filter((d) => d.type === 'pc')

    if (routers.length === 0) {
      messages.push('Es ist noch kein Router vorhanden.')
    }
    if (servers.length === 0) {
      messages.push('Es ist noch kein Server vorhanden.')
    }
    if (pcs.length === 0) {
      messages.push('Es ist noch kein PC vorhanden.')
    }

    const dhcpServers = servers.filter((s) => s.isDhcpServer && s.ipAddress && s.subnetMask)
    if (dhcpServers.length === 0) {
      messages.push('Aktiviere auf einem Server den DHCP-Server und vergib IP/Subnetzmaske.')
    }

    if (messages.length > 0) {
      return messages
    }

    const dhcpServer = dhcpServers[0]
    const serverNet = getNetworkAddress(dhcpServer.ipAddress, dhcpServer.subnetMask)
    if (serverNet === null) {
      messages.push('Die IP-/Maskenkombination des DHCP-Servers ist ungültig.')
      return messages
    }

    const pcsInSameNet = pcs.filter((pc) => {
      if (!pc.ipAddress || !pc.subnetMask) return false
      const pcNet = getNetworkAddress(pc.ipAddress, pc.subnetMask)
      return pcNet !== null && pcNet === serverNet
    })

    if (pcsInSameNet.length === 0) {
      messages.push('Mindestens ein PC muss im gleichen IP-Netz wie der DHCP-Server liegen.')
    }

    // Prüfen, ob ein PC eine Adresse innerhalb des Pools hat (falls konfiguriert)
    if (dhcpServer.dhcpPoolStart && dhcpServer.dhcpPoolEnd) {
      const startParts = parseIpv4(dhcpServer.dhcpPoolStart)
      const endParts = parseIpv4(dhcpServer.dhcpPoolEnd)
      if (startParts && endParts) {
        const startInt = ipv4ToInt(startParts)
        const endInt = ipv4ToInt(endParts)
        const pcWithPoolIp = pcsInSameNet.find((pc: Device) => {
          if (!pc.ipAddress) return false
          const ipParts = parseIpv4(pc.ipAddress)
          if (!ipParts) return false
          const ipInt = ipv4ToInt(ipParts)
          return ipInt >= startInt && ipInt <= endInt
        })
        if (!pcWithPoolIp) {
          messages.push(
            `Kein PC hat eine IP-Adresse aus dem DHCP-Pool (${dhcpServer.dhcpPoolStart} - ${dhcpServer.dhcpPoolEnd}). Führe z.B. am PC "ipconfig /renew" aus.`,
          )
        }
      }
    }

    // Sehr einfache Erreichbarkeitsprüfung über den Verbindungsgraphen
    const server = dhcpServer
    const anyPc = pcsInSameNet[0]
    if (server && anyPc) {
      const adjacency = new Map<number, number[]>()
      for (const c of connections) {
        const fromList = adjacency.get(c.fromId) ?? []
        fromList.push(c.toId)
        adjacency.set(c.fromId, fromList)

        const toList = adjacency.get(c.toId) ?? []
        toList.push(c.fromId)
        adjacency.set(c.toId, toList)
      }

      const visited = new Set<number>()
      const queue: number[] = []
      visited.add(anyPc.id)
      queue.push(anyPc.id)
      let reachable = false
      while (queue.length > 0) {
        const current = queue.shift()!
        if (current === server.id) {
          reachable = true
          break
        }
        const neighbors = adjacency.get(current) ?? []
        for (const n of neighbors) {
          if (!visited.has(n)) {
            visited.add(n)
            queue.push(n)
          }
        }
      }
      if (!reachable) {
        messages.push('PC und Server sind nicht miteinander verbunden. Verbinde sie über Switch/Router mit passenden IP-Einstellungen.')
      }
    }

    if (messages.length === 0) {
      messages.push('Aufgabe erfüllt: Einfaches LAN mit DHCP ist korrekt aufgebaut.')
    }

    return messages
  },
}
