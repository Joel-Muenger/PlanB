export type ViewMode = 'web' | 'mobile';

const STORAGE_KEY = 'plan-b:view-mode';

/** True, wenn die App als Handy-Vorschau in einem iframe der Web-Ansicht läuft. */
export const isEmbedded = window.self !== window.top;

export function loadViewMode(): ViewMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'mobile' ? 'mobile' : 'web';
  } catch {
    return 'web';
  }
}

export function saveViewMode(mode: ViewMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Speicher nicht verfügbar (z. B. privates Fenster): Modus gilt nur bis zum Neuladen.
  }
}

/**
 * Übernimmt im iframe den Router-State der umgebenden Seite, damit die Handy-Vorschau
 * dieselbe Route (Start, Ziel, Störung) zeigt. Muss vor dem Rendern des Routers laufen.
 */
export function adoptParentHistoryState() {
  if (!isEmbedded) return;
  document.documentElement.classList.add('embedded');
  try {
    window.history.replaceState(window.parent.history.state, '');
  } catch {
    // Anderer Ursprung: Vorschau startet mit Standardwerten.
  }
}

/** Basispfad der App ohne abschliessenden Slash, z. B. "/plan-b" auf GitHub Pages, sonst "". */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Router-Pfad → echter URL-Pfad (für das iframe der iPhone-Vorschau). */
export const withBase = (path: string) => BASE_PATH + path;

/** Echter URL-Pfad → Router-Pfad. */
export const withoutBase = (path: string) =>
  BASE_PATH && path.startsWith(BASE_PATH) ? path.slice(BASE_PATH.length) || '/' : path;
