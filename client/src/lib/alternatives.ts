import type { Alternative, BikeStation, Coordinates, DisruptionType, SortMode } from '../types';
import type { ProviderStatus } from '@plan-b/shared';
import { distanceMeters } from './stations';

/** Velostationen in diesem Umkreis zählen zur Kapazität von PubliBike. */
export const BIKE_RADIUS_METERS = 1000;

export const statusLabels: Record<ProviderStatus, string> = {
  available: 'Verfügbar',
  limited: 'Eingeschränkt',
  unavailable: 'Nicht verfügbar',
};

const occupancyLabels = { low: 'niedrig', medium: 'mittel', high: 'hoch' } as const;

const vehicleNouns: Record<Alternative['category'], [string, string]> = {
  taxi: ['Taxi', 'Taxis'],
  bike: ['Velo', 'Velos'],
  car: ['Auto', 'Autos'],
  train: ['Zug', 'Züge'],
};

/** Kurztext zur Kapazität, z. B. „3 Taxis frei · Wartezeit ca. 12 Min.“ */
export function capacityText(alternative: Alternative): string | undefined {
  const c = alternative.capacity;
  if (!c) return undefined;
  if (c.kind === 'occupancy') return `Auslastung ${occupancyLabels[c.level]}`;
  const [one, many] = vehicleNouns[alternative.category];
  const parts = [`${c.available} ${c.available === 1 ? one : many} frei`];
  if (c.stations !== undefined) {
    parts[0] += ` an ${c.stations} ${c.stations === 1 ? 'Station' : 'Stationen'} in der Nähe`;
  } else if (alternative.category === 'car') {
    parts[0] += ' in der Nähe';
  }
  if (c.waitMinutes !== undefined) parts.push(`Wartezeit ca. ${c.waitMinutes} Min.`);
  return parts.join(' · ');
}

const compare: Record<SortMode, (a: Alternative, b: Alternative) => number> = {
  fastest: (a, b) => a.travelTime - b.travelTime,
  cheapest: (a, b) => a.price - b.price,
  sustainable: (a, b) => b.sustainabilityScore - a.sustainabilityScore,
};

/** Summiert freie Velos der Stationen im Umkreis des Startorts. */
export function bikeCapacityNear(
  stations: BikeStation[],
  origin: Coordinates,
  radius = BIKE_RADIUS_METERS,
): { available: number; stations: number } {
  const near = stations.filter((s) => s.isRenting && distanceMeters(origin, s) <= radius);
  return {
    available: near.reduce((n, s) => n + s.ebikes + s.bikes, 0),
    stations: near.length,
  };
}

/**
 * Leitet den angezeigten Status ab: Störungsspezifischer Status vor Grundstatus,
 * und ohne freie Fahrzeuge ist ein Angebot nie verfügbar. So widersprechen sich
 * Status und Kapazität nie.
 */
export function resolveStatus(alternative: Alternative, disruption?: DisruptionType): Alternative {
  const override = disruption ? alternative.statusByDisruption?.[disruption] : undefined;
  const resolved: Alternative = override ? { ...alternative, ...override } : alternative;
  if (resolved.capacity?.kind === 'vehicles' && resolved.capacity.available === 0) {
    return { ...resolved, status: 'unavailable', statusNote: 'Keine Fahrzeuge frei' };
  }
  return resolved;
}

/** Sortiert nach gewähltem Kriterium; nicht verfügbare Angebote immer ans Ende. */
export function sortAlternatives(alternatives: Alternative[], mode: SortMode): Alternative[] {
  return [...alternatives].sort((a, b) => {
    const blocked = Number(a.status === 'unavailable') - Number(b.status === 'unavailable');
    return blocked || compare[mode](a, b);
  });
}

/** „Beste Wahl“ ist das erste Angebot, das genutzt werden kann. */
export function pickBest(sorted: Alternative[]): string | undefined {
  return sorted.find((a) => a.status !== 'unavailable')?.id;
}
