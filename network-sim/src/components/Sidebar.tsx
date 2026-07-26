import type { DeviceType } from '../types/network'

interface SidebarProps {
  onAddDevice: (type: DeviceType) => void
  onOpenQuiz: (type: 'network' | 'linux' | 'cmd') => void
}

export function Sidebar({ onAddDevice, onOpenQuiz }: SidebarProps) {
  return (
    <aside className="sidebar">
      <h2>Palette</h2>
      <button onClick={() => onAddDevice('pc')}>PC hinzufügen</button>
      <button onClick={() => onAddDevice('server')}>Server hinzufügen</button>
      <button onClick={() => onAddDevice('switch')}>Switch hinzufügen</button>
      <button onClick={() => onAddDevice('router')}>Router hinzufügen</button>
      <button onClick={() => onAddDevice('firewall')}>Firewall hinzufügen</button>
      <button onClick={() => onAddDevice('switchpanel')}>Patchpanel hinzufügen</button>
      <button onClick={() => onAddDevice('printer')}>Drucker hinzufügen</button>
      <button onClick={() => onAddDevice('bonndrucker')}>Bondrucker hinzufügen</button>
      <button onClick={() => onAddDevice('kasse')}>Kasse hinzufügen</button>
      <button onClick={() => onAddDevice('kassenschublade')}>Kassenschublade hinzufügen</button>

      <hr className="sidebar-separator" />
      <h2>Quiz</h2>
      <div className="quiz-sidebar">
        <button
          type="button"
          className="quiz-btn"
          onClick={() => onOpenQuiz('network')}
        >
          Netzwerk-Quiz
        </button>
        <button
          type="button"
          className="quiz-btn"
          onClick={() => onOpenQuiz('linux')}
        >
          Linux-Befehle Quiz
        </button>
        <button
          type="button"
          className="quiz-btn"
          onClick={() => onOpenQuiz('cmd')}
        >
          CMD-Befehle Quiz
        </button>
      </div>
    </aside>
  )
}
