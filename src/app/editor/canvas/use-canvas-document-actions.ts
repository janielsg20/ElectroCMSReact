import { useCallback } from 'react';
import { createEntityId } from '../../../core/domain';
import {
  copyDocumentSubtrees,
  cutDocumentSubtrees,
  groupDocumentNodes,
  insertDocumentNode,
  moveDocumentNode,
  pasteDocumentClipboard,
  setDocumentNodesHidden,
  setDocumentNodesLocked,
  setNodeGeometry,
  snapNodeGeometryPatch,
  ungroupDocumentNode,
  type CanonicalDocument,
  type DocumentClipboardPayload,
  type DocumentNode,
  type NodeGeometryPatch,
  type SnapGuide,
} from '../../../core/project';
import { createDocumentCommand } from '../../project/document-command-history';
import { useProjectSession } from '../../project/project-session-context';

export interface CanvasGeometryEditResult {
  applied: boolean;
  guides: readonly SnapGuide[];
}

export interface CanvasDocumentActions {
  insertContainer(parentId?: string, index?: number): string | null;
  moveNode(nodeId: string, parentId: string, index?: number): boolean;
  copyNodes(nodeIds: readonly string[]): DocumentClipboardPayload | null;
  cutNodes(nodeIds: readonly string[]): DocumentClipboardPayload | null;
  pasteClipboard(
    clipboard: DocumentClipboardPayload,
    parentId?: string,
    index?: number,
  ): readonly string[];
  groupNodes(nodeIds: readonly string[]): string | null;
  ungroupNode(groupId: string): boolean;
  setLocked(nodeIds: readonly string[], locked: boolean): boolean;
  setHidden(nodeIds: readonly string[], hidden: boolean): boolean;
  setGeometry(nodeId: string, patch: NodeGeometryPatch, viewportWidth: number): CanvasGeometryEditResult;
}

function createContainerNode(id: string, ordinal: number): DocumentNode {
  return {
    id,
    type: 'core/container',
    version: 1,
    name: `Container ${ordinal}`,
    props: {},
    styles: {},
    children: [],
  };
}

function createGroupNode(id: string): DocumentNode {
  return {
    id,
    type: 'core/group',
    version: 1,
    name: 'Group',
    props: {},
    styles: {},
    children: [],
  };
}

export function useCanvasDocumentActions(): CanvasDocumentActions {
  const session = useProjectSession();
  const getActiveDocument = useCallback(
    () => session.project.documents[session.activeDocumentId],
    [session.activeDocumentId, session.project.documents],
  );

  const execute = useCallback(
    (label: string, before: CanonicalDocument, after: CanonicalDocument) =>
      session.executeDocumentCommand(createDocumentCommand(label, before, after)),
    [session.executeDocumentCommand],
  );

  const insertContainer = useCallback(
    (parentId?: string, index?: number): string | null => {
      const document = getActiveDocument();
      if (!document) return null;
      const id = createEntityId('node');
      const ordinal = Object.keys(document.nodes).length;
      const nextDocument = insertDocumentNode(document, createContainerNode(id, ordinal), {
        parentId: parentId ?? document.rootNodeId,
        ...(index === undefined ? {} : { index }),
      });
      return execute('Insert container', document, nextDocument) ? id : null;
    },
    [execute, getActiveDocument],
  );

  const moveNode = useCallback(
    (nodeId: string, parentId: string, index?: number): boolean => {
      const document = getActiveDocument();
      if (!document) return false;
      try {
        const nextDocument = moveDocumentNode(document, nodeId, {
          parentId,
          ...(index === undefined ? {} : { index }),
        });
        return execute('Move node', document, nextDocument);
      } catch {
        return false;
      }
    },
    [execute, getActiveDocument],
  );

  const copyNodes = useCallback(
    (nodeIds: readonly string[]): DocumentClipboardPayload | null => {
      const document = getActiveDocument();
      if (!document) return null;
      try {
        return copyDocumentSubtrees(document, nodeIds);
      } catch {
        return null;
      }
    },
    [getActiveDocument],
  );

  const cutNodes = useCallback(
    (nodeIds: readonly string[]): DocumentClipboardPayload | null => {
      const document = getActiveDocument();
      if (!document) return null;
      try {
        const cut = cutDocumentSubtrees(document, nodeIds);
        return execute('Cut nodes', document, cut.document) ? cut.clipboard : null;
      } catch {
        return null;
      }
    },
    [execute, getActiveDocument],
  );

  const pasteClipboard = useCallback(
    (
      clipboard: DocumentClipboardPayload,
      parentId?: string,
      index?: number,
    ): readonly string[] => {
      const document = getActiveDocument();
      if (!document) return [];
      try {
        const pasted = pasteDocumentClipboard(
          document,
          clipboard,
          parentId ?? document.rootNodeId,
          () => createEntityId('node'),
          index,
        );
        return execute('Paste nodes', document, pasted.document) ? pasted.pastedRootNodeIds : [];
      } catch {
        return [];
      }
    },
    [execute, getActiveDocument],
  );

  const groupNodes = useCallback(
    (nodeIds: readonly string[]): string | null => {
      const document = getActiveDocument();
      if (!document) return null;
      try {
        const groupId = createEntityId('node');
        const nextDocument = groupDocumentNodes(document, nodeIds, createGroupNode(groupId));
        return execute('Group nodes', document, nextDocument) ? groupId : null;
      } catch {
        return null;
      }
    },
    [execute, getActiveDocument],
  );

  const ungroupNode = useCallback(
    (groupId: string): boolean => {
      const document = getActiveDocument();
      if (!document) return false;
      try {
        return execute('Ungroup nodes', document, ungroupDocumentNode(document, groupId));
      } catch {
        return false;
      }
    },
    [execute, getActiveDocument],
  );

  const setLocked = useCallback(
    (nodeIds: readonly string[], locked: boolean): boolean => {
      const document = getActiveDocument();
      if (!document || nodeIds.length === 0) return false;
      try {
        return execute(
          locked ? 'Lock nodes' : 'Unlock nodes',
          document,
          setDocumentNodesLocked(document, nodeIds, locked),
        );
      } catch {
        return false;
      }
    },
    [execute, getActiveDocument],
  );

  const setHidden = useCallback(
    (nodeIds: readonly string[], hidden: boolean): boolean => {
      const document = getActiveDocument();
      if (!document || nodeIds.length === 0) return false;
      try {
        return execute(
          hidden ? 'Hide nodes' : 'Show nodes',
          document,
          setDocumentNodesHidden(document, nodeIds, hidden),
        );
      } catch {
        return false;
      }
    },
    [execute, getActiveDocument],
  );

  const setGeometry = useCallback(
    (nodeId: string, patch: NodeGeometryPatch, viewportWidth: number): CanvasGeometryEditResult => {
      const document = getActiveDocument();
      if (!document) return { applied: false, guides: [] };
      try {
        const snapped = snapNodeGeometryPatch(patch, viewportWidth);
        const nextDocument = setNodeGeometry(
          document,
          nodeId,
          session.activeBreakpointId,
          snapped.patch,
        );
        return {
          applied: execute('Update node geometry', document, nextDocument),
          guides: snapped.guides,
        };
      } catch {
        return { applied: false, guides: [] };
      }
    },
    [execute, getActiveDocument, session.activeBreakpointId],
  );

  return {
    insertContainer,
    moveNode,
    copyNodes,
    cutNodes,
    pasteClipboard,
    groupNodes,
    ungroupNode,
    setLocked,
    setHidden,
    setGeometry,
  };
}
