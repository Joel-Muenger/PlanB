# CLAUDE.md

Plan B ist ein Fachhochschul-MVP: Bei ÖV-Störungen in der Region Bern zeigt die App Mobilitätsalternativen (Zug, Taxi, PubliBike, Carsharing) und verlinkt zu externen Anbietern. Keine Buchungen, Zahlungen oder Konten. Alle Daten sind Mock-Daten.

## Befehle

Alle Befehle im Projekt-Root ausführen (npm Workspaces `shared`, `client`):

```bash
npm install                 # Abhängigkeiten für alle Workspaces
npm run dev                 # baut shared, dann shared (tsc --watch) + Vite (:5173) parallel
npm run build               # shared → client/dist (BASE_PATH=/repo/ für GitHub Pages)
npm start                   # vite preview des Builds (:4173)
npm run typecheck           # baut shared, dann tsc --noEmit für client
npm test                    # Vitest (client/src/**/*.test.ts)
npm run lint                # ESLint (flat config, typescript-eslint, react-hooks)
npm run format              # Prettier (format:check zum reinen Prüfen)
```

Nach Änderungen immer `npm run typecheck`, `npm test`, `npm run lint` und `npm run format:check` ausführen. Logik in `client/src/lib/` bekommt Vitest-Tests.

## Architektur

```
React (client/src) → lib/api.ts → data/alternatives.json
                              └→ transport.opendata.ch (direkt aus dem Browser, CORS erlaubt)
```

Es gibt **keinen eigenen Server**; die App ist rein statisch und wird über GitHub Pages veröffentlicht (`.github/workflows/deploy.yml`, bei Push auf `main`). Der Basispfad kommt aus `BASE_PATH` (Vite `base`, Router `basename`, Asset-Pfade über `import.meta.env.BASE_URL`). `index.html` wird als `404.html` kopiert, damit SPA-Routen beim Neuladen funktionieren. Geheime API-Keys gehören deshalb nie ins Frontend; dafür bräuchte es wieder eine Serverfunktion.

Die App ist eine **PWA** (vite-plugin-pwa, `registerType: 'autoUpdate'`): Manifest und Service Worker werden nur im Produktionsbuild erzeugt, also mit `npm run build` und `npx vite preview` im client testen. Die Icons in `client/public` werden aus `client/public/logo.svg` erzeugt: `npm run generate-pwa-assets -w client`.

- **client/**: React 18, TypeScript (strict), Vite 6, Tailwind 3, React Router 7, react-leaflet 4, lucide-react.
  - `pages/HomePage.tsx` – Formular (Start, Ziel, simulierte Störung), navigiert mit `navigate('/alternativen', { state })`. Der Button „Standort“ im Startfeld ermittelt die Geräteposition und setzt die nächste ÖV-Haltestelle ein (`lib/location.ts`).
  - `pages/ResultsPage.tsx` – liest den Router-State, holt die Optionen über `getAlternatives()` aus `lib/api.ts`, sortiert clientseitig (schnellste/günstigste/nachhaltigste).
  - `components/` – `Layout`, `LocationInput`, `DisruptionSelect`, `AlternativeCard`, `RouteMap` (echte Position, falls geortet, sonst fest kodierte Mock-Route; OSM-Kacheln), `ViewModeToggle` und `PhonePreview` (Web-/iPhone-Ansicht; die App läuft dafür in einem iframe, `lib/viewMode.ts`).
  - `pages/StationsPage.tsx` (`/stationen`) – PubliBike-Stationen: Suche (Name/Adresse), Filter E-Bikes/mech. Velos/nur verfügbare, Liste nach Distanz ab Startort (sonst Bern Bahnhof), Karte `components/StationMap.tsx` mit Markern nach Verfügbarkeit. Einstieg über die Lupe auf der Velo-Karte. Demo-Daten in `data/bikeStations.json` (Typ `BikeStation`, GBFS-nah); Logik in `lib/stations.ts`.
  - `lib/api.ts` – `getBikeStations()`, `getAlternatives()` (Mock-Daten aus `data/alternatives.json`) und `findNearbyStops()` (transport.opendata.ch; bis zu 5 Haltestellen). Achtung: transport.opendata.ch verwendet `x` = Breite, `y` = Länge; Einträge ohne `id` sind Adressen und werden verworfen.
- **shared/** (`@plan-b/shared`): einzige Quelle für API-Typen (`Alternative`, `AlternativeCategory`, `DisruptionType`, `AlternativesResponse`) und Konstanten (`DISRUPTION_TYPES`, `isDisruptionType`). Wird mit `tsc` nach `shared/dist` gebaut; `exports` zeigt auf `dist`. Der Client importiert aus `@plan-b/shared`. Nach einem frischen Clone ohne `npm run dev`/`build`/`typecheck` fehlen deshalb die Typen, bis `npm run build -w shared` gelaufen ist.
  - `client/src/types.ts` re-exportiert die geteilten Typen und enthält nur Client-eigene Typen (`SortMode`, `RouteRequest`).

## Bekannte Einschränkungen

- Start/Ziel und Störungstyp beeinflussen die Ergebnisse noch nicht. Ohne Ortung zeigt die Karte eine Mock-Route; mit Ortung nur die eigene Position (das Ziel hat noch keine Koordinaten).
- Geolocation funktioniert nur über HTTPS oder `localhost`. Auf dem Handy deshalb die GitHub-Pages-Version testen.
- Der Zustand der Resultatseite geht beim Neuladen verloren (Router-State statt URL-Parameter).
- `npm audit` meldet Schwachstellen in Build-Abhängigkeiten von Tailwind 3 (braces, micromatch, postcss-selector-parser). Behebung nur über Upgrade auf Tailwind 4.

## Konventionen

- UI-Texte auf Deutsch (Schweiz): „Velo“, „ÖV“, Preise als „CHF …“, kein „ß“.
- Formatierung durch Prettier (`singleQuote`, `printWidth: 100`), nicht manuell.
- Styling ausschliesslich mit Tailwind. Projektfarben aus `client/tailwind.config.js` verwenden: `ink` (#102A43), `sky` (#E8F5FF), `brand` (#1677C8), `wine` (#7F011F), `sand` (#F5EBD0), Schatten `shadow-card`.
- Mobile-first, responsive Layouts (Breakpoints `sm`, `lg`). Eingabefelder auf Mobilgeräten mindestens `text-base` (16px), sonst zoomt iOS beim Fokussieren. Safe-Area-Insets werden in `Layout` berücksichtigt.
- Funktionskomponenten mit Default-Export, eine Komponente pro Datei.
- Externe Links mit `target="_blank" rel="noreferrer"`.
- Zeilenenden LF (über `.gitattributes` erzwungen).
