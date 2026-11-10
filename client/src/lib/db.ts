/*
 * SQLite im Browser (sql.js). Die Datenbank wird als Ganzes in IndexedDB
 * gespeichert und beim Start wieder geladen.
 */
import initSqlJs, { type Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { migrate } from './account';

const IDB_NAME = 'planb';
const IDB_STORE = 'sqlite';
const IDB_KEY = 'accounts.db';

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(IDB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadBytes(): Promise<Uint8Array | null> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const request = idb.transaction(IDB_STORE).objectStore(IDB_STORE).get(IDB_KEY);
    request.onsuccess = () => resolve((request.result as Uint8Array | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function saveBytes(bytes: Uint8Array): Promise<void> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(bytes, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let dbPromise: Promise<Database> | null = null;

/** Lädt die Datenbank einmalig (gespeicherter Stand oder neu). */
export function getDb(): Promise<Database> {
  dbPromise ??= (async () => {
    const SQL = await initSqlJs({ locateFile: () => wasmUrl });
    const bytes = await loadBytes().catch(() => null);
    const db = bytes ? new SQL.Database(bytes) : new SQL.Database();
    migrate(db);
    return db;
  })();
  return dbPromise;
}

/** Aktuellen Stand dauerhaft speichern (nach jeder Änderung aufrufen). */
export async function persistDb(): Promise<void> {
  const db = await getDb();
  await saveBytes(db.export());
}
