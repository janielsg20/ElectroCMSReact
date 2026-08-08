import { isJsonObject, isJsonValue, type JsonObject, type JsonValue } from '../domain';
import type { CanonicalProject } from '../project';
import {
  createContentRecord as createBaseRecord,
  createDefaultContentRecordDefinition,
  listContentRecords as listBaseRecords,
  removeContentRecord as removeBaseRecord,
  updateContentRecord as updateBaseRecord,
  validateContentRecordDefinition as validateBaseRecord,
  type ContentRecordDefinition,
  type ContentRecordFilter,
  type ContentRecordMutationResult,
  type ContentRecordValidationIssue,
  type ContentRecordValidationResult,
} from './content-record';
import { createContentFieldTypeRegistry } from './advanced-field-types';
import {
  MF042_ADVANCED_FIELD_TYPES,
  createAdvancedFieldDefaultValue,
  normalizeAdvancedFieldValue,
  validateAdvancedFieldValue,
  type Mf042AdvancedFieldType,
} from './advanced-field-runtime';
import { listAdvancedFieldGroupDefinitions } from './advanced-field-group';
import type { FieldGroupDefinition } from './field-group';
import { FieldTypeRegistry } from './field-type-registry';

function resolveGroups(project: CanonicalProject, registry: FieldTypeRegistry): Map<string, FieldGroupDefinition> {
  return new Map(listAdvancedFieldGroupDefinitions(project, registry).map((group) => [group.id, group]));
}

function normalizeAdvancedRecordInput(
  project: CanonicalProject,
  input: unknown,
  registry: FieldTypeRegistry,
): unknown {
  if (!isJsonObject(input) || !Array.isArray(input.fieldGroupIds) || !isJsonObject(input.fieldValues)) {
    return input;
  }
  const candidate = structuredClone(input);
  const groups = resolveGroups(project, registry);
  const fieldValues = structuredClone(input.fieldValues) as JsonObject;

  for (const groupId of input.fieldGroupIds) {
    if (typeof groupId !== 'string') continue;
    const group = groups.get(groupId);
    if (!group) continue;
    const raw = fieldValues[groupId];
    const values = isJsonObject(raw) ? structuredClone(raw) : {};

    for (const field of group.fields) {
      if (values[field.name] === undefined) {
        values[field.name] = MF042_ADVANCED_FIELD_TYPES.includes(field.type as Mf042AdvancedFieldType)
          ? createAdvancedFieldDefaultValue(field, {
              registry,
              resolveGroup: (id) => groups.get(id) ?? null,
              currentValues: values,
            })
          : structuredClone(field.defaultValue);
      }
    }

    for (const field of group.fields) {
      if (!MF042_ADVANCED_FIELD_TYPES.includes(field.type as Mf042AdvancedFieldType)) continue;
      const value = values[field.name];
      if (!isJsonValue(value)) continue;
      values[field.name] = normalizeAdvancedFieldValue(field, value, {
        registry,
        resolveGroup: (id) => groups.get(id) ?? null,
        currentValues: values,
      });
    }
    fieldValues[groupId] = values;
  }

  candidate.fieldValues = fieldValues;
  return candidate;
}

function advancedRecordIssues(
  project: CanonicalProject,
  record: ContentRecordDefinition,
  registry: FieldTypeRegistry,
): ContentRecordValidationIssue[] {
  const issues: ContentRecordValidationIssue[] = [];
  const groups = resolveGroups(project, registry);

  for (const groupId of record.fieldGroupIds) {
    const group = groups.get(groupId);
    if (!group) continue;
    const values = record.fieldValues[groupId] ?? {};
    for (const field of group.fields) {
      if (!MF042_ADVANCED_FIELD_TYPES.includes(field.type as Mf042AdvancedFieldType)) continue;
      const value = values[field.name];
      if (!isJsonValue(value)) continue;
      const validation = validateAdvancedFieldValue(field, value, {
        registry,
        resolveGroup: (id) => groups.get(id) ?? null,
        currentValues: values,
      });
      for (const item of validation) {
        issues.push({
          code: 'INVALID_FIELD_VALUE',
          path: `fieldValues.${group.id}.${field.name}${item.path === '$' ? '' : `.${item.path}`}`,
          message: item.message,
        });
      }
    }
  }
  return issues;
}

export function validateAdvancedContentRecordDefinition(
  input: unknown,
  project: CanonicalProject,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): ContentRecordValidationResult {
  const normalized = normalizeAdvancedRecordInput(project, input, registry);
  const base = validateBaseRecord(normalized, project, registry);
  if (!base.ok) return base;
  const issues = advancedRecordIssues(project, base.value, registry);
  return issues.length > 0 ? { ok: false, issues } : base;
}

function mutationError(validation: { ok: false; issues: readonly ContentRecordValidationIssue[] }): ContentRecordMutationResult {
  return {
    ok: false,
    error: {
      code: 'INVALID_DEFINITION',
      message: validation.issues.map((item) => item.message).join(' '),
      issues: validation.issues,
    },
  };
}

export function createAdvancedContentRecord(
  project: CanonicalProject,
  input: unknown,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): ContentRecordMutationResult {
  const normalized = normalizeAdvancedRecordInput(project, input, registry);
  const validation = validateAdvancedContentRecordDefinition(normalized, project, registry);
  if (!validation.ok) return mutationError(validation);
  return createBaseRecord(project, validation.value, registry);
}

export function updateAdvancedContentRecord(
  project: CanonicalProject,
  id: string,
  input: unknown,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): ContentRecordMutationResult {
  const normalized = normalizeAdvancedRecordInput(project, input, registry);
  const validation = validateAdvancedContentRecordDefinition(normalized, project, registry);
  if (!validation.ok) return mutationError(validation);
  return updateBaseRecord(project, id, validation.value, registry);
}

export function removeAdvancedContentRecord(
  project: CanonicalProject,
  id: string,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): ContentRecordMutationResult {
  return removeBaseRecord(project, id, registry);
}

export function listAdvancedContentRecords(
  project: CanonicalProject,
  filter: ContentRecordFilter = {},
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): ContentRecordDefinition[] {
  return listBaseRecords(project, filter, registry).filter(
    (record) => validateAdvancedContentRecordDefinition(record, project, registry).ok,
  );
}

export { createDefaultContentRecordDefinition };
