# CLAUDE.md

Plan B ist ein Fachhochschul-MVP: Bei ÖV-Störungen in der Region Bern zeigt die App Mobilitätsalternativen (Zug, Taxi, PubliBike, Carsharing) und verlinkt zu externen Anbietern. Keine Buchungen, Zahlungen oder Konten. Alle Daten sind Mock-Daten.

## Befehle

Alle Befehle im Projekt-Root ausführen (npm Workspaces `client` und `server`):

```bash
npm install                 # Abhängigkeiten für beide Workspaces
npm run dev                 # Express (:3001, tsx watch) + Vite (:5173) parallel via concurrently
npm run build               # server: tsc → server/dist, client: tsc -b && vite build → client/dist
npm start                   # nur node server/dist/index.js (liefert client/dist derzeit NICHT aus)

# Typecheck ohne Build-Artefakte
npx tsc --noEmit -p server/tsconfig.json
npx tsc --noEmit -p client/tsconfig.app.json
```

Es gibt noch keine Tests, keinen Linter und keinen Formatter.

## Architektur

```
React (client/src) → fetch('/api/...') → Vite-Proxy → Express (server/src/index.ts) → server/data/alternatives.json
```

- **client/**: React 18, TypeScript (strict), Vite 6, Tailwind 3, React Router 7, react-leaflet 4, lucide-react.
  - `pages/HomePage.tsx` – Formular (Start, Ziel, simulierte Störung), navigiert mit `navigate('/alternativen', { state })`.
  - `pages/ResultsPage.tsx` – liest den Router-State, ruft `GET /api/alternatives` auf, sortiert clientseitig (schnellste/günstigste/nachhaltigste).
  - `components/` – `Layout`, `LocationInput`, `DisruptionSelect`, `AlternativeCard`, `RouteMap` (fest kodierte Mock-Route in Bern, OSM-Kacheln).
- **server/**: Express 4, ESM (`"type": "module"`, `NodeNext`). Relative Imports brauchen deshalb die Endung `.js` (z. B. `./types.js`). JSON-Import mit `with { type: 'json' }`.
  - `GET /api/health`, `GET /api/alternatives?disruption=<DisruptionType>`.
- **Typen** (`Alternative`, `AlternativeCategory`, `DisruptionType`) sind in `client/src/types.ts` und `server/src/types.ts` doppelt definiert. Bei Änderungen beide anpassen, ebenso die Störungsliste in `server/src/index.ts` und `client/src/components/DisruptionSelect.tsx`.

## Bekannte Einschränkungen

- Start/Ziel und Störungstyp beeinflussen die Ergebnisse noch nicht, die Karte zeigt immer dieselbe Route.
- `ResultsPage.tsx` enthält eine Kopie der Mock-Daten als Fallback, falls die API nicht erreichbar ist. Das verdeckt Backend-Fehler.
- Der Zustand der Resultatseite geht beim Neuladen verloren (Router-State statt URL-Parameter).
- `@types/express` ist v5, `express` ist v4.

## Konventionen

- UI-Texte auf Deutsch (Schweiz): „Velo“, „ÖV“, Preise als „CHF …“, kein „ß“.
- Styling ausschliesslich mit Tailwind. Projektfarben aus `client/tailwind.config.js` verwenden: `ink` (#102A43), `sky` (#E8F5FF), `brand` (#1677C8), Schatten `shadow-card`.
- Mobile-first, responsive Layouts (Breakpoints `sm`, `lg`).
- Funktionskomponenten mit Default-Export, eine Komponente pro Datei.
- Externe Links mit `target="_blank" rel="noreferrer"`.
- Zeilenenden LF (über `.gitattributes` erzwungen).
