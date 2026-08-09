import { type JsonObject, type JsonValue } from '../domain';
import type { CanonicalProject } from '../project';
import { createContentFieldTypeRegistry as createMf042FieldTypeRegistry } from './advanced-field-types';
import {
  FIELD_TYPE_FEATURES,
  invalidFieldTypeValue,
  validFieldTypeValue,
  type FieldTypeDefinition,
  type FieldTypeFeature,
  type FieldTypeFeatureStatus,
  type FieldTypeValidationResult,
} from './field-type-definition';
import type { CustomFieldDefinition } from './field-group';
import { FieldTypeRegistry } from './field-type-registry';
import { listRelationDefinitions, type RelationDefinition } from './relation';
import { listTaxonomyDefinitions } from './taxonomy';

export const MF043_REFERENCE_FIELD_TYPES = ['core/relation', 'core/user', 'core/taxonomy'] as const;
export type Mf043ReferenceFieldType = (typeof MF043_REFERENCE_FIELD_TYPES)[number];
export const RELATION_FIELD_SIDES = ['source', 'target'] as const;
export type RelationFieldSide = (typeof RELATION_FIELD_SIDES)[number];

function features(
  overrides: Partial<Record<FieldTypeFeature, FieldTypeFeatureStatus>> = {},
): Record<FieldTypeFeature, FieldTypeFeatureStatus> {
  const result = Object.fromEntries(
    FIELD_TYPE_FEATURES.map((feature) => [feature, 'unsupported'] as const),
  ) as Record<FieldTypeFeature, FieldTypeFeatureStatus>;
  result.defaultValue = 'supported';
  result.description = 'supported';
  result.validation = 'supported';
  result.required = 'supported';
  result.conditions = 'modeled';
  result.roleVisibility = 'modeled';
  result.relations = 'supported';
  return { ...result, ...overrides };
}

function rejectUnknown(config: JsonObject, allowed: readonly string[]): FieldTypeValidationResult | null {
  const key = Object.keys(config).find((candidate) => !allowed.includes(candidate));
  return key
    ? invalidFieldTypeValue('UNKNOWN_REFERENCE_CONFIG', key, `Unsupported reference field config key: ${key}.`)
    : null;
}

function validateRelationConfig(config: JsonObject): FieldTypeValidationResult {
  const unknown = rejectUnknown(config, ['relationId', 'side']);
  if (unknown) return unknown;
  const issues: { code: string; path: string; message: string }[] = [];
  if (typeof config.relationId !== 'string') {
    issues.push({ code: 'INVALID_RELATION_ID', path: 'relationId', message: 'relationId must be a string.' });
  }
  if (!RELATION_FIELD_SIDES.includes(config.side as RelationFieldSide)) {
    issues.push({ code: 'INVALID_RELATION_SIDE', path: 'side', message: 'side must be source or target.' });
  }
  return { valid: issues.length === 0, issues };
}

function validateTaxonomyConfig(config: JsonObject): FieldTypeValidationResult {
  const unknown = rejectUnknown(config, ['taxonomyId']);
  if (unknown) return unknown;
  return typeof config.taxonomyId === 'string'
    ? validFieldTypeValue()
    : invalidFieldTypeValue('INVALID_TAXONOMY_ID', 'taxonomyId', 'taxonomyId must be a string.');
}

function validateEmptyConfig(config: JsonObject): FieldTypeValidationResult {
  return Object.keys(config).length === 0
    ? validFieldTypeValue()
    : invalidFieldTypeValue('UNSUPPORTED_CONFIG', '$', 'User fields do not accept type-specific config in MF-043.');
}

function validateReferenceList(value: JsonValue): FieldTypeValidationResult {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    return invalidFieldTypeValue('INVALID_REFERENCE_LIST', '$', 'Reference value must be an array of non-empty string ids.');
  }
  return new Set(value).size === value.length
    ? validFieldTypeValue()
    : invalidFieldTypeValue('DUPLICATE_REFERENCE', '$', 'Reference ids must be unique.');
}

function validateUserReference(value: JsonValue): FieldTypeValidationResult {
  return value === null || (typeof value === 'string' && value.trim().length > 0)
    ? validFieldTypeValue()
    : invalidFieldTypeValue('INVALID_USER_REFERENCE', '$', 'User value must be a non-empty user id or null.');
}

function definition(input: {
  type: Mf043ReferenceFieldType;
  label: string;
  icon: string;
  description: string;
  valueShape: FieldTypeDefinition['valueShape'];
  configSchema: JsonObject;
  defaultConfig: JsonObject;
  validateConfig: FieldTypeDefinition['validateConfig'];
  validateValue: FieldTypeDefinition['validateValue'];
  createDefaultValue: FieldTypeDefinition['createDefaultValue'];
}): FieldTypeDefinition {
  return {
    type: input.type,
    version: 2,
    metadata: {
      label: input.label,
      category: 'reference',
      icon: input.icon,
      description: input.description,
      keywords: ['reference', 'relation', 'mf-043'],
    },
    availability: 'available',
    valueShape: input.valueShape,
    configSchema: structuredClone(input.configSchema),
    defaultConfig: structuredClone(input.defaultConfig),
    validateConfig: input.validateConfig,
    createDefaultValue: input.createDefaultValue,
    validateValue: input.validateValue,
    features: features(),
    migrations: [],
  };
}

