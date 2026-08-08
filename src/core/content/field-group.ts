import { isJsonObject, isJsonValue, type JsonObject, type JsonValue } from '../domain';
import { validateCanonicalProject, type CanonicalProject } from '../project';
import { createDefaultFieldTypeRegistry } from './builtin-field-types';
import type { FieldTypeDefinition } from './field-type-definition';
import { FieldTypeRegistry } from './field-type-registry';

export const FIELD_GROUP_DEFINITION_VERSION = 1 as const;
export const CUSTOM_FIELD_DEFINITION_VERSION = 1 as const;

export type FieldGroupPresentation = 'group' | 'tabs';

export interface CustomFieldDefinition {
  version: typeof CUSTOM_FIELD_DEFINITION_VERSION;
  id: string;
  name: string;
  label: string;
  type: string;
  typeVersion: number;
  description: string;
  placeholder: string | null;
  required: boolean;
  defaultValue: JsonValue;
  config: JsonObject;
  conditions: JsonObject[];
  roleVisibility: string[];
}

export interface FieldGroupDefinition {
  version: typeof FIELD_GROUP_DEFINITION_VERSION;
  id: string;
  label: string;
  description: string;
  presentation: FieldGroupPresentation;
  fields: CustomFieldDefinition[];
}

export type FieldGroupValidationCode =
  | 'INVALID_OBJECT'
  | 'INVALID_VERSION'
  | 'INVALID_ID'
  | 'INVALID_LABEL'
  | 'INVALID_DESCRIPTION'
  | 'INVALID_PRESENTATION'
  | 'INVALID_FIELDS'
  | 'INVALID_FIELD_VERSION'
  | 'INVALID_FIELD_ID'
  | 'DUPLICATE_FIELD_ID'
  | 'INVALID_FIELD_NAME'
  | 'DUPLICATE_FIELD_NAME'
  | 'INVALID_FIELD_LABEL'
  | 'UNKNOWN_FIELD_TYPE'
  | 'FIELD_TYPE_UNAVAILABLE'
  | 'INVALID_TYPE_VERSION'
  | 'INVALID_FIELD_DESCRIPTION'
  | 'INVALID_PLACEHOLDER'
  | 'UNSUPPORTED_PLACEHOLDER'
  | 'INVALID_REQUIRED'
  | 'INVALID_CONFIG'
  | 'INVALID_DEFAULT_VALUE'
  | 'INVALID_CONDITIONS'
  | 'INVALID_ROLE_VISIBILITY';

export interface FieldGroupValidationIssue {
  code: FieldGroupValidationCode;
  path: string;
  message: string;
}

export type FieldGroupValidationResult =
  | { ok: true; value: FieldGroupDefinition }
  | { ok: false; issues: readonly FieldGroupValidationIssue[] };

export type FieldGroupMutationErrorCode =
  | 'INVALID_DEFINITION'
  | 'DUPLICATE_ID'
  | 'NOT_FOUND'
  | 'ID_MISMATCH'
  | 'FIELD_GROUP_IN_USE'
  | 'PROJECT_INVALID';

export interface FieldGroupMutationError {
  code: FieldGroupMutationErrorCode;
  message: string;
  issues?: readonly FieldGroupValidationIssue[];
}

export type FieldGroupMutationResult =
  | { ok: true; project: CanonicalProject; value: FieldGroupDefinition }
  | { ok: false; error: FieldGroupMutationError };

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const FIELD_NAME_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const MAX_LABEL_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 280;
const MAX_PLACEHOLDER_LENGTH = 160;
const MAX_FIELDS = 256;

function defaultRegistry(): FieldTypeRegistry {
  return createDefaultFieldTypeRegistry();
}

function trimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function addIssue(
  issues: FieldGroupValidationIssue[],
  code: FieldGroupValidationCode,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message });
}

function normalizeConditions(value: unknown): JsonObject[] | null {
  if (!Array.isArray(value) || !value.every(isJsonObject)) return null;
  return value.map((condition) => structuredClone(condition));
}

