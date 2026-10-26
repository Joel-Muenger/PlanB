import { describe, expect, it } from 'vitest';
import type { FareDeliverySchema } from 'ojp-shared-types';
import { isAllowedOrigin, isStopId, summarizeFare, toSloid } from './fares';

const product = (name: string, price?: string) => ({
  fareProductId: name,
  fareProductName: name,
  fareAuthorityRef: 'ch:1:NOVA',
  fareAuthorityText: 'NOVA',
  price,
  currency: 'CHF',
  travelClass: 'second',
});

const delivery = (sections: ReturnType<typeof product>[][]) =>
  ({
    responseTimestamp: '2026-10-26T14:00:00Z',
    fareResult: [
      {
        resultId: '1',
        tripFareResult: sections.map((fareProduct, i) => ({
          fromTripLegIdRef: i + 1,
          toTripLegIdRef: i + 1,
          fareProduct,
        })),
      },
    ],
  }) as unknown as FareDeliverySchema;

describe('summarizeFare', () => {
  it('summiert die günstigsten Produkte je Abschnitt', () => {
    const result = summarizeFare(
      delivery([
        [product('Libero 2 Zonen', '5.00'), product('Libero Kurzstrecke', '2.80')],
        [product('Streckenbillett', '4.40')],
      ]),
    );
    expect(result).toEqual({
      price: 7.2,
      currency: 'CHF',
      products: ['Libero Kurzstrecke', 'Streckenbillett'],
    });
  });

  it('liefert null ohne Ergebnis oder ohne Preis', () => {
    expect(summarizeFare(undefined)).toBeNull();
    expect(summarizeFare(delivery([]))).toBeNull();
    expect(summarizeFare(delivery([[product('Ohne Preis')]]))).toBeNull();
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
