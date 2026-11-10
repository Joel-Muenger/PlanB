import initSqlJs, { type Database } from 'sql.js';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  AccountError,
  cancelPlus,
  hashPassword,
  isPlusActive,
  loginUser,
  migrate,
  registerUser,
  subscribePlus,
  validateCredentials,
} from './account';

let db: Database;

beforeEach(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  migrate(db);
});

describe('validateCredentials', () => {
  it('verlangt gültige E-Mail und mindestens 8 Zeichen', () => {
    expect(validateCredentials('kein-mail', 'langespasswort')).toMatch(/E-Mail/);
    expect(validateCredentials('a@b.ch', 'kurz')).toMatch(/8 Zeichen/);
    expect(validateCredentials(' A@B.ch ', 'langespasswort')).toBeNull();
  });
});

describe('hashPassword', () => {
  it('liefert mit gleichem Salt denselben Hash, mit neuem einen anderen', async () => {
    const first = await hashPassword('geheim123');
    const again = await hashPassword('geheim123', first.salt);
    const other = await hashPassword('geheim123');
    expect(again.hash).toBe(first.hash);
    expect(other.hash).not.toBe(first.hash);
    expect(first.hash).not.toContain('geheim');
  });
});

describe('Registrieren und Anmelden', () => {
  it('legt ein Konto an und meldet mit gleichem Passwort an', async () => {
    const user = await registerUser(db, 'Anna@Example.ch', 'passwort123');
    expect(user.email).toBe('anna@example.ch');
    expect(user.plusUntil).toBeNull();
    const again = await loginUser(db, 'anna@example.ch', 'passwort123');
    expect(again.id).toBe(user.id);
  });

  it('lehnt doppelte E-Mail und falsches Passwort ab', async () => {
    await registerUser(db, 'anna@example.ch', 'passwort123');
    await expect(registerUser(db, 'ANNA@example.ch', 'passwort456')).rejects.toThrow(AccountError);
    await expect(loginUser(db, 'anna@example.ch', 'falsch123')).rejects.toThrow(/falsch/);
    await expect(loginUser(db, 'niemand@example.ch', 'passwort123')).rejects.toThrow(/falsch/);
  });
});

describe('Abo', () => {
  const now = new Date('2026-11-10T12:00:00Z');

  it('ist nach Abschluss 30 Tage aktiv', async () => {
    const user = await registerUser(db, 'a@b.ch', 'passwort123');
    const plus = subscribePlus(db, user.id, now);
    expect(plus.plusUntil).toBe('2026-12-10T12:00:00.000Z');
    expect(isPlusActive(plus.plusUntil, now)).toBe(true);
    expect(isPlusActive(plus.plusUntil, new Date('2026-12-11T00:00:00Z'))).toBe(false);
  });

  it('verlängert ein laufendes Abo ab dessen Ende', async () => {
    const user = await registerUser(db, 'a@b.ch', 'passwort123');
    subscribePlus(db, user.id, now);
    const longer = subscribePlus(db, user.id, now);
    expect(longer.plusUntil).toBe('2027-01-09T12:00:00.000Z');
  });

  it('ist nach Kündigung nicht mehr aktiv', async () => {
    const user = await registerUser(db, 'a@b.ch', 'passwort123');
    subscribePlus(db, user.id, now);
    expect(isPlusActive(cancelPlus(db, user.id).plusUntil, now)).toBe(false);
  });

  it('gilt ohne Abo als inaktiv', () => {
    expect(isPlusActive(null)).toBe(false);
  });
});
