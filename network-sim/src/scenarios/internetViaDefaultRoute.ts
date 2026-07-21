import type { LessonScenario } from '../types/scenario'
import type { Device, Connection } from '../types/network'

// Recreated scenario: Internet-Zugang über Default-Route
// Hinweis: Validierung ist zunächst einfach gehalten und kann später wieder verfeinert werden.

export const internetViaDefaultRouteScenario: LessonScenario = {
  id: 'internet-via-default-route',
  title: 'Internet-Zugang über Default-Route',
  description:
    'Baue ein Netz auf, in dem ein PC über einen Router ins "Internet" kommt. Der PC soll ein Default-Gateway eingetragen haben, das auf den Router zeigt.',
  validate(devices: Device[], _connections: Connection[]): string[] {
    const messages: string[] = []

    const pcs = devices.filter((d) => d.type === 'pc')
    const routers = devices.filter((d) => d.type === 'router')

    if (pcs.length === 0) {
      messages.push('Es ist kein PC vorhanden. Füge mindestens einen PC hinzu.')
    }

    if (routers.length === 0) {
      messages.push('Es ist kein Router vorhanden. Füge einen Router hinzu, der den Internet-Zugang bereitstellt.')
    }

    if (pcs.length === 0 || routers.length === 0) {
      return messages
    }

    // Prüfe, ob es einen PC mit gesetztem Gateway gibt
    const pcWithGateway = pcs.find((pc) => pc.gateway)
    if (!pcWithGateway) {
      messages.push('Kein PC hat ein Standardgateway eingetragen. Setze beim PC das Gateway auf die IP des Routers.')
      return messages
    }

    // Suche einen Router, dessen IP-Adresse dem Gateway entspricht
    const matchingRouter = routers.find((r) => r.ipAddress && r.ipAddress === pcWithGateway.gateway)
    if (!matchingRouter) {
      messages.push(
        `Das eingetragene Gateway (${pcWithGateway.gateway}) zeigt auf keinen Router. Stelle sicher, dass das Gateway die IP-Adresse des Routers ist.`,
      )
      return messages
    }

    messages.push(
      `Aufgabe erfüllt: Der PC ${pcWithGateway.name} nutzt den Router ${matchingRouter.name} als Default-Gateway für den Internet-Zugang.`,
    )

    return messages
  },
}
