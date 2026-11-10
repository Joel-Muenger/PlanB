/*
 * Konto und Abo „Plan B Plus“ (Demo). Reine Logik gegen eine SQLite-Datenbank
 * (sql.js); Laden und Speichern der Datenbank übernimmt `db.ts`.
 *
 * Achtung: Alles liegt im Browser. Das ist ein Demo-Login, kein sicheres
 * Accountsystem – dafür bräuchte es einen Server.
 */
import type { Database } from 'sql.js';

export const PLUS_PRICE_CHF = 2.9;
export const PLUS_PERIOD_DAYS = 30;
export const MIN_PASSWORD_LENGTH = 8;
const PBKDF2_ITERATIONS = 100_000;

export interface AccountUser {
  id: number;
  email: string;
  /** ISO-Zeitpunkt, bis zu dem das Abo läuft; null = kein Abo. */
  plusUntil: string | null;
}

export class AccountError extends Error {}

export function migrate(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL,
      plus_until TEXT
    )
  `);
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Fehlermeldung für die Eingaben oder null, wenn alles passt. */
export function validateCredentials(email: string, password: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))) {
    return 'Bitte eine gültige E-Mail-Adresse eingeben.';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Das Passwort braucht mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`;
  }
  return null;
}

export function isPlusActive(plusUntil: string | null | undefined, now = new Date()): boolean {
  return !!plusUntil && new Date(plusUntil).getTime() > now.getTime();
}

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const fromHex = (hex: string) =>
  new Uint8Array(hex.match(/.{2}/g)?.map((h) => Number.parseInt(h, 16)) ?? []);

/** PBKDF2-SHA-256; ohne Salt wird ein neues erzeugt. */
export async function hashPassword(
  password: string,
  saltHex?: string,
): Promise<{ hash: string; salt: string }> {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return { hash: toHex(new Uint8Array(bits)), salt: toHex(salt) };
}

function findUser(db: Database, where: string, value: string | number) {
  const stmt = db.prepare(
    `SELECT id, email, password_hash, salt, plus_until FROM users WHERE ${where} = ?`,
  );
  try {
    stmt.bind([value]);
    if (!stmt.step()) return null;
    const row = stmt.getAsObject();
    return {
      user: {
        id: Number(row.id),
        email: String(row.email),
        plusUntil: row.plus_until === null ? null : String(row.plus_until),
      } satisfies AccountUser,
      hash: String(row.password_hash),
      salt: String(row.salt),
    };
  } finally {
    stmt.free();
  }
}

export async function registerUser(
  db: Database,
  email: string,
  password: string,
  now = new Date(),
): Promise<AccountUser> {
  const invalid = validateCredentials(email, password);
  if (invalid) throw new AccountError(invalid);
  const normalized = normalizeEmail(email);
  if (findUser(db, 'email', normalized)) {
    throw new AccountError('Mit dieser E-Mail gibt es schon ein Konto.');
  }
  const { hash, salt } = await hashPassword(password);
  db.run('INSERT INTO users (email, password_hash, salt, created_at) VALUES (?, ?, ?, ?)', [
    normalized,
    hash,
    salt,
    now.toISOString(),
  ]);
  return findUser(db, 'email', normalized)!.user;
}

export async function loginUser(
  db: Database,
  email: string,
  password: string,
): Promise<AccountUser> {
  const found = findUser(db, 'email', normalizeEmail(email));
  // Gleiche Meldung für unbekannte E-Mail und falsches Passwort.
  const wrong = new AccountError('E-Mail oder Passwort ist falsch.');
  if (!found) throw wrong;
  const { hash } = await hashPassword(password, found.salt);
  if (hash !== found.hash) throw wrong;
  return found.user;
}

export function getUser(db: Database, id: number): AccountUser | null {
  return findUser(db, 'id', id)?.user ?? null;
}

/** Abo abschliessen oder verlängern: +30 Tage ab Ende des laufenden Abos bzw. ab jetzt. */
export function subscribePlus(db: Database, id: number, now = new Date()): AccountUser {
  const user = getUser(db, id);
  if (!user) throw new AccountError('Konto nicht gefunden.');
  const start = isPlusActive(user.plusUntil, now) ? new Date(user.plusUntil!) : now;
  const until = new Date(start.getTime() + PLUS_PERIOD_DAYS * 86_400_000);
  db.run('UPDATE users SET plus_until = ? WHERE id = ?', [until.toISOString(), id]);
  return { ...user, plusUntil: until.toISOString() };
}

export function cancelPlus(db: Database, id: number): AccountUser {
  const user = getUser(db, id);
  if (!user) throw new AccountError('Konto nicht gefunden.');
  db.run('UPDATE users SET plus_until = NULL WHERE id = ?', [id]);
  return { ...user, plusUntil: null };
}
