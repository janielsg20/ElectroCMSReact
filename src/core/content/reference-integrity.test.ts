import { describe, expect, it } from 'vitest';
import { createCanonicalProject, type CanonicalProject } from '../project';
import {
  createContentFieldTypeRegistry,
  createContentRecord,
  createContentType,
  createDefaultContentRecordDefinition,
  createDefaultContentTypeDefinition,
  createDefaultCustomFieldDefinition,
  createDefaultFieldGroupDefinition,
  createDefaultRelationDefinition,
  createDefaultTaxonomyDefinition,
  createFieldGroup,
  createRelation,
  createTaxonomy,
  removeContentRecord,
  removeContentType,
  removeRelation,
  removeTaxonomy,
  updateRelation,
  type CustomFieldDefinition,
} from './index';

function field(type: string, id: string, patch: Partial<CustomFieldDefinition> = {}): CustomFieldDefinition {
  const registry = createContentFieldTypeRegistry();
  return { ...createDefaultCustomFieldDefinition(registry, type, id, id), ...patch };
}

function addType(project: CanonicalProject, id: string, label: string): CanonicalProject {
  const result = createContentType(project, createDefaultContentTypeDefinition(id, label));
  if (!result.ok) throw new Error(result.error.message);
  return result.project;
}

function fixture() {
  let project = createCanonicalProject({ id: 'reference_integrity', name: 'Reference Integrity', now: '2026-08-09T12:00:00.000Z' });
  project = addType(project, 'products', 'Products');
  project = addType(project, 'brands', 'Brands');
  const relation = createRelation(project, createDefaultRelationDefinition('products', 'brands', 'product-brand'));
  if (!relation.ok) throw new Error(relation.error.message);
  project = relation.project;
  const taxonomy = createTaxonomy(project, createDefaultTaxonomyDefinition('categories', 'Categories', ['products']));
  if (!taxonomy.ok) throw new Error(taxonomy.error.message);
  project = taxonomy.project;

  const brandGroup = createFieldGroup(project, {
    ...createDefaultFieldGroupDefinition('brand-fields', 'Brand Fields'),
    fields: [field('core/text', 'tagline', { name: 'tagline' })],
  });
  if (!brandGroup.ok) throw new Error(brandGroup.error.message);
  project = brandGroup.project;

  const productGroup = createFieldGroup(project, {
    ...createDefaultFieldGroupDefinition('product-links', 'Product Links'),
    fields: [
      field('core/relation', 'brand', { name: 'brand', config: { relationId: 'product-brand', side: 'source' }, defaultValue: [] }),
      field('core/taxonomy', 'categories', { name: 'categories', config: { taxonomyId: 'categories' }, defaultValue: [] }),
    ],
  });
  if (!productGroup.ok) throw new Error(productGroup.error.message);
  project = productGroup.project;

  const brandRecord = createContentRecord(project, {
    ...createDefaultContentRecordDefinition(project, 'brands', 'brand-one', '2026-08-09T12:00:00.000Z'),
    title: 'Brand One', slug: 'brand-one', fieldGroupIds: ['brand-fields'], fieldValues: { 'brand-fields': { tagline: 'Quality' } },
  });
  if (!brandRecord.ok) throw new Error(brandRecord.error.message);
  project = brandRecord.project;

  const productRecord = createContentRecord(project, {
    ...createDefaultContentRecordDefinition(project, 'products', 'product-one', '2026-08-09T12:01:00.000Z'),
    title: 'Product One', slug: 'product-one', fieldGroupIds: ['product-links'], fieldValues: { 'product-links': { brand: ['brand-one'], categories: ['term-a'] } },
  });
  if (!productRecord.ok) throw new Error(productRecord.error.message);
  return { project: productRecord.project, productRecord: productRecord.value };
}

describe('MF-043 reference integrity', () => {
  it('blocks deletion of a Record referenced by a relation field', () => {
    const { project } = fixture();
    const removed = removeContentRecord(project, 'brand-one');
    expect(removed.ok).toBe(false);
    if (!removed.ok) expect(removed.error.message).toContain('referenced by relation fields in record product-one');
  });

  it('blocks deletion of a Relation used by a Field Group', () => {
    const { project } = fixture();
    const removed = removeRelation(project, 'product-brand');
    expect(removed.ok).toBe(false);
    if (!removed.ok) expect(removed.error.code).toBe('RELATION_IN_USE');
  });

  it('blocks incompatible Relation endpoint/cardinality updates', () => {
    const { project } = fixture();
    const current = createDefaultRelationDefinition('products', 'brands', 'product-brand');
    const endpointChange = updateRelation(project, 'product-brand', { ...current, sourceContentTypeId: 'brands' });
    expect(endpointChange.ok).toBe(false);
    if (!endpointChange.ok) expect(endpointChange.error.code).toBe('RELATION_IN_USE');

    const one = updateRelation(project, 'product-brand', { ...current, sourceCardinality: 'one' });
    expect(one.ok).toBe(true);
  });

  it('blocks deletion of endpoint Content Types and referenced Taxonomies', () => {
    const { project } = fixture();
    const typeResult = removeContentType(project, 'brands');
    expect(typeResult.ok).toBe(false);
    if (!typeResult.ok) expect(typeResult.error.message).toContain('relation product-brand');

    const taxonomyResult = removeTaxonomy(project, 'categories');
    expect(taxonomyResult.ok).toBe(false);
    if (!taxonomyResult.ok) expect(taxonomyResult.error.message).toContain('referenced by Field Group product-links');
  });

  it('validates reference fields recursively through Group and Repeater values', () => {
    let { project } = fixture();
    const nested = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('nested-links', 'Nested Links'),
      fields: [field('core/relation', 'brand', { name: 'brand', config: { relationId: 'product-brand', side: 'source' }, defaultValue: [] })],
    });
    if (!nested.ok) throw new Error(nested.error.message);
    project = nested.project;
    const parent = createFieldGroup(project, {
      ...createDefaultFieldGroupDefinition('nested-parent', 'Nested Parent'),
      fields: [field('core/repeater', 'rows', { name: 'rows', config: { fieldGroupId: 'nested-links', minItems: 0, maxItems: 5 }, defaultValue: [] })],
    });
    if (!parent.ok) throw new Error(parent.error.message);
    project = parent.project;
    const valid = createContentRecord(project, {
      ...createDefaultContentRecordDefinition(project, 'products', 'product-two', '2026-08-09T12:02:00.000Z'),
      title: 'Product Two', slug: 'product-two', fieldGroupIds: ['nested-parent'], fieldValues: { 'nested-parent': { rows: [{ brand: ['brand-one'] }] } },
    });
    expect(valid.ok).toBe(true);
    if (!valid.ok) return;
    const removed = removeContentRecord(valid.project, 'brand-one');
    expect(removed.ok).toBe(false);
  });
});
