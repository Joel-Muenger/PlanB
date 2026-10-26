import { Bike, Car, ExternalLink, Gauge, Leaf, Search, Train, Wallet, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { capacityText, statusLabels } from '../lib/alternatives';
import type { Alternative, AlternativeCategory, ProviderStatus } from '../types';

const statusStyles: Record<ProviderStatus, { badge: string; dot: string }> = {
  available: { badge: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-600' },
  limited: { badge: 'bg-amber-50 text-amber-900', dot: 'bg-amber-500' },
  unavailable: { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
};

const icons: Record<AlternativeCategory, typeof Train> = {
  train: Train,
  taxi: Car,
  bike: Bike,
  car: Car,
};
const labels: Record<AlternativeCategory, string> = {
  train: 'ÖV',
  taxi: 'Taxi',
  bike: 'Velo',
  car: 'Sharing',
};
export default function AlternativeCard({
  alternative,
  featured,
}: {
  alternative: Alternative;
  featured?: boolean;
}) {
  const Icon = icons[alternative.category];
  const location = useLocation();
  const unavailable = alternative.status === 'unavailable';
  const capacity = capacityText(alternative);
  const style = statusStyles[alternative.status];
  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border bg-white p-5 shadow-card ${featured ? 'border-wine ring-1 ring-wine' : 'border-slate-100'} ${unavailable ? 'opacity-70' : ''}`}
    >
      {featured && (
        <span className="absolute -top-3 left-5 rounded-full bg-wine px-3 py-1 text-xs font-bold text-white">
          Beste Wahl
        </span>
      )}
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-wine/5 text-wine">
          <Icon size={23} />
        </span>
        <div className="min-w-0">
          <p className="font-bold">{alternative.name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs font-medium text-slate-500">
            {labels[alternative.category]}
            <span
              className="inline-flex items-center gap-1 whitespace-nowrap font-bold text-emerald-700"
              title="Nachhaltigkeit"
            >
              <Leaf size={14} />
              {alternative.sustainabilityScore}/10
            </span>
          </p>
        </div>
        {alternative.category === 'bike' && (
          <Link
            to="/stationen"
            state={location.state}
            aria-label="Stationen in der Nähe suchen"
            title="Stationen in der Nähe suchen"
            className="ml-auto grid h-10 w-10 shrink-0 place-items-center self-start rounded-full bg-wine/5 text-wine transition hover:bg-wine hover:text-white"
          >
            <Search size={18} />
          </Link>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${style.badge}`}
        >
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          {statusLabels[alternative.status]}
        </span>
        {alternative.statusNote && (
          <span className="text-xs text-slate-500">{alternative.statusNote}</span>
        )}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Reisezeit</p>
          <p className="mt-1 flex items-center gap-1 font-bold">
            <Zap size={15} className="text-wine" />
            {alternative.travelTime} Min.
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Kosten</p>
          <p className="mt-1 flex items-center gap-1 font-bold">
            <Wallet size={15} className="text-wine" />
            CHF {alternative.price}
          </p>
        </div>
        {capacity && (
          <p className="col-span-2 flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            <Gauge size={15} className="shrink-0 text-wine" />
            {capacity}
          </p>
        )}
      </div>
      <a
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-wine px-4 py-3 text-sm font-bold text-white transition hover:bg-wine/90"
        href={alternative.providerUrl}
        target="_blank"
        rel="noreferrer"
      >
        Zum Anbieter <ExternalLink size={16} />
      </a>
    </article>
  );
}