function normalizeRoleVisibility(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const roles: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !item.trim()) return null;
    roles.push(item.trim());
  }
  return new Set(roles).size === roles.length ? roles : null;
}

function resolveFieldType(
  registry: FieldTypeRegistry,
  type: string,
  version: number,
): FieldTypeDefinition | null {
  try {
    return registry.resolve(type, version);
  } catch {
    return null;
  }
}

export function createDefaultCustomFieldDefinition(
  registry: FieldTypeRegistry,
  type = 'core/text',
  id = 'field',
  label = 'Field',
): CustomFieldDefinition {
  const definition = registry.resolve(type);
  if (definition.availability !== 'available') {
    throw new Error(`Field type ${definition.type}@${definition.version} is modeled but not available in MF-040.`);
  }
  const safeId = IDENTIFIER_PATTERN.test(id) ? id : 'field';
  return {
    version: CUSTOM_FIELD_DEFINITION_VERSION,
    id: safeId,
    name: safeId.replaceAll('-', '_'),
    label,
    type: definition.type,
    typeVersion: definition.version,
    description: '',
    placeholder: null,
    required: false,
    defaultValue: registry.createDefaultValue(
      definition.type,
      structuredClone(definition.defaultConfig),
      definition.version,
    ),
    config: structuredClone(definition.defaultConfig),
    conditions: [],
    roleVisibility: [],
  };
}

export function createDefaultFieldGroupDefinition(
  id = 'field-group',
  label = 'Field Group',
): FieldGroupDefinition {
  const safeId = IDENTIFIER_PATTERN.test(id) ? id : 'field-group';
  return {
    version: FIELD_GROUP_DEFINITION_VERSION,
    id: safeId,
    label,
    description: '',
    presentation: 'group',
    fields: [],
  };
}

