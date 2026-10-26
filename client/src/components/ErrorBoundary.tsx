import { AlertTriangle, Home, RotateCw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Fängt Laufzeitfehler ab, damit statt einer leeren Seite ein Ausweg angezeigt wird.
 * Klassenkomponente, weil React Error Boundaries nur so unterstützt.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Plan B ist auf einen Fehler gestossen:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center bg-sand px-5 text-wine">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-card">
          <AlertTriangle className="mx-auto text-amber-600" />
          <h1 className="mt-3 text-lg font-extrabold">Da ist etwas schiefgelaufen</h1>
          <p className="mt-2 text-sm text-slate-500">
            Die Seite konnte nicht angezeigt werden. Lade sie neu oder beginne auf der Startseite.
          </p>
          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 rounded-xl bg-wine px-4 py-3 text-sm font-bold text-white transition hover:bg-wine/90"
            >
              <RotateCw size={16} /> Neu laden
            </button>
            <a
              href={import.meta.env.BASE_URL}
              className="flex items-center justify-center gap-2 rounded-xl bg-wine/5 px-4 py-3 text-sm font-bold text-wine transition hover:bg-wine/10"
            >
              <Home size={16} /> Zur Startseite
            </a>
          </div>
        </div>
      </div>
    );
  }
}
