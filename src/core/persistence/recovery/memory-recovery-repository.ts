import type { RecoveryRepository, RecoverySnapshot } from './recovery-repository';

function cloneSnapshot(snapshot: RecoverySnapshot): RecoverySnapshot {
  return structuredClone(snapshot);
}

function newestFirst(left: RecoverySnapshot, right: RecoverySnapshot): number {
  return right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id);
}

export class MemoryRecoveryRepository implements RecoveryRepository {
  private readonly snapshots = new Map<string, RecoverySnapshot>();

  async save(snapshot: RecoverySnapshot): Promise<void> {
    this.snapshots.set(snapshot.id, cloneSnapshot(snapshot));
  }

  async loadLatest(projectId: string): Promise<RecoverySnapshot | null> {
    const [latest] = await this.list(projectId);
    return latest ?? null;
  }

  async list(projectId: string): Promise<RecoverySnapshot[]> {
    return [...this.snapshots.values()]
      .filter((snapshot) => snapshot.projectId === projectId)
      .sort(newestFirst)
      .map(cloneSnapshot);
  }

  async prune(projectId: string, keep: number): Promise<void> {
    const snapshots = await this.list(projectId);
    for (const snapshot of snapshots.slice(Math.max(0, keep))) {
      this.snapshots.delete(snapshot.id);
    }
  }

  async clear(projectId: string): Promise<void> {
    for (const [snapshotId, snapshot] of this.snapshots) {
      if (snapshot.projectId === projectId) this.snapshots.delete(snapshotId);
    }
  }
}
