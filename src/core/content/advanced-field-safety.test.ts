import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import {
  createContentFieldTypeRegistry,
  createDefaultContentRecordDefinition,
  createDefaultContentTypeDefinition,
  createDefaultCustomFieldDefinition,
  createDefaultFieldGroupDefinition,
  createContentType,
  createFieldGroup,
  validateCalculationExpression,
  validateContentRecordDefinition,
  type CustomFieldDefinition,
} from './index';

function baseProject() {
  const project = createCanonicalProject({
    id: 'advanced_field_safety',
    name: 'Advanced Field Safety',
    now: '2026-08-08T12:00:00.000Z',
  });
  const contentType = createContentType(
    project,
    createDefaultContentTypeDefinition('products', 'Products'),
  );
  if (!contentType.ok) throw new Error(contentType.error.message);
  return contentType.project;
}

function field(type: string, id: string, patch: Partial<CustomFieldDefinition> = {}) {
  const registry = createContentFieldTypeRegistry();
  return {
    ...createDefaultCustomFieldDefinition(registry, type, id, id),
    ...patch,
  };
}

describe('MF-042 advanced field safety', () => {
  it('accepts arithmetic expressions but rejects code-like or malformed syntax', () => {
    expect(validateCalculationExpression('(quantity * unit_price) + tax').ok).toBe(true);
    expect(validateCalculationExpression('globalThis.alert(1)').ok).toBe(false);
    expect(validateCalculationExpression('quantity ** 2').ok).toBe(false);
    expect(validateCalculationExpression('quantity; unit_price').ok).toBe(false);
  });

  it('enforces advanced safety rules directly at the field type registry boundary', () => {
    const registry = createContentFieldTypeRegistry();
    expect(registry.validateConfig('core/repeater', {
      fieldGroupId: 'child-fields',
      minItems: 0,
      maxItems: 101,
    }, 2).valid).toBe(false);
    expect(registry.validateConfig('core/calculated', {
      expression: `${'1 + '.repeat(61)}1`,
    }, 2).valid).toBe(false);
    expect(registry.validateConfig('core/conditional', {
      fieldGroupId: 'child-fields',
      sourceField: 'status',
      operator: 'equals',
    }, 2).valid).toBe(false);
    expect(registry.validateConfig('core/conditional', {
      fieldGroupId: 'child-fields',
      sourceField: 'quantity',
      operator: 'greaterThan',
      compareValue: '2',
    }, 2).valid).toBe(false);
    expect(registry.validateConfig('core/conditional', {
      fieldGroupId: 'child-fields',
      sourceField: 'enabled',
      operator: 'truthy',
    }, 2).valid).toBe(true);
  });

  it('rejects repeater configurations beyond the runtime safety cap', () => {
    const project = baseProject();
    const child = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('child-fields', 'Child Fields'),
      fields: [field('core/text', 'name', { name: 'name' })],
    });
    expect(child.ok).toBe(true);
    if (!child.ok) return;

    const parent = createFieldGroup(child.project, {
      ...createDefaultFieldGroupDefinition('parent-fields', 'Parent Fields'),
      fields: [
        field('core/repeater', 'items', {
          name: 'items',
          config: { fieldGroupId: 'child-fields', minItems: 0, maxItems: 101 },
          defaultValue: [],
        }),
      ],
    });
    expect(parent.ok).toBe(false);
    if (!parent.ok) expect(parent.error.message).toContain('100');
  });

  it('keeps calculated fields independent of calculated field ordering', () => {
    const project = baseProject();
    const result = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('totals', 'Totals'),
      fields: [
        field('core/number', 'quantity', { name: 'quantity', defaultValue: 2 }),
        field('core/calculated', 'subtotal', {
          name: 'subtotal',
          config: { expression: 'quantity * 2' },
          defaultValue: 0,
        }),
        field('core/calculated', 'grand-total', {
          name: 'grand_total',
          config: { expression: 'subtotal + 1' },
          defaultValue: 0,
        }),
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Number or Currency');
    }
  });

  it('requires conditional sources to be non-advanced siblings', () => {
    const project = baseProject();
    const child = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('conditional-child', 'Conditional Child'),
      fields: [field('core/text', 'note', { name: 'note' })],
    });
    expect(child.ok).toBe(true);
    if (!child.ok) return;

    const result = createFieldGroup(child.project, {
      ...createDefaultFieldGroupDefinition('conditional-order', 'Conditional Order'),
      fields: [
        field('core/number', 'quantity', { name: 'quantity', defaultValue: 2 }),
        field('core/calculated', 'subtotal', {
          name: 'subtotal',
          config: { expression: 'quantity * 2' },
          defaultValue: 0,
        }),
        field('core/conditional', 'details', {
          name: 'details',
          config: {
            fieldGroupId: 'conditional-child',
            sourceField: 'subtotal',
            operator: 'greaterThan',
            compareValue: 2,
          },
          defaultValue: null,
        }),
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('non-advanced sibling');
    }
  });

  it('requires numeric conditional operators to use Number or Currency sibling sources', () => {
    let project = baseProject();
    const child = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('numeric-condition-child', 'Numeric Condition Child'),
      fields: [field('core/text', 'note', { name: 'note' })],
    });
    expect(child.ok).toBe(true);
    if (!child.ok) return;
    project = child.project;

    const invalid = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('invalid-numeric-condition', 'Invalid Numeric Condition'),
      fields: [
        field('core/text', 'status', { name: 'status', defaultValue: '10' }),
        field('core/conditional', 'details', {
          name: 'details',
          config: {
            fieldGroupId: 'numeric-condition-child',
            sourceField: 'status',
            operator: 'greaterThan',
            compareValue: 2,
          },
          defaultValue: null,
        }),
      ],
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.error.message).toContain('Number or Currency');
    }

    const valid = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('valid-numeric-condition', 'Valid Numeric Condition'),
      fields: [
        field('core/currency', 'amount', { name: 'amount', defaultValue: 10 }),
        field('core/conditional', 'details', {
          name: 'details',
          config: {
            fieldGroupId: 'numeric-condition-child',
            sourceField: 'amount',
            operator: 'lessThan',
            compareValue: 20,
          },
          defaultValue: null,
        }),
      ],
    });
    expect(valid.ok).toBe(true);
  });

  it('canonically normalizes nested calculated and conditional values regardless of schema order', () => {
    let project = baseProject();
    const detail = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('detail-fields', 'Detail Fields'),
      fields: [field('core/text', 'note', { name: 'note', defaultValue: 'ready' })],
    });
    expect(detail.ok).toBe(true);
    if (!detail.ok) return;
    project = detail.project;

    const nested = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('nested-fields', 'Nested Fields'),
      fields: [
        field('core/conditional', 'details', {
          name: 'details',
          config: {
            fieldGroupId: 'detail-fields',
            sourceField: 'enabled',
            operator: 'truthy',
          },
          defaultValue: null,
        }),
        field('core/calculated', 'total', {
          name: 'total',
          config: { expression: 'quantity * unit_price' },
          defaultValue: 0,
        }),
        field('core/number', 'quantity', { name: 'quantity', defaultValue: 2 }),
        field('core/currency', 'unit-price', { name: 'unit_price', defaultValue: 3 }),
        field('core/switch', 'enabled', { name: 'enabled', defaultValue: true }),
      ],
    });
    expect(nested.ok).toBe(true);
    if (!nested.ok) return;
    project = nested.project;

    const wrapper = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('wrapper-fields', 'Wrapper Fields'),
      fields: [
        field('core/group', 'nested', {
          name: 'nested',
          config: { fieldGroupId: 'nested-fields' },
          defaultValue: {},
        }),
        field('core/repeater', 'rows', {
          name: 'rows',
          config: { fieldGroupId: 'nested-fields', minItems: 0, maxItems: 5 },
          defaultValue: [],
        }),
      ],
    });
    expect(wrapper.ok).toBe(true);
    if (!wrapper.ok) return;
    project = wrapper.project;

    const draft = {
      ...createDefaultContentRecordDefinition(project, 'products', 'nested-normalization'),
      title: 'Nested normalization',
      slug: 'nested-normalization',
      fieldGroupIds: ['wrapper-fields'],
      fieldValues: {
        'wrapper-fields': {
          nested: {
            details: null,
            total: 999,
            quantity: 4,
            unit_price: 5,
            enabled: true,
          },
          rows: [{
            details: null,
            total: 999,
            quantity: 3,
            unit_price: 2,
            enabled: true,
          }],
        },
      },
    };

    const validation = validateContentRecordDefinition(draft, project);
    expect(validation.ok).toBe(true);
    if (!validation.ok) return;
    expect(validation.value.fieldValues['wrapper-fields']).toEqual({
      nested: {
        details: { note: 'ready' },
        total: 20,
        quantity: 4,
        unit_price: 5,
        enabled: true,
      },
      rows: [{
        details: { note: 'ready' },
        total: 6,
        quantity: 3,
        unit_price: 2,
        enabled: true,
      }],
    });
  });
});
