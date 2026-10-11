import type { DisruptionType } from '@plan-b/shared';

export type {
  Alternative,
  AlternativeCategory,
  AlternativesResponse,
  DisruptionType,
} from '@plan-b/shared';

export type SortMode = 'fastest' | 'cheapest' | 'sustainable';

export interface RouteRequest {
  origin: string;
  destination: string;
  disruption: DisruptionType;
}
