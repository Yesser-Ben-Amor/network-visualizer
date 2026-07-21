import type { LessonScenario } from '../types/scenario'
import type { Device, Connection } from '../types/network'

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

function getNetworkAddress(ip: string | undefined, mask: string | undefined): number | null {
  const ipParts = parseIpv4(ip)
  const maskParts = parseIpv4(mask)
  if (!ipParts || !maskParts) return null
  const ipInt = ipv4ToInt(ipParts)
  const maskInt = ipv4ToInt(maskParts)
  return (ipInt & maskInt) >>> 0
}

function areConnected(aId: number, bId: number, connections: Connection[]): boolean {
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
  visited.add(aId)
  queue.push(aId)

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === bId) return true
    const neighbors = adjacency.get(current) ?? []
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n)
        queue.push(n)
      }
    }
  }

  return false
}

export const twoNetsWithRouterScenario: LessonScenario = {
  id: 'two-nets-router',
  title: 'Zwei Netze mit Router',
  description:
    'Baue zwei unterschiedliche IP-Netze, die über einen Router verbunden sind. Ein PC im ersten Netz soll einen PC im zweiten Netz erreichen können.',
  validate(devices, connections) {
    const messages: string[] = []

    const routers = devices.filter((d) => d.type === 'router')
    const pcs = devices.filter((d) => d.type === 'pc')

    if (routers.length === 0) {
      messages.push('Es ist noch kein Router vorhanden.')
    }
    if (pcs.length < 2) {
      messages.push('Es sollten mindestens zwei PCs vorhanden sein (je einer pro Netz).')
    }
    if (messages.length > 0) return messages

    const router = routers[0]

    const lanNet = getNetworkAddress(router.lanIp ?? router.ipAddress, router.lanSubnetMask ?? router.subnetMask)
    const wanNet = getNetworkAddress(router.wanIp, router.wanSubnetMask)

    if (lanNet === null || wanNet === null || lanNet === wanNet) {
      messages.push('Konfiguriere den Router so, dass LAN und WAN in zwei unterschiedlichen Netzen liegen (z.B. 192.168.0.0/24 und 192.168.10.0/24).')
      return messages
    }

    const pcsLan = pcs.filter((pc) => {
      if (!pc.ipAddress || !pc.subnetMask) return false
      const net = getNetworkAddress(pc.ipAddress, pc.subnetMask)
      return net !== null && net === lanNet
    })

    const pcsWan = pcs.filter((pc) => {
      if (!pc.ipAddress || !pc.subnetMask) return false
      const net = getNetworkAddress(pc.ipAddress, pc.subnetMask)
      return net !== null && net === wanNet
    })

    if (pcsLan.length === 0) {
      messages.push('Im LAN-Netz des Routers befindet sich noch kein PC mit passender IP-Konfiguration.')
    }
    if (pcsWan.length === 0) {
      messages.push('Im WAN-/zweiten Netz des Routers befindet sich noch kein PC mit passender IP-Konfiguration.')
    }
    if (messages.length > 0) return messages

    const pcA = pcsLan[0]
    const pcB = pcsWan[0]

    if (!areConnected(pcA.id, pcB.id, connections)) {
      messages.push('Die PCs aus den beiden Netzen sind physikalisch nicht verbunden. Verbinde sie über Router/Switch.')
    }

    // Prüfen, ob auf den PCs ein Gateway gesetzt ist (vereinfacht)
    if (!pcA.gateway) {
      messages.push(`Setze auf ${pcA.name} ein Gateway (z.B. auf die LAN-IP des Routers).`)
    }
    if (!pcB.gateway) {
      messages.push(`Setze auf ${pcB.name} ein Gateway (z.B. auf die WAN-seitige IP des Routers oder einen weiteren Router).`)
    }

    if (messages.length === 0) {
      messages.push('Aufgabe erfüllt: Die beiden Netze sind korrekt über den Router verbunden.')
    }

    return messages
  },
}
