export type AnswerOptionId = 'A' | 'B' | 'C' | 'D'

export interface AnswerOption {
  id: AnswerOptionId
  text: string
}

export interface QuizQuestion {
  id: string
  text: string
  options: AnswerOption[]
  correctId: AnswerOptionId
}

export const spongebobNetworkQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    text: 'Wofür steht die Abkürzung IP in IP-Adresse?',
    options: [
      { id: 'A', text: 'Internet Protocol' },
      { id: 'B', text: 'Internal Port' },
      { id: 'C', text: 'Integrated Provider' },
      { id: 'D', text: 'Inter Paket' },
    ],
    correctId: 'A',
  },
  {
    id: 'q2',
    text: 'Welches Gerät verbindet normalerweise zwei Netzwerke miteinander?',
    options: [
      { id: 'A', text: 'Switch' },
      { id: 'B', text: 'Router' },
      { id: 'C', text: 'Drucker' },
      { id: 'D', text: 'Monitor' },
    ],
    correctId: 'B',
  },
  {
    id: 'q3',
    text: 'Welche IP-Adresse ist typisch für ein lokales Heimnetz?',
    options: [
      { id: 'A', text: '192.168.0.10' },
      { id: 'B', text: '8.8.8.8' },
      { id: 'C', text: '255.255.255.255' },
      { id: 'D', text: '0.0.0.0' },
    ],
    correctId: 'A',
  },
  {
    id: 'q4',
    text: 'Was beschreibt die Subnetzmaske 255.255.255.0?',
    options: [
      { id: 'A', text: 'Wie schnell das Netz ist' },
      { id: 'B', text: 'Wie viele Geräte im Netz sein können' },
      { id: 'C', text: 'Das Passwort des WLANs' },
      { id: 'D', text: 'Den Namen des Routers' },
    ],
    correctId: 'B',
  },
  {
    id: 'q5',
    text: 'Welche Schicht des OSI-Modells ist für IP-Adressen zuständig?',
    options: [
      { id: 'A', text: 'Sicherungsschicht (Layer 2)' },
      { id: 'B', text: 'Vermittlungsschicht (Layer 3)' },
      { id: 'C', text: 'Transportschicht (Layer 4)' },
      { id: 'D', text: 'Anwendungsschicht (Layer 7)' },
    ],
    correctId: 'B',
  },
  {
    id: 'q6',
    text: 'Was macht ein DHCP-Server?',
    options: [
      { id: 'A', text: 'Er druckt Dokumente aus.' },
      { id: 'B', text: 'Er vergibt automatisch IP-Adressen.' },
      { id: 'C', text: 'Er verschlüsselt WLAN.' },
      { id: 'D', text: 'Er überwacht die CPU-Auslastung.' },
    ],
    correctId: 'B',
  },
  {
    id: 'q7',
    text: 'Welche Adresse ist typischerweise das Standardgateway in einem kleinen Netz?',
    options: [
      { id: 'A', text: 'Die IP des Druckers' },
      { id: 'B', text: 'Die IP des Routers' },
      { id: 'C', text: 'Die IP des PCs' },
      { id: 'D', text: 'Die IP des Switches' },
    ],
    correctId: 'B',
  },
  {
    id: 'q8',
    text: 'Was passiert bei einem Ping?',
    options: [
      { id: 'A', text: 'Eine Datei wird übertragen.' },
      { id: 'B', text: 'Es wird geprüft, ob ein Ziel erreichbar ist.' },
      { id: 'C', text: 'Das WLAN-Passwort wird geändert.' },
      { id: 'D', text: 'Der PC wird neu gestartet.' },
    ],
    correctId: 'B',
  },
  {
    id: 'q9',
    text: 'Welche Angabe gehört NICHT zu einer IP-Konfiguration eines PCs?',
    options: [
      { id: 'A', text: 'IP-Adresse' },
      { id: 'B', text: 'Subnetzmaske' },
      { id: 'C', text: 'Standardgateway' },
      { id: 'D', text: 'Bildschirmauflösung' },
    ],
    correctId: 'D',
  },
  {
    id: 'q10',
    text: 'Wie nennt man einen logischen Zusammenschluss von Geräten in einem gemeinsamen IP-Bereich?',
    options: [
      { id: 'A', text: 'Subnetz' },
      { id: 'B', text: 'Download' },
      { id: 'C', text: 'Firewall' },
      { id: 'D', text: 'Backup' },
    ],
    correctId: 'A',
  },
]

