import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import { createContentType, createDefaultContentTypeDefinition } from './content-type';
import { createDefaultFieldGroupDefinition, createFieldGroup } from './field-group';
import { removeFieldGroupWithRecordIntegrity } from './field-group-record-integrity';

function projectWithGroup() {
  let project = createCanonicalProject({ id: 'project_group_integrity', name: 'Group integrity' });
  const contentType = createContentType(project, {
    ...createDefaultContentTypeDefinition('products', 'Products'),
    singularLabel: 'Product',
    slug: 'products',
  });
  if (!contentType.ok) throw new Error(contentType.error.message);
  project = contentType.project;

  const group = createFieldGroup(project, createDefaultFieldGroupDefinition('product-details', 'Product Details'));
  if (!group.ok) throw new Error(group.error.message);
  return group.project;
}

describe('field group record integrity', () => {
  it('blocks deletion while a canonical record selects the field group', () => {
    const project = projectWithGroup();
    project.records['products-record'] = {
      version: 1,
      id: 'products-record',
      contentTypeId: 'products',
      status: 'draft',
      title: 'Product',
      slug: 'product',
      excerpt: '',
      content: '',
      fieldGroupIds: ['product-details'],
      fieldValues: { 'product-details': {} },
      createdAt: '2026-08-08T07:40:00.000Z',
      updatedAt: '2026-08-08T07:40:00.000Z',
    };

    const result = removeFieldGroupWithRecordIntegrity(project, 'product-details');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FIELD_GROUP_IN_USE');
      expect(result.error.message).toContain('content record');
    }
  });

  it('delegates to the original taxonomy-aware removal when no record uses the group', () => {
    const project = projectWithGroup();
    const result = removeFieldGroupWithRecordIntegrity(project, 'product-details');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.fieldGroups['product-details']).toBeUndefined();
  });
});
