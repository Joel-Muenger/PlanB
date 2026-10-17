# Plan B – Mobilitäts-MVP für Bern

Plan B bündelt bei ÖV-Störungen exemplarische Mobilitätsalternativen für Pendlerinnen, Pendler und Reisende in der Region Bern. Es ist ein Fachhochschul-MVP: Die App vergleicht Optionen und verlinkt weiter, führt aber weder Buchungen, Zahlungen noch Konten.

## Funktionen

- Eingabe von Start und Ziel, inklusive simulierten Störungstypen
- Alternativzug, Taxi, PubliBike und Carsharing aus lokalen Mock-Daten
- Sortierung nach schnellster, günstigster oder nachhaltigster Option
- Anbieter-Links als externe Weiterleitung
- Responsive, mobile-first Oberfläche in Wine Red und Light Sand, mit Web-/iPhone-Ansicht
- OpenStreetMap/Leaflet-Karte mit Mock-Route in Bern
- „Standort“-Button: ermittelt die nächste ÖV-Haltestelle zur Geräteposition (via transport.opendata.ch)
- Installierbar als Progressive Web App (Homescreen-Icon, Vollbild)

## Voraussetzungen

- Node.js 20 oder neuer
- npm 10 oder neuer

## Installation und Start

```bash
npm install
npm run dev
```

Danach ist die App unter `http://localhost:5173` erreichbar. Es gibt keinen eigenen Server: Die Mock-Daten sind im Frontend eingebaut, Haltestellen kommen direkt von transport.opendata.ch.

Qualitätsprüfungen:

```bash
npm run typecheck
npm run lint
npm run format:check   # bzw. npm run format zum Formatieren
```

Die PWA-Funktionen (Service Worker, Installation) sind nur im Produktionsbuild aktiv. Zum Testen:

```bash
npm run build
npm start            # vite preview, http://localhost:4173
```

## Veröffentlichung auf GitHub Pages

Der Workflow `.github/workflows/deploy.yml` prüft (Typecheck, Lint), baut und veröffentlicht die App bei jedem Push auf `main` unter `https://<name>.github.io/<repo>/`. Einmalig im Repository unter **Settings → Pages → Source** „GitHub Actions“ wählen.

- Der Basispfad kommt aus der Umgebungsvariable `BASE_PATH` (Standard `/`).
- GitHub Pages kennt keine SPA-Routen; deshalb wird `index.html` als `404.html` mitkopiert, damit `/alternativen` auch beim Neuladen funktioniert.

## Projektstruktur

```text
plan-b/
├── client/                    # React + TypeScript + Tailwind + Vite
│   └── src/
│       ├── components/        # Wiederverwendbare UI-Elemente
│       ├── pages/             # Start- und Resultatseite
│       ├── data/              # alternatives.json (Mock-Daten)
│       ├── lib/api.ts         # Datenzugriff (Mock-Daten, transport.opendata.ch)
│       ├── types.ts           # Client-Typen (re-exportiert shared)
│       └── App.tsx            # Client-Routing
├── shared/                    # @plan-b/shared: gemeinsame Typen und Konstanten
│   └── src/index.ts
└── package.json               # Workspaces und gemeinsame Befehle
```

## Architekturübersicht

```text
React UI → lib/api.ts → data/alternatives.json
                   └→ transport.opendata.ch (Haltestellen in der Nähe)
    │
    └── React Router: / und /alternativen
```

Die Startseite übergibt die Routen- und Störungsdaten über React Router an die Resultatseite. Diese holt die Optionen über `getAlternatives()` aus `lib/api.ts`. Die Funktionen sind `async`, damit sie später durch echte SBB-, Sharing- oder Routing-APIs ersetzt werden können. Braucht eine Quelle einen geheimen API-Key, ist dafür wieder ein Server nötig (z. B. eine Serverless-Funktion).

## Daten

Das Objekt `Alternative` enthält `id`, `name`, `category`, `travelTime`, `price`, `sustainabilityScore` und `providerUrl`.

## Hinweis zu den Daten

Reisezeiten, Preise, Störungen und die Karte sind bewusst Mock-Daten. Die Leaflet-Karte verwendet Kartenkacheln von OpenStreetMap; die dargestellte Linie ist keine Live-Routenberechnung.
