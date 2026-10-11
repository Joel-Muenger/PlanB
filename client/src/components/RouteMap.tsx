import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet';
import type { Coordinates } from '../types';

const mockRoute: [number, number][] = [
  [46.9481, 7.4474],
  [46.9518, 7.4508],
  [46.9564, 7.4593],
];

interface Props {
  origin: string;
  destination: string;
  /** Echte Geräteposition; ohne sie wird die Mock-Route angezeigt. */
  originPosition?: Coordinates;
}

export default function RouteMap({ origin, destination, originPosition }: Props) {
  const position: [number, number] | null = originPosition
    ? [originPosition.lat, originPosition.lon]
    : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
      <div className="px-5 pt-5">
        <h2 className="font-bold">{position ? 'Dein Standort' : 'Deine Strecke'}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {position ? `Nächste Haltestelle: ${origin}` : 'Mock-Route in der Region Bern'}
        </p>
      </div>
      <MapContainer
        center={position ?? [46.9518, 7.451]}
        zoom={position ? 15 : 13}
        scrollWheelZoom={false}
        className="mt-4 h-56 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position ? (
          <CircleMarker
            center={position}
            radius={8}
            pathOptions={{ color: '#102A43', fillColor: '#1677C8', fillOpacity: 1, weight: 3 }}
          >
            <Tooltip permanent direction="top">
              Du bist hier
            </Tooltip>
          </CircleMarker>
        ) : (
          <>
            <Polyline positions={mockRoute} pathOptions={{ color: '#1677C8', weight: 5 }} />
            <CircleMarker
              center={mockRoute[0]}
              radius={8}
              pathOptions={{ color: '#102A43', fillColor: '#102A43', fillOpacity: 1 }}
            >
              <Tooltip permanent direction="top">
                {origin}
              </Tooltip>
            </CircleMarker>
            <CircleMarker
              center={mockRoute[2]}
              radius={8}
              pathOptions={{ color: '#1677C8', fillColor: '#1677C8', fillOpacity: 1 }}
            >
              <Tooltip permanent direction="top">
                {destination}
              </Tooltip>
            </CircleMarker>
          </>
        )}
      </MapContainer>
    </section>
  );
}
