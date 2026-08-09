import type { CanonicalProject } from '../project';
import {
  createAdvancedFieldGroup,
  listAdvancedFieldGroupDefinitions,
  validateAdvancedFieldGroupDefinition,
} from './advanced-field-group';
import type {
  FieldGroupDefinition,
  FieldGroupMutationResult,
  FieldGroupValidationIssue,
  FieldGroupValidationResult,
} from './field-group';
import { updateFieldGroupWithRecordIntegrity } from './field-group-update-integrity';
import { FieldTypeRegistry } from './field-type-registry';
import { listRelationDefinitions } from './relation';
import { validateReferenceContentRecordDefinition } from './reference-content-record';
import {
  createContentFieldTypeRegistry,
  isMf043ReferenceField,
} from './reference-field-types';
import { listTaxonomyDefinitions } from './taxonomy';

function contextualReferenceIssues(
  project: CanonicalProject,
  group: FieldGroupDefinition,
): FieldGroupValidationIssue[] {
  const relationIds = new Set(listRelationDefinitions(project).map((relation) => relation.id));
  const taxonomyIds = new Set(listTaxonomyDefinitions(project).map((taxonomy) => taxonomy.id));
  const issues: FieldGroupValidationIssue[] = [];

  group.fields.forEach((field, index) => {
    if (!isMf043ReferenceField(field)) return;
    if (field.type === 'core/relation') {
      const relationId = typeof field.config.relationId === 'string' ? field.config.relationId : '';
      if (!relationIds.has(relationId)) {
        issues.push({ code: 'INVALID_CONFIG', path: `fields.${index}.config.relationId`, message: `Referenced Relation ${relationId || '(empty)'} does not exist.` });
      }
    }
    if (field.type === 'core/taxonomy') {
      const taxonomyId = typeof field.config.taxonomyId === 'string' ? field.config.taxonomyId : '';
      if (!taxonomyIds.has(taxonomyId)) {
        issues.push({ code: 'INVALID_CONFIG', path: `fields.${index}.config.taxonomyId`, message: `Referenced Taxonomy ${taxonomyId || '(empty)'} does not exist.` });
      }
    }
  });

  return issues;
}

export function validateReferenceFieldGroupDefinition(
  project: CanonicalProject,
  input: unknown,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): FieldGroupValidationResult {
  const base = validateAdvancedFieldGroupDefinition(project, input, registry);
  if (!base.ok) return base;
  const issues = contextualReferenceIssues(project, base.value);
  return issues.length > 0 ? { ok: false, issues } : base;
}

export function listReferenceFieldGroupDefinitions(
  project: CanonicalProject,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): FieldGroupDefinition[] {
  return listAdvancedFieldGroupDefinitions(project, registry).filter(
    (group) => validateReferenceFieldGroupDefinition(project, group, registry).ok,
  );
}

function invalidMutation(validation: { ok: false; issues: readonly FieldGroupValidationIssue[] }): FieldGroupMutationResult {
  return { ok: false, error: { code: 'INVALID_DEFINITION', message: validation.issues.map((issue) => issue.message).join(' '), issues: validation.issues } };
}

export function createReferenceFieldGroup(
  project: CanonicalProject,
  input: unknown,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): FieldGroupMutationResult {
  const validation = validateReferenceFieldGroupDefinition(project, input, registry);
  if (!validation.ok) return invalidMutation(validation);
  return createAdvancedFieldGroup(project, validation.value, registry);
}

export function updateReferenceFieldGroup(
  project: CanonicalProject,
  id: string,
  input: unknown,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): FieldGroupMutationResult {
  const validation = validateReferenceFieldGroupDefinition(project, input, registry);
  if (!validation.ok) return invalidMutation(validation);
  const updated = updateFieldGroupWithRecordIntegrity(project, id, validation.value, registry);
  if (!updated.ok) return updated;
  for (const [recordId, raw] of Object.entries(updated.project.records)) {
    const recordValidation = validateReferenceContentRecordDefinition(raw, updated.project, registry);
    if (!recordValidation.ok) {
      const first = recordValidation.issues[0];
      return {
        ok: false,
        error: {
          code: 'FIELD_GROUP_IN_USE',
          message: first
            ? `Field group ${id} cannot be updated because record ${recordId} would become invalid: ${first.message}`
            : `Field group ${id} cannot be updated because record ${recordId} would become invalid.`,
        },
      };
    }
  }
  return updated;
}
