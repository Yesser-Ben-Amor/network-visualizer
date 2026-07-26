import './App.css'
import { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Inspector } from './components/Inspector'
import { Canvas } from './components/Canvas'
import { Terminal } from './components/Terminal'
import { CmdWindow } from './components/CmdWindow'
import { useDevices } from './hooks/useDevices'
import { ModeSwitcher } from './components/ModeSwitcher'
import { MatrixBackground } from './components/MatrixBackground'
import { OsiStack } from './components/OsiStack'
import { LoginPage } from './components/LoginPage'
import type { LessonScenario } from './types/scenario'
import { basicLanDhcpScenario } from './scenarios/basicLanDhcp'
import { twoNetsWithRouterScenario } from './scenarios/twoNetsWithRouter'
import { internetViaDefaultRouteScenario } from './scenarios/internetViaDefaultRoute'
import {
  hardNetworkQuestions,
  mediumNetworkQuestions,
  spongebobNetworkQuestions,
} from './quizzes/networkSpongebob'

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
  const [showArpWindow, setShowArpWindow] = useState(false)
  const [activeProtocol, setActiveProtocol] = useState<'none' | 'ping' | 'dhcp'>('none')
  const [mode, setMode] = useState<'profi' | 'lern'>('profi')
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('basic-lan-dhcp')
  const [scenarioMessages, setScenarioMessages] = useState<string[]>([])
  const [pingPath, setPingPath] = useState<number[] | null>(null)
  const [pingProgress, setPingProgress] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('nn_logged_in') === 'true'
  })
  const [quizType, setQuizType] = useState<'network' | 'linux' | 'cmd' | null>(null)
  const [quizLevel, setQuizLevel] = useState<'easy' | 'medium' | 'hard' | null>(null)
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0)
  const [quizCorrectCount, setQuizCorrectCount] = useState(0)
  const [quizFinished, setQuizFinished] = useState(false)
  const [quizShuffledOrder, setQuizShuffledOrder] = useState<number[]>([])
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null)
  const [quizTimeLeft, setQuizTimeLeft] = useState(5)

  const scenarios: LessonScenario[] = [
    basicLanDhcpScenario,
    twoNetsWithRouterScenario,
    internetViaDefaultRouteScenario,
  ]
  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId) ?? null

  const getCurrentNetworkQuestions = () => {
    if (quizLevel === 'medium') return mediumNetworkQuestions
    if (quizLevel === 'hard') return hardNetworkQuestions
    return spongebobNetworkQuestions
  }

  const handlePingPath = (path: number[]) => {
    if (path.length < 2) return

    const forward = path
    const backward = path.slice(0, -1).reverse()
    const roundTrip = [...forward, ...backward]

    setPingPath(roundTrip)
    setPingProgress(0)

    if (typeof window === 'undefined') return

    const durationMs = 6000
    const start = performance.now()

    const step = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      setPingProgress(t)
      if (t < 1) {
        window.requestAnimationFrame(step)
      } else {
        setTimeout(() => {
          setPingPath(null)
          setPingProgress(0)
        }, 300)
      }
    }

    window.requestAnimationFrame(step)
  }

  const getNetworkAddress = (ip: string | undefined, mask: string | undefined): number | null => {
    if (!ip || !mask) return null
    const partsIp = ip.split('.').map((p) => Number(p))
    const partsMask = mask.split('.').map((p) => Number(p))
    if (partsIp.length !== 4 || partsMask.length !== 4) return null
    if (
      partsIp.some((n) => !Number.isInteger(n) || n < 0 || n > 255) ||
      partsMask.some((n) => !Number.isInteger(n) || n < 0 || n > 255)
    ) {
      return null
    }
    const ipInt =
      ((partsIp[0] << 24) + (partsIp[1] << 16) + (partsIp[2] << 8) + partsIp[3]) >>> 0
    const maskInt =
      ((partsMask[0] << 24) + (partsMask[1] << 16) + (partsMask[2] << 8) + partsMask[3]) >>> 0
    return (ipInt & maskInt) >>> 0
  }

  const getSelectedDeviceArpEntries = () => {
    if (!selectedDevice || !selectedDevice.ipAddress || !selectedDevice.subnetMask) {
      return []
    }

    const srcNet = getNetworkAddress(selectedDevice.ipAddress, selectedDevice.subnetMask)
    if (srcNet === null) return []

    return devices
      .filter((d) => d.ipAddress && d.subnetMask)
      .filter((d) => {
        const net = getNetworkAddress(d.ipAddress, d.subnetMask)
        return net !== null && net === srcNet && d.id !== selectedDevice.id
      })
      .map((d) => ({
        ip: d.ipAddress ?? '-',
        mac: d.mac ?? '-',
        name: d.name,
      }))
  }

  const handleSetActiveProtocol = (protocol: 'none' | 'ping' | 'dhcp') => {
    setActiveProtocol(protocol)

    if (protocol !== 'none') {
      window.setTimeout(() => {
        setActiveProtocol('none')
      }, 3000)
    }
  }

  const getActiveOsiLayers = (): number[] => {
    const layers: number[] = []

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

    if (activeProtocol === 'ping') {
      layers.push(3, 4)
    } else if (activeProtocol === 'dhcp') {
      layers.push(3, 4, 7)
    }

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

  const handleOpenQuiz = (type: 'network' | 'linux' | 'cmd') => {
    setQuizType(type)
    setQuizLevel(null)
    setQuizFinished(false)
    setQuizCorrectCount(0)
    setQuizCurrentIndex(0)
    setQuizSelectedOption(null)
    setQuizTimeLeft(5)

    if (type === 'network') {
      // Reihenfolge wird gesetzt, sobald eine Stufe gewählt wurde
      setQuizShuffledOrder([])
    } else {
      setQuizShuffledOrder([])
    }
  }

  const handleCloseQuiz = () => {
    setQuizType(null)
    setQuizLevel(null)
    setQuizFinished(false)
    setQuizSelectedOption(null)
  }

  const handleQuizSelectOption = (optionId: string) => {
    if (quizFinished || quizSelectedOption !== null || quizType !== 'network') return

    const questions = getCurrentNetworkQuestions()
    const order = quizShuffledOrder.length ? quizShuffledOrder : questions.map((_, idx) => idx)
    const question = questions[order[quizCurrentIndex]]

    setQuizSelectedOption(optionId)
    if (optionId === question.correctId) {
      setQuizCorrectCount((prev) => prev + 1)
    }
  }

  const handleQuizNextQuestion = () => {
    if (quizType !== 'network') return

    const questions = getCurrentNetworkQuestions()
    const total = questions.length
    const nextIndex = quizCurrentIndex + 1

    if (nextIndex >= total) {
      setQuizFinished(true)
      return
    }

    setQuizCurrentIndex(nextIndex)
    setQuizSelectedOption(null)
    setQuizTimeLeft(5)
  }

  const handleQuizRetry = () => {
    if (quizType !== 'network') return

    setQuizFinished(false)
    setQuizCorrectCount(0)
    setQuizCurrentIndex(0)
    setQuizSelectedOption(null)
    setQuizTimeLeft(5)

    const questions = getCurrentNetworkQuestions()
    const order = questions.map((_, idx) => idx)
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    setQuizShuffledOrder(order)
  }

  useEffect(() => {
    if (quizType !== 'network' || !quizLevel || quizFinished) return

    setQuizTimeLeft(5)
    const start = Date.now()

    const id = window.setInterval(() =>
      setQuizTimeLeft(() => {
        const elapsedSeconds = (Date.now() - start) / 1000
        const remaining = Math.max(0, 5 - elapsedSeconds)
        if (remaining <= 0) {
          window.clearInterval(id)
        }
        return remaining
      }),
    100)

    return () => {
      window.clearInterval(id)
    }
  }, [quizType, quizLevel, quizCurrentIndex, quizFinished])

  if (!isLoggedIn) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setIsLoggedIn(true)
          window.localStorage.setItem('nn_logged_in', 'true')
        }}
      />
    )
  }

  return (
    <div className="app-root">
      <MatrixBackground />
      {showSidebar && <Sidebar onAddDevice={addDevice} onOpenQuiz={handleOpenQuiz} />}

      <main className="canvas-wrapper">
        <div className="canvas-header">
          <div>
            <h1>Netzwerksimulator (Basis)</h1>
            <p>Füge links Geräte hinzu und ziehe sie im Canvas per Drag & Drop.</p>
          </div>

          <div className="toolbar-right">
            <ModeSwitcher mode={mode} onChange={setMode} />
            {mode === 'lern' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '4px',
                }}
              >
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
              <button
                type="button"
                onClick={() => {
                  setShowArpWindow(true)
                }}
              >
                ARP-Tabelle
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
          pingPath={pingPath}
          pingProgress={pingProgress}
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

      {showArpWindow && (
        <CmdWindow title="ARP-Tabelle" onClose={() => setShowArpWindow(false)}>
          <div className="doc-window-body">
            {!selectedDevice && <p>Kein Gerät ausgewählt. Wähle im Canvas ein Gerät aus.</p>}
            {selectedDevice && (!selectedDevice.ipAddress || !selectedDevice.subnetMask) && (
              <p>
                Das ausgewählte Gerät hat keine vollständige IP-Konfiguration. ARP-Tabelle nicht
                verfügbar.
              </p>
            )}
            {selectedDevice && selectedDevice.ipAddress && selectedDevice.subnetMask && (
              <>
                <p>
                  ARP-Tabelle für <strong>{selectedDevice.name}</strong> ({' '}
                  {selectedDevice.ipAddress}/{selectedDevice.subnetMask})
                </p>
                {getSelectedDeviceArpEntries().length === 0 ? (
                  <p>Keine weiteren Geräte im gleichen Netz gefunden.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Gerätename</th>
                        <th>IP-Adresse</th>
                        <th>MAC-Adresse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSelectedDeviceArpEntries().map((entry) => (
                        <tr key={`${entry.ip}-${entry.mac}-${entry.name}`}>
                          <td>{entry.name}</td>
                          <td>{entry.ip}</td>
                          <td>{entry.mac}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
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
            onPingPath={handlePingPath}
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

      {quizType && (
        <CmdWindow
          title={
            quizType === 'network'
              ? 'Netzwerk-Quiz'
              : quizType === 'linux'
                ? 'Linux-Befehle Quiz'
                : 'CMD-Befehle Quiz'
          }
          onClose={handleCloseQuiz}
        >
          <div className="doc-window-body quiz-modal-body">
            {quizType === 'network' && quizLevel === null && (
              <>
                <p>Wähle deine Stufe:</p>
                <div className="quiz-levels">
                  <button
                    type="button"
                    className="quiz-level"
                    onClick={() => setQuizLevel('easy')}
                  >
                    <img
                      src="https://www.tambini.de/media/image/9e/81/ba/SpongeBob-Geburtstagsspiele.jpg"
                      alt="Spongebob-Stufe"
                      className="quiz-level-image"
                    />
                    <span className="quiz-level-text">Spongebob-Stufe</span>
                  </button>
                  <button
                    type="button"
                    className="quiz-level"
                    onClick={() => setQuizLevel('medium')}
                  >
                    <span className="quiz-level-text">Mittelstufe (🧠)</span>
                  </button>
                  <button
                    type="button"
                    className="quiz-level"
                    onClick={() => setQuizLevel('hard')}
                  >
                    <span className="quiz-level-text">Ninja-Stufe (🥷)</span>
                  </button>
                </div>
              </>
            )}

            {quizType === 'network' && quizLevel !== null && (
              <>
                {(() => {
                  const questions = getCurrentNetworkQuestions()
                  const order =
                    quizShuffledOrder.length > 0
                      ? quizShuffledOrder
                      : questions.map((_, idx) => idx)
                  const question = questions[order[quizCurrentIndex]]

                  return (
                    <>
                      <div className="quiz-timer">
                        <div className="quiz-timer-frame">
                          <div className="quiz-timer-track">
                            <div
                              className="quiz-timer-fill"
                              style={{ width: `${(quizTimeLeft / 5) * 100}%` }}
                            />
                          </div>
                          <div className="quiz-timer-center">{Math.ceil(quizTimeLeft)}s</div>
                        </div>
                      </div>
                      <p>
                        Frage {quizCurrentIndex + 1} von {order.length}
                      </p>
                      <h3>{question.text}</h3>
                      <div className="quiz-options">
                        {question.options.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            className={
                              quizSelectedOption === null
                                ? 'quiz-option-btn'
                                : opt.id === question.correctId
                                  ? 'quiz-option-btn quiz-option-correct'
                                  : opt.id === quizSelectedOption
                                    ? 'quiz-option-btn quiz-option-wrong'
                                    : 'quiz-option-btn quiz-option-disabled'
                            }
                            disabled={quizSelectedOption !== null}
                            onClick={() => handleQuizSelectOption(opt.id)}
                          >
                            {opt.text}
                          </button>
                        ))}
                      </div>

                      {quizSelectedOption !== null && !quizFinished && (
                        <button type="button" onClick={handleQuizNextQuestion}>
                          Nächste Frage
                        </button>
                      )}

                      {quizFinished && (
                        <>
                          <p>
                            Du hast {quizCorrectCount} von {order.length} Fragen richtig beantwortet.
                          </p>
                          <p>
                            Ergebnis:{' '}
                            {quizCorrectCount >= Math.ceil(order.length * 0.7)
                              ? 'Bestanden 🎉'
                              : 'Nicht bestanden – versuche es noch einmal.'}
                          </p>
                          <button type="button" onClick={handleQuizRetry}>
                            Quiz wiederholen
                          </button>
                        </>
                      )}
                    </>
                  )
                })()}
              </>
            )}

            {quizType !== 'network' && (
              <p>Für dieses Quiz sind noch keine Fragen hinterlegt.</p>
            )}
          </div>
        </CmdWindow>
      )}
    </div>
  )
}

export default App