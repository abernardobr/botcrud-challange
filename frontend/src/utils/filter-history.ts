/**
 * Filter History Storage using IndexedDB
 * Stores filter queries with hash-based deduplication
 */

const DB_NAME = 'botcrud-filter-history';
const DB_VERSION = 1;
const STORE_NAME = 'filters';
const MAX_HISTORY = 100;

export interface FilterHistoryItem {
  id: string; // hash of the query
  nlQuery: string; // natural language description
  queryBase64: string; // base64 encoded filter object
  createdDate: number; // timestamp for sorting
}

/**
 * Generate a hash from the filter query for deduplication
 */
async function generateHash(queryBase64: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(queryBase64);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdDate', 'createdDate', { unique: false });
      }
    };
  });
}

/**
 * Save a filter to history
 * If hash already exists, removes and re-adds (to update timestamp)
 */
export async function saveFilterHistory(
  nlQuery: string,
  filterObject: Record<string, unknown>
): Promise<void> {
  const queryBase64 = btoa(JSON.stringify(filterObject));
  const hash = await generateHash(queryBase64);

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  // Remove existing entry with same hash (to re-add with new timestamp)
  await new Promise<void>((resolve, reject) => {
    const deleteRequest = store.delete(hash);
    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () => reject(deleteRequest.error);
  });

  // Add new entry
  const item: FilterHistoryItem = {
    id: hash,
    nlQuery,
    queryBase64,
    createdDate: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const addRequest = store.add(item);
    addRequest.onsuccess = () => resolve();
    addRequest.onerror = () => reject(addRequest.error);
  });

  // Cleanup old entries if over limit
  await cleanupOldEntries(store);

  await new Promise<void>((resolve) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
  });
}

/**
 * Remove entries beyond MAX_HISTORY limit
 */
async function cleanupOldEntries(store: IDBObjectStore): Promise<void> {
  return new Promise((resolve, reject) => {
    const index = store.index('createdDate');
    const request = index.openCursor(null, 'prev'); // newest first
    let count = 0;
    const toDelete: string[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        count++;
        if (count > MAX_HISTORY) {
          toDelete.push(cursor.value.id);
        }
        cursor.continue();
      } else {
        // Delete old entries
        toDelete.forEach(id => store.delete(id));
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all filter history items, sorted by newest first
 */
export async function getFilterHistory(): Promise<FilterHistoryItem[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('createdDate');

  return new Promise((resolve, reject) => {
    const items: FilterHistoryItem[] = [];
    const request = index.openCursor(null, 'prev'); // newest first

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        items.push(cursor.value);
        cursor.continue();
      } else {
        db.close();
        resolve(items);
      }
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Delete a filter history item by ID
 */
export async function deleteFilterHistoryItem(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Clear all filter history
 */
export async function clearFilterHistory(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Decode the queryBase64 back to a filter object
 */
export function decodeFilterQuery(queryBase64: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(queryBase64));
  } catch {
    return {};
  }
}
