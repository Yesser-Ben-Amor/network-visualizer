import type React from 'react'
import type { Device } from '../types/network'

interface InspectorProps {
  selectedDevice: Device | null
  onBonPrinterModelChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  onRoutesChange: (routes: Device['routes']) => void
  onIpConfigChange: (
    changes: Partial<
      Pick<
        Device,
        | 'ipAddress'
        | 'subnetMask'
        | 'gateway'
        | 'lanIp'
        | 'lanSubnetMask'
        | 'wanIp'
        | 'wanSubnetMask'
        | 'isDhcpServer'
        | 'dhcpPoolStart'
        | 'dhcpPoolEnd'
      >
    >,
  ) => void
}

export function Inspector({ selectedDevice, onBonPrinterModelChange, onIpConfigChange, onRoutesChange }: InspectorProps) {
  return (
    <aside className="inspector">
      <h2>Details</h2>
      {!selectedDevice && <p>Noch kein Gerät ausgewählt.</p>}

      {selectedDevice && (
        <div className="inspector-content">
          <p>
            <strong>Typ:</strong> {selectedDevice.type}
          </p>
          <p>
            <strong>Name:</strong> {selectedDevice.name}
          </p>
          <p>
            <strong>Position:</strong> x={Math.round(selectedDevice.x)}, y=
            {Math.round(selectedDevice.y)}
          </p>

          {selectedDevice.type === 'router' ? (
            <>
              <div className="inspector-field">
                <label>
                  <span>LAN IP-Adresse</span>
                  <input
                    type="text"
                    value={selectedDevice.lanIp ?? selectedDevice.ipAddress ?? ''}
                    onChange={(e) =>
                      onIpConfigChange({ lanIp: e.target.value, ipAddress: e.target.value })
                    }
                    placeholder="z.B. 192.168.0.1"
                  />
                </label>
              </div>

              <div className="inspector-field">
                <label>
                  <span>LAN-Subnetzmaske</span>
                  <input
                    type="text"
                    value={selectedDevice.lanSubnetMask ?? selectedDevice.subnetMask ?? ''}
                    onChange={(e) =>
                      onIpConfigChange({ lanSubnetMask: e.target.value, subnetMask: e.target.value })
                    }
                    placeholder="z.B. 255.255.255.0"
                  />
                </label>
              </div>

              <div className="inspector-field">
                <label>
                  <span>WAN IP-Adresse</span>
                  <input
                    type="text"
                    value={selectedDevice.wanIp ?? ''}
                    onChange={(e) => onIpConfigChange({ wanIp: e.target.value })}
                    placeholder="z.B. 192.168.10.1"
                  />
                </label>
              </div>

              <div className="inspector-field">
                <label>
                  <span>WAN-Subnetzmaske</span>
                  <input
                    type="text"
                    value={selectedDevice.wanSubnetMask ?? ''}
                    onChange={(e) => onIpConfigChange({ wanSubnetMask: e.target.value })}
                    placeholder="z.B. 255.255.255.0"
                  />
                </label>
              </div>

              <div className="inspector-field">
                <label>
                  <span>Routingtabelle</span>
                  <div>
                    {(selectedDevice.routes ?? []).map((route, index) => (
                      <div key={index} style={{ marginBottom: '6px' }}>
                        <input
                          type="text"
                          style={{ width: '100%', marginBottom: '4px' }}
                          value={route.destination}
                          placeholder="Zielnetz (z.B. 192.168.20.0)"
                          onChange={(e) => {
                            const next = [...(selectedDevice.routes ?? [])]
                            next[index] = { ...next[index], destination: e.target.value }
                            onRoutesChange(next)
                          }}
                        />
                        <input
                          type="text"
                          style={{ width: '100%', marginBottom: '4px' }}
                          value={route.subnetMask}
                          placeholder="Maske (z.B. 255.255.255.0)"
                          onChange={(e) => {
                            const next = [...(selectedDevice.routes ?? [])]
                            next[index] = { ...next[index], subnetMask: e.target.value }
                            onRoutesChange(next)
                          }}
                        />
                        <input
                          type="text"
                          style={{ width: '100%', marginBottom: '4px' }}
                          value={route.nextHop}
                          placeholder="Next Hop (z.B. 192.168.10.1)"
                          onChange={(e) => {
                            const next = [...(selectedDevice.routes ?? [])]
                            next[index] = { ...next[index], nextHop: e.target.value }
                            onRoutesChange(next)
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = (selectedDevice.routes ?? []).filter((_, i) => i !== index)
                            onRoutesChange(next.length > 0 ? next : undefined)
                          }}
                        >
                          X
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const next = [
                          ...(selectedDevice.routes ?? []),
                          { destination: '', subnetMask: '', nextHop: '' },
                        ]
                        onRoutesChange(next)
                      }}
                    >
                      Route hinzufügen
                    </button>
                  </div>
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="inspector-field">
                <label>
                  <span>IP-Adresse</span>
                  <input
                    type="text"
                    value={selectedDevice.ipAddress ?? ''}
                    onChange={(e) => onIpConfigChange({ ipAddress: e.target.value })}
                    placeholder="z.B. 192.168.10.5"
                  />
                </label>
              </div>

              <div className="inspector-field">
                <label>
                  <span>Subnetzmaske</span>
                  <input
                    type="text"
                    value={selectedDevice.subnetMask ?? ''}
                    onChange={(e) => onIpConfigChange({ subnetMask: e.target.value })}
                    placeholder="z.B. 255.255.255.0"
                  />
                </label>
              </div>

              <div className="inspector-field">
                <label>
                  <span>Gateway</span>
                  <input
                    type="text"
                    value={selectedDevice.gateway ?? ''}
                    onChange={(e) => onIpConfigChange({ gateway: e.target.value })}
                    placeholder="z.B. 192.168.10.1"
                  />
                </label>
              </div>

              {selectedDevice.type === 'server' && (
                <>
                  <div className="inspector-field">
                    <label>
                      <span>DHCP-Server aktivieren</span>
                      <input
                        type="checkbox"
                        checked={selectedDevice.isDhcpServer ?? false}
                        onChange={(e) => {
                          const checked = e.target.checked
                          if (checked && !selectedDevice.dhcpPoolStart && !selectedDevice.dhcpPoolEnd) {
                            // Einfache Defaults setzen, falls noch nichts konfiguriert ist
                            onIpConfigChange({
                              isDhcpServer: true,
                              dhcpPoolStart: '192.168.0.100',
                              dhcpPoolEnd: '192.168.0.200',
                            })
                          } else {
                            onIpConfigChange({ isDhcpServer: checked })
                          }
                        }}
                      />
                    </label>
                  </div>

                  {selectedDevice.isDhcpServer && (
                    <>
                      <div className="inspector-field">
                        <label>
                          <span>DHCP-Pool von</span>
                          <input
                            type="text"
                            value={selectedDevice.dhcpPoolStart ?? ''}
                            onChange={(e) => onIpConfigChange({ dhcpPoolStart: e.target.value })}
                            placeholder="z.B. 192.168.0.100"
                          />
                        </label>
                      </div>

                      <div className="inspector-field">
                        <label>
                          <span>DHCP-Pool bis</span>
                          <input
                            type="text"
                            value={selectedDevice.dhcpPoolEnd ?? ''}
                            onChange={(e) => onIpConfigChange({ dhcpPoolEnd: e.target.value })}
                            placeholder="z.B. 192.168.0.200"
                          />
                        </label>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {(selectedDevice.type === 'bonndrucker' || selectedDevice.type === 'kasse') && (
            <div className="inspector-field">
              <label>
                <span>
                  {selectedDevice.type === 'bonndrucker'
                    ? 'Bondrucker-Modell'
                    : 'Kassen-Modell'}
                </span>
                <select
                  value={selectedDevice.model ?? ''}
                  onChange={onBonPrinterModelChange}
                >
                  <option value="">Modell auswählen…</option>
                  {selectedDevice.type === 'bonndrucker' && (
                    <>
                      <option value="Epson TM-T88VI">Epson TM-T88VI</option>
                      <option value="Epson TM-T20II">Epson TM-T20II</option>
                      <option value="Star TSP100">Star TSP100</option>
                      <option value="Custom Q3X">Custom Q3X</option>
                    </>
                  )}
                  {selectedDevice.type === 'kasse' && (
                    <>
                      <option value="VECTRON POS">VECTRON POS</option>
                      <option value="Orderman Columbus">Orderman Columbus</option>
                      <option value="NCR RealPOS">NCR RealPOS</option>
                      <option value="Generic Touch POS">Generic Touch POS</option>
                    </>
                  )}
                </select>
              </label>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
