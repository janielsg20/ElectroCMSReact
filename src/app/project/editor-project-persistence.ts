import {
  AutosaveCoordinator,
  IndexedDbProjectRepository,
  IndexedDbRecoveryRepository,
  type AutosaveCoordinatorOptions,
  type ProjectRepository,
  type RecoveryRepository,
} from '../../core/persistence';
import type { CanonicalProject } from '../../core/project';

export type EditorPersistenceState = 'saving' | 'saved' | 'error';

export interface EditorPersistenceEvent {
  state: EditorPersistenceState;
  project?: CanonicalProject;
  error?: Error;
}

export type EditorPersistenceListener = (event: EditorPersistenceEvent) => void;

export interface EditorProjectPersistenceOptions {
  debounceMs?: number;
  maxRecoverySnapshots?: number;
  now?: () => string;
}

function compareFreshness(left: CanonicalProject, right: CanonicalProject): number {
  const revisionDifference = left.historyMetadata.revision - right.historyMetadata.revision;
  if (revisionDifference !== 0) return revisionDifference;
  return left.metadata.updatedAt.localeCompare(right.metadata.updatedAt);
}

export class EditorProjectPersistence {
  private readonly listeners = new Set<EditorPersistenceListener>();
  private readonly autosave: AutosaveCoordinator;

  constructor(
    private readonly projects: ProjectRepository,
    recovery: RecoveryRepository,
    options: EditorProjectPersistenceOptions = {},
  ) {
    const coordinatorOptions: AutosaveCoordinatorOptions = {
      ...(options.debounceMs === undefined ? {} : { debounceMs: options.debounceMs }),
      ...(options.maxRecoverySnapshots === undefined
        ? {}
        : { maxRecoverySnapshots: options.maxRecoverySnapshots }),
      ...(options.now === undefined ? {} : { now: options.now }),
      onSaving: (project) => this.emit({ state: 'saving', project }),
      onSaved: (project) => this.emit({ state: 'saved', project }),
      onError: (error) => this.emit({ state: 'error', error }),
    };
    this.autosave = new AutosaveCoordinator(projects, recovery, coordinatorOptions);
  }

  subscribe(listener: EditorPersistenceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async hydrate(fallback: CanonicalProject): Promise<CanonicalProject> {
    const [persisted, recovery] = await Promise.all([
      this.projects.load(fallback.id),
      this.autosave.recoverLatest(fallback.id),
    ]);
    const candidates = [persisted, recovery].filter(
      (candidate): candidate is CanonicalProject => candidate !== null,
    );
    if (candidates.length === 0) return structuredClone(fallback);
    const newest = candidates.reduce((best, candidate) =>
      compareFreshness(candidate, best) > 0 ? candidate : best,
    );
    return structuredClone(newest);
  }

  queue(project: CanonicalProject): void {
    this.autosave.queue(project);
  }

  async flush(): Promise<void> {
    await this.autosave.flush();
  }

  dispose(): void {
    this.autosave.dispose();
    this.listeners.clear();
  }

  private emit(event: EditorPersistenceEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}

export function createBrowserEditorProjectPersistence(
  options: EditorProjectPersistenceOptions = {},
): EditorProjectPersistence | null {
  if (!globalThis.indexedDB) return null;
  return new EditorProjectPersistence(
    new IndexedDbProjectRepository(globalThis.indexedDB),
    new IndexedDbRecoveryRepository(globalThis.indexedDB),
    options,
  );
}
