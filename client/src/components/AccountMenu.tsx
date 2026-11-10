import { LogOut, Sparkles, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAccount } from '../lib/useAccount';

/** Anmelden-Link bzw. angemeldetes Konto mit Plus-Badge im Header. */
export default function AccountMenu() {
  const { user, plus, logout } = useAccount();

  if (!user) {
    return (
      <Link
        to="/anmelden"
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold shadow-sm transition hover:text-wine/80"
      >
        <UserRound size={16} /> Anmelden
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link
        to="/abo"
        title={user.email}
        className="inline-flex max-w-[11rem] items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold shadow-sm"
      >
        <UserRound size={16} className="shrink-0" />
        <span className="hidden truncate sm:inline">{user.email}</span>
        {plus ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-wine px-1.5 py-0.5 text-[10px] text-white">
            <Sparkles size={10} /> Plus
          </span>
        ) : (
          <span className="text-xs text-slate-500 sm:hidden">Konto</span>
        )}
      </Link>
      <button
        type="button"
        onClick={logout}
        aria-label="Abmelden"
        title="Abmelden"
        className="rounded-full bg-white p-2 shadow-sm transition hover:text-wine/80"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
