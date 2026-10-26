# Plan B – Funktionsübersicht

Plan B zeigt bei ÖV-Störungen in der Region Bern passende Alternativen und leitet zu den Anbietern weiter. Fachhochschul-Prototyp: keine Buchungen, Zahlungen oder Konten; Preise, Zeiten und Velozahlen sind Demo-Daten.

**Online:** <https://joel-muenger.github.io/PlanB/>

## Startseite – Route prüfen

- Start- und Zielort eingeben (vorausgefüllt: Bern Bahnhof → Wankdorf Bahnhof)
- **„Standort“-Button:** ermittelt die Geräteposition und setzt die nächste ÖV-Haltestelle als Startort ein (Live über transport.opendata.ch)
- Störung simulieren: „Zug fällt aus“, „Tram verspätet sich“, „Streckensperrung“

## Resultatseite – Alternativen vergleichen

- Vier Alternativen: Alternativzug, Bären Taxi, PubliBike, Mobility Carsharing
- Pro Option: Reisezeit, Kosten, Nachhaltigkeitswert (x/10) und Button **„Zum Anbieter“**
- **Anbieterstatus:** verfügbar / eingeschränkt / nicht verfügbar, mit Hinweis (z. B. „Hohe Nachfrage wegen Störung“); hängt auch von der gewählten Störung ab
- **Kapazität:** freie Taxis mit Wartezeit, freie Velos an Stationen in der Nähe (aus denselben Daten wie die Stationssuche), Autos in der Nähe, Zugauslastung; ohne freie Fahrzeuge gilt ein Angebot als nicht verfügbar
- Sortierung nach **schnellste**, **günstigste** oder **nachhaltigste** Option; nicht verfügbare Angebote stehen immer am Ende, „Beste Wahl“ ist die beste nutzbare Option
- **Nächste Verbindungen live:** echte Abfahrten Start → Ziel mit Linie, Gleis, Umstiegen und Verspätung (transport.opendata.ch)
- **Echter Billettpreis:** Einzelbillett 2. und 1. Klasse (Vollpreis), inkl. Libero-Verbund für Bernmobil (OJP Fare/NOVA, Beta, unverbindlich; über einen eigenen Preisproxy)
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

- React, TypeScript, Tailwind, Leaflet; läuft im Browser, nur für Preise gibt es einen kleinen Cloudflare-Worker, der den API-Key geheim hält
- Hosting auf GitHub Pages; jeder Push auf `main` wird automatisch geprüft (Typecheck, Tests, Lint) und veröffentlicht
- Datenquellen: Demo-Daten im Projekt; Haltestellen und Verbindungen mit Verspätung live von transport.opendata.ch

## Noch nicht enthalten

- Echte Störungsmeldungen (SIRI-SX, braucht API-Key und Server), echte Velo-Verfügbarkeit
- Anbieterportal, in dem Anbieter wie Bären Taxi ihren Status selbst melden
- Start und Ziel beeinflussen die vorgeschlagenen Alternativen noch nicht (der Störungstyp nur den Anbieterstatus)
- Buchung, Bezahlung, Login