function validateField(
  input: unknown,
  index: number,
  registry: FieldTypeRegistry,
  issues: FieldGroupValidationIssue[],
): CustomFieldDefinition | null {
  const basePath = `fields.${index}`;
  if (!isJsonObject(input)) {
    addIssue(issues, 'INVALID_OBJECT', basePath, 'Field must be a portable JSON object.');
    return null;
  }

  const id = trimmedString(input.id);
  const name = trimmedString(input.name);
  const label = trimmedString(input.label);
  const type = trimmedString(input.type);
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const placeholder = input.placeholder === null ? null : trimmedString(input.placeholder);
  const typeVersion = input.typeVersion;
  const conditions = normalizeConditions(input.conditions);
  const roleVisibility = normalizeRoleVisibility(input.roleVisibility);

  if (input.version !== CUSTOM_FIELD_DEFINITION_VERSION) {
    addIssue(
      issues,
      'INVALID_FIELD_VERSION',
      `${basePath}.version`,
      `Custom field version must be ${CUSTOM_FIELD_DEFINITION_VERSION}.`,
    );
  }
  if (!IDENTIFIER_PATTERN.test(id) || id.length > 64) {
    addIssue(
      issues,
      'INVALID_FIELD_ID',
      `${basePath}.id`,
      'Field id must be kebab-case, begin with a letter and be at most 64 characters.',
    );
  }
  if (!FIELD_NAME_PATTERN.test(name) || name.length > 64) {
    addIssue(
      issues,
      'INVALID_FIELD_NAME',
      `${basePath}.name`,
      'Field name must be lowercase snake_case, begin with a letter and be at most 64 characters.',
    );
  }
  if (!label || label.length > MAX_LABEL_LENGTH) {
    addIssue(
      issues,
      'INVALID_FIELD_LABEL',
      `${basePath}.label`,
      `Field label is required and must be at most ${MAX_LABEL_LENGTH} characters.`,
    );
  }
  if (!Number.isInteger(typeVersion) || Number(typeVersion) < 1) {
    addIssue(
      issues,
      'INVALID_TYPE_VERSION',
      `${basePath}.typeVersion`,
      'Field type version must be a positive integer.',
    );
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    addIssue(
      issues,
      'INVALID_FIELD_DESCRIPTION',
      `${basePath}.description`,
      `Field description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`,
    );
  }
  if (input.placeholder !== null && (typeof input.placeholder !== 'string' || placeholder.length > MAX_PLACEHOLDER_LENGTH)) {
    addIssue(
      issues,
      'INVALID_PLACEHOLDER',
      `${basePath}.placeholder`,
      `Placeholder must be null or a string of at most ${MAX_PLACEHOLDER_LENGTH} characters.`,
    );
  }
  if (typeof input.required !== 'boolean') {
    addIssue(issues, 'INVALID_REQUIRED', `${basePath}.required`, 'Required must be boolean.');
  }
  if (!isJsonObject(input.config)) {
    addIssue(issues, 'INVALID_CONFIG', `${basePath}.config`, 'Field config must be a portable JSON object.');
  }
  if (!isJsonValue(input.defaultValue)) {
    addIssue(
      issues,
      'INVALID_DEFAULT_VALUE',
      `${basePath}.defaultValue`,
      'Default value must be portable JSON.',
    );
  }
  if (!conditions) {
    addIssue(
      issues,
      'INVALID_CONDITIONS',
      `${basePath}.conditions`,
      'Conditions must be an array of portable JSON objects.',
    );
  }
  if (!roleVisibility) {
    addIssue(
      issues,
      'INVALID_ROLE_VISIBILITY',
      `${basePath}.roleVisibility`,
      'Role visibility must contain unique non-empty role ids.',
    );
  }

  let fieldType: FieldTypeDefinition | null = null;
  if (type && Number.isInteger(typeVersion) && Number(typeVersion) > 0) {
    fieldType = resolveFieldType(registry, type, Number(typeVersion));
    if (!fieldType) {
      addIssue(
        issues,
        'UNKNOWN_FIELD_TYPE',
        `${basePath}.type`,
        `Field type ${type}@${String(typeVersion)} is not registered.`,
      );
    } else if (fieldType.availability !== 'available') {
      addIssue(
        issues,
        'FIELD_TYPE_UNAVAILABLE',
        `${basePath}.type`,
        `Field type ${type}@${fieldType.version} is modeled for a later microphase and cannot be instantiated yet.`,
      );
    }
  } else if (!type) {
    addIssue(issues, 'UNKNOWN_FIELD_TYPE', `${basePath}.type`, 'Field type is required.');
  }

  if (fieldType && fieldType.availability === 'available') {
    if (placeholder !== null && fieldType.features.placeholder !== 'supported') {
      addIssue(
        issues,
        'UNSUPPORTED_PLACEHOLDER',
        `${basePath}.placeholder`,
        `${fieldType.metadata.label} does not support placeholders.`,
      );
    }
    if (isJsonObject(input.config)) {
      const configValidation = registry.validateConfig(fieldType.type, input.config, fieldType.version);
      for (const issue of configValidation.issues) {
        addIssue(
          issues,
          'INVALID_CONFIG',
          `${basePath}.config${issue.path === '$' ? '' : `.${issue.path}`}`,
          issue.message,
        );
      }
      if (configValidation.valid && isJsonValue(input.defaultValue)) {
        const valueValidation = registry.validateValue(
          fieldType.type,
          input.defaultValue,
          input.config,
          fieldType.version,
        );
        for (const issue of valueValidation.issues) {
          addIssue(
            issues,
            'INVALID_DEFAULT_VALUE',
            `${basePath}.defaultValue${issue.path === '$' ? '' : `.${issue.path}`}`,
            issue.message,
          );
        }
      }
    }
  }

  if (
    !id ||
    !name ||
    !label ||
    !type ||
    !Number.isInteger(typeVersion) ||
    typeof input.required !== 'boolean' ||
    !isJsonObject(input.config) ||
    !isJsonValue(input.defaultValue) ||
    !conditions ||
    !roleVisibility
  ) {
    return null;
  }

  return {
    version: CUSTOM_FIELD_DEFINITION_VERSION,
    id,
    name,
    label,
    type,
    typeVersion: Number(typeVersion),
    description,
    placeholder,
    required: input.required,
    defaultValue: structuredClone(input.defaultValue),
    config: structuredClone(input.config),
    conditions,
    roleVisibility,
  };
}

