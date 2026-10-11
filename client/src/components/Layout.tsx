import { Compass } from 'lucide-react';
import type { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return <div className="min-h-screen bg-sky text-ink"><header className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-white"><Compass size={22} /></span><div><p className="text-lg font-bold leading-none">Plan B</p><p className="mt-1 text-xs text-slate-500">Deine Mobilitätsalternative für Bern</p></div></header><main className="mx-auto max-w-5xl px-5 pb-10">{children}</main></div>;
}
