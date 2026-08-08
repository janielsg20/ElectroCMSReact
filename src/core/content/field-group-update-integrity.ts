import { isJsonObject } from '../domain';
import type { CanonicalProject } from '../project';
import { validateAdvancedContentRecordDefinition } from './advanced-content-record';
import {
  listAdvancedFieldGroupDefinitions,
  updateAdvancedFieldGroup,
} from './advanced-field-group';
import { advancedFieldGroupReference } from './advanced-field-runtime';
import { createContentFieldTypeRegistry } from './advanced-field-types';
import type { FieldGroupDefinition, FieldGroupMutationResult } from './field-group';
import { FieldTypeRegistry } from './field-type-registry';

function groupDependsOn(
  groupId: string,
  targetId: string,
  groups: ReadonlyMap<string, FieldGroupDefinition>,
  visiting: Set<string> = new Set(),
): boolean {
  if (groupId === targetId) return true;
  if (visiting.has(groupId)) return false;
  const group = groups.get(groupId);
  if (!group) return false;

  const nextVisiting = new Set(visiting);
  nextVisiting.add(groupId);
  return group.fields.some((field) => {
    const reference = advancedFieldGroupReference(field);
    return reference ? groupDependsOn(reference, targetId, groups, nextVisiting) : false;
  });
}

function recordUsesFieldGroup(
  raw: unknown,
  fieldGroupId: string,
  groups: ReadonlyMap<string, FieldGroupDefinition>,
): boolean {
  if (!isJsonObject(raw) || !Array.isArray(raw.fieldGroupIds)) return false;
  return raw.fieldGroupIds.some(
    (candidate) => typeof candidate === 'string' && groupDependsOn(candidate, fieldGroupId, groups),
  );
}

export function updateFieldGroupWithRecordIntegrity(
  project: CanonicalProject,
  id: string,
  input: unknown,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): FieldGroupMutationResult {
  const updated = updateAdvancedFieldGroup(project, id, input, registry);
  if (!updated.ok) return updated;

  const groups = new Map(
    listAdvancedFieldGroupDefinitions(updated.project, registry).map((group) => [group.id, group]),
  );

  for (const [recordId, raw] of Object.entries(project.records)) {
    if (!recordUsesFieldGroup(raw, id, groups)) continue;
    const validation = validateAdvancedContentRecordDefinition(raw, updated.project, registry);
    if (!validation.ok) {
      const firstIssue = validation.issues[0];
      return {
        ok: false,
        error: {
          code: 'FIELD_GROUP_IN_USE',
          message: firstIssue
            ? `Field group ${id} cannot be updated because record ${recordId} would become invalid: ${firstIssue.message}`
            : `Field group ${id} cannot be updated because record ${recordId} would become invalid.`,
        },
      };
    }
  }

  return updated;
}
