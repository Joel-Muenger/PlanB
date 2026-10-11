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

export type DisruptionType = 'Zug fällt aus' | 'Tram verspätet sich' | 'Streckensperrung';
