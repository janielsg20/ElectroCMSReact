import { PersistenceError } from '../../domain';
import type { RecoveryRepository, RecoverySnapshot } from '../recovery/recovery-repository';
import {
  DEFAULT_ELECTROCMS_DB_NAME,
  RECOVERY_STORE,
  openElectroCmsDatabase,
  requestToPromise,
  transactionDone,
} from './database';

function newestFirst(left: RecoverySnapshot, right: RecoverySnapshot): number {
  return right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id);
}

export class IndexedDbRecoveryRepository implements RecoveryRepository {
  constructor(
    private readonly indexedDbFactory: IDBFactory = globalThis.indexedDB,
    private readonly databaseName = DEFAULT_ELECTROCMS_DB_NAME,
  ) {}

  private async readAll(projectId: string): Promise<RecoverySnapshot[]> {
    const database = await openElectroCmsDatabase(this.indexedDbFactory, this.databaseName);
    try {
      const transaction = database.transaction(RECOVERY_STORE, 'readonly');
      const index = transaction.objectStore(RECOVERY_STORE).index('projectId');
      const snapshots = await requestToPromise(index.getAll(projectId));
      await transactionDone(transaction);
      return (snapshots as RecoverySnapshot[]).sort(newestFirst).map((snapshot) => structuredClone(snapshot));
    } finally {
      database.close();
    }
  }

  async save(snapshot: RecoverySnapshot): Promise<void> {
    try {
      const database = await openElectroCmsDatabase(this.indexedDbFactory, this.databaseName);
      try {
        const transaction = database.transaction(RECOVERY_STORE, 'readwrite');
        transaction.objectStore(RECOVERY_STORE).put(structuredClone(snapshot));
        await transactionDone(transaction);
      } finally {
        database.close();
      }
    } catch (error) {
      throw new PersistenceError('Unable to save recovery snapshot.', { cause: error });
    }
  }

  async loadLatest(projectId: string): Promise<RecoverySnapshot | null> {
    const [latest] = await this.readAll(projectId);
    return latest ?? null;
  }

  async list(projectId: string): Promise<RecoverySnapshot[]> {
    return this.readAll(projectId);
  }

  async prune(projectId: string, keep: number): Promise<void> {
    const snapshots = await this.readAll(projectId);
    const stale = snapshots.slice(Math.max(0, keep));
    if (stale.length === 0) return;

    const database = await openElectroCmsDatabase(this.indexedDbFactory, this.databaseName);
    try {
      const transaction = database.transaction(RECOVERY_STORE, 'readwrite');
      const store = transaction.objectStore(RECOVERY_STORE);
      for (const snapshot of stale) store.delete(snapshot.id);
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  }

  async clear(projectId: string): Promise<void> {
    const snapshots = await this.readAll(projectId);
    if (snapshots.length === 0) return;

    const database = await openElectroCmsDatabase(this.indexedDbFactory, this.databaseName);
    try {
      const transaction = database.transaction(RECOVERY_STORE, 'readwrite');
      const store = transaction.objectStore(RECOVERY_STORE);
      for (const snapshot of snapshots) store.delete(snapshot.id);
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  }
}
