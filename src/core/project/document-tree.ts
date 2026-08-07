import { ValidationError } from '../domain';
import type { CanonicalDocument, DocumentNode } from './project-model';

export type DocumentTreeIssueCode =
  | 'MISSING_ROOT'
  | 'KEY_ID_MISMATCH'
  | 'MISSING_CHILD'
  | 'DUPLICATE_CHILD'
  | 'MULTIPLE_PARENTS'
  | 'ROOT_HAS_PARENT'
  | 'NODE_CYCLE'
  | 'ORPHAN_NODE';

export interface DocumentTreeIssue {
  code: DocumentTreeIssueCode;
  message: string;
  nodeId?: string;
  parentId?: string;
  childId?: string;
}

export interface DocumentTreeIndex {
  rootNodeId: string;
  parentByNodeId: ReadonlyMap<string, string | null>;
  depthByNodeId: ReadonlyMap<string, number>;
  preorder: readonly string[];
  postorder: readonly string[];
}

export interface DocumentTreeInspection {
  valid: boolean;
  issues: readonly DocumentTreeIssue[];
  index?: DocumentTreeIndex;
}

export class DocumentTreeInvariantError extends ValidationError {
  readonly issues: readonly DocumentTreeIssue[];

  constructor(issues: readonly DocumentTreeIssue[]) {
    super(`Document tree validation failed with ${issues.length} issue(s).`);
    this.issues = issues;
  }
}

export type DocumentTreeOperationCode =
  | 'NODE_NOT_FOUND'
  | 'PARENT_NOT_FOUND'
  | 'NODE_ALREADY_EXISTS'
  | 'ROOT_OPERATION_FORBIDDEN'
  | 'INVALID_INSERT_INDEX'
  | 'NON_LEAF_INSERT'
  | 'STRUCTURE_CHANGED_BY_UPDATE';

export class DocumentTreeOperationError extends ValidationError {
  constructor(
    readonly operationCode: DocumentTreeOperationCode,
    message: string,
  ) {
    super(message);
  }
}

export interface InsertDocumentNodeOptions {
  parentId: string;
  index?: number;
}

export interface RemoveDocumentNodeResult {
  document: CanonicalDocument;
  removedNodeIds: readonly string[];
}

export type DocumentNodeUpdater = (node: DocumentNode) => DocumentNode;
export type TraversalOrder = 'preorder' | 'postorder' | 'breadth-first';

function issue(
  code: DocumentTreeIssueCode,
  message: string,
  details: Omit<DocumentTreeIssue, 'code' | 'message'> = {},
): DocumentTreeIssue {
  return { code, message, ...details };
}

function normalizeInsertIndex(index: number | undefined, length: number): number {
  const resolved = index ?? length;
  if (!Number.isInteger(resolved) || resolved < 0 || resolved > length) {
    throw new DocumentTreeOperationError(
      'INVALID_INSERT_INDEX',
      `Insert index ${String(index)} must be an integer between 0 and ${length}.`,
    );
  }
  return resolved;
}

function childrenEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function inspectDocumentTree(document: CanonicalDocument): DocumentTreeInspection {
  const issues: DocumentTreeIssue[] = [];
  const nodeIds = Object.keys(document.nodes);
  const parentsByNodeId = new Map<string, string[]>();

  for (const nodeId of nodeIds) {
    parentsByNodeId.set(nodeId, []);
    const node = document.nodes[nodeId];
    if (node && node.id !== nodeId) {
      issues.push(
        issue('KEY_ID_MISMATCH', `Node key ${nodeId} does not match node.id ${node.id}.`, {
          nodeId,
        }),
      );
    }
  }

  if (!(document.rootNodeId in document.nodes)) {
    issues.push(
      issue('MISSING_ROOT', `Root node ${document.rootNodeId} does not exist.`, {
        nodeId: document.rootNodeId,
      }),
    );
  }

  for (const [parentId, node] of Object.entries(document.nodes)) {
    const seen = new Set<string>();
    for (const childId of node.children) {
      if (seen.has(childId)) {
        issues.push(
          issue('DUPLICATE_CHILD', `Node ${parentId} references child ${childId} more than once.`, {
            nodeId: parentId,
            parentId,
            childId,
          }),
        );
        continue;
      }
      seen.add(childId);

      const parents = parentsByNodeId.get(childId);
      if (!parents) {
        issues.push(
          issue('MISSING_CHILD', `Node ${parentId} references missing child ${childId}.`, {
            nodeId: parentId,
            parentId,
            childId,
          }),
        );
        continue;
      }
      parents.push(parentId);
    }
  }

  for (const [nodeId, parents] of parentsByNodeId) {
    if (nodeId === document.rootNodeId && parents.length > 0) {
      issues.push(
        issue('ROOT_HAS_PARENT', `Root node ${nodeId} cannot have a parent.`, {
          nodeId,
          parentId: parents[0],
        }),
      );
    }
    if (parents.length > 1) {
      issues.push(
        issue(
          'MULTIPLE_PARENTS',
          `Node ${nodeId} is referenced by multiple parents: ${parents.join(', ')}.`,
          { nodeId, parentId: parents[0] },
        ),
      );
    }
  }

  const cycleVisited = new Set<string>();
  const cycleStack = new Set<string>();
  const cycleReported = new Set<string>();
  const detectCycles = (nodeId: string): void => {
    if (cycleStack.has(nodeId)) {
      if (!cycleReported.has(nodeId)) {
        issues.push(
          issue('NODE_CYCLE', `Document node tree contains a cycle involving ${nodeId}.`, {
            nodeId,
          }),
        );
        cycleReported.add(nodeId);
      }
      return;
    }
    if (cycleVisited.has(nodeId)) return;

    const node = document.nodes[nodeId];
    if (!node) return;
    cycleStack.add(nodeId);
    for (const childId of node.children) {
      if (childId in document.nodes) detectCycles(childId);
    }
    cycleStack.delete(nodeId);
    cycleVisited.add(nodeId);
  };

  for (const nodeId of nodeIds) detectCycles(nodeId);

  const reachable = new Set<string>();
  const markReachable = (nodeId: string): void => {
    if (reachable.has(nodeId)) return;
    const node = document.nodes[nodeId];
    if (!node) return;
    reachable.add(nodeId);
    for (const childId of node.children) markReachable(childId);
  };
  markReachable(document.rootNodeId);

  for (const nodeId of nodeIds) {
    if (!reachable.has(nodeId)) {
      issues.push(
        issue('ORPHAN_NODE', `Node ${nodeId} is not reachable from root ${document.rootNodeId}.`, {
          nodeId,
        }),
      );
    }
  }

  if (issues.length > 0) return { valid: false, issues };

  const parentByNodeId = new Map<string, string | null>();
  const depthByNodeId = new Map<string, number>();
  const preorder: string[] = [];
  const postorder: string[] = [];
  parentByNodeId.set(document.rootNodeId, null);

  const indexNode = (nodeId: string, depth: number): void => {
    const node = document.nodes[nodeId];
    if (!node) return;
    depthByNodeId.set(nodeId, depth);
    preorder.push(nodeId);
    for (const childId of node.children) {
      parentByNodeId.set(childId, nodeId);
      indexNode(childId, depth + 1);
    }
    postorder.push(nodeId);
  };
  indexNode(document.rootNodeId, 0);

  return {
    valid: true,
    issues,
    index: {
      rootNodeId: document.rootNodeId,
      parentByNodeId,
      depthByNodeId,
      preorder,
      postorder,
    },
  };
}

export function assertDocumentTree(document: CanonicalDocument): DocumentTreeIndex {
  const inspection = inspectDocumentTree(document);
  if (!inspection.valid || !inspection.index) {
    throw new DocumentTreeInvariantError(inspection.issues);
  }
  return inspection.index;
}

export function getDocumentNode(document: CanonicalDocument, nodeId: string): DocumentNode {
  const node = document.nodes[nodeId];
  if (!node) {
    throw new DocumentTreeOperationError('NODE_NOT_FOUND', `Node ${nodeId} does not exist.`);
  }
  return node;
}

export function getParentNodeId(document: CanonicalDocument, nodeId: string): string | null {
  const index = assertDocumentTree(document);
  if (!index.parentByNodeId.has(nodeId)) {
    throw new DocumentTreeOperationError('NODE_NOT_FOUND', `Node ${nodeId} does not exist.`);
  }
  return index.parentByNodeId.get(nodeId) ?? null;
}

export function getAncestorNodeIds(document: CanonicalDocument, nodeId: string): readonly string[] {
  const index = assertDocumentTree(document);
  if (!index.parentByNodeId.has(nodeId)) {
    throw new DocumentTreeOperationError('NODE_NOT_FOUND', `Node ${nodeId} does not exist.`);
  }

  const ancestors: string[] = [];
  let current = index.parentByNodeId.get(nodeId) ?? null;
  while (current !== null) {
    ancestors.push(current);
    current = index.parentByNodeId.get(current) ?? null;
  }
  ancestors.reverse();
  return ancestors;
}

