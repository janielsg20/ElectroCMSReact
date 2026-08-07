import { MigrationError } from '../../domain';
import type { CanonicalProject } from '../../project';

export interface MigrationStep {
  readonly fromVersion: number;
  readonly toVersion: number;
  migrate(payload: unknown): unknown;
  validateTarget?(payload: unknown): CanonicalProject;
}

function readSchemaVersion(payload: unknown): number {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new MigrationError('Cannot migrate a non-object project payload.');
  }

  const schemaVersion = (payload as Record<string, unknown>).schemaVersion;
  if (!Number.isInteger(schemaVersion) || Number(schemaVersion) < 0) {
    throw new MigrationError('Project schemaVersion must be a non-negative integer.');
  }

  return Number(schemaVersion);
}

export class MigrationRegistry {
  private readonly steps = new Map<number, MigrationStep>();

  constructor(
    readonly currentVersion: number,
    private readonly validateCurrent: (payload: unknown) => CanonicalProject,
  ) {}

  register(step: MigrationStep): this {
    if (step.toVersion !== step.fromVersion + 1) {
      throw new MigrationError('Migrations must advance exactly one schema version.');
    }
    if (this.steps.has(step.fromVersion)) {
      throw new MigrationError(`Migration from schema ${step.fromVersion} is already registered.`);
    }
    this.steps.set(step.fromVersion, step);
    return this;
  }

  migrate(payload: unknown): CanonicalProject {
    const sourceVersion = readSchemaVersion(payload);
    if (sourceVersion > this.currentVersion) {
      throw new MigrationError(
        `Project schema ${sourceVersion} is newer than supported schema ${this.currentVersion}.`,
      );
    }

    let working: unknown = structuredClone(payload);
    let version = sourceVersion;

    while (version < this.currentVersion) {
      const step = this.steps.get(version);
      if (!step) {
        throw new MigrationError(`Missing migration from schema ${version} to ${version + 1}.`);
      }

      try {
        working = step.migrate(structuredClone(working));
        const migratedVersion = readSchemaVersion(working);
        if (migratedVersion !== step.toVersion) {
          throw new MigrationError(
            `Migration ${step.fromVersion} -> ${step.toVersion} produced schema ${migratedVersion}.`,
          );
        }
        step.validateTarget?.(working);
        version = migratedVersion;
      } catch (error) {
        if (error instanceof MigrationError) throw error;
        throw new MigrationError(`Migration ${step.fromVersion} -> ${step.toVersion} failed.`, {
          cause: error,
        });
      }
    }

    return this.validateCurrent(working);
  }
}
