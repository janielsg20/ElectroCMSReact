import { describe, expect, it } from 'vitest';
import type { CanonicalDocument, DocumentNode } from './project-model';
import { insertDocumentNode } from './document-tree';
import { moveDocumentNode, validateDocumentNodeMove } from './document-tree-move';

function node(id: string): DocumentNode {
  return {
    id,
    type: 'test/box',
    version: 1,
    props: {},
    styles: {},
    children: [],
  };
}

function fixture(): CanonicalDocument {
  let document: CanonicalDocument = {
    id: 'document_move_test',
    kind: 'page',
    name: 'Move test',
    rootNodeId: 'node_root',
    nodes: {
      node_root: { ...node('node_root'), type: 'core/root' },
    },
    metadata: {},
  };
  document = insertDocumentNode(document, node('node_a'), { parentId: 'node_root' });
  document = insertDocumentNode(document, node('node_b'), { parentId: 'node_root' });
  document = insertDocumentNode(document, node('node_c'), { parentId: 'node_root' });
  return document;
}

describe('moveDocumentNode', () => {
  it('reorders siblings using drop indexes from the pre-move tree', () => {
    const original = fixture();
    const moved = moveDocumentNode(original, 'node_a', { parentId: 'node_root', index: 3 });

    expect(original.nodes.node_root?.children).toEqual(['node_a', 'node_b', 'node_c']);
    expect(moved.nodes.node_root?.children).toEqual(['node_b', 'node_c', 'node_a']);
  });

  it('nests a node under another node without duplicating parent references', () => {
    const original = fixture();
    const moved = moveDocumentNode(original, 'node_a', { parentId: 'node_b' });

    expect(moved.nodes.node_root?.children).toEqual(['node_b', 'node_c']);
    expect(moved.nodes.node_b?.children).toEqual(['node_a']);
  });

  it('moves a nested node back to a root index', () => {
    const nested = moveDocumentNode(fixture(), 'node_a', { parentId: 'node_b' });
    const moved = moveDocumentNode(nested, 'node_a', { parentId: 'node_root', index: 1 });

    expect(moved.nodes.node_root?.children).toEqual(['node_b', 'node_a', 'node_c']);
    expect(moved.nodes.node_b?.children).toEqual([]);
  });

  it('rejects root, self and descendant targets before mutation', () => {
    const nested = moveDocumentNode(fixture(), 'node_a', { parentId: 'node_b' });
    const withDescendant = moveDocumentNode(nested, 'node_c', { parentId: 'node_a' });

    expect(validateDocumentNodeMove(withDescendant, 'node_root', { parentId: 'node_a' })).toMatchObject({
      valid: false,
      issue: { code: 'ROOT_MOVE_FORBIDDEN' },
    });
    expect(validateDocumentNodeMove(withDescendant, 'node_a', { parentId: 'node_a' })).toMatchObject({
      valid: false,
      issue: { code: 'SELF_PARENT_FORBIDDEN' },
    });
    expect(validateDocumentNodeMove(withDescendant, 'node_a', { parentId: 'node_c' })).toMatchObject({
      valid: false,
      issue: { code: 'DESCENDANT_PARENT_FORBIDDEN' },
    });
  });

  it('rejects target indexes outside the current target parent range', () => {
    expect(validateDocumentNodeMove(fixture(), 'node_a', { parentId: 'node_root', index: 99 })).toMatchObject({
      valid: false,
      issue: { code: 'INVALID_TARGET_INDEX' },
    });
  });
});
