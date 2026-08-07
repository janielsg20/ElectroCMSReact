import type { CanonicalProject } from '../../project';

export interface RecoverySnapshot {
  id: string;
  projectId: string;
  createdAt: string;
  reason: 'autosave' | 'manual';
  project: CanonicalProject;
}

export interface RecoveryRepository {
  save(snapshot: RecoverySnapshot): Promise<void>;
  loadLatest(projectId: string): Promise<RecoverySnapshot | null>;
  list(projectId: string): Promise<RecoverySnapshot[]>;
  prune(projectId: string, keep: number): Promise<void>;
  clear(projectId: string): Promise<void>;
}
