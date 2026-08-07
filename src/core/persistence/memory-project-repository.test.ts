import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import { MemoryProjectRepository } from './memory-project-repository';

function project(name: string, id: string, updatedAt: string) {
  return createCanonicalProject({
    id,
    name,
    now: updatedAt,
    randomUuid: (() => {
      let sequence = 0;
      return () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
    })(),
  });
}

describe('MemoryProjectRepository', () => {
  it('creates, loads, lists, saves and deletes without leaking mutable references', async () => {
    const repository = new MemoryProjectRepository();
    const alpha = project('Alpha', 'project_alpha', '2026-08-07T20:00:00.000Z');
    const beta = project('Beta', 'project_beta', '2026-08-07T21:00:00.000Z');

    await repository.create(alpha);
    await repository.create(beta);

    const loaded = await repository.load(alpha.id);
    expect(loaded?.name).toBe('Alpha');
    if (!loaded) throw new Error('Expected project.');
    loaded.name = 'Mutated outside repository';
    expect((await repository.load(alpha.id))?.name).toBe('Alpha');

    expect((await repository.list()).map((entry) => entry.id)).toEqual(['project_beta', 'project_alpha']);

    alpha.name = 'Alpha 2';
    await repository.save(alpha);
    expect((await repository.load(alpha.id))?.name).toBe('Alpha 2');

    expect(await repository.delete(alpha.id)).toBe(true);
    expect(await repository.delete(alpha.id)).toBe(false);
  });

  it('rejects duplicate create operations', async () => {
    const repository = new MemoryProjectRepository();
    const value = project('Alpha', 'project_alpha', '2026-08-07T20:00:00.000Z');

    await repository.create(value);
    await expect(repository.create(value)).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});
