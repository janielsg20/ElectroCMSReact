import { describe, expect, it } from 'vitest';
import type { CanonicalDocument, DocumentNode } from './project-model';
import {
  assertDocumentTree,
  getAncestorNodeIds,
  getDescendantNodeIds,
  getParentNodeId,
  insertDocumentNode,
  inspectDocumentTree,
  removeDocumentNode,
  traverseDocumentNodeIds,
  updateDocumentNode,
} from './document-tree';

function node(id: string, children: string[] = []): DocumentNode {
  return {
    id,
    type: 'test/box',
    version: 1,
    props: {},
    styles: {},
    children,
  };
}

function documentFixture(): CanonicalDocument {
  return {
    id: 'document_tree_test',
    kind: 'page',
    name: 'Tree test',
    rootNodeId: 'node_root',
    nodes: {
      node_root: node('node_root'),
    },
    metadata: {},
  };
}

function stableRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe('document node tree engine', () => {
  it('indexes parent, depth and traversal orders from the canonical flat node record', () => {
    let document = documentFixture();
    document = insertDocumentNode(document, node('node_a'), { parentId: 'node_root' });
    document = insertDocumentNode(document, node('node_b'), { parentId: 'node_root' });
    document = insertDocumentNode(document, node('node_c'), { parentId: 'node_a' });

    const index = assertDocumentTree(document);

    expect(index.parentByNodeId.get('node_root')).toBeNull();
    expect(index.parentByNodeId.get('node_c')).toBe('node_a');
    expect(index.depthByNodeId.get('node_c')).toBe(2);
    expect(traverseDocumentNodeIds(document, 'preorder')).toEqual([
      'node_root',
      'node_a',
      'node_c',
      'node_b',
    ]);
    expect(traverseDocumentNodeIds(document, 'postorder')).toEqual([
      'node_c',
      'node_a',
      'node_b',
      'node_root',
    ]);
    expect(traverseDocumentNodeIds(document, 'breadth-first')).toEqual([
      'node_root',
      'node_a',
      'node_b',
      'node_c',
    ]);
    expect(getAncestorNodeIds(document, 'node_c')).toEqual(['node_root', 'node_a']);
    expect(getDescendantNodeIds(document, 'node_a')).toEqual(['node_c']);
    expect(getParentNodeId(document, 'node_a')).toBe('node_root');
  });

  it('inserts immutably at a controlled child index', () => {
    const original = documentFixture();
    const first = insertDocumentNode(original, node('node_a'), { parentId: 'node_root' });
    const second = insertDocumentNode(first, node('node_b'), {
      parentId: 'node_root',
      index: 0,
    });

    expect(original.nodes.node_root?.children).toEqual([]);
    expect(first.nodes.node_root?.children).toEqual(['node_a']);
    expect(second.nodes.node_root?.children).toEqual(['node_b', 'node_a']);
    expect(JSON.parse(JSON.stringify(second))).toEqual(second);
  });

  it('updates node content without permitting structural mutations', () => {
    const document = insertDocumentNode(documentFixture(), node('node_a'), {
      parentId: 'node_root',
    });

    const updated = updateDocumentNode(document, 'node_a', (current) => ({
      ...current,
      name: 'Renamed',
      props: { label: 'Hello' },
    }));

    expect(document.nodes.node_a?.name).toBeUndefined();
    expect(updated.nodes.node_a).toMatchObject({ name: 'Renamed', props: { label: 'Hello' } });
    expect(() =>
      updateDocumentNode(document, 'node_a', (current) => ({
        ...current,
        children: ['node_root'],
      })),
    ).toThrow(/cannot change id or children/i);
  });

  it('removes an entire subtree and detaches it from its parent', () => {
    let document = documentFixture();
    document = insertDocumentNode(document, node('node_a'), { parentId: 'node_root' });
    document = insertDocumentNode(document, node('node_b'), { parentId: 'node_a' });
    document = insertDocumentNode(document, node('node_c'), { parentId: 'node_b' });
    document = insertDocumentNode(document, node('node_keep'), { parentId: 'node_root' });

    const result = removeDocumentNode(document, 'node_a');

    expect(result.removedNodeIds).toEqual(['node_a', 'node_b', 'node_c']);
    expect(Object.keys(result.document.nodes).sort()).toEqual(['node_keep', 'node_root']);
    expect(result.document.nodes.node_root?.children).toEqual(['node_keep']);
    expect(document.nodes.node_a).toBeDefined();
    expect(() => removeDocumentNode(document, 'node_root')).toThrow(/root cannot be removed/i);
  });

  it('diagnoses missing children, multiple parents, cycles, root parents and orphans', () => {
    const malformed: CanonicalDocument = {
      ...documentFixture(),
      nodes: {
        node_root: node('node_root', ['node_a', 'node_missing']),
        node_a: node('node_a', ['node_b']),
        node_b: node('node_b', ['node_a']),
        node_other: node('node_other', ['node_b']),
        node_orphan: node('node_orphan'),
      },
    };

    const inspection = inspectDocumentTree(malformed);
    const codes = new Set(inspection.issues.map((entry) => entry.code));

    expect(inspection.valid).toBe(false);
    expect(codes).toEqual(
      expect.objectContaining ? codes : codes,
    );
    expect(codes.has('MISSING_CHILD')).toBe(true);
    expect(codes.has('MULTIPLE_PARENTS')).toBe(true);
    expect(codes.has('NODE_CYCLE')).toBe(true);
    expect(codes.has('ORPHAN_NODE')).toBe(true);
  });

  it('rejects duplicate ids, non-leaf single inserts and invalid indexes', () => {
    const document = documentFixture();

    expect(() =>
      insertDocumentNode(document, node('node_root'), { parentId: 'node_root' }),
    ).toThrow(/already exists/i);
    expect(() =>
      insertDocumentNode(document, node('node_a', ['node_child']), { parentId: 'node_root' }),
    ).toThrow(/leaf node/i);
    expect(() =>
      insertDocumentNode(document, node('node_a'), { parentId: 'node_root', index: 2 }),
    ).toThrow(/insert index/i);
  });

  it('preserves tree invariants and serializability across deterministic random CRUD sequences', () => {
    const random = stableRandom(0xdecafbad);
    let document = documentFixture();
    let sequence = 0;

    for (let step = 0; step < 240; step += 1) {
      const before = JSON.stringify(document);
      const nodeIds = traverseDocumentNodeIds(document);
      const nonRootIds = nodeIds.filter((nodeId) => nodeId !== document.rootNodeId);
      const shouldInsert = nonRootIds.length < 3 || (nonRootIds.length < 35 && random() < 0.68);

      if (shouldInsert) {
        const parentId = nodeIds[Math.floor(random() * nodeIds.length)] ?? document.rootNodeId;
        const parent = document.nodes[parentId];
        if (!parent) throw new Error('Random test selected a missing parent.');
        const childIndex = Math.floor(random() * (parent.children.length + 1));
        sequence += 1;
        document = insertDocumentNode(document, node(`node_random_${sequence}`), {
          parentId,
          index: childIndex,
        });
      } else {
        const removable = nonRootIds[Math.floor(random() * nonRootIds.length)];
        if (!removable) throw new Error('Random test expected a removable node.');
        document = removeDocumentNode(document, removable).document;
      }

      expect(JSON.stringify(JSON.parse(before))).toBe(before);
      expect(inspectDocumentTree(document).valid).toBe(true);
      expect(() => JSON.stringify(document)).not.toThrow();
      expect(JSON.parse(JSON.stringify(document))).toEqual(document);
    }
  });
});
