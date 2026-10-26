import { useEffect, useState } from 'react';
import type { CircleMarker as LeafletCircleMarker } from 'leaflet';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import {
  availabilityColors,
  availabilityLabels,
  formatDistance,
  stationAvailability,
  type Availability,
  type StationWithDistance,
} from '../lib/stations';
import type { Coordinates } from '../types';

interface Props {
  stations: StationWithDistance[];
  origin: Coordinates;
  originLabel: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

/** Schwenkt zur gewählten Station und öffnet ihr Popup. */
function FocusSelected({
  station,
  markers,
}: {
  station?: StationWithDistance;
  markers: Map<string, LeafletCircleMarker>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!station) return;
    map.flyTo([station.lat, station.lon], Math.max(map.getZoom(), 15), { duration: 0.6 });
    markers.get(station.id)?.openPopup();
  }, [map, station, markers]);
  return null;
}

/** Leaflet misst die Grösse nur beim Start; nach Ein-/Ausblenden (Liste ↔ Karte) neu messen. */
function TrackSize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export default function StationMap({
  stations,
  origin,
  originLabel,
  selectedId,
  onSelect,
  className = '',
}: Props) {
  const [markers] = useState(() => new Map<string, LeafletCircleMarker>());
  const selected = stations.find((s) => s.id === selectedId);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white shadow-card ${className}`}>
      <MapContainer center={[origin.lat, origin.lon]} zoom={14} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={[origin.lat, origin.lon]}
          radius={7}
          pathOptions={{ color: '#FFFFFF', fillColor: '#102A43', fillOpacity: 1, weight: 3 }}
        >
          <Popup>{originLabel}</Popup>
        </CircleMarker>
        {stations.map((s) => {
          const availability = stationAvailability(s);
          const color = availabilityColors[availability];
          return (
            <CircleMarker
              key={s.id}
              ref={(marker) => {
                if (marker) markers.set(s.id, marker);
                else markers.delete(s.id);
              }}
              center={[s.lat, s.lon]}
              radius={s.id === selectedId ? 13 : 10}
              pathOptions={{ color: '#FFFFFF', fillColor: color, fillOpacity: 1, weight: 3 }}
              eventHandlers={{ click: () => onSelect(s.id) }}
            >
              <Popup>
                <div className="min-w-44 font-sans text-ink">
                  <p className="text-sm font-bold text-wine">{s.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{s.address}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-center">
                    <span className="rounded-lg bg-slate-50 px-2 py-1 text-xs">
                      <b className="block text-base">{s.ebikes}</b>E-Bikes
                    </span>
                    <span className="rounded-lg bg-slate-50 px-2 py-1 text-xs">
                      <b className="block text-base">{s.bikes}</b>Velos
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold" style={{ color }}>
                    {availabilityLabels[availability]} · {formatDistance(s.distance)}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
        <FocusSelected station={selected} markers={markers} />
        <TrackSize />
      </MapContainer>

      <div className="pointer-events-none absolute bottom-6 left-3 z-[1000] rounded-xl bg-white/95 p-3 text-xs shadow-card">
        <p className="mb-1.5 font-bold text-wine">Verfügbarkeit</p>
        <ul className="space-y-1">
          {(Object.keys(availabilityLabels) as Availability[]).map((a) => (
            <li key={a} className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: availabilityColors[a] }}
              />
              {availabilityLabels[a]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
