import type { CanonicalProject } from '../project';
import {
  createRelation as createBaseRelation,
  removeRelation as removeBaseRelation,
  updateRelation as updateBaseRelation,
  type RelationMutationResult,
} from './relation';
import { validateReferenceContentRecordDefinition } from './reference-content-record';
import { validateReferenceFieldGroupDefinition } from './reference-field-group';
import { createContentFieldTypeRegistry } from './reference-field-types';

export function createRelationWithIntegrity(project: CanonicalProject, input: unknown): RelationMutationResult {
  return createBaseRelation(project, input);
}

export function updateRelationWithIntegrity(project: CanonicalProject, id: string, input: unknown): RelationMutationResult {
  const updated = updateBaseRelation(project, id, input);
  if (!updated.ok) return updated;
  const registry = createContentFieldTypeRegistry();
  for (const [groupId, raw] of Object.entries(updated.project.fieldGroups)) {
    const validation = validateReferenceFieldGroupDefinition(updated.project, raw, registry);
    if (!validation.ok) {
      const first = validation.issues[0];
      return { ok: false, error: { code: 'RELATION_IN_USE', message: first ? `Relation ${id} cannot be updated because Field Group ${groupId} would become invalid: ${first.message}` : `Relation ${id} cannot be updated because Field Group ${groupId} would become invalid.` } };
    }
  }
  for (const [recordId, raw] of Object.entries(updated.project.records)) {
    const validation = validateReferenceContentRecordDefinition(raw, updated.project, registry);
    if (!validation.ok) {
      const first = validation.issues[0];
      return { ok: false, error: { code: 'RELATION_IN_USE', message: first ? `Relation ${id} cannot be updated because record ${recordId} would become invalid: ${first.message}` : `Relation ${id} cannot be updated because record ${recordId} would become invalid.` } };
    }
  }
  return updated;
}

export function removeRelationWithIntegrity(project: CanonicalProject, id: string): RelationMutationResult {
  return removeBaseRelation(project, id);
}
