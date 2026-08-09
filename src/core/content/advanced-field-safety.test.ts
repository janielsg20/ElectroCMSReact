import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import {
  createContentFieldTypeRegistry,
  createContentType,
  createDefaultContentTypeDefinition,
  createDefaultCustomFieldDefinition,
  createDefaultFieldGroupDefinition,
  createFieldGroup,
  validateCalculationExpression,
  type CustomFieldDefinition,
} from './index';

function baseProject() {
  const project = createCanonicalProject({ id: 'advanced_field_safety', name: 'Advanced Field Safety', now: '2026-08-08T12:00:00.000Z' });
  const contentType = createContentType(project, createDefaultContentTypeDefinition('products', 'Products'));
  if (!contentType.ok) throw new Error(contentType.error.message);
  return contentType.project;
}

function field(type: string, id: string, patch: Partial<CustomFieldDefinition> = {}) {
  const registry = createContentFieldTypeRegistry();
  return { ...createDefaultCustomFieldDefinition(registry, type, id, id), ...patch };
}

describe('MF-042 advanced field safety', () => {
  it('accepts arithmetic expressions but rejects code-like or malformed syntax', () => {
    expect(validateCalculationExpression('(quantity * unit_price) + tax').ok).toBe(true);
    expect(validateCalculationExpression('globalThis.alert(1)').ok).toBe(false);
    expect(validateCalculationExpression('quantity ** 2').ok).toBe(false);
    expect(validateCalculationExpression('quantity; unit_price').ok).toBe(false);
  });

  it('enforces advanced safety at the registry boundary', () => {
    const registry = createContentFieldTypeRegistry();
    expect(registry.validateConfig('core/repeater', { fieldGroupId: 'child-fields', minItems: 0, maxItems: 101 }, 2).valid).toBe(false);
    expect(registry.validateConfig('core/calculated', { expression: `${'1 + '.repeat(61)}1` }, 2).valid).toBe(false);
    expect(registry.validateConfig('core/conditional', { fieldGroupId: 'child-fields', sourceField: 'status', operator: 'equals' }, 2).valid).toBe(false);
    expect(registry.validateConfig('core/conditional', { fieldGroupId: 'child-fields', sourceField: 'quantity', operator: 'greaterThan', compareValue: '2' }, 2).valid).toBe(false);
    expect(registry.validateConfig('core/conditional', { fieldGroupId: 'child-fields', sourceField: 'enabled', operator: 'truthy' }, 2).valid).toBe(true);
  });

  it('rejects repeater configurations beyond the runtime cap', () => {
    const project = baseProject();
    const child = createFieldGroup(project, { ...createDefaultFieldGroupDefinition('child-fields', 'Child Fields'), fields: [field('core/text', 'name', { name: 'name' })] });
    expect(child.ok).toBe(true);
    if (!child.ok) return;
    const parent = createFieldGroup(child.project, {
      ...createDefaultFieldGroupDefinition('parent-fields', 'Parent Fields'),
      fields: [field('core/repeater', 'items', { name: 'items', config: { fieldGroupId: 'child-fields', minItems: 0, maxItems: 101 }, defaultValue: [] })],
    });
    expect(parent.ok).toBe(false);
    if (!parent.ok) expect(parent.error.message).toContain('100');
  });

  it('rejects calculated fields that depend on another advanced field', () => {
    const project = baseProject();
    const result = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('totals', 'Totals'),
      fields: [
        field('core/number', 'quantity', { name: 'quantity', defaultValue: 2 }),
        field('core/calculated', 'subtotal', { name: 'subtotal', config: { expression: 'quantity * 2' }, defaultValue: 0 }),
        field('core/calculated', 'grand-total', { name: 'grand_total', config: { expression: 'subtotal + 1' }, defaultValue: 0 }),
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('Number or Currency');
  });

  it('requires conditional sources to be non-advanced siblings and numeric operators to use numeric siblings', () => {
    let project = baseProject();
    const child = createFieldGroup(project, { ...createDefaultFieldGroupDefinition('condition-child', 'Condition Child'), fields: [field('core/text', 'note', { name: 'note' })] });
    expect(child.ok).toBe(true);
    if (!child.ok) return;
    project = child.project;

    const advancedSource = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('advanced-source', 'Advanced Source'),
      fields: [
        field('core/number', 'quantity', { name: 'quantity', defaultValue: 2 }),
        field('core/calculated', 'subtotal', { name: 'subtotal', config: { expression: 'quantity * 2' }, defaultValue: 0 }),
        field('core/conditional', 'details', { name: 'details', config: { fieldGroupId: 'condition-child', sourceField: 'subtotal', operator: 'greaterThan', compareValue: 2 }, defaultValue: null }),
      ],
    });
    expect(advancedSource.ok).toBe(false);
    if (!advancedSource.ok) expect(advancedSource.error.message).toContain('non-advanced sibling');

    const textSource = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('text-source', 'Text Source'),
      fields: [
        field('core/text', 'status', { name: 'status', defaultValue: '10' }),
        field('core/conditional', 'details', { name: 'details', config: { fieldGroupId: 'condition-child', sourceField: 'status', operator: 'greaterThan', compareValue: 2 }, defaultValue: null }),
      ],
    });
    expect(textSource.ok).toBe(false);
    if (!textSource.ok) expect(textSource.error.message).toContain('Number or Currency');
  });
});
