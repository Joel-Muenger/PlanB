/*
 * Angemeldetes Konto für alle Seiten. Die Sitzung (inkl. Abo-Ende) liegt als
 * Kopie im localStorage, damit z. B. die Werbeentscheidung sofort und ohne
 * Laden der Datenbank möglich ist. Quelle der Wahrheit bleibt SQLite.
 */
import { useSyncExternalStore } from 'react';
import {
  cancelPlus,
  getUser,
  isPlusActive,
  loginUser,
  registerUser,
  subscribePlus,
  type AccountUser,
} from './account';
import { getDb, persistDb } from './db';

const SESSION_KEY = 'planb_session';
const listeners = new Set<() => void>();

function readSession(): AccountUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AccountUser) : null;
  } catch {
    return null;
  }
}

let current = readSession();

function setSession(user: AccountUser | null) {
  current = user;
  try {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ohne Speicher gilt die Sitzung nur bis zum Neuladen.
  }
  listeners.forEach((listener) => listener());
}

// Andere Tabs bzw. der iPhone-iframe melden Änderungen über das storage-Event.
window.addEventListener('storage', (event) => {
  if (event.key !== SESSION_KEY) return;
  current = readSession();
  listeners.forEach((listener) => listener());
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Für Stellen ausserhalb von React, z. B. die Werbeentscheidung. */
export function hasActivePlus(): boolean {
  return isPlusActive(current?.plusUntil);
}

export const accountActions = {
  async register(email: string, password: string) {
    const db = await getDb();
    const user = await registerUser(db, email, password);
    await persistDb();
    setSession(user);
  },
  async login(email: string, password: string) {
    const user = await loginUser(await getDb(), email, password);
    setSession(user);
  },
  logout() {
    setSession(null);
  },
  async subscribe() {
    if (!current) return;
    const user = subscribePlus(await getDb(), current.id);
    await persistDb();
    setSession(user);
  },
  async cancel() {
    if (!current) return;
    const user = cancelPlus(await getDb(), current.id);
    await persistDb();
    setSession(user);
  },
  /** Sitzung mit der Datenbank abgleichen (z. B. Konto gelöscht). */
  async refresh() {
    if (!current) return;
    setSession(getUser(await getDb(), current.id));
  },
};

export function useAccount() {
  const user = useSyncExternalStore(subscribe, () => current);
  return { user, plus: isPlusActive(user?.plusUntil), ...accountActions };
}
