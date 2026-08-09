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
  createDefaultTaxonomyDefinition,
  createFieldGroup,
  createTaxonomy,
} from './index';

describe('MF-043 User and Taxonomy Record paths', () => {
  it('persists a canonical user id and taxonomy term ids through Record validation', () => {
    let project = createCanonicalProject({ id: 'reference_record_path', name: 'Reference Record Path', now: '2026-08-09T12:00:00.000Z' });
    const type = createContentType(project, createDefaultContentTypeDefinition('products', 'Products'));
    if (!type.ok) throw new Error(type.error.message);
    project = type.project;
    project.users['user-one'] = { id: 'user-one', name: 'User One', email: 'user@example.test' };
    const taxonomy = createTaxonomy(project, createDefaultTaxonomyDefinition('categories', 'Categories', ['products']));
    if (!taxonomy.ok) throw new Error(taxonomy.error.message);
    project = taxonomy.project;

    const registry = createContentFieldTypeRegistry();
    const owner = createDefaultCustomFieldDefinition(registry, 'core/user', 'owner', 'Owner');
    owner.name = 'owner';
    const categories = createDefaultCustomFieldDefinition(registry, 'core/taxonomy', 'categories', 'Categories');
    categories.name = 'categories';
    categories.config = { taxonomyId: 'categories' };
    const group = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('reference-fields', 'Reference Fields'),
      fields: [owner, categories],
    });
    if (!group.ok) throw new Error(group.error.message);
    project = group.project;

    const record = createContentRecord(project, {
      ...createDefaultContentRecordDefinition(project, 'products', 'product-one', '2026-08-09T12:01:00.000Z'),
      title: 'Product One',
      slug: 'product-one',
      fieldGroupIds: ['reference-fields'],
      fieldValues: { 'reference-fields': { owner: 'user-one', categories: ['featured', 'summer'] } },
    });
    expect(record.ok).toBe(true);
    if (!record.ok) return;
    expect(record.value.fieldValues['reference-fields']).toEqual({ owner: 'user-one', categories: ['featured', 'summer'] });
  });
});