export const mediumNetworkQuestions: QuizQuestion[] = [
  {
    id: 'm1',
    text: 'Welches der folgenden Netze ist ein privates IPv4-Netz?',
    options: [
      { id: 'A', text: '10.0.0.0/8' },
      { id: 'B', text: '11.0.0.0/8' },
      { id: 'C', text: '172.10.0.0/16' },
      { id: 'D', text: '1.1.1.0/24' },
    ],
    correctId: 'A',
  },
  {
    id: 'm2',
    text: 'Was beschreibt die CIDR-Notation 192.168.10.0/24?',
    options: [
      { id: 'A', text: '24 Hosts im Netz' },
      { id: 'B', text: 'Subnetzmaske 255.255.255.0' },
      { id: 'C', text: 'Gateway-Adresse' },
      { id: 'D', text: 'Broadcast-Adresse' },
    ],
    correctId: 'B',
  },
  {
    id: 'm3',
    text: 'Was ist die Broadcast-Adresse des Netzes 192.168.1.0/24?',
    options: [
      { id: 'A', text: '192.168.1.0' },
      { id: 'B', text: '192.168.1.1' },
      { id: 'C', text: '192.168.1.254' },
      { id: 'D', text: '192.168.1.255' },
    ],
    correctId: 'D',
  },
  {
    id: 'm4',
    text: 'Welche Aufgabe hat ARP (Address Resolution Protocol)?',
    options: [
      { id: 'A', text: 'Auflösung von IP-Adressen in MAC-Adressen' },
      { id: 'B', text: 'Auflösung von Domainnamen in IP-Adressen' },
      { id: 'C', text: 'Verschlüsselung von HTTP-Verbindungen' },
      { id: 'D', text: 'Vergabe von IP-Adressen' },
    ],
    correctId: 'A',
  },
  {
    id: 'm5',
    text: 'Ein PC hat die IP 192.168.5.23/24 und das Gateway 192.168.5.1. Welches Ziel liegt in einem ANDEREN Netz?',
    options: [
      { id: 'A', text: '192.168.5.200' },
      { id: 'B', text: '192.168.4.10' },
      { id: 'C', text: '192.168.5.50' },
      { id: 'D', text: '192.168.5.1' },
    ],
    correctId: 'B',
  },
  {
    id: 'm6',
    text: 'In welchem OSI-Layer arbeiten Switches hauptsächlich?',
    options: [
      { id: 'A', text: 'Layer 1 – Bitübertragungsschicht' },
      { id: 'B', text: 'Layer 2 – Sicherungsschicht' },
      { id: 'C', text: 'Layer 3 – Vermittlungsschicht' },
      { id: 'D', text: 'Layer 4 – Transportschicht' },
    ],
    correctId: 'B',
  },
  {
    id: 'm7',
    text: 'Wozu dient die Default Route (Standardroute) in einer Routing-Tabelle?',
    options: [
      { id: 'A', text: 'Sie bestimmt die interne IP-Adresse des PCs.' },
      { id: 'B', text: 'Sie gibt an, wohin Pakete für unbekannte Ziele gesendet werden.' },
      { id: 'C', text: 'Sie legt das WLAN-Passwort fest.' },
      { id: 'D', text: 'Sie steuert die Bildschirmauflösung.' },
    ],
    correctId: 'B',
  },
  {
    id: 'm8',
    text: 'Welche Aussage trifft auf VLANs (Virtual LANs) zu?',
    options: [
      { id: 'A', text: 'VLANs existieren nur im Internet.' },
      { id: 'B', text: 'VLANs trennen logische Netze auf einem physikalischen Switch.' },
      { id: 'C', text: 'VLANs ersetzen IP-Adressen.' },
      { id: 'D', text: 'VLANs funktionieren nur mit WLAN.' },
    ],
    correctId: 'B',
  },
  {
    id: 'm9',
    text: 'Welche Protokoll-Kombination gehört typischerweise zu Webzugriffen?',
    options: [
      { id: 'A', text: 'HTTP über TCP Port 80' },
      { id: 'B', text: 'HTTP über UDP Port 53' },
      { id: 'C', text: 'DNS über TCP Port 443' },
      { id: 'D', text: 'FTP über UDP Port 25' },
    ],
    correctId: 'A',
  },
  {
    id: 'm10',
    text: 'Welches Tool wird unter Windows typischerweise zur Anzeige der aktuellen IP-Konfiguration verwendet?',
    options: [
      { id: 'A', text: 'ping' },
      { id: 'B', text: 'ipconfig' },
      { id: 'C', text: 'tracert' },
      { id: 'D', text: 'format' },
    ],
    correctId: 'B',
  },
]

