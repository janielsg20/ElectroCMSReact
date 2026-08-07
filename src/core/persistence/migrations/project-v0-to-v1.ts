import { MigrationError } from '../../domain';
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  assertCanonicalProject,
  createCanonicalProject,
  type CanonicalProject,
} from '../../project';
import { MigrationRegistry, type MigrationStep } from './migration-registry';

interface LegacyProjectV0 {
  schemaVersion: 0;
  id: string;
  name: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}

function readLegacyV0(payload: unknown): LegacyProjectV0 {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new MigrationError('Legacy v0 payload must be an object.');
  }

  const value = payload as Record<string, unknown>;
  if (value.schemaVersion !== 0 || typeof value.id !== 'string' || typeof value.name !== 'string') {
    throw new MigrationError('Legacy v0 payload is missing id, name or schemaVersion.');
  }

  const legacy: LegacyProjectV0 = {
    schemaVersion: 0,
    id: value.id,
    name: value.name,
  };
  if (typeof value.version === 'string') legacy.version = value.version;
  if (typeof value.createdAt === 'string') legacy.createdAt = value.createdAt;
  if (typeof value.updatedAt === 'string') legacy.updatedAt = value.updatedAt;
  return legacy;
}

export const projectV0ToV1Migration: MigrationStep = {
  fromVersion: 0,
  toVersion: 1,
  migrate(payload): CanonicalProject {
    const legacy = readLegacyV0(payload);
    const createdAt = legacy.createdAt ?? legacy.updatedAt ?? new Date(0).toISOString();
    const project = createCanonicalProject({
      id: legacy.id,
      name: legacy.name,
      version: legacy.version ?? '0.1.0',
      now: createdAt,
      randomUuid: (() => {
        let sequence = 0;
        return () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
      })(),
    });

    if (legacy.updatedAt) project.metadata.updatedAt = legacy.updatedAt;
    return project;
  },
  validateTarget: assertCanonicalProject,
};

export function createProjectMigrationRegistry(): MigrationRegistry {
  return new MigrationRegistry(CURRENT_PROJECT_SCHEMA_VERSION, assertCanonicalProject).register(
    projectV0ToV1Migration,
  );
}

export function hydrateProjectPayload(payload: unknown): CanonicalProject {
  return createProjectMigrationRegistry().migrate(payload);
}
