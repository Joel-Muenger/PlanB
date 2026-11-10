import { describe, expect, it } from 'vitest';
import { adProgress, canShowAd, parseTimestamp, remainingCooldownMs } from './ads';

const MIN = 60_000;

describe('Frequenzbegrenzung', () => {
  it('erlaubt Werbung, wenn noch nie eine lief', () => {
    expect(canShowAd(null, 1_000)).toBe(true);
  });

  it('sperrt innerhalb von 60 Minuten', () => {
    expect(canShowAd(1, 1 + 59 * MIN)).toBe(false);
    expect(remainingCooldownMs(1, 1 + 30 * MIN)).toBe(30 * MIN);
  });

  it('erlaubt nach Ablauf der 60 Minuten', () => {
    expect(canShowAd(1, 1 + 60 * MIN)).toBe(true);
  });
});

describe('Skip-Zustand', () => {
  it('ist vor Sekunde 10 gesperrt und zählt herunter', () => {
    const p = adProgress(3.2, 30, 10);
    expect(p.canSkip).toBe(false);
    expect(p.secondsToSkip).toBe(7);
  });

  it('ist ab Sekunde 10 überspringbar', () => {
    expect(adProgress(10, 30, 10).canSkip).toBe(true);
  });

  it('meldet Ende und 100 % nach der Dauer', () => {
    const p = adProgress(31, 30, 10);
    expect(p.finished).toBe(true);
    expect(p.percent).toBe(100);
  });
});

describe('parseTimestamp', () => {
  it('liefert null für leere oder ungültige Werte', () => {
    expect(parseTimestamp(null)).toBeNull();
    expect(parseTimestamp('abc')).toBeNull();
    expect(parseTimestamp('123')).toBe(123);
  });
});
