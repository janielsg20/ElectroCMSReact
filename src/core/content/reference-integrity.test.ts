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
  createDefaultRelationDefinition,
  createFieldGroup,
  createRelation,
  removeContentRecord,
  removeContentType,
  removeRelation,
  updateRelation,
  validateContentRecordDefinition,
  type CanonicalProject,
} from './index';

const NOW = '2026-08-08T12:00:00.000Z';

function mustProject<T extends { ok: boolean; project?: CanonicalProject; error?: { message: string } }>(result: T): CanonicalProject {
  if (!result.ok || !result.project) {
    throw new Error(result.error?.message ?? 'Expected a successful project mutation.');
  }
  return result.project;
}

function createReferenceProject() {
  let project = createCanonicalProject({
    id: 'project_reference_integrity',
    name: 'Reference integrity',
    now: NOW,
  });

  for (const [id, plural, singular] of [
    ['product', 'Products', 'Product'],
    ['brand', 'Brands', 'Brand'],
  ] as const) {
    project = mustProject(createContentType(project, {
      ...createDefaultContentTypeDefinition(id, plural),
      singularLabel: singular,
      slug: plural.toLowerCase(),
    }));
  }

  project = mustProject(createRelation(project, {
    ...createDefaultRelationDefinition('product', 'brand', 'product-brand'),
    label: 'Product brand',
    sourceCardinality: 'one',
    targetCardinality: 'many',
  }));

  const registry = createContentFieldTypeRegistry();
  const relationField = {
    ...createDefaultCustomFieldDefinition(registry, 'core/relation', 'brand', 'Brand'),
    name: 'brand',
    config: { relationId: 'product-brand', side: 'source' },
    defaultValue: [],
  };
  project = mustProject(createFieldGroup(project, {
    ...createDefaultFieldGroupDefinition('product-relations', 'Product Relations'),
    fields: [relationField],
  }, registry));

  project = mustProject(createContentRecord(project, {
    ...createDefaultContentRecordDefinition(project, 'brand', 'brand-nike', NOW),
    title: 'Nike',
    slug: 'nike',
  }, registry));

  project = mustProject(createContentRecord(project, {
    ...createDefaultContentRecordDefinition(project, 'brand', 'brand-adidas', NOW),
    title: 'Adidas',
    slug: 'adidas',
  }, registry));

  project = mustProject(createContentRecord(project, {
    ...createDefaultContentRecordDefinition(project, 'product', 'product-shoe', NOW),
    title: 'Shoe',
    slug: 'shoe',
    fieldGroupIds: ['product-relations'],
    fieldValues: {
      'product-relations': {
        brand: ['brand-nike'],
      },
    },
  }, registry));

  return { project, registry };
}

describe('MF-043 reference integrity', () => {
  it('rejects reference values that violate relation cardinality or endpoint type', () => {
    const { project, registry } = createReferenceProject();
    const current = project.records['product-shoe'];
    expect(current).toBeDefined();

    const tooMany = validateContentRecordDefinition({
      ...current,
      fieldValues: {
        'product-relations': {
          brand: ['brand-nike', 'brand-adidas'],
        },
      },
    }, project, registry);
    expect(tooMany.ok).toBe(false);
    if (!tooMany.ok) {
      expect(tooMany.issues.some((issue) => issue.message.includes('allows only one referenced record'))).toBe(true);
    }

    const wrongEndpoint = validateContentRecordDefinition({
      ...current,
      fieldValues: {
        'product-relations': {
          brand: ['product-shoe'],
        },
      },
    }, project, registry);
    expect(wrongEndpoint.ok).toBe(false);
    if (!wrongEndpoint.ok) {
      expect(wrongEndpoint.issues.some((issue) => issue.message.includes('must belong to Content Type brand'))).toBe(true);
    }
  });

  it('protects referenced records, relation definitions and endpoint Content Types', () => {
    const { project } = createReferenceProject();

    const recordDelete = removeContentRecord(project, 'brand-nike');
    expect(recordDelete.ok).toBe(false);
    if (!recordDelete.ok) {
      expect(recordDelete.error.code).toBe('PROJECT_INVALID');
      expect(recordDelete.error.message).toContain('referenced by relation fields in record product-shoe');
    }

    const relationDelete = removeRelation(project, 'product-brand');
    expect(relationDelete.ok).toBe(false);
    if (!relationDelete.ok) {
      expect(relationDelete.error.code).toBe('RELATION_IN_USE');
      expect(relationDelete.error.message).toContain('referenced by a Field Group');
    }

    const contentTypeDelete = removeContentType(project, 'brand');
    expect(contentTypeDelete.ok).toBe(false);
    if (!contentTypeDelete.ok) {
      expect(contentTypeDelete.error.code).toBe('CONTENT_TYPE_IN_USE');
      expect(contentTypeDelete.error.message).toContain('used by relation product-brand');
    }
  });

  it('rejects relation updates that would invalidate existing reference records', () => {
    const { project } = createReferenceProject();
    const currentRelation = project.relations['product-brand'];
    expect(currentRelation).toBeDefined();

    const update = updateRelation(project, 'product-brand', {
      ...currentRelation,
      targetContentTypeId: 'product',
    });

    expect(update.ok).toBe(false);
    if (!update.ok) {
      expect(update.error.code).toBe('RELATION_IN_USE');
      expect(update.error.message).toContain('record product-shoe would become invalid');
    }
  });
});
