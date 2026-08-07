import { PersistenceError } from '../../domain';

export const DEFAULT_ELECTROCMS_DB_NAME = 'electrocms';
export const ELECTROCMS_DB_VERSION = 1;
export const PROJECTS_STORE = 'projects';
export const RECOVERY_STORE = 'recoverySnapshots';

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new PersistenceError('IndexedDB request failed.'));
  });
}

export function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new PersistenceError('IndexedDB transaction aborted.'));
  });
}

export function openElectroCmsDatabase(
  indexedDbFactory: IDBFactory,
  databaseName = DEFAULT_ELECTROCMS_DB_NAME,
): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDbFactory.open(databaseName, ELECTROCMS_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PROJECTS_STORE)) {
        const store = database.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
        store.createIndex('updatedAt', 'metadata.updatedAt', { unique: false });
      }
      if (!database.objectStoreNames.contains(RECOVERY_STORE)) {
        const store = database.createObjectStore(RECOVERY_STORE, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('projectIdCreatedAt', ['projectId', 'createdAt'], { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new PersistenceError('Unable to open ElectroCMS IndexedDB.'));
    request.onblocked = () => reject(new PersistenceError('ElectroCMS IndexedDB upgrade is blocked by another tab.'));
  });
}
