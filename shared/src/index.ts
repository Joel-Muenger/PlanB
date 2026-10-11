export const DISRUPTION_TYPES = [
  'Zug fällt aus',
  'Tram verspätet sich',
  'Streckensperrung',
] as const;
export type DisruptionType = (typeof DISRUPTION_TYPES)[number];

export type AlternativeCategory = 'train' | 'taxi' | 'bike' | 'car';

export interface Alternative {
  id: string;
  name: string;
  category: AlternativeCategory;
  travelTime: number;
  price: number;
  sustainabilityScore: number;
  providerUrl: string;
}

export interface AlternativesResponse {
  disruption: DisruptionType;
  alternatives: Alternative[];
}

export function isDisruptionType(value: unknown): value is DisruptionType {
  return DISRUPTION_TYPES.includes(value as DisruptionType);
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface NearbyStop extends Coordinates {
  id: string;
  name: string;
  /** Distanz zur angefragten Position in Metern */
  distance: number;
}

export interface NearbyStopsResponse {
  stops: NearbyStop[];
}
