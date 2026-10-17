import { ArrowRight, LoaderCircle, LocateFixed, Route as RouteIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DISRUPTION_TYPES } from '@plan-b/shared';
import DisruptionSelect from '../components/DisruptionSelect';
import Layout from '../components/Layout';
import LocationInput from '../components/LocationInput';
import { LocationError, locateNearestStop } from '../lib/location';
import type { Coordinates, DisruptionType, RouteRequest } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('Bern Bahnhof');
  const [destination, setDestination] = useState('Wankdorf Bahnhof');
  const [disruption, setDisruption] = useState<DisruptionType>(DISRUPTION_TYPES[0]);
  const [originPosition, setOriginPosition] = useState<Coordinates>();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const changeOrigin = (value: string) => {
    setOrigin(value);
    setOriginPosition(undefined);
    setLocationError(null);
  };

  const locateOrigin = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const { position, stop } = await locateNearestStop();
      setOrigin(stop.name);
      setOriginPosition(position);
    } catch (error) {
      setLocationError(
        error instanceof LocationError ? error.message : 'Standort konnte nicht ermittelt werden.',
      );
    } finally {
      setLocating(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const state: RouteRequest = { origin, destination, disruption, originPosition };
    navigate('/alternativen', { state });
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:pt-12">
        <section>
          <span className="inline-flex rounded-full bg-wine/10 px-3 py-1 text-xs font-bold text-wine">
            Mobilität Region Bern
          </span>
          <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Wenn der Plan ausfällt, kommt <span className="text-wine">Plan B.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600">
            Finde bei ÖV-Störungen sofort eine passende Alternative – schnell, transparent und ohne
            zwischen Apps wechseln zu müssen.
          </p>
        </section>
        <form onSubmit={submit} className="space-y-5 rounded-2xl bg-white p-5 shadow-card sm:p-7">
          <div className="flex items-center gap-2">
            <RouteIcon size={20} className="text-wine" />
            <h2 className="text-xl font-bold">Route prüfen</h2>
          </div>
          <LocationInput
            label="Startort"
            value={origin}
            onChange={changeOrigin}
            placeholder="z. B. Bern Bahnhof"
            error={locationError}
            action={
              <button
                type="button"
                onClick={locateOrigin}
                disabled={locating}
                title="Nächste Haltestelle zu deinem aktuellen Standort verwenden"
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-wine transition hover:bg-wine/5 disabled:opacity-60"
              >
                {locating ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <LocateFixed size={18} />
                )}
                {locating ? 'Suche…' : 'Standort'}
              </button>
            }
          />
          <LocationInput
            label="Zielort"
            value={destination}
            onChange={setDestination}
            placeholder="z. B. Wankdorf Bahnhof"
          />
          <DisruptionSelect value={disruption} onChange={setDisruption} />
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-wine px-4 py-3.5 font-bold text-white transition hover:bg-wine/90">
            Alternativen anzeigen <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </Layout>
  );
}