export const hardNetworkQuestions: QuizQuestion[] = [
  {
    id: 'h1',
    text: 'Wie viele nutzbare Hostadressen bietet ein Netz mit der Maske /26?',
    options: [
      { id: 'A', text: '32' },
      { id: 'B', text: '62' },
      { id: 'C', text: '64' },
      { id: 'D', text: '128' },
    ],
    correctId: 'B',
  },
  {
    id: 'h2',
    text: 'Welche Subnetzmaske gehört zu einem /27-Netz?',
    options: [
      { id: 'A', text: '255.255.255.224' },
      { id: 'B', text: '255.255.255.192' },
      { id: 'C', text: '255.255.255.240' },
      { id: 'D', text: '255.255.255.248' },
    ],
    correctId: 'A',
  },
  {
    id: 'h3',
    text: 'Ein Netz 172.16.0.0/16 wird in /24-Subnetze aufgeteilt. Wie viele /24-Netze entstehen?',
    options: [
      { id: 'A', text: '16' },
      { id: 'B', text: '64' },
      { id: 'C', text: '128' },
      { id: 'D', text: '256' },
    ],
    correctId: 'D',
  },
  {
    id: 'h4',
    text: 'Welches Protokoll wird verwendet, um MAC-Tabellen auf Switches anzugreifen (z.B. MAC-Flooding)?',
    options: [
      { id: 'A', text: 'Es basiert auf vielen gefälschten Ethernet-Frames.' },
      { id: 'B', text: 'Es basiert auf ICMP-Echo-Requests.' },
      { id: 'C', text: 'Es basiert auf SSH-Verbindungen.' },
      { id: 'D', text: 'Es basiert auf TLS-Zertifikaten.' },
    ],
    correctId: 'A',
  },
  {
    id: 'h5',
    text: 'Welcher Routing-Typ aktualisiert seine Nachbarn typischerweise im Abstand von 30 Sekunden mit der kompletten Routing-Tabelle?',
    options: [
      { id: 'A', text: 'Link-State-Routing' },
      { id: 'B', text: 'Distance-Vector-Routing (z.B. RIP)' },
      { id: 'C', text: 'Policy-Based-Routing' },
      { id: 'D', text: 'Source-Routing' },
    ],
    correctId: 'B',
  },
  {
    id: 'h6',
    text: 'Was ist der Zweck von NAT (Network Address Translation)?',
    options: [
      { id: 'A', text: 'Verschlüsselung aller IP-Pakete' },
      { id: 'B', text: 'Übersetzung privater in öffentliche IP-Adressen' },
      { id: 'C', text: 'Aufbau eines VPN-Tunnels' },
      { id: 'D', text: 'Filterung von HTTP-Inhalten' },
    ],
    correctId: 'B',
  },
  {
    id: 'h7',
    text: 'Ein Traceroute zeigt an, an welchem Hop ein Paket verloren geht. Welches Protokoll wird dafür typischerweise verwendet?',
    options: [
      { id: 'A', text: 'ICMP' },
      { id: 'B', text: 'DHCP' },
      { id: 'C', text: 'SMTP' },
      { id: 'D', text: 'SNMP' },
    ],
    correctId: 'A',
  },
  {
    id: 'h8',
    text: 'Welches Kommando zeigt unter Linux die aktuelle Routing-Tabelle an?',
    options: [
      { id: 'A', text: 'ip a' },
      { id: 'B', text: 'ip route' },
      { id: 'C', text: 'netstat -tulpen' },
      { id: 'D', text: 'ping -r' },
    ],
    correctId: 'B',
  },
  {
    id: 'h9',
    text: 'Was beschreibt der Begriff "MTU" in einem Netzwerk?',
    options: [
      { id: 'A', text: 'Maximale Anzahl an Verbindungen eines Switches' },
      { id: 'B', text: 'Maximale Übertragungsrate eines Links' },
      { id: 'C', text: 'Maximal mögliche Größe eines einzelnen Frames/Packets' },
      { id: 'D', text: 'Minimale Latenz im Netzwerk' },
    ],
    correctId: 'C',
  },
  {
    id: 'h10',
    text: 'Welche Aussage zu IPv6 ist korrekt?',
    options: [
      { id: 'A', text: 'IPv6 verwendet nur noch Broadcast-Adressen.' },
      { id: 'B', text: 'IPv6-Adressen sind 64 Bit lang.' },
      { id: 'C', text: 'IPv6 kennt kein NAT im klassischen Sinne.' },
      { id: 'D', text: 'IPv6 nutzt die gleiche Adresslänge wie IPv4.' },
    ],
    correctId: 'C',
  },
]
