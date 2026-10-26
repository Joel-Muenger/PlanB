import { describe, expect, it } from 'vitest';
import { lineNames } from './api';

describe('lineNames', () => {
  it('benennt Bus und Tram, lässt Bahnlinien kompakt und überspringt Fusswege', () => {
    expect(
      lineNames({
        products: ['3', 'S44'],
        sections: [
          { journey: { category: 'T', number: '3' } },
          { journey: null },
          { journey: { category: 'S', number: '44' } },
          { journey: { category: 'B', number: '20' } },
        ],
      }),
    ).toEqual(['Tram 3', 'S44', 'Bus 20']);
  });

  it('fällt ohne Abschnitte auf die Produktliste zurück', () => {
    expect(lineNames({ products: ['IC 8'], sections: [] })).toEqual(['IC 8']);
  });
});
