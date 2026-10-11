import { ArrowRight, Route as RouteIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DisruptionSelect from '../components/DisruptionSelect';
import Layout from '../components/Layout';
import LocationInput from '../components/LocationInput';
import type { DisruptionType } from '../types';
export default function HomePage() {
  const navigate = useNavigate(); const [origin, setOrigin] = useState('Bern Bahnhof'); const [destination, setDestination] = useState('Wankdorf Bahnhof'); const [disruption, setDisruption] = useState<DisruptionType>('Zug fällt aus');
  const submit = (e: React.FormEvent) => { e.preventDefault(); navigate('/alternativen', { state: { origin, destination, disruption } }); };
  return <Layout><div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:pt-12"><section><span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-brand">Mobilität Region Bern</span><h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Wenn der Plan ausfällt, kommt <span className="text-brand">Plan B.</span></h1><p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600">Finde bei ÖV-Störungen sofort eine passende Alternative – schnell, transparent und ohne zwischen Apps wechseln zu müssen.</p></section><form onSubmit={submit} className="space-y-5 rounded-2xl bg-white p-5 shadow-card sm:p-7"><div className="flex items-center gap-2"><RouteIcon size={20} className="text-brand" /><h2 className="text-xl font-bold">Route prüfen</h2></div><LocationInput label="Startort" value={origin} onChange={setOrigin} placeholder="z. B. Bern Bahnhof" /><LocationInput label="Zielort" value={destination} onChange={setDestination} placeholder="z. B. Wankdorf Bahnhof" /><DisruptionSelect value={disruption} onChange={setDisruption} /><button className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 font-bold text-white transition hover:bg-blue-700">Alternativen anzeigen <ArrowRight size={18} /></button></form></div></Layout>;
}