export function validateFieldGroupDefinition(
  input: unknown,
  registry: FieldTypeRegistry = defaultRegistry(),
): FieldGroupValidationResult {
  if (!isJsonObject(input)) {
    return {
      ok: false,
      issues: [{ code: 'INVALID_OBJECT', path: '$', message: 'Field group must be a portable JSON object.' }],
    };
  }

  const issues: FieldGroupValidationIssue[] = [];
  const id = trimmedString(input.id);
  const label = trimmedString(input.label);
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const presentation = input.presentation;

  if (input.version !== FIELD_GROUP_DEFINITION_VERSION) {
    addIssue(
      issues,
      'INVALID_VERSION',
      'version',
      `Field group version must be ${FIELD_GROUP_DEFINITION_VERSION}.`,
    );
  }
  if (!IDENTIFIER_PATTERN.test(id) || id.length > 64) {
    addIssue(
      issues,
      'INVALID_ID',
      'id',
      'Field group id must be kebab-case, begin with a letter and be at most 64 characters.',
    );
  }
  if (!label || label.length > MAX_LABEL_LENGTH) {
    addIssue(
      issues,
      'INVALID_LABEL',
      'label',
      `Field group label is required and must be at most ${MAX_LABEL_LENGTH} characters.`,
    );
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    addIssue(
      issues,
      'INVALID_DESCRIPTION',
      'description',
      `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`,
    );
  }
  if (presentation !== 'group' && presentation !== 'tabs') {
    addIssue(
      issues,
      'INVALID_PRESENTATION',
      'presentation',
      'Presentation must be group or tabs.',
    );
  }
  if (!Array.isArray(input.fields) || input.fields.length > MAX_FIELDS) {
    addIssue(
      issues,
      'INVALID_FIELDS',
      'fields',
      `Fields must be an array with at most ${MAX_FIELDS} entries.`,
    );
  }

  const fields: CustomFieldDefinition[] = [];
  if (Array.isArray(input.fields) && input.fields.length <= MAX_FIELDS) {
    input.fields.forEach((field, index) => {
      const normalized = validateField(field, index, registry, issues);
      if (normalized) fields.push(normalized);
    });

    const ids = new Set<string>();
    const names = new Set<string>();
    fields.forEach((field, index) => {
      if (ids.has(field.id)) {
        addIssue(
          issues,
          'DUPLICATE_FIELD_ID',
          `fields.${index}.id`,
          `Field id ${field.id} is already used in this group.`,
        );
      }
      ids.add(field.id);
      if (names.has(field.name)) {
        addIssue(
          issues,
          'DUPLICATE_FIELD_NAME',
          `fields.${index}.name`,
          `Field name ${field.name} is already used in this group.`,
        );
      }
      names.add(field.name);
    });
  }

  if (issues.length > 0 || (presentation !== 'group' && presentation !== 'tabs')) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      version: FIELD_GROUP_DEFINITION_VERSION,
      id,
      label,
      description,
      presentation,
      fields,
    },
  };
}

export function serializeCustomFieldDefinition(field: CustomFieldDefinition): JsonObject {
  return {
    version: field.version,
    id: field.id,
    name: field.name,
    label: field.label,
    type: field.type,
    typeVersion: field.typeVersion,
    description: field.description,
    placeholder: field.placeholder,
    required: field.required,
    defaultValue: structuredClone(field.defaultValue),
    config: structuredClone(field.config),
    conditions: field.conditions.map((condition) => structuredClone(condition)),
    roleVisibility: [...field.roleVisibility],
  };
}

export function serializeFieldGroupDefinition(definition: FieldGroupDefinition): JsonObject {
  return {
    version: definition.version,
    id: definition.id,
    label: definition.label,
    description: definition.description,
    presentation: definition.presentation,
    fields: definition.fields.map(serializeCustomFieldDefinition),
  };
}

