import { ConflictError, NotFoundError, ValidationError, isJsonObject } from '../domain';
import type { DocumentNode } from '../project';
import {
  WIDGET_EXPORT_TARGETS,
  type WidgetChildPolicy,
  type WidgetDefinition,
  type WidgetNodeFactoryContext,
  type WidgetPropValidationResult,
} from './widget-definition';

const WIDGET_TYPE_PATTERN = /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/;

export class WidgetRegistryError extends ValidationError {
  constructor(
    readonly registryCode:
      | 'INVALID_DEFINITION'
      | 'INVALID_FACTORY_OUTPUT'
      | 'INVALID_PROPS'
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

function validateChildPolicy(policy: WidgetChildPolicy): void {
  if ('minChildren' in policy && policy.minChildren !== undefined && policy.minChildren < 0) {
    throw new WidgetRegistryError('INVALID_DEFINITION', 'minChildren cannot be negative.');
  }
  if ('maxChildren' in policy && policy.maxChildren !== undefined && policy.maxChildren < 0) {
    throw new WidgetRegistryError('INVALID_DEFINITION', 'maxChildren cannot be negative.');
  }
  if (
    'minChildren' in policy &&
    'maxChildren' in policy &&
    policy.minChildren !== undefined &&
    policy.maxChildren !== undefined &&
    policy.minChildren > policy.maxChildren
  ) {
    throw new WidgetRegistryError('INVALID_DEFINITION', 'minChildren cannot exceed maxChildren.');
  }
  if (policy.kind === 'allowlist' && policy.allowedTypes.length === 0) {
    throw new WidgetRegistryError('INVALID_DEFINITION', 'An allowlist child policy cannot be empty.');
  }
}

function validateDefinition(definition: WidgetDefinition): void {
  if (!WIDGET_TYPE_PATTERN.test(definition.type)) {
    throw new WidgetRegistryError(
      'INVALID_DEFINITION',
      `Widget type ${definition.type} must be namespaced as namespace/name.`,
    );
  }
  if (!Number.isInteger(definition.version) || definition.version < 1) {
    throw new WidgetRegistryError('INVALID_DEFINITION', 'Widget version must be a positive integer.');
  }
  if (!definition.metadata.name.trim() || !definition.metadata.description.trim()) {
    throw new WidgetRegistryError('INVALID_DEFINITION', 'Widget metadata requires name and description.');
  }
  if (!definition.previewRendererId.trim()) {
    throw new WidgetRegistryError('INVALID_DEFINITION', 'previewRendererId cannot be empty.');
  }
  for (const target of WIDGET_EXPORT_TARGETS) {
    if (!definition.capabilities[target]) {
      throw new WidgetRegistryError(
        'INVALID_DEFINITION',
        `Widget ${definition.type} is missing capability status for ${target}.`,
      );
    }
  }
  validateChildPolicy(definition.childPolicy);
  for (const migration of definition.migrations) {
    if (
      !Number.isInteger(migration.fromVersion) ||
      !Number.isInteger(migration.toVersion) ||
      migration.fromVersion < 1 ||
      migration.toVersion !== migration.fromVersion + 1
    ) {
      throw new WidgetRegistryError(
        'INVALID_DEFINITION',
        `Widget migration ${migration.fromVersion}→${migration.toVersion} must advance exactly one version.`,
      );
    }
  }
}

function cloneDefinition(definition: WidgetDefinition): WidgetDefinition {
  return {
    ...definition,
    metadata: {
      ...definition.metadata,
      ...(definition.metadata.keywords ? { keywords: [...definition.metadata.keywords] } : {}),
    },
    propSchema: structuredClone(definition.propSchema),
    inspectorSchema: structuredClone(definition.inspectorSchema),
    childPolicy:
      definition.childPolicy.kind === 'allowlist'
        ? { ...definition.childPolicy, allowedTypes: [...definition.childPolicy.allowedTypes] }
        : { ...definition.childPolicy },
    capabilities: { ...definition.capabilities },
    migrations: [...definition.migrations],
  };
}

export class WidgetRegistry {
  private readonly definitions = new Map<string, WidgetDefinition>();
  private readonly versionsByType = new Map<string, number[]>();

  register(definition: WidgetDefinition): void {
    validateDefinition(definition);
    const key = definitionKey(definition.type, definition.version);
    if (this.definitions.has(key)) {
      throw new ConflictError(`Widget ${key} is already registered.`);
    }
    this.definitions.set(key, cloneDefinition(definition));
    const versions = [...(this.versionsByType.get(definition.type) ?? []), definition.version].sort(
      (left, right) => left - right,
    );
    this.versionsByType.set(definition.type, versions);
  }

  has(type: string, version?: number): boolean {
    if (version !== undefined) return this.definitions.has(definitionKey(type, version));
    return (this.versionsByType.get(type)?.length ?? 0) > 0;
  }

  resolve(type: string, version?: number): WidgetDefinition {
    const resolvedVersion = version ?? this.latestVersion(type);
    const definition = this.definitions.get(definitionKey(type, resolvedVersion));
    if (!definition) throw new NotFoundError(`Widget ${type}@${resolvedVersion} is not registered.`);
    return cloneDefinition(definition);
  }

  latestVersion(type: string): number {
    const versions = this.versionsByType.get(type);
    const latest = versions?.at(-1);
    if (latest === undefined) throw new NotFoundError(`Widget ${type} is not registered.`);
    return latest;
  }

  listLatest(): WidgetDefinition[] {
    return [...this.versionsByType.keys()]
      .sort((left, right) => left.localeCompare(right))
      .map((type) => this.resolve(type));
  }

  createNode(type: string, context: WidgetNodeFactoryContext, version?: number): DocumentNode {
    const definition = this.resolve(type, version);
    const node = definition.createNode({
      ...context,
      ...(context.props ? { props: structuredClone(context.props) } : {}),
      ...(context.styles ? { styles: structuredClone(context.styles) } : {}),
      ...(context.children ? { children: [...context.children] } : {}),
    });
    if (
      node.id !== context.id ||
      node.type !== definition.type ||
      node.version !== definition.version ||
      !isJsonObject(node.props)
    ) {
      throw new WidgetRegistryError(
        'INVALID_FACTORY_OUTPUT',
        `Factory for ${definition.type}@${definition.version} returned an invalid canonical node.`,
      );
    }
    const validation = definition.validateProps(node.props);
    if (!validation.valid) {
      throw new WidgetRegistryError(
        'INVALID_PROPS',
        `Factory props for ${definition.type}@${definition.version} are invalid: ${validation.issues
          .map((issue) => `${issue.path}: ${issue.message}`)
          .join('; ')}`,
      );
    }
    return structuredClone(node);
  }

  validateNode(node: DocumentNode): WidgetPropValidationResult {
    const definition = this.resolve(node.type, node.version);
    return definition.validateProps(node.props);
  }

  allowsChild(parentType: string, childType: string, parentVersion?: number): boolean {
    const policy = this.resolve(parentType, parentVersion).childPolicy;
    if (policy.kind === 'none') return false;
    if (policy.kind === 'any') return true;
    return policy.allowedTypes.includes(childType);
  }

  migrateNode(node: DocumentNode, targetVersion?: number): DocumentNode {
    const resolvedTargetVersion = targetVersion ?? this.latestVersion(node.type);
    if (node.version > resolvedTargetVersion) {
      throw new WidgetRegistryError(
        'MIGRATION_PATH_MISSING',
        `Cannot migrate ${node.type} backwards from ${node.version} to ${resolvedTargetVersion}.`,
      );
    }
    let current = structuredClone(node);
    while (current.version < resolvedTargetVersion) {
      const hook = this.findMigration(current.type, current.version);
      if (!hook) {
        throw new WidgetRegistryError(
          'MIGRATION_PATH_MISSING',
          `Missing widget migration ${current.type} ${current.version}→${current.version + 1}.`,
        );
      }
      const migrated = hook.migrate(structuredClone(current));
      if (
        migrated.id !== current.id ||
        migrated.type !== current.type ||
        migrated.version !== hook.toVersion
      ) {
        throw new WidgetRegistryError(
          'MIGRATION_OUTPUT_INVALID',
          `Migration ${current.type} ${hook.fromVersion}→${hook.toVersion} returned an invalid node.`,
        );
      }
      current = structuredClone(migrated);
    }
    const validation = this.validateNode(current);
    if (!validation.valid) {
      throw new WidgetRegistryError(
        'INVALID_PROPS',
        `Migrated node ${current.type}@${current.version} has invalid props.`,
      );
    }
    return current;
  }

  private findMigration(type: string, fromVersion: number) {
    for (const version of this.versionsByType.get(type) ?? []) {
      const definition = this.definitions.get(definitionKey(type, version));
      const hook = definition?.migrations.find(
        (candidate) => candidate.fromVersion === fromVersion && candidate.toVersion === fromVersion + 1,
      );
      if (hook) return hook;
    }
    return null;
  }
}
