import { ValidationError } from '../domain';
import {
  assertDocumentTree,
  getDescendantNodeIds,
  getDocumentNode,
  type DocumentTreeIndex,
} from './document-tree';
import type { CanonicalDocument, DocumentNode } from './project-model';

export type DocumentNodeMoveIssueCode =
  | 'NODE_NOT_FOUND'
  | 'PARENT_NOT_FOUND'
  | 'ROOT_MOVE_FORBIDDEN'
  | 'SELF_PARENT_FORBIDDEN'
  | 'DESCENDANT_PARENT_FORBIDDEN'
  | 'INVALID_TARGET_INDEX';

export interface DocumentNodeMoveIssue {
  code: DocumentNodeMoveIssueCode;
  message: string;
}

export type DocumentNodeMoveValidation =
  | { valid: true; sourceParentId: string; targetIndex: number }
  | { valid: false; issue: DocumentNodeMoveIssue };

export interface MoveDocumentNodeOptions {
  parentId: string;
  index?: number;
}

export class DocumentNodeMoveError extends ValidationError {
  constructor(readonly issue: DocumentNodeMoveIssue) {
    super(issue.message);
  }
}

function invalid(code: DocumentNodeMoveIssueCode, message: string): DocumentNodeMoveValidation {
  return { valid: false, issue: { code, message } };
}

function resolveTargetIndex(index: number | undefined, length: number): number | null {
  const resolved = index ?? length;
  return Number.isInteger(resolved) && resolved >= 0 && resolved <= length ? resolved : null;
}

function sourceParentId(index: DocumentTreeIndex, nodeId: string): string | null {
  return index.parentByNodeId.get(nodeId) ?? null;
}

export function validateDocumentNodeMove(
  document: CanonicalDocument,
  nodeId: string,
  options: MoveDocumentNodeOptions,
): DocumentNodeMoveValidation {
  const treeIndex = assertDocumentTree(document);
  if (!document.nodes[nodeId]) {
    return invalid('NODE_NOT_FOUND', `Node ${nodeId} does not exist.`);
  }
  if (nodeId === document.rootNodeId) {
    return invalid('ROOT_MOVE_FORBIDDEN', 'The document root cannot be moved.');
  }

  const targetParent = document.nodes[options.parentId];
  if (!targetParent) {
    return invalid('PARENT_NOT_FOUND', `Target parent ${options.parentId} does not exist.`);
  }
  if (nodeId === options.parentId) {
    return invalid('SELF_PARENT_FORBIDDEN', `Node ${nodeId} cannot become its own parent.`);
  }

  const descendants = new Set(getDescendantNodeIds(document, nodeId));
  if (descendants.has(options.parentId)) {
    return invalid(
      'DESCENDANT_PARENT_FORBIDDEN',
      `Node ${nodeId} cannot move inside descendant ${options.parentId}.`,
    );
  }

  const currentParentId = sourceParentId(treeIndex, nodeId);
  if (!currentParentId) {
    return invalid('NODE_NOT_FOUND', `Node ${nodeId} is not attached to a parent.`);
  }

  const targetIndex = resolveTargetIndex(options.index, targetParent.children.length);
  if (targetIndex === null) {
    return invalid(
      'INVALID_TARGET_INDEX',
      `Move index ${String(options.index)} must be between 0 and ${targetParent.children.length}.`,
    );
  }

  return { valid: true, sourceParentId: currentParentId, targetIndex };
}

export function moveDocumentNode(
  document: CanonicalDocument,
  nodeId: string,
  options: MoveDocumentNodeOptions,
): CanonicalDocument {
  const validation = validateDocumentNodeMove(document, nodeId, options);
  if (!validation.valid) throw new DocumentNodeMoveError(validation.issue);

  const sourceParent = getDocumentNode(document, validation.sourceParentId);
  const targetParent = getDocumentNode(document, options.parentId);
  const sourceIndex = sourceParent.children.indexOf(nodeId);
  if (sourceIndex < 0) {
    throw new DocumentNodeMoveError({
      code: 'NODE_NOT_FOUND',
      message: `Node ${nodeId} is not present in source parent ${sourceParent.id}.`,
    });
  }

  let insertionIndex = validation.targetIndex;
  const nextNodes: Record<string, DocumentNode> = { ...document.nodes };

  if (sourceParent.id === targetParent.id) {
    const nextChildren = [...sourceParent.children];
    nextChildren.splice(sourceIndex, 1);
    if (insertionIndex > sourceIndex) insertionIndex -= 1;
    nextChildren.splice(insertionIndex, 0, nodeId);
    nextNodes[sourceParent.id] = { ...sourceParent, children: nextChildren };
  } else {
    const sourceChildren = sourceParent.children.filter((childId) => childId !== nodeId);
    const targetChildren = [...targetParent.children];
    targetChildren.splice(insertionIndex, 0, nodeId);
    nextNodes[sourceParent.id] = { ...sourceParent, children: sourceChildren };
    nextNodes[targetParent.id] = { ...targetParent, children: targetChildren };
  }

  const nextDocument: CanonicalDocument = {
    ...document,
    nodes: nextNodes,
  };
  assertDocumentTree(nextDocument);
  return nextDocument;
}
