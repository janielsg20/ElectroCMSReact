import { ConflictError, PersistenceError } from '../../domain';
import { assertCanonicalProject, type CanonicalProject, type ProjectSummary } from '../../project';
import type { ProjectHydrator, ProjectRepository } from '../project-repository';
import {
  DEFAULT_ELECTROCMS_DB_NAME,
  PROJECTS_STORE,
  openElectroCmsDatabase,
  requestToPromise,
  transactionDone,
} from './database';

function toSummary(project: CanonicalProject): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    version: project.version,
    schemaVersion: project.schemaVersion,
    updatedAt: project.metadata.updatedAt,
  };
}

function normalizePersistenceError(error: unknown, operation: string): Error {
  if (error instanceof Error && error.name === 'ConstraintError') {
    return new ConflictError(`IndexedDB ${operation} conflicted with an existing record.`, { cause: error });
  }
  if (error instanceof ConflictError || error instanceof PersistenceError) return error;
  return new PersistenceError(`IndexedDB ${operation} failed.`, { cause: error });
}

export class IndexedDbProjectRepository implements ProjectRepository {
  constructor(
    private readonly indexedDbFactory: IDBFactory = globalThis.indexedDB,
    private readonly databaseName = DEFAULT_ELECTROCMS_DB_NAME,
    private readonly hydrate: ProjectHydrator = assertCanonicalProject,
  ) {}

  async create(project: CanonicalProject): Promise<void> {
    assertCanonicalProject(project);
    try {
      const database = await openElectroCmsDatabase(this.indexedDbFactory, this.databaseName);
      try {
        const transaction = database.transaction(PROJECTS_STORE, 'readwrite');
        transaction.objectStore(PROJECTS_STORE).add(structuredClone(project));
        await transactionDone(transaction);
      } finally {
        database.close();
      }
    } catch (error) {
      throw normalizePersistenceError(error, 'create');
    }
  }

  async save(project: CanonicalProject): Promise<void> {
    assertCanonicalProject(project);
    try {
      const database = await openElectroCmsDatabase(this.indexedDbFactory, this.databaseName);
      try {
        const transaction = database.transaction(PROJECTS_STORE, 'readwrite');
        transaction.objectStore(PROJECTS_STORE).put(structuredClone(project));
        await transactionDone(transaction);
      } finally {
        database.close();
      }
    } catch (error) {
      throw normalizePersistenceError(error, 'save');
    }
  }

  async load(projectId: string): Promise<CanonicalProject | null> {
    try {
      const database = await openElectroCmsDatabase(this.indexedDbFactory, this.databaseName);
      try {
        const transaction = database.transaction(PROJECTS_STORE, 'readonly');
        const payload = await requestToPromise(transaction.objectStore(PROJECTS_STORE).get(projectId));
        await transactionDone(transaction);
        return payload === undefined ? null : structuredClone(this.hydrate(payload));
      } finally {
        database.close();
      }
    } catch (error) {
      throw normalizePersistenceError(error, 'load');
    }
  }

  async list(): Promise<ProjectSummary[]> {
    try {
      const database = await openElectroCmsDatabase(this.indexedDbFactory, this.databaseName);
      try {
        const transaction = database.transaction(PROJECTS_STORE, 'readonly');
        const payloads = await requestToPromise(transaction.objectStore(PROJECTS_STORE).getAll());
        await transactionDone(transaction);
        return payloads
          .map((payload) => toSummary(this.hydrate(payload)))
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id));
      } finally {
        database.close();
      }
    } catch (error) {
      throw normalizePersistenceError(error, 'list');
    }
  }

  async delete(projectId: string): Promise<boolean> {
    try {
      const existing = await this.load(projectId);
      if (!existing) return false;

      const database = await openElectroCmsDatabase(this.indexedDbFactory, this.databaseName);
      try {
        const transaction = database.transaction(PROJECTS_STORE, 'readwrite');
        transaction.objectStore(PROJECTS_STORE).delete(projectId);
        await transactionDone(transaction);
        return true;
      } finally {
        database.close();
      }
    } catch (error) {
      throw normalizePersistenceError(error, 'delete');
    }
  }
}
