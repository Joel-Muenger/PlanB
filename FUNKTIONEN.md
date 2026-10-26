# Plan B – Funktionsübersicht

Plan B zeigt bei ÖV-Störungen in der Region Bern passende Alternativen und leitet zu den Anbietern weiter. Fachhochschul-Prototyp: keine Buchungen, Zahlungen oder Konten; Preise, Zeiten und Velozahlen sind Demo-Daten.

**Online:** <https://joel-muenger.github.io/PlanB/>

## Startseite – Route prüfen

- Start- und Zielort eingeben (vorausgefüllt: Bern Bahnhof → Wankdorf Bahnhof)
- **„Standort“-Button:** ermittelt die Geräteposition und setzt die nächste ÖV-Haltestelle als Startort ein (Live über transport.opendata.ch)
- Störung simulieren: „Zug fällt aus“, „Tram verspätet sich“, „Streckensperrung“

## Resultatseite – Alternativen vergleichen

- Vier Alternativen: Alternativzug, Taxi (Bären Taxi), PubliBike, Mobility Carsharing
- Pro Option: Reisezeit, Kosten, Nachhaltigkeitswert (x/10) und Button **„Zum Anbieter“**
- Sortierung nach **schnellste**, **günstigste** oder **nachhaltigste** Option; die beste ist als „Beste Wahl“ markiert
- Karte (OpenStreetMap) mit Strecke bzw. eigenem Standort
- Störungsmeldung und Routenübersicht (Start → Ziel)

## Stationssuche – PubliBike

Erreichbar über die Lupe auf der PubliBike-Karte.

- Übersicht: aktive Stationen, verfügbare E-Bikes und mechanische Velos
- Suche nach Stationsname oder Adresse
- Filter: Alle, nur E-Bikes, nur mechanische Velos, nur verfügbare
- Liste sortiert nach Distanz (ab eigenem Standort oder Bern Bahnhof)
- Karte mit farbigen Markern nach Verfügbarkeit (gut, wenige, keine, ausser Betrieb), Legende und Detail-Popup
- Auf dem Handy Umschalter Liste/Karte, am Computer beides nebeneinander

## Darstellung

- Eigenes Design in Wine Red und Light Sand mit Plan-B-Logo
- **Umschalter Web/Handy:** zeigt die App auf dem Computer in einem iPhone-Rahmen
- Responsive für Handy, Tablet und Computer
- Installierbar als App auf dem Homescreen (PWA)

## Technik in Kürze

- React, TypeScript, Tailwind, Leaflet; läuft komplett im Browser, ohne eigenen Server
- Hosting auf GitHub Pages; jeder Push auf `main` wird automatisch geprüft (Typecheck, Tests, Lint) und veröffentlicht
- Datenquellen: Demo-Daten im Projekt, Haltestellen live von transport.opendata.ch

## Noch nicht enthalten

- Echte Fahrplan- und Störungsdaten, echte Velo-Verfügbarkeit
- Start, Ziel und Störungstyp beeinflussen die vorgeschlagenen Alternativen noch nicht
- Buchung, Bezahlung, Login
