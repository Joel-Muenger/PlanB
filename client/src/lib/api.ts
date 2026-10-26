import {
  DISRUPTION_TYPES,
  isDisruptionType,
  type Alternative,
  type AlternativesResponse,
  type NearbyStop,
} from '@plan-b/shared';
import alternatives from '../data/alternatives.json';
import bikeStations from '../data/bikeStations.json';
import type { BikeStation, Coordinates } from '../types';
import { bikeCapacityNear, resolveStatus } from './alternatives';

/**
 * Datenzugriff der App. Läuft vollständig im Browser, damit die App ohne eigenen
 * Server (z. B. auf GitHub Pages) funktioniert. Die Funktionen sind async, damit
 * eine spätere echte API die Signaturen nicht ändern muss.
 */

/** Bezugspunkt, wenn der Startort nicht geortet wurde. */
export const BERN_BAHNHOF: Coordinates = { lat: 46.9486, lon: 7.4396 };

/**
 * Alternativen mit aktuellem Status und Kapazität. Die Velo-Kapazität kommt aus
 * denselben Stationsdaten wie die Stationssuche, damit beide Seiten übereinstimmen.
 */
export async function getAlternatives(
  disruption: unknown,
  origin: Coordinates = BERN_BAHNHOF,
): Promise<AlternativesResponse> {
  const resolvedDisruption = isDisruptionType(disruption) ? disruption : DISRUPTION_TYPES[0];
  const stations = await getBikeStations();
  const updatedAt = new Date().toISOString();
  return {
    disruption: resolvedDisruption,
    alternatives: (alternatives as Alternative[]).map((a) =>
      resolveStatus(
        {
          ...a,
          updatedAt,
          capacity:
            a.category === 'bike'
              ? { kind: 'vehicles', ...bikeCapacityNear(stations, origin) }
              : a.capacity,
        },
        resolvedDisruption,
      ),
    ),
  };
}

/** PubliBike-Stationen in Bern. Demo-Daten; Live-Quelle wäre der GBFS-Feed von sharedmobility.ch. */
export async function getBikeStations(): Promise<BikeStation[]> {
  return bikeStations as BikeStation[];
}

const OPENDATA_URL = 'https://transport.opendata.ch/v1/locations';

interface OpendataLocation {
  id: string | null;
  name: string | null;
  coordinate: { x: number | null; y: number | null } | null;
  distance: number | null;
}

/**
 * Sucht ÖV-Haltestellen in der Nähe über transport.opendata.ch (erlaubt CORS).
 * Achtung: Die API verwendet x für die Breite (lat) und y für die Länge (lon).
 */
export async function findNearbyStops(lat: number, lon: number, limit = 5): Promise<NearbyStop[]> {
  const url = `${OPENDATA_URL}?x=${lat}&y=${lon}&type=station`;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`transport.opendata.ch antwortete mit ${response.status}`);

  const data = (await response.json()) as { stations?: OpendataLocation[] };
  return (data.stations ?? [])
    .flatMap((s): NearbyStop[] =>
      // Einträge ohne id sind Adressen, keine Haltestellen.
      s.id && s.name && s.coordinate?.x != null && s.coordinate.y != null
        ? [
            {
              id: s.id,
              name: s.name,
              lat: s.coordinate.x,
              lon: s.coordinate.y,
              distance: Math.round(s.distance ?? 0),
            },
          ]
        : [],
    )
    .slice(0, limit);
}

export interface LiveConnection {
  /** Linien, z. B. ["S2"] oder ["IC 8", "S1"] */
  products: string[];
  departure: string;
  arrival: string;
  /** Verspätung bei Abfahrt in Minuten, null wenn keine Echtzeitdaten */
  delay: number | null;
  platform: string | null;
  transfers: number;
  /** Haltestellen-IDs (für die Preisabfrage) */
  fromId: string;
  toId: string;
}

interface OpendataConnection {
  products: string[];
  sections: { journey: { category: string; number: string } | null }[];
  transfers: number;
  from: {
    departure: string;
    delay: number | null;
    platform: string | null;
    station: { id: string };
  };
  to: { arrival: string; station: { id: string } };
}

// Kategorien von transport.opendata.ch, die ohne Bezeichnung nur als Nummer erscheinen.
const lineTypes: Record<string, string> = { B: 'Bus', T: 'Tram', BAT: 'Schiff', FUN: 'Bahn' };

/** Liniennamen wie „Bus 20“, „Tram 3“, „S3“, „IC 8“; Fussweg-Abschnitte fallen weg. */
export function lineNames(c: Pick<OpendataConnection, 'products' | 'sections'>): string[] {
  const names = c.sections.flatMap(({ journey }) =>
    journey
      ? [
          lineTypes[journey.category]
            ? `${lineTypes[journey.category]} ${journey.number}`
            : `${journey.category}${journey.number}`,
        ]
      : [],
  );
  return names.length > 0 ? names : c.products;
}

/** Nächste Verbindungen mit Echtzeit-Verspätung über transport.opendata.ch (ohne Key, CORS erlaubt). */
export async function getConnections(
  from: string,
  to: string,
  limit = 3,
): Promise<LiveConnection[]> {
  const params = new URLSearchParams({ from, to, limit: String(limit) });
  const response = await fetch(`https://transport.opendata.ch/v1/connections?${params}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`transport.opendata.ch antwortete mit ${response.status}`);
  const data = (await response.json()) as { connections?: OpendataConnection[] };
  return (data.connections ?? []).map((c) => ({
    products: lineNames(c),
    departure: c.from.departure,
    arrival: c.to.arrival,
    delay: c.from.delay,
    platform: c.from.platform,
    transfers: c.transfers,
    fromId: c.from.station.id,
    toId: c.to.station.id,
  }));
}

export interface FareSummary {
  price: number;
  currency: string;
  products: string[];
}

export interface Fares {
  full: FareSummary;
  halfFare: FareSummary;
}

/**
 * Echter Billettpreis (2. Klasse, Vollpreis und Halbtax) über den Preisproxy
 * (fare-proxy, OJP Fare/NOVA). Ohne konfigurierten Proxy oder bei Fehlern null –
 * die App zeigt dann keinen Preis statt eines falschen.
 */
export async function getFares(
  fromId: string,
  toId: string,
  departure: string,
): Promise<Fares | null> {
  const base = import.meta.env.VITE_FARE_API_URL;
  if (!base) return null;
  const params = new URLSearchParams({ from: fromId, to: toId, departure });
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/fare?${params}`, {
      signal: AbortSignal.timeout(10000),
    });
    return response.ok ? ((await response.json()) as Fares) : null;
  } catch {
    return null;
  }
}
