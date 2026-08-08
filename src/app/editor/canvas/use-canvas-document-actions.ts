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
  type NodeGeometryPatch,
  type SnapGuide,
} from '../../../core/project';
import { createDocumentCommand } from '../../project/document-command-history';
import { useProjectSession } from '../../project/project-session-context';
import { useEditorWidgetRegistry } from '../../widgets/editor-widget-registry-context';

export interface CanvasGeometryEditResult {
  applied: boolean;
  guides: readonly SnapGuide[];
}

export interface CanvasDocumentActions {
  insertWidget(type: string, parentId?: string, index?: number): string | null;
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

export function useCanvasDocumentActions(): CanvasDocumentActions {
  const session = useProjectSession();
  const widgetRegistry = useEditorWidgetRegistry();
  const activeDocumentId = session.activeDocumentId;
  const activeBreakpointId = session.activeBreakpointId;
  const documents = session.project.documents;
  const executeDocumentCommand = session.executeDocumentCommand;

  const getActiveDocument = useCallback(
    () => documents[activeDocumentId],
    [activeDocumentId, documents],
  );

  const execute = useCallback(
    (label: string, before: CanonicalDocument, after: CanonicalDocument) =>
      executeDocumentCommand(createDocumentCommand(label, before, after)),
    [executeDocumentCommand],
  );

  const insertWidget = useCallback(
    (type: string, parentId?: string, index?: number): string | null => {
      const document = getActiveDocument();
      if (!document || !widgetRegistry.has(type)) return null;
      try {
        const id = createEntityId('node');
        const ordinal = Object.keys(document.nodes).length;
        const definition = widgetRegistry.core.resolve(type);
        const node = widgetRegistry.createNode(type, {
          id,
          name: `${definition.metadata.name} ${ordinal}`,
        });
        const nextDocument = insertDocumentNode(document, node, {
          parentId: parentId ?? document.rootNodeId,
          ...(index === undefined ? {} : { index }),
        });
        return execute(`Insert ${definition.metadata.name}`, document, nextDocument) ? id : null;
      } catch {
        return null;
      }
    },
    [execute, getActiveDocument, widgetRegistry],
  );

  const insertContainer = useCallback(
    (parentId?: string, index?: number): string | null =>
      insertWidget('core/container', parentId, index),
    [insertWidget],
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
      if (!document || !widgetRegistry.has('core/group')) return null;
      try {
        const groupId = createEntityId('node');
        const groupNode = widgetRegistry.createNode('core/group', { id: groupId, name: 'Group' });
        const nextDocument = groupDocumentNodes(document, nodeIds, groupNode);
        return execute('Group nodes', document, nextDocument) ? groupId : null;
      } catch {
        return null;
      }
    },
    [execute, getActiveDocument, widgetRegistry],
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
        const nextDocument = setNodeGeometry(document, nodeId, activeBreakpointId, snapped.patch);
        return {
          applied: execute('Update node geometry', document, nextDocument),
          guides: snapped.guides,
        };
      } catch {
        return { applied: false, guides: [] };
      }
    },
    [activeBreakpointId, execute, getActiveDocument],
  );

  return {
    insertWidget,
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