export function createMf043ReferenceFieldTypeDefinitions(): FieldTypeDefinition[] {
  return [
    definition({
      type: 'core/relation',
      label: 'Relation',
      icon: 'git-branch',
      description: 'Reference canonical Records through a configured Content Relation.',
      valueShape: 'array',
      configSchema: { relationId: 'relation-id', side: 'relation-side' },
      defaultConfig: { relationId: '', side: 'source' },
      validateConfig: validateRelationConfig,
      validateValue: validateReferenceList,
      createDefaultValue: () => [],
    }),
    definition({
      type: 'core/user',
      label: 'User',
      icon: 'user-round',
      description: 'Reference one user from CanonicalProject.users.',
      valueShape: 'string',
      configSchema: {},
      defaultConfig: {},
      validateConfig: validateEmptyConfig,
      validateValue: validateUserReference,
      createDefaultValue: () => null,
    }),
    definition({
      type: 'core/taxonomy',
      label: 'Taxonomy',
      icon: 'tags',
      description: 'Store unique term ids scoped to one configured Taxonomy definition.',
      valueShape: 'array',
      configSchema: { taxonomyId: 'taxonomy-id' },
      defaultConfig: { taxonomyId: '' },
      validateConfig: validateTaxonomyConfig,
      validateValue: validateReferenceList,
      createDefaultValue: () => [],
    }),
  ];
}

export function createContentFieldTypeRegistry(): FieldTypeRegistry {
  const registry = createMf042FieldTypeRegistry();
  for (const item of createMf043ReferenceFieldTypeDefinitions()) registry.register(item);
  return registry;
}

export function isMf043ReferenceField(
  field: Pick<CustomFieldDefinition, 'type' | 'typeVersion'>,
): boolean {
  return field.typeVersion >= 2 && MF043_REFERENCE_FIELD_TYPES.includes(field.type as Mf043ReferenceFieldType);
}

export function resolveRelationForField(project: CanonicalProject, field: CustomFieldDefinition): RelationDefinition | null {
  if (!isMf043ReferenceField(field) || field.type !== 'core/relation') return null;
  const relationId = typeof field.config.relationId === 'string' ? field.config.relationId : '';
  return listRelationDefinitions(project).find((relation) => relation.id === relationId) ?? null;
}

export function validateReferenceFieldContext(
  project: CanonicalProject,
  ownerContentTypeId: string,
  field: CustomFieldDefinition,
  value: JsonValue,
): string[] {
  if (!isMf043ReferenceField(field)) return [];

  if (field.type === 'core/user') {
    if (value === null) return [];
    return typeof value === 'string' && value in project.users
      ? []
      : [`User ${String(value)} does not exist.`];
  }

  if (field.type === 'core/taxonomy') {
    const taxonomyId = typeof field.config.taxonomyId === 'string' ? field.config.taxonomyId : '';
    const taxonomy = listTaxonomyDefinitions(project).find((item) => item.id === taxonomyId);
    if (!taxonomy) return [`Taxonomy ${taxonomyId || '(empty)'} does not exist.`];
    if (!taxonomy.contentTypeIds.includes(ownerContentTypeId)) {
      return [`Taxonomy ${taxonomy.id} is not assigned to Content Type ${ownerContentTypeId}.`];
    }
    return [];
  }

  const relation = resolveRelationForField(project, field);
  if (!relation) return [`Relation ${String(field.config.relationId ?? '(empty)')} does not exist.`];
  const side = field.config.side as RelationFieldSide;
  if (!RELATION_FIELD_SIDES.includes(side)) return ['Relation field side is invalid.'];
  const ownerExpected = side === 'source' ? relation.sourceContentTypeId : relation.targetContentTypeId;
  const referencedExpected = side === 'source' ? relation.targetContentTypeId : relation.sourceContentTypeId;
  const cardinality = side === 'source' ? relation.sourceCardinality : relation.targetCardinality;
  if (ownerContentTypeId !== ownerExpected) {
    return [`Relation ${relation.id} expects a ${ownerExpected} record on its ${side} side.`];
  }
  if (!Array.isArray(value)) return ['Relation value must be an array of record ids.'];
  if (cardinality === 'one' && value.length > 1) return [`Relation ${relation.id} allows only one referenced record from this side.`];

  const errors: string[] = [];
  for (const recordId of value) {
    if (typeof recordId !== 'string') continue;
    const record = project.records[recordId];
    if (!record) {
      errors.push(`Referenced record ${recordId} does not exist.`);
      continue;
    }
    if (record.contentTypeId !== referencedExpected) {
      errors.push(`Referenced record ${recordId} must belong to Content Type ${referencedExpected}.`);
    }
  }
  return errors;
}
