import { isJsonObject, isJsonValue, type JsonObject } from '../domain';
import type { CanonicalProject } from '../project';
import {
  createAdvancedContentRecord,
  createDefaultContentRecordDefinition,
  listAdvancedContentRecords,
  removeAdvancedContentRecord,
  updateAdvancedContentRecord,
  validateAdvancedContentRecordDefinition,
} from './advanced-content-record';
import { advancedFieldGroupReference, isMf042AdvancedField } from './advanced-field-runtime';
import { listAdvancedFieldGroupDefinitions } from './advanced-field-group';
import type {
  ContentRecordDefinition,
  ContentRecordListOptions,
  ContentRecordMutationResult,
  ContentRecordValidationIssue,
  ContentRecordValidationResult,
} from './content-record';
import type { FieldGroupDefinition } from './field-group';
import { FieldTypeRegistry } from './field-type-registry';
import {
  createContentFieldTypeRegistry,
  isMf043ReferenceField,
  validateReferenceFieldContext,
} from './reference-field-types';

function groupMap(project: CanonicalProject, registry: FieldTypeRegistry): Map<string, FieldGroupDefinition> {
  return new Map(listAdvancedFieldGroupDefinitions(project, registry).map((group) => [group.id, group]));
}

function referenceIssuesInGroup(
  project: CanonicalProject,
  ownerContentTypeId: string,
  group: FieldGroupDefinition,
  values: JsonObject,
  groups: ReadonlyMap<string, FieldGroupDefinition>,
  path: string,
): ContentRecordValidationIssue[] {
  const issues: ContentRecordValidationIssue[] = [];
  for (const field of group.fields) {
    const value = values[field.name];
    if (!isJsonValue(value)) continue;
    const fieldPath = `${path}.${field.name}`;
    if (isMf043ReferenceField(field)) {
      for (const message of validateReferenceFieldContext(project, ownerContentTypeId, field, value)) issues.push({ code: 'INVALID_FIELD_VALUE', path: fieldPath, message });
      continue;
    }
    if (!isMf042AdvancedField(field)) continue;
    if (field.type === 'core/calculated') continue;
    if (field.type === 'core/conditional' && value === null) continue;
    const nestedId = advancedFieldGroupReference(field);
    const nestedGroup = nestedId ? groups.get(nestedId) : null;
    if (!nestedGroup) continue;
    if ((field.type === 'core/group' || field.type === 'core/conditional') && isJsonObject(value)) {
      issues.push(...referenceIssuesInGroup(project, ownerContentTypeId, nestedGroup, value, groups, fieldPath));
    } else if (field.type === 'core/repeater' && Array.isArray(value)) {
      value.forEach((row, index) => {
        if (isJsonObject(row)) issues.push(...referenceIssuesInGroup(project, ownerContentTypeId, nestedGroup, row, groups, `${fieldPath}.${index}`));
      });
    }
  }
  return issues;
}

function referenceIssues(project: CanonicalProject, record: ContentRecordDefinition, registry: FieldTypeRegistry): ContentRecordValidationIssue[] {
  const groups = groupMap(project, registry);
  const issues: ContentRecordValidationIssue[] = [];
  for (const groupId of record.fieldGroupIds) {
    const group = groups.get(groupId);
    const values = record.fieldValues[groupId];
    if (group && values) issues.push(...referenceIssuesInGroup(project, record.contentTypeId, group, values, groups, `fieldValues.${groupId}`));
  }
  return issues;
}

function referencedRecordIdsInGroup(group: FieldGroupDefinition, values: JsonObject, groups: ReadonlyMap<string, FieldGroupDefinition>, output: Set<string>): void {
  for (const field of group.fields) {
    const value = values[field.name];
    if (!isJsonValue(value)) continue;
    if (isMf043ReferenceField(field) && field.type === 'core/relation' && Array.isArray(value)) {
      value.forEach((item) => { if (typeof item === 'string') output.add(item); });
      continue;
    }
    if (!isMf042AdvancedField(field) || field.type === 'core/calculated' || value === null) continue;
    const nestedId = advancedFieldGroupReference(field);
    const nested = nestedId ? groups.get(nestedId) : null;
    if (!nested) continue;
    if ((field.type === 'core/group' || field.type === 'core/conditional') && isJsonObject(value)) referencedRecordIdsInGroup(nested, value, groups, output);
    else if (field.type === 'core/repeater' && Array.isArray(value)) value.forEach((row) => { if (isJsonObject(row)) referencedRecordIdsInGroup(nested, row, groups, output); });
  }
}

function recordReferences(project: CanonicalProject, record: ContentRecordDefinition, registry: FieldTypeRegistry): Set<string> {
  const groups = groupMap(project, registry);
  const output = new Set<string>();
  for (const groupId of record.fieldGroupIds) {
    const group = groups.get(groupId);
    const values = record.fieldValues[groupId];
    if (group && values) referencedRecordIdsInGroup(group, values, groups, output);
  }
  return output;
}

export function validateReferenceContentRecordDefinition(input: unknown, project: CanonicalProject, registry: FieldTypeRegistry = createContentFieldTypeRegistry()): ContentRecordValidationResult {
  const base = validateAdvancedContentRecordDefinition(input, project, registry);
  if (!base.ok) return base;
  const issues = referenceIssues(project, base.value, registry);
  return issues.length > 0 ? { ok: false, issues } : base;
}

function invalidMutation(validation: { ok: false; issues: readonly ContentRecordValidationIssue[] }): ContentRecordMutationResult {
  return { ok: false, error: { code: 'INVALID_DEFINITION', message: validation.issues.map((issue) => issue.message).join(' '), issues: validation.issues } };
}

export function createReferenceContentRecord(project: CanonicalProject, input: unknown, registry: FieldTypeRegistry = createContentFieldTypeRegistry()): ContentRecordMutationResult {
  const validation = validateReferenceContentRecordDefinition(input, project, registry);
  if (!validation.ok) return invalidMutation(validation);
  return createAdvancedContentRecord(project, validation.value, registry);
}

export function updateReferenceContentRecord(project: CanonicalProject, id: string, input: unknown, registry: FieldTypeRegistry = createContentFieldTypeRegistry()): ContentRecordMutationResult {
  const validation = validateReferenceContentRecordDefinition(input, project, registry);
  if (!validation.ok) return invalidMutation(validation);
  return updateAdvancedContentRecord(project, id, validation.value, registry);
}

export function removeReferenceContentRecord(project: CanonicalProject, id: string, registry: FieldTypeRegistry = createContentFieldTypeRegistry()): ContentRecordMutationResult {
  const referencing = listAdvancedContentRecords(project, {}, registry).find((record) => record.id !== id && recordReferences(project, record, registry).has(id));
  if (referencing) return { ok: false, error: { code: 'PROJECT_INVALID', message: `Record ${id} is referenced by relation fields in record ${referencing.id} and cannot be deleted.` } };
  return removeAdvancedContentRecord(project, id, registry);
}

export function listReferenceContentRecords(project: CanonicalProject, filter: ContentRecordListOptions = {}, registry: FieldTypeRegistry = createContentFieldTypeRegistry()): ContentRecordDefinition[] {
  return listAdvancedContentRecords(project, filter, registry).filter((record) => validateReferenceContentRecordDefinition(record, project, registry).ok);
}

export { createDefaultContentRecordDefinition };
