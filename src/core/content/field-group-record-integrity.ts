import { isJsonObject } from '../domain';
import type { CanonicalProject } from '../project';
import { removeFieldGroup, type FieldGroupMutationResult } from './field-group';
import type { FieldTypeRegistry } from './field-type-registry';

export function removeFieldGroupWithRecordIntegrity(
  project: CanonicalProject,
  id: string,
  registry?: FieldTypeRegistry,
): FieldGroupMutationResult {
  const recordInUse = Object.values(project.records).some((record) => {
    if (!isJsonObject(record) || !Array.isArray(record.fieldGroupIds)) return false;
    return record.fieldGroupIds.includes(id);
  });

  if (recordInUse) {
    return {
      ok: false,
      error: {
        code: 'FIELD_GROUP_IN_USE',
        message: `Field group ${id} is assigned to a content record and cannot be deleted until that association is removed.`,
      },
    };
  }

  return registry ? removeFieldGroup(project, id, registry) : removeFieldGroup(project, id);
}
