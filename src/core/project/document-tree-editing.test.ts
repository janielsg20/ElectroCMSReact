import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from './project-factory';
import { insertDocumentNode } from './document-tree';
import {
  copyDocumentSubtrees,
  cutDocumentSubtrees,
  groupDocumentNodes,
  pasteDocumentClipboard,
  setDocumentNodesHidden,
  setDocumentNodesLocked,
  ungroupDocumentNode,
} from './document-tree-editing';
import type { CanonicalDocument, DocumentNode } from './project-model';

function node(id: string, name: string): DocumentNode {
  return {
    id,
    type: 'core/container',
    version: 1,
    name,
    props: {},
    styles: {},
    children: [],
  };
}

function documentWithSiblings(): CanonicalDocument {
  const project = createCanonicalProject({ id: 'project_edit_test', name: 'Edit test' });
  const document = project.documents[project.documentOrder[0] ?? ''];
  if (!document) throw new Error('Expected default document.');
  let next = insertDocumentNode(document, node('node_a', 'A'), { parentId: document.rootNodeId });
  next = insertDocumentNode(next, node('node_b', 'B'), { parentId: document.rootNodeId });
  next = insertDocumentNode(next, node('node_c', 'C'), { parentId: document.rootNodeId });
  return next;
}

describe('document tree editing operations', () => {
  it('copies and pastes subtrees with fresh ids', () => {
    const document = documentWithSiblings();
    const clipboard = copyDocumentSubtrees(document, ['node_a', 'node_b']);
    let sequence = 0;
    const pasted = pasteDocumentClipboard(
      document,
      clipboard,
      document.rootNodeId,
      () => `node_copy_${++sequence}`,
    );

    expect(pasted.pastedRootNodeIds).toEqual(['node_copy_1', 'node_copy_2']);
    expect(Object.keys(pasted.document.nodes)).toHaveLength(Object.keys(document.nodes).length + 2);
    expect(pasted.document.nodes.node_copy_1?.name).toBe('A Copy');
    expect(pasted.document.nodes.node_copy_2?.name).toBe('B Copy');
  });

  it('cuts selected roots without duplicating nested selections', () => {
    let document = documentWithSiblings();
    document = insertDocumentNode(document, node('node_nested', 'Nested'), { parentId: 'node_a' });
    const cut = cutDocumentSubtrees(document, ['node_a', 'node_nested']);

    expect(cut.clipboard.rootNodeIds).toEqual(['node_a']);
    expect(cut.document.nodes.node_a).toBeUndefined();
    expect(cut.document.nodes.node_nested).toBeUndefined();
  });

  it('groups siblings in canonical order and ungroups them', () => {
    const document = documentWithSiblings();
    const group: DocumentNode = {
      id: 'node_group',
      type: 'core/group',
      version: 1,
      name: 'Group',
      props: {},
      styles: {},
      children: [],
    };
    const grouped = groupDocumentNodes(document, ['node_b', 'node_a'], group);
    expect(grouped.nodes[grouped.rootNodeId]?.children).toEqual(['node_group', 'node_c']);
    expect(grouped.nodes.node_group?.children).toEqual(['node_a', 'node_b']);

    const ungrouped = ungroupDocumentNode(grouped, 'node_group');
    expect(ungrouped.nodes[ungrouped.rootNodeId]?.children).toEqual(['node_a', 'node_b', 'node_c']);
    expect(ungrouped.nodes.node_group).toBeUndefined();
  });

  it('sets lock and hidden flags without structural mutation', () => {
    const document = documentWithSiblings();
    const locked = setDocumentNodesLocked(document, ['node_a', 'node_b'], true);
    const hidden = setDocumentNodesHidden(locked, ['node_b'], true);

    expect(hidden.nodes.node_a?.locked).toBe(true);
    expect(hidden.nodes.node_b?.locked).toBe(true);
    expect(hidden.nodes.node_b?.hidden).toBe(true);
    expect(hidden.nodes[hidden.rootNodeId]?.children).toEqual(['node_a', 'node_b', 'node_c']);
  });
});
