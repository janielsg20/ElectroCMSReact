import { ConflictError, NotFoundError, ValidationError, isJsonObject, isJsonValue, type JsonObject, type JsonValue } from '../domain';
import {
  FIELD_TYPE_CATEGORIES,
  FIELD_TYPE_FEATURES,
  type FieldTypeDefinition,
  type FieldTypeMigrationHook,
  type FieldTypeValidationResult,
} from './field-type-definition';

const FIELD_TYPE_PATTERN = /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/;

export class FieldTypeRegistryError extends ValidationError {
  constructor(
    readonly registryCode:
      | 'INVALID_DEFINITION'
      | 'INVALID_CONFIG'
      | 'INVALID_VALUE'
      | 'MIGRATION_PATH_MISSING'
      | 'MIGRATION_OUTPUT_INVALID',
    message: string,
  ) {
    super(message);
  }
}

function definitionKey(type: string, version: number): string {
  return `${type}@${version}`;
}

function validateMigration(migration: FieldTypeMigrationHook): void {
  if (!Number.isInteger(migration.fromVersion) || !Number.isInteger(migration.toVersion) || migration.fromVersion < 1 || migration.toVersion !== migration.fromVersion + 1) {
    throw new FieldTypeRegistryError('INVALID_DEFINITION', `Field type migration ${migration.fromVersion}→${migration.toVersion} must advance exactly one version.`);
  }
}

function validateDefinition(definition: FieldTypeDefinition): void {
  if (!FIELD_TYPE_PATTERN.test(definition.type)) {
    throw new FieldTypeRegistryError('INVALID_DEFINITION', `Field type ${definition.type} must be namespaced as namespace/name.`);
  }
  if (!Number.isInteger(definition.version) || definition.version < 1) {
    throw new FieldTypeRegistryError('INVALID_DEFINITION', 'Field type version must be a positive integer.');
  }
  if (!definition.metadata.label.trim() || !definition.metadata.description.trim() || !definition.metadata.icon.trim()) {
    throw new FieldTypeRegistryError('INVALID_DEFINITION', 'Field type metadata requires label, description and icon.');
  }
  if (!FIELD_TYPE_CATEGORIES.includes(definition.metadata.category)) {
    throw new FieldTypeRegistryError('INVALID_DEFINITION', 'Field type category is not supported.');
  }
  if (!isJsonObject(definition.configSchema) || !isJsonObject(definition.defaultConfig)) {
    throw new FieldTypeRegistryError('INVALID_DEFINITION', 'Field type configSchema and defaultConfig must be portable JSON objects.');
  }
  for (const feature of FIELD_TYPE_FEATURES) {
    if (!definition.features[feature]) {
      throw new FieldTypeRegistryError('INVALID_DEFINITION', `Field type ${definition.type} is missing feature status for ${feature}.`);
    }
  }
  for (const migration of definition.migrations) validateMigration(migration);

  const defaultConfigValidation = definition.validateConfig(structuredClone(definition.defaultConfig));
  if (!defaultConfigValidation.valid) {
    throw new FieldTypeRegistryError('INVALID_DEFINITION', `Default config for ${definition.type}@${definition.version} is invalid.`);
  }
  const defaultValue = definition.createDefaultValue(structuredClone(definition.defaultConfig));
  if (!isJsonValue(defaultValue)) {
    throw new FieldTypeRegistryError('INVALID_DEFINITION', `Default value for ${definition.type}@${definition.version} is not portable JSON.`);
  }
  const defaultValueValidation = definition.validateValue(structuredClone(defaultValue), structuredClone(definition.defaultConfig));
  if (!defaultValueValidation.valid) {
    throw new FieldTypeRegistryError('INVALID_DEFINITION', `Default value for ${definition.type}@${definition.version} fails its validator.`);
  }
}

function cloneDefinition(definition: FieldTypeDefinition): FieldTypeDefinition {
  return {
    ...definition,
    metadata: { ...definition.metadata, ...(definition.metadata.keywords ? { keywords: [...definition.metadata.keywords] } : {}) },
    configSchema: structuredClone(definition.configSchema),
    defaultConfig: structuredClone(definition.defaultConfig),
    features: { ...definition.features },
    migrations: [...definition.migrations],
  };
}

function assertPortableConfig(config: unknown): JsonObject {
  if (!isJsonObject(config)) {
    throw new FieldTypeRegistryError('INVALID_CONFIG', 'Field type config must be a portable JSON object.');
  }
  return structuredClone(config);
}

function assertPortableValue(value: unknown): JsonValue {
  if (!isJsonValue(value)) {
    throw new FieldTypeRegistryError('INVALID_VALUE', 'Field value must be portable JSON.');
  }
  return structuredClone(value);
}

export class FieldTypeRegistry {
  private readonly definitions = new Map<string, FieldTypeDefinition>();
  private readonly versionsByType = new Map<string, number[]>();