export function listFieldGroupDefinitions(
  project: CanonicalProject,
  registry: FieldTypeRegistry = defaultRegistry(),
): FieldGroupDefinition[] {
  return Object.values(project.fieldGroups)
    .map((value) => validateFieldGroupDefinition(value, registry))
    .filter((result): result is { ok: true; value: FieldGroupDefinition } => result.ok)
    .map((result) => result.value)
    .sort((left, right) => left.label.localeCompare(right.label));
}

function withValidatedProject(
  project: CanonicalProject,
  fieldGroups: CanonicalProject['fieldGroups'],
  value: FieldGroupDefinition,
): FieldGroupMutationResult {
  const nextProject: CanonicalProject = {
    ...project,
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() },
    fieldGroups,
  };
  const validation = validateCanonicalProject(nextProject);
  return validation.ok
    ? { ok: true, project: validation.value, value }
    : { ok: false, error: { code: 'PROJECT_INVALID', message: validation.error.message } };
}

export function createFieldGroup(
  project: CanonicalProject,
  input: unknown,
  registry: FieldTypeRegistry = defaultRegistry(),
): FieldGroupMutationResult {
  const validation = validateFieldGroupDefinition(input, registry);
  if (!validation.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_DEFINITION',
        message: validation.issues.map((issue) => issue.message).join(' '),
        issues: validation.issues,
      },
    };
  }
  if (validation.value.id in project.fieldGroups) {
    return {
      ok: false,
      error: { code: 'DUPLICATE_ID', message: `Field group ${validation.value.id} already exists.` },
    };
  }
  return withValidatedProject(
    project,
    {
      ...project.fieldGroups,
      [validation.value.id]: serializeFieldGroupDefinition(validation.value),
    },
    validation.value,
  );
}

export function updateFieldGroup(
  project: CanonicalProject,
  id: string,
  input: unknown,
  registry: FieldTypeRegistry = defaultRegistry(),
): FieldGroupMutationResult {
  if (!(id in project.fieldGroups)) {
    return { ok: false, error: { code: 'NOT_FOUND', message: `Field group ${id} was not found.` } };
  }
  const validation = validateFieldGroupDefinition(input, registry);
  if (!validation.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_DEFINITION',
        message: validation.issues.map((issue) => issue.message).join(' '),
        issues: validation.issues,
      },
    };
  }
  if (validation.value.id !== id) {
    return {
      ok: false,
      error: { code: 'ID_MISMATCH', message: 'Field group id is immutable after creation.' },
    };
  }
  return withValidatedProject(
    project,
    {
      ...project.fieldGroups,
      [id]: serializeFieldGroupDefinition(validation.value),
    },
    validation.value,
  );
}

export function removeFieldGroup(
  project: CanonicalProject,
  id: string,
  registry: FieldTypeRegistry = defaultRegistry(),
): FieldGroupMutationResult {
  const current = project.fieldGroups[id];
  if (!current) {
    return { ok: false, error: { code: 'NOT_FOUND', message: `Field group ${id} was not found.` } };
  }
  const validation = validateFieldGroupDefinition(current, registry);
  if (!validation.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_DEFINITION',
        message: 'Existing field group definition is invalid.',
        issues: validation.issues,
      },
    };
  }

  const taxonomyInUse = Object.values(project.taxonomies).some((taxonomy) => {
    if (!isJsonObject(taxonomy) || !Array.isArray(taxonomy.fieldGroupIds)) return false;
    return taxonomy.fieldGroupIds.includes(id);
  });
  if (taxonomyInUse) {
    return {
      ok: false,
      error: {
        code: 'FIELD_GROUP_IN_USE',
        message: `Field group ${id} is assigned to a taxonomy and cannot be deleted until that association is removed.`,
      },
    };
  }

  const fieldGroups = { ...project.fieldGroups };
  delete fieldGroups[id];
  return withValidatedProject(project, fieldGroups, validation.value);
}
