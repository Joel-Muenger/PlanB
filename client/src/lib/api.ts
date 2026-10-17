import {
  DISRUPTION_TYPES,
  isDisruptionType,
  type Alternative,
  type AlternativesResponse,
  type NearbyStop,
} from '@plan-b/shared';
import alternatives from '../data/alternatives.json';

/**
 * Datenzugriff der App. Läuft vollständig im Browser, damit die App ohne eigenen
 * Server (z. B. auf GitHub Pages) funktioniert. Die Funktionen sind async, damit
 * eine spätere echte API die Signaturen nicht ändern muss.
 */

export async function getAlternatives(disruption: unknown): Promise<AlternativesResponse> {
  return {
    disruption: isDisruptionType(disruption) ? disruption : DISRUPTION_TYPES[0],
    alternatives: alternatives as Alternative[],
  };
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
