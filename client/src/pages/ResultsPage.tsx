import { AlertTriangle, ArrowLeft, LoaderCircle, MapPin, RotateCw, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DISRUPTION_TYPES } from '@plan-b/shared';
import AlternativeCard from '../components/AlternativeCard';
import Layout from '../components/Layout';
import RouteMap from '../components/RouteMap';
import type { Alternative, AlternativesResponse, RouteRequest, SortMode } from '../types';

const filters: { id: SortMode; label: string }[] = [
  { id: 'fastest', label: 'Schnellste' },
  { id: 'cheapest', label: 'Günstigste' },
  { id: 'sustainable', label: 'Nachhaltigste' },
];

const compare: Record<SortMode, (a: Alternative, b: Alternative) => number> = {
  fastest: (a, b) => a.travelTime - b.travelTime,
  cheapest: (a, b) => a.price - b.price,
  sustainable: (a, b) => b.sustainabilityScore - a.sustainabilityScore,
};

type Status = 'loading' | 'success' | 'error';

export default function ResultsPage() {
  const location = useLocation();
  const state = location.state as Partial<RouteRequest> | null;
  const origin = state?.origin || 'Bern Bahnhof';
  const destination = state?.destination || 'Wankdorf Bahnhof';
  const disruption = state?.disruption || DISRUPTION_TYPES[0];

  const [items, setItems] = useState<Alternative[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [sort, setSort] = useState<SortMode>('fastest');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/alternatives?disruption=${encodeURIComponent(disruption)}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? (r.json() as Promise<AlternativesResponse>) : Promise.reject(r)))
      .then((data) => {
        setItems(data.alternatives);
        setStatus('success');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });
    return () => controller.abort();
  }, [disruption, attempt]);

  const retry = () => {
    setStatus('loading');
    setAttempt((n) => n + 1);
  };

  const sorted = useMemo(() => [...items].sort(compare[sort]), [items, sort]);

  return (
    <Layout>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand"
      >
        <ArrowLeft size={17} /> Route ändern
      </Link>
      <div className="mt-5 grid gap-7 lg:grid-cols-[1fr_1.25fr]">
        <aside className="space-y-5">
          <RouteMap
            origin={origin}
            destination={destination}
            originPosition={state?.originPosition}
          />
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="shrink-0 text-amber-600" />
              <div>
                <p className="font-bold text-amber-950">{disruption}</p>
                <p className="mt-1 text-sm leading-relaxed text-amber-900">
                  Deine ursprüngliche Verbindung ist beeinträchtigt. Hier sind passende
                  Alternativen.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Route</p>
            <div className="mt-3 flex items-start gap-2 text-sm">
              <MapPin size={17} className="text-brand" />
              <span>
                {origin}
                <br />
                <span className="text-slate-400">nach</span>
                <br />
                {destination}
              </span>
            </div>
          </div>
        </aside>
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand">Plan B für deine Reise</p>
              <h1 className="mt-1 text-3xl font-extrabold">Alternativen vergleichen</h1>
            </div>
            {status === 'success' && (
              <p className="text-sm text-slate-500">{items.length} Optionen</p>
            )}
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={sort === filter.id}
                onClick={() => setSort(filter.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                  sort === filter.id
                    ? 'bg-ink text-white'
                    : 'bg-white text-slate-600 shadow-sm hover:bg-slate-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {status === 'loading' && (
            <div className="grid min-h-64 place-items-center">
              <LoaderCircle className="animate-spin text-brand" />
            </div>
          )}
          {status === 'error' && (
            <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-card">
              <WifiOff className="text-slate-400" />
              <p className="font-bold">Alternativen konnten nicht geladen werden.</p>
              <p className="text-sm text-slate-500">
                Bitte prüfe deine Verbindung und versuche es erneut.
              </p>
              <button
                type="button"
                onClick={retry}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700"
              >
                <RotateCw size={16} /> Erneut versuchen
              </button>
            </div>
          )}
          {status === 'success' && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {sorted.map((alternative, index) => (
                <AlternativeCard
                  key={alternative.id}
                  alternative={alternative}
                  featured={index === 0}
                />
              ))}
            </div>
          )}
          <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
            Plan B vermittelt nur an externe Anbieter. Preise und Zeiten sind Schätzwerte für diesen
            Prototyp.
          </p>
        </section>
      </div>
    </Layout>
  );
}