  register(definition: FieldTypeDefinition): void {
    validateDefinition(definition);
    const key = definitionKey(definition.type, definition.version);
    if (this.definitions.has(key)) throw new ConflictError(`Field type ${key} is already registered.`);
    this.definitions.set(key, cloneDefinition(definition));
    const versions = [...(this.versionsByType.get(definition.type) ?? []), definition.version].sort((left, right) => left - right);
    this.versionsByType.set(definition.type, versions);
  }

  has(type: string, version?: number): boolean {
    if (version !== undefined) return this.definitions.has(definitionKey(type, version));
    return (this.versionsByType.get(type)?.length ?? 0) > 0;
  }

  resolve(type: string, version?: number): FieldTypeDefinition {
    const resolvedVersion = version ?? this.latestVersion(type);
    const definition = this.definitions.get(definitionKey(type, resolvedVersion));
    if (!definition) throw new NotFoundError(`Field type ${type}@${resolvedVersion} is not registered.`);
    return cloneDefinition(definition);
  }

  latestVersion(type: string): number {
    const versions = this.versionsByType.get(type);
    const latest = versions?.at(-1);
    if (latest === undefined) throw new NotFoundError(`Field type ${type} is not registered.`);
    return latest;
  }

  listLatest(options: { availability?: FieldTypeDefinition['availability']; category?: FieldTypeDefinition['metadata']['category'] | 'advanced' } = {}): FieldTypeDefinition[] {
    return [...this.versionsByType.keys()]
      .sort((left, right) => left.localeCompare(right))
      .map((type) => this.resolve(type))
      .filter((definition) => options.availability ? definition.availability === options.availability : true)
      .filter((definition) => {
        if (!options.category) return true;
        if (options.category === 'advanced') return definition.metadata.keywords?.includes('advanced') ?? false;
        return definition.metadata.category === options.category;
      });
  }

  validateConfig(type: string, config: unknown, version?: number): FieldTypeValidationResult {
    const definition = this.resolve(type, version);
    return definition.validateConfig(assertPortableConfig(config));
  }

  validateValue(type: string, value: unknown, config: unknown = {}, version?: number): FieldTypeValidationResult {
    const definition = this.resolve(type, version);
    const portableConfig = assertPortableConfig(config);
    const configValidation = definition.validateConfig(portableConfig);
    if (!configValidation.valid) return configValidation;
    return definition.validateValue(assertPortableValue(value), portableConfig);
  }

  createDefaultValue(type: string, config: unknown = {}, version?: number): JsonValue {
    const definition = this.resolve(type, version);
    const portableConfig = assertPortableConfig(config);
    const validation = definition.validateConfig(portableConfig);
    if (!validation.valid) {
      throw new FieldTypeRegistryError('INVALID_CONFIG', `Config for ${definition.type}@${definition.version} is invalid: ${validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')}`);
    }
    return assertPortableValue(definition.createDefaultValue(structuredClone(portableConfig)));
  }

  migrateConfig(type: string, config: unknown, fromVersion: number, targetVersion?: number): JsonObject {
    const resolvedTargetVersion = targetVersion ?? this.latestVersion(type);
    if (fromVersion > resolvedTargetVersion || fromVersion < 1) {
      throw new FieldTypeRegistryError('MIGRATION_PATH_MISSING', `Cannot migrate ${type} config from version ${fromVersion} to ${resolvedTargetVersion}.`);
    }

    let currentVersion = fromVersion;
    let currentConfig = assertPortableConfig(config);
    while (currentVersion < resolvedTargetVersion) {
      const hook = this.findMigration(type, currentVersion);
      if (!hook) {
        throw new FieldTypeRegistryError('MIGRATION_PATH_MISSING', `Missing field type migration ${type} ${currentVersion}→${currentVersion + 1}.`);
      }
      const migrated = hook.migrate(structuredClone(currentConfig));
      if (!isJsonObject(migrated)) {
        throw new FieldTypeRegistryError('MIGRATION_OUTPUT_INVALID', `Migration ${type} ${hook.fromVersion}→${hook.toVersion} returned non-portable config.`);
      }
      currentConfig = structuredClone(migrated);
      currentVersion = hook.toVersion;
    }

    const validation = this.resolve(type, resolvedTargetVersion).validateConfig(currentConfig);
    if (!validation.valid) {
      throw new FieldTypeRegistryError('MIGRATION_OUTPUT_INVALID', `Migrated config for ${type}@${resolvedTargetVersion} is invalid.`);
    }
    return currentConfig;
  }

  private findMigration(type: string, fromVersion: number): FieldTypeMigrationHook | null {
    for (const version of this.versionsByType.get(type) ?? []) {
      const definition = this.definitions.get(definitionKey(type, version));
      const hook = definition?.migrations.find((candidate) => candidate.fromVersion === fromVersion && candidate.toVersion === fromVersion + 1);
      if (hook) return hook;
    }
    return null;
  }
}
