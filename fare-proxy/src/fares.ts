import type { FareDeliverySchema } from 'ojp-shared-types';

export interface FareSummary {
  /** Gesamtpreis der Fahrt, z. B. 5.2 */
  price: number;
  currency: string;
  /** Billettnamen, z. B. ["Libero Einzelbillett"] */
  products: string[];
}

export type TravelClass = 'second' | 'first';

/**
 * Fasst die OJP-Fare-Antwort für eine Klasse zu einem Fahrpreis zusammen.
 *
 * NOVA liefert je Klasse und Abschnitt (fromTripLegIdRef–toTripLegIdRef) ein eigenes
 * tripFareResult – dieselbe Fahrt erscheint also z. B. einmal mit „second“ (5.20) und
 * einmal mit „first“ (9.00). Pro Abschnitt zählt das günstigste Produkt der Klasse;
 * der Fahrpreis ist die Summe über die Abschnitte.
 */
export function summarizeFare(
  delivery: FareDeliverySchema | undefined,
  travelClass: TravelClass,
): FareSummary | null {
  const sections = delivery?.fareResult?.[0]?.tripFareResult ?? [];
  const cheapest = new Map<string, { price: number; currency: string; name: string }>();

  for (const section of sections) {
    const key = `${section.fromTripLegIdRef}-${section.toTripLegIdRef}`;
    for (const product of section.fareProduct) {
      const price = Number(product.price);
      if (product.travelClass !== travelClass || !Number.isFinite(price)) continue;
      const current = cheapest.get(key);
      if (!current || price < current.price) {
        cheapest.set(key, {
          price,
          currency: product.currency ?? 'CHF',
          name: product.fareProductName,
        });
      }
    }
  }

  if (cheapest.size === 0) return null;
  const parts = [...cheapest.values()];
  return {
    price: Math.round(parts.reduce((sum, p) => sum + p.price, 0) * 100) / 100,
    currency: parts[0].currency,
    products: [...new Set(parts.map((p) => p.name))],
  };
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
