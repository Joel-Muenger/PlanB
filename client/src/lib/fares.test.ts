import { describe, expect, it } from 'vitest';
import { formatPrice } from './fares';

describe('formatPrice', () => {
  it('zeigt immer zwei Nachkommastellen', () => {
    expect(formatPrice(4.6)).toBe('CHF 4.60');
    expect(formatPrice(2.3, 'CHF')).toBe('CHF 2.30');
    expect(formatPrice(12)).toBe('CHF 12.00');
  });
});
