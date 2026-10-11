export type AlternativeCategory = 'train' | 'taxi' | 'bike' | 'car';
export type SortMode = 'fastest' | 'cheapest' | 'sustainable';
export type DisruptionType = 'Zug fällt aus' | 'Tram verspätet sich' | 'Streckensperrung';

export interface Alternative {
  id: string;
  name: string;
  category: AlternativeCategory;
  travelTime: number;
  price: number;
  sustainabilityScore: number;
  providerUrl: string;
}

export interface RouteRequest { origin: string; destination: string; disruption: DisruptionType; }
