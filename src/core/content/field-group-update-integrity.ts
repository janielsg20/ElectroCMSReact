import { isJsonObject } from '../domain';
import type { CanonicalProject } from '../project';
import { validateAdvancedContentRecordDefinition } from './advanced-content-record';
import {
  updateAdvancedFieldGroup,
} from './advanced-field-group';
import { createContentFieldTypeRegistry } from './advanced-field-types';
import type { FieldGroupMutationResult } from './field-group';
import { FieldTypeRegistry } from './field-type-registry';

function recordUsesFieldGroup(raw: unknown, fieldGroupId: string): boolean {
  return isJsonObject(raw)
    && Array.isArray(raw.fieldGroupIds)
    && raw.fieldGroupIds.includes(fieldGroupId);
}

export function updateFieldGroupWithRecordIntegrity(
  project: CanonicalProject,
  id: string,
  input: unknown,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): FieldGroupMutationResult {
  const updated = updateAdvancedFieldGroup(project, id, input, registry);
  if (!updated.ok) return updated;

  for (const [recordId, raw] of Object.entries(project.records)) {
    if (!recordUsesFieldGroup(raw, id)) continue;
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
