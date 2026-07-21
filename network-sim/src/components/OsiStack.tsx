import type { FC } from 'react'

interface OsiStackProps {
  activeLayers: number[]
}

const OSI_LAYERS: { level: number; name: string }[] = [
  { level: 7, name: 'Anwendung' },
  { level: 6, name: 'Darstellung' },
  { level: 5, name: 'Sitzung' },
  { level: 4, name: 'Transport' },
  { level: 3, name: 'Vermittlung (Netzwerk)' },
  { level: 2, name: 'Sicherung' },
  { level: 1, name: 'Bitübertragung' },
]

export const OsiStack: FC<OsiStackProps> = ({ activeLayers }) => {
  return (
    <div className="osi-stack">
      <h3 className="osi-stack-title">OSI-Modell</h3>
      <ul className="osi-stack-list">
        {OSI_LAYERS.map((layer) => {
          const isActive = activeLayers.includes(layer.level)
          return (
            <li
              key={layer.level}
              className={isActive ? 'osi-layer osi-layer-active' : 'osi-layer'}
            >
              <span className="osi-layer-level">{layer.level}</span>
              <span className="osi-layer-name">{layer.name}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
