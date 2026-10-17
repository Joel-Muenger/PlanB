import { useRef, useState, type PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  isEmbedded,
  loadViewMode,
  withBase,
  withoutBase,
  saveViewMode,
  type ViewMode,
} from '../lib/viewMode';
import PhonePreview from './PhonePreview';
import ViewModeToggle from './ViewModeToggle';

export default function Layout({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const phoneRef = useRef<HTMLIFrameElement>(null);
  const [mode, setMode] = useState<ViewMode>(loadViewMode);
  const showPhone = mode === 'mobile' && !isEmbedded;

  const changeMode = (next: ViewMode) => {
    // Beim Zurückwechseln die Seite übernehmen, auf der man im Handy gerade ist.
    if (next === 'web') {
      try {
        const frame = phoneRef.current?.contentWindow;
        if (frame) {
          const state = (frame.history.state as { usr?: unknown } | null)?.usr;
          navigate(withoutBase(frame.location.pathname), { state });
        }
      } catch {
        // iframe nicht lesbar: aktuelle Seite bleibt.
      }
    }
    saveViewMode(next);
    setMode(next);
  };

  return (
    <div
      className={`min-h-screen bg-sand text-wine ${
        // In der iPhone-Vorschau liefert der iframe keine Safe Areas: Werte des iPhone 15 Pro.
        isEmbedded
          ? 'pb-[34px] pt-[54px]'
          : 'pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]'
      }`}
    >
      <header className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-5">
        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-wine shadow-card">
          <img
            src={`${import.meta.env.BASE_URL}logo-planb.png`}
            alt=""
            className="h-full w-full scale-110 object-cover"
          />
        </span>
        <div>
          <p className="text-lg font-extrabold leading-none tracking-wide">PLAN B</p>
          <p className="mt-1 text-xs text-slate-500">Deine Mobilitätsalternative für Bern</p>
        </div>
        {!isEmbedded && <ViewModeToggle mode={mode} onChange={changeMode} />}
      </header>
      {showPhone ? (
        <PhonePreview ref={phoneRef} src={withBase(location.pathname)} />
      ) : (
        <main className="mx-auto max-w-5xl px-5 pb-10">{children}</main>
      )}
    </div>
  );
}
