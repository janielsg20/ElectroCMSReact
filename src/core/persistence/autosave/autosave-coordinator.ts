import { PersistenceError } from '../../domain';
import type { CanonicalProject } from '../../project';
import type { ProjectRepository } from '../project-repository';
import type { RecoveryRepository, RecoverySnapshot } from '../recovery/recovery-repository';

export interface AutosaveScheduler {
  set(delayMs: number, callback: () => void): unknown;
  clear(handle: unknown): void;
}

const defaultScheduler: AutosaveScheduler = {
  set: (delayMs, callback) => globalThis.setTimeout(callback, delayMs),
  clear: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export interface AutosaveCoordinatorOptions {
  debounceMs?: number;
  maxRecoverySnapshots?: number;
  scheduler?: AutosaveScheduler;
  now?: () => string;
  onSaving?: (project: CanonicalProject) => void;
  onSaved?: (project: CanonicalProject) => void;
  onError?: (error: Error) => void;
}

export class AutosaveCoordinator {
  private pending: CanonicalProject | null = null;
  private timer: unknown | null = null;
  private inFlight: Promise<void> | null = null;
  private lastError: Error | null = null;
  private readonly lastPersistedRevision = new Map<string, number>();
  private readonly debounceMs: number;
  private readonly maxRecoverySnapshots: number;
  private readonly scheduler: AutosaveScheduler;
  private readonly now: () => string;
  private readonly onSaving: (project: CanonicalProject) => void;
  private readonly onSaved: (project: CanonicalProject) => void;
  private readonly onError: (error: Error) => void;

  constructor(
    private readonly projects: ProjectRepository,
    private readonly recovery: RecoveryRepository,
    options: AutosaveCoordinatorOptions = {},
  ) {
    this.debounceMs = options.debounceMs ?? 750;
    this.maxRecoverySnapshots = options.maxRecoverySnapshots ?? 5;
    this.scheduler = options.scheduler ?? defaultScheduler;
    this.now = options.now ?? (() => new Date().toISOString());
    this.onSaving = options.onSaving ?? (() => undefined);
    this.onSaved = options.onSaved ?? (() => undefined);
    this.onError = options.onError ?? (() => undefined);
  }

  queue(project: CanonicalProject): void {
    this.pending = structuredClone(project);
    if (this.timer !== null) this.scheduler.clear(this.timer);
    this.timer = this.scheduler.set(this.debounceMs, () => {
      this.timer = null;
      void this.flush().catch((error: unknown) => {
        const normalized =
          error instanceof Error
            ? error
            : new PersistenceError('Autosave failed.', { cause: error });
        this.lastError = normalized;
        this.onError(normalized);
      });
    });
  }

  getLastError(): Error | null {
    return this.lastError;
  }

  async recoverLatest(projectId: string): Promise<CanonicalProject | null> {
    const snapshot = await this.recovery.loadLatest(projectId);
    return snapshot ? structuredClone(snapshot.project) : null;
  }

  async flush(): Promise<void> {
    if (this.timer !== null) {
      this.scheduler.clear(this.timer);
      this.timer = null;
    }

    if (this.inFlight) {
      await this.inFlight;
    }

    const pending = this.pending;
    if (!pending) return;
    this.pending = null;

    this.inFlight = this.persist(pending);
    try {
      await this.inFlight;
      this.lastError = null;
    } catch (error) {
      if (!this.pending) this.pending = pending;
      throw error;
    } finally {
      this.inFlight = null;
    }

    if (this.pending) await this.flush();
  }

  dispose(): void {
    if (this.timer !== null) this.scheduler.clear(this.timer);
    this.timer = null;
  }

  private async persist(project: CanonicalProject): Promise<void> {
    const timestamp = this.now();
    const nextProject = structuredClone(project);
    const knownRevision = this.lastPersistedRevision.get(nextProject.id) ?? -1;
    const baseRevision = Math.max(nextProject.historyMetadata.revision, knownRevision);
    nextProject.metadata.updatedAt = timestamp;
    nextProject.historyMetadata = {
      ...nextProject.historyMetadata,
      revision: baseRevision + 1,
      lastSavedAt: timestamp,
    };

    const snapshot: RecoverySnapshot = {
      id: `${nextProject.id}:${timestamp}:${nextProject.historyMetadata.revision}`,
      projectId: nextProject.id,
      createdAt: timestamp,
      reason: 'autosave',
      project: structuredClone(nextProject),
    };

    this.onSaving(structuredClone(nextProject));
    try {
      await this.recovery.save(snapshot);
      await this.projects.save(nextProject);
      await this.recovery.prune(nextProject.id, this.maxRecoverySnapshots);
      this.lastPersistedRevision.set(nextProject.id, nextProject.historyMetadata.revision);
      this.onSaved(structuredClone(nextProject));
    } catch (error) {
      const normalized =
        error instanceof Error
          ? error
          : new PersistenceError('Autosave failed.', { cause: error });
      this.onError(normalized);
      throw normalized;
    }
  }
}
