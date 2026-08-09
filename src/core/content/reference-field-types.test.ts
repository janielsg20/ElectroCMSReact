import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import {
  createContentFieldTypeRegistry,
  createContentType,
  createDefaultContentTypeDefinition,
  createDefaultCustomFieldDefinition,
  createDefaultRelationDefinition,
  createRelation,
  createTaxonomy,
  createDefaultTaxonomyDefinition,
  validateReferenceFieldContext,
} from './index';

describe('MF-043 reference Field Types', () => {
  it('keeps v1 modeled while activating relation/user/taxonomy v2', () => {
    const registry = createContentFieldTypeRegistry();
    for (const type of ['core/relation', 'core/user', 'core/taxonomy']) {
      expect(registry.resolve(type, 1)).toMatchObject({ version: 1, availability: 'modeled' });
      expect(registry.resolve(type)).toMatchObject({ version: 2, availability: 'available' });
    }
    expect(registry.resolve('core/group')).toMatchObject({ version: 2, availability: 'available' });
  });

  it('validates relation endpoint ownership, referenced CPT and one cardinality', () => {
    let project = createCanonicalProject({ id: 'reference_type_test', name: 'Reference Type Test' });
    for (const [id, label] of [['products', 'Products'], ['brands', 'Brands']] as const) {
      const result = createContentType(project, createDefaultContentTypeDefinition(id, label));
      if (!result.ok) throw new Error(result.error.message);
      project = result.project;
    }
    const relation = createRelation(project, { ...createDefaultRelationDefinition('products', 'brands', 'product-brand'), sourceCardinality: 'one' });
    if (!relation.ok) throw new Error(relation.error.message);
    project = relation.project;
    project.records['brand-one'] = { version: 1, id: 'brand-one', contentTypeId: 'brands', status: 'draft', title: 'Brand one', slug: 'brand-one', excerpt: '', content: '', fieldGroupIds: [], fieldValues: {}, createdAt: '2026-08-09T12:00:00.000Z', updatedAt: '2026-08-09T12:00:00.000Z' };
    project.records['brand-two'] = { ...project.records['brand-one']!, id: 'brand-two', title: 'Brand two', slug: 'brand-two' };
    const registry = createContentFieldTypeRegistry();
    const field = createDefaultCustomFieldDefinition(registry, 'core/relation', 'brand', 'Brand');
    field.config = { relationId: 'product-brand', side: 'source' };

    expect(validateReferenceFieldContext(project, 'products', field, ['brand-one'])).toEqual([]);
    expect(validateReferenceFieldContext(project, 'products', field, ['brand-one', 'brand-two'])[0]).toContain('only one');
    expect(validateReferenceFieldContext(project, 'brands', field, ['brand-one'])[0]).toContain('expects a products record');
  });

  it('validates canonical users and taxonomy assignment', () => {
    let project = createCanonicalProject({ id: 'reference_user_taxonomy', name: 'Reference User Taxonomy' });
    const contentType = createContentType(project, createDefaultContentTypeDefinition('products', 'Products'));
    if (!contentType.ok) throw new Error(contentType.error.message);
    project = contentType.project;
    project.users['user-one'] = { id: 'user-one', name: 'User One' };
    const taxonomy = createTaxonomy(project, createDefaultTaxonomyDefinition('categories', 'Categories', ['products']));
    if (!taxonomy.ok) throw new Error(taxonomy.error.message);
    project = taxonomy.project;
    const registry = createContentFieldTypeRegistry();

    const userField = createDefaultCustomFieldDefinition(registry, 'core/user', 'owner', 'Owner');
    expect(validateReferenceFieldContext(project, 'products', userField, 'user-one')).toEqual([]);
    expect(validateReferenceFieldContext(project, 'products', userField, 'missing')[0]).toContain('does not exist');

    const taxonomyField = createDefaultCustomFieldDefinition(registry, 'core/taxonomy', 'categories', 'Categories');
    taxonomyField.config = { taxonomyId: 'categories' };
    expect(validateReferenceFieldContext(project, 'products', taxonomyField, ['term-a'])).toEqual([]);
  });
});