export function getDescendantNodeIds(document: CanonicalDocument, nodeId: string): readonly string[] {
  const index = assertDocumentTree(document);
  if (!index.parentByNodeId.has(nodeId)) {
    throw new DocumentTreeOperationError('NODE_NOT_FOUND', `Node ${nodeId} does not exist.`);
  }

  const descendants: string[] = [];
  const visit = (currentId: string): void => {
    const current = document.nodes[currentId];
    if (!current) return;
    for (const childId of current.children) {
      descendants.push(childId);
      visit(childId);
    }
  };
  visit(nodeId);
  return descendants;
}

export function traverseDocumentNodeIds(
  document: CanonicalDocument,
  order: TraversalOrder = 'preorder',
): readonly string[] {
  const index = assertDocumentTree(document);
  if (order === 'preorder') return [...index.preorder];
  if (order === 'postorder') return [...index.postorder];

  const result: string[] = [];
  const queue = [document.rootNodeId];
  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId) continue;
    result.push(nodeId);
    const node = document.nodes[nodeId];
    if (node) queue.push(...node.children);
  }
  return result;
}

export function insertDocumentNode(
  document: CanonicalDocument,
  node: DocumentNode,
  options: InsertDocumentNodeOptions,
): CanonicalDocument {
  assertDocumentTree(document);

  if (document.nodes[node.id]) {
    throw new DocumentTreeOperationError(
      'NODE_ALREADY_EXISTS',
      `Node ${node.id} already exists in document ${document.id}.`,
    );
  }
  const parent = document.nodes[options.parentId];
  if (!parent) {
    throw new DocumentTreeOperationError(
      'PARENT_NOT_FOUND',
      `Parent node ${options.parentId} does not exist.`,
    );
  }
  if (node.children.length > 0) {
    throw new DocumentTreeOperationError(
      'NON_LEAF_INSERT',
      'Single-node insertion requires a leaf node. Subtree insertion belongs to a dedicated structural operation.',
    );
  }

  const index = normalizeInsertIndex(options.index, parent.children.length);
  const nextChildren = [...parent.children];
  nextChildren.splice(index, 0, node.id);

  const nextDocument: CanonicalDocument = {
    ...document,
    nodes: {
      ...document.nodes,
      [parent.id]: { ...parent, children: nextChildren },
      [node.id]: structuredClone(node),
    },
  };
  assertDocumentTree(nextDocument);
  return nextDocument;
}

export function updateDocumentNode(
  document: CanonicalDocument,
  nodeId: string,
  updater: DocumentNodeUpdater,
): CanonicalDocument {
  assertDocumentTree(document);
  const current = getDocumentNode(document, nodeId);
  const workingCopy = structuredClone(current);
  const updated = updater(workingCopy);

  if (updated.id !== current.id || !childrenEqual(updated.children, current.children)) {
    throw new DocumentTreeOperationError(
      'STRUCTURE_CHANGED_BY_UPDATE',
      'Node update cannot change id or children. Use structural tree operations instead.',
    );
  }

  const nextDocument: CanonicalDocument = {
    ...document,
    nodes: {
      ...document.nodes,
      [nodeId]: structuredClone(updated),
    },
  };
  assertDocumentTree(nextDocument);
  return nextDocument;
}

export function removeDocumentNode(
  document: CanonicalDocument,
  nodeId: string,
): RemoveDocumentNodeResult {
  const index = assertDocumentTree(document);
  if (!document.nodes[nodeId]) {
    throw new DocumentTreeOperationError('NODE_NOT_FOUND', `Node ${nodeId} does not exist.`);
  }
  if (nodeId === document.rootNodeId) {
    throw new DocumentTreeOperationError(
      'ROOT_OPERATION_FORBIDDEN',
      'The document root cannot be removed.',
    );
  }

  const parentId = index.parentByNodeId.get(nodeId);
  if (!parentId) {
    throw new DocumentTreeInvariantError([
      issue('ORPHAN_NODE', `Node ${nodeId} has no parent.`, { nodeId }),
    ]);
  }

  const removedNodeIds = [nodeId, ...getDescendantNodeIds(document, nodeId)];
  const removed = new Set(removedNodeIds);
  const parent = getDocumentNode(document, parentId);
  const nextNodes: Record<string, DocumentNode> = {};

  for (const [currentId, currentNode] of Object.entries(document.nodes)) {
    if (removed.has(currentId)) continue;
    nextNodes[currentId] =
      currentId === parentId
        ? { ...parent, children: parent.children.filter((childId) => childId !== nodeId) }
        : currentNode;
  }

  const nextDocument: CanonicalDocument = {
    ...document,
    nodes: nextNodes,
  };
  assertDocumentTree(nextDocument);
  return { document: nextDocument, removedNodeIds };
}
