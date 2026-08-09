import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from './project-factory';
import {
  createDynamicBinding,
  createRecordBindingSource,
  createRecordsBindingSource,
  listBindableRecordPaths,
  resolveDocumentNodeBindings,
  resolveDynamicBinding,
  validateDynamicBindings,
} from './dynamic-binding';
import type { CanonicalProject, DocumentNode } from './project-model';

function projectWithRecords(): CanonicalProject {
  const project = createCanonicalProject({ id: 'binding_project', name: 'Bindings', now: '2026-08-09T12:00:00.000Z' });
  project.records['brand-nike'] = {
    version: 1,
    id: 'brand-nike',
    contentTypeId: 'brand',
    status: 'published',
    title: 'Nike',
    slug: 'nike',
    excerpt: 'Athletic brand',
    content: '',
    fieldGroupIds: ['brand-fields'],
    fieldValues: {
      'brand-fields': {
        logo: 'https://example.test/nike.png',
        website: 'https://example.test/nike',
      },
    },
    createdAt: '2026-08-09T12:00:00.000Z',
    updatedAt: '2026-08-09T12:00:00.000Z',
  };
  project.records['product-shoe'] = {
    version: 1,
    id: 'product-shoe',
    contentTypeId: 'product',
    status: 'published',
    title: 'Air Runner',
    slug: 'air-runner',
    excerpt: 'Light running shoe',
    content: '',
    fieldGroupIds: ['commerce'],
    fieldValues: { commerce: { price: 129.99 } },
    createdAt: '2026-08-09T12:00:00.000Z',
    updatedAt: '2026-08-09T12:00:00.000Z',
  };
  project.records['product-trail'] = {
    version: 1,
    id: 'product-trail',
    contentTypeId: 'product',
    status: 'published',
    title: 'Trail Runner',
    slug: 'trail-runner',
    excerpt: 'Trail shoe',
    content: '',
    fieldGroupIds: [],
    fieldValues: {},
    createdAt: '2026-08-09T12:00:00.000Z',
    updatedAt: '2026-08-09T12:00:00.000Z',
  };
  return project;
}

function node(bindings: DocumentNode['bindings']): DocumentNode {
  return {
    id: 'node_heading',
    type: 'core/heading',
    version: 1,
    props: { text: 'Static heading', href: '#', src: '', items: [] },
    styles: {},
    bindings,
    children: [],
  };
}

describe('MF-044 dynamic bindings', () => {
  it('resolves text, image and link values from real canonical Records', () => {
    const project = projectWithRecords();
    const bindings = [
      createDynamicBinding({ target: 'text', kind: 'text', source: createRecordBindingSource('brand-nike', 'title'), fallback: 'Brand' }),
      createDynamicBinding({ target: 'src', kind: 'image', source: createRecordBindingSource('brand-nike', 'fieldValues.brand-fields.logo'), fallback: '/fallback.png' }),
      createDynamicBinding({ target: 'href', kind: 'link', source: createRecordBindingSource('brand-nike', 'fieldValues.brand-fields.website'), fallback: '#' }),
    ];
    const resolved = resolveDocumentNodeBindings(project, node(bindings));
    expect(resolved.state).toBe('resolved');
    expect(resolved.node.props).toMatchObject({
      text: 'Nike',
      src: 'https://example.test/nike.png',
      href: 'https://example.test/nike',
    });
  });

  it('resolves listings deterministically from Records of one Content Type', () => {
    const project = projectWithRecords();
    const binding = createDynamicBinding({
      target: 'items',
      kind: 'listing',
      source: createRecordsBindingSource('product', 'title'),
      fallback: [],
    });
    const resolved = resolveDynamicBinding(project, binding);
    expect(resolved).toMatchObject({ state: 'resolved', value: ['Air Runner', 'Trail Runner'] });
  });

  it('uses a compatible fallback and exposes an error when no fallback can resolve', () => {
    const project = projectWithRecords();
    const fallback = resolveDynamicBinding(project, createDynamicBinding({
      target: 'text',
      kind: 'text',
      source: createRecordBindingSource('missing-record', 'title'),
      fallback: 'Fallback title',
    }));
    expect(fallback).toMatchObject({ state: 'fallback', value: 'Fallback title' });

    const error = resolveDynamicBinding(project, createDynamicBinding({
      target: 'src',
      kind: 'image',
      source: createRecordBindingSource('missing-record', 'fieldValues.media.image'),
    }));
    expect(error.state).toBe('error');
    expect(error.message).toContain('did not resolve');
  });

  it('rejects duplicate targets and incomplete authored bindings without mutating legacy data', () => {
    const result = validateDynamicBindings([
      { target: 'text', kind: 'text', source: 'record:brand-nike:title' },
      { target: 'text', kind: 'text', source: 'record:product-shoe:title' },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((issue) => issue.code === 'DUPLICATE_TARGET')).toBe(true);

    const legacy = resolveDynamicBinding(projectWithRecords(), { source: 'current' });
    expect(legacy.state).toBe('error');
    expect(legacy.binding).toEqual({ source: 'current' });
  });

  it('lists bindable scalar paths including nested custom fields', () => {
    const paths = listBindableRecordPaths(projectWithRecords(), 'brand-nike');
    expect(paths).toContain('title');
    expect(paths).toContain('slug');
    expect(paths).toContain('fieldValues.brand-fields.logo');
    expect(paths).toContain('fieldValues.brand-fields.website');
    expect(paths).not.toContain('id');
  });
});
