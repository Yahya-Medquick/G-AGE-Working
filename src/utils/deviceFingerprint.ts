import FingerprintJS from '@fingerprintjs/fingerprintjs';

const STORAGE_KEY = 'gage_device_id';
const LEGACY_STORAGE_KEY = 'bifrost_device_id';
const DB_NAME = 'gage_device_db';
const STORE_NAME = 'device_store';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable in current environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getStoredIdFromIndexedDB(): Promise<string | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STORAGE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setStoredIdInIndexedDB(id: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(id, STORAGE_KEY);
  } catch {
    // Ignore IndexedDB store failure
  }
}

let cachedDeviceId: string | null = null;

/**
 * On first app load generate a persistent device ID using FingerprintJS.
 * Store it simultaneously in localStorage and IndexedDB so it survives individual storage clears.
 */
export async function initPersistentDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  let localId = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  let idbId = await getStoredIdFromIndexedDB();

  let finalId = localId || idbId;

  if (!finalId) {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      finalId = result.visitorId;
    } catch (e) {
      console.warn('[FingerprintJS] Fallback ID generation:', e);
      finalId = `dev-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)}`;
    }
  }

  if (finalId) {
    localStorage.setItem(STORAGE_KEY, finalId);
    await setStoredIdInIndexedDB(finalId);
    cachedDeviceId = finalId;
  }

  return finalId || 'dev-default';
}

/**
 * Synchronous/cached device ID accessor
 */
export function getOrCreateDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;

  const localId = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if (localId) {
    cachedDeviceId = localId;
    localStorage.setItem(STORAGE_KEY, localId);
    getStoredIdFromIndexedDB().then((idbId) => {
      if (!idbId) setStoredIdInIndexedDB(localId);
    }).catch(() => {});
    return localId;
  }

  // Trigger async load
  initPersistentDeviceId().catch(() => {});
  return 'dev-pending';
}
