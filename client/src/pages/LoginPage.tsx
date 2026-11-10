import { LoaderCircle, LogIn, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { AccountError, MIN_PASSWORD_LENGTH, validateCredentials } from '../lib/account';
import { useAccount } from '../lib/useAccount';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/abo';
  const { login, register } = useAccount();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = mode === 'register' ? validateCredentials(email, password) : null;
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await (mode === 'login' ? login(email, password) : register(email, password));
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err instanceof AccountError ? err.message : 'Etwas ist schiefgelaufen. Bitte nochmals.',
      );
    } finally {
      setBusy(false);
    }
  };

  const tabClass = (active: boolean) =>
    `flex-1 rounded-full px-3 py-2 text-sm font-bold transition ${
      active ? 'bg-wine text-white' : 'text-slate-500 hover:text-wine'
    }`;

  return (
    <Layout>
      <div className="mx-auto max-w-md pt-4 lg:pt-12">
        <form onSubmit={submit} className="space-y-5 rounded-2xl bg-white p-5 shadow-card sm:p-7">
          <div className="flex rounded-full bg-sand/60 p-1">
            <button
              type="button"
              className={tabClass(mode === 'login')}
              onClick={() => setMode('login')}
            >
              Anmelden
            </button>
            <button
              type="button"
              className={tabClass(mode === 'register')}
              onClick={() => setMode('register')}
            >
              Konto erstellen
            </button>
          </div>

          <label className="block">
            <span className="text-sm font-bold">E-Mail</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-ink outline-none focus:border-wine"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">Passwort</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-ink outline-none focus:border-wine"
            />
            {mode === 'register' && (
              <span className="mt-1 block text-xs text-slate-500">
                Mindestens {MIN_PASSWORD_LENGTH} Zeichen.
              </span>
            )}
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-wine px-4 py-3 font-bold text-white transition hover:bg-wine/90 disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : mode === 'login' ? (
              <LogIn size={18} />
            ) : (
              <UserPlus size={18} />
            )}
            {mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
          </button>

          <p className="text-xs leading-relaxed text-slate-500">
            Demo-Konto: Die Daten bleiben nur in diesem Browser gespeichert.
          </p>
        </form>
        <Link to="/" className="mt-4 block text-center text-sm font-bold text-wine">
          Zurück zur Startseite
        </Link>
      </div>
    </Layout>
  );
}
