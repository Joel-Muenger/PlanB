import { describe, expect, it } from 'vitest';
import type { Alternative, BikeStation } from '../types';
import {
  bikeCapacityNear,
  capacityText,
  pickBest,
  resolveStatus,
  sortAlternatives,
} from './alternatives';

const alt = (overrides: Partial<Alternative>): Alternative => ({
  id: 'x',
  name: 'Test',
  category: 'taxi',
  travelTime: 20,
  price: 10,
  sustainabilityScore: 5,
  providerUrl: 'https://example.ch',
  status: 'available',
  ...overrides,
});

describe('resolveStatus', () => {
  it('übernimmt den Status für die gewählte Störung', () => {
    const train = alt({
      statusByDisruption: { Streckensperrung: { status: 'unavailable', statusNote: 'gesperrt' } },
    });
    expect(resolveStatus(train, 'Streckensperrung')).toMatchObject({
      status: 'unavailable',
      statusNote: 'gesperrt',
    });
    expect(resolveStatus(train, 'Zug fällt aus').status).toBe('available');
  });

  it('macht Angebote ohne freie Fahrzeuge unverfügbar', () => {
    const taxi = alt({ capacity: { kind: 'vehicles', available: 0 } });
    expect(resolveStatus(taxi)).toMatchObject({
      status: 'unavailable',
      statusNote: 'Keine Fahrzeuge frei',
    });
  });

  it('lässt Auslastungsangaben unverändert', () => {
    const train = alt({ capacity: { kind: 'occupancy', level: 'high' } });
    expect(resolveStatus(train).status).toBe('available');
  });
});

describe('sortAlternatives und pickBest', () => {
  const list = [
    alt({ id: 'fast-blocked', travelTime: 5, status: 'unavailable' }),
    alt({ id: 'slow', travelTime: 30 }),
    alt({ id: 'mid-limited', travelTime: 15, status: 'limited' }),
  ];

  it('stellt nicht verfügbare Angebote ans Ende', () => {
    expect(sortAlternatives(list, 'fastest').map((a) => a.id)).toEqual([
      'mid-limited',
      'slow',
      'fast-blocked',
    ]);
  });

  it('wählt das erste nutzbare Angebot als beste Wahl', () => {
    expect(pickBest(sortAlternatives(list, 'fastest'))).toBe('mid-limited');
    expect(pickBest([alt({ status: 'unavailable' })])).toBeUndefined();
  });
});

describe('bikeCapacityNear', () => {
  const station = (overrides: Partial<BikeStation>): BikeStation => ({
    id: 's',
    name: 'S',
    address: '',
    lat: 46.9486,
    lon: 7.4396,
    capacity: 10,
    ebikes: 2,
    bikes: 3,
    isRenting: true,
    ...overrides,
  });
  const origin = { lat: 46.9486, lon: 7.4396 };

  it('zählt nur offene Stationen im Umkreis', () => {
    const result = bikeCapacityNear(
      [
        station({ id: 'a' }),
        station({ id: 'b', ebikes: 1, bikes: 0 }),
        station({ id: 'zu', isRenting: false }),
        station({ id: 'weit', lat: 46.9672, lon: 7.4658 }),
      ],
      origin,
    );
    expect(result).toEqual({ available: 6, stations: 2 });
  });
});

describe('capacityText', () => {
  it('beschreibt Fahrzeuge, Wartezeit, Stationen und Auslastung', () => {
    expect(
      capacityText(alt({ capacity: { kind: 'vehicles', available: 3, waitMinutes: 12 } })),
    ).toBe('3 Taxis frei · Wartezeit ca. 12 Min.');
    expect(
      capacityText(
        alt({ category: 'bike', capacity: { kind: 'vehicles', available: 1, stations: 1 } }),
      ),
    ).toBe('1 Velo frei an 1 Station in der Nähe');
    expect(
      capacityText(alt({ category: 'car', capacity: { kind: 'vehicles', available: 2 } })),
    ).toBe('2 Autos frei in der Nähe');
    expect(capacityText(alt({ capacity: { kind: 'occupancy', level: 'high' } }))).toBe(
      'Auslastung hoch',
    );
    expect(capacityText(alt({}))).toBeUndefined();
  });
});
