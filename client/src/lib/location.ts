import type { Coordinates, NearbyStop, NearbyStopsResponse } from '../types';

export class LocationError extends Error {}

function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new LocationError('Dein Gerät unterstützt keine Standortbestimmung.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      (error) =>
        reject(
          new LocationError(
            error.code === error.PERMISSION_DENIED
              ? 'Standortzugriff wurde verweigert. Bitte gib den Startort manuell ein.'
              : 'Dein Standort konnte nicht ermittelt werden. Bitte gib den Startort manuell ein.',
          ),
        ),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

/** Ermittelt die Geräteposition und die nächstgelegene ÖV-Haltestelle. */
export async function locateNearestStop(): Promise<{ position: Coordinates; stop: NearbyStop }> {
  const position = await getCurrentPosition();
  const response = await fetch(`/api/stops/nearby?lat=${position.lat}&lon=${position.lon}`).catch(
    () => null,
  );
  if (!response?.ok) {
    throw new LocationError('Haltestellensuche ist momentan nicht verfügbar.');
  }
  const { stops } = (await response.json()) as NearbyStopsResponse;
  if (stops.length === 0) {
    throw new LocationError('Keine Haltestelle in deiner Nähe gefunden.');
  }
  return { position, stop: stops[0] };
}
