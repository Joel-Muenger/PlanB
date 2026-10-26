import * as OJP from 'ojp-sdk-next';
import { isAllowedOrigin, isStopId, summarizeFare, type FareSummary } from './fares';

/**
 * Plan-B-Preisproxy: nimmt Start-/Ziel-Haltestelle und Abfahrtszeit entgegen, sucht
 * die Verbindung über OJP 1.0 und fragt deren Preis bei OJP Fare (NOVA) ab – einmal
 * Vollpreis, einmal mit Halbtax. Der API-Key bleibt hier und erreicht nie den Browser.
 */

export interface Env {
  OJP_API_KEY: string;
  ALLOWED_ORIGINS: string;
}

// OJP Fare gibt es nur für OJP 1.0 (Stand ojp-sdk-next 0.21).
const OJP_V1_URL = 'https://api.opentransportdata.swiss/ojp2020';
const REQUESTOR_REF = 'PlanB_Prototyp_v1';
const CACHE_SECONDS = 600;

interface OjpRequest<T> {
  mockResponseXML: string | null;
  buildRequestXML(language: OJP.Language, requestorRef: string, xmlConfig: never): string;
  fetchResponse(sdk: OJP.AnySDK): Promise<T>;
}

/**
 * Schickt eine SDK-Anfrage per fetch statt über das axios des SDK (in Workers nicht
 * zuverlässig) und lässt das SDK die Antwort auslesen.
 */
async function send<T>(request: OjpRequest<T>, sdk: OJP.AnySDK, apiKey: string): Promise<T> {
  const xml = request.buildRequestXML('de', REQUESTOR_REF, OJP.XML_BuilderConfigOJPv1 as never);
  const response = await fetch(OJP_V1_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
      Accept: 'application/xml',
      Authorization: `Bearer ${apiKey}`,
    },
    body: xml,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`OJP antwortete mit ${response.status}`);
  request.mockResponseXML = await response.text();
  return request.fetchResponse(sdk);
}

async function lookupFares(
  from: string,
  to: string,
  departure: Date,
  apiKey: string,
): Promise<{ full: FareSummary; halfFare: FareSummary } | null> {
  const sdk = OJP.SDK.v1(REQUESTOR_REF, { url: OJP_V1_URL, authToken: null }, 'de');

  const tripRequest = sdk.requests.TripRequest.initWithPlaceRefsOrCoords(from, to);
  tripRequest.setDepartureDatetime(departure);
  tripRequest.setNumberOfResults(1);
  const trips = await send(tripRequest, sdk, apiKey);
  if (!trips.ok) throw trips.error;
  const trip = trips.value.tripResult?.[0]?.trip;
  if (!trip) return null;

  // Standardparameter des SDK: Erwachsen, 2. Klasse, mit Halbtax.
  const halfFareRequest = sdk.requests.FareRequest.initWithOJPv1Trips([structuredClone(trip)]);
  const fullRequest = sdk.requests.FareRequest.initWithOJPv1Trips([structuredClone(trip)]);
  for (const item of fullRequest.payload) {
    for (const traveller of item.params?.traveller ?? []) delete traveller.entitlementProducts;
  }

  const [full, halfFare] = await Promise.all([
    send(fullRequest, sdk, apiKey),
    send(halfFareRequest, sdk, apiKey),
  ]);
  if (!full.ok) throw full.error;
  if (!halfFare.ok) throw halfFare.error;
  const fullSummary = summarizeFare(full.value);
  const halfSummary = summarizeFare(halfFare.value);
  return fullSummary && halfSummary ? { full: fullSummary, halfFare: halfSummary } : null;
}

function json(body: unknown, status: number, origin: string | null, cacheSeconds = 0) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  if (cacheSeconds) headers['Cache-Control'] = `public, max-age=${cacheSeconds}`;
  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const allowedOrigin = isAllowedOrigin(origin, env.ALLOWED_ORIGINS) ? origin : null;

    if (request.method === 'OPTIONS') return json(null, 204, allowedOrigin);
    if (url.pathname !== '/fare' || request.method !== 'GET') {
      return json({ error: 'Nicht gefunden' }, 404, allowedOrigin);
    }
    if (!allowedOrigin) return json({ error: 'Herkunft nicht erlaubt' }, 403, null);

    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const departure = new Date(url.searchParams.get('departure') ?? '');
    if (!isStopId(from) || !isStopId(to) || Number.isNaN(departure.getTime())) {
      return json(
        { error: 'from, to (Haltestellen-ID) und departure (ISO) erforderlich' },
        400,
        allowedOrigin,
      );
    }

    // Gleiche Strecke zur gleichen Viertelstunde → gleicher Preis: zwischenspeichern,
    // um das Gratis-Limit von 50 Anfragen pro Minute zu schonen.
    const slot = new Date(Math.floor(departure.getTime() / 900_000) * 900_000).toISOString();
    const cacheKey = new Request(`https://cache.plan-b/fare/${from}/${to}/${slot}`);
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) return json(await cached.json(), 200, allowedOrigin, CACHE_SECONDS);

    try {
      const fares = await lookupFares(from, to, departure, env.OJP_API_KEY);
      if (!fares) return json({ error: 'Kein Preis gefunden' }, 404, allowedOrigin);
      ctx.waitUntil(
        cache.put(
          cacheKey,
          new Response(JSON.stringify(fares), {
            headers: { 'Cache-Control': `max-age=${CACHE_SECONDS}` },
          }),
        ),
      );
      return json(fares, 200, allowedOrigin, CACHE_SECONDS);
    } catch (error) {
      console.error('Preisabfrage fehlgeschlagen:', error);
      return json({ error: 'Preisauskunft momentan nicht verfügbar' }, 502, allowedOrigin);
    }
  },
};
