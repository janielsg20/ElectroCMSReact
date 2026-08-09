import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import {
  createContentFieldTypeRegistry,
  createContentRecord,
  createContentType,
  createDefaultContentRecordDefinition,
  createDefaultContentTypeDefinition,
  createDefaultCustomFieldDefinition,
  createDefaultFieldGroupDefinition,
  createFieldGroup,
  updateFieldGroup,
  type CustomFieldDefinition,
} from './index';

function field(type: string, id: string, patch: Partial<CustomFieldDefinition> = {}): CustomFieldDefinition {
  const registry = createContentFieldTypeRegistry();
  return { ...createDefaultCustomFieldDefinition(registry, type, id, id), ...patch };
}

function baseProject() {
  let project = createCanonicalProject({ id: 'advanced_integrity', name: 'Advanced Integrity', now: '2026-08-08T16:00:00.000Z' });
  const contentType = createContentType(project, createDefaultContentTypeDefinition('orders', 'Orders'));
  if (!contentType.ok) throw new Error(contentType.error.message);
  project = contentType.project;
  return project;
}

describe('MF-042 schema update integrity', () => {
  it('blocks child schema changes that invalidate Records through a parent Group reference', () => {
    let project = baseProject();
    const address = createFieldGroup(project, { ...createDefaultFieldGroupDefinition('address-fields', 'Address Fields'), fields: [field('core/text', 'city', { name: 'city' })] });
    if (!address.ok) throw new Error(address.error.message);
    project = address.project;
    const order = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('order-data', 'Order Data'),
      fields: [field('core/group', 'shipping-address', { name: 'shipping_address', config: { fieldGroupId: 'address-fields' }, defaultValue: {} })],
    });
    if (!order.ok) throw new Error(order.error.message);
    project = order.project;
    const record = createContentRecord(project, {
      ...createDefaultContentRecordDefinition(project, 'orders', 'order-one'),
      title: 'Order one', slug: 'order-one', fieldGroupIds: ['order-data'],
      fieldValues: { 'order-data': { shipping_address: { city: 'Houston' } } },
    });
    if (!record.ok) throw new Error(record.error.message);
    project = record.project;
    const currentAddress = project.fieldGroups['address-fields'];
    if (!currentAddress) throw new Error('Missing address group.');
    const result = updateFieldGroup(project, 'address-fields', {
      ...currentAddress,
      fields: [field('core/text', 'city', { name: 'city' }), field('core/text', 'state', { name: 'state', required: true, defaultValue: null })],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FIELD_GROUP_IN_USE');
      expect(result.error.message).toContain('order-one');
    }
  });

  it('allows compatible schema changes while preserving existing Records', () => {
    let project = baseProject();
    const group = createFieldGroup(project, { ...createDefaultFieldGroupDefinition('order-details', 'Order Details'), fields: [field('core/text', 'nickname', { name: 'nickname' })] });
    if (!group.ok) throw new Error(group.error.message);
    project = group.project;
    const record = createContentRecord(project, {
      ...createDefaultContentRecordDefinition(project, 'orders', 'order-two'), title: 'Order two', slug: 'order-two', fieldGroupIds: ['order-details'], fieldValues: { 'order-details': { nickname: 'Primary' } },
    });
    if (!record.ok) throw new Error(record.error.message);
    project = record.project;
    const current = project.fieldGroups['order-details'];
    if (!current) throw new Error('Missing details group.');
    const result = updateFieldGroup(project, 'order-details', {
      ...current,
      label: 'Order Details Updated',
      fields: [field('core/text', 'nickname', { name: 'nickname' }), field('core/text', 'optional-note', { name: 'optional_note', defaultValue: null })],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.project.records['order-two']).toEqual(project.records['order-two']);
  });

  it('blocks a child update that would push an ancestor chain beyond depth 8', () => {
    let project = baseProject();
    const target = createFieldGroup(project, { ...createDefaultFieldGroupDefinition('target-group', 'Target Group'), fields: [] });
    if (!target.ok) throw new Error(target.error.message);
    project = target.project;
    const extra = createFieldGroup(project, { ...createDefaultFieldGroupDefinition('extra-group', 'Extra Group'), fields: [] });
    if (!extra.ok) throw new Error(extra.error.message);
    project = extra.project;
    let childId = 'target-group';
    for (let index = 1; index <= 8; index += 1) {
      const id = `chain-${index}`;
      const created = createFieldGroup(project, {
        ...createDefaultFieldGroupDefinition(id, `Chain ${index}`),
        fields: [field('core/group', `nested-${index}`, { name: `nested_${index}`, config: { fieldGroupId: childId }, defaultValue: {} })],
      });
      if (!created.ok) throw new Error(created.error.message);
      project = created.project;
      childId = id;
    }
    const currentTarget = project.fieldGroups['target-group'];
    if (!currentTarget) throw new Error('Missing target group.');
    const result = updateFieldGroup(project, 'target-group', {
      ...currentTarget,
      fields: [field('core/group', 'extra', { name: 'extra', config: { fieldGroupId: 'extra-group' }, defaultValue: {} })],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FIELD_GROUP_IN_USE');
      expect(result.error.message).toContain('cannot exceed 8');
    }
  });
});
