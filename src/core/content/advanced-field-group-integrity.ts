import type { CanonicalProject } from '../project';
import { advancedFieldGroupReference } from './advanced-field-runtime';
import { listAdvancedFieldGroupDefinitions } from './advanced-field-group';
import { removeFieldGroupWithRecordIntegrity } from './field-group-record-integrity';
import type { FieldGroupMutationResult } from './field-group';
import { FieldTypeRegistry } from './field-type-registry';
import { createContentFieldTypeRegistry } from './reference-field-types';

export function removeFieldGroupWithAdvancedIntegrity(
  project: CanonicalProject,
  id: string,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): FieldGroupMutationResult {
  const referencedBy = listAdvancedFieldGroupDefinitions(project, registry).find(
    (group) => group.id !== id && group.fields.some((field) => advancedFieldGroupReference(field) === id),
  );
  if (referencedBy) {
    return {
      ok: false,
      error: {
        code: 'FIELD_GROUP_IN_USE',
        message: `Field group ${id} is referenced by advanced fields in ${referencedBy.label} and cannot be deleted until that reference is removed.`,
      },
    };
  }
  return removeFieldGroupWithRecordIntegrity(project, id, registry);
}
