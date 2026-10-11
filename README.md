# Plan B – Mobilitäts-MVP für Bern

Plan B bündelt bei ÖV-Störungen exemplarische Mobilitätsalternativen für Pendlerinnen, Pendler und Reisende in der Region Bern. Es ist ein Fachhochschul-MVP: Die App vergleicht Optionen und verlinkt weiter, führt aber weder Buchungen, Zahlungen noch Konten.

## Funktionen

- Eingabe von Start und Ziel, inklusive simulierten Störungstypen
- Alternativzug, Taxi, PubliBike und Carsharing aus lokalen Mock-Daten
- Sortierung nach schnellster, günstigster oder nachhaltigster Option
- Anbieter-Links als externe Weiterleitung
- Responsive, mobile-first Oberfläche in Weiss, Dunkelblau und Hellblau
- OpenStreetMap/Leaflet-Karte mit Mock-Route in Bern

## Voraussetzungen

- Node.js 20 oder neuer
- npm 10 oder neuer

## Installation und Start

```bash
npm install
npm run dev
```

Danach ist die Oberfläche unter `http://localhost:5173` erreichbar. Die Express-API läuft auf `http://localhost:3001`.

Für einen Produktionsbuild:

```bash
npm run build
npm start
```

## Projektstruktur

```text
plan-b/
├── client/                    # React + TypeScript + Tailwind + Vite
│   └── src/
│       ├── components/        # Wiederverwendbare UI-Elemente
│       ├── pages/             # Start- und Resultatseite
│       ├── types.ts           # Gemeinsame Frontend-Typen
│       └── App.tsx            # Client-Routing
├── server/                    # Node.js + Express + TypeScript
│   ├── data/alternatives.json # Lokale Mock-Daten
│   └── src/index.ts           # REST-API
└── package.json               # Workspaces und gemeinsame Befehle
```

## Architekturübersicht

```text
React UI → Vite-Proxy (/api) → Express API → alternatives.json
    │
    └── React Router: / und /alternativen
```

Die Startseite übergibt die Routen- und Störungsdaten über React Router an die Resultatseite. Diese ruft `GET /api/alternatives` auf. Das Backend liefert vorerst statische JSON-Daten und kann später durch SBB-, Sharing- oder Routing-APIs ersetzt werden.

## API

- `GET /api/health` – einfacher Statuscheck
- `GET /api/alternatives?disruption=Zug%20fällt%20aus` – Störung und Optionen

Das Objekt `Alternative` enthält `id`, `name`, `category`, `travelTime`, `price`, `sustainabilityScore` und `providerUrl`.

## Hinweis zu den Daten

Reisezeiten, Preise, Störungen und die Karte sind bewusst Mock-Daten. Die Leaflet-Karte verwendet Kartenkacheln von OpenStreetMap; die dargestellte Linie ist keine Live-Routenberechnung.
