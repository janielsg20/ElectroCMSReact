import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import {
  createContentFieldTypeRegistry,
  createDefaultContentTypeDefinition,
  createDefaultCustomFieldDefinition,
  createDefaultFieldGroupDefinition,
  createContentType,
  createFieldGroup,
  validateCalculationExpression,
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
});
