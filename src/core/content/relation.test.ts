import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import { createContentType, createDefaultContentTypeDefinition } from './content-type';
import {
  createDefaultRelationDefinition,
  createRelation,
  listRelationDefinitions,
  removeRelation,
  updateRelation,
} from './relation';

function projectWithTypes() {
  let project = createCanonicalProject({ id: 'project_relations', name: 'Relations' });
  for (const [id, label] of [['product', 'Products'], ['brand', 'Brands']] as const) {
    const created = createContentType(project, {
      ...createDefaultContentTypeDefinition(id, label),
      singularLabel: label.slice(0, -1),
      slug: label.toLowerCase(),
    });
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error(created.error.message);
    project = created.project;
  }
  return project;
}

describe('MF-043 relation model', () => {
  it('creates lists and updates a relation between canonical Content Types', () => {
    const project = projectWithTypes();
    const definition = {
      ...createDefaultRelationDefinition('product', 'brand', 'product-brand'),
      label: 'Product brand',
      sourceCardinality: 'one' as const,
      targetCardinality: 'many' as const,
    };
    const created = createRelation(project, definition);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(listRelationDefinitions(created.project)).toEqual([definition]);

    const updated = updateRelation(created.project, definition.id, {
      ...definition,
      label: 'Catalog brand',
      bidirectional: false,
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.label).toBe('Catalog brand');
    expect(updated.value.bidirectional).toBe(false);
  });

  it('rejects missing endpoints and immutable id changes', () => {
    const project = projectWithTypes();
    const missing = createRelation(project, createDefaultRelationDefinition('product', 'missing', 'bad-relation'));
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe('UNKNOWN_TARGET_CONTENT_TYPE');

    const created = createRelation(project, createDefaultRelationDefinition('product', 'brand', 'product-brand'));
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const renamed = updateRelation(created.project, 'product-brand', {
      ...created.value,
      id: 'renamed-relation',
    });
    expect(renamed.ok).toBe(false);
    if (!renamed.ok) expect(renamed.error.code).toBe('ID_MISMATCH');
  });

  it('blocks deleting relations still referenced by Field Groups', () => {
    const project = projectWithTypes();
    const created = createRelation(project, createDefaultRelationDefinition('product', 'brand', 'product-brand'));
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    created.project.fieldGroups.references = {
      version: 1,
      id: 'references',
      label: 'References',
      description: '',
      presentation: 'group',
      fields: [{
        version: 1,
        id: 'brand',
        name: 'brand',
        label: 'Brand',
        description: '',
        placeholder: '',
        required: false,
        type: 'core/relation',
        typeVersion: 2,
        config: { relationId: 'product-brand', side: 'source' },
        defaultValue: [],
        conditions: [],
        roleVisibility: [],
      }],
    };
    const blocked = removeRelation(created.project, 'product-brand');
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.code).toBe('RELATION_IN_USE');
  });
});
