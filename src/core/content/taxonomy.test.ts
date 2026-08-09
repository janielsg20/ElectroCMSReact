import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import { createContentType, createDefaultContentTypeDefinition } from './content-type';
import {
  createDefaultTaxonomyDefinition,
  createTaxonomy,
  listTaxonomyDefinitions,
  removeTaxonomy,
  updateTaxonomy,
  validateTaxonomyDefinition,
} from './taxonomy';

function projectWithProducts() {
  const project = createCanonicalProject({
    id: 'project_taxonomy_test',
    name: 'Taxonomy Test',
    now: '2026-08-08T00:00:00.000Z',
    randomUuid: (() => {
      let sequence = 0;
      return () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
    })(),
  });
  const created = createContentType(project, createDefaultContentTypeDefinition('products', 'Products'));
  if (!created.ok) throw new Error(created.error.message);
  return created.project;
}

describe('taxonomy model', () => {
  it('validates hierarchical and non-hierarchical taxonomy definitions', () => {
    const category = createDefaultTaxonomyDefinition('categories', 'Categories', ['products']);
    expect(validateTaxonomyDefinition(category)).toEqual({ ok: true, value: category });

    const tag = { ...category, id: 'tags', slug: 'tags', label: 'Tags', singularLabel: 'Tag', hierarchical: false };
    expect(validateTaxonomyDefinition(tag)).toEqual({ ok: true, value: tag });
  });

  it('requires one or more unique content type associations', () => {
    const definition = createDefaultTaxonomyDefinition('categories', 'Categories', []);
    const empty = validateTaxonomyDefinition(definition);
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.issues.some((issue) => issue.path === 'contentTypeIds')).toBe(true);

    const duplicate = validateTaxonomyDefinition({ ...definition, contentTypeIds: ['products', 'products'] });
    expect(duplicate.ok).toBe(false);
  });

  it('creates updates lists and removes taxonomies without mutating the source project', () => {
    const project = projectWithProducts();
    const definition = createDefaultTaxonomyDefinition('categories', 'Categories', ['products']);
    const created = createTaxonomy(project, definition);
    expect(created.ok).toBe(true);
    expect(project.taxonomies).toEqual({});
    if (!created.ok) return;

    expect(listTaxonomyDefinitions(created.project).map((taxonomy) => taxonomy.id)).toEqual(['categories']);

    const updated = updateTaxonomy(created.project, 'categories', {
      ...definition,
      singularLabel: 'Category',
      description: 'Catalog organization.',
      hierarchical: false,
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.hierarchical).toBe(false);
    expect(updated.value.singularLabel).toBe('Category');

    const removed = removeTaxonomy(updated.project, 'categories');
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.project.taxonomies).toEqual({});
  });

  it('rejects duplicate ids and slugs', () => {
    const project = projectWithProducts();
    const first = createTaxonomy(project, createDefaultTaxonomyDefinition('categories', 'Categories', ['products']));
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const duplicateId = createTaxonomy(first.project, createDefaultTaxonomyDefinition('categories', 'Other', ['products']));
    expect(duplicateId.ok).toBe(false);
    if (!duplicateId.ok) expect(duplicateId.error.code).toBe('DUPLICATE_ID');

    const duplicateSlug = createTaxonomy(first.project, {
      ...createDefaultTaxonomyDefinition('product-categories', 'Product Categories', ['products']),
      slug: 'categories',
    });
    expect(duplicateSlug.ok).toBe(false);
    if (!duplicateSlug.ok) expect(duplicateSlug.error.code).toBe('DUPLICATE_SLUG');
  });

  it('rejects unknown content type, field group and archive template references', () => {
    const project = projectWithProducts();
    const unknownType = createTaxonomy(project, createDefaultTaxonomyDefinition('categories', 'Categories', ['missing']));
    expect(unknownType.ok).toBe(false);
    if (!unknownType.ok) expect(unknownType.error.code).toBe('UNKNOWN_CONTENT_TYPE');

    const unknownGroup = createTaxonomy(project, {
      ...createDefaultTaxonomyDefinition('categories', 'Categories', ['products']),
      fieldGroupIds: ['taxonomy-fields'],
    });
    expect(unknownGroup.ok).toBe(false);
    if (!unknownGroup.ok) expect(unknownGroup.error.code).toBe('UNKNOWN_FIELD_GROUP');

    const pageId = project.documentOrder[0]!;
    const wrongTemplate = createTaxonomy(project, {
      ...createDefaultTaxonomyDefinition('categories', 'Categories', ['products']),
      archiveTemplateId: pageId,
    });
    expect(wrongTemplate.ok).toBe(false);
    if (!wrongTemplate.ok) expect(wrongTemplate.error.code).toBe('UNKNOWN_ARCHIVE_TEMPLATE');
  });

  it('accepts existing field group and archive template references without implementing their editors early', () => {
    const project = projectWithProducts();
    const pageId = project.documentOrder[0]!;
    const archiveId = 'document_archive_products';
    const nextProject = structuredClone(project);
    nextProject.fieldGroups['taxonomy-fields'] = { id: 'taxonomy-fields', label: 'Taxonomy Fields' };
    nextProject.documents[archiveId] = {
      ...structuredClone(project.documents[pageId]!),
      id: archiveId,
      kind: 'archive',
      name: 'Product taxonomy archive',
      slug: '/taxonomy-archive',
    };
    nextProject.documentOrder.push(archiveId);

    const result = createTaxonomy(nextProject, {
      ...createDefaultTaxonomyDefinition('categories', 'Categories', ['products']),
      fieldGroupIds: ['taxonomy-fields'],
      archiveTemplateId: archiveId,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.fieldGroupIds).toEqual(['taxonomy-fields']);
    expect(result.value.archiveTemplateId).toBe(archiveId);
  });

  it('keeps taxonomy id immutable after creation', () => {
    const project = projectWithProducts();
    const definition = createDefaultTaxonomyDefinition('categories', 'Categories', ['products']);
    const created = createTaxonomy(project, definition);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = updateTaxonomy(created.project, 'categories', { ...definition, id: 'renamed' });
    expect(updated.ok).toBe(false);
    if (!updated.ok) expect(updated.error.code).toBe('ID_MISMATCH');
  });
});
