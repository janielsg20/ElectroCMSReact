import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import {
  createContentType,
  createDefaultContentTypeDefinition,
  createDefaultRelationDefinition,
  createRelation,
  listRelationDefinitions,
  removeRelation,
  updateRelation,
} from './index';

function fixture() {
  let project = createCanonicalProject({ id: 'relation_test', name: 'Relation Test', now: '2026-08-09T12:00:00.000Z' });
  for (const [id, label] of [['products', 'Products'], ['brands', 'Brands']] as const) {
    const result = createContentType(project, createDefaultContentTypeDefinition(id, label));
    if (!result.ok) throw new Error(result.error.message);
    project = result.project;
  }
  return project;
}

describe('relations', () => {
  it('creates lists updates and removes a portable relation', () => {
    const project = fixture();
    const definition = { ...createDefaultRelationDefinition('products', 'brands'), id: 'product-brand', label: 'Product brand', sourceCardinality: 'one' as const };
    const created = createRelation(project, definition);
    expect(created.ok).toBe(true);
    expect(project.relations).toEqual({});
    if (!created.ok) return;
    expect(listRelationDefinitions(created.project)).toEqual([definition]);

    const updated = updateRelation(created.project, definition.id, { ...definition, bidirectional: false, targetCardinality: 'one' });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value).toMatchObject({ bidirectional: false, targetCardinality: 'one' });

    const removed = removeRelation(updated.project, definition.id);
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.project.relations).toEqual({});
  });

  it('rejects unknown endpoints duplicate ids and id changes', () => {
    const project = fixture();
    const invalidEndpoint = createRelation(project, createDefaultRelationDefinition('products', 'missing'));
    expect(invalidEndpoint.ok).toBe(false);
    if (!invalidEndpoint.ok) expect(invalidEndpoint.error.code).toBe('UNKNOWN_TARGET_CONTENT_TYPE');

    const definition = createDefaultRelationDefinition('products', 'brands', 'product-brand');
    const created = createRelation(project, definition);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const duplicate = createRelation(created.project, definition);
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.error.code).toBe('DUPLICATE_ID');
    const renamed = updateRelation(created.project, definition.id, { ...definition, id: 'renamed' });
    expect(renamed.ok).toBe(false);
    if (!renamed.ok) expect(renamed.error.code).toBe('ID_MISMATCH');
  });
});
