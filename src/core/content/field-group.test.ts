import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import { createContentType, createDefaultContentTypeDefinition } from './content-type';
import { createDefaultFieldTypeRegistry } from './builtin-field-types';
import {
  createDefaultCustomFieldDefinition,
  createDefaultFieldGroupDefinition,
  createFieldGroup,
  listFieldGroupDefinitions,
  removeFieldGroup,
  updateFieldGroup,
  validateFieldGroupDefinition,
} from './field-group';
import { createDefaultTaxonomyDefinition, createTaxonomy } from './taxonomy';

function createProject() {
  return createCanonicalProject({
    id: 'project_field_group_test',
    name: 'Field Group Test',
    now: '2026-08-08T00:00:00.000Z',
    randomUuid: (() => {
      let sequence = 0;
      return () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
    })(),
  });
}

describe('custom field groups', () => {
  it('creates portable fields from available registry definitions', () => {
    const registry = createDefaultFieldTypeRegistry();
    const field = createDefaultCustomFieldDefinition(registry, 'core/text', 'product-sku', 'Product SKU');

    expect(field).toMatchObject({
      version: 1,
      id: 'product-sku',
      name: 'product_sku',
      label: 'Product SKU',
      type: 'core/text',
      typeVersion: 1,
      required: false,
      config: {},
      conditions: [],
      roleVisibility: [],
    });
    expect(field.defaultValue).toBeNull();
  });

  it('validates group identity, ordering and field type config through the registry', () => {
    const registry = createDefaultFieldTypeRegistry();
    const text = createDefaultCustomFieldDefinition(registry, 'core/text', 'title-line', 'Title line');
    const price = createDefaultCustomFieldDefinition(registry, 'core/currency', 'price', 'Price');
    price.config = { currency: 'USD', min: 0 };

    const group = {
      ...createDefaultFieldGroupDefinition('product-details', 'Product details'),
      presentation: 'tabs' as const,
      fields: [text, price],
    };
    expect(validateFieldGroupDefinition(group, registry)).toEqual({ ok: true, value: group });

    const invalidConfig = validateFieldGroupDefinition(
      {
        ...group,
        fields: [{ ...price, config: { currency: 'usd' } }],
      },
      registry,
    );
    expect(invalidConfig.ok).toBe(false);
    if (!invalidConfig.ok) {
      expect(invalidConfig.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'INVALID_CONFIG', path: 'fields.0.config.currency' }),
        ]),
      );
    }
  });

  it('rejects duplicate field ids and names', () => {
    const registry = createDefaultFieldTypeRegistry();
    const first = createDefaultCustomFieldDefinition(registry, 'core/text', 'sku', 'SKU');
    const duplicate = createDefaultCustomFieldDefinition(registry, 'core/number', 'sku', 'SKU number');
    duplicate.name = first.name;

    const validation = validateFieldGroupDefinition(
      { ...createDefaultFieldGroupDefinition('product-details', 'Product details'), fields: [first, duplicate] },
      registry,
    );

    expect(validation.ok).toBe(false);
    if (!validation.ok) {
      expect(validation.issues.some((issue) => issue.code === 'DUPLICATE_FIELD_ID')).toBe(true);
      expect(validation.issues.some((issue) => issue.code === 'DUPLICATE_FIELD_NAME')).toBe(true);
    }
  });

  it('blocks modeled advanced field types until their dedicated microphases', () => {
    const registry = createDefaultFieldTypeRegistry();
    const modeled = registry.resolve('core/repeater');
    const field = {
      ...createDefaultCustomFieldDefinition(registry, 'core/text', 'items', 'Items'),
      type: modeled.type,
      typeVersion: modeled.version,
      config: structuredClone(modeled.defaultConfig),
      defaultValue: null,
    };

    const validation = validateFieldGroupDefinition(
      { ...createDefaultFieldGroupDefinition('product-details', 'Product details'), fields: [field] },
      registry,
    );
    expect(validation.ok).toBe(false);
    if (!validation.ok) {
      expect(validation.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'FIELD_TYPE_UNAVAILABLE' })]),
      );
    }
  });

  it('creates updates reorders lists and removes groups without mutating the source project', () => {
    const registry = createDefaultFieldTypeRegistry();
    const project = createProject();
    const sku = createDefaultCustomFieldDefinition(registry, 'core/text', 'sku', 'SKU');
    const price = createDefaultCustomFieldDefinition(registry, 'core/currency', 'price', 'Price');
    const definition = {
      ...createDefaultFieldGroupDefinition('product-details', 'Product details'),
      fields: [sku, price],
    };

    const created = createFieldGroup(project, definition, registry);
    expect(created.ok).toBe(true);
    expect(project.fieldGroups).toEqual({});
    if (!created.ok) return;
    expect(listFieldGroupDefinitions(created.project, registry).map((group) => group.id)).toEqual([
      'product-details',
    ]);

    const updated = updateFieldGroup(
      created.project,
      definition.id,
      { ...definition, presentation: 'tabs', fields: [price, sku] },
      registry,
    );
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.presentation).toBe('tabs');
    expect(updated.value.fields.map((field) => field.id)).toEqual(['price', 'sku']);

    const removed = removeFieldGroup(updated.project, definition.id, registry);
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.project.fieldGroups).toEqual({});
  });

  it('keeps ids immutable and rejects duplicate group ids', () => {
    const registry = createDefaultFieldTypeRegistry();
    const project = createProject();
    const definition = createDefaultFieldGroupDefinition('details', 'Details');
    const created = createFieldGroup(project, definition, registry);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const duplicate = createFieldGroup(created.project, definition, registry);
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.error.code).toBe('DUPLICATE_ID');

    const renamed = updateFieldGroup(
      created.project,
      definition.id,
      { ...definition, id: 'renamed' },
      registry,
    );
    expect(renamed.ok).toBe(false);
    if (!renamed.ok) expect(renamed.error.code).toBe('ID_MISMATCH');
  });

  it('protects field groups referenced by taxonomies from destructive deletion', () => {
    const registry = createDefaultFieldTypeRegistry();
    const project = createProject();
    const contentType = createContentType(
      project,
      createDefaultContentTypeDefinition('products', 'Products'),
    );
    expect(contentType.ok).toBe(true);
    if (!contentType.ok) return;

    const group = createFieldGroup(
      contentType.project,
      createDefaultFieldGroupDefinition('taxonomy-details', 'Taxonomy details'),
      registry,
    );
    expect(group.ok).toBe(true);
    if (!group.ok) return;

    const taxonomy = createTaxonomy(group.project, {
      ...createDefaultTaxonomyDefinition('categories', 'Categories', ['products']),
      fieldGroupIds: ['taxonomy-details'],
    });
    expect(taxonomy.ok).toBe(true);
    if (!taxonomy.ok) return;

    const removed = removeFieldGroup(taxonomy.project, 'taxonomy-details', registry);
    expect(removed.ok).toBe(false);
    if (!removed.ok) expect(removed.error.code).toBe('FIELD_GROUP_IN_USE');
  });
});
