# CLAUDE.md

Plan B ist ein Fachhochschul-MVP: Bei ÖV-Störungen in der Region Bern zeigt die App Mobilitätsalternativen (Zug, Taxi, PubliBike, Carsharing) und verlinkt zu externen Anbietern. Keine Buchungen, Zahlungen oder Konten. Alle Daten sind Mock-Daten.

## Befehle

Alle Befehle im Projekt-Root ausführen (npm Workspaces `shared`, `client`, `server`):

```bash
npm install                 # Abhängigkeiten für alle Workspaces
npm run dev                 # baut shared, dann shared (tsc --watch) + Express (:3001) + Vite (:5173) parallel
npm run build               # shared → server/dist → client/dist
npm start                   # nur node server/dist/index.js (liefert client/dist derzeit NICHT aus)
npm run typecheck           # baut shared, dann tsc --noEmit für server und client
npm run lint                # ESLint (flat config, typescript-eslint, react-hooks)
npm run format              # Prettier (format:check zum reinen Prüfen)
```

Nach Änderungen immer `npm run typecheck`, `npm run lint` und `npm run format:check` ausführen. Tests gibt es noch nicht.

## Architektur

```
React (client/src) → fetch('/api/...') → Vite-Proxy → Express (server/src/index.ts) → server/data/alternatives.json
```

- **client/**: React 18, TypeScript (strict), Vite 6, Tailwind 3, React Router 7, react-leaflet 4, lucide-react.
  - `pages/HomePage.tsx` – Formular (Start, Ziel, simulierte Störung), navigiert mit `navigate('/alternativen', { state })`.
  - `pages/ResultsPage.tsx` – liest den Router-State, ruft `GET /api/alternatives` auf, sortiert clientseitig (schnellste/günstigste/nachhaltigste).
  - `components/` – `Layout`, `LocationInput`, `DisruptionSelect`, `AlternativeCard`, `RouteMap` (fest kodierte Mock-Route in Bern, OSM-Kacheln).
- **server/**: Express 4, ESM (`"type": "module"`, `NodeNext`). Relative Imports brauchen deshalb die Endung `.js` (z. B. `./routes.js`). JSON-Import mit `with { type: 'json' }`.
  - `GET /api/health`, `GET /api/alternatives?disruption=<DisruptionType>`.
- **shared/** (`@plan-b/shared`): einzige Quelle für API-Typen (`Alternative`, `AlternativeCategory`, `DisruptionType`, `AlternativesResponse`) und Konstanten (`DISRUPTION_TYPES`, `isDisruptionType`). Wird mit `tsc` nach `shared/dist` gebaut; `exports` zeigt auf `dist`. Client und Server importieren aus `@plan-b/shared`. Nach einem frischen Clone ohne `npm run dev`/`build`/`typecheck` fehlen deshalb die Typen, bis `npm run build -w shared` gelaufen ist.
  - `client/src/types.ts` re-exportiert die geteilten Typen und enthält nur Client-eigene Typen (`SortMode`, `RouteRequest`).

## Bekannte Einschränkungen

- Start/Ziel und Störungstyp beeinflussen die Ergebnisse noch nicht, die Karte zeigt immer dieselbe Route.
- Der Zustand der Resultatseite geht beim Neuladen verloren (Router-State statt URL-Parameter).
- `npm audit` meldet Schwachstellen in Build-Abhängigkeiten von Tailwind 3 (braces, micromatch, postcss-selector-parser). Behebung nur über Upgrade auf Tailwind 4.

## Konventionen

- UI-Texte auf Deutsch (Schweiz): „Velo“, „ÖV“, Preise als „CHF …“, kein „ß“.
- Formatierung durch Prettier (`singleQuote`, `printWidth: 100`), nicht manuell.
- Styling ausschliesslich mit Tailwind. Projektfarben aus `client/tailwind.config.js` verwenden: `ink` (#102A43), `sky` (#E8F5FF), `brand` (#1677C8), Schatten `shadow-card`.
- Mobile-first, responsive Layouts (Breakpoints `sm`, `lg`).
- Funktionskomponenten mit Default-Export, eine Komponente pro Datei.
- Externe Links mit `target="_blank" rel="noreferrer"`.
- Zeilenenden LF (über `.gitattributes` erzwungen).
