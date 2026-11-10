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

let sqlPromise: ReturnType<typeof initSqlJs> | null = null;

/**
 * Führt eine Aktion auf dem aktuellen gespeicherten Stand aus. Die Datenbank wird
 * jedes Mal frisch aus IndexedDB geladen und bei `write` sofort zurückgeschrieben.
 * So überschreiben sich mehrere Fenster (Tabs, iPhone-Vorschau im iframe) nicht
 * gegenseitig mit veralteten Kopien.
 */
export async function withDb<T>(
  action: (db: Database) => T | Promise<T>,
  { write = false } = {},
): Promise<T> {
  sqlPromise ??= initSqlJs({ locateFile: () => wasmUrl });
  const SQL = await sqlPromise;
  const bytes = await loadBytes().catch(() => null);
  const db = bytes ? new SQL.Database(bytes) : new SQL.Database();
  try {
    migrate(db);
    const result = await action(db);
    if (write) await saveBytes(db.export());
    return result;
  } finally {
    db.close();
  }
}
