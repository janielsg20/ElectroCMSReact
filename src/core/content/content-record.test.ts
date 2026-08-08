import { describe, expect, it } from 'vitest';
import { createCanonicalProject, type CanonicalProject } from '../project';
import { createDefaultFieldTypeRegistry } from './builtin-field-types';
import {
  createContentRecord,
  createDefaultContentRecordDefinition,
  listContentRecords,
  removeContentRecord,
  updateContentRecord,
  validateContentRecordDefinition,
  type ContentRecordDefinition,
} from './content-record';
import { createContentType, createDefaultContentTypeDefinition } from './content-type';
import {
  createDefaultCustomFieldDefinition,
  createDefaultFieldGroupDefinition,
  createFieldGroup,
} from './field-group';

const NOW = '2026-08-08T07:40:00.000Z';

function addContentType(project: CanonicalProject, id: string, label: string): CanonicalProject {
  const result = createContentType(project, {
    ...createDefaultContentTypeDefinition(id, label),
    singularLabel: label.replace(/s$/, ''),
    slug: id,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.project;
}

function createRecordFixture() {
  const registry = createDefaultFieldTypeRegistry();
  let project = createCanonicalProject({ id: 'project_records', name: 'Records' });
  project = addContentType(project, 'products', 'Products');
  project = addContentType(project, 'articles', 'Articles');

  const details = createDefaultFieldGroupDefinition('product-details', 'Product details');
  const sku = {
    ...createDefaultCustomFieldDefinition(registry, 'core/text', 'sku', 'SKU'),
    name: 'sku',
    required: true,
    defaultValue: null,
  };
  const price = {
    ...createDefaultCustomFieldDefinition(registry, 'core/currency', 'price', 'Price'),
    name: 'price',
    config: { currency: 'USD', min: 0 },
    defaultValue: 0,
  };
  const featured = {
    ...createDefaultCustomFieldDefinition(registry, 'core/switch', 'featured', 'Featured'),
    name: 'featured',
    defaultValue: false,
  };
  const groupResult = createFieldGroup(
    project,
    { ...details, fields: [sku, price, featured] },
    registry,
  );
  if (!groupResult.ok) throw new Error(groupResult.error.message);
  project = groupResult.project;

  const record: ContentRecordDefinition = {
    ...createDefaultContentRecordDefinition(project, 'products', 'product-alpha', NOW),
    title: 'Product Alpha',
    slug: 'product-alpha',
    fieldGroupIds: ['product-details'],
    fieldValues: {
      'product-details': {
        sku: 'SKU-001',
        price: 25,
        featured: false,
      },
    },
  };

  return { project, registry, record };
}

describe('content record engine', () => {
  it('validates a record against its CPT and selected field group schemas', () => {
    const { project, registry, record } = createRecordFixture();
    const result = validateContentRecordDefinition(record, project, registry);

    expect(result).toEqual({ ok: true, value: record });
  });

  it('applies stored field defaults but still enforces required values', () => {
    const { project, registry, record } = createRecordFixture();
    const missingRequired = structuredClone(record);
    missingRequired.fieldValues = { 'product-details': { price: 10 } };

    const invalid = validateContentRecordDefinition(missingRequired, project, registry);
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'REQUIRED_FIELD_MISSING', path: 'fieldValues.product-details.sku' }),
        ]),
      );
    }

    const valid = structuredClone(record);
    valid.fieldValues = { 'product-details': { sku: 'SKU-002' } };
    const normalized = validateContentRecordDefinition(valid, project, registry);
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) return;
    expect(normalized.value.fieldValues['product-details']).toMatchObject({
      sku: 'SKU-002',
      price: 0,
      featured: false,
    });
  });

  it('delegates field value validation to FieldTypeRegistry', () => {
    const { project, registry, record } = createRecordFixture();
    const invalid = structuredClone(record);
    invalid.fieldValues['product-details']!.price = -1;

    const result = validateContentRecordDefinition(invalid, project, registry);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'INVALID_FIELD_VALUE', path: 'fieldValues.product-details.price' }),
        ]),
      );
    }
  });

  it('rejects unknown groups, unselected group payloads and unknown field names', () => {
    const { project, registry, record } = createRecordFixture();

    const unknownGroup = structuredClone(record);
    unknownGroup.fieldGroupIds = ['missing-group'];
    unknownGroup.fieldValues = { 'missing-group': {} };
    const groupResult = validateContentRecordDefinition(unknownGroup, project, registry);
    expect(groupResult.ok).toBe(false);
    if (!groupResult.ok) {
      expect(groupResult.issues.some((issue) => issue.code === 'UNKNOWN_FIELD_GROUP')).toBe(true);
    }

    const extraGroup = structuredClone(record);
    extraGroup.fieldValues.extra = {};
    const extraResult = validateContentRecordDefinition(extraGroup, project, registry);
    expect(extraResult.ok).toBe(false);
    if (!extraResult.ok) {
      expect(extraResult.issues.some((issue) => issue.code === 'UNKNOWN_FIELD_VALUE')).toBe(true);
    }

    const unknownField = structuredClone(record);
    unknownField.fieldValues['product-details']!.unknown = 'value';
    const fieldResult = validateContentRecordDefinition(unknownField, project, registry);
    expect(fieldResult.ok).toBe(false);
    if (!fieldResult.ok) {
      expect(fieldResult.issues.some((issue) => issue.path.endsWith('.unknown'))).toBe(true);
    }
  });

  it('creates updates lists searches filters and removes records', () => {
    const { project, registry, record } = createRecordFixture();
    const created = createContentRecord(project, record, registry);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(listContentRecords(created.project, {}, registry).map((item) => item.id)).toEqual(['product-alpha']);
    expect(listContentRecords(created.project, { contentTypeId: 'products' }, registry)).toHaveLength(1);
    expect(listContentRecords(created.project, { contentTypeId: 'articles' }, registry)).toHaveLength(0);
    expect(listContentRecords(created.project, { status: 'published' }, registry)).toHaveLength(0);
    expect(listContentRecords(created.project, { search: 'alpha' }, registry)).toHaveLength(1);
    expect(listContentRecords(created.project, { search: 'missing' }, registry)).toHaveLength(0);

    const updated = updateContentRecord(
      created.project,
      record.id,
      { ...record, status: 'published', title: 'Product Alpha Updated' },
      registry,
    );
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.status).toBe('published');
    expect(updated.value.title).toBe('Product Alpha Updated');
    expect(updated.value.createdAt).toBe(NOW);
    expect(Date.parse(updated.value.updatedAt)).toBeGreaterThanOrEqual(Date.parse(NOW));

    const removed = removeContentRecord(updated.project, record.id, registry);
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.project.records).toEqual({});
  });

  it('rejects duplicate ids and duplicate slugs inside the same CPT but permits the same slug in another CPT', () => {
    const { project, registry, record } = createRecordFixture();
    const created = createContentRecord(project, record, registry);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const duplicateId = createContentRecord(created.project, record, registry);
    expect(duplicateId.ok).toBe(false);
    if (!duplicateId.ok) expect(duplicateId.error.code).toBe('DUPLICATE_ID');

    const secondProduct = {
      ...record,
      id: 'product-beta',
      title: 'Product Beta',
    };
    const duplicateSlug = createContentRecord(created.project, secondProduct, registry);
    expect(duplicateSlug.ok).toBe(false);
    if (!duplicateSlug.ok) expect(duplicateSlug.error.code).toBe('DUPLICATE_SLUG');

    const article = {
      ...createDefaultContentRecordDefinition(created.project, 'articles', 'article-alpha', NOW),
      title: 'Article Alpha',
      slug: 'product-alpha',
    };
    const allowedAcrossTypes = createContentRecord(created.project, article, registry);
    expect(allowedAcrossTypes.ok).toBe(true);
  });

  it('keeps id and createdAt immutable during updates', () => {
    const { project, registry, record } = createRecordFixture();
    const created = createContentRecord(project, record, registry);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const renamed = updateContentRecord(
      created.project,
      record.id,
      { ...record, id: 'renamed-record' },
      registry,
    );
    expect(renamed.ok).toBe(false);
    if (!renamed.ok) expect(renamed.error.code).toBe('ID_MISMATCH');

    const changedCreatedAt = updateContentRecord(
      created.project,
      record.id,
      { ...record, createdAt: '2026-08-08T07:41:00.000Z' },
      registry,
    );
    expect(changedCreatedAt.ok).toBe(false);
    if (!changedCreatedAt.ok) expect(changedCreatedAt.error.code).toBe('CREATED_AT_MISMATCH');
  });
});
