// @vitest-environment node
import { indexedDB as fakeIndexedDb } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../../project';
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
});
