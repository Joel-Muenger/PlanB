export const DISRUPTION_TYPES = [
  'Zug fällt aus',
  'Tram verspätet sich',
  'Streckensperrung',
] as const;
export type DisruptionType = (typeof DISRUPTION_TYPES)[number];

export type AlternativeCategory = 'train' | 'taxi' | 'bike' | 'car';

/** Betriebsstatus eines Anbieters. Wird später von einem Anbieterportal gepflegt. */
export type ProviderStatus = 'available' | 'limited' | 'unavailable';

export interface StatusInfo {
  status: ProviderStatus;
  /** Kurzer Hinweis für Nutzende, z. B. „Hohe Nachfrage, Wartezeit ca. 12 Min.“ */
  statusNote?: string;
}

/**
 * Kapazität eines Angebots: freie Fahrzeuge (Taxi, Velo, Carsharing) oder
 * Auslastung (ÖV).
 */
export type Capacity =
  | {
      kind: 'vehicles';
      available: number;
      /** Wartezeit bis zur Abholung in Minuten (Taxi) */
      waitMinutes?: number;
      /** Anzahl Stationen, über die sich die Fahrzeuge verteilen (Velo) */
      stations?: number;
    }
  | { kind: 'occupancy'; level: 'low' | 'medium' | 'high' };

export interface Alternative extends StatusInfo {
  id: string;
  name: string;
  category: AlternativeCategory;
  travelTime: number;
  price: number;
  sustainabilityScore: number;
  providerUrl: string;
  capacity?: Capacity;
  /** ISO-Zeitpunkt der letzten Status-/Kapazitätsmeldung */
  updatedAt?: string;
  /** Abweichender Status je Störungstyp (Demo), z. B. Alternativzug bei Streckensperrung */
  statusByDisruption?: Partial<Record<DisruptionType, StatusInfo>>;
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
