import { describe, expect, it } from 'vitest';
import stations from '../data/bikeStations.json';
import type { BikeStation } from '../types';
import {
  distanceMeters,
  filterStations,
  formatDistance,
  sortByDistance,
  stationAvailability,
} from './stations';

const station = (overrides: Partial<BikeStation>): BikeStation => ({
  id: 'x',
  name: 'Testplatz',
  address: 'Teststrasse 1, 3000 Bern',
  lat: 46.95,
  lon: 7.44,
  capacity: 10,
  ebikes: 0,
  bikes: 0,
  isRenting: true,
  ...overrides,
});

const all = { query: '', type: 'all', onlyAvailable: false } as const;

describe('stationAvailability', () => {
  it('meldet ausser Betrieb vor allem anderen', () => {
    expect(stationAvailability(station({ ebikes: 5, isRenting: false }))).toBe('closed');
  });
  it('unterscheidet leer, wenige und gut', () => {
    expect(stationAvailability(station({}))).toBe('empty');
    expect(stationAvailability(station({ ebikes: 1, bikes: 1 }))).toBe('low');
    expect(stationAvailability(station({ ebikes: 1, bikes: 2 }))).toBe('good');
  });
});

describe('distanceMeters', () => {
  it('ist 0 für denselben Punkt', () => {
    expect(distanceMeters({ lat: 46.95, lon: 7.44 }, { lat: 46.95, lon: 7.44 })).toBe(0);
  });
  it('misst Bern Bahnhof → Wankdorf Bahnhof auf rund 3 km', () => {
    const d = distanceMeters({ lat: 46.9486, lon: 7.4396 }, { lat: 46.9672, lon: 7.4658 });
    expect(d).toBeGreaterThan(2800);
    expect(d).toBeLessThan(3000);
  });
});

describe('formatDistance', () => {
  it('rundet Meter auf 10 m und schreibt Kilometer mit Komma', () => {
    expect(formatDistance(234)).toBe('230 m');
    expect(formatDistance(999)).toBe('1000 m');
    expect(formatDistance(2850)).toBe('2,9 km');
  });
});

describe('filterStations', () => {
  const list = [
    station({ id: 'a', name: 'Zytglogge', ebikes: 2 }),
    station({ id: 'b', name: 'Marzili', address: 'Marzilistrasse 29', bikes: 3 }),
    station({ id: 'c', name: 'Leer', isRenting: true }),
    station({ id: 'd', name: 'Zu', bikes: 4, isRenting: false }),
  ];
  const ids = (result: BikeStation[]) => result.map((s) => s.id);

  it('sucht in Name und Adresse, ohne Gross-/Kleinschreibung', () => {
    expect(ids(filterStations(list, { ...all, query: 'zyt' }))).toEqual(['a']);
    expect(ids(filterStations(list, { ...all, query: 'MARZILISTR' }))).toEqual(['b']);
  });
  it('filtert nach Velotyp', () => {
    expect(ids(filterStations(list, { ...all, type: 'ebike' }))).toEqual(['a']);
    expect(ids(filterStations(list, { ...all, type: 'bike' }))).toEqual(['b', 'd']);
  });
  it('„Nur verfügbare“ entfernt leere und geschlossene Stationen', () => {
    expect(ids(filterStations(list, { ...all, onlyAvailable: true }))).toEqual(['a', 'b']);
  });
});

describe('sortByDistance', () => {
  it('sortiert aufsteigend und ergänzt die Distanz', () => {
    const from = { lat: 46.9486, lon: 7.4396 };
    const sorted = sortByDistance(stations as BikeStation[], from);
    expect(sorted[0].name).toBe('Bern Bahnhof (Welle)');
    expect(sorted[0].distance).toBeLessThan(10);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].distance).toBeGreaterThanOrEqual(sorted[i - 1].distance);
    }
  });
});
