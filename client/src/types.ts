import type { Coordinates, DisruptionType } from '@plan-b/shared';

export type {
  Alternative,
  AlternativeCategory,
  AlternativesResponse,
  Coordinates,
  DisruptionType,
  NearbyStop,
} from '@plan-b/shared';

export type SortMode = 'fastest' | 'cheapest' | 'sustainable';

export interface RouteRequest {
  origin: string;
  destination: string;
  disruption: DisruptionType;
  /** Geräteposition, falls der Startort per Ortung bestimmt wurde */
  originPosition?: Coordinates;
}

/**
 * Velo-Station, angelehnt an GBFS (station_information + station_status von sharedmobility.ch),
 * damit Demo-Daten später durch den Live-Feed ersetzt werden können.
 */
export interface BikeStation extends Coordinates {
  id: string;
  name: string;
  address: string;
  /** Anzahl Stellplätze */
  capacity: number;
  /** Verfügbare E-Bikes */
  ebikes: number;
  /** Verfügbare mechanische Velos */
  bikes: number;
  /** false = Station ausser Betrieb */
  isRenting: boolean;
}
