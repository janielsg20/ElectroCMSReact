import { useCallback } from 'react';
import {
  createEntityId,
  insertDocumentNode,
  moveDocumentNode,
  type DocumentNode,
} from '../../../core';
import { useProjectSession } from '../../project/project-session-context';

export interface CanvasDocumentActions {
  insertContainer(parentId?: string, index?: number): string | null;
  moveNode(nodeId: string, parentId: string, index?: number): boolean;
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

export function useCanvasDocumentActions(): CanvasDocumentActions {
  const session = useProjectSession();

  const insertContainer = useCallback(
    (parentId?: string, index?: number): string | null => {
      const document = session.project.documents[session.activeDocumentId];
      if (!document) return null;
      const id = createEntityId('node');
      const ordinal = Object.keys(document.nodes).length;
      const nextDocument = insertDocumentNode(document, createContainerNode(id, ordinal), {
        parentId: parentId ?? document.rootNodeId,
        ...(index === undefined ? {} : { index }),
      });
      session.replaceDocument(nextDocument);
      return id;
    },
    [session],
  );

  const moveNode = useCallback(
    (nodeId: string, parentId: string, index?: number): boolean => {
      const document = session.project.documents[session.activeDocumentId];
      if (!document) return false;
      try {
        const nextDocument = moveDocumentNode(document, nodeId, {
          parentId,
          ...(index === undefined ? {} : { index }),
        });
        session.replaceDocument(nextDocument);
        return true;
      } catch {
        return false;
      }
    },
    [session],
  );

  return { insertContainer, moveNode };
}
