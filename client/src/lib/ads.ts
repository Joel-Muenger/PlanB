/*
 * Werbeblock vor der Resultatseite: Konfiguration und reine Logik
 * (Frequenzbegrenzung, Skip-Zustand). localStorage-Zugriff ist gekapselt.
 */

export interface AdSpot {
  id: string;
  title: string;
  subtitle: string;
  /** Emoji als Platzhalter-Logo. */
  icon: string;
  ctaText: string;
  ctaUrl?: string;
  durationSec: number;
  /** Ab dieser Sekunde ist die Anzeige überspringbar. */
  skipOffsetSec: number;
  /** Akzentfarbe der Anzeige (Werbefläche, keine Projektfarbe). */
  themeColor: string;
}

export const AD_COOLDOWN_MIN = 60;
export const AD_STORAGE_KEY = 'planb_last_ad_timestamp';
export const AD_TICK_MS = 100;

/** Platzhalter-Anzeigen ohne echte Marken. */
export const AD_SPOTS: readonly AdSpot[] = [
  {
    id: 'ad-1',
    title: 'Musterfirma Velohelme',
    subtitle: 'Sicher unterwegs in der Stadt',
    icon: '🚲',
    ctaText: 'Entdecken',
    durationSec: 30,
    skipOffsetSec: 10,
    themeColor: '#2E7D32',
  },
  {
    id: 'ad-2',
    title: 'Beispiel Café Bern',
    subtitle: 'Kaffee für die Wartezeit',
    icon: '☕',
    ctaText: 'Mehr erfahren',
    durationSec: 30,
    skipOffsetSec: 10,
    themeColor: '#1677C8',
  },
];

/** Verbleibende Sperrzeit in ms; 0 = Werbung darf erscheinen. */
export function remainingCooldownMs(
  lastShownMs: number | null,
  nowMs: number,
  cooldownMin = AD_COOLDOWN_MIN,
): number {
  if (!lastShownMs) return 0;
  return Math.max(0, cooldownMin * 60_000 - (nowMs - lastShownMs));
}

export function canShowAd(
  lastShownMs: number | null,
  nowMs: number,
  cooldownMin = AD_COOLDOWN_MIN,
): boolean {
  return remainingCooldownMs(lastShownMs, nowMs, cooldownMin) === 0;
}

export interface AdProgress {
  /** Fortschritt 0–100. */
  percent: number;
  /** Ganze Sekunden bis zum Überspringen; 0 = überspringbar. */
  secondsToSkip: number;
  canSkip: boolean;
  finished: boolean;
}

export function adProgress(
  elapsedSec: number,
  durationSec: number,
  skipOffsetSec: number,
): AdProgress {
  const toSkip = Math.max(0, skipOffsetSec - elapsedSec);
  return {
    percent: Math.min(100, Math.max(0, (elapsedSec / durationSec) * 100)),
    secondsToSkip: Math.ceil(toSkip),
    canSkip: toSkip === 0,
    finished: elapsedSec >= durationSec,
  };
}

export function parseTimestamp(raw: string | null): number | null {
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Prüft die Frequenzbegrenzung und merkt sich bei Erfolg den Zeitpunkt.
 * Ohne Speicherzugriff (privater Modus) erscheint die Werbung jedes Mal.
 */
export function claimAdBreak(nowMs = Date.now()): boolean {
  let last: number | null;
  try {
    last = parseTimestamp(localStorage.getItem(AD_STORAGE_KEY));
  } catch {
    return true;
  }
  if (!canShowAd(last, nowMs)) return false;
  try {
    localStorage.setItem(AD_STORAGE_KEY, String(nowMs));
  } catch {
    // Speicher nicht verfügbar: Werbung trotzdem zeigen.
  }
  return true;
}
