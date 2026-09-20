import initSqlJs, { Database } from 'sql.js';
import { CREATE_TABLES_SQL } from './schema';

const DB_STORAGE_KEY = 'inventory_db';
const DB_WASM_URL = 'https://sql.js.org/dist/sql-wasm.wasm';

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

function saveToIndexedDB(data: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('InventoryDB', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      store.put(data, DB_STORAGE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

function loadFromIndexedDB(): Promise<Uint8Array | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('InventoryDB', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const getReq = store.get(DB_STORAGE_KEY);
      getReq.onsuccess = () => resolve(getReq.result ?? null);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

async function initializeDatabase(): Promise<Database> {
  const SQL = await initSqlJs({ locateFile: () => DB_WASM_URL });

  const savedData = await loadFromIndexedDB();

  let db: Database;
  if (savedData) {
    db = new SQL.Database(savedData);
  } else {
    db = new SQL.Database();
    db.run(CREATE_TABLES_SQL);
    await persistDatabase(db);
  }

  return db;
}

export async function persistDatabase(db: Database): Promise<void> {
  const data = db.export();
  await saveToIndexedDB(data);
}

export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;
  initPromise = initializeDatabase().then((db) => {
    dbInstance = db;
    return db;
  });
  return initPromise;
}

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  db.close();
  dbInstance = null;
  initPromise = null;
  const request = indexedDB.deleteDatabase('InventoryDB');
  await new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
