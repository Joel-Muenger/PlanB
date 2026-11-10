import { Check, CircleCheck, LoaderCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { PLUS_PERIOD_DAYS, PLUS_PRICE_CHF } from '../lib/account';
import { useAccount } from '../lib/useAccount';

const benefits = ['Keine Werbung vor den Alternativen', 'Jederzeit kündbar', 'Unterstützt Plan B'];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' });

export default function SubscriptionPage() {
  const { user, plus, subscribe, cancel } = useAccount();
  const [busy, setBusy] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);

  if (!user) return <Navigate to="/anmelden" replace state={{ from: '/abo' }} />;

  const run = async (action: () => Promise<void>, subscribed: boolean) => {
    setBusy(true);
    try {
      await action();
      setJustSubscribed(subscribed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-md pt-4 lg:pt-12">
        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-wine/10 px-3 py-1 text-xs font-bold text-wine">
            <Sparkles size={14} /> Plan B Plus
          </span>
          <p className="mt-4 text-4xl font-extrabold tracking-tight">
            CHF {PLUS_PRICE_CHF.toFixed(2)}
            <span className="text-base font-bold text-slate-500"> / Monat</span>
          </p>
          <ul className="mt-5 space-y-2.5">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm text-ink">
                <Check size={18} className="shrink-0 text-wine" /> {benefit}
              </li>
            ))}
          </ul>

          {plus && user.plusUntil ? (
            <div className="mt-6 space-y-3">
              <p
                role="status"
                className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              >
                <CircleCheck size={18} className="mt-0.5 shrink-0" />
                <span>
                  {justSubscribed ? 'Danke! Dein Abo ist aktiv. ' : 'Dein Abo ist aktiv. '}
                  Werbefrei bis {formatDate(user.plusUntil)}.
                </span>
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void run(cancel, false)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-wine hover:text-wine disabled:opacity-60"
              >
                Abo kündigen
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(subscribe, true)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-wine px-4 py-3 font-bold text-white transition hover:bg-wine/90 disabled:opacity-60"
            >
              {busy && <LoaderCircle size={18} className="animate-spin" />}
              Abo abschliessen
            </button>
          )}

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Demo – es wird nichts belastet. Ein Abschluss schaltet {PLUS_PERIOD_DAYS} Tage ohne
            Werbung frei.
          </p>
        </section>
        <Link to="/" className="mt-4 block text-center text-sm font-bold text-wine">
          Zurück zur Startseite
        </Link>
      </div>
    </Layout>
  );
}
