import type { BikeStation, Coordinates } from '../types';

/** Ab dieser Anzahl freier Velos gilt eine Station als gut verfügbar. */
export const LOW_STOCK_THRESHOLD = 3;

export type Availability = 'good' | 'low' | 'empty' | 'closed';

export const availabilityLabels: Record<Availability, string> = {
  good: 'Gut verfügbar',
  low: 'Wenige Velos',
  empty: 'Keine Velos',
  closed: 'Ausser Betrieb',
};

// Echte Farbwerte, weil Leaflet in SVG zeichnet (Tailwind-Klassen greifen dort nicht).
export const availabilityColors: Record<Availability, string> = {
  good: '#047857',
  low: '#D97706',
  empty: '#7F011F',
  closed: '#94A3B8',
};

export function stationAvailability(station: BikeStation): Availability {
  if (!station.isRenting) return 'closed';
  const total = station.ebikes + station.bikes;
  if (total === 0) return 'empty';
  return total < LOW_STOCK_THRESHOLD ? 'low' : 'good';
}

/** Luftlinie zwischen zwei Punkten in Metern (Haversine). */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export type BikeType = 'all' | 'ebike' | 'bike';

export interface StationFilter {
  query: string;
  type: BikeType;
  onlyAvailable: boolean;
}

/** Filtert nach Name/Adresse und Velotyp. „Nur verfügbare“ bezieht sich auf den gewählten Typ. */
export function filterStations(stations: BikeStation[], filter: StationFilter): BikeStation[] {
  const query = filter.query.trim().toLowerCase();
  return stations.filter((s) => {
    if (query && !`${s.name} ${s.address}`.toLowerCase().includes(query)) return false;
    const count =
      filter.type === 'ebike' ? s.ebikes : filter.type === 'bike' ? s.bikes : s.ebikes + s.bikes;
    if (filter.type !== 'all' && count === 0) return false;
    if (filter.onlyAvailable && (!s.isRenting || count === 0)) return false;
    return true;
  });
}

export interface StationWithDistance extends BikeStation {
  distance: number;
}

export function sortByDistance(stations: BikeStation[], from: Coordinates): StationWithDistance[] {
  return stations
    .map((s) => ({ ...s, distance: distanceMeters(from, s) }))
    .sort((a, b) => a.distance - b.distance);
}
