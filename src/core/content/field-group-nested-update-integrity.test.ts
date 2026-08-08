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

function field(
  type: string,
  id: string,
  patch: Partial<CustomFieldDefinition> = {},
): CustomFieldDefinition {
  const registry = createContentFieldTypeRegistry();
  return {
    ...createDefaultCustomFieldDefinition(registry, type, id, id),
    ...patch,
  };
}

describe('nested field group update record integrity', () => {
  it('blocks child schema changes that invalidate records through a parent Group reference', () => {
    let project = createCanonicalProject({
      id: 'nested_field_group_integrity',
      name: 'Nested Field Group Integrity',
      now: '2026-08-08T16:00:00.000Z',
    });

    const contentType = createContentType(
      project,
      createDefaultContentTypeDefinition('orders', 'Orders'),
    );
    if (!contentType.ok) throw new Error(contentType.error.message);
    project = contentType.project;

    const address = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('address-fields', 'Address Fields'),
      fields: [field('core/text', 'city', { name: 'city' })],
    });
    if (!address.ok) throw new Error(address.error.message);
    project = address.project;

    const order = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('order-data', 'Order Data'),
      fields: [
        field('core/group', 'shipping-address', {
          name: 'shipping_address',
          config: { fieldGroupId: 'address-fields' },
          defaultValue: {},
        }),
      ],
    });
    if (!order.ok) throw new Error(order.error.message);
    project = order.project;

    const record = createContentRecord(project, {
      ...createDefaultContentRecordDefinition(project, 'orders', 'order-one'),
      title: 'Order one',
      slug: 'order-one',
      fieldGroupIds: ['order-data'],
      fieldValues: {
        'order-data': {
          shipping_address: { city: 'Houston' },
        },
      },
    });
    if (!record.ok) throw new Error(record.error.message);
    project = record.project;

    const currentAddress = project.fieldGroups['address-fields'];
    if (!currentAddress) throw new Error('address-fields field group was not created.');

    const result = updateFieldGroup(project, 'address-fields', {
      ...currentAddress,
      fields: [
        field('core/text', 'city', { name: 'city' }),
        field('core/text', 'state', {
          name: 'state',
          required: true,
          defaultValue: null,
        }),
      ],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('FIELD_GROUP_IN_USE');
    expect(result.error.message).toContain('order-one');
    expect(project.records['order-one']).toBeDefined();
  });
});
