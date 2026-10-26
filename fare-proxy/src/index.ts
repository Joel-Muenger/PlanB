import * as OJP from 'ojp-sdk-next';
import { isAllowedOrigin, isStopId, summarizeFare, toSloid, type FareSummary } from './fares';

/**
 * Plan-B-Preisproxy: nimmt Start-/Ziel-Haltestelle und Abfahrtszeit entgegen, sucht
 * die Verbindung über OJP 1.0 und fragt deren Preis bei OJP Fare (NOVA) ab (2. und 1. Klasse). Der API-Key bleibt hier und erreicht nie den Browser.
 */

export interface Env {
  /** Token für OJP 1.0 (Verbindungssuche, Produkt tedp_ojp10) */
  OJP_API_KEY: string;
  /** Token für OJP Fare (Produkt tedp_ojpfare); das Portal vergibt pro Produkt einen eigenen */
  OJP_FARE_KEY?: string;
  ALLOWED_ORIGINS: string;
}

// Verbindungssuche über OJP 1.0; Preise über den eigenen OJP-Fare-Endpoint (Beta, ebenfalls
// OJP-1.0-XML). Der Fahrplan-Endpoint selbst lehnt FareRequests mit 400 ab.
const OJP_V1_URL = 'https://api.opentransportdata.swiss/ojp2020';
const OJP_FARE_URL = 'https://api.opentransportdata.swiss/ojpfare/';
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
async function send<T>(
  request: OjpRequest<T>,
  sdk: OJP.AnySDK,
  apiKey: string,
  url = OJP_V1_URL,
): Promise<T> {
  const xml = request.buildRequestXML('de', REQUESTOR_REF, OJP.XML_BuilderConfigOJPv1 as never);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
      Accept: 'application/xml',
      Authorization: `Bearer ${apiKey}`,
    },
    body: xml,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`OJP antwortete mit ${response.status}: ${detail}`);
  }
  request.mockResponseXML = await response.text();
  return request.fetchResponse(sdk);
}

async function lookupFares(
  from: string,
  to: string,
  departure: Date,
  apiKey: string,
  fareKey: string,
): Promise<{ second: FareSummary; first: FareSummary | null } | null> {
  const sdk = OJP.SDK.v1(REQUESTOR_REF, { url: OJP_V1_URL, authToken: null }, 'de');

  // OJP 1.0 kennt Haltestellen nur noch als SLOID (z. B. ch:1:sloid:16161).
  const tripRequest = sdk.requests.TripRequest.initWithPlaceRefsOrCoords(
    toSloid(from),
    toSloid(to),
  );
  tripRequest.setDepartureDatetime(departure);
  tripRequest.setNumberOfResults(1);
  const trips = await send(tripRequest, sdk, apiKey);
  if (!trips.ok) throw trips.error;
  const trip = trips.value.tripResult?.[0]?.trip;
  if (!trip) {
    console.log('Antwort Verbindungssuche:', tripRequest.mockResponseXML?.slice(0, 800));
    return null;
  }

  // Vollpreis (Erwachsen, ohne Abo). NOVA liefert 2. und 1. Klasse in einer Antwort.
  // Halbtax ignoriert die Beta-Schnittstelle derzeit (gleiche Preise), daher weggelassen.
  const fareRequest = sdk.requests.FareRequest.initWithOJPv1Trips([trip]);
  for (const item of fareRequest.payload) {
    for (const traveller of item.params?.traveller ?? []) delete traveller.entitlementProducts;
  }
  const fares = await send(fareRequest, sdk, fareKey, OJP_FARE_URL);
  if (!fares.ok) throw fares.error;
  const second = summarizeFare(fares.value, 'second');
  const first = summarizeFare(fares.value, 'first');
  console.log('Preisabfrage:', { second: second?.price, first: first?.price });
  if (!second) {
    console.log('Antwort Preisabfrage:', fareRequest.mockResponseXML?.slice(0, 800));
    return null;
  }
  return { second, first };
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
    const cacheKey = new Request(`https://cache.plan-b/fare/v2/${from}/${to}/${slot}`);
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) return json(await cached.json(), 200, allowedOrigin, CACHE_SECONDS);

    try {
      const fares = await lookupFares(
        from,
        to,
        departure,
        env.OJP_API_KEY,
        env.OJP_FARE_KEY ?? env.OJP_API_KEY,
      );
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
