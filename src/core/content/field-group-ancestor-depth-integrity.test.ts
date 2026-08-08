import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import {
  createContentFieldTypeRegistry,
  createDefaultCustomFieldDefinition,
  createDefaultFieldGroupDefinition,
  createFieldGroup,
  updateFieldGroup,
  type CustomFieldDefinition,
} from './index';

function groupReferenceField(id: string, targetGroupId: string): CustomFieldDefinition {
  const registry = createContentFieldTypeRegistry();
  return {
    ...createDefaultCustomFieldDefinition(registry, 'core/group', id, id),
    name: id.replaceAll('-', '_'),
    config: { fieldGroupId: targetGroupId },
    defaultValue: {},
  };
}

describe('field group ancestor depth integrity', () => {
  it('blocks a child update that would push an ancestor chain beyond depth 8', () => {
    let project = createCanonicalProject({
      id: 'ancestor_depth_integrity',
      name: 'Ancestor Depth Integrity',
      now: '2026-08-08T16:00:00.000Z',
    });

    const target = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('target-group', 'Target Group'),
      fields: [],
    });
    if (!target.ok) throw new Error(target.error.message);
    project = target.project;

    const extra = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('extra-group', 'Extra Group'),
      fields: [],
    });
    if (!extra.ok) throw new Error(extra.error.message);
    project = extra.project;

    let childId = 'target-group';
    for (let index = 1; index <= 8; index += 1) {
      const id = `chain-${index}`;
      const created = createFieldGroup(project, {
        ...createDefaultFieldGroupDefinition(id, `Chain ${index}`),
        fields: [groupReferenceField(`nested-${index}`, childId)],
      });
      if (!created.ok) throw new Error(created.error.message);
      project = created.project;
      childId = id;
    }

    const currentTarget = project.fieldGroups['target-group'];
    if (!currentTarget) throw new Error('target-group was not created.');

    const result = updateFieldGroup(project, 'target-group', {
      ...currentTarget,
      fields: [groupReferenceField('extra', 'extra-group')],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('FIELD_GROUP_IN_USE');
    expect(result.error.message).toContain('chain-8');
    expect(result.error.message).toContain('cannot exceed 8');
  });
});
