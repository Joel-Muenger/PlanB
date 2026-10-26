import type { FareDeliverySchema } from 'ojp-shared-types';

export interface FareSummary {
  /** Gesamtpreis der Fahrt, z. B. 4.6 */
  price: number;
  currency: string;
  /** Billettnamen je Abschnitt, z. B. ["Libero Kurzstrecke"] */
  products: string[];
}

/**
 * Fasst die OJP-Fare-Antwort einer Fahrt zu einem Preis zusammen. NOVA kann eine
 * Fahrt in mehrere Abschnitte (tripFareResult) mit je eigenem Billett teilen;
 * der Fahrpreis ist die Summe der günstigsten Produkte je Abschnitt.
 */
export function summarizeFare(delivery: FareDeliverySchema | undefined): FareSummary | null {
  const result = delivery?.fareResult?.[0];
  if (!result || result.tripFareResult.length === 0) return null;

  let price = 0;
  let currency = 'CHF';
  const products: string[] = [];
  for (const section of result.tripFareResult) {
    const priced = section.fareProduct
      .map((p) => ({ ...p, value: Number(p.price) }))
      .filter((p) => Number.isFinite(p.value));
    if (priced.length === 0) return null;
    const cheapest = priced.reduce((a, b) => (b.value < a.value ? b : a));
    price += cheapest.value;
    currency = cheapest.currency ?? currency;
    products.push(cheapest.fareProductName);
  }
  return { price: Math.round(price * 100) / 100, currency, products };
}

/** Prüft, ob der Aufrufer die Preise abfragen darf (CORS). */
export function isAllowedOrigin(origin: string | null, allowed: string): boolean {
  if (!origin) return false;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return allowed
    .split(',')
    .map((o) => o.trim())
    .includes(origin);
}

/** ÖV-Haltestellen-ID (DiDok/BPUIC, z. B. 8507000) – verhindert beliebige Eingaben an OJP. */
export const isStopId = (value: string | null): value is string =>
  !!value && /^\d{6,9}$/.test(value);

/**
 * Wandelt eine Schweizer Haltestellennummer (BPUIC/DiDok, z. B. 8516161) in die SLOID,
 * die OJP 1.0 erwartet (ch:1:sloid:16161): Ländercode 85 weg, führende Nullen weg.
 * Ausländische Nummern bleiben unverändert.
 */
export function toSloid(stopId: string): string {
  const match = /^85(\d{5})$/.exec(stopId);
  return match ? `ch:1:sloid:${Number(match[1])}` : stopId;
}
