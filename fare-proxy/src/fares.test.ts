import { describe, expect, it } from 'vitest';
import type { FareDeliverySchema } from 'ojp-shared-types';
import { isAllowedOrigin, isStopId, summarizeFare, toSloid } from './fares';

const product = (name: string, price: string | undefined, travelClass: 'first' | 'second') => ({
  fareProductId: name,
  fareProductName: name,
  fareAuthorityRef: 'ch:1:sboid:101704',
  fareAuthorityText: 'Alliance SwissPass',
  price,
  currency: 'CHF',
  travelClass,
});

type Section = { legs: [number, number]; products: ReturnType<typeof product>[] };

const delivery = (sections: Section[]) =>
  ({
    responseTimestamp: '2026-10-26T16:00:00Z',
    fareResult: [
      {
        resultId: '1',
        tripFareResult: sections.map(({ legs, products }) => ({
          fromTripLegIdRef: legs[0],
          toTripLegIdRef: legs[1],
          fareProduct: products,
        })),
      },
    ],
  }) as unknown as FareDeliverySchema;

describe('summarizeFare', () => {
  // Echte Antwortstruktur (Bern → Bern Wankdorf): je Klasse ein eigenes tripFareResult.
  const bernWankdorf = delivery([
    { legs: [1, 1], products: [product('Libero Einzelbillett', '9.00', 'first')] },
    { legs: [1, 1], products: [product('Libero Einzelbillett', '5.20', 'second')] },
  ]);

  it('trennt die Klassen statt sie zu addieren', () => {
    expect(summarizeFare(bernWankdorf, 'second')).toEqual({
      price: 5.2,
      currency: 'CHF',
      products: ['Libero Einzelbillett'],
    });
    expect(summarizeFare(bernWankdorf, 'first')?.price).toBe(9);
  });

  it('summiert verschiedene Abschnitte und nimmt je Abschnitt das günstigste Produkt', () => {
    const twoSections = delivery([
      {
        legs: [1, 1],
        products: [
          product('Libero 2 Zonen', '5.20', 'second'),
          product('Kurzstrecke', '2.80', 'second'),
        ],
      },
      { legs: [2, 3], products: [product('Streckenbillett', '4.40', 'second')] },
    ]);
    expect(summarizeFare(twoSections, 'second')).toEqual({
      price: 7.2,
      currency: 'CHF',
      products: ['Kurzstrecke', 'Streckenbillett'],
    });
  });

  it('liefert null ohne passende Klasse oder ohne Preis', () => {
    expect(summarizeFare(undefined, 'second')).toBeNull();
    expect(summarizeFare(delivery([]), 'second')).toBeNull();
    expect(
      summarizeFare(
        delivery([{ legs: [1, 1], products: [product('X', undefined, 'second')] }]),
        'second',
      ),
    ).toBeNull();
    expect(
      summarizeFare(
        delivery([{ legs: [1, 1], products: [product('X', '9.00', 'first')] }]),
        'second',
      ),
    ).toBeNull();
  });
});

describe('isAllowedOrigin', () => {
  const allowed = 'https://joel-muenger.github.io';
  it('erlaubt die Live-Seite und localhost, sonst nichts', () => {
    expect(isAllowedOrigin('https://joel-muenger.github.io', allowed)).toBe(true);
    expect(isAllowedOrigin('http://localhost:5180', allowed)).toBe(true);
    expect(isAllowedOrigin('https://evil.example', allowed)).toBe(false);
    expect(isAllowedOrigin(null, allowed)).toBe(false);
  });
});

describe('isStopId', () => {
  it('akzeptiert nur numerische Haltestellen-IDs', () => {
    expect(isStopId('8507000')).toBe(true);
    expect(isStopId('Bern')).toBe(false);
    expect(isStopId('8507000; drop')).toBe(false);
    expect(isStopId(null)).toBe(false);
  });
});

describe('toSloid', () => {
  it('wandelt Schweizer Haltestellennummern in SLOIDs um', () => {
    expect(toSloid('8507000')).toBe('ch:1:sloid:7000');
    expect(toSloid('8516161')).toBe('ch:1:sloid:16161');
    expect(toSloid('8576646')).toBe('ch:1:sloid:76646');
  });
  it('lässt andere Nummern unverändert', () => {
    expect(toSloid('8000105')).toBe('8000105');
  });
});
