import { describe, expect, it } from 'vitest';
import { createProjectMigrationRegistry } from './project-v0-to-v1';

describe('project migrations', () => {
  it('migrates the documented v0 project header into schema v1 without mutating input', () => {
    const legacy = {
      schemaVersion: 0,
      id: 'project_legacy',
      name: 'Legacy project',
      version: '0.0.9',
      createdAt: '2026-07-31T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    } as const;
    const before = structuredClone(legacy);

    const migrated = createProjectMigrationRegistry().migrate(legacy);

    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.id).toBe(legacy.id);
    expect(migrated.metadata.updatedAt).toBe(legacy.updatedAt);
    expect(legacy).toEqual(before);
  });

  it('rejects unsupported future schemas with a diagnostic error', () => {
    expect(() => createProjectMigrationRegistry().migrate({ schemaVersion: 99 })).toThrow(
      /newer than supported schema/i,
    );
  });
});
