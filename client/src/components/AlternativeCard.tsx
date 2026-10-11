import { Bike, Car, ExternalLink, Leaf, Train, Wallet, Zap } from 'lucide-react';
import type { Alternative, AlternativeCategory } from '../types';
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
  return (
    <article
      className={`relative rounded-2xl border bg-white p-5 shadow-card ${featured ? 'border-brand ring-1 ring-brand' : 'border-slate-100'}`}
    >
      {featured && (
        <span className="absolute -top-3 left-5 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
          Beste Wahl
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-brand">
            <Icon size={23} />
          </span>
          <div>
            <p className="font-bold">{alternative.name}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {labels[alternative.category]}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-sm font-bold text-emerald-700">
          <Leaf size={16} />
          {alternative.sustainabilityScore}/10
        </span>
      </div>
      <div className="my-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Reisezeit</p>
          <p className="mt-1 flex items-center gap-1 font-bold">
            <Zap size={15} className="text-brand" />
            {alternative.travelTime} Min.
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Kosten</p>
          <p className="mt-1 flex items-center gap-1 font-bold">
            <Wallet size={15} className="text-brand" />
            CHF {alternative.price}
          </p>
        </div>
      </div>
      <a
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
        href={alternative.providerUrl}
        target="_blank"
        rel="noreferrer"
      >
        Zum Anbieter <ExternalLink size={16} />
      </a>
    </article>
  );
}
