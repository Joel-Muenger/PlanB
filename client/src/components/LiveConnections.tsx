import { LoaderCircle, RotateCw, TrainFront } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getConnections, type LiveConnection } from '../lib/api';

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });

/** Nächste echte Verbindungen Start → Ziel mit Verspätung (transport.opendata.ch). */
export default function LiveConnections({ from, to }: { from: string; to: string }) {
  const [connections, setConnections] = useState<LiveConnection[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getConnections(from, to)
      .then((data) => {
        if (!active) return;
        setConnections(data);
        setFailed(false);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [from, to, attempt]);

  const retry = () => {
    setConnections(null);
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold">
          <TrainFront size={18} className="text-wine" /> Nächste Verbindungen
        </h2>
        {!failed && connections && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" /> Live
          </span>
        )}
      </div>

      {failed ? (
        <div className="mt-3 text-sm text-slate-500">
          <p>Echtzeitdaten sind gerade nicht erreichbar.</p>
          <button
            type="button"
            onClick={retry}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-wine hover:underline"
          >
            <RotateCw size={14} /> Erneut versuchen
          </button>
        </div>
      ) : connections === null ? (
        <div className="grid h-20 place-items-center">
          <LoaderCircle className="animate-spin text-wine" />
        </div>
      ) : connections.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          Für „{from}“ → „{to}“ wurde keine Verbindung gefunden.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {connections.map((c) => (
            <li key={c.departure + c.products.join()} className="flex items-center gap-3 py-2.5">
              <span className="w-12 shrink-0 text-base font-extrabold">{time(c.departure)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">
                  {c.products.join(' → ') || 'ÖV'}
                </span>
                <span className="block text-xs text-slate-500">
                  an {time(c.arrival)}
                  {c.platform && ` · Gleis ${c.platform}`}
                  {c.transfers > 0 && ` · ${c.transfers}× umsteigen`}
                </span>
              </span>
              {c.delay ? (
                <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
                  +{c.delay} Min.
                </span>
              ) : (
                <span className="shrink-0 text-xs font-semibold text-emerald-700">pünktlich</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-slate-400">Quelle: transport.opendata.ch</p>
    </section>
  );
}
