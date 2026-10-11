import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet';
const route: [number, number][] = [
  [46.9481, 7.4474],
  [46.9518, 7.4508],
  [46.9564, 7.4593],
];
export default function RouteMap({ origin, destination }: { origin: string; destination: string }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
      <div className="px-5 pt-5">
        <h2 className="font-bold">Deine Strecke</h2>
        <p className="mt-1 text-sm text-slate-500">Mock-Route in der Region Bern</p>
      </div>
      <MapContainer
        center={[46.9518, 7.451]}
        zoom={13}
        scrollWheelZoom={false}
        className="mt-4 h-56 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={route} pathOptions={{ color: '#1677C8', weight: 5 }} />
        <CircleMarker
          center={route[0]}
          radius={8}
          pathOptions={{ color: '#102A43', fillColor: '#102A43', fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top">
            {origin}
          </Tooltip>
        </CircleMarker>
        <CircleMarker
          center={route[2]}
          radius={8}
          pathOptions={{ color: '#1677C8', fillColor: '#1677C8', fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top">
            {destination}
          </Tooltip>
        </CircleMarker>
      </MapContainer>
    </section>
  );
}
