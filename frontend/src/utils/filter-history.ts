/**
 * Filter History Storage using IndexedDB
 * Stores filter queries with hash-based deduplication
 * Supports multiple instances with prefix-based separation
 * Includes fallback to memory storage when IndexedDB is unavailable
 */

const DB_NAME = 'botcrud-filter-history';
const DB_VERSION = 2;
const STORE_NAME = 'filters';
const MAX_HISTORY = 100;

// Error codes for filter history operations
export enum FilterHistoryErrorCode {
  DB_UNAVAILABLE = 'DB_UNAVAILABLE',
  DB_OPEN_FAILED = 'DB_OPEN_FAILED',
  DB_CORRUPTED = 'DB_CORRUPTED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  UNKNOWN = 'UNKNOWN',
}

export class FilterHistoryError extends Error {
  code: FilterHistoryErrorCode;
  originalError?: unknown;

  constructor(message: string, code: FilterHistoryErrorCode, originalError?: unknown) {
    super(message);
    this.name = 'FilterHistoryError';
    this.code = code;
    this.originalError = originalError;
  }
}

export interface FilterHistoryItem {
  id: string; // prefix + hash of the query
  prefix: string; // store prefix (e.g., 'bots', 'workers')
  nlQuery: string; // natural language description
  queryBase64: string; // base64 encoded filter object
  createdDate: number; // timestamp for sorting
}

// In-memory fallback storage
const memoryStorage = new Map<string, FilterHistoryItem[]>();

// Track if IndexedDB is available and working
let indexedDBAvailable: boolean | null = null;
let dbConnectionFailed = false;

/**
 * Check if IndexedDB is available and working
 */
export async function isIndexedDBAvailable(): Promise<boolean> {
  if (indexedDBAvailable !== null) {
    return indexedDBAvailable;
  }

  // Check if indexedDB exists
  if (typeof indexedDB === 'undefined') {
    indexedDBAvailable = false;
    return false;
  }

  // Try to open a test database
  try {
    await new Promise<void>((resolve, reject) => {
      const testRequest = indexedDB.open('__test_db__', 1);
      testRequest.onerror = () => reject(testRequest.error);
      testRequest.onsuccess = () => {
        testRequest.result.close();
        indexedDB.deleteDatabase('__test_db__');
        resolve();
      };
      // Handle blocked state (another tab has the db open)
      testRequest.onblocked = () => reject(new Error('Database blocked'));
    });
    indexedDBAvailable = true;
    return true;
  } catch {
    indexedDBAvailable = false;
    return false;
  }
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
 * Determine error code from IndexedDB error
 */
function getErrorCode(error: unknown): FilterHistoryErrorCode {
  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError') {
      return FilterHistoryErrorCode.QUOTA_EXCEEDED;
    }
    if (error.name === 'InvalidStateError' || error.name === 'UnknownError') {
      return FilterHistoryErrorCode.DB_CORRUPTED;
    }
  }
  return FilterHistoryErrorCode.UNKNOWN;
}

/**
 * Open IndexedDB connection with error handling
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbConnectionFailed) {
      reject(new FilterHistoryError(
        'IndexedDB connection previously failed',
        FilterHistoryErrorCode.DB_UNAVAILABLE
      ));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      const code = getErrorCode(request.error);
      dbConnectionFailed = true;
      reject(new FilterHistoryError(
        `Failed to open database: ${request.error?.message || 'Unknown error'}`,
        code === FilterHistoryErrorCode.UNKNOWN ? FilterHistoryErrorCode.DB_OPEN_FAILED : code,
        request.error
      ));
    };

    request.onsuccess = () => resolve(request.result);

    request.onblocked = () => {
      reject(new FilterHistoryError(
        'Database is blocked by another connection',
        FilterHistoryErrorCode.DB_UNAVAILABLE
      ));
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Delete old store if exists (for migration)
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }

      // Create new store with prefix index
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('createdDate', 'createdDate', { unique: false });
      store.createIndex('prefix', 'prefix', { unique: false });
      store.createIndex('prefix_createdDate', ['prefix', 'createdDate'], { unique: false });
    };
  });
}

/**
 * Get memory storage for a prefix
 */
function getMemoryStorage(prefix: string): FilterHistoryItem[] {
  if (!memoryStorage.has(prefix)) {
    memoryStorage.set(prefix, []);
  }
  return memoryStorage.get(prefix)!;
}

/**
 * Save to memory storage (fallback)
 */
async function saveToMemory(
  nlQuery: string,
  filterObject: Record<string, unknown>,
  storePrefix: string
): Promise<void> {
  const queryBase64 = btoa(JSON.stringify(filterObject));
  const hash = await generateHash(queryBase64);
  const id = `${storePrefix}_${hash}`;

  const items = getMemoryStorage(storePrefix);

  // Remove existing entry with same id
  const existingIndex = items.findIndex(item => item.id === id);
  if (existingIndex !== -1) {
    items.splice(existingIndex, 1);
  }

  // Add new entry at the beginning
  items.unshift({
    id,
    prefix: storePrefix,
    nlQuery,
    queryBase64,
    createdDate: Date.now(),
  });

  // Limit to MAX_HISTORY
  if (items.length > MAX_HISTORY) {
    items.splice(MAX_HISTORY);
  }
}

