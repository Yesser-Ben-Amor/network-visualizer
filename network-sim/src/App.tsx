import './App.css'
import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Inspector } from './components/Inspector'
import { Canvas } from './components/Canvas'
import { Terminal } from './components/Terminal'
import { CmdWindow } from './components/CmdWindow'
import { useDevices } from './hooks/useDevices'
import { ModeSwitcher } from './components/ModeSwitcher'
import { MatrixBackground } from './components/MatrixBackground'
import { OsiStack } from './components/OsiStack'
import type { LessonScenario } from './types/scenario'
import { basicLanDhcpScenario } from './scenarios/basicLanDhcp'
import { twoNetsWithRouterScenario } from './scenarios/twoNetsWithRouter'
import { internetViaDefaultRouteScenario } from './scenarios/internetViaDefaultRoute'

function App() {
  const {
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
    handleRemoveConnections,
    handleBonPrinterModelChange,
    updateSelectedDeviceIpConfig,
    updateSelectedDeviceRoutes,
    validateNetwork,
  } = useDevices()

  const [networkErrors, setNetworkErrors] = useState<string[]>([])
  const [documentation, setDocumentation] = useState<string | null>(null)
  const [showCmdWindow, setShowCmdWindow] = useState(true)
  const [showDocumentationWindow, setShowDocumentationWindow] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showScenarioPanel, setShowScenarioPanel] = useState(true)
  const [showOsiWindow, setShowOsiWindow] = useState(true)
  const [activeProtocol, setActiveProtocol] = useState<'none' | 'ping' | 'dhcp'>('none')
  const [mode, setMode] = useState<'profi' | 'lern'>('profi')
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('basic-lan-dhcp')
  const [scenarioMessages, setScenarioMessages] = useState<string[]>([])

  const scenarios: LessonScenario[] = [basicLanDhcpScenario, twoNetsWithRouterScenario, internetViaDefaultRouteScenario]
  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId) ?? null

  const handleSetActiveProtocol = (protocol: 'none' | 'ping' | 'dhcp') => {
    setActiveProtocol(protocol)

    if (protocol !== 'none') {
      // Protokoll für kurze Zeit hervorheben, dann automatisch zurücksetzen
      window.setTimeout(() => {
        setActiveProtocol('none')
      }, 3000)
    }
  }

  // OSI-Visualisierung: aktuelle aktive Schichten aus Kabeltyp + Protokoll ableiten
  const getActiveOsiLayers = (): number[] => {
    const layers: number[] = []

    // Verkabelung aktiv → Schicht 1+2
    switch (currentCableType) {
      case 'ethernet':
      case 'fiber':
      case 'serial':
      case 'wireless':
        layers.push(1, 2)
        break
      default:
        break
    }

    // Protokollabhängige Schichten
    if (activeProtocol === 'ping') {
      // Ping: Netzwerk + Transport
      layers.push(3, 4)
    } else if (activeProtocol === 'dhcp') {
      // DHCP: Netzwerk, Transport, Anwendung
      layers.push(3, 4, 7)
    }

    // Duplikate entfernen
    return Array.from(new Set(layers)).sort((a, b) => a - b)
  }

  const handleValidateNetwork = () => {
    const errors = validateNetwork()

    if (errors.length === 0) {
      setNetworkErrors(['Keine Netzwerkprobleme erkannt.'])
    } else {
      setNetworkErrors(errors)
    }
  }

  const handleGenerateDocumentation = () => {
    const deviceLines: string[] = []
    const connectionLines: string[] = []

    const roleForType = (type: string): string => {
      switch (type) {
        case 'router':
          return 'Router'
        case 'switch':
        case 'switchpanel':
          return 'Switch'
        case 'server':
          return 'Server'
        case 'pc':
          return 'Client-PC'
        case 'printer':
        case 'bonndrucker':
          return 'Drucker'
        case 'kasse':
        case 'kassenschublade':
          return 'Kassenarbeitsplatz'
        default:
          return 'Gerät'
      }
    }

    for (const d of devices) {
      const role = roleForType(d.type)
      const ip = d.ipAddress ?? '-'
      const mask = d.subnetMask ?? '-'
      const gw = d.gateway ?? '-'

      const connCount = connections.filter(
        (c) => c.fromId === d.id || c.toId === d.id,
      ).length

      deviceLines.push(
        `Name: ${d.name}\n` +
          `  Rolle: ${role}\n` +
          `  Typ: ${d.type}\n` +
          `  IP-Adresse: ${ip}\n` +
          `  Subnetzmaske: ${mask}\n` +
          `  Standardgateway: ${gw}\n` +
          `  Anzahl Verbindungen: ${connCount}\n`,
      )
    }

    // Verbindungsübersicht mit Kabeltyp und IPs der Endpunkte
    connections.forEach((conn, index) => {
      const from = devices.find((d) => d.id === conn.fromId)
      const to = devices.find((d) => d.id === conn.toId)

      const fromName = from?.name ?? `Gerät ${conn.fromId}`
      const toName = to?.name ?? `Gerät ${conn.toId}`

      const fromIp = from?.ipAddress ?? '-'
      const toIp = to?.ipAddress ?? '-'

      connectionLines.push(
        `Verbindung ${index + 1}:\n` +
          `  Typ: ${conn.type}\n` +
          `  Von: ${fromName} (IP: ${fromIp})\n` +
          `  Nach: ${toName} (IP: ${toIp})\n`,
      )
    })

    const header =
      `Netzwerkdokumentation (simuliert)\n` +
      `Erzeugt: ${new Date().toLocaleString()}\n` +
      `\n` +
      `Gesamtanzahl Geräte: ${devices.length}\n` +
      `Gesamtanzahl Verbindungen: ${connections.length}\n` +
      `\n`

    const devicesSection =
      'Geräteübersicht:\n\n' + (deviceLines.join('\n') || 'Keine Geräte vorhanden.') + '\n\n'

    const connectionsSection =
      'Verbindungen:\n\n' +
      (connectionLines.length > 0
        ? connectionLines.join('\n')
        : 'Keine Verbindungen vorhanden.')

    setDocumentation(header + devicesSection + connectionsSection)
    setShowDocumentationWindow(true)
  }

  const handleDownloadTopology = async () => {
    if (!canvasRef.current) return

    const html2canvas = (await import('html2canvas')).default
    const canvasElement = canvasRef.current
    const canvasImage = await html2canvas(canvasElement, {
      backgroundColor: '#020617',
      useCORS: true,
    })

    const dataUrl = canvasImage.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'topology.png'
    a.click()
  }

  const handlePrint = () => {
    window.print()
  }

  const handlePrintDocumentation = async () => {
    if (!documentation) return

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

    const margin = 40
    const lineHeight = 14
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const maxWidth = pageWidth - margin * 2

    const lines = doc.splitTextToSize(documentation, maxWidth)

    let y = margin
    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += lineHeight
    }

    doc.save('netzwerkdokumentation.pdf')
  }

  const handleValidateScenario = () => {
    const scenario = scenarios.find((s) => s.id === selectedScenarioId)
    if (!scenario) return
    const messages = scenario.validate(devices, connections)
    setScenarioMessages(messages)
  }

  return (
    <div className="app-root">
      <MatrixBackground />
      {showSidebar && <Sidebar onAddDevice={addDevice} />}

      <main className="canvas-wrapper">
        <div className="canvas-header">
          <div>
            <h1>Netzwerksimulator (Basis)</h1>
            <p>Füge links Geräte hinzu und ziehe sie im Canvas per Drag & Drop.</p>
          </div>

          <div className="toolbar-right">
            <ModeSwitcher mode={mode} onChange={setMode} />
            {mode === 'lern' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <select
                  value={selectedScenarioId}
                  onChange={(e) => setSelectedScenarioId(e.target.value)}
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={handleValidateScenario}>
                  Aufgabe prüfen
                </button>
              </div>
            )}
            <div className="wiring-controls">
              <div className="wiring-toggle" onClick={() => setWiringMode(!wiringMode)}>
                <span className="wiring-toggle-label">Verkabelung</span>
                <button
                  type="button"
                  className={wiringMode ? 'switch switch-on' : 'switch'}
                  aria-pressed={wiringMode}
                >
                  <span className="switch-thumb" />
                </button>
              </div>

              <div className="sidebar-cable-types wiring-cable-types">
                <div className="sidebar-cable-buttons">
                  <button
                    type="button"
                    className={
                      currentCableType === 'ethernet'
                        ? 'cable-btn cable-ethernet cable-btn-active'
                        : 'cable-btn cable-ethernet'
                    }
                    onClick={() => setCurrentCableType('ethernet')}
                  >
                    Ethernet
                  </button>

                  <button
                    type="button"
                    className={
                      currentCableType === 'fiber'
                        ? 'cable-btn cable-fiber cable-btn-active'
                        : 'cable-btn cable-fiber'
                    }
                    onClick={() => setCurrentCableType('fiber')}
                  >
                    Fiber
                  </button>

                  <button
                    type="button"
                    className={
                      currentCableType === 'serial'
                        ? 'cable-btn cable-serial cable-btn-active'
                        : 'cable-btn cable-serial'
                    }
                    onClick={() => setCurrentCableType('serial')}
                  >
                    Serial
                  </button>

                  <button
                    type="button"
                    className={
                      currentCableType === 'wireless'
                        ? 'cable-btn cable-wireless cable-btn-active'
                        : 'cable-btn cable-wireless'
                    }
                    onClick={() => setCurrentCableType('wireless')}
                  >
                    Wireless
                  </button>
                </div>
              </div>
            </div>

            <div className="topology-actions">
              <button type="button" onClick={() => setShowSidebar((prev) => !prev)}>
                {showSidebar ? 'Palette ausblenden' : 'Palette anzeigen'}
              </button>
              <button type="button" onClick={handleValidateNetwork}>
                Netz prüfen
              </button>
              <button type="button" onClick={handleGenerateDocumentation}>
                Doku erzeugen
              </button>
              <button type="button" onClick={handlePrintDocumentation} disabled={!documentation}>
                Doku herunterladen (PDF)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOsiWindow(true)
                }}
              >
                OSI anzeigen
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCmdWindow(true)
                }}
              >
                CMD öffnen
              </button>
              <button type="button" onClick={resetTopology}>
                Zurücksetzen
              </button>
              <button type="button" onClick={handleDownloadTopology}>
                Download PNG
              </button>
              <button type="button" onClick={handlePrint}>
                Drucken
              </button>
            </div>
          </div>
        </div>

        {mode === 'lern' && activeScenario && showScenarioPanel && (
          <div className="scenario-panel">
            <div className="scenario-panel-header">
              <h2>{activeScenario.title}</h2>
              <button
                type="button"
                className="scenario-panel-close"
                onClick={() => setShowScenarioPanel(false)}
                aria-label="Aufgabentext schließen"
              >
                ×
              </button>
            </div>
            <p>{activeScenario.description}</p>
          </div>
        )}

        <Canvas
          devices={devices}
          connections={connections}
          wiringMode={wiringMode}
          wiringSourceId={wiringSourceId}
          contextMenu={contextMenu}
          canvasRef={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onCanvasClick={handleCanvasClick}
          onDeviceMouseDown={handleDeviceMouseDown}
          onDeviceClick={handleDeviceClick}
          onDeviceContextMenu={handleDeviceContextMenu}
          onDuplicateDevice={handleDuplicateDevice}
          onRemoveDevice={handleRemoveDevice}
          onRemoveConnections={handleRemoveConnections}
        />

        {mode === 'lern' && scenarioMessages.length > 0 && (
          <div className="network-errors">
            <h2>Szenario-Prüfung</h2>
            <ul>
              {scenarioMessages.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {networkErrors.length > 0 && (
          <div className="network-errors">
            <h2>Netzwerkprüfung</h2>
            <ul>
              {networkErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <div className="side-panel">
        <Inspector
          selectedDevice={selectedDevice}
          onBonPrinterModelChange={handleBonPrinterModelChange}
          onIpConfigChange={updateSelectedDeviceIpConfig}
          onRoutesChange={updateSelectedDeviceRoutes}
        />
      </div>

      {showOsiWindow && (
        <CmdWindow title="OSI-Modell" onClose={() => setShowOsiWindow(false)}>
          <OsiStack activeLayers={getActiveOsiLayers()} />
        </CmdWindow>
      )}

      {showCmdWindow && (
        <CmdWindow onClose={() => setShowCmdWindow(false)}>
          <Terminal
            selectedDevice={selectedDevice}
            onUpdateIpConfig={updateSelectedDeviceIpConfig}
            devices={devices}
            connections={connections}
            onSetActiveProtocol={handleSetActiveProtocol}
          />
        </CmdWindow>
      )}

      {documentation && showDocumentationWindow && (
        <CmdWindow title="Netzwerkdokumentation" onClose={() => setShowDocumentationWindow(false)}>
          <div className="doc-window-body">
            <pre>{documentation}</pre>
          </div>
        </CmdWindow>
      )}
    </div>
  )
}

export default App
