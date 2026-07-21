import { useState, type KeyboardEvent, type FormEvent } from 'react'
import type { Connection, Device } from '../types/network'

interface TerminalProps {
  selectedDevice: Device | null
  onUpdateIpConfig: (
    changes: Partial<Pick<Device, 'ipAddress' | 'subnetMask' | 'gateway'>>,
  ) => void
  devices: Device[]
  connections: Connection[]
  onSetActiveProtocol?: (protocol: 'none' | 'ping' | 'dhcp') => void
  onPingPath?: (path: number[]) => void
}

interface Line {
  id: number
  text: string
}

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

function sameNetwork(ip1: string, ip2: string, mask: string): boolean {
  const p1 = parseIpv4(ip1)
  const p2 = parseIpv4(ip2)
  const pm = parseIpv4(mask)
  if (!p1 || !p2 || !pm) return false
  const i1 = ipv4ToInt(p1)
  const i2 = ipv4ToInt(p2)
  const m = ipv4ToInt(pm)
  return ((i1 & m) >>> 0) === ((i2 & m) >>> 0)
}

function getNetworkAddress(ip: string | undefined, mask: string | undefined): number | null {
  const ipParts = parseIpv4(ip)
  const maskParts = parseIpv4(mask)
  if (!ipParts || !maskParts) return null
  const ipInt = ipv4ToInt(ipParts)
  const maskInt = ipv4ToInt(maskParts)
  return (ipInt & maskInt) >>> 0
}