/**
 * Save a filter to history
 * If hash already exists for the given prefix, removes and re-adds (to update timestamp)
 * Falls back to memory storage if IndexedDB is unavailable
 *
 * @param nlQuery - Natural language description of the filter
 * @param filterObject - The filter object to save
 * @param storePrefix - Prefix to separate different filter histories (default: 'bots')
 */
export async function saveFilterHistory(
  nlQuery: string,
  filterObject: Record<string, unknown>,
  storePrefix = 'bots'
): Promise<void> {
  // Check IndexedDB availability
  if (!(await isIndexedDBAvailable())) {
    await saveToMemory(nlQuery, filterObject, storePrefix);
    return;
  }

  const queryBase64 = btoa(JSON.stringify(filterObject));
  const hash = await generateHash(queryBase64);
  const id = `${storePrefix}_${hash}`;

  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Remove existing entry with same id (to re-add with new timestamp)
    await new Promise<void>((resolve, reject) => {
      const deleteRequest = store.delete(id);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });

    // Add new entry
    const item: FilterHistoryItem = {
      id,
      prefix: storePrefix,
      nlQuery,
      queryBase64,
      createdDate: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const addRequest = store.add(item);
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => {
        const code = getErrorCode(addRequest.error);
        reject(new FilterHistoryError(
          `Failed to save filter: ${addRequest.error?.message || 'Unknown error'}`,
          code === FilterHistoryErrorCode.UNKNOWN ? FilterHistoryErrorCode.TRANSACTION_FAILED : code,
          addRequest.error
        ));
      };
    });

    // Cleanup old entries if over limit for this prefix
    await cleanupOldEntries(store, storePrefix);

    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
  } catch (error) {
    // Fall back to memory storage on any error
    console.warn('IndexedDB save failed, using memory storage:', error);
    await saveToMemory(nlQuery, filterObject, storePrefix);
  } finally {
    if (db) {
      db.close();
    }
  }
}

/**
 * Remove entries beyond MAX_HISTORY limit for a specific prefix
 */
async function cleanupOldEntries(store: IDBObjectStore, storePrefix: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const index = store.index('prefix_createdDate');
    const range = IDBKeyRange.bound([storePrefix, 0], [storePrefix, Date.now()]);
    const request = index.openCursor(range, 'prev'); // newest first within prefix
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
 * Get all filter history items for a specific prefix, sorted by newest first
 * Falls back to memory storage if IndexedDB is unavailable
 *
 * @param storePrefix - Prefix to filter history by (default: 'bots')
 */
export async function getFilterHistory(storePrefix = 'bots'): Promise<FilterHistoryItem[]> {
  // Check IndexedDB availability
  if (!(await isIndexedDBAvailable())) {
    return getMemoryStorage(storePrefix);
  }

  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('prefix_createdDate');

    return await new Promise((resolve, reject) => {
      const items: FilterHistoryItem[] = [];
      const range = IDBKeyRange.bound([storePrefix, 0], [storePrefix, Date.now()]);
      const request = index.openCursor(range, 'prev'); // newest first within prefix

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          items.push(cursor.value);
          cursor.continue();
        } else {
          resolve(items);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB read failed, using memory storage:', error);
    return getMemoryStorage(storePrefix);
  } finally {
    if (db) {
      db.close();
    }
  }
}

/**
 * Delete a filter history item by ID
 * Falls back to memory storage if IndexedDB is unavailable
 */
export async function deleteFilterHistoryItem(id: string): Promise<void> {
  // Extract prefix from id (format: prefix_hash)
  const prefix = id.split('_')[0];

  // Check IndexedDB availability
  if (!(await isIndexedDBAvailable())) {
    const items = getMemoryStorage(prefix);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items.splice(index, 1);
    }
    return;
  }

  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB delete failed, using memory storage:', error);
    const items = getMemoryStorage(prefix);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items.splice(index, 1);
    }
  } finally {
    if (db) {
      db.close();
    }
  }
}

/**
 * Clear all filter history for a specific prefix
 * Falls back to memory storage if IndexedDB is unavailable
 *
 * @param storePrefix - Prefix to clear history for (default: 'bots')
 */
export async function clearFilterHistory(storePrefix = 'bots'): Promise<void> {
  // Check IndexedDB availability
  if (!(await isIndexedDBAvailable())) {
    memoryStorage.set(storePrefix, []);
    return;
  }

  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('prefix');

    await new Promise<void>((resolve, reject) => {
      const toDelete: string[] = [];
      const request = index.openCursor(IDBKeyRange.only(storePrefix));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          toDelete.push(cursor.value.id);
          cursor.continue();
        } else {
          // Delete all items with this prefix
          Promise.all(toDelete.map(id =>
            new Promise<void>((res, rej) => {
              const delReq = store.delete(id);
              delReq.onsuccess = () => res();
              delReq.onerror = () => rej(delReq.error);
            })
          )).then(() => resolve()).catch(reject);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB clear failed, using memory storage:', error);
    memoryStorage.set(storePrefix, []);
  } finally {
    if (db) {
      db.close();
    }
  }
}

/**
 * Attempt to recover from database corruption by deleting and recreating
 * Returns true if recovery was successful
 */
export async function recoverDatabase(): Promise<boolean> {
  try {
    // Reset the connection failed flag
    dbConnectionFailed = false;
    indexedDBAvailable = null;

    // Delete the database
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Database blocked during recovery'));
    });

    // Try to open again to recreate
    const db = await openDB();
    db.close();

    return true;
  } catch (error) {
    console.error('Database recovery failed:', error);
    dbConnectionFailed = true;
    return false;
  }
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
