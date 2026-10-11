import type { Coordinates, DisruptionType } from '@plan-b/shared';

export type {
  Alternative,
  AlternativeCategory,
  AlternativesResponse,
  Coordinates,
  DisruptionType,
  NearbyStop,
  NearbyStopsResponse,
} from '@plan-b/shared';

export type SortMode = 'fastest' | 'cheapest' | 'sustainable';

export interface RouteRequest {
  origin: string;
  destination: string;
  disruption: DisruptionType;
  /** Geräteposition, falls der Startort per Ortung bestimmt wurde */
  originPosition?: Coordinates;
}
