import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import { createContentType, createDefaultContentTypeDefinition } from './content-type';
import { createDefaultCustomFieldDefinition } from './field-group';
import { createDefaultRelationDefinition, createRelation } from './relation';
import {
  createContentFieldTypeRegistry,
  isMf043ReferenceField,
  validateReferenceFieldContext,
} from './reference-field-types';

function referenceProject() {
  let project = createCanonicalProject({ id: 'project_reference_fields', name: 'Reference fields' });
  for (const [id, label] of [['product', 'Products'], ['brand', 'Brands']] as const) {
    const created = createContentType(project, {
      ...createDefaultContentTypeDefinition(id, label),
      singularLabel: label.slice(0, -1),
      slug: label.toLowerCase(),
    });
    if (!created.ok) throw new Error(created.error.message);
    project = created.project;
  }
  const relation = createRelation(project, {
    ...createDefaultRelationDefinition('product', 'brand', 'product-brand'),
    sourceCardinality: 'one',
    targetCardinality: 'many',
  });
  if (!relation.ok) throw new Error(relation.error.message);
  project = relation.project;
  project.records['brand-nike'] = { id: 'brand-nike', contentTypeId: 'brand' };
  project.records['product-shoe'] = { id: 'product-shoe', contentTypeId: 'product' };
  project.users.editor = { id: 'editor', name: 'Editor' };
  project.taxonomies.categories = {
    version: 1,
    id: 'categories',
    label: 'Categories',
    singularLabel: 'Category',
    slug: 'categories',
    description: '',
    hierarchical: true,
    contentTypeIds: ['product'],
    fieldGroupIds: [],
    archiveTemplateId: null,
  };
  return project;
}

describe('MF-043 reference field types', () => {
  it('keeps v1 modeled and activates v2 reference definitions', () => {
    const registry = createContentFieldTypeRegistry();
    expect(registry.resolve('core/relation', 1).availability).toBe('modeled');
    expect(registry.resolve('core/relation', 2).availability).toBe('available');
    expect(registry.resolve('core/user', 2).availability).toBe('available');
    expect(registry.resolve('core/taxonomy', 2).availability).toBe('available');
    expect(registry.resolve('core/relation', 2).configSchema).toEqual({ relationId: 'relation-id', side: 'relation-side' });
    expect(registry.resolve('core/taxonomy', 2).configSchema).toEqual({ taxonomyId: 'taxonomy-id' });
    const field = createDefaultCustomFieldDefinition(registry, 'core/relation', 'brand', 'Brand');
    expect(field.typeVersion).toBe(2);
    expect(isMf043ReferenceField(field)).toBe(true);
    expect(isMf043ReferenceField({ type: field.type, typeVersion: 1 })).toBe(false);
  });

  it('validates relation endpoint, cardinality and referenced record Content Type', () => {
    const project = referenceProject();
    const registry = createContentFieldTypeRegistry();
    const field = {
      ...createDefaultCustomFieldDefinition(registry, 'core/relation', 'brand', 'Brand'),
      config: { relationId: 'product-brand', side: 'source' },
    };
    expect(validateReferenceFieldContext(project, 'product', field, ['brand-nike'])).toEqual([]);
    expect(validateReferenceFieldContext(project, 'product', field, ['brand-nike', 'brand-nike'])).toContain('Relation product-brand allows only one referenced record from this side.');
    expect(validateReferenceFieldContext(project, 'brand', field, ['brand-nike'])[0]).toContain('expects a product record');
    expect(validateReferenceFieldContext(project, 'product', field, ['product-shoe'])[0]).toContain('must belong to Content Type brand');
  });

  it('validates user ids and taxonomy applicability against the canonical project', () => {
    const project = referenceProject();
    const registry = createContentFieldTypeRegistry();
    const userField = createDefaultCustomFieldDefinition(registry, 'core/user', 'owner', 'Owner');
    expect(validateReferenceFieldContext(project, 'product', userField, 'editor')).toEqual([]);
    expect(validateReferenceFieldContext(project, 'product', userField, 'missing')[0]).toContain('does not exist');
    const taxonomyField = {
      ...createDefaultCustomFieldDefinition(registry, 'core/taxonomy', 'categories', 'Categories'),
      config: { taxonomyId: 'categories' },
    };
    expect(validateReferenceFieldContext(project, 'product', taxonomyField, ['featured'])).toEqual([]);
    expect(validateReferenceFieldContext(project, 'brand', taxonomyField, ['featured'])[0]).toContain('not assigned');
  });
});
