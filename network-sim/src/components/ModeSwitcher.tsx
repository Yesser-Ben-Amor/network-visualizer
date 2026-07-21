import type React from 'react'

interface ModeSwitcherProps {
  mode: 'profi' | 'lern'
  onChange: (mode: 'profi' | 'lern') => void
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ mode, onChange }) => {
  return (
    <nav className="mode-switcher" aria-label="Darstellungsmodus">
      <button
        type="button"
        className={mode === 'profi' ? 'mode-tab mode-tab-active' : 'mode-tab'}
        onClick={() => onChange('profi')}
      >
        Profi-Modus
      </button>
      <button
        type="button"
        className={mode === 'lern' ? 'mode-tab mode-tab-active' : 'mode-tab'}
        onClick={() => onChange('lern')}
      >
        Lernmodus
      </button>
    </nav>
  )
}
