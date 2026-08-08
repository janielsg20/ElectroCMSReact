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
  createFieldGroup,
  updateFieldGroup,
  type CustomFieldDefinition,
} from './index';

function field(
  type: string,
  id: string,
  patch: Partial<CustomFieldDefinition> = {},
): CustomFieldDefinition {
  const registry = createContentFieldTypeRegistry();
  return {
    ...createDefaultCustomFieldDefinition(registry, type, id, id),
    ...patch,
  };
}

function projectWithRecord() {
  let project = createCanonicalProject({
    id: 'field_group_update_integrity',
    name: 'Field Group Update Integrity',
    now: '2026-08-08T16:00:00.000Z',
  });

  const contentType = createContentType(
    project,
    createDefaultContentTypeDefinition('products', 'Products'),
  );
  if (!contentType.ok) throw new Error(contentType.error.message);
  project = contentType.project;

  const group = createFieldGroup(project, {
    ...createDefaultFieldGroupDefinition('product-details', 'Product Details'),
    fields: [field('core/text', 'nickname', { name: 'nickname' })],
  });
  if (!group.ok) throw new Error(group.error.message);
  project = group.project;

  const recordDraft = {
    ...createDefaultContentRecordDefinition(project, 'products', 'product-one'),
    title: 'Product one',
    slug: 'product-one',
    fieldGroupIds: ['product-details'],
    fieldValues: {
      'product-details': {
        nickname: 'Primary',
      },
    },
  };
  const record = createContentRecord(project, recordDraft);
  if (!record.ok) throw new Error(record.error.message);

  return record.project;
}

describe('field group update record integrity', () => {
  it('allows schema changes that keep existing records valid', () => {
    const project = projectWithRecord();
    const current = project.fieldGroups['product-details'];
    if (!current) throw new Error('product-details field group was not created.');

    const result = updateFieldGroup(project, 'product-details', {
      ...current,
      label: 'Product Details Updated',
      fields: [
        field('core/text', 'nickname', { name: 'nickname' }),
        field('core/text', 'optional-note', { name: 'optional_note', defaultValue: null }),
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.label).toBe('Product Details Updated');
    expect(result.project.records['product-one']).toEqual(project.records['product-one']);
  });

  it('blocks schema changes that would invalidate an existing record', () => {
    const project = projectWithRecord();
    const current = project.fieldGroups['product-details'];
    if (!current) throw new Error('product-details field group was not created.');

    const result = updateFieldGroup(project, 'product-details', {
      ...current,
      fields: [
        field('core/text', 'nickname', { name: 'nickname' }),
        field('core/email', 'contact-email', {
          name: 'contact_email',
          required: true,
          defaultValue: null,
        }),
      ],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('FIELD_GROUP_IN_USE');
    expect(result.error.message).toContain('product-one');
    expect(project.fieldGroups['product-details']).toEqual(current);
    expect(project.records['product-one']).toBeDefined();
  });
});
