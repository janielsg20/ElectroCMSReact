import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import {
  createContentType,
  createDefaultContentTypeDefinition,
  listContentTypeDefinitions,
  removeContentType,
  updateContentType,
  validateContentTypeDefinition,
} from './content-type';

describe('content type engine', () => {
  it('validates a portable versioned CPT definition', () => {
    const definition = createDefaultContentTypeDefinition('product', 'Products');
    const result = validateContentTypeDefinition({
      ...definition,
      singularLabel: 'Product',
      slug: 'products',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBe('product');
    expect(result.value.slug).toBe('products');
    expect(result.value.supports.title).toBe(true);
  });

  it('rejects invalid ids, slugs and support flags', () => {
    const result = validateContentTypeDefinition({
      version: 1,
      id: 'Bad Type',
      label: '',
      singularLabel: '',
      slug: 'Bad Slug',
      description: '',
      public: 'yes',
      hierarchical: false,
      supports: { title: true },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    const codes = result.issues.map((issue) => issue.code);
    expect(codes).toContain('INVALID_ID');
    expect(codes).toContain('INVALID_LABEL');
    expect(codes).toContain('INVALID_SLUG');
    expect(codes).toContain('INVALID_PUBLIC');
    expect(codes).toContain('INVALID_SUPPORTS');
  });

  it('creates, lists and updates CPTs without changing the stable id', () => {
    const project = createCanonicalProject({ id: 'project_cpt', name: 'CPT' });
    const product = {
      ...createDefaultContentTypeDefinition('product', 'Products'),
      singularLabel: 'Product',
      slug: 'products',
    };
    const created = createContentType(project, product);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(listContentTypeDefinitions(created.project).map((item) => item.id)).toEqual(['product']);

    const updated = updateContentType(created.project, 'product', {
      ...product,
      label: 'Catalog Products',
      description: 'Products managed in the catalog.',
      supports: { ...product.supports, featuredImage: true },
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.label).toBe('Catalog Products');
    expect(updated.value.supports.featuredImage).toBe(true);

    const renamedId = updateContentType(updated.project, 'product', {
      ...updated.value,
      id: 'renamed-product',
    });
    expect(renamedId.ok).toBe(false);
    if (!renamedId.ok) expect(renamedId.error.code).toBe('ID_MISMATCH');
  });

  it('rejects duplicate ids and duplicate public slugs', () => {
    const project = createCanonicalProject({ id: 'project_cpt', name: 'CPT' });
    const product = {
      ...createDefaultContentTypeDefinition('product', 'Products'),
      singularLabel: 'Product',
      slug: 'catalog',
    };
    const first = createContentType(project, product);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const duplicateId = createContentType(first.project, product);
    expect(duplicateId.ok).toBe(false);
    if (!duplicateId.ok) expect(duplicateId.error.code).toBe('DUPLICATE_ID');

    const duplicateSlug = createContentType(first.project, {
      ...createDefaultContentTypeDefinition('service', 'Services'),
      singularLabel: 'Service',
      slug: 'catalog',
    });
    expect(duplicateSlug.ok).toBe(false);
    if (!duplicateSlug.ok) expect(duplicateSlug.error.code).toBe('DUPLICATE_SLUG');
  });

  it('refuses destructive delete while records still reference the CPT', () => {
    const project = createCanonicalProject({ id: 'project_cpt', name: 'CPT' });
    const created = createContentType(project, {
      ...createDefaultContentTypeDefinition('article', 'Articles'),
      singularLabel: 'Article',
      slug: 'articles',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    created.project.records.record_1 = {
      contentTypeId: 'article',
      title: 'Referenced record',
    };
    const blocked = removeContentType(created.project, 'article');
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.code).toBe('CONTENT_TYPE_IN_USE');

    delete created.project.records.record_1;
    const removed = removeContentType(created.project, 'article');
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.project.contentTypes.article).toBeUndefined();
  });
});
