// @vitest-environment node
import { indexedDB as fakeIndexedDb } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../../project';
import { PROJECTS_STORE, openElectroCmsDatabase, transactionDone } from './database';
import { IndexedDbProjectRepository } from './indexeddb-project-repository';

function makeProject(id: string, name: string) {
  return createCanonicalProject({
    id,
    name,
    now: '2026-08-07T20:00:00.000Z',
    randomUuid: (() => {
      let sequence = 0;
      return () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
    })(),
  });
}

async function putRawProject(databaseName: string, payload: object): Promise<void> {
  const database = await openElectroCmsDatabase(fakeIndexedDb, databaseName);
  try {
    const transaction = database.transaction(PROJECTS_STORE, 'readwrite');
    transaction.objectStore(PROJECTS_STORE).put(payload);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

describe('IndexedDbProjectRepository', () => {
  it('persists project CRUD transactionally through IndexedDB', async () => {
    const databaseName = `electrocms-test-${crypto.randomUUID()}`;
    const repository = new IndexedDbProjectRepository(fakeIndexedDb, databaseName);
    const value = makeProject('project_indexeddb', 'IndexedDB Demo');

    await repository.create(value);
    expect((await repository.load(value.id))?.name).toBe('IndexedDB Demo');

    value.name = 'IndexedDB Updated';
    value.metadata.updatedAt = '2026-08-07T21:00:00.000Z';
    await repository.save(value);

    expect(await repository.list()).toEqual([
      expect.objectContaining({ id: value.id, name: 'IndexedDB Updated' }),
    ]);
    expect(await repository.delete(value.id)).toBe(true);
    expect(await repository.load(value.id)).toBeNull();

    fakeIndexedDb.deleteDatabase(databaseName);
  });

  it('prevents duplicate create from silently overwriting data', async () => {
    const databaseName = `electrocms-test-${crypto.randomUUID()}`;
    const repository = new IndexedDbProjectRepository(fakeIndexedDb, databaseName);
    const value = makeProject('project_duplicate', 'Original');

    await repository.create(value);
    await expect(repository.create(value)).rejects.toMatchObject({ code: 'CONFLICT' });

    fakeIndexedDb.deleteDatabase(databaseName);
  });

  it('migrates a persisted legacy v0 payload before exposing it as editable project data', async () => {
    const databaseName = `electrocms-test-${crypto.randomUUID()}`;
    const repository = new IndexedDbProjectRepository(fakeIndexedDb, databaseName);
    const legacy = {
      schemaVersion: 0,
      id: 'project_legacy_indexeddb',
      name: 'Legacy IndexedDB',
      version: '0.0.9',
      createdAt: '2026-07-31T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    await putRawProject(databaseName, legacy);
    const migrated = await repository.load(legacy.id);

    expect(migrated).not.toBeNull();
    expect(migrated).toMatchObject({
      schemaVersion: 1,
      id: legacy.id,
      name: legacy.name,
      version: legacy.version,
      metadata: { updatedAt: legacy.updatedAt },
    });
    expect(migrated?.documentOrder).toHaveLength(1);

    fakeIndexedDb.deleteDatabase(databaseName);
  });

  it('preserves migration diagnostics when persisted data uses an unsupported future schema', async () => {
    const databaseName = `electrocms-test-${crypto.randomUUID()}`;
    const repository = new IndexedDbProjectRepository(fakeIndexedDb, databaseName);
    const future = {
      schemaVersion: 99,
      id: 'project_future_indexeddb',
      name: 'Future IndexedDB',
    };

    await putRawProject(databaseName, future);

    await expect(repository.load(future.id)).rejects.toMatchObject({ code: 'MIGRATION_ERROR' });

    fakeIndexedDb.deleteDatabase(databaseName);
  });
});
