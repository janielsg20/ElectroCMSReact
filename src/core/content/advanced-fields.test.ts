import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import {
  createContentFieldTypeRegistry,
  createDefaultContentRecordDefinition,
  createDefaultContentTypeDefinition,
  createDefaultCustomFieldDefinition,
  createDefaultFieldGroupDefinition,
  createContentRecord,
  createContentType,
  createFieldGroup,
  removeFieldGroup,
  updateFieldGroup,
  validateContentRecordDefinition,
  type CustomFieldDefinition,
  type FieldGroupDefinition,
} from './index';

function project() {
  const base = createCanonicalProject({ id: 'advanced_fields_test', name: 'Advanced Fields Test', now: '2026-08-08T12:00:00.000Z' });
  const contentType = createContentType(base, createDefaultContentTypeDefinition('products', 'Products'));
  if (!contentType.ok) throw new Error(contentType.error.message);
  return contentType.project;
}

function field(type: string, id: string, label: string, patch: Partial<CustomFieldDefinition> = {}): CustomFieldDefinition {
  const registry = createContentFieldTypeRegistry();
  return { ...createDefaultCustomFieldDefinition(registry, type, id, label), ...patch };
}

function addGroup(current: ReturnType<typeof project>, id: string, label: string, fields: CustomFieldDefinition[]) {
  const definition: FieldGroupDefinition = { ...createDefaultFieldGroupDefinition(id, label), fields };
  const result = createFieldGroup(current, definition);
  if (!result.ok) throw new Error(result.error.message);
  return result.project;
}

function advancedProject() {
  let current = project();
  current = addGroup(current, 'address-fields', 'Address fields', [
    field('core/text', 'city', 'City', { name: 'city', required: true }),
    field('core/text', 'state', 'State', { name: 'state' }),
  ]);
  current = addGroup(current, 'line-item-fields', 'Line item fields', [
    field('core/text', 'name', 'Name', { name: 'name', required: true }),
    field('core/number', 'amount', 'Amount', { name: 'amount', required: true }),
  ]);
  current = addGroup(current, 'order-data', 'Order data', [
    field('core/number', 'quantity', 'Quantity', { name: 'quantity', defaultValue: 1 }),
    field('core/currency', 'unit-price', 'Unit price', { name: 'unit_price', defaultValue: 0 }),
    field('core/calculated', 'subtotal', 'Subtotal', { name: 'subtotal', config: { expression: 'quantity * unit_price' }, defaultValue: 0 }),
    field('core/switch', 'show-extra', 'Show extra', { name: 'show_extra', defaultValue: false }),
    field('core/group', 'shipping', 'Shipping', { name: 'shipping', config: { fieldGroupId: 'address-fields' }, defaultValue: {} }),
    field('core/repeater', 'items', 'Items', { name: 'items', config: { fieldGroupId: 'line-item-fields', minItems: 1, maxItems: 5 }, defaultValue: [] }),
    field('core/conditional', 'extra-address', 'Extra address', { name: 'extra_address', config: { fieldGroupId: 'address-fields', sourceField: 'show_extra', operator: 'truthy' }, defaultValue: null }),
  ]);
  return current;
}

describe('MF-042 advanced fields', () => {
  it('activates only repeater, group, calculated and conditional as version 2', () => {
    const registry = createContentFieldTypeRegistry();
    for (const type of ['core/repeater', 'core/group', 'core/calculated', 'core/conditional']) {
      expect(registry.resolve(type)).toMatchObject({ version: 2, availability: 'available' });
    }
    expect(registry.resolve('core/relation')).toMatchObject({ version: 1, availability: 'modeled' });
    expect(registry.resolve('core/user')).toMatchObject({ version: 1, availability: 'modeled' });
    expect(registry.resolve('core/taxonomy')).toMatchObject({ version: 1, availability: 'modeled' });
  });

  it('creates reusable group/repeater/conditional schemas and blocks reference cycles', () => {
    const current = advancedProject();
    const address = {
      ...createDefaultFieldGroupDefinition('address-fields', 'Address fields'),
      fields: [
        field('core/text', 'city', 'City', { name: 'city', required: true }),
        field('core/group', 'recursive-order', 'Recursive order', { name: 'recursive_order', config: { fieldGroupId: 'order-data' }, defaultValue: {} }),
      ],
    };
    const result = updateFieldGroup(current, 'address-fields', address);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('cycles');
  });

  it('normalizes calculated/conditional values and validates nested group and repeater rows', () => {
    const current = advancedProject();
    const draft = {
      ...createDefaultContentRecordDefinition(current, 'products', 'product-one'),
      title: 'Product one', slug: 'product-one', status: 'published' as const,
      fieldGroupIds: ['order-data'],
      fieldValues: { 'order-data': { quantity: 2, unit_price: 12.5, subtotal: 999, show_extra: false, shipping: { city: 'Houston', state: 'TX' }, items: [{ name: 'Main item', amount: 2 }], extra_address: { city: 'Should be cleared' } } },
    };
    const validation = validateContentRecordDefinition(draft, current);
    expect(validation.ok).toBe(true);
    if (!validation.ok) return;
    expect(validation.value.fieldValues['order-data']).toMatchObject({ subtotal: 25, extra_address: null });
    const created = createContentRecord(current, draft);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.fieldValues['order-data']?.subtotal).toBe(25);
    expect(created.value.fieldValues['order-data']?.extra_address).toBeNull();
  });

  it('requires nested fields when conditional becomes active and validates repeater limits', () => {
    const current = advancedProject();
    const draft = {
      ...createDefaultContentRecordDefinition(current, 'products', 'product-two'),
      title: 'Product two', slug: 'product-two', fieldGroupIds: ['order-data'],
      fieldValues: { 'order-data': { quantity: 1, unit_price: 10, subtotal: 10, show_extra: true, shipping: { city: 'Houston' }, items: [], extra_address: {} } },
    };
    const validation = validateContentRecordDefinition(draft, current);
    expect(validation.ok).toBe(false);
    if (!validation.ok) expect(validation.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: expect.stringContaining('items') }),
      expect.objectContaining({ path: expect.stringContaining('extra_address.city') }),
    ]));
  });

  it('protects a referenced Field Group from advanced schema deletion', () => {
    const current = advancedProject();
    const removed = removeFieldGroup(current, 'address-fields');
    expect(removed.ok).toBe(false);
    if (!removed.ok) {
      expect(removed.error.code).toBe('FIELD_GROUP_IN_USE');
      expect(removed.error.message).toContain('Order data');
    }
  });
});
