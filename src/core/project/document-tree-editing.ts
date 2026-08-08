import { ValidationError } from '../domain';
import {
  assertDocumentTree,
  getAncestorNodeIds,
  getDescendantNodeIds,
  getDocumentNode,
  getParentNodeId,
  removeDocumentNode,
  updateDocumentNode,
} from './document-tree';
import type { CanonicalDocument, DocumentNode } from './project-model';

export type DocumentEditingErrorCode =
  | 'EMPTY_SELECTION'
  | 'ROOT_SELECTION_FORBIDDEN'
  | 'GROUP_REQUIRES_SIBLINGS'
  | 'GROUP_ID_CONFLICT'
  | 'INVALID_GROUP'
  | 'EMPTY_CLIPBOARD'
  | 'PASTE_PARENT_NOT_FOUND'
  | 'INVALID_PASTE_INDEX';

export class DocumentEditingError extends ValidationError {
  constructor(
    readonly editingCode: DocumentEditingErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export interface DocumentClipboardPayload {
  sourceDocumentId: string;
  rootNodeIds: readonly string[];
  nodes: Readonly<Record<string, DocumentNode>>;
}

export interface PasteDocumentClipboardResult {
  document: CanonicalDocument;
  pastedRootNodeIds: readonly string[];
}

function effectiveSelectionRoots(
  document: CanonicalDocument,
  nodeIds: readonly string[],
): string[] {
  const selected = new Set(nodeIds);
  const tree = assertDocumentTree(document);
  return tree.preorder.filter((nodeId) => {
    if (!selected.has(nodeId)) return false;
    if (nodeId === document.rootNodeId) {
      throw new DocumentEditingError(
        'ROOT_SELECTION_FORBIDDEN',
        'The document root cannot be copied, cut or grouped.',
      );
    }
    return !getAncestorNodeIds(document, nodeId).some((ancestorId) => selected.has(ancestorId));
  });
}

export function copyDocumentSubtrees(
  document: CanonicalDocument,
  nodeIds: readonly string[],
): DocumentClipboardPayload {
  if (nodeIds.length === 0) {
    throw new DocumentEditingError('EMPTY_SELECTION', 'Nothing is selected.');
  }
  const roots = effectiveSelectionRoots(document, nodeIds);
  const included = new Set<string>();
  for (const rootId of roots) {
    included.add(rootId);
    for (const descendantId of getDescendantNodeIds(document, rootId)) included.add(descendantId);
  }
  const nodes: Record<string, DocumentNode> = {};
  for (const nodeId of included) {
    nodes[nodeId] = structuredClone(getDocumentNode(document, nodeId));
  }
  return {
    sourceDocumentId: document.id,
    rootNodeIds: roots,
    nodes,
  };
}

export function cutDocumentSubtrees(
  document: CanonicalDocument,
  nodeIds: readonly string[],
): { document: CanonicalDocument; clipboard: DocumentClipboardPayload } {
  const clipboard = copyDocumentSubtrees(document, nodeIds);
  let nextDocument = document;
  for (const rootId of clipboard.rootNodeIds) {
    nextDocument = removeDocumentNode(nextDocument, rootId).document;
  }
  return { document: nextDocument, clipboard };
}

export function pasteDocumentClipboard(
  document: CanonicalDocument,
  clipboard: DocumentClipboardPayload,
  parentId: string,
  createNodeId: () => string,
  index?: number,
): PasteDocumentClipboardResult {
  if (clipboard.rootNodeIds.length === 0) {
    throw new DocumentEditingError('EMPTY_CLIPBOARD', 'Clipboard has no root nodes.');
  }
  const parent = document.nodes[parentId];
  if (!parent) {
    throw new DocumentEditingError(
      'PASTE_PARENT_NOT_FOUND',
      `Paste parent ${parentId} does not exist.`,
    );
  }

  const idMap = new Map<string, string>();
  for (const sourceId of Object.keys(clipboard.nodes)) {
    let nextId = createNodeId();
    while (document.nodes[nextId] || [...idMap.values()].includes(nextId)) nextId = createNodeId();
    idMap.set(sourceId, nextId);
  }

  const pastedNodes: Record<string, DocumentNode> = {};
  for (const [sourceId, sourceNode] of Object.entries(clipboard.nodes)) {
    const nextId = idMap.get(sourceId);
    if (!nextId) continue;
    const cloned = structuredClone(sourceNode);
    pastedNodes[nextId] = {
      ...cloned,
      id: nextId,
      ...(clipboard.rootNodeIds.includes(sourceId)
        ? { name: `${sourceNode.name?.trim() || sourceNode.type} Copy` }
        : {}),
      children: sourceNode.children.map((childId) => {
        const mapped = idMap.get(childId);
        if (!mapped) {
          throw new DocumentEditingError('EMPTY_CLIPBOARD', `Clipboard child ${childId} is missing.`);
        }
        return mapped;
      }),
    };
  }

  const pastedRootNodeIds = clipboard.rootNodeIds.map((rootId) => {
    const mapped = idMap.get(rootId);
    if (!mapped) {
      throw new DocumentEditingError('EMPTY_CLIPBOARD', `Clipboard root ${rootId} is missing.`);
    }
    return mapped;
  });
  const insertionIndex = index ?? parent.children.length;
  if (!Number.isInteger(insertionIndex) || insertionIndex < 0 || insertionIndex > parent.children.length) {
    throw new DocumentEditingError('INVALID_PASTE_INDEX', 'Paste insertion index is invalid.');
  }
  const nextChildren = [...parent.children];
  nextChildren.splice(insertionIndex, 0, ...pastedRootNodeIds);
  const nextDocument: CanonicalDocument = {
    ...document,
    nodes: {
      ...document.nodes,
      ...pastedNodes,
      [parentId]: { ...parent, children: nextChildren },
    },
  };
  assertDocumentTree(nextDocument);
  return { document: nextDocument, pastedRootNodeIds };
}

export function groupDocumentNodes(
  document: CanonicalDocument,
  nodeIds: readonly string[],
  groupNode: DocumentNode,
): CanonicalDocument {
  const roots = effectiveSelectionRoots(document, nodeIds);
  if (roots.length < 2) {
    throw new DocumentEditingError(
      'GROUP_REQUIRES_SIBLINGS',
      'Grouping requires at least two selected sibling nodes.',
    );
  }
  if (document.nodes[groupNode.id]) {
    throw new DocumentEditingError('GROUP_ID_CONFLICT', `Group id ${groupNode.id} already exists.`);
  }
  const parentIds = roots.map((nodeId) => getParentNodeId(document, nodeId));
  const parentId = parentIds[0];
  if (!parentId || parentIds.some((candidate) => candidate !== parentId)) {
    throw new DocumentEditingError(
      'GROUP_REQUIRES_SIBLINGS',
      'Selected nodes must share the same parent.',
    );
  }
  const parent = getDocumentNode(document, parentId);
  const selected = new Set(roots);
  const orderedRoots = parent.children.filter((childId) => selected.has(childId));
  if (orderedRoots.length !== roots.length) {
    throw new DocumentEditingError('GROUP_REQUIRES_SIBLINGS', 'Only direct sibling nodes can be grouped.');
  }
  const firstIndex = parent.children.findIndex((childId) => selected.has(childId));
  const nextChildren = parent.children.filter((childId) => !selected.has(childId));
  nextChildren.splice(firstIndex, 0, groupNode.id);

  const nextDocument: CanonicalDocument = {
    ...document,
    nodes: {
      ...document.nodes,
      [parentId]: { ...parent, children: nextChildren },
      [groupNode.id]: {
        ...structuredClone(groupNode),
        children: orderedRoots,
      },
    },
  };
  assertDocumentTree(nextDocument);
  return nextDocument;
}

export function ungroupDocumentNode(document: CanonicalDocument, groupId: string): CanonicalDocument {
  const group = getDocumentNode(document, groupId);
  if (group.type !== 'core/group') {
    throw new DocumentEditingError('INVALID_GROUP', `Node ${groupId} is not a core/group node.`);
  }
  const parentId = getParentNodeId(document, groupId);
  if (!parentId) throw new DocumentEditingError('INVALID_GROUP', 'Group has no parent.');
  const parent = getDocumentNode(document, parentId);
  const groupIndex = parent.children.indexOf(groupId);
  const nextChildren = [...parent.children];
  nextChildren.splice(groupIndex, 1, ...group.children);
  const nextNodes = { ...document.nodes };
  delete nextNodes[groupId];
  nextNodes[parentId] = { ...parent, children: nextChildren };
  const nextDocument = { ...document, nodes: nextNodes };
  assertDocumentTree(nextDocument);
  return nextDocument;
}

export function setDocumentNodesLocked(
  document: CanonicalDocument,
  nodeIds: readonly string[],
  locked: boolean,
): CanonicalDocument {
  let nextDocument = document;
  for (const nodeId of nodeIds) {
    if (nodeId === document.rootNodeId) continue;
    nextDocument = updateDocumentNode(nextDocument, nodeId, (node) => ({ ...node, locked }));
  }
  return nextDocument;
}

export function setDocumentNodesHidden(
  document: CanonicalDocument,
  nodeIds: readonly string[],
  hidden: boolean,
): CanonicalDocument {
  let nextDocument = document;
  for (const nodeId of nodeIds) {
    if (nodeId === document.rootNodeId) continue;
    nextDocument = updateDocumentNode(nextDocument, nodeId, (node) => ({ ...node, hidden }));
  }
  return nextDocument;
}