export function Terminal({
  selectedDevice,
  onUpdateIpConfig,
  devices,
  connections,
  onSetActiveProtocol,
  onPingPath,
}: TerminalProps) {
  const [input, setInput] = useState('')
  const [lines, setLines] = useState<Line[]>([
    {
      id: 0,
      text: 'Fake-CMD bereit. Tippe "help" für verfügbare Befehle.',
    },
  ])
  const [nextId, setNextId] = useState(1)
  const [shellMode, setShellMode] = useState<'windows' | 'linux'>('windows')

  const appendLine = (text: string) => {
    setLines((prev) => [...prev, { id: nextId, text }])
    setNextId((id) => id + 1)
  }

  const handleCommand = (raw: string) => {
    const command = raw.trim()
    if (!command) return

    // Eingabe echoen
    appendLine(`> ${command}`)

    const [cmd, ...rawArgs] = command.split(/\s+/)
    let args = rawArgs
    let normalizedCmd = cmd.toLowerCase()

    // Shell-spezifische Aliase auf die bestehenden Kommandos abbilden
    if (shellMode === 'linux') {
      if (normalizedCmd === 'ifconfig') {
        normalizedCmd = 'ipconfig'
      } else if (normalizedCmd === 'ip' && args[0]?.toLowerCase() === 'a') {
        // "ip a" / "ip addr" wie ipconfig behandeln
        normalizedCmd = 'ipconfig'
      } else if (normalizedCmd === 'clear') {
        normalizedCmd = 'cls'
      } else if (normalizedCmd === 'ip' && args[0]?.toLowerCase() === 'route') {
        // "ip route" wie "route print" behandeln
        normalizedCmd = 'route'
        args = ['print', ...args.slice(1)]
      }
    }

    switch (normalizedCmd) {
      case 'help': {
        appendLine('Verfügbare Befehle:')
        if (shellMode === 'windows') {
          appendLine('  help                         - zeigt diese Hilfe')
          appendLine('  ipconfig                     - zeigt IP-Konfiguration des ausgewählten Geräts')
          appendLine('  set ip <ip> <maske> <gateway> - setzt IP-Konfiguration des ausgewählten Geräts')
          appendLine('  ping <ip>                    - prüft Erreichbarkeit eines anderen Geräts (simuliert)')
          appendLine('  cls                          - leert die Konsole')
          appendLine('  route print                  - zeigt Routinginformationen zum ausgewählten Gerät')
          appendLine('  mode linux                   - wechselt in den Linux-Terminal-Modus')
        } else {
          appendLine('  help                         - zeigt diese Hilfe')
          appendLine('  ifconfig / ip a              - zeigt IP-Konfiguration des ausgewählten Geräts')
          appendLine('  set ip <ip> <maske> <gateway> - setzt IP-Konfiguration des ausgewählten Geräts')
          appendLine('  ping <ip>                    - prüft Erreichbarkeit eines anderen Geräts (simuliert)')
          appendLine('  clear                        - leert die Konsole')
          appendLine('  ip route                     - zeigt Routinginformationen zum ausgewählten Gerät')
          appendLine('  mode windows                 - wechselt in den Windows-CMD-Modus')
        }
        break
      }
      case 'mode': {
        const target = args[0]?.toLowerCase()
        if (target === 'windows' || target === 'win') {
          setShellMode('windows')
          appendLine('Shell-Modus auf Windows CMD gesetzt.')
        } else if (target === 'linux') {
          setShellMode('linux')
          appendLine('Shell-Modus auf Linux Terminal gesetzt.')
        } else {
          appendLine('Verwendung: mode windows | mode linux')
        }
        break
      }
      case 'ipconfig': {
        // DHCP-Erneuerung: ipconfig /renew
        if (args[0]?.toLowerCase() === '/renew') {
          if (!selectedDevice) {
            appendLine('Kein Gerät ausgewählt. Wähle zuerst im Canvas einen PC oder Server aus.')
            break
          }

          if (!selectedDevice.subnetMask) {
            appendLine(
              'Das ausgewählte Gerät hat noch keine Subnetzmaske. Lege zunächst ein Netz fest (IP + Maske) oder konfiguriere einen Router/Server im gleichen Netz.',
            )
            break
          }

          const srcNet = getNetworkAddress(selectedDevice.ipAddress, selectedDevice.subnetMask)
          if (srcNet === null) {
            appendLine('Ungültige IP-/Maskenkombination auf dem Gerät, DHCP-Erneuerung nicht möglich.')
            break
          }

          // Protokoll: DHCP aktivieren (App kümmert sich ums automatische Zurücksetzen)
          onSetActiveProtocol?.('dhcp')

          // DHCP-Server im gleichen Netz suchen
          const dhcpServers = devices.filter(
            (d) => d.type === 'server' && d.isDhcpServer && d.ipAddress && d.subnetMask,
          )

          let chosenServer: Device | null = null
          for (const s of dhcpServers) {
            const net = getNetworkAddress(s.ipAddress, s.subnetMask)
            if (net !== null && net === srcNet) {
              chosenServer = s
              break
            }
          }

          if (!chosenServer) {
            appendLine(
              'Kein DHCP-Server im gleichen Netz gefunden. Stelle sicher, dass ein Server als DHCP-Server aktiviert ist und im selben IP-Netz wie dieses Gerät liegt.',
            )
            break
          }

          if (!chosenServer.dhcpPoolStart || !chosenServer.dhcpPoolEnd) {
            appendLine(
              `DHCP-Server ${chosenServer.name} hat keinen gültigen Pool konfiguriert. Trage im Inspector einen Adressbereich "von/bis" ein.`,
            )
            break
          }

          const poolStartParts = parseIpv4(chosenServer.dhcpPoolStart)
          const poolEndParts = parseIpv4(chosenServer.dhcpPoolEnd)
          if (!poolStartParts || !poolEndParts) {
            appendLine(
              `DHCP-Server ${chosenServer.name} hat einen ungültigen Pool. Verwende Adressen im Format 192.168.x.y.`,
            )
            break
          }

          const poolStartInt = ipv4ToInt(poolStartParts)
          const poolEndInt = ipv4ToInt(poolEndParts)
          if (poolEndInt < poolStartInt) {
            appendLine(
              `DHCP-Server ${chosenServer.name}: Pool-Ende liegt vor dem Pool-Start. Korrigiere die Werte im Inspector.`,
            )
            break
          }

          // Erste freie Adresse im Pool suchen, die noch keinem Gerät zugewiesen ist
          let assignedIp: string | null = null
          for (let current = poolStartInt; current <= poolEndInt; current += 1) {
            const candidate = intToIpv4(current)
            const used = devices.some((d) => d.ipAddress === candidate)
            if (!used) {
              assignedIp = candidate
              break
            }
          }

          if (!assignedIp) {
            appendLine(
              `DHCP-Server ${chosenServer.name}: Es sind keine freien Adressen im konfigurierten Pool mehr verfügbar.`,
            )
            break
          }

          const maskToUse = chosenServer.subnetMask ?? selectedDevice.subnetMask
          const gwToUse = chosenServer.gateway ?? chosenServer.ipAddress ?? selectedDevice.gateway

          onUpdateIpConfig({
            ipAddress: assignedIp,
            subnetMask: maskToUse,
            gateway: gwToUse,
          })

          appendLine(
            `DHCP: Adresse ${assignedIp} mit Maske ${maskToUse ?? '(unbekannt)'} und Gateway ${gwToUse ?? '(kein Gateway)'} vom Server ${chosenServer.name} zugewiesen.`,
          )
          break
        }

        // Standard-ipconfig-Ausgabe (ohne /renew)
        if (!selectedDevice) {
          appendLine('Kein Gerät ausgewählt. Wähle zuerst im Canvas einen PC oder Server aus.')
          break
        }

        const ip = selectedDevice.ipAddress ?? '(keine IP gesetzt)'
        const mask = selectedDevice.subnetMask ?? '(keine Maske gesetzt)'
        const gw = selectedDevice.gateway ?? '(kein Gateway gesetzt)'

        let networkInfo: string[] = []
        if (selectedDevice.ipAddress && selectedDevice.subnetMask) {
          const ipParts = parseIpv4(selectedDevice.ipAddress)
          const maskParts = parseIpv4(selectedDevice.subnetMask)
          if (ipParts && maskParts) {
            const ipInt = ipv4ToInt(ipParts)
            const maskInt = ipv4ToInt(maskParts)
            const net = (ipInt & maskInt) >>> 0
            const invertedMask = (~maskInt) >>> 0
            const broadcast = (ipInt | invertedMask) >>> 0
            const firstHost = net + 1
            const lastHost = broadcast - 1

            networkInfo = [
              '',
              `  Netzwerkadresse . . . . . : ${intToIpv4(net)}`,
              `  Broadcastadresse . . . . : ${intToIpv4(broadcast)}`,
              `  Gültige Hosts  . . . . . : ${intToIpv4(firstHost)} - ${intToIpv4(lastHost)}`,
            ]
          }
        }

        appendLine('Windows-IP-Konfiguration (simuliert)')
        appendLine('')
        appendLine(`  Hostname  . . . . . . . . . : ${selectedDevice.name}`)
        appendLine('  IPv4-Adresse  . . . . . .  : ' + ip)
        appendLine('  Subnetzmaske . . . . . . . : ' + mask)
        appendLine('  Standardgateway . . . . .  : ' + gw)
        for (const line of networkInfo) {
          appendLine(line)
        }
        break
      }
      case 'cls': {
        setLines([
          {
            id: 0,
            text: 'Fake-CMD bereit. Tippe "help" für verfügbare Befehle.',
          },
        ])
        setNextId(1)
        break
      }
      case 'set': {
        if (args[0]?.toLowerCase() !== 'ip') {
          appendLine('Ungültige Syntax. Verwende: set ip <ip> <maske> <gateway>')
          break
        }

        if (!selectedDevice) {
          appendLine('Kein Gerät ausgewählt. Wähle zuerst im Canvas ein Gerät aus.')
          break
        }

        const [ip, mask, gw] = args.slice(1)

        if (!ip || !mask || !gw) {
          appendLine('Fehlende Argumente. Verwende: set ip <ip> <maske> <gateway>')
          break
        }

        // Einfache Plausibilitätsprüfung: grobe IPv4-Struktur
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
        if (!ipv4Regex.test(ip) || !ipv4Regex.test(mask) || !ipv4Regex.test(gw)) {
          appendLine(
            'Ungültiges Format. Erwartet wird IPv4-Notation, z.B. 192.168.0.10 255.255.255.0 192.168.0.1',
          )
          break
        }

        onUpdateIpConfig({ ipAddress: ip, subnetMask: mask, gateway: gw })
        appendLine(
          `IP-Konfiguration für ${selectedDevice.name} gesetzt: ${ip} ${mask} ${gw}.`,
        )
        break
      }
      case 'ping': {
        const targetIp = args[0]

        if (!targetIp) {
          appendLine('Fehlende IP. Verwende: ping <ip>')
          break
        }

        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
        if (!ipv4Regex.test(targetIp)) {
          appendLine('Ungültiges IP-Format. Verwende IPv4, z.B. 192.168.0.20')
          break
        }

        if (!selectedDevice) {
          appendLine('Kein Quellgerät ausgewählt. Wähle im Canvas ein Gerät aus und versuche es erneut.')
          break
        }

        if (!selectedDevice.ipAddress || !selectedDevice.subnetMask) {
          appendLine(
            `Das Quellgerät ${selectedDevice.name} hat keine vollständige IP-Konfiguration. Verwende zuerst "set ip" oder den Inspector.`,
          )
          break
        }

        onSetActiveProtocol?.('ping')

        const target = devices.find((d) => d.ipAddress === targetIp)
        if (!target) {
          appendLine(`Ping wird ausgeführt zu ${targetIp} mit 4 Datenpaketen:`)
          appendLine('Zielhost nicht gefunden. Überprüfen Sie die IP-Adresse und versuchen Sie es erneut.')
          break
        }

        appendLine(`Ping wird ausgeführt zu ${targetIp} mit 4 Datenpaketen (simuliert):`)
        const srcNet = getNetworkAddress(selectedDevice.ipAddress, selectedDevice.subnetMask)
        const targetNet = getNetworkAddress(target.ipAddress, target.subnetMask ?? selectedDevice.subnetMask)

        // Erreichbarkeitsprüfung im Verbindungsgraphen
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
        const parent = new Map<number, number | null>()
        visited.add(selectedDevice.id)
        queue.push(selectedDevice.id)
        parent.set(selectedDevice.id, null)

        let reachable = false
        while (queue.length > 0) {
          const current = queue.shift()!
          if (current === target.id) {
            reachable = true
            break
          }
          const neighbors = adjacency.get(current) ?? []
          for (const n of neighbors) {
            if (!visited.has(n)) {
              visited.add(n)
              queue.push(n)
              parent.set(n, current)
            }
          }
        }

        let path: number[] | null = null
        if (reachable) {
          const result: number[] = []
          let cur: number | null = target.id
          while (cur !== null) {
            result.unshift(cur)
            cur = parent.get(cur) ?? null
          }
          if (result.length > 1) {
            path = result
          }
        }

        if (!reachable) {
          appendLine('Antwort von Simulator: Zielhost nicht erreichbar (keine Verbindung in der Topologie).')
          break
        }

        // Gleiche Netz-ID: direkter Ping möglich
        if (srcNet !== null && targetNet !== null && srcNet === targetNet) {
          appendLine('Antwort von Simulator: Ping erfolgreich. (4 Pakete gesendet, 4 empfangen, 0 verloren)')
          if (path) {
            onPingPath?.(path)
          }
          break
        }

        // Unterschiedliche Netze: prüfen, ob ein Router mit passenden LAN/WAN-Netzen
        // oder einer statischen Route existiert
        const routers = devices.filter((d) => d.type === 'router')
        let hasRoutingPath = false
        if (srcNet !== null && targetNet !== null) {
          for (const r of routers) {
            const lanNet = getNetworkAddress(r.lanIp ?? r.ipAddress, r.lanSubnetMask ?? r.subnetMask)
            const wanNet = getNetworkAddress(r.wanIp, r.wanSubnetMask)
            if (lanNet === null || wanNet === null) continue
            const coversDirect =
              (lanNet === srcNet && wanNet === targetNet) ||
              (lanNet === targetNet && wanNet === srcNet)

            const routes = r.routes ?? []
            const coversStatic = routes.some((route) => {
              const routeNet = getNetworkAddress(route.destination, route.subnetMask)
              return routeNet !== null && routeNet === targetNet
            })

            if (coversDirect || coversStatic) {
              hasRoutingPath = true
              break
            }
          }
        }

        if (!hasRoutingPath) {
          appendLine('Antwort von Simulator: Zielnetz nicht erreichbar (kein Router zwischen den Netzen).')
          break
        }

        appendLine('Antwort von Simulator: Ping erfolgreich. (4 Pakete gesendet, 4 empfangen, 0 verloren)')

        if (path) {
          onPingPath?.(path)
        }

        break
      }
      case 'route': {
        if (args[0]?.toLowerCase() !== 'print') {
          appendLine('Ungültige Syntax. Verwende: route print')
          break
        }

        if (!selectedDevice) {
          appendLine('Kein Gerät ausgewählt. Wähle zuerst im Canvas ein Gerät aus.')
          break
        }

        appendLine('Routingtabelle (simuliert) für: ' + selectedDevice.name)

        // Für Router: direkt angeschlossene Netze (LAN/WAN) + statische Routen
        if (selectedDevice.type === 'router') {
          const lanIp = selectedDevice.lanIp ?? selectedDevice.ipAddress
          const lanMask = selectedDevice.lanSubnetMask ?? selectedDevice.subnetMask
          const wanIp = selectedDevice.wanIp
          const wanMask = selectedDevice.wanSubnetMask

          if (lanIp && lanMask) {
            const lanNet = getNetworkAddress(lanIp, lanMask)
            if (lanNet !== null) {
              appendLine(
                `  ${intToIpv4(lanNet)}  ${lanMask}  direkt (LAN)`,
              )
            }
          }

          if (wanIp && wanMask) {
            const wanNet = getNetworkAddress(wanIp, wanMask)
            if (wanNet !== null) {
              appendLine(
                `  ${intToIpv4(wanNet)}  ${wanMask}  direkt (WAN)`,
              )
            }
          }

          const routes = selectedDevice.routes ?? []
          if (routes.length > 0) {
            appendLine('')
            appendLine('  Statische Routen:')
            for (const r of routes) {
              appendLine(
                `  ${r.destination}  ${r.subnetMask}  via ${r.nextHop}`,
              )
            }
          }
          break
        }

        // Für Nicht-Router: einfache Ansicht mit direktem Netz und Default-Gateway
        if (selectedDevice.ipAddress && selectedDevice.subnetMask) {
          const net = getNetworkAddress(selectedDevice.ipAddress, selectedDevice.subnetMask)
          if (net !== null) {
            appendLine(
              `  ${intToIpv4(net)}  ${selectedDevice.subnetMask}  direkt (lokales Netz)`,
            )
          }
        }

        if (selectedDevice.gateway) {
          appendLine(
            `  0.0.0.0  0.0.0.0  via ${selectedDevice.gateway} (Standardroute)`,
          )
        }

        break
      }
      default: {
        appendLine(`Unbekannter Befehl: ${cmd}. Tippe "help" für Hilfe.`)
        break
      }
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim()) return
    handleCommand(input)
    setInput('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!input.trim()) return
      handleCommand(input)
      setInput('')
    }
  }

  return (
    <div className="terminal">
      <div className="terminal-header">
        <div className="terminal-mode-toggle">
          <button
            type="button"
            className={shellMode === 'windows' ? 'terminal-mode-btn active' : 'terminal-mode-btn'}
            onClick={() => setShellMode('windows')}
          >
            Windows CMD
          </button>
          <button
            type="button"
            className={shellMode === 'linux' ? 'terminal-mode-btn active' : 'terminal-mode-btn'}
            onClick={() => setShellMode('linux')}
          >
            Linux Terminal
          </button>
        </div>
      </div>
      <div className="terminal-output">
        {lines.map((line) => (
          <div key={line.id} className="terminal-line">
            {line.text}
          </div>
        ))}
      </div>
      <form className="terminal-input-row" onSubmit={handleSubmit}>
        <span className="terminal-prompt">
          {shellMode === 'windows' ? 'C:> ' : 'user@sim:~$ '}
        </span>
        <input
          type="text"
          className="terminal-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Befehl eingeben (z.B. ipconfig, help)"
        />
      </form>
    </div>
  )
}
