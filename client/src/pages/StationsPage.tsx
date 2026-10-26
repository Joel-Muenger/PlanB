import { ArrowLeft, Bike, List, LoaderCircle, Map as MapIcon, Search, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import StationMap from '../components/StationMap';
import { getBikeStations } from '../lib/api';
import {
  availabilityColors,
  availabilityLabels,
  filterStations,
  formatDistance,
  sortByDistance,
  stationAvailability,
  type BikeType,
} from '../lib/stations';
import type { BikeStation, Coordinates, RouteRequest } from '../types';

/** Bezugspunkt für Distanzen, wenn der Startort nicht geortet wurde. */
const BERN_BAHNHOF: Coordinates = { lat: 46.9486, lon: 7.4396 };

const typeFilters: { id: BikeType; label: string }[] = [
  { id: 'all', label: 'Alle' },
  { id: 'ebike', label: 'Nur E-Bikes' },
  { id: 'bike', label: 'Nur mech. Velos' },
];

const chip = (active: boolean) =>
  `whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
    active ? 'bg-wine text-white' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-100'
  }`;

export default function StationsPage() {
  const location = useLocation();
  const route = location.state as Partial<RouteRequest> | null;
  const origin = route?.originPosition ?? BERN_BAHNHOF;
  const originLabel = route?.originPosition ? 'Dein Standort' : 'Bern Bahnhof';

  const [stations, setStations] = useState<BikeStation[] | null>(null);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<BikeType>('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    let active = true;
    void getBikeStations().then((data) => active && setStations(data));
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(
    () => sortByDistance(filterStations(stations ?? [], { query, type, onlyAvailable }), origin),
    [stations, query, type, onlyAvailable, origin],
  );

  const totals = useMemo(() => {
    const open = (stations ?? []).filter((s) => s.isRenting);
    return {
      stations: open.length,
      ebikes: open.reduce((n, s) => n + s.ebikes, 0),
      bikes: open.reduce((n, s) => n + s.bikes, 0),
    };
  }, [stations]);

  const select = (id: string) => {
    setSelectedId(id);
    setView('map');
  };

  return (
    <Layout>
      <Link
        to="/alternativen"
        state={route}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-wine"
      >
        <ArrowLeft size={17} /> Zurück zu den Alternativen
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-wine">PubliBike in Bern</p>
          <h1 className="mt-1 text-3xl font-extrabold">Stationen finden</h1>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
          Demo-Daten
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3">
        {[
          { label: 'Stationen aktiv', value: totals.stations, Icon: MapIcon },
          { label: 'E-Bikes', value: totals.ebikes, Icon: Zap },
          { label: 'Mech. Velos', value: totals.bikes, Icon: Bike },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="rounded-2xl bg-white p-3 shadow-card sm:p-4">
            <dt className="flex items-center gap-1.5 text-xs text-slate-500">
              <Icon size={14} className="shrink-0 text-wine" />
              {label}
            </dt>
            <dd className="mt-1 text-2xl font-extrabold">{stations ? value : '–'}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.25fr]">
        <section className="min-w-0">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-wine focus-within:ring-4 focus-within:ring-wine/15">
            <Search size={18} className="shrink-0 text-wine" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Station oder Adresse suchen"
              aria-label="Station oder Adresse suchen"
              className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-slate-400 sm:text-sm"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            {typeFilters.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={type === f.id}
                onClick={() => setType(f.id)}
                className={chip(type === f.id)}
              >
                {f.label}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={onlyAvailable}
              onClick={() => setOnlyAvailable((v) => !v)}
              className={chip(onlyAvailable)}
            >
              Nur verfügbare
            </button>
          </div>

          {/* Auf schmalen Bildschirmen Liste und Karte umschalten, ab lg nebeneinander */}
          <div className="mt-4 grid grid-cols-2 rounded-full bg-white p-1 shadow-sm lg:hidden">
            {(
              [
                { id: 'list', label: 'Liste', Icon: List },
                { id: 'map', label: 'Karte', Icon: MapIcon },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                onClick={() => setView(id)}
                className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-bold transition ${
                  view === id ? 'bg-wine text-white' : 'text-slate-600'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          <div className={view === 'list' ? 'block' : 'hidden lg:block'}>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              {visible.length} {visible.length === 1 ? 'Station' : 'Stationen'} · Distanz ab{' '}
              {originLabel}
            </p>
            {stations === null ? (
              <div className="grid h-40 place-items-center">
                <LoaderCircle className="animate-spin text-wine" />
              </div>
            ) : visible.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-card">
                Keine Station passt zu deiner Suche.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {visible.map((s) => {
                  const availability = stationAvailability(s);
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => select(s.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-card transition hover:border-wine/40 ${
                          s.id === selectedId ? 'border-wine ring-1 ring-wine' : 'border-slate-100'
                        }`}
                      >
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: availabilityColors[availability] }}
                          title={availabilityLabels[availability]}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold">{s.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">
                            {s.address}
                          </span>
                          <span className="mt-1 block text-xs font-semibold text-slate-500">
                            {formatDistance(s.distance)} ·{' '}
                            <span style={{ color: availabilityColors[availability] }}>
                              {availabilityLabels[availability]}
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1 text-sm font-bold">
                          <span className="inline-flex items-center gap-1" title="E-Bikes">
                            <Zap size={14} className="text-wine" />
                            {s.ebikes}
                          </span>
                          <span className="inline-flex items-center gap-1" title="Mech. Velos">
                            <Bike size={14} className="text-wine" />
                            {s.bikes}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <StationMap
          stations={visible}
          origin={origin}
          originLabel={originLabel}
          selectedId={selectedId}
          onSelect={setSelectedId}
          className={`h-[480px] lg:sticky lg:top-5 lg:h-[620px] ${view === 'map' ? 'block' : 'hidden lg:block'}`}
        />
      </div>

      <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
        Demo-Daten: Standorte angelehnt an PubliBike Bern, Velozahlen erfunden. Live-Daten wären
        über sharedmobility.ch verfügbar.
      </p>
    </Layout>
  );
}
