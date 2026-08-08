import type { CanonicalProject } from '../project';
import { createContentFieldTypeRegistry } from './advanced-field-types';
import {
  MAX_ADVANCED_FIELD_DEPTH,
  advancedFieldGroupReference,
  validateAdvancedFieldConfig,
} from './advanced-field-runtime';
import {
  createFieldGroup as createBaseFieldGroup,
  listFieldGroupDefinitions as listBaseFieldGroups,
  updateFieldGroup as updateBaseFieldGroup,
  validateFieldGroupDefinition as validateBaseFieldGroup,
  type FieldGroupDefinition,
  type FieldGroupMutationResult,
  type FieldGroupValidationIssue,
  type FieldGroupValidationResult,
} from './field-group';
import { FieldTypeRegistry } from './field-type-registry';

function calculationIdentifiers(expression: string): string[] {
  const matches = expression.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
  return [...new Set(matches)];
}

function referenceGraphIssues(
  candidateId: string,
  groups: ReadonlyMap<string, FieldGroupDefinition>,
): FieldGroupValidationIssue[] {
  const issues: FieldGroupValidationIssue[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const hasCycle = (groupId: string): boolean => {
    if (visiting.has(groupId)) return true;
    if (visited.has(groupId)) return false;
    visiting.add(groupId);
    const group = groups.get(groupId);
    if (group) {
      for (const field of group.fields) {
        const reference = advancedFieldGroupReference(field);
        if (reference && groups.has(reference) && hasCycle(reference)) return true;
      }
    }
    visiting.delete(groupId);
    visited.add(groupId);
    return false;
  };

  if (hasCycle(candidateId)) {
    return [{
      code: 'INVALID_CONFIG',
      path: 'fields',
      message: 'Advanced Field Group references cannot contain direct or indirect cycles.',
    }];
  }

  const memo = new Map<string, number>();
  const maxDepth = (groupId: string): number => {
    const cached = memo.get(groupId);
    if (cached !== undefined) return cached;
    const group = groups.get(groupId);
    if (!group) return 0;
    let depth = 0;
    for (const field of group.fields) {
      const reference = advancedFieldGroupReference(field);
      if (!reference || !groups.has(reference)) continue;
      depth = Math.max(depth, 1 + maxDepth(reference));
    }
    memo.set(groupId, depth);
    return depth;
  };

  const depth = maxDepth(candidateId);
  if (depth > MAX_ADVANCED_FIELD_DEPTH) {
    issues.push({
      code: 'INVALID_CONFIG',
      path: 'fields',
      message: `Advanced Field Group nesting cannot exceed ${MAX_ADVANCED_FIELD_DEPTH} referenced levels.`,
    });
  }
  return issues;
}

function contextualIssues(
  project: CanonicalProject,
  candidate: FieldGroupDefinition,
  registry: FieldTypeRegistry,
): FieldGroupValidationIssue[] {
  const issues: FieldGroupValidationIssue[] = [];
  const groups = new Map<string, FieldGroupDefinition>();
  for (const raw of Object.values(project.fieldGroups)) {
    const validation = validateBaseFieldGroup(raw, registry);
    if (validation.ok) groups.set(validation.value.id, validation.value);
  }
  groups.set(candidate.id, candidate);

  candidate.fields.forEach((field, index) => {
    for (const advancedIssue of validateAdvancedFieldConfig(field)) {
      issues.push({
        code: 'INVALID_CONFIG',
        path: `fields.${index}.${advancedIssue.path}`,
        message: advancedIssue.message,
      });
    }

    const reference = advancedFieldGroupReference(field);
    if (reference && !groups.has(reference)) {
      issues.push({
        code: 'INVALID_CONFIG',
        path: `fields.${index}.config.fieldGroupId`,
        message: `Referenced Field Group ${reference} does not exist.`,
      });
    }

    if (field.type === 'core/conditional') {
      const sourceField = typeof field.config.sourceField === 'string' ? field.config.sourceField : '';
      const source = candidate.fields.find((item) => item.name === sourceField);
      if (!source || source.id === field.id) {
        issues.push({
          code: 'INVALID_CONFIG',
          path: `fields.${index}.config.sourceField`,
          message: 'Conditional sourceField must reference another field in the same Field Group.',
        });
      }
    }

    if (field.type === 'core/calculated') {
      const expression = typeof field.config.expression === 'string' ? field.config.expression : '';
      const allowedNumeric = new Set(
        candidate.fields
          .filter((item) => item.id !== field.id && ['core/number', 'core/currency'].includes(item.type))
          .map((item) => item.name),
      );
      for (const identifier of calculationIdentifiers(expression)) {
        if (!allowedNumeric.has(identifier)) {
          issues.push({
            code: 'INVALID_CONFIG',
            path: `fields.${index}.config.expression`,
            message: `Calculated field reference ${identifier} must resolve to a sibling Number or Currency field.`,
          });
        }
      }
    }
  });

  issues.push(...referenceGraphIssues(candidate.id, groups));
  return issues;
}

export function validateAdvancedFieldGroupDefinition(
  project: CanonicalProject,
  input: unknown,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): FieldGroupValidationResult {
  const validation = validateBaseFieldGroup(input, registry);
  if (!validation.ok) return validation;
  const issues = contextualIssues(project, validation.value, registry);
  return issues.length > 0 ? { ok: false, issues } : validation;
}

export function listAdvancedFieldGroupDefinitions(
  project: CanonicalProject,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): FieldGroupDefinition[] {
  return listBaseFieldGroups(project, registry).filter(
    (group) => validateAdvancedFieldGroupDefinition(project, group, registry).ok,
  );
}

export function createAdvancedFieldGroup(
  project: CanonicalProject,
  input: unknown,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): FieldGroupMutationResult {
  const validation = validateAdvancedFieldGroupDefinition(project, input, registry);
  if (!validation.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_DEFINITION',
        message: validation.issues.map((item) => item.message).join(' '),
        issues: validation.issues,
      },
    };
  }
  return createBaseFieldGroup(project, validation.value, registry);
}

export function updateAdvancedFieldGroup(
  project: CanonicalProject,
  id: string,
  input: unknown,
  registry: FieldTypeRegistry = createContentFieldTypeRegistry(),
): FieldGroupMutationResult {
  const validation = validateAdvancedFieldGroupDefinition(project, input, registry);
  if (!validation.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_DEFINITION',
        message: validation.issues.map((item) => item.message).join(' '),
        issues: validation.issues,
      },
    };
  }
  return updateBaseFieldGroup(project, id, validation.value, registry);
}
