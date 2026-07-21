import type { Device, Connection } from './network'

export interface LessonScenario {
  id: string
  title: string
  description: string
  validate: (devices: Device[], connections: Connection[]) => string[]
}
